import { body} from "express-validator";


export const createMedicalValidation = [
    body("studentId")
    .notEmpty().withMessage("Student ID is required")
    .isInt().withMessage("Student ID must be a number"),

    body("allergies")
    .optional()
    .isString().withMessage("Allergies must be a string")
    .isLength({ max: 500 }).withMessage("Allergies is too long")
    .trim(),

    body("medications")
    .optional()
    .isString().withMessage("Medications must be a string")
    .isLength({ max: 500 }).withMessage("Medications is too long")
    .trim(),

    body("foodPreferences")
    .optional()
    .isString().withMessage("Food preference must be a string")
    .isLength({ max: 500 }).withMessage("Food preference is too long")
    .trim(),

    body("dietRestrictions")
    .optional()
    .isString().withMessage("Diet Restrictions must be a string")
    .isLength({ max: 500 }).withMessage("Diet Restrictions is too long")
    .trim(),

    body("notes")
    .optional()
    .isString().withMessage("Notes must be a string")
    .isLength({ max: 500 }).withMessage("Notes are too long")
    .trim()

    
];