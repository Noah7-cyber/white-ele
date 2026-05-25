import { body, query, param } from "express-validator";
import { PortfolioStatus } from "../../shared/entities/EntityEnums";

export const createPortfolioValidation = [
    body("studentId")
        .notEmpty().withMessage("Student ID is required")
        .isInt().withMessage("Student ID must be a number"),

    body("classroomId")
        .notEmpty().withMessage("Classroom ID is required")
        .isInt().withMessage("Classroom ID must be a number"),

    body("startDate")
        .notEmpty().withMessage("Start date is required")
        .isISO8601().withMessage("Start date must be a valid date"),

    body("endDate")
        .notEmpty().withMessage("End date is required")
        .isISO8601().withMessage("End date must be a valid date"),

];


export const addPortfolioSectionValidation = [
    body("portfolioId")
        .notEmpty().withMessage("Portfolio ID is required")
        .isInt().withMessage("Portfolio ID must be a number"),

    body("content")
        .notEmpty().withMessage("Content is required")
        .isString().withMessage("Content must be a string"),

    body("mediaUrls")
        .optional()
        .isArray().withMessage("Media URLs must be an array"),

    body("mediaUrls.*")
        .isURL().withMessage("Each media URL must be a valid URL"),

    body("contentEntryDate")
        .optional()
        .isISO8601().withMessage("Content entry date must be a valid date"),

    body("contentEntryTime")
        .optional()
        .matches(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/).withMessage("Content entry time must be in HH:mm format"),

    body("mediaEntryDate")
        .optional()
        .isISO8601().withMessage("Media entry date must be a valid date"),

    body("mediaEntryTime")
        .optional()
        .matches(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/).withMessage("Media entry time must be in HH:mm format")
];

export const getPortfolioValidation = [
    query("studentId")
        .optional()
        .isInt().withMessage("Student ID must be a number"),

    query("classroomId")
        .optional()
        .isInt().withMessage("Classroom ID must be a number"),

    query("startDate")
        .optional()
        .isISO8601().withMessage("Start date must be a valid date"),

    query("endDate")
        .optional()
        .isISO8601().withMessage("End date must be a valid date")
];

export const getPortfolioByIdValidation = [
    param("id")
        .notEmpty().withMessage("Portfolio ID is required")
        .isInt().withMessage("Portfolio ID must be a number")
];

export const updatePortfolioValidation = [
    param("id")
        .notEmpty().withMessage("Portfolio ID is required")
        .isInt().withMessage("Portfolio ID must be a number"),

    body("startDate")
        .notEmpty().withMessage("Start date is required")
        .isISO8601().withMessage("Start date must be a valid date"),

    body("endDate")
        .notEmpty().withMessage("End date is required")
        .isISO8601().withMessage("End date must be a valid date")
        .custom((value, { req }) => {
            const startDate = new Date(req.body.startDate);
            const endDate = new Date(value);
            if (endDate < startDate) {
                throw new Error("End date must be greater than or equal to start date");
            }
            return true;
        })
];

export const patchPortfolioStatusValidation = [
    param("id")
        .notEmpty().withMessage("Portfolio ID is required")
        .isInt().withMessage("Portfolio ID must be a number"),

    body("status")
        .notEmpty().withMessage("Status is required")
        .isIn(Object.values(PortfolioStatus)).withMessage("Status must be one of: active, published, draft")
];

export const updatePortfolioSectionValidation = [
    param("id")
        .notEmpty().withMessage("Section ID is required")
        .isInt().withMessage("Section ID must be a number"),

    body("content")
        .optional()
        .isString().withMessage("Content must be a string"),

    body("mediaUrls")
        .optional()
        .isArray().withMessage("Media URLs must be an array"),

    body("mediaUrls.*")
        .optional()
        .isURL().withMessage("Each media URL must be a valid URL"),

    body("contentEntryDate")
        .optional()
        .isISO8601().withMessage("Content entry date must be a valid date"),

    body("contentEntryTime")
        .optional()
        .matches(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/).withMessage("Content entry time must be in HH:mm format"),

    body("mediaEntryDate")
        .optional()
        .isISO8601().withMessage("Media entry date must be a valid date"),

    body("mediaEntryTime")
        .optional()
        .matches(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/).withMessage("Media entry time must be in HH:mm format")
];

export const deletePortfolioSectionValidation = [
    param("id")
        .notEmpty().withMessage("Section ID is required")
        .isInt().withMessage("Section ID must be a number")
];

export const getStudentGradesValidation = [
    query("studentId")
        .optional()
        .isInt({ min: 1 }).withMessage("Student ID must be a positive integer")
        .toInt()
];

