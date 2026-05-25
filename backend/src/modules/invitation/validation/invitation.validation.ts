import { body, param, query } from "express-validator";
import { UserRole } from "../../shared/entities";


export const createInvitationValidation = [
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail().trim(),
  body("role")
    .notEmpty()
    .withMessage("Role is required")
    .isIn(Object.values(UserRole))
    .withMessage(`Role must be one of: ${Object.values(UserRole).join(", ")}`),
  body("roleId")
    .optional({ values: "null" })
    .isInt({ min: 1 })
    .withMessage("roleId must be a positive integer"),
  body("firstName").notEmpty().withMessage("First name is required").isString().trim(),
  body("lastName").notEmpty().withMessage("Last name is required").isString().trim(),
];

export const invitationIdValidation = [
  param("invitationId")
    .notEmpty()
    .withMessage("Invitation ID is required")
    .isInt({ min: 1 })
    .withMessage("Invitation ID must be a positive integer"),
];

export const updateInvitationValidation = [
  ...invitationIdValidation,
  body("firstName").optional().isString().trim(),
  body("lastName").optional().isString().trim(),
  body("roleId")
    .optional({ values: "null" })
    .isInt({ min: 1 })
    .withMessage("roleId must be a positive integer"),
];

export const acceptInvitationValidation = [body("token").notEmpty().withMessage("Token is required").isString().trim()];

export const validateInvitationValidation = [query("token").notEmpty().withMessage("Token is required").isString().trim()];

export const getInvitationsValidation = [
  query("pos").optional().isInt({ min: 0 }).withMessage("Position must be a non-negative integer"),
  query("delta").optional().isInt({ min: 1, max: 100 }).withMessage("Delta must be between 1 and 100"),
  query("role")
    .optional({ values: "falsy" })
    .isIn(Object.values(UserRole))
    .withMessage(`Role must be one of: ${Object.values(UserRole).join(", ")}`),
  query("hasAccepted").optional().isBoolean().withMessage("hasAccepted must be a boolean"),
  query("email").optional().isString().trim(),
];
