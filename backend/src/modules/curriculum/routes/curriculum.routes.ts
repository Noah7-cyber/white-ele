import { Router } from "express";
import { curriculumController } from "../controller/curriculum.controller";
import {
    createCurriculumValidation,
    updateCurriculumValidation,
    getCurriculumByIdValidation,
    deleteCurriculumValidation,
    getAllCurriculumsValidation,
} from "../validation/curriculum.validation";
import { authenticate } from "../../auth";
import { handleValidationErrors } from "../../shared/middleware/validation";

const router = Router();

/**
 * @route GET /curriculums
 * @desc List curriculums with pagination and filters
 * @access Authenticated users
 */
router.get(
    "/",
    authenticate,
    getAllCurriculumsValidation,
    handleValidationErrors,
    (req: any, res: any) => curriculumController.getAllCurriculums(req, res)
);

/**
 * @route POST /curriculums
 * @desc Create a new curriculum
 * @access Admin/Super Admin only
 */
router.post(
    "/",
    authenticate,
    createCurriculumValidation,
    handleValidationErrors,
    (req: any, res: any) => curriculumController.createCurriculum(req, res)
);

/**
 * @route GET /curriculums/:id
 * @desc Get curriculum by ID
 * @access Authenticated users
 */
router.get(
    "/:id",
    authenticate,
    getCurriculumByIdValidation,
    handleValidationErrors,
    (req: any, res: any) => curriculumController.getCurriculumById(req, res)
);

/**
 * @route PUT /curriculums/:id
 * @desc Update an existing curriculum
 * @access Admin/Super Admin only
 */
router.put(
    "/:id",
    authenticate,
    updateCurriculumValidation,
    handleValidationErrors,
    (req: any, res: any) => curriculumController.updateCurriculum(req, res)
);

/**
 * @route DELETE /curriculums/:id
 * @desc Delete a curriculum
 * @access Admin/Super Admin only
 */
router.delete(
    "/:id",
    authenticate,
    deleteCurriculumValidation,
    handleValidationErrors,
    (req: any, res: any) => curriculumController.deleteCurriculum(req, res)
);

export { router as curriculumRoutes };
export default router;

