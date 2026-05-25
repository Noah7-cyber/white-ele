import { query } from "express-validator";
import { WeekDay } from "../../shared/entities";
import { dayExist, startTimeExist, endTimeExist, tourEventIdExist } from "../validator/tourAvailability.validator";


export const getAllTourAvailabilityValidation = [
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

    // TOUR EVENT ID
    query("tourEventId")
        .optional()
        .isInt({ min: 1 })
        .withMessage("tourEventId must be a positive integer")
        .bail()
        .custom(tourEventIdExist),

    // Pagination (optional)
    query("pos")
        .optional()
        .isInt({ min: 0 })
        .withMessage("pos must be a positive integer"),

    query("delta")
        .optional()
        .isInt({ min: 1 })
        .withMessage("delta must be at least 1"),
];
