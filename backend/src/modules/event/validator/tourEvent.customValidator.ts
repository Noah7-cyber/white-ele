import { CustomValidator } from "express-validator";
import { Meridiem, WeekDay } from "../../shared/entities";
import { TourEventRepository } from "../../core/TourEventRepository";




const timeToMinutes = (hour: number, minute: number, meridiem: Meridiem) => {
    let h = hour;
    if (meridiem === Meridiem.AM && hour === 12) h = 0;
    else if (meridiem === Meridiem.PM && hour !== 12) h += 12;
    return h * 60 + minute;
};


// Custom validator for a single slot
export const validateAvailabilityTimes: CustomValidator = (slot: any, { req }) => {
    const start = timeToMinutes(slot.startHour, slot.startMinute, slot.startMeridiem);
    const end = timeToMinutes(slot.endHour, slot.endMinute, slot.endMeridiem);

    if (end <= start) {
        throw new Error(`End time must be after start time for day ${slot.day}`);
    }

    // Internal overlap check with other slots in same payload
    const slots = req.body.availability || [];
    for (const other of slots) {
        if (other === slot) continue; // skip self
        if (other.day !== slot.day) continue; // only check same day

        const otherStart = timeToMinutes(other.startHour, other.startMinute, other.startMeridiem);
        const otherEnd = timeToMinutes(other.endHour, other.endMinute, other.endMeridiem);

        const overlap = start < otherEnd && end > otherStart;
        if (overlap) {
            throw new Error(`Availability slot for ${slot.day} overlaps with another slot`);
        }
    }

    return true;
};



/**
 * Check if any TourEvent exists with the given day
 */
export const dayExist: CustomValidator = async (value: WeekDay) => {
    if (!value) return true; // allow empty; use .optional() in chain

    const repo = new TourEventRepository();
    const events = await repo.createQueryBuilder("tourEvent")
        .leftJoinAndSelect("tourEvent.availability", "availability")
        .where("availability.day = :day", { day: value })
        .getMany();

    if (events.length === 0) {
        throw new Error(`No tour events found for day '${value}'.`);
    }

    return true;
};

/**
 * Check if any TourEvent exists with the given startTime
 */
export const startTimeExist: CustomValidator = async (value: string) => {
    if (!value) return true;

    const repo = new TourEventRepository();
    const events = await repo.createQueryBuilder("tourEvent")
        .leftJoinAndSelect("tourEvent.availability", "availability")
        .where(`CAST(availability.startTime AS TIME) = CAST(:startTime AS TIME)`, { startTime: value })
        .getMany();

    if (events.length === 0) {
        throw new Error(`No tour events found with startTime '${value}'.`);
    }

    return true;
};

/**
 * Check if any TourEvent exists with the given endTime
 */
export const endTimeExist: CustomValidator = async (value: string) => {
    if (!value) return true;

    const repo = new TourEventRepository();
    const events = await repo.createQueryBuilder("tourEvent")
        .leftJoinAndSelect("tourEvent.availability", "availability")
        .where(`CAST(availability.endTime AS TIME) = CAST(:endTime AS TIME)`, { endTime: value })
        .getMany();

    if (events.length === 0) {
        throw new Error(`No tour events found with endTime '${value}'.`);
    }

    return true;
};

/**
 * Check if any TourEvent exists matching search term in title or description
 */
export const searchExist: CustomValidator = async (value: string) => {
    if (!value) return true;

    const repo = new TourEventRepository();
    const events = await repo.createQueryBuilder("tourEvent")
        .where("LOWER(tourEvent.title) LIKE LOWER(:search) OR LOWER(tourEvent.description) LIKE LOWER(:search)", { search: `%${value}%` })
        .getMany();

    if (events.length === 0) {
        throw new Error(`No tour events found matching search term '${value}'.`);
    }

    return true;
};
