import { query } from "express-validator";
import { InputType } from "../../shared/entities/EntityEnums";
import { tourEventIdExist, inputTypeExist } from "../validator/tourQuestion.validator";

export const getAllTourQuestionsValidation = [
    query("tourEventId")
        .optional()
        .isInt({ min: 1 })
        .withMessage("tourEventId must be a positive integer")
        .bail()
        .custom(tourEventIdExist),

    query("inputType")
        .optional()
        .isIn(Object.values(InputType))
        .withMessage(`inputType must be one of: ${Object.values(InputType).join(", ")}`)
        .bail()
        .custom(inputTypeExist)
];
