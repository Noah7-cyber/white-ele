import { Repository } from "typeorm";
import { AppDataSource } from "./config/database";
import { School} from "../shared/entities/School";


export class SchoolRepository {
    private repository: Repository<School>;

    constructor() {
        this.repository = AppDataSource.getRepository(School);
    }

    // Find a school by ID
    async findById(id: number): Promise<School | null> {
        return this.repository.findOne({ where: { id } });
    } 

}