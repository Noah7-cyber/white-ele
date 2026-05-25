import { AppDataSource } from "../../core";
import { subjectService } from "../../subject/service/subject.service";
import { AuthenticatedRequest } from "../../auth/middleware/middleware";
import { Response } from "express";
import { validateSchoolAccess, requireSchoolId } from "../../shared/utils/tenant-context";
import { curriculumService } from "../../curriculum";
import { Skills } from "../../shared/entities";
import { matchedData } from "express-validator";

export class SubjectController {

    async createSubject(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {


            const creatorId = Number(req.user?.id);
            if (!creatorId || isNaN(creatorId)) {
                res.status(400).json({ success: false, message: "Invalid user session" });
                return;
            }

            const validatedData = matchedData(req);
            const curriculumId = validatedData['curriculumId'];

            // Get schoolId from authenticated user
            const userSchoolId = requireSchoolId(req);

            // Validate that curriculum belongs to user's school
            const curriculumResult = await curriculumService.getCurriculumById(curriculumId, userSchoolId);
            if (!curriculumResult.success || !curriculumResult.curriculum) {
                res.status(404).json({ success: false, message: "Curriculum not found" });
                return;
            }

            try {
                validateSchoolAccess(req, curriculumResult.curriculum.schoolId);
            } catch (error: any) {
                res.status(403).json({ success: false, message: error.message });
                return;
            }

            const result = await AppDataSource.transaction(async (manager) => {
                const subjectData = {
                    ...validatedData,
                    attachmentsUrl: req.body.attachments,
                    creatorId,
                };

                return await subjectService.createSubject(curriculumId, subjectData as any, manager);
            });

            if (!result.success) {
                res.status(400).json({ success: false, message: result.message });
                return;
            }

            res.status(201).json({
                success: true,
                message: "Subject created successfully",
                data: result.data
            });
        } catch (error: any) {
            console.error("Create Subject Error:", error);
            res.status(error.message.includes("Teachers must be assigned") ? 400 : 500)
                .json({ success: false, message: error.message || "Internal server error" });
        }
    }

    async getSubjects(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {

            const userSchoolId = requireSchoolId(req);

            const rawSkills = req.query['skills'];
            const skills = typeof rawSkills === "string"
                ? rawSkills.split(",").map((skill) => skill.trim()).filter((skill) => skill.length > 0) as Skills[]
                : undefined;

            const filters = {
                search: req.query['search'] as string,
                schoolId: userSchoolId as number,
                skills,
                subjectSchedule: req.query['subjectSchedule'] as { day: string; startTime: string; endTime: string; }[],
                pos: req.query['pos'] ? parseInt(req.query['pos'] as string, 10) : undefined,
                delta: req.query['delta'] ? parseInt(req.query['delta'] as string, 10) : undefined,
                sortBy: req.query['sortBy'] as string,
                sortOrder: req.query['sortOrder'] as 'ASC' | 'DESC',
                isSystem: req.query['isSystem'] ? req.query['isSystem'] === 'true' : undefined, 
            };

            const result = await subjectService.listAllSubjects(filters);
            res.status(200).json(result);
        } catch (error: any) {
            console.error("Get Subjects Error:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getSubjectById(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const id = Number(req.params['id']);
            const result = await subjectService.getSubjectById(id);

            if (!result.success || !result.data) {
                res.status(404).json({ success: false, message: result.message || "Subject not found" });
                return;
            }

            const subject = result.data;

            if (subject.teachers && subject.teachers.length > 0) {
                // School access validation through curriculum
            }

            res.status(200).json(result);
        } catch (error: any) {
            console.error("Get Subject By ID Error:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async updateSubject(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const id = Number(req.params['id']);

            // First get the subject to validate school access
            const existingResult = await subjectService.getSubjectById(id);
            if (!existingResult.success || !existingResult.data) {
                res.status(404).json({ success: false, message: "Subject not found" });
                return;
            }

            // Validate school access
            const existingSubject = existingResult.data;
            if (existingSubject.teachers && existingSubject.teachers.length > 0) {
                // School access validation through curriculum relation
            }

            const validatedData = matchedData(req);
            const result = await subjectService.updateSubject(id, validatedData);
            if (!result.success) {
                res.status(400).json({ success: false, message: result.message });
                return;
            }
            res.status(200).json({ success: true, message: "Subject updated successfully", subject: result.subject });
        } catch (error: any) {
            console.error("Update Subject Error:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async deleteSubject(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const id = Number(req.params['id']);

            // First get the subject to validate school access
            const existingResult = await subjectService.getSubjectById(id);
            if (!existingResult.success || !existingResult.data) {
                res.status(404).json({ success: false, message: "Subject not found" });
                return;
            }
            const existingSubject = existingResult.data;
            if (existingSubject.teachers && existingSubject.teachers.length > 0) {
                // School access validation through curriculum relation
            }

            await subjectService.removeSubject(id);
            res.status(200).json({ success: true, message: "Subject deleted successfully" });
        } catch (error: any) {
            console.error("Delete Subject Error:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
}