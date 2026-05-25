import { Router } from "express";
import { SubjectController } from "../controller/subject.controller";
import { authenticate } from "../../auth/middleware/middleware";
import { createSubjectValidation, getSubjectsValidation, updateSubjectValidation } from "../validations/subject.validation";
import { handleValidationErrors } from "../../shared/middleware/validation";

const router = Router();
const controller = new SubjectController();

// Create Subjects
router.post(
    "/",
    authenticate,
    createSubjectValidation,
    handleValidationErrors,
    controller.createSubject.bind(controller) as any
);

// Get Subjects (with filters)
router.get(
    "/",
    authenticate,
    getSubjectsValidation,
    handleValidationErrors,
    controller.getSubjects.bind(controller) as any
);

// Get Single Subject
router.get(
    "/:id",
    authenticate,
    controller.getSubjectById.bind(controller) as any
);

// Update Subject
router.put(
    "/:id",
    authenticate,
    updateSubjectValidation,
    handleValidationErrors,
    controller.updateSubject.bind(controller) as any
);

// Delete Subject
router.delete(
    "/:id",
    authenticate,
    controller.deleteSubject.bind(controller) as any
);

export const subjectRoutes = router;
