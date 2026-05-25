import { body, param, query } from "express-validator";

export const createCurriculumValidation = [
    body("title")
        .notEmpty().withMessage("Title is required")
        .isString().withMessage("Title must be a string")
        .isLength({ max: 255 }).withMessage("Title is too long")
        .trim(),

    body("description")
        .notEmpty().withMessage("Description is required")
        .isString().withMessage("Description must be a string")
        .isLength({ max: 500 }).withMessage("Description is too long")
        .trim(),
   
    body("attachmentUrl")
        .optional()
        .isArray()
        .withMessage("Attachment URL must be an array"),

    body("attachmentUrl.*")
        .custom(v => typeof v === "object" && v !== null && !Array.isArray(v))
        .withMessage("Each attachment URL must be an object"),

    body("attachmentUrl.*.url")
        .exists({ checkFalsy: true })
        .withMessage("Attachment URL is required")
        .isString()
        .withMessage("Attachment URL must be a string")
        .isURL()
        .withMessage("Attachment URL must be a valid URL"),

    body("attachmentUrl.*.name")
        .exists({ checkFalsy: true })
        .withMessage("Attachment Name is required")
        .isString()
        .withMessage("Attachment Name must be a string")
        .isLength({ min: 1 })
        .withMessage("Attachment Name cannot be empty"),


];

export const updateCurriculumValidation = [
    param("id")
        .notEmpty().withMessage("Curriculum ID is required")
        .isInt().withMessage("Curriculum ID must be an integer"),

    body("title")
        .optional()
        .isString().withMessage("Title must be a string")
        .isLength({ max: 255 }).withMessage("Title is too long")
        .trim(),

    body("description")
        .optional()
        .isString().withMessage("Description must be a string")
        .isLength({ max: 500 }).withMessage("Description is too long")
        .trim(),

    body("attachmentUrl")
        .optional()
        .isArray()
        .withMessage("Attachment URL must be an array"),

    body("attachmentUrl.*")
        .custom(v => typeof v === "object" && v !== null && !Array.isArray(v))
        .withMessage("Each attachment URL must be an object"),

    body("attachmentUrl.*.url")
        .exists({ checkFalsy: true })
        .withMessage("Attachment URL is required")
        .isString()
        .withMessage("Attachment URL must be a string")
        .isURL()
        .withMessage("Attachment URL must be a valid URL"),

    body("attachmentUrl.*.name")
        .optional()
        .isString().withMessage("Attachment Name must be a string")
        .isLength({ min: 1 })
        .withMessage("Attachment Name cannot be empty"),

];

export const getCurriculumByIdValidation = [
    param("id")
        .notEmpty().withMessage("Curriculum ID is required")
        .isInt().withMessage("Curriculum ID must be an integer"),
    query("isSystem")
        .optional()
        .isBoolean()
        .withMessage("isSystem must be a boolean"),
];

export const deleteCurriculumValidation = [
    param("id")
        .notEmpty().withMessage("Curriculum ID is required")
        .isInt().withMessage("Curriculum ID must be an integer"),
];

export const getAllCurriculumsValidation = [
    query("pos")
        .optional()
        .isInt({ min: 0 }).withMessage("Position must be a non-negative integer"),

    query("delta")
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage("Delta must be between 1 and 100"),

    query("search")
        .optional()
        .isString().withMessage("Search must be a string")
        .trim(),

    query("schoolId")
        .optional()
        .isInt().withMessage("School ID must be an integer"),


];