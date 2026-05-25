import { param, query } from "express-validator";

export const getCountriesValidation = [
  query("region").optional().isString().trim().isLength({ min: 2, max: 50 }).withMessage("Region must be between 2 and 50 characters"),
  query("isActive").optional().isBoolean().withMessage("isActive must be a boolean"),
  query("search").optional().isString().trim().isLength({ min: 1, max: 100 }).withMessage("Search must be between 1 and 100 characters"),
];

export const countryCodeValidation = [
  param("code")
    .notEmpty()
    .withMessage("Country code is required")
    .isString()
    .isLength({ min: 2, max: 2 })
    .withMessage("Country code must be exactly 2 characters")
    .matches(/^[A-Z]{2}$/i)
    .withMessage("Country code must be 2 uppercase letters"),
];
