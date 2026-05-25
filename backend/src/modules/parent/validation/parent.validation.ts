import { body, query } from "express-validator";
import { RelationshipType, Suffix } from "../../shared";
import { ParentStatus } from "../../shared/entities/EntityEnums";

export const createParentsValidation = [
  body("parents")
    .isArray({ min: 1 })
    .withMessage("Parents must be an array with at least one parent"),

  body("parents.*.firstName")
    .notEmpty().withMessage("First name is required")
    .isString().withMessage("First name must be a string")
    .isLength({ max: 50 }).withMessage("First name is too long")
    .trim(),

  body("parents.*.lastName")
    .notEmpty().withMessage("Last name is required")
    .isString().withMessage("Last name must be a string")
    .isLength({ max: 50 }).withMessage("Last name is too long")
    .trim(),

  body("parents.*.email")
    .optional()
    .isEmail().withMessage("Email must be a valid email address")
    .isLength({ max: 100 }).withMessage("Email is too long")
    .trim(),

  body("parents.*.phone")
    .notEmpty().withMessage("Phone number is required")
    .isString().withMessage("Phone number must be a string")
    .isLength({ max: 15 }).withMessage("Phone number is too long")
    .trim(),

  body("parents.*.address")
    .notEmpty().withMessage("Address is required")
    .isString().withMessage("Address must be a string")
    .isLength({ max: 255 }).withMessage("Address is too long")
    .trim(),

  body("parents.*.photoUrl")
    .optional()
    .isURL().withMessage("Photo URL must be a valid URL")
    .isLength({ max: 255 }).withMessage("Photo URL is too long")
    .trim(),

  body("parents.*.relationship")
    .notEmpty().withMessage("Relationship is required")
    .isIn(Object.values(RelationshipType))
    .withMessage(`Relationship must be one of: ${Object.values(RelationshipType).join(", ")}`),

  body("parents.*.notes")
    .optional()
    .isLength({ max: 255 }).withMessage("Note is too long")
    .trim(),

  body("parents.*.username")
    .optional()
    .isString().withMessage("Username must be a string")
    .isLength({ max: 100 }).withMessage("Username is too long")
    .trim(),

  body("parents.*.pin")
    .optional()
    .isString().withMessage("PIN must be a string")
    .isLength({ max: 10 }).withMessage("PIN is too long")
    .trim(),

  body("studentId")
    .notEmpty().withMessage("Student ID is required")
    .isInt().withMessage("Student ID must be a number")
];

export const updateParentValidation = [
  body("photoUrl")
    .optional()
    .isURL().withMessage("Photo URL must be a valid URL")
    .isLength({ max: 500 }).withMessage("Photo URL is too long")
    .trim(),

  body("relationship")
    .optional()
    .isIn(Object.values(RelationshipType))
    .withMessage(`Relationship must be one of: ${Object.values(RelationshipType).join(", ")}`),

  body("notes")
    .optional()
    .isString().withMessage("Notes must be a string")
    .isLength({ max: 1000 }).withMessage("Notes are too long")
    .trim(),

  body("suffix")
    .optional()
    .isIn(Object.values(Suffix))
    .withMessage(`Suffix must be one of: ${Object.values(Suffix).join(", ")}`),

  body("username")
    .optional()
    .isString().withMessage("Username must be a string")
    .isLength({ max: 100 }).withMessage("Username is too long")
    .trim(),

  body("pin")
    .optional()
    .isString().withMessage("PIN must be a string")
    .isLength({ max: 100 }).withMessage("PIN is too long")
    .trim(),
];

export const getAllParentsValidation = [
  query("schoolId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("School ID must be a valid integer"),

  query("search")
    .optional()
    .isString()
    .withMessage("Search must be a string"),

  query("pos")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Position must be a non-negative integer"),

  query("delta")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Delta must be between 1 and 100"),

  query("sortBy")
    .optional()
    .isIn(["firstName", "firstname", "lastName", "lastname", "createdAt", "createdat", "id"])
    .withMessage("Invalid sort field"),

  query("sortOrder")
    .optional()
    .isIn(["ASC", "DESC", "asc", "desc"])
    .withMessage("Sort order must be ASC or DESC")
    .toUpperCase(),
];

export const updateParentStatusValidation = [
  body("status")
    .notEmpty().withMessage("Status is required")
    .isIn(Object.values(ParentStatus))
    .withMessage(`Status must be one of: ${Object.values(ParentStatus).join(", ")}`),
];
