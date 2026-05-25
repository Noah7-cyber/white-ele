import { CustomValidator } from "express-validator";
import { TourQuestionRepository } from "../../core/TourQuestionRepository";
import { InputType } from "../../shared/entities/EntityEnums";

/**
 * Custom validator to check if any questions exist for the given tourEventId
 */
export const tourEventIdExist: CustomValidator = async (value: number) => {
    if (!value) return true; // allow empty; use .optional() in chain

    const repo = new TourQuestionRepository();
    const questions = await repo.createQueryBuilder("tourQuestion")
        .where("tourQuestion.tourEventId = :id", { id: value })
        .getMany();

    if (questions.length === 0) {
        throw new Error(`No questions found for tourEventId '${value}'.`);
    }

    return true;
};

/**
 * Custom validator to check if any questions exist for the given inputType
 */
export const inputTypeExist: CustomValidator = async (value: InputType) => {
    if (!value) return true; // allow empty; use .optional() in chain

    const repo = new TourQuestionRepository();
    const questions = await repo.createQueryBuilder("tourQuestion")
        .where("tourQuestion.inputType = :type", { type: value })
        .getMany();

    if (questions.length === 0) {
        throw new Error(`No questions found with inputType '${value}'.`);
    }

    return true;
};
