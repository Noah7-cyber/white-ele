import { MedicalRepository } from "../../core/MedicalRepository"; 
import { Medical } from "../../shared/entities/Medical"; 
import { logger } from "../../shared";
import { EntityManager } from "typeorm";



class MedicalService {
    private medicalRepository: MedicalRepository;

    constructor() {
        this.medicalRepository = new MedicalRepository();
    }
    async createMedicalRecord(data: Partial<Medical>, options?: { manager?: EntityManager}): Promise<Medical> {
        try{
            
           let record: Medical;

            // 🔹 Use transaction manager if provided
            if (options?.manager) {
                record = options.manager.create(Medical, data); // 🔹 CHANGED
                record = await options.manager.save(record);    // 🔹 CHANGED
            } else {
                // 🔹 Fallback to repository
                record = await this.medicalRepository.create(data); // 🔹 CHANGED
            }

            return record;
        }catch (error: any) {
            logger.error("Error creating medical record:", error);
            throw new Error("Failed to create medical record");
        }
        
    }
}

export const medicalService = new MedicalService();