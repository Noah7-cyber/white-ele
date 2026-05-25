import { Router } from "express";
import { authenticate } from "../../auth";
import { handleValidationErrors } from "../../shared/middleware/validation";
import { studentAttendanceController } from "../controllers/student-attendance.controller";
import {
  validateStudentAttendanceId,
  validateStudentAttendanceQuery,
  validateStudentAttendanceSummaryQuery,
  validateClockInStudent,
  validateClockOutStudent,
  validateUpdateStudentAttendance,
} from "../validations/student-attendance.validation";

const router = Router();


router.post(
  "/clock-in",
  authenticate,
  validateClockInStudent,
  handleValidationErrors,
  (req: any, res: any) => studentAttendanceController.clockIn(req, res)
);

router.post(
  "/clock-out",
  authenticate,
  validateClockOutStudent,
  handleValidationErrors,
  (req: any, res: any) => studentAttendanceController.clockOut(req, res)
);
router.post(
  "/",
  authenticate, 
  handleValidationErrors,
  (req: any, res: any) => studentAttendanceController.recordAttendance(req, res)
);


router.put(
  "/:id",
  authenticate,
  validateUpdateStudentAttendance,
  handleValidationErrors,
  (req: any, res: any) => studentAttendanceController.updateAttendance(req as any, res)
);

router.get(
  "/",
  authenticate,
  validateStudentAttendanceQuery,
  handleValidationErrors,
  (req: any, res: any) =>  studentAttendanceController.listAttendance(req, res)
);

router.get(
  "/summary",
  authenticate,
  ...validateStudentAttendanceSummaryQuery,
  handleValidationErrors,
  (req: any, res: any) => studentAttendanceController.getAttendanceSummary(req, res)
)

router.get(
  "/:id",
  authenticate,
  validateStudentAttendanceId,
  handleValidationErrors,
  (req: any, res: any) => studentAttendanceController.getAttendanceById(req, res)
);


router.get(
  "/filter",
  authenticate,
  validateStudentAttendanceQuery,
  handleValidationErrors,
  (req: any, res: any) => studentAttendanceController.filterAttendance(req, res)
);

router.delete(
  "/:id",
  authenticate,
  validateStudentAttendanceId,
  handleValidationErrors,
  (req: any, res: any) => studentAttendanceController.deleteAttendance(req as any, res)
);



export { router as studentAttendanceRoutes };
export default router;

