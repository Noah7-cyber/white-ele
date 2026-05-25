import { Repository } from "typeorm";
import { AppDataSource } from "./config/database";
import { Curriculum } from "../shared/entities/Curriculum";

export class CurriculumRepository {
    private repository: Repository<Curriculum>;

    constructor() {
        this.repository = AppDataSource.getRepository(Curriculum);
    }
    createQueryBuilder(alias = "tourEvent") {
        return this.repository.createQueryBuilder(alias);
    }

    async create(data: Partial<Curriculum>): Promise<Curriculum> {
        const document = this.repository.create(data);
        return this.repository.save(document);
    }

}