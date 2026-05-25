import { Router } from "express";
import { cityController } from "../controllers/city.controller";
import { getCitiesValidation, cityIdValidation } from "../validation/city.validation";
import { handleValidationErrors } from "../middleware/validation";

const router = Router();

/**
 * @route   GET /api/v1/cities
 * @desc    Get all cities (with optional filters like stateId, search, pos, delta)
 * @access  Public
 */
router.get("/", ...getCitiesValidation, handleValidationErrors, (req, res) => cityController.getAllCities(req, res));

/**
 * @route   GET /api/v1/cities/:id
 * @desc    Get city by ID
 * @access  Public
 */
router.get("/:id", ...cityIdValidation, handleValidationErrors, (req, res) => cityController.getCityById(req, res));

export default router;
