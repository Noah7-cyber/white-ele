import { Repository} from "typeorm";
import { AppDataSource } from "./config/database";
import { TourQuestion } from "../shared/entities/TourQuestion";

export class TourQuestionRepository {
    private repository: Repository<TourQuestion>;

    constructor() {
        this.repository = AppDataSource.getRepository(TourQuestion);
    }
    createQueryBuilder(alias = "tourQuestion") {
        return this.repository.createQueryBuilder(alias);
    }

    async create(data: Partial<TourQuestion>): Promise<TourQuestion> {
        const document = this.repository.create(data);
        return this.repository.save(document);
    }

    
}

