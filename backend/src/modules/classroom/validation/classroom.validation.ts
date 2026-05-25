import { body, param, query, ValidationChain } from "express-validator";

// CREATE CLASSROOM VALIDATOR 
export const validateCreateClassroom: ValidationChain[] = [
  body("classroomName")
    .trim()
    .notEmpty()
    .withMessage("Classroom name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Classroom name must be between 2 and 100 characters")
    .matches(/^[a-zA-Z0-9\s\-]+$/)
    .withMessage("Classroom name can only contain letters, numbers, spaces, and hyphens"),

  body("minimumAge")
    .notEmpty()
    .withMessage("Minimum age is required")
    .isInt({ min: 0, max: 18 })
    .withMessage("Minimum age must be between 0 and 18")
    .toInt(),

  body("maximumAge")
    .notEmpty()
    .withMessage("Maximum age is required")
    .isInt({ min: 0, max: 18 })
    .withMessage("Maximum age must be between 0 and 18")
    .toInt()
    .custom((value, { req }) => {
      if (value <= req.body.minimumAge) {
        throw new Error("Maximum age must be greater than minimum age");
      }
      return true;
    }),

  body("maximumCapacity")
    .notEmpty()
    .withMessage("Maximum capacity is required")
    .isInt({ min: 1, max: 100 })
    .withMessage("Maximum capacity must be between 1 and 100")
    .toInt(),

  body("tuitionFee")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Tuition fee must be a positive number")
    .toFloat(),

  body("assignedStaffId")
    .optional()
    .isArray()
    .withMessage("Assigned staff must be an array")
    .custom((value) => {
      if (Array.isArray(value) && value.length > 0) {
        const allIntegers = value.every((id) => Number.isInteger(Number(id)) && Number(id) > 0);
        if (!allIntegers) {
          throw new Error("All assigned staff IDs must be positive integers");
        }
      }
      return true;
    }),

  body("notes")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Notes must not exceed 1000 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must not exceed 500 characters")

];

// UPDATE CLASSROOM VALIDATOR
export const validateUpdateClassroom: ValidationChain[] = [
  param("id")
    .notEmpty()
    .withMessage("Classroom ID is required")
    .isInt()
    .withMessage("Classroom ID must be a valid Integer"),

  body("classroomName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Classroom name must be between 2 and 100 characters")
    .matches(/^[a-zA-Z0-9\s\-]+$/)
    .withMessage("Classroom name can only contain letters, numbers, spaces, and hyphens"),

  body("minimumAge")
    .optional()
    .isInt({ min: 0, max: 18 })
    .withMessage("Minimum age must be between 0 and 18")
    .toInt(),

  body("maximumAge")
    .optional()
    .isInt({ min: 0, max: 18 })
    .withMessage("Maximum age must be between 0 and 18")
    .toInt()
    .custom((value, { req }) => {
      // Only validate if both min and max are provided
      if (value && req.body.minimumAge && value <= req.body.minimumAge) {
        throw new Error("Maximum age must be greater than minimum age");
      }
      return true;
    }),

  body("maximumCapacity")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Maximum capacity must be between 1 and 100")
    .toInt(),

  body("tuitionFee")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Tuition fee must be a positive number")
    .toFloat(),

  body("assignedStaffId")
    .optional()
    .isArray()
    .withMessage("Assigned staff must be an array")
    .custom((value) => {
      if (Array.isArray(value) && value.length > 0) {
        const allIntegers = value.every((id) => Number.isInteger(Number(id)) && Number(id) > 0);
        if (!allIntegers) {
          throw new Error("All assigned staff IDs must be positive integers");
        }
      }
      return true;
    }),

  body("notes")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Notes must not exceed 1000 characters"),

  body("classroomStatus")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("status must type of inactive or active "),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must not exceed 500 characters"),

  body("schoolId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("School ID must be a valid integer"),
];

// GET SINGLE CLASSROOM VALIDATOR 
export const validateGetClassroom: ValidationChain[] = [
  param("id")
    .notEmpty()
    .withMessage("Classroom ID is required")
    .isInt()
    .withMessage("Classroom ID must be a valid integer")
    .toInt(),
];

//  GET ALL CLASSROOMS VALIDATOR 
export const validateGetClassrooms: ValidationChain[] = [
  query("schoolId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("School ID must be a valid integer")
    .toInt(),

  query("pos")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Position must be a non-negative integer")
    .toInt(),

  query("classroomStatus")
    .optional()
    .isIn(["active", "inactive"])
    .withMessage("Invalid classroom status"),

  query("delta")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Delta must be between 1 and 100")
    .toInt(),

  query("search")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Search term must not exceed 100 characters"),

  query("sortBy")
    .optional()
    .isIn([
      "classroomName", "classroomname",
      "level",
      "minimumAge", "minimumage",
      "maximumAge", "maximumage",
      "maximumCapacity", "maximumcapacity",
      "tuitionFee", "tuitionfee",
      "createdAt", "createdat"
    ])
    .withMessage("Invalid sort field"),

  query("sortOrder")
    .optional()
    .isIn(["ASC", "DESC", "asc", "desc"])
    .withMessage("Sort order must be ASC or DESC")
    .toUpperCase(),
];

// DELETE CLASSROOM VALIDATOR
export const validateDeleteClassroom: ValidationChain[] = [
  param("id")
    .notEmpty()
    .withMessage("Classroom ID is required")
    .isInt()
    .withMessage("Classroom ID must be a valid integer")
    .toInt(),
];

// ASSIGN CLASSROOM VALIDATOR
export const validateAssignClassroom: ValidationChain[] = [
  body("classroomId")
    .notEmpty()
    .withMessage("Classroom ID is required")
    .isInt({ min: 1 })
    .withMessage("Classroom ID must be a valid positive integer")
    .toInt(),

  body("studentId")
    .notEmpty()
    .withMessage("Student ID is required")
    .isInt({ min: 1 })
    .withMessage("Student ID must be a valid positive integer")
    .toInt(),
];

// ASSIGN STAFF TO CLASSROOM VALIDATOR
export const validateAssignStaffToClassroom: ValidationChain[] = [
  body("classroomId")
    .notEmpty()
    .withMessage("Classroom ID is required")
    .isInt({ min: 1 })
    .withMessage("Classroom ID must be a valid positive integer")
    .toInt(),

  body("staffIds")
    .notEmpty()
    .withMessage("Staff IDs are required")
    .isArray()
    .withMessage("Staff IDs must be an array")
    .custom((value) => {
      if (!Array.isArray(value) || value.length === 0) {
        throw new Error("At least one staff ID is required");
      }
      const allIntegers = value.every((id) => Number.isInteger(Number(id)) && Number(id) > 0);
      if (!allIntegers) {
        throw new Error("All staff IDs must be positive integers");
      }
      return true;
    }),
];

// UPDATE STAFF ASSIGNMENT VALIDATOR
export const validateUpdateStaffAssignment: ValidationChain[] = [
  body("staffId")
    .notEmpty()
    .withMessage("Staff ID is required")
    .isInt({ min: 1 })
    .withMessage("Staff ID must be a valid positive integer")
    .toInt(),

  body("previousClassroomId")
    .notEmpty()
    .withMessage("Previous classroom ID is required")
    .isInt({ min: 1 })
    .withMessage("Previous classroom ID must be a valid positive integer")
    .toInt(),

  body("newClassroomId")
    .notEmpty()
    .withMessage("New classroom ID is required")
    .isInt({ min: 1 })
    .withMessage("New classroom ID must be a valid positive integer")
    .toInt(),
];

// REASSIGN CLASSROOM STAFF VALIDATOR
export const validateReassignClassroomStaff: ValidationChain[] = [
  body("classroomId")
    .notEmpty()
    .withMessage("Classroom ID is required")
    .isInt({ min: 1 })
    .withMessage("Classroom ID must be a valid positive integer")
    .toInt(),

  body("staffIds")
    .notEmpty()
    .withMessage("Staff IDs are required")
    .isArray()
    .withMessage("Staff IDs must be an array")
    .custom((value) => {
      if (!Array.isArray(value)) {
        throw new Error("Staff IDs must be an array");
      }
      if (value.length > 0) {
        const allIntegers = value.every((id) => Number.isInteger(Number(id)) && Number(id) > 0);
        if (!allIntegers) {
          throw new Error("All staff IDs must be positive integers");
        }
      }
      return true;
    }),
];

