import { Router } from "express";
import { ParentController } from "../controllers/parent.controller";
import { createParentsValidation, updateParentValidation, getAllParentsValidation, updateParentStatusValidation } from "../validation/parent.validation";
import { authenticate, AuthenticatedRequest } from "../../auth/middleware/middleware";
import { requirePermission } from "../../shared/middleware/rbac.middleware";
import { Resources, Action } from "../../auth/constants/role-permissions";
import { UserRole } from "../../shared/entities/EntityEnums";
import { handleValidationErrors } from "../../shared";

const router = Router();
const parentController = new ParentController();

/**
 * @route POST /parents/kiosk-verify
 * @desc Verify parent by ID/username/email and PIN (for kiosk access)
 * @access Public (no authentication required for kiosk)
 */
router.post(
  "/kiosk-verify",
  (req: any, res: any) => parentController.kioskVerify(req, res)
);

router.use(authenticate)

/**
 * @route POST /parents
 * @desc Create a new parent
 * @access Admin/Super Admin only
 */
router.post(
  "/",
  requirePermission({ resource: Resources.PARENT, action: Action.CREATE }),
  ...createParentsValidation,
  (req: any, res: any) => parentController.createParent(req, res)
);

/**
 * @route GET /parents
 * @desc Get all parents
 * @access Admin/Super Admin only
 */
router.get(
  "/",
  getAllParentsValidation,
  handleValidationErrors,
  (req: any, res: any) => parentController.getAllParents(req, res)
);

/**
 * @route GET /parents/metrics
 * @desc Get parent metrics (total parents, parents with multiple children, active parents)
 * @access Admin/Super Admin only
 */
router.get(
  "/metrics",
  requirePermission({ resource: Resources.PARENT, action: Action.VIEW }),
  (req: any, res: any) => parentController.getMetrics(req, res)
);

/**
 * @route POST /parents/resend
 * @desc Resend parent welcome email with password reset link
 * @access Admin/Super Admin only
 */
router.post(
  "/resend",
  requirePermission({ resource: Resources.PARENT, action: Action.CREATE }),
  (req: any, res: any) => parentController.resendParentEmail(req, res)
);

/**
 * @route GET /parents/image-gallery
 * @desc Get parent-scoped child image gallery
 * @access Parent only
 */
router.get(
  "/image-gallery",
  requirePermission({
    resource: Resources.PARENT,
    action: Action.VIEW,
    customCheckOverrides: true,
    customCheck: (req: AuthenticatedRequest) => req.user?.role === UserRole.PARENT,
  }),
  (req: any, res: any) => parentController.getImageGallery(req, res)
);

/**
 * @route GET /parents/:id
 * @desc Get parent by ID
 * @access Authenticated
 */
router.get(
  "/:id",
  parentController.getParentById.bind(parentController)
);

/**
 * @route PUT /parents/:id
 * @desc Update parent details
 * @access Admin/Super Admin or Parent (own record only)
 */
router.put(
  "/:id",
  requirePermission({
    resource: Resources.PARENT,
    action: Action.UPDATE,
    customCheckOverrides: true,
    customCheck: (req: AuthenticatedRequest) => {
      // Allow Admin/Super Admin
      if (req.user?.role === UserRole.ADMIN || req.user?.role === UserRole.SUPER_ADMIN) {
        return true;
      }
      // Allow parent updating their own record
      if (req.user?.role === UserRole.PARENT && req?.user?.parent) {
        const parentIdParam = req.params['id'];
        if (!parentIdParam) return false;
        const parentId = parseInt(parentIdParam, 10);
        if (isNaN(parentId)) return false;
        
        // Check if the parentId in URL matches any of the user's parent records
        return Array.isArray(req.user.parent) 
          ? req.user.parent.some((p: any) => p.id === parentId)
          : req.user.parent['id'] === parentId;
      }
      return false;
    }
  }),
  ...updateParentValidation,
  (req: any, res: any) => parentController.updateParent(req, res)
);

/**
 * @route PATCH /parents/:id/status
 * @desc Update parent status
 * @access Admin/Super Admin only
 */
router.patch(
  "/:id/status",
  requirePermission({
    resource: Resources.PARENT,
    action: Action.UPDATE,
    customCheckOverrides: true,
    customCheck: (req: AuthenticatedRequest) => req.user?.role === UserRole.ADMIN,
  }),
  ...updateParentStatusValidation,
  handleValidationErrors,
  (req: any, res: any) => parentController.updateParentStatus(req, res)
);

/**
 * @route DELETE /parents/:id
 * @desc Soft delete a parent (scoped to admin's school)
 * @access Admin/Super Admin only
 */
router.delete(
  "/:id",
  requirePermission({ resource: Resources.PARENT, action: Action.DELETE }),
  (req: any, res: any) => parentController.deleteParent(req, res)
);


export default router;
