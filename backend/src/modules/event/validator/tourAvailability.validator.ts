import { CustomValidator } from "express-validator";
import { TourAvailabilityRepository } from "../../core/TourAvailabilityRepository";
import { WeekDay } from "../../shared/entities";

/**
 * Check if any availability exists for the given day
 */
export const dayExist: CustomValidator = async (value: WeekDay) => {
    if (!value) return true;

    const repo = new TourAvailabilityRepository();
    const availabilities = await repo.createQueryBuilder("availability")
        .where("availability.day = :day", { day: value })
        .getMany();

    if (availabilities.length === 0) {
        throw new Error(`No availabilities found for day '${value}'.`);
    }

    return true;
};

/**
 * Check if any availability exists with the given startTime
 */
export const startTimeExist: CustomValidator = async (value: string) => {
    if (!value) return true;

    const repo = new TourAvailabilityRepository();
    const availabilities = await repo.createQueryBuilder("availability")
        .where(`CAST(availability.startTime AS TIME) = CAST(:startTime AS TIME)`, { startTime: value })
        .getMany();

    if (availabilities.length === 0) {
        throw new Error(`No availabilities found with startTime '${value}'.`);
    }

    return true;
};

/**
 * Check if any availability exists with the given endTime
 */
export const endTimeExist: CustomValidator = async (value: string) => {
    if (!value) return true;

    const repo = new TourAvailabilityRepository();
    const availabilities = await repo.createQueryBuilder("availability")
        .where(`CAST(availability.endTime AS TIME) = CAST(:endTime AS TIME)`, { endTime: value })
        .getMany();

    if (availabilities.length === 0) {
        throw new Error(`No availabilities found with endTime '${value}'.`);
    }

    return true;
};

/**
 * Check if any availability exists for the given tourEventId
 */
export const tourEventIdExist: CustomValidator = async (value: number) => {
    if (!value) return true;

    const repo = new TourAvailabilityRepository();
    const availabilities = await repo.createQueryBuilder("availability")
        .where("availability.tourEventId = :id", { id: value })
        .getMany();

    if (availabilities.length === 0) {
        throw new Error(`No availabilities found for tourEventId '${value}'.`);
    }

    return true;
};
