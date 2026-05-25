import { TourAvailabilityRepository } from "../../core/TourAvailabilityRepository";
import { TourAvailability } from "../../shared/entities/TourAvailability"; 
import { logger } from "../../shared";
import { EntityManager } from "typeorm";
import { WeekDay } from "../../shared/entities";

export interface AvailabilityFilters {
    day?: WeekDay;
    startTime?: string;
    endTime?: string;
    tourEventId?: number;
    pos?: number;
    delta?: number;
}



class TourAvailabilityService {
    private tourAvailabilityRepository: TourAvailabilityRepository;

    constructor() {
        this.tourAvailabilityRepository = new TourAvailabilityRepository();
    }
    async createTourAvailabilty(data: Partial<TourAvailability>, options?: { manager?: EntityManager}): Promise<TourAvailability> {
        try{
            
           //let event: TourAvailability;

            // 🔹 Use transaction manager if provided
            if (options?.manager) {
                const created = options.manager.create(TourAvailability, data); 
                return await options.manager.save(created); 
            } else {
                // 🔹 Fallback to repository
                return await this.tourAvailabilityRepository.create(data); 
            }

        }catch (error: any) {
            logger.error(`Error creating Tour Availability: ${error.message}`, error);
            throw new Error(error);
        }
        
    }


    async getAll(filters?: AvailabilityFilters) {
        try {
            const qb = this.tourAvailabilityRepository
                .createQueryBuilder("availability")
                .leftJoinAndSelect("availability.tourEvent", "tourEvent");

            // Filter by day
            if (filters?.day) {
                qb.andWhere("availability.day = :day", { day: filters.day });
            }

            // Filter by startTime
            if (filters?.startTime) {
                qb.andWhere(
                    `CAST(availability.startTime AS TIME) = CAST(:startTime AS TIME)`,
                    { startTime: filters.startTime }
                );
            }

            // Filter by endTime
            if (filters?.endTime) {
                qb.andWhere(
                    `CAST(availability.endTime AS TIME) = CAST(:endTime AS TIME)`,
                    { endTime: filters.endTime }
                );
            }

            // Filter by parent tour event
            if (filters?.tourEventId) {
                qb.andWhere("availability.tourEventId = :eventId", {
                    eventId: filters.tourEventId,
                });
            }

            // Pagination
            const pos = filters?.pos ?? 0;
            const delta = filters?.delta ?? 10;

            qb.orderBy("availability.createdAt", "DESC");
            

            const [availabilities, count] = await qb.skip(pos).take(delta).getManyAndCount();

            return {
                success: true,
                availabilities,
                pagination: { pos, delta, count },
            };

        } catch (error: any) {
            logger.error("Error fetching availabilities:", error);
            throw new Error("Failed to fetch availabilities");
        }
    }
    async getAvailabilityById(id: number) {
        try {
            const availability = await this.tourAvailabilityRepository
                .createQueryBuilder("availability")
                .leftJoinAndSelect("availability.tourEvent", "tourEvent")
                .where("availability.id = :id", { id })
                .getOne();

            if (!availability) {
                return null;
            }

            return {
                success: true,
                availability,
            };
        } catch (error: any) {
            logger.error(`Error fetching availability by ID: ${error.message}`, error);
            throw new Error("Failed to fetch availability by ID");
        }
    }

}

export const tourAvailabilityService = new TourAvailabilityService();