import { Router } from "express";
import { stateController } from "../controllers/state.controller";
import { getStatesValidation, stateIdValidation } from "../validation/state.validation";
import { handleValidationErrors } from "../middleware/validation";

const router = Router();

/**
 * @route   GET /api/v1/states
 * @desc    Get all states (with optional filters like countryCode, region, search, pos, delta)
 * @access  Public
 */
router.get("/", ...getStatesValidation, handleValidationErrors, (req, res) => stateController.getAllStates(req, res));

/**
 * @route   GET /api/v1/states/:id
 * @desc    Get state by ID
 * @access  Public
 */
router.get("/:id", ...stateIdValidation, handleValidationErrors, (req, res) => stateController.getStateById(req, res));

export default router;
