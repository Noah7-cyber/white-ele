import { Router } from "express";
import { adminController } from "../controllers/admin.controller";
import { authenticate } from "../../auth/middleware/middleware";
import { handleValidationErrors } from "../../shared/middleware/validation";
import {
  validateKioskVerifyAdmin,
  validateSetAdminPin,
  validateListAdminsQuery,
} from "../validation/admin.validation";

const router = Router();

/**
 * @route POST /admins/kiosk-verify
 * @desc Verify admin by ID/email and PIN (for kiosk access)
 * @access Public (school-scoped via subdomain or X-School-ID header)
 */
router.post(
  "/kiosk-verify",
  validateKioskVerifyAdmin,
  handleValidationErrors,
  (req: any, res: any) => adminController.kioskVerify(req, res),
);

/**
 * @route GET /admins
 * @desc List all admins for the requester's school
 * @access Authenticated admin/super_admin only
 */
router.get(
  "/",
  authenticate,
  validateListAdminsQuery,
  handleValidationErrors,
  (req: any, res: any) => adminController.listAdmins(req, res),
);

/**
 * @route PUT /admins/:id/pin
 * @desc Set or update an admin's kiosk PIN
 * @access Authenticated admin/super_admin only
 */
router.put(
  "/:id/pin",
  authenticate,
  validateSetAdminPin,
  handleValidationErrors,
  (req: any, res: any) => adminController.setPin(req, res),
);

export { router as adminRoutes };
export default router;
