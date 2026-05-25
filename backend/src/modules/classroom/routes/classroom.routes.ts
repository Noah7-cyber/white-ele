import { Router } from "express";
import { classroomController } from "../controllers/classroom.controller";
import { validateCreateClassroom, validateDeleteClassroom, validateGetClassroom, validateGetClassrooms, validateUpdateClassroom, validateAssignClassroom, validateAssignStaffToClassroom, validateUpdateStaffAssignment, validateReassignClassroomStaff } from "../validation/classroom.validation";
import { authenticate } from "../../auth";
import { handleValidationErrors } from "../../shared/middleware/validation";
import { requirePermission } from "../../shared/middleware/rbac.middleware";
import { Resources, Action } from "../../auth/constants/role-permissions";

const router = Router()

/**
 * @route GET /classroom
 * @desc List classrooms with pagination and filters
 * @access Authenticated users (Admin/Super Admin)
 */
router.get(
  "/",
  authenticate,
  validateGetClassrooms,
  handleValidationErrors,
  (req: any, res: any) => classroomController.listClassroom(req, res)
);


/**
 * @route POST /classroom
 * @desc Create a new classroom
 * @access Admin/Super Admin only
 */
router.post("/",
  authenticate,
  requirePermission({ resource: Resources.CLASSROOM, action: Action.CREATE }),
  validateCreateClassroom,
  handleValidationErrors,
  (req: any, res: any) =>
    classroomController.createClassroom(req, res)
);

/**
 * @route POST /classroom/assign
 * @desc Assign a student to a classroom
 * @access Admin/Super Admin only
 */
router.post(
  "/assign",
  authenticate,
  requirePermission({ resource: Resources.CLASSROOM, action: Action.UPDATE }),
  validateAssignClassroom,
  handleValidationErrors,
  (req: any, res: any) => classroomController.assignClassroom(req, res)
);

/**
 * @route POST /classroom/assign-staff
 * @desc Assign staff/teachers to a classroom
 * @access Admin/Super Admin only
 */
router.post(
  "/assign-staff",
  authenticate,
  requirePermission({ resource: Resources.CLASSROOM, action: Action.UPDATE }),
  validateAssignStaffToClassroom,
  handleValidationErrors,
  (req: any, res: any) => classroomController.assignStaffToClassroom(req, res)
);

/**
 * @route PUT /classroom/update-staff-assignment
 * @desc Update staff assignment - move staff from one classroom to another
 * @access Admin/Super Admin only
 */
router.put(
  "/update-staff-assignment",
  authenticate,
  requirePermission({ resource: Resources.CLASSROOM, action: Action.UPDATE }),
  validateUpdateStaffAssignment,
  handleValidationErrors,
  (req: any, res: any) => classroomController.updateStaffAssignment(req, res)
);

/**
 * @route PUT /classroom/reassign-staff
 * @desc Reassign classroom staff - clear all existing assignments and assign new ones
 * @access Admin/Super Admin only
 */
router.put(
  "/reassign-staff",
  authenticate,
  requirePermission({ resource: Resources.CLASSROOM, action: Action.UPDATE }),
  validateReassignClassroomStaff,
  handleValidationErrors,
  (req: any, res: any) => classroomController.reassignClassroomStaff(req, res)
);

/**
 * @route PUT /classroom/:id
 * @desc Update an existing classroom
 * @access Admin/Super Admin only
 */
router.put(
  "/:id",
  authenticate,
  requirePermission({ resource: Resources.CLASSROOM, action: Action.UPDATE }),
  validateUpdateClassroom,
  handleValidationErrors,
  (req: any, res: any) => classroomController.updateClassroom(req, res)
);

/**
 * @route GET /classroom/:id
 * @desc Get classroom by ID
 * @access Admin/Super Admin only, or Teachers viewing their own details
 */
router.get("/:id", authenticate, validateGetClassroom, handleValidationErrors, (req: any, res: any) => {
  classroomController.getClassroomById(req, res);
});

/**
 * @route DELETE /classroom/:id
 * @desc Soft delete a classroom
 * @access Admin/Super Admin only
 */

router.delete(
  "/:id",
  authenticate,
  requirePermission({ resource: Resources.CLASSROOM, action: Action.DELETE }),
  validateDeleteClassroom,
  handleValidationErrors,
  (req: any, res: any) => classroomController.validateDeleteClassroom(req, res)
);


export { router as classroomRoutes }

export default router;