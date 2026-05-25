import { Repository } from "typeorm";
import { AppDataSource } from "./config/database";
import { StudentDocument } from "../shared/entities/StudentDocument";

export class StudentDocumentRepository {
    private repository: Repository<StudentDocument>;

    constructor() {
        this.repository = AppDataSource.getRepository(StudentDocument);
    }

    async create(data: Partial<StudentDocument>): Promise<StudentDocument> {
        const document = this.repository.create(data);
        return this.repository.save(document);
    }

    async findById(id: number, relations?: string[]): Promise<StudentDocument | null> {
        return this.repository.findOne({
            where: { id },
            relations: relations || []
        });
    }

    async remove(document: StudentDocument): Promise<StudentDocument> {
        return this.repository.remove(document);
    }

}