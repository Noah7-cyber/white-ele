import { Router } from "express";
import { authenticate } from "../../auth";
import { handleValidationErrors } from "../../shared/middleware/validation";
import { adminAttendanceController } from "../controllers/admin-attendance.controller";
import {
  validateAdminAttendanceId,
  validateAdminAttendanceQuery,
  validateAdminAttendanceSummaryQuery,
  validateClockInAdmin,
  validateClockOutAdmin,
  validateCreateAdminAttendance,
  validateUpdateAdminAttendance,
} from "../validations/admin-attendance.validation";

const router = Router();

router.post(
  "/clock-in",
  authenticate,
  validateClockInAdmin,
  handleValidationErrors,
  (req: any, res: any) => adminAttendanceController.clockIn(req, res),
);

router.post(
  "/clock-out",
  authenticate,
  validateClockOutAdmin,
  handleValidationErrors,
  (req: any, res: any) => adminAttendanceController.clockOut(req, res),
);

router.post(
  "/",
  authenticate,
  validateCreateAdminAttendance,
  handleValidationErrors,
  (req: any, res: any) => adminAttendanceController.recordAttendance(req, res),
);

router.put(
  "/:id",
  authenticate,
  validateUpdateAdminAttendance,
  handleValidationErrors,
  (req: any, res: any) => adminAttendanceController.updateAttendance(req, res),
);

router.get(
  "/",
  authenticate,
  validateAdminAttendanceQuery,
  handleValidationErrors,
  (req: any, res: any) => adminAttendanceController.listAttendance(req, res),
);

router.get(
  "/summary",
  authenticate,
  ...validateAdminAttendanceSummaryQuery,
  handleValidationErrors,
  (req: any, res: any) => adminAttendanceController.getAttendanceSummary(req, res),
);

router.get(
  "/:id",
  authenticate,
  validateAdminAttendanceId,
  handleValidationErrors,
  (req: any, res: any) => adminAttendanceController.getAttendanceById(req, res),
);

router.delete(
  "/:id",
  authenticate,
  validateAdminAttendanceId,
  handleValidationErrors,
  (req: any, res: any) => adminAttendanceController.deleteAttendance(req, res),
);

export { router as adminAttendanceRoutes };
export default router;
