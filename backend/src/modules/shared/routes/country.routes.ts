import { Router } from "express";
import { countryController } from "../controllers/country.controller";
import { getCountriesValidation, countryCodeValidation } from "../validation/country.validation";
import { handleValidationErrors } from "../middleware/validation";

const router = Router();

/**
 * @route   GET /api/v1/countries
 * @desc    Get all countries (with optional filters)
 * @access  Public
 */
router.get("/", ...getCountriesValidation, handleValidationErrors, (req, res) => countryController.getAllCountries(req, res));

/**
 * @route   GET /api/v1/countries/regions
 * @desc    Get all unique regions
 * @access  Public
 */
router.get("/regions", (req, res) => countryController.getRegions(req, res));

/**
 * @route   GET /api/v1/countries/:code
 * @desc    Get country by country code (e.g., NG, US, GB)
 * @access  Public
 */
router.get("/:code", ...countryCodeValidation, handleValidationErrors, (req, res) => countryController.getCountryByCode(req, res));

export default router;
