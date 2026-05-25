import { Router } from "express";
import { authenticate } from "../../auth";
import { handleValidationErrors } from "../../shared/middleware/validation";
import { schoolController } from "../controllers/school.controller";
import {
  validateCreateSchool,
  validateDeleteSchool,
  validateGetSchool,
  validateGetSchools,
  validateUpdateSchool,
} from "../validations/school.validation";
import { requirePermission } from "../../shared/middleware/rbac.middleware";
import { Resources, Action } from "../../auth/constants/role-permissions";

const router = Router();

router.get(
  "/",
  authenticate,
  validateGetSchools,
  handleValidationErrors,
  (req: any, res: any) => schoolController.listSchools(req, res)
);

router.post(
  "/",
  authenticate,
  requirePermission({ resource: Resources.SCHOOL, action: Action.CREATE }),
  validateCreateSchool,
  handleValidationErrors,
  (req: any, res: any) => schoolController.createSchool(req, res)
);

router.get(
  "/getSchool",
  authenticate,
  handleValidationErrors,
  (req: any, res: any) => schoolController.getSchool(req, res)
);

router.get(
  "/:id",
  authenticate,
  validateGetSchool,
  handleValidationErrors,
  (req: any, res: any) => schoolController.getSchoolById(req, res)
);


router.put(
  "/:id",
  authenticate,
  requirePermission({ resource: Resources.SCHOOL, action: Action.UPDATE }),
  validateUpdateSchool,
  handleValidationErrors,
  (req: any, res: any) => schoolController.updateSchool(req, res)
);

router.delete(
  "/:id",
  authenticate,
  requirePermission({ resource: Resources.SCHOOL, action: Action.DELETE }),
  validateDeleteSchool,
  handleValidationErrors,
  (req: any, res: any) => schoolController.deleteSchool(req, res)
);

router.get(
  "/:schoolId/settings/notifications",
  authenticate,
  (req: any, res: any) => schoolController.getNotificationSettings(req, res)
);

router.put(
  "/:schoolId/settings/notifications",
  authenticate,
  requirePermission({ resource: Resources.SCHOOL, action: Action.UPDATE }),
  (req: any, res: any) => schoolController.updateNotificationSettings(req, res)
);

export { router as schoolRoutes };
export default router;
