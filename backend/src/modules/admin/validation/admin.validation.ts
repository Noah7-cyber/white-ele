import { body, param, query, ValidationChain } from "express-validator";

export const validateKioskVerifyAdmin: ValidationChain[] = [
  body("id")
    .exists({ checkFalsy: true })
    .withMessage("ID is required (admin id or email)"),
  body("pin")
    .exists({ checkFalsy: true })
    .withMessage("PIN is required")
    .isString()
    .withMessage("PIN must be a string"),
];

export const validateAdminId: ValidationChain[] = [
  param("id").isInt({ min: 1 }).withMessage("Admin ID must be a positive integer").toInt(),
];

export const validateSetAdminPin: ValidationChain[] = [
  param("id").isInt({ min: 1 }).withMessage("Admin ID must be a positive integer").toInt(),
  body("pin")
    .exists({ checkFalsy: true })
    .withMessage("PIN is required")
    .isString()
    .withMessage("PIN must be a string")
    .matches(/^\d{4,8}$/)
    .withMessage("PIN must be 4 to 8 digits"),
];

export const validateListAdminsQuery: ValidationChain[] = [
  query("search")
    .optional({ values: "falsy" })
    .isString()
    .withMessage("search must be a string")
    .isLength({ max: 100 })
    .withMessage("search must not exceed 100 characters"),
  query("pos")
    .optional({ values: "falsy" })
    .isInt({ min: 0 })
    .withMessage("pos must be a non-negative integer")
    .toInt(),
  query("delta")
    .optional({ values: "falsy" })
    .isInt({ min: 1, max: 100 })
    .withMessage("delta must be between 1 and 100")
    .toInt(),
];
