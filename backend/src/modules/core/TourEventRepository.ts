import { Repository } from "typeorm";
import { AppDataSource } from "./config/database";
import { TourEvent } from "../shared/entities/TourEvent";

export class TourEventRepository {
    private repository: Repository<TourEvent>;

    constructor() {
        this.repository = AppDataSource.getRepository(TourEvent);
    }
    createQueryBuilder(alias = "tourEvent") {
        return this.repository.createQueryBuilder(alias);
    }

    async create(data: Partial<TourEvent>): Promise<TourEvent> {
        const document = this.repository.create(data);
        return this.repository.save(document);
    }

    async findByUrl(url: string): Promise<TourEvent | null> {
        return this.repository.findOne({ where: { url } });
    }

    async softDelete(id: number): Promise<void> {
        await this.repository.softDelete(id);
    }

}