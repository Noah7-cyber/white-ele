import { body, query, CustomValidator } from "express-validator";
import { AppDataSource } from "../../core/config/database";
import { Country } from "../entities/Country";

/**
 * Custom validator to check if a country code exists in the database
 */
export const countryCodeExists: CustomValidator = async (value: string) => {
  if (!value) {
    return true; // Allow empty values - use .notEmpty() or .optional() in the chain
  }

  const countryRepository = AppDataSource.getRepository(Country);
  const country = await countryRepository.findOne({
    where: { countryCode: value.toUpperCase() },
  });

  if (!country) {
    throw new Error(`Country code '${value.toUpperCase()}' does not exist.`);
  }

  return true;
};

/**
 * Validation chain for country code in request body
 * Usage: body("countryCode").optional().custom(countryCodeExists)
 */
export const validateCountryCodeInBody = body("countryCode")
  .optional()
  .isString()
  .isLength({ min: 2, max: 2 })
  .withMessage("Country code must be exactly 2 characters")
  .matches(/^[A-Z]{2}$/i)
  .withMessage("Country code must be 2 uppercase letters (ISO 3166-1 alpha-2 format)")
  .custom(countryCodeExists);

/**
 * Validation chain for required country code in request body
 */
export const validateRequiredCountryCodeInBody = body("countryCode")
  .notEmpty()
  .withMessage("Country code is required")
  .isString()
  .isLength({ min: 2, max: 2 })
  .withMessage("Country code must be exactly 2 characters")
  .matches(/^[A-Z]{2}$/i)
  .withMessage("Country code must be 2 uppercase letters (ISO 3166-1 alpha-2 format)")
  .custom(countryCodeExists);

/**
 * Validation chain for country code in query params
 */
export const validateCountryCodeInQuery = query("countryCode")
  .optional()
  .isString()
  .isLength({ min: 2, max: 2 })
  .withMessage("Country code must be exactly 2 characters")
  .matches(/^[A-Z]{2}$/i)
  .withMessage("Country code must be 2 uppercase letters (ISO 3166-1 alpha-2 format)")
  .custom(countryCodeExists);
