import { Repository, LessThan, MoreThan } from "typeorm";
import { AppDataSource } from "./config/database";
import { TourAvailability } from "../shared/entities/TourAvailability";
import { WeekDay } from "../shared/entities";

export class TourAvailabilityRepository {
    private repository: Repository<TourAvailability>;

    constructor() {
        this.repository = AppDataSource.getRepository(TourAvailability);
    }

    createQueryBuilder(alias = "tourAvailability") {
        return this.repository.createQueryBuilder(alias);
    }

    async create(data: Partial<TourAvailability>): Promise<TourAvailability> {
        const document = this.repository.create(data);
        return this.repository.save(document);
    }

    async findOverlap(tourEventId: number, day: WeekDay, startTime: string, endTime: string) {
        return this.repository.findOne({
            where: {
            tourEventId,
            day,
            startTime: LessThan(endTime),   // existing.start < new.end
            endTime: MoreThan(startTime),   // existing.end > new.start
        },
    });
}

}