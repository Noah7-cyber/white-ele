import { Router } from "express";
import { studentAttendanceRoutes } from "./student-attendance.route";
import { staffAttendanceRoutes } from "./staff-attendance.routes";
import { adminAttendanceRoutes } from "./admin-attendance.routes";

const router = Router();

router.use("/students", studentAttendanceRoutes);
router.use("/staff", staffAttendanceRoutes);
router.use("/admin", adminAttendanceRoutes);

export { router as attendanceRoutes };
export default router;

