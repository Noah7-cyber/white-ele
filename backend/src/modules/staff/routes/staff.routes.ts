import { Router } from "express";
import { staffController } from "../controllers/staff.controller";
import { validateStaffId, validateCreateStaff, validateUpdateStaff, validateUpdateStaffStatus } from "../validation/staff.validation";
import { authenticate } from "../../auth/middleware/middleware";
import { handleValidationErrors } from "../../shared/middleware/validation";
import { requirePermission } from "../../shared/middleware/rbac.middleware";
import { Resources, Action } from "../../auth/constants/role-permissions";
import { UserRole } from "../../shared/entities/EntityEnums";
import { AuthenticatedRequest } from "../../auth/middleware/middleware";


const router = Router();

/**
 * @route POST /staff/kiosk-verify
 * @desc Verify staff by ID/email and PIN (for kiosk access)
 * @access Public (no authentication required for kiosk)
 */
router.post(
  "/kiosk-verify",
  (req: any, res: any) => staffController.kioskVerify(req, res)
);

/**
 * @route POST /staff
 * @desc Create a new staff
 * @access Admin/Super Admin only
 */
router.post("/", authenticate, requirePermission({ resource: Resources.STAFF, action: Action.CREATE }), validateCreateStaff, handleValidationErrors, (req: any, res: any) => staffController.createStaff(req, res));

/**
 * @route GET /staff
 * @desc List staff with filtering, search, and pagination
 * @access Admin/Super Admin only
 */
router.get("/", authenticate, requirePermission({ resource: Resources.STAFF, action: Action.VIEW }), (req: any, res: any) => {
  staffController.listStaff(req, res);
});

/**
 * @route POST /staff/:id/resend-invite
 * @desc Regenerate credentials and resend onboarding email (pending system-password users only)
 * @access Admin with staff update permission
 */
router.post(
  "/:id/resend-invite",
  authenticate,
  requirePermission({ resource: Resources.STAFF, action: Action.UPDATE }),
  validateStaffId,
  handleValidationErrors,
  (req: any, res: any) => staffController.resendStaffInvite(req, res)
);

/**
 * @route GET /staff/:id
 * @desc Get staff by ID
 * @access Admin/Super Admin only, or staff viewing their own details
 */
router.get("/:id", authenticate, validateStaffId, handleValidationErrors, (req: any, res: any) => {
  staffController.getStaffById(req, res);
});

/**
 * @route PUT /staff/:id
 * @desc Update staff details
 * @access Admin/Super Admin, or Staff updating their own record
 */
router.put("/:id", authenticate, requirePermission({
  resource: Resources.STAFF,
  action: Action.UPDATE,
  customCheckOverrides: true,
  customCheck: async (req: AuthenticatedRequest) => {
    console.log(`[STAFF-ROUTE] customCheck: role=${req.user?.role}, staffData=${JSON.stringify(req.user?.staff)}`);
    // Allow admins and super admins (they already have permission)
    if (req.user?.role === UserRole.ADMIN || req.user?.role === UserRole.SUPER_ADMIN) {
      return true;
    }
    // Allow staff to update their own record
    if (req.user?.role === UserRole.STAFF && req.user.staff) {
      const staffIdParam = req.params["id"];
      console.log(`[STAFF-ROUTE] staffIdParam=${staffIdParam}`);
      if (staffIdParam) {
        const staffId = parseInt(staffIdParam, 10);
        if (isNaN(staffId)) return false;

        // Check if the staffId in URL matches any of the user's staff IDs
        const isMatch = Array.isArray(req.user.staff)
          ? req.user.staff.some((staff: any) => staff.id === staffId)
          : (req.user.staff as any).id === staffId;

        console.log(`[STAFF-ROUTE] isMatch=${isMatch} (comparing with ID ${staffId})`);
        return isMatch;
      }
    }
    return false;
  }
}), validateUpdateStaff, handleValidationErrors, (req: any, res: any) => {
  staffController.updateStaff(req, res);
});

/**
 * @route PATCH /staff/:id
 * @desc Suspend staff or Active Staff (changing status to suspended or active)
 * @access Super Admin only
 */

router.patch(
  "/:id",
  authenticate,
  requirePermission({ resource: Resources.STAFF, action: Action.UPDATE }),
  validateUpdateStaffStatus,
  handleValidationErrors,
  (req: any, res: any) => staffController.suspendStaff(req, res));


/**
 * @route DELETE /staff/:id
 * @desc Delete staff (delete)
 * @access Super Admin only
 */
router.delete("/:id", authenticate, requirePermission({ resource: Resources.STAFF, action: Action.DELETE }), validateStaffId, handleValidationErrors, (req: any, res: any) => staffController.deleteStaff(req, res));

export { router as staffRoutes };
export default router;
