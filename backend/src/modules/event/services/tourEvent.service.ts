import { TourEventRepository } from "../../core/TourEventRepository";
import { TourEvent } from "../../shared/entities/TourEvent"; 
import { logger } from "../../shared";
import { EntityManager } from "typeorm";
import { WeekDay } from "../../shared/entities";

export interface TourEventFilters {
  pos?: number;              // pagination start
  delta?: number;            // pagination size
  search?: string;           // search by title/description
  day?: WeekDay;             // filter by weekday
  startTime?: string;        // filter availability start time (24-hour format)
  endTime?: string;          // filter availability end time (24-hour format)
  schoolId?: number;         // filter by schoolId
}

export interface ServiceError{
    error: boolean;
    message: string;
    code?: number;
}

class TourEventService {
    private tourEventRepository: TourEventRepository;

    constructor() {
        this.tourEventRepository = new TourEventRepository();
    }
    async createTourEvent(data: Partial<TourEvent>, options?: { manager?: EntityManager}): Promise<TourEvent | ServiceError>{
        try{

            if (!data.url) {
                return {error: true, code: 400, message: "URL is required"}
            }
           
            // 🔹 Check if URL already exists
            const existing = await this.tourEventRepository.findByUrl(data.url);

            if (existing) {
                return {error: true, code: 400, message: "URL already exists"}
            }

            
           let event: TourEvent;

            // 🔹 Use transaction manager if provided
            if (options?.manager) {
                event = options.manager.create(TourEvent, data); 
                event = await options.manager.save(event); 
            } else {
                // 🔹 Fallback to repository
                event = await this.tourEventRepository.create(data); 
            }

            return event;
        }catch (error: any) {
            console.log(error)
            logger.error("Error creating Tour Event:", error);
            throw new Error("Failed to create tour event");
        }
        
    }

    async getAllTourEvents(filters?: TourEventFilters): Promise<{
        success: boolean;
        message: string;
        tourEvents: TourEvent[];
        pagination?: { pos: number; delta: number; count: number };
    }> {
        try {
            const queryBuilder = this.tourEventRepository
                .createQueryBuilder("tourEvent")
                .distinct(true)
                .leftJoinAndSelect("tourEvent.availability", "availability")
                .leftJoinAndSelect("tourEvent.tourQuestions", "questions");
    
            // Filter by schoolId if provided (required for multi-tenant isolation)
            if (filters?.schoolId !== undefined) {
                queryBuilder.where("tourEvent.schoolId = :schoolId", { schoolId: filters.schoolId });
            }

            // Optional: Filter by Availability start Time
            if (filters?.startTime) {
                queryBuilder.andWhere(`CAST(availability.startTime AS TIME) = CAST(:startTime AS TIME)`, {
                    startTime: filters.startTime
                });
            }
    
            // Optional: Filter by Availability end Time
            if (filters?.endTime) {
                queryBuilder.andWhere(`CAST(availability.endTime AS TIME) = CAST(:endTime AS TIME)`, {
                    endTime: filters.endTime
                });
            }
    
            // 🔍 Search by title or description
            if (filters?.search) {
                queryBuilder.andWhere(`
                    (LOWER(tourEvent.title) LIKE LOWER(:search)
                    OR LOWER(tourEvent.description) LIKE LOWER(:search))
                `, { search: `%${filters.search}%` });
            }

            // 🔍 Filter events that have availability on a specific day
            if (filters?.day) {
                queryBuilder.andWhere("availability.day = :day", { day: filters.day });
            }
    
            // Order by most recent first (you can switch to ASC if you prefer)
            queryBuilder.orderBy("tourEvent.createdAt", "DESC");
    
            const pos = filters?.pos ?? 0;
            const delta = filters?.delta ?? 10;
    
            const [tourEvents, count] = await queryBuilder.skip(pos).take(delta).getManyAndCount();
                
    
            return {
                success: true,
                message: "Tour events retrieved successfully",
                tourEvents,
                pagination: { pos, delta, count },
            };
        } catch (error: any) {
            logger?.error?.(error, error);
            throw new Error("Failed to fetch tour events");
        }
    }
    async getTourEventById(id: number): Promise<TourEvent | null> {
        try {
            const tourEvent = await this.tourEventRepository
                .createQueryBuilder("tourEvent")
                .leftJoinAndSelect("tourEvent.availability", "availability")
                .leftJoinAndSelect("tourEvent.tourQuestions", "questions")
                .where("tourEvent.id = :id", { id })
                .getOne();
            return tourEvent || null;
        } catch (error: any) {
            logger?.error?.(error, error);
            throw new Error("Failed to fetch tour event by ID");
        }

    }

    async clientGetTourEventById(id: number): Promise<TourEvent | null> {
    try {
        const tourEvent = await this.tourEventRepository
            .createQueryBuilder("tourEvent")
            .leftJoinAndSelect("tourEvent.availability", "availability")
            .leftJoinAndSelect("availability.slots", "slots")
            .leftJoinAndSelect("slots.bookings", "slotBookings")
            .leftJoinAndSelect("tourEvent.tourQuestions", "questions")
            .where("tourEvent.id = :id", { id })
            .getOne();

        if (!tourEvent) return null;

        const interval = tourEvent.timeSlotInterval || 15;
        const today = new Date();
        const weekdayNames = [
            "Sunday", "Monday", "Tuesday", "Wednesday",
            "Thursday", "Friday", "Saturday",
        ];

        for (const availability of tourEvent.availability ?? []) {
            const dbOriginalSlots = [...(availability.slots ?? [])];
            if (!availability.slots) availability.slots = [];

            const upcomingSlots: Array<{
                id?: number;
                availabilityId: number;
                date: string;
                startTime: string;
                bookings: any[];
                booked: boolean;
            }> = [];

            for (let i = 0; i < 30; i++) {
                const date = new Date(today);
                date.setDate(today.getDate() + i);
                if (weekdayNames[date.getDay()] !== availability.day) continue;
                const dateString = date.toISOString().split("T")[0];

                let nextAvailableTimeMinutes: number | null = null;

                const generatedSlots = availability.generateSlots(dateString!, interval) ?? [];
                const dbSlotsForDate = dbOriginalSlots.filter((s) => s.date === dateString);

                for (const genSlot of generatedSlots) {
                    const startParts = genSlot.startTime.split(":").map(Number);
                    let startMinutes = startParts[0]! * 60 + startParts[1]!;

                    // Ensure slot starts after previous booking + duration + afterTour
                    if (nextAvailableTimeMinutes !== null && startMinutes < nextAvailableTimeMinutes) {
                        startMinutes = nextAvailableTimeMinutes;
                    }

                    const hh = Math.floor(startMinutes / 60).toString().padStart(2, "0");
                    const mm = (startMinutes % 60).toString().padStart(2, "0")
                    const newStartTime = `${hh}:${mm}:00`

                    // Match DB slot using final newStartTime
                    const dbMatch = dbSlotsForDate.find((db) => db.startTime === newStartTime);

                    // Check if this slot is blocked due to beforeTour
                    let beforeBlocked = false;
                    if (tourEvent.beforeTour && dbOriginalSlots.length > 0) {
                        for (const bookedSlot of dbOriginalSlots.filter(s => s.bookings?.length! > 0)) {
                            const bookedStartParts = bookedSlot.startTime.split(":").map(Number);
                            const bookedStartMinutes = bookedStartParts[0]! * 60 + bookedStartParts[1]!;

                            // Slot end time
                            const slotEndMinutes = startMinutes + (tourEvent.duration || 0);

                            // If slot end encroaches into booked start - beforeTour
                            if (slotEndMinutes > bookedStartMinutes - (tourEvent.beforeTour || 0) &&
                                startMinutes < bookedStartMinutes) {
                                beforeBlocked = true;
                                break;
                            }
                        }
                    }

                    const isBlocked = dbMatch?.bookings?.length! > 0 || beforeBlocked;

                    upcomingSlots.push({
                        id: dbMatch?.id,
                        availabilityId: genSlot.availabilityId ?? availability.id,
                        date: genSlot.date,
                        startTime: newStartTime,
                        bookings: dbMatch?.bookings ?? [],
                        booked: isBlocked,
                    });

                    // Update nextAvailableTimeMinutes for afterTour logic
                    if (dbMatch?.bookings?.length! > 0) {
                        const occupied = (tourEvent.duration || 0) + (tourEvent.afterTour || 0);
                        nextAvailableTimeMinutes = startMinutes + occupied;
                    } else {
                        nextAvailableTimeMinutes = startMinutes + interval;
                    }
                }
            }

            (availability as any).slots = upcomingSlots;
        }

        return tourEvent;
    } catch (error: any) {
        console.log(error);
        logger?.error?.(error, error);
        throw new Error("Failed to fetch tour event by ID");
    }
}

    async deleteTourEventById(id: number): Promise<void> {
        try {
            await this.tourEventRepository.softDelete(id);
        } catch (error: any) {
            logger?.error?.(error, error);
            throw new Error("Failed to delete tour event by ID");
        }
    }



}

export const tourEventService = new TourEventService();