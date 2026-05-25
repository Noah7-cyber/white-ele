import { Router } from "express";
import { AssessmentController } from "../controller/assessment.controller";
import { authenticate } from "../../auth/middleware/middleware";
import { createAssessmentSchema, recordAssessmentScore, updateAssessmentSchema } from "../validations/assessment.validation";

const router = Router();
const assessmentController = new AssessmentController();

router.use(authenticate);

router.post(
    "/",
    ...createAssessmentSchema,
    assessmentController.createAssessment.bind(assessmentController) as any
);

router.get(
    "/",
    assessmentController.ListAssessments.bind(assessmentController) as any
);

router.put(
    "/record-score",
    ...recordAssessmentScore,
    assessmentController.recordAssessmentScore.bind(assessmentController) as any
);

router.get(
    "/:id",
    assessmentController.getAssessmentById.bind(assessmentController) as any
);

router.put(
    "/:id",
    ...updateAssessmentSchema,
    assessmentController.updateAssessment.bind(assessmentController) as any
);

router.delete(
    "/:id",
    assessmentController.deleteAssessment.bind(assessmentController) as any
);

export { router as assessmentRoutes };
export default router;
