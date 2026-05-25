import { body, param, query } from "express-validator";
import { BookingStatus, GUEST_REFERRAL_SOURCE, PaymentMethod } from "../../shared/entities/EntityEnums";

const allowedTourBookingStatusUpdates = [
    ...new Set([...Object.values(BookingStatus), "withdrawn"]),
];

export const listAdmissionsValidation = [
    query("search").optional().isString(),
    query("startDate").optional().isISO8601(),
    query("endDate").optional().isISO8601(),
    query("pos").optional().isInt({ min: 0 }).toInt(),
    query("delta").optional().isInt({ min: 1, max: 100 }).toInt(),
    query("isAdmission")
        .optional()
        .isIn(["true", "false"])
        .withMessage("isAdmission must be true or false when provided"),
];



export const tourBookingValidation = [
    body("names")
        .notEmpty().withMessage("names is required")
        .isArray().withMessage("names must be an array")
        .custom((value) => {
            if (!Array.isArray(value) || value.length === 0) {
                throw new Error("names must be a non-empty array");
            }
            return true;
        })
        .custom((value) => {
            if (!value.every((name: any) => typeof name === "string")) {
                throw new Error("All names must be strings");
            }
            return true;
        })
        .custom((value) => {
            if (value.some((name: string) => name.length > 50)) {
                throw new Error("Each name can have a maximum length of 50 characters");
            }
            return true;
        }),

    body("email")
        .notEmpty().withMessage("email is required")
        .isEmail().withMessage("Invalid email format")
        .isLength({ max: 50 }).withMessage("email can have a maximum length of 50 characters")
        .normalizeEmail(),

    body("note")
        .optional()
        .isString().withMessage("note must be a string")
        .isLength({ max: 500 }).withMessage("note can have a maximum length of 500 characters")
        .trim(),

    body("guests")
        .optional()
        .isArray().withMessage("guests must be an array"),

    body("referralSource")
        .optional()
        .isIn(Object.values(GUEST_REFERRAL_SOURCE))
        .withMessage(`Invalid referralSource. Must be one of: ${Object.values(GUEST_REFERRAL_SOURCE).join(", ")}`),


    body("tourEventId")
        .notEmpty().withMessage("tourEventId is required")
        .isInt({ min: 1 }).withMessage("tourEventId must be a positive integer"),

    
    body("availabilityId")
        .notEmpty().withMessage("availabilityId is required")
        .isInt({ min: 1 }).withMessage("tourEventId must be a positive integer"),


    // DATE
    body("date")
        .notEmpty().withMessage("date is required")
        .isISO8601().withMessage("date must be in ISO 8601 format"),

    body("startTime")
        .notEmpty().withMessage("startTime is required")
        .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9](?::[0-5][0-9])?$/)
        .withMessage("Invalid startTime format, expected HH:MM or HH:MM:SS"),
];

export const updateBookingAcceptedValidation = [
    body("accepted")
        .optional()
        .isBoolean().withMessage("accepted must be a boolean value"),
    body("complete")
        .optional()
        .isBoolean().withMessage("complete must be a boolean value"),
    body("status")
        .optional()
        .isIn(allowedTourBookingStatusUpdates)
        .withMessage(`status must be one of: ${allowedTourBookingStatusUpdates.join(", ")}`),
    body("reschedule")
        .optional()
        .isObject().withMessage("reschedule must be an object"),
    body("reschedule.slotId")
        .optional()
        .isInt({ min: 1 }).withMessage("reschedule.slotId must be a positive integer"),
    body("reschedule.date")
        .optional()
        .isISO8601().withMessage("reschedule.date must be in ISO 8601 format"),
    body("reschedule.startTime")
        .optional()
        .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9](?::[0-5][0-9])?$/)
        .withMessage("Invalid reschedule.startTime format, expected HH:MM or HH:MM:SS"),
    body().custom((value) => {
        if (value.accepted === undefined && value.complete === undefined && value.status === undefined && !value.reschedule) {
            throw new Error("At least one of 'accepted', 'complete', 'status', or 'reschedule' must be provided");
        }
        // If reschedule object exists, slotId is required
        if (value.reschedule && !value.reschedule.slotId) {
            throw new Error("reschedule.slotId is required when reschedule object is provided");
        }
        // At least one of date or startTime must be provided in reschedule
        if (value.reschedule && value.reschedule.date === undefined && value.reschedule.startTime === undefined) {
            throw new Error("At least one of 'reschedule.date' or 'reschedule.startTime' must be provided");
        }
        return true;
    }),
];

export const getBookingByIdValidation = [
    param("id").isInt({ min: 1 }).withMessage("Booking ID must be a positive integer"),
];

export const sendOfferValidation = [
    body("bookedTourId")
        .optional()
        .isInt({ min: 1 }).withMessage("bookedTourId must be a positive integer"),

    body("formResponseId")
        .optional()
        .isInt({ min: 1 }).withMessage("formResponseId must be a positive integer"),

    body().custom((bodyVal: Record<string, unknown>) => {
        const tourId = bodyVal["bookedTourId"];
        const formId = bodyVal["formResponseId"];
        const hasTour = tourId !== undefined && tourId !== null && tourId !== "";
        const hasForm = formId !== undefined && formId !== null && formId !== "";
        if (hasTour === hasForm) {
            throw new Error("Provide exactly one of bookedTourId or formResponseId");
        }
        return true;
    }),

    body("parent")
        .notEmpty().withMessage("parent is required")
        .isObject().withMessage("parent must be an object"),

    body("parent.firstName")
        .notEmpty().withMessage("parent.firstName is required")
        .isString().withMessage("parent.firstName must be a string")
        .isLength({ max: 50 }).withMessage("parent.firstName must not exceed 50 characters"),

    body("parent.lastName")
        .notEmpty().withMessage("parent.lastName is required")
        .isString().withMessage("parent.lastName must be a string")
        .isLength({ max: 50 }).withMessage("parent.lastName must not exceed 50 characters"),

    body("students")
        .notEmpty().withMessage("students is required")
        .isArray({ min: 1 }).withMessage("students must be a non-empty array"),

    body("students.*.firstName")
        .notEmpty().withMessage("Student first name is required")
        .isString().withMessage("Student first name must be a string")
        .isLength({ max: 50 }).withMessage("Student first name must not exceed 50 characters"),

    body("students.*.lastName")
        .notEmpty().withMessage("Student last name is required")
        .isString().withMessage("Student last name must be a string")
        .isLength({ max: 50 }).withMessage("Student last name must not exceed 50 characters"),

    body("students.*.classroomId")
        .notEmpty().withMessage("Student classroomId is required")
        .isInt({ min: 1 }).withMessage("Student classroomId must be a positive integer"),

    body("students.*.dateOfBirth")
        .notEmpty().withMessage("Student dateOfBirth is required")
        .isISO8601().withMessage("Student dateOfBirth must be a valid ISO 8601 date"),

    body("items")
        .notEmpty().withMessage("items is required")
        .isArray({ min: 1 }).withMessage("items must be a non-empty array"),

    body("items.*.description")
        .notEmpty().withMessage("Item description is required")
        .isString().withMessage("Item description must be a string")
        .isLength({ max: 255 }).withMessage("Item description must not exceed 255 characters"),

    body("items.*.quantity")
        .notEmpty().withMessage("Item quantity is required")
        .isInt({ min: 1 }).withMessage("Item quantity must be a positive integer"),

    body("items.*.rate")
        .notEmpty().withMessage("Item rate is required")
        .isNumeric().withMessage("Item rate must be a number")
        .custom((value) => {
            if (value < 0) {
                throw new Error("Item rate cannot be negative");
            }
            return true;
        }),

    body("items.*.tax")
        .optional()
        .isInt({ min: 0, max: 100 }).withMessage("Item tax must be an integer between 0 and 100 (representing percentage)"),

    body("notes")
        .optional()
        .isString().withMessage("Notes must be a string"),

    body("bankAccountId")
        .optional()
        .isInt({ min: 1 })
        .withMessage("bankAccountId must be a positive integer"),

    body("paymentMethod")
        .optional()
        .isIn(Object.values(PaymentMethod))
        .withMessage(`paymentMethod must be one of: ${Object.values(PaymentMethod).join(", ")}`),

    body("email")
        .notEmpty().withMessage("email is required")
        .isObject().withMessage("email must be an object"),

    body("email.receipient")
        .notEmpty().withMessage("email.receipient is required")
        .isEmail().withMessage("email.receipient must be a valid email address"),

    body("email.subject")
        .notEmpty().withMessage("email.subject is required")
        .isString().withMessage("email.subject must be a string"),

    body("email.body")
        .notEmpty().withMessage("email.body is required")
        .isString().withMessage("email.body must be a string"),

    body("email.attachment")
        .optional()
        .isArray().withMessage("email.attachment must be an array")
        .custom((value) => {
            if (Array.isArray(value) && !value.every((item: any) => typeof item === "string")) {
                throw new Error("All attachment items must be strings");
            }
            return true;
        }),
];

export const resendOfferValidation = [
    body("bookedTourId")
        .optional()
        .isInt({ min: 1 })
        .withMessage("bookedTourId must be a positive integer"),

    body("formResponseId")
        .optional()
        .isInt({ min: 1 })
        .withMessage("formResponseId must be a positive integer"),

    body().custom((bodyVal: Record<string, unknown>) => {
        const tourId = bodyVal["bookedTourId"];
        const formId = bodyVal["formResponseId"];
        const hasTour = tourId !== undefined && tourId !== null && tourId !== "";
        const hasForm = formId !== undefined && formId !== null && formId !== "";
        if (hasTour === hasForm) {
            throw new Error("Provide exactly one of bookedTourId or formResponseId");
        }
        return true;
    }),

    body("bankAccountId")
        .optional()
        .isInt({ min: 1 })
        .withMessage("bankAccountId must be a positive integer"),

    body("email")
        .optional()
        .isObject()
        .withMessage("email must be an object when provided"),

    body("email.receipient")
        .optional()
        .isEmail()
        .withMessage("email.receipient must be a valid email address"),

    body("email.subject")
        .optional()
        .isString()
        .withMessage("email.subject must be a string"),

    body("email.body")
        .optional()
        .isString()
        .withMessage("email.body must be a string"),

    body("email.attachment")
        .optional()
        .isArray().withMessage("email.attachment must be an array")
        .custom((value) => {
            if (Array.isArray(value) && !value.every((item: any) => typeof item === "string")) {
                throw new Error("All attachment items must be strings");
            }
            return true;
        }),
];