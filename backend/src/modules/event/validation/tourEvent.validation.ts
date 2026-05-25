import { body, query} from "express-validator";
import { WeekDay, Meridiem, TourBuffer, MinimumNoticeUnit, InputType, TimeSlotInterval } from "../../shared/entities";
import { validateAvailabilityTimes, startTimeExist, endTimeExist, dayExist, searchExist  } from "../validator/tourEvent.customValidator";


export const createTourEventValidation = [
    //BASIC INFO
    body("basicInfo")
    .exists().withMessage("basicInfo is required")
    .isObject().withMessage("basicInfo must be an object"),

    body("basicInfo.title")
    .notEmpty().withMessage("Title is required")
    .isString().withMessage("Title must be a string")
    .isLength({ max: 255 }).withMessage("Title is too long")
    .trim(),

    body("basicInfo.description")
    .notEmpty().withMessage("Description is required")
    .isString().withMessage("Description must be a string")
    .isLength({ max: 500 }).withMessage("Description is too long")
    .trim(),

    body("basicInfo.url")
    .notEmpty().withMessage("URL is required")
    .isString().withMessage("URL must be a string")
    .isLength({ max: 255 }).withMessage("Medications is too long")
    .trim(),

    body("basicInfo.duration")
    .notEmpty().withMessage("Duration is required")
    .isInt().withMessage("Duration must be an integer"),

    body("basicInfo.location")
    .notEmpty().withMessage("Location is required")
    .isString().withMessage("Location must be a string")
    .isLength({ max: 255 }).withMessage("Location is too long")
    .trim(),

    //AVAILABILITY
    body("availability")
    .exists().withMessage("availability is required")
    .isArray({ min: 1 }).withMessage("availability must be a non-empty array"),

    body("availability.*").custom(validateAvailabilityTimes),

    body("availability.*.day")
    .notEmpty().withMessage("Day is required")
    .isIn(Object.values(WeekDay)).withMessage("Invalid day"),

    body("availability.*.startHour")
    .notEmpty().withMessage("Start hour is required")
    .isInt({ min: 1, max: 12 }).withMessage("Start hour must be between 1 and 12"),

    body("availability.*.startMinute")
    .notEmpty().withMessage("Start minute is required")
    .isInt({ min: 0, max: 59 }).withMessage("Start minute must be between 0 and 59"),

    body("availability.*.startMeridiem")
    .notEmpty().withMessage("Start meridiem is required")
    .isIn(Object.values(Meridiem)).withMessage("Invalid meridiem"),

    body("availability.*.endHour")
    .notEmpty().withMessage("End hour is required")
    .isInt({ min: 1, max: 12 }).withMessage("End hour must be between 1 and 12"),

    body("availability.*.endMinute")
    .notEmpty().withMessage("End minute is required")
    .isInt({ min:0, max: 59 }).withMessage("End minute must be between 0 and 59"),

    body("availability.*.endMeridiem")
    .notEmpty().withMessage("End meridiem is required")
    .isIn(Object.values(Meridiem)).withMessage("Invalid meridiem"),

    //NOTIFICATION SETTINGS

    body("notification")
    .exists().withMessage("notification is required")
    .isObject().withMessage("notification must be an object"),

    body("notification.beforeTour")
    .notEmpty().withMessage("Before Tour notification is required")
    .isInt().withMessage("Invalid notification type")
    .isIn(Object.values(TourBuffer)).withMessage("Invalid minutes option"),

    body("notification.afterTour")
    .notEmpty().withMessage("After Tour notification is required")
    .isInt().withMessage("Invalid notification type")
    .isIn(Object.values(TourBuffer)).withMessage("Invalid minutes option"),

    body("notification.minimumNotice")
    .notEmpty().withMessage("Minimum Notice is required")
    .isInt().withMessage("Minimum notice must be an integer"),

    body("notification.minimumNoticeUnit")
    .notEmpty().withMessage("Minimum Notice Unit is required")
    .isIn(Object.values(MinimumNoticeUnit)).withMessage("Invalid unit option"),

    body("notification.timeSlotInterval")
    .notEmpty().withMessage("Time Slot Interval is required")
    .isInt().withMessage("Time Slot Interval must be an integer")
    .isIn(Object.values(TimeSlotInterval)).withMessage("Invalid interval option"),

    body("notification.limitTotalTourDuration")
    .optional()
    .isBoolean().withMessage("Limit total tour duration must be a boolean"),

    body("notification.limitNumberOfUpcomingTours")
    .optional()
    .isBoolean().withMessage("Limit number of upcoming tours must be a boolean"),

    //QUESTIONS

    body("questions")
    .optional()
    .isArray({ min: 1 }).withMessage("availability must be a non-empty array"),

    body("questions.*.inputType")
    .notEmpty().withMessage("Input type is required")
    .isIn(Object.values(InputType)).withMessage("Invalid input type"),

    body("questions.*.label")
    .optional()
    .isString().withMessage("Label must be a string"),

    body("questions.*.placeHolder")
    .optional()
    .isString().withMessage("Placeholder must be a string"),

    
    body("questions.*.placeHolder")
    .optional()
    .isString().withMessage("Placeholder must be a string")
    .trim(),

    body("questions.*.isRequired")
    .optional()
    .isBoolean().withMessage("Is Required must be a boolean"),

    
];


export const getAllTourEventValidation = [
    // DAY
    query("day")
        .optional()
        .isIn(Object.values(WeekDay))
        .withMessage("Invalid day")
        .bail()
        .custom(dayExist),

    // START TIME (expects HH:MM or HH:MM:SS)
    query("startTime")
        .optional()
        .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9](?::[0-5][0-9])?$/)
        .withMessage("Invalid startTime format, expected HH:MM or HH:MM:SS")
        .bail()
        .custom(startTimeExist),

    // END TIME (same format as above)
    query("endTime")
        .optional()
        .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9](?::[0-5][0-9])?$/)
        .withMessage("Invalid endTime format, expected HH:MM or HH:MM:SS")
        .bail()
        .custom(endTimeExist),

    // SEARCH (string, trimmed)
    query("search")
        .optional()
        .isString().withMessage("Search must be a string")
        .isLength({ max: 100 }).withMessage("Search term is too long")
        .trim()
        .bail()
        .custom(searchExist),

    // PAGINATION (optional)
    query("pos")
        .optional()
        .isInt({ min: 0 })
        .withMessage("pos must be a positive integer"),

    query("delta")
        .optional()
        .isInt({ min: 1 })
        .withMessage("delta must be at least 1"),
];

//