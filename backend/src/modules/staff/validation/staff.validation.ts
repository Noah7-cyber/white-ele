import { body, param, query, ValidationChain } from "express-validator";
import { RelationshipType, StaffRole, StaffStatus } from "../../shared/entities/EntityEnums";

/**
 * Validation for creating staff
 */

export const validateCreateStaff: ValidationChain[] = [
  body("suffix").trim().optional().isLength({ min: 2, max: 255 }).withMessage("First name must be between 2 and 255 characters"),

  body("firstName")
    .trim()
    .notEmpty()
    .withMessage("First name is required")
    .isLength({ min: 2, max: 255 })
    .withMessage("First name must be between 2 and 255 characters"),

  body("lastName")
    .trim()
    .notEmpty()
    .withMessage("Last name is required")
    .isLength({ min: 2, max: 255 })
    .withMessage("Last name must be between 2 and 255 characters"),

  body("middleName").optional().trim().isLength({ min: 2, max: 255 }).withMessage("Middle name must be between 2 and 255 characters"),

  body("notes").optional().trim().isLength({ min: 2, max: 255 }).withMessage("notes must be between 2 and 255 characters"),

  body("email").trim().notEmpty().withMessage("Email is required").isEmail().withMessage("Please provide a valid email address"),

  body("phone")
    .optional()
    .trim()
    .matches(/^[+]?[\d]{7,15}$/)
    .withMessage("Please provide a valid phone number"),

  body("qualification").trim().notEmpty().withMessage("Qualification must be provided"),

  body("dateOfBirth").optional().isISO8601().toDate().withMessage("Date of Birth must be a valid date"),

  body("startDate").optional().isISO8601().toDate().withMessage("Start date must be a valid date"),

  body("address").optional().trim().isLength({ max: 500 }).withMessage("Address must not exceed 500 characters"),

  body("city").optional().trim().isLength({ max: 100 }).withMessage("City must not exceed 100 characters"),

  body("state").optional().trim().isLength({ max: 100 }).withMessage("State must not exceed 100 characters"),

  body("postalCode").optional().trim().isLength({ max: 20 }).withMessage("Postal code must not exceed 20 characters"),

  body("photo")
    .optional()
    .trim()
    .isURL()
    .withMessage("Photo must be a valid URL")
    .isLength({ max: 500 })
    .withMessage("Photo URL must not exceed 500 characters"),

  body("role")
    .optional()
    .customSanitizer((value) => value.toLowerCase())
    .isIn(Object.values(StaffRole))
    .withMessage("Invalid staff role"),

  body("assignedClassroom")
    .optional()
    .isArray({ min: 1 })
    .withMessage("Assigned classrooms must be an array of IDs")
    .custom((arr) => arr.every((id: any) => typeof id === "number"))
    .withMessage("Each classroom ID must be a number"),

  body("notes").optional().trim().isLength({ max: 1000 }).withMessage("Notes must not exceed 1000 characters"),

  // emergency contact details
  body("emergencyContact")
    .optional()
    .isObject()
    .withMessage("Emergency contact must be an object"),

  body("emergencyContact.suffix")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Emergency contact suffix must be between 2 and 50 characters"),

  body("emergencyContact.contactName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage("Emergency contact name must be between 2 and 255 characters"),

  body("emergencyContact.relationship")
    .optional()
    .trim()
    .isIn(Object.values(RelationshipType))
    .withMessage("Invalid relationship type"),

  body("emergencyContact.phone")
    .optional()
    .trim()
    .matches(/^[+]?[\d]{7,15}$/)
    .withMessage("Emergency contact phone must be a valid phone number"),

  body("emergencyContact.email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Emergency contact email must be a valid email address"),

  body("emergencyContact.address")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Emergency contact address must not exceed 500 characters"),
];

/**
 * Validation for updating staff
 */

export const validateUpdateStaff: ValidationChain[] = [
  param("id").isInt({ min: 1 }).withMessage("Staff ID must be a valid integer"),

  body("suffix").optional().isLength({ min: 2, max: 255 }).withMessage("Invalid suffix — must be one of: Mr, Mrs, Miss, Dr"),

  body("firstName").optional().trim().isLength({ min: 2, max: 255 }).withMessage("First name must be between 2 and 255 characters"),

  body("lastName").optional().trim().isLength({ min: 2, max: 255 }).withMessage("Last name must be between 2 and 255 characters"),

  body("middleName").optional().trim().isLength({ min: 2, max: 255 }).withMessage("Middle name must be between 2 and 255 characters"),

  body("email").optional().trim().isEmail().withMessage("Please provide a valid email address"),

  body("phone")
    .optional()
    .trim()
    .matches(/^[+]?[\d]{7,15}$/)
    .withMessage("Please provide a valid phone number"),

  body("qualification").optional().trim().notEmpty().withMessage("Qualification must be provided"),


  body("notes").optional().trim().isLength({ min: 2, max: 255 }).withMessage("notes must be between 2 and 255 characters"),

  body("dateOfBirth").optional().isISO8601().toDate().withMessage("Date of Birth must be a valid date"),

  body("startDate").optional().isISO8601().toDate().withMessage("Start date must be a valid date"),

  body("address").optional().trim().isLength({ max: 500 }).withMessage("Address must not exceed 500 characters"),

  body("city").optional().trim().isLength({ max: 100 }).withMessage("City must not exceed 100 characters"),

  body("state").optional().trim().isLength({ max: 100 }).withMessage("State must not exceed 100 characters"),

  body("postalCode").optional().trim().isLength({ max: 20 }).withMessage("Postal code must not exceed 20 characters"),

  body("photo")
    .optional()
    .trim()
    .isURL()
    .withMessage("Photo must be a valid URL")
    .isLength({ max: 500 })
    .withMessage("Photo URL must not exceed 500 characters"),

  body("role")
    .optional()
    .customSanitizer((value) => value.toLowerCase())
    .isIn(Object.values(StaffRole))
    .withMessage("Invalid staff role"),

  body("assignedClassroom")
    .optional()
    .isArray({ min: 1 })
    .withMessage("Assigned classrooms must be an array of IDs")
    .custom((arr) => arr.every((id: any) => typeof id === "number" || !isNaN(Number(id))))
    .withMessage("Each classroom ID must be a number"),

  body("assignedClasses")
    .optional()
    .isArray({ min: 1 })
    .withMessage("Assigned classrooms must be an array of IDs")
    .custom((arr) => arr.every((id: any) => typeof id === "number" || !isNaN(Number(id))))
    .withMessage("Each classroom ID must be a number"),

  body("notes").optional().trim().isLength({ max: 1000 }).withMessage("Notes must not exceed 1000 characters"),

  body("emergencyContact")
    .optional()
    .isObject()
    .withMessage("Emergency contact must be an object"),

  body("emergencyContact.suffix")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Emergency contact suffix must be between 2 and 50 characters"),

  body("emergencyContact.contactName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage("Emergency contact name must be between 2 and 255 characters"),

  body("emergencyContact.relationship")
    .optional()
    .trim()
    .isIn(Object.values(RelationshipType))
    .withMessage("Invalid relationship type"),

  body("emergencyContact.phone")
    .optional()
    .trim()
    .matches(/^[+]?[\d]{7,15}$/)
    .withMessage("Emergency contact phone must be a valid phone number"),

  body("emergencyContact.email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Emergency contact email must be a valid email address"),

  body("emergencyContact.address")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Emergency contact address must not exceed 500 characters"),
];

/**
 * Validation for changing staff status
 */
export const validateUpdateStaffStatus: ValidationChain[] = [
  param("id").isInt({ min: 1 }).withMessage("Staff ID must be a valid integer"),

  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn(Object.values(StaffStatus))
    .withMessage(`Status must be one of: ${Object.values(StaffStatus).join(", ")}`),
];

/**
 * Validation for staff ID parameter
 */
export const validateStaffId: ValidationChain[] = [param("id").isInt({ min: 1 }).withMessage("Staff ID must be a valid integer")];

/**
 * Validation for listing staff
 */
export const validateListStaffQuery: ValidationChain[] = [
  query("search").optional().trim().isLength({ max: 255 }).withMessage("Search term must not exceed 255 characters"),

  query("role").optional({ values: "falsy" }).isIn(Object.values(StaffRole)).withMessage("Invalid staff role"),

  query("school").optional().trim().isLength({ max: 100 }).withMessage("School filter must not exceed 100 characters"),

  query("classroom").optional().trim().isLength({ max: 100 }).withMessage("Classroom filter must not exceed 100 characters"),

  query("qualification").optional().trim().isLength({ max: 100 }).withMessage("Qualification must not exceed 100 characters"),

  query("status").optional({ values: "falsy" }).isIn(Object.values(StaffStatus)).withMessage("Invalid staff status"),

  query("pos").optional().isInt({ min: 0 }).withMessage("Position must be a non-negative integer").toInt(),

  query("delta").optional().isInt({ min: 1, max: 100 }).withMessage("Delta must be between 1 and 100").toInt(),

  query("sortBy")
    .optional({ values: "falsy" })
    .isIn(["name", "firstName", "firstname", "lastName", "lastname", "email", "createdAt", "createdat", "updatedAt", "updatedat", "id"])
    .withMessage("Sort by must be a valid field (name, firstName, lastName, email, createdAt, updatedAt, id)"),

  query("sortOrder")
    .optional({ values: "falsy" })
    .isIn(["ASC", "DESC", "asc", "desc"])
    .withMessage("Sort order must be ASC or DESC")
    .toUpperCase(),
];
