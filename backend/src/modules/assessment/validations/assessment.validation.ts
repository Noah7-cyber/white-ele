import { body } from "express-validator";
import { AssessmentType, AssessmentStatus } from "../../shared/entities/EntityEnums";
import { TermEnum } from "../../shared/entities/EntityEnums";

export const createAssessmentSchema = [
    body('title')
        .notEmpty().withMessage('Title is required').trim()
        .isLength({ min: 3 })
        .withMessage('Title must be at least 3 characters long'),

    body('assessmentType')
        .isIn(Object.values(AssessmentType))
        .withMessage('Invalid assessment type'),

    body('subjectId')
        .isInt()
        .withMessage('Subject ID is required'),

    body('totalScore')
        .isInt({ min: 1 })
        .withMessage('Total score must be a positive integer'),

    body('academicYear')
        .notEmpty()
        .withMessage('Academic year is required'),

    body('term')
        .isIn(Object.values(TermEnum))
        .withMessage('Invalid term'),

    body('classroomIds')
        .isArray({ min: 1 })
        .withMessage('At least one classroom ID is required'),

    body('classroomIds.*')
        .isInt()
        .withMessage('Each classroom ID must be an integer'),

    body('assignedStaffId')
        .isInt()
        .withMessage('Assigned staff ID is required'),

    body('dateAssigned')
        .isISO8601()
        .toDate()
        .withMessage('Valid assignment date is required'),

    body('dueDate')
        .optional()
        .isISO8601()
        .toDate()
        .withMessage('Valid due date is required'),

    body('description')
        .optional()
        .isString(),

    body("attachmentsUrl")
        .optional()
        .isArray()
        .withMessage("Subject attachments must be an array"),

    body("attachmentsUrl.*")
        .custom(v => typeof v === "object" && v !== null && !Array.isArray(v))
        .withMessage("Each attachment must be an object"),

    body("attachmentsUrl.*.url")
        .exists({ checkFalsy: true })
        .withMessage("Attachment url is required")
        .isString()
        .withMessage("Attachment url must be a string")
        .isURL()
        .withMessage("Attachment url must be a valid URL"),

    body("attachmentsUrl.*.name")
        .exists({ checkFalsy: true })
        .withMessage("Attachment name is required")
        .isString()
        .withMessage("Attachment name must be a string")
        .isLength({ min: 1 })
        .withMessage("Attachment name cannot be empty"),
];

export const updateAssessmentSchema = [
    body('title')
        .optional()
        .notEmpty()
        .trim()
        .isLength({ min: 3 })
        .withMessage('Title must be at least 3 characters long'),

    body('assessmentType')
        .optional()
        .isIn(Object.values(AssessmentType))
        .withMessage('Invalid assessment type'),

    body('totalScore')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Total score must be a positive integer'),

    body('academicYear')
        .optional()
        .notEmpty()
        .withMessage('Academic year is required'),

    body('term')
        .optional()
        .isIn(Object.values(TermEnum))
        .withMessage('Invalid term'),


    body('dateAssigned')
        .optional()
        .isISO8601()
        .toDate()
        .withMessage('Valid assignment date is required'),

    body('dueDate')
        .optional()
        .isISO8601()
        .toDate()
        .withMessage('Valid due date is required'),

    body('description')
        .optional()
        .isString()
        .withMessage('Description must be a string'),

    body('classroomIds')
        .optional()
        .isArray()
        .withMessage('Classroom IDs must be an array'),

    body('classroomIds.*')
        .optional()
        .isInt()
        .withMessage('Each classroom ID must be an integer'),

    body('subjectId')
        .optional()
        .isInt()
        .withMessage('Subject ID is required'),

    body('assignedStaffId')
        .optional()
        .isInt()
        .withMessage('Assigned staff ID is required'),

    body('status')
        .optional()
        .isIn(Object
            .values(AssessmentStatus))
        .withMessage('Invalid assessment status'),

    body("attachmentsUrl")
        .optional()
        .isArray()
        .withMessage("Subject attachments must be an array"),

    body("attachmentsUrl.*")
        .custom(v => typeof v === "object" && v !== null && !Array.isArray(v))
        .withMessage("Each attachment must be an object"),

    body("attachmentsUrl.*.url")
        .exists({ checkFalsy: true })
        .withMessage("Attachment url is required")
        .isString()
        .withMessage("Attachment url must be a string")
        .isURL()
        .withMessage("Attachment url must be a valid URL"),

    body("attachmentsUrl.*.name")
        .exists({ checkFalsy: true })
        .withMessage("Attachment name is required")
        .isString()
        .withMessage("Attachment name must be a string")
        .isLength({ min: 1 })
        .withMessage("Attachment name cannot be empty"),
];

export const recordAssessmentScore = [
    body('milestoneId')
        .optional()
        .isInt()
        .withMessage('Milestone ID must be an integer'),

    body('grades')
        .optional()
        .isArray()
        .withMessage('Grades must be an array'),

    body('grades.*')
        .optional()
        .custom(v => typeof v === 'number' || typeof v === 'string')
        .withMessage('Each grade must be a number or a string'),

    body('observations')
        .optional()
        .isArray()
        .withMessage('Observations must be an array'),

    body('studentIds')
        .isArray({ min: 1 })
        .withMessage('Student IDs array is required'),

    body('studentIds.*')
        .isInt()
        .withMessage('Each student ID must be an integer'),
];

