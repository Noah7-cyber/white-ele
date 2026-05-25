import { StudentDocumentRepository } from "../../core/StudentDocumentRepository";
import { StudentDocument } from "../../shared/entities/StudentDocument";
import { logger } from "../../shared";
import { EntityManager } from "typeorm";



class StudentDocumentService {
    private studentDocumentRepository: StudentDocumentRepository;

    constructor() {
        this.studentDocumentRepository = new StudentDocumentRepository();
    }
    async createStudentDocument(data: Partial<StudentDocument>, options?: { manager?: EntityManager }): Promise<StudentDocument> {
        try{
            let document: StudentDocument;

            if (options?.manager) {
                document = options.manager.create(StudentDocument, data);
                document = await options.manager.save(StudentDocument, document);
            } else {
                document = await this.studentDocumentRepository.create(data);
            }

            return document;
        }catch (error: any) {
            logger.error("Error creating student document:", error);
            throw new Error("Failed to create student document");
        }
        
    }

    async findById(id: number, relations?: string[]): Promise<StudentDocument | null> {
        return this.studentDocumentRepository.findById(id, relations);
    }

    async deleteStudentDocument(documentId: number): Promise<{ success: boolean; message: string }> {
        try {
            const document = await this.studentDocumentRepository.findById(documentId);
            
            if (!document) {
                return {
                    success: false,
                    message: "Student document not found"
                };
            }

            await this.studentDocumentRepository.remove(document);

            return {
                success: true,
                message: "Student document deleted successfully"
            };
        } catch (error: any) {
            logger.error("Error deleting student document:", error);
            throw new Error(error.message || "Failed to delete student document");
        }
    }
}

export const studentDocumentService = new StudentDocumentService();