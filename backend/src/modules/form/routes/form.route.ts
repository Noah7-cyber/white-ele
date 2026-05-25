import { Router } from "express";
import { handleValidationErrors } from "../../shared/middleware/validation";
import { FormController } from "../controllers/form.controller";
import {
    createFormValidation,
    updateFormValidation,
    getFormsValidation,
    submitResponseValidation,
    updateFormResponseStatusValidation,
    getFormResponseByIdValidation,
} from "../validation/form.validation";
import { authenticate } from "../../auth/middleware/middleware";

const router = Router();
const formController = new FormController();

// Public routes (no authentication required)
router.get("/:slug", (req: any, res: any) => formController.getFormBySlug(req, res));
router.post("/:id/respond", ...submitResponseValidation, handleValidationErrors, (req: any, res: any) => formController.submitResponse(req, res));

// Protected routes (authentication required)
router.use(authenticate);

router.patch(
    "/responses/:responseId",
    ...updateFormResponseStatusValidation,
    handleValidationErrors,
    (req: any, res: any) => formController.updateFormResponseStatus(req, res)
);

router.get(
    "/responses/:responseId",
    ...getFormResponseByIdValidation,
    handleValidationErrors,
    (req: any, res: any) => formController.getFormResponseById(req, res)
);

// Forms — items: PUT /:id with body.items or body.questions
router.post("/", ...createFormValidation, handleValidationErrors, (req: any, res: any) => formController.createForm(req, res));
router.get("/", ...getFormsValidation, handleValidationErrors, (req: any, res: any) => formController.getForms(req, res));
router.get("/:id", (req: any, res: any) => formController.getFormById(req, res));
router.put("/:id", ...updateFormValidation, handleValidationErrors, (req: any, res: any) => formController.updateForm(req, res));
router.delete("/:id", (req: any, res: any) => formController.deleteForm(req, res));

export default router;
