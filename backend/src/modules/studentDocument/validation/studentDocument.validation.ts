import { body, param } from "express-validator";

export const createStudentDocumentsValidation = [
  body("studentId")
    .notEmpty().withMessage("Student ID is required")
    .isInt().withMessage("Student ID must be a number"),

  body("docs")
    .isArray({ min: 1 }).withMessage("Docs must be an array with at least one document"),

  body("docs.*.docName")
    .notEmpty().withMessage("Document name is required")
    .isString().withMessage("Document name must be a string")
    .isLength({ max: 100 }).withMessage("Document name is too long")
    .trim(),

  body("docs.*.documentUrl")
    .notEmpty().withMessage("Document URL is required")
    .isURL().withMessage("Document URL must be a valid URL")
    .isLength({ max: 255 }).withMessage("Document URL is too long")
    .trim(),
];

export const validateDeleteStudentDocument = [
  param("id")
    .notEmpty()
    .withMessage("Document ID is required")
    .isInt({ min: 1 })
    .withMessage("Document ID must be a positive integer")
    .toInt(),
];