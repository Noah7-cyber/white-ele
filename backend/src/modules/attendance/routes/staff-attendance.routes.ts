import { Router } from "express";
import { authenticate } from "../../auth";
import { handleValidationErrors } from "../../shared/middleware/validation";
import { staffAttendanceController } from "../controllers/staff-attendance.controller"; 
import {
  validateStaffAttendanceId,
  validateStaffAttendanceQuery,
  validateStaffAttendanceSummaryQuery,
  validateClockInStaff,
  validateClockOutStaff,
  validateCreateStaffAttendance,
  validateUpdateStaffAttendance
} from "../validations/staff-attendance.validation";

const router = Router();


router.post(
  "/clock-in",
  authenticate,
  validateClockInStaff,
  handleValidationErrors,
  (req: any, res: any) => staffAttendanceController.clockIn(req, res)
);

router.post(
  "/clock-out",
  authenticate,
  validateClockOutStaff,
  handleValidationErrors,
  (req: any, res: any) => staffAttendanceController.clockOut(req, res)
);

router.post(
  "/",
  authenticate,
  validateCreateStaffAttendance,  
  handleValidationErrors,
  (req: any, res: any) => staffAttendanceController.recordAttendance(req, res)
);

router.put(
  "/:id",
  authenticate,
  validateUpdateStaffAttendance,
  handleValidationErrors,
  (req: any, res: any) => staffAttendanceController.updateAttendance(req, res)
);

router.get(
  "/",
  authenticate,
  validateStaffAttendanceQuery,
  handleValidationErrors,
  (req: any, res: any) => staffAttendanceController.listAttendance(req, res)
);


router.get(
  "/summary",
  authenticate,
  ...validateStaffAttendanceSummaryQuery,
  handleValidationErrors,
  (req: any, res: any) => staffAttendanceController.getAttendanceSummary(req, res)
)

router.get(
  "/:id",
  authenticate,
  validateStaffAttendanceId,
  handleValidationErrors,
  (req: any, res: any) => staffAttendanceController.getAttendanceById(req, res)
);

router.delete(
  "/:id",
  authenticate,
  validateStaffAttendanceId,
  handleValidationErrors,
  (req: any, res: any) => staffAttendanceController.deleteAttendance(req, res)
);



export { router as staffAttendanceRoutes };
export default router;

