import { Router } from "express";
import { authenticate } from "../../auth/middleware/middleware";
import { portfolioController } from "../controller/portfolio.controller";
import {
    createPortfolioValidation,
    getPortfolioValidation,
    getPortfolioByIdValidation,
    addPortfolioSectionValidation,
    patchPortfolioStatusValidation,
    updatePortfolioValidation,
    updatePortfolioSectionValidation,
    deletePortfolioSectionValidation,
    getStudentGradesValidation
} from "../validations/portfolio.validation";
import { handleValidationErrors } from "../../shared/middleware/validation";

const router = Router();

router.use(authenticate);

router.post(
    "/",
    createPortfolioValidation,
    handleValidationErrors,
    portfolioController.createEntry.bind(portfolioController) as any
);

router.post(
    "/section",
    addPortfolioSectionValidation,
    handleValidationErrors,
    portfolioController.addPortfolioSection.bind(portfolioController) as any
);

router.get(
    "/",
    getPortfolioValidation,
    handleValidationErrors,
    portfolioController.getPortfolio.bind(portfolioController) as any
);

router.get(
    "/grades",
    getStudentGradesValidation,
    handleValidationErrors,
    portfolioController.getStudentGrades.bind(portfolioController) as any
);

router.get(
    "/:id",
    getPortfolioByIdValidation,
    handleValidationErrors,
    portfolioController.getPortfolioById.bind(portfolioController) as any
);

router.put(
    "/:id",
    updatePortfolioValidation,
    handleValidationErrors,
    portfolioController.updateEntry.bind(portfolioController) as any
);

router.patch(
    "/:id",
    patchPortfolioStatusValidation,
    handleValidationErrors,
    portfolioController.patchStatus.bind(portfolioController) as any
);

router.put(
    "/section/:id",
    updatePortfolioSectionValidation,
    handleValidationErrors,
    portfolioController.updateSection.bind(portfolioController) as any
);

router.delete(
    "/section/:id",
    deletePortfolioSectionValidation,
    handleValidationErrors,
    portfolioController.deleteSection.bind(portfolioController) as any
);

router.delete(
    "/:id",
    portfolioController.deleteEntry.bind(portfolioController) as any
);

export { router as portfolioRoutes };
export default router;
