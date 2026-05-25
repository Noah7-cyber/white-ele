import { body, query, param } from "express-validator";
import { Skills } from "../../shared/entities";

export const createSubjectValidation = [
  body("curriculumId")
    .notEmpty().withMessage("Curriculum ID is required")
    .isInt().withMessage("Curriculum ID must be a number")
    .toInt(),

  body("title")
    .optional()
    .isString().withMessage("Title must be a string")
    .isLength({ max: 100 }).withMessage("Title cannot exceed 100 characters"),

  body("name")
    .optional()
    .isString().withMessage("Name must be a string")
    .isLength({ max: 100 }).withMessage("Name cannot exceed 100 characters"),

  body().custom((value) => {
    if (!value.title && !value.name) {
      throw new Error("Either 'title' or 'name' is required");
    }
    return true;
  }),

  body("description")
    .optional()
    .isString().withMessage("Description must be a string"),

  body("assignedTeacher")
    .notEmpty().withMessage("Assigned teacher is required")
    .custom((value) => {
      if (Array.isArray(value)) {
        throw new Error("Assigned teacher must be a single ID, not an array");
      }
      return true;
    })
    .isInt().withMessage("Assigned teacher must be a valid teacher ID")
    .toInt(),

  body("skills")
    .optional()
    .customSanitizer((value) => {
      if (Array.isArray(value)) {
        return value;
      }
      if (typeof value === "string") {
        return value
          .split(",")
          .map((skill) => skill.trim())
          .filter((skill) => skill.length > 0);
      }
      return value;
    })
    .isArray({ min: 1 })
    .withMessage("Skills must be an array"),

  body("skills.*")
    .isIn(Object.values(Skills))
    .withMessage("Each skill must be a valid skill"),


  body("minimumAge")
    .optional()
    .isInt().withMessage("Minimum age must be a number")
    .toInt(),

  body("maximumAge")
    .optional()
    .isInt().withMessage("Maximum age must be a number")
    .toInt(),

  body("duration")
    .optional()
    .isInt().withMessage("Duration must be a number")
    .toInt(),

  body("subjectSchedule")
    .optional()
    .isArray()
    .withMessage("Subject schedule must be an array"),

  body("subjectSchedule.*.day")
    .optional()
    .isString()
    .withMessage("Schedule day must be a string"),

  body("subjectSchedule.*.startTime")
    .optional()
    .isString()
    .withMessage("Schedule start time must be a string"),

  body("subjectSchedule.*.endTime")
    .optional()
    .isString()
    .withMessage("Schedule end time must be a string"),

  body("classroomIds")
    .isArray({ min: 1 }).withMessage("Classroom IDs must be an array with at least one item")
    .custom((value) => {
      if (!value.every((id: any) => Number.isInteger(id))) {
        throw new Error("All classroom IDs must be integers");
      }
      return true;
    })
    .withMessage("All classroom IDs must be integers"),
];

export const getSubjectsValidation = [
  query("curriculumId").optional().isInt().withMessage("Curriculum ID must be a number"),
  query("skills").optional().isIn(Object.values(Skills)).withMessage("Skills must be a valid skill"),
  query("subjectSchedule").optional().isArray().withMessage("Subject schedule must be an array"),
  query("minimumAge").optional().isInt().withMessage("Minimum age must be a number"),
  query("maximumAge").optional().isInt().withMessage("Maximum age must be a number"),
  query("duration").optional().isInt().withMessage("Duration must be a number"),
  query("pos").optional().isInt().withMessage("Position must be a number"),
  query("delta").optional().isInt().withMessage("Delta must be a number"),
  query("sortBy").optional().isString().withMessage("Sort by must be a string"),
  query("sortOrder").optional().isIn(["ASC", "DESC"]).withMessage("Sort order must be either ASC or DESC"),
  query("classroomId").optional().isInt().withMessage("Classroom ID must be a number"),
  query("search").optional().isString().withMessage("Search term must be a string"),
];

export const updateSubjectValidation = [
  param("id").isInt().withMessage("Subject ID must be a valid number"),
  body("name").optional().isString().isLength({ max: 100 }),
  body("title").optional().isString().isLength({ max: 100 }),
  body("curriculumId").optional().isInt().toInt(),
  body("description").optional().isString(),

  body("skills")
    .optional()
    .customSanitizer((value) => {
      if (Array.isArray(value)) {
        return value;
      }
      if (typeof value === "string") {
        return value
          .split(",")
          .map((skill) => skill.trim())
          .filter((skill) => skill.length > 0);
      }
      return value;
    })
    .isArray({ min: 1 })
    .withMessage("Skills must be an array"),

  body("skills.*")
    .isIn(Object.values(Skills))
    .withMessage("Each skill must be a valid skill"),

  body("subjectSchedule").optional().isArray().withMessage("Subject schedule must be an array"),
  body("subjectSchedule.*.day").optional().isString().withMessage("Schedule day must be a string"),
  body("subjectSchedule.*.startTime").optional().isString().withMessage("Schedule start time must be a string"),
  body("subjectSchedule.*.endTime").optional().isString().withMessage("Schedule end time must be a string"),
  body("minimumAge").optional().isInt().withMessage("Minimum age must be a number").toInt(),
  body("maximumAge").optional().isInt().withMessage("Maximum age must be a number").toInt(),
  body("duration").optional().isInt().withMessage("Duration must be a number").toInt(),
  body("assignedTeacher")
    .optional()
    .custom((value) => {
      if (Array.isArray(value)) {
        throw new Error("Assigned teacher must be a single ID, not an array");
      }
      return true;
    })
    .isInt().withMessage("Assigned teacher must be a valid teacher ID")
    .toInt(),
  body("classroomIds").optional().isArray().withMessage("Classroom IDs must be an array"),
  body("classroomIds.*").optional().isInt().withMessage("Classroom ID must be a number"),
];