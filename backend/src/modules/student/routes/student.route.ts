import { Router } from "express";
import { StudentController } from "../controllers/student.controller";
import { createStudentValidation, getAllStudentsValidation, studentIdValidation, updateStudentStatusValidation } from "../validation/student.validation";
import { authenticate } from "../../auth/middleware/middleware";
import { requirePermission } from "../../shared/middleware/rbac.middleware";
import { Resources, Action } from "../../auth/constants/role-permissions";
import { handleValidationErrors } from "../../shared";

const router = Router();
const studentController = new StudentController();

// All student routes require authentication
router.use(authenticate);

// --- ROOT ROUTES (/) ---

/**
 * @route POST /students
 * @desc Create a new student
 * @access Admin/Super Admin only
 */
router.post(   
  "/",
  requirePermission({ resource: Resources.STUDENT, action: Action.CREATE }),
  ...createStudentValidation,
  handleValidationErrors,
(req: any, res: any) => studentController.createStudent(req, res)
);

/**
 * @route GET /students
 * @desc Get all students
 * @access Admin/Super Admin/Staff (with READ permission)
 */
router.get(
  "/",
  requirePermission({ resource: Resources.STUDENT, action: Action.VIEW }),
  ...getAllStudentsValidation,
  studentController.getAllStudents.bind(studentController)
);

// --- PARAMETERIZED ROUTES (/:id) ---

/**
 * @route GET /students/:id   
 * @desc Get student by ID
 * @access Authenticated (with READ permission)
 */
router.get(
  "/:id",
  requirePermission({ resource: Resources.STUDENT, action: Action.VIEW }),
  studentController.getStudentById.bind(studentController)
);

/**
 * @route PUT /students/:id
 * @desc Update student details
 * @access Admin/Super Admin only
 */
router.put(
  "/:id",
  requirePermission({ resource: Resources.STUDENT, action: Action.UPDATE }),
  studentController.updateStudent.bind(studentController)
);

/**
 * @route PATCH /students/:id/status
 * @desc Update student status (active/inactive/suspended/expelled)
 * @access Admin/Super Admin only
 */
router.patch(
  "/:id/status",
  requirePermission({ resource: Resources.STUDENT, action: Action.UPDATE }),
  ...updateStudentStatusValidation,
  (req: any, res: any) => studentController.updateStudentStatus(req, res)
);

/**
 * @route DELETE /students/:id
 * @desc Delete a student
 * @access Admin/Super Admin only
 */
router.delete(
  "/:id",
  requirePermission({ resource: Resources.STUDENT, action: Action.DELETE }),
  ...studentIdValidation,
  handleValidationErrors,
  (req: any, res: any) => studentController.deleteStudent(req, res)
);

export default router;