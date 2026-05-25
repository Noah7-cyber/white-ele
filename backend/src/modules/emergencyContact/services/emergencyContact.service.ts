import { EmergencyContactRepository } from "../../core/EmergencyContactRepository";
import { Emergency } from "../../shared/entities/Emergency";
import { logger } from "../../shared";
import { EntityManager } from "typeorm";



class EmergencyContactService {
    private emergencyContactRepository: EmergencyContactRepository;

    constructor() {
        this.emergencyContactRepository = new EmergencyContactRepository();
    }
    async createEmergencyContact(data: Partial<Emergency>, options?: { manager?: EntityManager}): Promise<Emergency> {
        try{
            let contact
            if (options?.manager) {
                contact = options.manager.create(Emergency, data);
                contact = await options.manager.save(contact); 
            }
            else{
                contact = await this.emergencyContactRepository.create(data);
            }
            
            return contact;
        }catch (error: any) {
            logger.error("Error creating emergency contact record:", error);
            throw new Error("Failed to create emergency contact record");
        }
        
    }
}

export const emergencyContactService = new EmergencyContactService();