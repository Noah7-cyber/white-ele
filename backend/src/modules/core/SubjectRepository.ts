import { Repository } from "typeorm";
import { AppDataSource } from "./config/database";
import { Subject } from "../shared/entities/Subject";

export class SubjectRepository {
    private repository: Repository<Subject>;

    constructor() {
        this.repository = AppDataSource.getRepository(Subject);
    }
    createQueryBuilder(alias = "subject") {
        return this.repository.createQueryBuilder(alias);
    }

    async create(data: Partial<Subject>): Promise<Subject> {
        const document = this.repository.create(data);
        return this.repository.save(document);
    }

}