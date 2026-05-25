import { Router } from "express";
import { classroomActivityController } from "../controllers/classroom-activity.controller";
import {
  validateCreateActivity,
  validateDeleteActivity,
  validateListActivities,
  validateActivityId,
  validateUpdateActivity,
} from "../validation/classroom-activity.validation";
import { authenticate } from "../../auth";
import { handleValidationErrors } from "../../shared/middleware/validation";
import { requirePermission } from "../../shared/middleware/rbac.middleware";
import { Resources, Action } from "../../auth/constants/role-permissions";

const router = Router();

/**
 * @route GET /activities
 * @desc List classroom activities with optional filters (supports all activity types). Query: teacherId limits to classrooms assigned via staffClassesAndSubject.
 * @access Authenticated
 */
router.get(
  "/",
  authenticate,
  validateListActivities,
  handleValidationErrors,
  (req: any, res: any) => classroomActivityController.listActivities(req, res)
);

/**
 * @route POST /activities
 * @desc Create a new classroom activity (supports all activity types: MEAL, NAP, MEDICATION, BATHROOM, WATER, OTHER)
 * @access Staff/Admin/Super Admin only
 */
router.post(
  "/",
  authenticate,
  requirePermission({ resource: Resources.CLASSROOM_ACTIVITY, action: Action.CREATE }),
  validateCreateActivity,
  handleValidationErrors,
  (req: any, res: any) => classroomActivityController.createActivity(req, res)
);

/**
 * @route GET /activities/:id
 * @desc Fetch a classroom activity by ID
 * @access Authenticated
 */
router.get(
  "/:id",
  authenticate,
  validateActivityId,
  handleValidationErrors,
  (req: any, res: any) => classroomActivityController.getActivityById(req, res)
);

/**
 * @route PUT /activities/:id
 * @desc Update an existing classroom activity
 * @access Staff/Admin/Super Admin only
 */
router.put(
  "/:id",
  authenticate,
  requirePermission({ resource: Resources.CLASSROOM_ACTIVITY, action: Action.UPDATE }),
  validateUpdateActivity,
  handleValidationErrors,
  (req: any, res: any) => classroomActivityController.updateActivity(req, res)
);

/**
 * @route DELETE /activities/:id
 * @desc Delete a classroom activity
 * @access Admin/Super Admin only
 */
router.delete(
  "/:id",
  authenticate,
  requirePermission({ resource: Resources.CLASSROOM_ACTIVITY, action: Action.DELETE }),
  validateDeleteActivity,
  handleValidationErrors,
  (req: any, res: any) => classroomActivityController.deleteActivity(req, res)
);

export { router as classroomActivityRoutes };
export default router;
