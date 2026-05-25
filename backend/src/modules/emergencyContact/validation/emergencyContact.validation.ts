//import { query } from "express";
import { body} from "express-validator";

const suffices = ["Mr", "Mrs", "Ms", "Dr", "Prof"];
const relationships = ["mother", "father", "guardian", "sibling", "other"];

export const createEmergencyContactValidation = [
    body("studentId")
    .notEmpty().withMessage("Student ID is required")
    .isInt().withMessage("Student ID must be a number"),


    body("suffix")
    .notEmpty().withMessage("Suffix is required")
    .isString().withMessage("Suffix must be a string")
    .isIn(suffices).withMessage(`Suffix must be one of: ${suffices.join(", ")}`)
    .isLength({ max: 20 }).withMessage("Suffix is too long")
    .trim(),

    body("contactName")
    .notEmpty().withMessage("Contact name is required")
    .isString().withMessage("Contact name must be a string")
    .isLength({ max: 100 }).withMessage("Contact name is too long")
    .trim(),
    
    body("relationship")
    .notEmpty().withMessage("Relationship is required")
    .isString().withMessage("Relationship must be a string")
    .customSanitizer((value) => typeof value === "string" ? value.toLowerCase().trim() : value)
    .isIn(relationships).withMessage(`Relationship must be one of: ${relationships.join(", ")}`)
    .isLength({ max: 50 }).withMessage("Relationship is too long")
    .trim(),

    body("phone")
    .notEmpty().withMessage("Phone number is required")
    .isString().withMessage("Phone number must be a string")
    .isLength({ max: 15 }).withMessage("Phone number is too long")
    .trim(),

    body("email")
    .optional()
    .isEmail().withMessage("Email must be a valid email address")
    .isLength({ max: 100 }).withMessage("Email is too long")
    .trim(),

    body("address")
    .optional()
    .isString().withMessage("Address must be a string")
    .isLength({ max: 255 }).withMessage("Address is too long")
    .trim()

    

    
];