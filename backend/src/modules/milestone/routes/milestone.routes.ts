import { Router } from "express";
import { authenticate } from "../../auth/middleware/middleware";
import { MilestoneController } from "../controllers/milestone.controllers";
import {
  createMilestoneValidation,
  listMilestonesValidation,
  milestoneIdValidation,
  updateMilestoneValidation,
  addMilestoneFromLibraryValidation,
} from "../validations/milestone.validation";
import { handleValidationErrors } from "../../shared/middleware/validation";

const router = Router();
const milestoneController = new MilestoneController();

router.use(authenticate);

router.post(
  "/",
  ...createMilestoneValidation,
  milestoneController.createMilestone.bind(milestoneController) as any
);

router.post(
  "/from-library",
  ...addMilestoneFromLibraryValidation,
  handleValidationErrors,
  milestoneController.addMilestoneFromLibrary.bind(milestoneController) as any
);

router.get(
  "/",
  ...listMilestonesValidation,
  milestoneController.listMilestones.bind(milestoneController) as any
);

router.get(
  "/:id",
  ...milestoneIdValidation,
  milestoneController.getMilestoneById.bind(milestoneController) as any
);

router.put(
  "/:id",
  ...updateMilestoneValidation,
  milestoneController.updateMilestone.bind(milestoneController) as any
);

router.delete(
  "/:id",
  ...milestoneIdValidation,
  milestoneController.deleteMilestone.bind(milestoneController) as any
);

export { router as milestoneRoutes };
export default router;
