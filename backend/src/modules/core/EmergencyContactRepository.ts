import { Repository } from "typeorm";
import { AppDataSource } from "./config/database";
import { Emergency } from "../shared/entities/Emergency"; 

export class EmergencyContactRepository {
    private repository: Repository<Emergency>;

    constructor() {
        this.repository = AppDataSource.getRepository(Emergency);
    }

    async create(data: Partial<Emergency>): Promise<Emergency> {
        const document = this.repository.create(data);
        return this.repository.save(document);
    }

}