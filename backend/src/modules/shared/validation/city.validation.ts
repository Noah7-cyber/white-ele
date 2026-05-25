// src/validation/city.validation.ts
import { query, param } from "express-validator";
import { countryCodeExists } from "../validators/country-code.validator";
import { stateCodeExists, stateNameExists } from "../validators/state.validators";

export const getCitiesValidation = [
  // Optional countryCode
  query("countryCode")
    .optional()
    .isString()
    .isLength({ min: 2, max: 2 })
    .withMessage("Country code must be exactly 2 characters")
    .matches(/^[A-Z]{2}$/i)
    .withMessage("Country code must be 2 uppercase letters (ISO 3166-1 alpha-2 format)")
    .custom(countryCodeExists),

  // Optional stateCode
  query("stateCode")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 10 })
    .withMessage("State code must be between 1 and 10 characters")
    .custom(stateCodeExists),

  // Optional stateName
  query("stateName")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("State name must be between 1 and 100 characters")
    .custom(stateNameExists),

  // Custom check to ensure stateCode and stateName are not used together
  query().custom((_, { req }) => {
    const q = req?.query as Record<string, unknown> | undefined;
    if (q?.["stateCode"] && q?.["stateName"]) {
      throw new Error("You cannot use both stateCode and stateName in the same request");
    }
    return true;
  }),

  // Optional search term
  query("search")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Search term must be between 1 and 100 characters"),

  // Pagination
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
 * Validation for city by ID
 */
export const cityIdValidation = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("City ID must be a positive integer"),
];
