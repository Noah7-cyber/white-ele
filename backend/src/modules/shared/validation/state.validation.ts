// src/validation/state.validation.ts
import { query, param } from "express-validator";
import { countryCodeExists } from "../validators/country-code.validator";

export const getStatesValidation = [
  //Optional countryCode (validated if provided)
  query("countryCode")
    .optional()
    .isString()
    .isLength({ min: 2, max: 2 })
    .withMessage("Country code must be exactly 2 characters")
    .matches(/^[A-Z]{2}$/i)
    .withMessage("Country code must be 2 uppercase letters (ISO 3166-1 alpha-2 format)")
    .custom(countryCodeExists),

  // Optional search term
  query("search")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Search term must be between 1 and 100 characters"),

  // Pagination (pos and delta)
  query("pos")
    .optional()
    .isInt({ min: 0 })
    .toInt()
    .withMessage("pos must be a non-negative integer"),

  query("delta")
    .optional()
    .isInt({ min: 1, max: 100 })
    .toInt()
    .withMessage("delta must be between 1 and 100"),
];

/**
 * Validation for state by ID
 */
export const stateIdValidation = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("State ID must be a positive integer"),
];
