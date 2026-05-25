import { body, param, query, ValidationChain } from "express-validator";
import { MealType, ActivityType, BathroomType } from "../../shared/entities/EntityEnums";

// Base validation for all activity types
const baseActivityValidation: ValidationChain[] = [
  body("activityType")
    .notEmpty()
    .withMessage("Activity type is required")
    .isIn(Object.values(ActivityType))
    .withMessage(`Activity type must be one of: ${Object.values(ActivityType).join(", ")}`),

  body("studentIds")
    .isArray({ min: 1 })
    .withMessage("studentIds must be a non-empty array of numbers"),
  body("studentIds.*")
    .isInt({ min: 1 })
    .withMessage("Each studentId must be a positive integer")
    .toInt(),

  body("notes")
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage("Notes must not exceed 1000 characters"),

  body("notifyParent")
    .optional()
    .isBoolean()
    .withMessage("notifyParent must be a boolean")
    .toBoolean(),
];

// Combined validation that checks activity type and applies appropriate rules
export const validateCreateActivity: ValidationChain[] = [
  ...baseActivityValidation,
  body("activityType").custom((value, { req }) => {
    const activityType = value as ActivityType;
    switch (activityType) {
      case ActivityType.MEAL:
        // Validate meal-specific fields
        if (!req.body.mealType) {
          throw new Error("Meal type is required for meal activity");
        }
        if (!req.body.foodItem) {
          throw new Error("Food item is required for meal activity");
        }
        break;
      case ActivityType.NAP:
        if (!req.body.startTime) {
          throw new Error("Start time is required for nap activity");
        }
        break;
      case ActivityType.MEDICATION:
        if (!req.body.medicationName) {
          throw new Error("Medication name is required for medication activity");
        }
        if (!req.body.dosage) {
          throw new Error("Dosage is required for medication activity");
        }
        break;
      case ActivityType.BATHROOM:
        if (!req.body.bathroomType) {
          throw new Error("Bathroom type is required for bathroom activity");
        }
        if (!req.body.time && !req.body.timeGiven) {
          throw new Error("Time is required for bathroom activity");
        }
        break;
      case ActivityType.WATER:
        // No additional required fields
        break;
      case ActivityType.PHOTO:
        if (!req.body.photoUrl) {
          throw new Error("Photo is required for photo activity");
        }
        break;
    }
    return true;
  }),
];

export const validateActivityId: ValidationChain[] = [
  param("id")
    .notEmpty()
    .withMessage("Activity ID is required")
    .isInt({ min: 1 })
    .withMessage("Activity ID must be a positive integer")
    .toInt(),
];

export const validateUpdateActivity: ValidationChain[] = [
  ...validateActivityId,

  body("activityType")
    .optional()
    .isIn(Object.values(ActivityType))
    .withMessage(`Activity type must be one of: ${Object.values(ActivityType).join(", ")}`),

  body("studentId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Student ID must be a positive integer")
    .toInt(),

  body("teacherId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Teacher ID must be a positive integer")
    .toInt(),

  body("mealType")
    .optional()
    .isIn(Object.values(MealType))
    .withMessage(`Meal type must be one of: ${Object.values(MealType).join(", ")}`),

  body("foodItem")
    .optional()
    .isLength({ max: 255 })
    .withMessage("Food item must not exceed 255 characters"),

  body("bathroomType")
    .optional()
    .isIn(Object.values(BathroomType))
    .withMessage(`Bathroom type must be one of: ${Object.values(BathroomType).join(", ")}`),

  body("medicationName")
    .optional()
    .isLength({ max: 255 })
    .withMessage("Medication name must not exceed 255 characters"),

  body("dosage")
    .optional()
    .isLength({ max: 100 })
    .withMessage("Dosage must not exceed 100 characters"),

  body("timeGiven")
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/)
    .withMessage("Time given must be in HH:MM or HH:MM:SS format (e.g., 14:30 or 14:30:00)"),

  body("time")
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/)
    .withMessage("Time must be in HH:MM or HH:MM:SS format (e.g., 14:30 or 14:30:00)"),

  body("startTime")
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/)
    .withMessage("Start time must be in HH:MM or HH:MM:SS format (e.g., 09:00 or 09:00:00)"),

  body("endTime")
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/)
    .withMessage("End time must be in HH:MM or HH:MM:SS format (e.g., 17:00 or 17:00:00)")
    .custom((value, { req }) => {
      // Validate endTime is after startTime if both are provided
      if (value && req.body.startTime) {
        const start = req.body.startTime.split(':').map(Number);
        const end = value.split(':').map(Number);

        const startMinutes = start[0] * 60 + start[1];
        const endMinutes = end[0] * 60 + end[1];

        if (endMinutes <= startMinutes) {
          throw new Error('End time must be after start time');
        }
      }
      return true;
    }),

  body("notes")
    .optional()
    .isLength({ max: 1000 })
    .withMessage("Notes must not exceed 1000 characters"),

  body("notifyParent")
    .optional()
    .isBoolean()
    .withMessage("notifyParent must be a boolean")
    .toBoolean(),

  body("classroomId")
    .notEmpty()
    .withMessage("Classroom ID is required")
    .isInt()
    .withMessage("Classroom ID must be a valid integer"),
];

export const validateListActivities: ValidationChain[] = [
  query("activityType")
    .optional({ values: "falsy" })
    .isIn(Object.values(ActivityType))
    .withMessage(`Activity type must be one of: ${Object.values(ActivityType).join(", ")}`),

  query("studentId")
    .optional({ values: "falsy" })
    .isInt({ min: 1 })
    .withMessage("Student ID must be a positive integer")
    .toInt(),

  query("parentId")
    .optional({ values: "falsy" })
    .isInt({ min: 1 })
    .withMessage("Parent ID must be a positive integer")
    .toInt(),

  query("teacherId")
    .optional({ values: "falsy" })
    .isInt({ min: 1 })
    .withMessage("Teacher ID must be a positive integer")
    .toInt(),

  query("startDate")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("startDate must be a valid ISO 8601 date"),

  query("endDate")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("endDate must be a valid ISO 8601 date"),

  query("pos")
    .optional({ values: "falsy" })
    .isInt({ min: 0 })
    .withMessage("pos must be a non-negative integer")
    .toInt(),

  query("delta")
    .optional({ values: "falsy" })
    .isInt({ min: 1, max: 100 })
    .withMessage("delta must be between 1 and 100")
    .toInt(),

  query("sortBy")
    .optional({ values: "falsy" })
    .isString()
    .withMessage("Sort by must be createdAt, updatedAt"),

  query("sortOrder")
    .optional({ values: "falsy" })
    .isString()
    .withMessage("Sort order must be ASC or DESC"),
];

export const validateDeleteActivity = validateActivityId;

// Legacy exports for backward compatibility
export const validateCreateMealLog = validateCreateActivity;
export const validateMealLogId = validateActivityId;
export const validateUpdateMealLog = validateUpdateActivity;
export const validateListMealLogs = validateListActivities;
export const validateDeleteMealLog = validateDeleteActivity;
