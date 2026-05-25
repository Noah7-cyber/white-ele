import { Repository } from "typeorm";
import { AppDataSource } from "./config/database";
import { Medical } from "../shared/entities/Medical"; 

export class MedicalRepository {
    private repository: Repository<Medical>;

    constructor() {
        this.repository = AppDataSource.getRepository(Medical);
    }

    async create(data: Partial<Medical>): Promise<Medical> {
        const document = this.repository.create(data);
        return this.repository.save(document);
    }

}