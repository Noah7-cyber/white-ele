import { TourQuestionRepository } from "../../core/TourQuestionRepository";
import { TourQuestion } from "../../shared/entities/TourQuestion";
import { logger } from "../../shared";
import { EntityManager } from "typeorm";

export interface TourQuestionFilters {
    tourEventId?: number;  // optional: get questions for a specific tour event
    inputType?: string;    // optional: filter by input type
}

class TourQuestionService {
    private tourQuestionRepository: TourQuestionRepository;

    constructor() {
        this.tourQuestionRepository = new TourQuestionRepository();
    }
    async createTourQuestion(data: Partial<TourQuestion>, options?: { manager?: EntityManager}): Promise<TourQuestion> {
        try{

            // 🔹 Use transaction manager if provided
            if (options?.manager) {
                const created = options.manager.create(TourQuestion, data); 
                return await options.manager.save(created); 
            } else {
                // 🔹 Fallback to repository
                return await this.tourQuestionRepository.create(data); 
            }

        }catch (error: any) {
            logger.error("Error creating Tour Availability:", error);
            throw new Error("Failed to create Tour Availability");
        }
        
    }

    async getAll(filters?: TourQuestionFilters) {
        try {
            const qb = this.tourQuestionRepository.createQueryBuilder("question")
                .leftJoinAndSelect("question.tourEvent", "tourEvent");

            if (filters?.tourEventId) {
                qb.andWhere("question.tourEventId = :tourEventId", { tourEventId: filters.tourEventId });
            }

            if (filters?.inputType) {
                qb.andWhere("question.inputType = :inputType", { inputType: filters.inputType });
            }

            qb.orderBy("question.createdAt", "DESC");

            return await qb.getMany();
        } catch (error: any) {
            logger.error("Error fetching tour questions:", error);
            throw new Error("Failed to fetch tour questions");
        }
    }

    async getQuestionById(id: number) {
        try {
            const question = await this.tourQuestionRepository.createQueryBuilder("question")
                .leftJoinAndSelect("question.tourEvent", "tourEvent")
                .where("question.id = :id", { id })
                .getOne();

            return question || null;
        } catch (error: any) {
            logger.error(`Error fetching tour question by ID: ${error.message}`, error);
            throw new Error("Failed to fetch tour question by ID");
        }
    }

}

export const tourQuestionService = new TourQuestionService();