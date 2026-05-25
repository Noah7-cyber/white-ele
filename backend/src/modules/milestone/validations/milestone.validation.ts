import { body, param, query } from "express-validator";
import { GradingType, MilestoneStatus } from "../../shared/entities/EntityEnums";

export const createMilestoneValidation = [
  body("title")
    .notEmpty().withMessage("Title is required")
    .isString().withMessage("Title must be a string"),

  body("curriculumId")
    .notEmpty().withMessage("Curriculum ID is required")
    .isInt().withMessage("Curriculum ID must be a number"),

  body("subjectId")
    .notEmpty().withMessage("Subject ID is required")
    .isInt().withMessage("Subject ID must be a number"),

  body("gradingType")
    .isIn(Object.values(GradingType))
    .optional()
    .withMessage("Invalid grading type"),


];

export const updateMilestoneValidation = [
  param("id").isInt().withMessage("Milestone ID must be a number"),

  body("title")
    .optional()
    .isString().withMessage("Title must be a string"),

  body("status")
    .optional()
    .isIn(Object.values(MilestoneStatus))
    .withMessage("Invalid milestone status"),

  body("curriculumId")
    .optional()
    .isInt().withMessage("Curriculum ID must be a number"),

  body("subjectId")
    .optional()
    .isInt().withMessage("Subject ID must be a number"),

  body("gradingType")
    .optional()
    .isIn(Object.values(GradingType))
    .withMessage("Invalid grading type"),

];

export const listMilestonesValidation = [
  query("curriculumId")
    .optional()
    .isInt().withMessage("Curriculum ID must be a number"),

  query("subjectId")
    .optional()
    .isInt().withMessage("Subject ID must be a number"),

  query("status")
    .optional()
    .custom((value) => {
      const allowed = new Set(Object.values(MilestoneStatus));
      const rawValues = Array.isArray(value) ? value : [value];
      const normalized = rawValues
        .flatMap((item) => String(item).split(","))
        .map((item) => item.trim())
        .filter(Boolean);

      if (normalized.length === 0) return true;
      return normalized.every((item) => allowed.has(item as MilestoneStatus));
    })
    .withMessage("Invalid milestone status"),

  query("gradingType")
    .optional()
    .isIn(Object.values(GradingType))
    .withMessage("Invalid grading type"),


  query("pos")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Position must be a non-negative integer"),

  query("delta")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Delta must be between 1 and 100"),

  query("search")
    .optional()
    .isString()
    .withMessage("Search term must be a string"),
];

export const milestoneIdValidation = [
  param("id").isInt().withMessage("Milestone ID must be a number"),
];

export const addMilestoneFromLibraryValidation = [
  body("milestoneIds")
    .isArray({ min: 1 })
    .withMessage("milestoneIds must be a non-empty array"),

  body("milestoneIds.*")
    .isInt()
    .withMessage("Each milestoneId must be a number")
    .toInt(),

  body("classroomId")
    .optional()
    .isInt()
    .withMessage("Classroom ID must be a number"),

  body("assignedStaffId")
    .optional()
    .isInt()
    .withMessage("Assigned Staff ID must be a number"),
];
