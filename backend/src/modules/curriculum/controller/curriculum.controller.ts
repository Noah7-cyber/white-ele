import { AuthenticatedRequest } from "../../auth/middleware/middleware";
import { activityLogger } from "../../shared/services/activity-logger.service";
import { curriculumService, CurriculumFilters, UpdateCurriculumData } from "../service/curriculum.service";
import { Response } from "express";
import { logger } from "../../shared";
import { requireSchoolId } from "../../shared/utils/tenant-context";

export class CurriculumController {
    /**
     * Create a new curriculum
     */
    async createCurriculum(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            let creatorId: number | null = null;

            creatorId = Number(req.user.id);

            if (!creatorId || isNaN(creatorId)) {
                res.status(400).json({
                    success: false,
                    message: "Creator could not be determined from the logged-in user",
                });
                return;
            }
            const userSchoolId = requireSchoolId(req);

            if (req.body.schoolId && req.body.schoolId !== userSchoolId) {
                res.status(403).json({
                    success: false,
                    message: `School ID mismatch. Your account belongs to school ${userSchoolId}, but you're trying to create curriculum for school ${req.body.schoolId}`,
                });
                return;
            }

            if (req.body.schoolId && req.body.schoolId !== userSchoolId) {
                res.status(403).json({
                    success: false,
                    message: `School ID mismatch. Your account belongs to school ${userSchoolId}, but you're trying to create curriculum for school ${req.body.schoolId}`,
                });
                return;
            }

            const result = await curriculumService.createCurriculum({
                ...(req.body.academicYear ? { academicYear: req.body.academicYear } : {}),
                title: req.body.title,
                attachmentUrl: req.body.attachmentUrl,
                description: req.body.description,
                creatorId: creatorId,
                schoolId: userSchoolId,
            });

            if (result.success && result.curriculum && req.user) {
                await activityLogger.log({
                    userId: req.user.id,
                    resource: "curriculum",
                    action: "create",
                    title: `Curriculum created: ${result.curriculum.title}`,
                    description: `Curriculum for school #${result.curriculum.schoolId}`,
                    ipAddress: req.ip,
                    userAgent: req.get("user-agent"),
                });
            }

            res.status(result.success ? 201 : 400).json(result);
        } catch (error: any) {
            console.error("Error in createCurriculum controller:", error);
            logger.error("Error in createCurriculum controller:", {
                message: error?.message,
                stack: error?.stack,
                name: error?.name,
                body: req.body,
            });
            
            res.status(500).json({
                success: false,
                message: error?.message || "Internal server error",
                error: process.env["NODE_ENV"] === 'development' ? {
                    message: error?.message,
                    stack: error?.stack,
                    name: error?.name,
                } : undefined,
            })
        }
    }

    /**
     * Get all curriculums with filters
     */
    async getAllCurriculums(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userSchoolId = requireSchoolId(req);

            if (req.query["schoolId"] && Number(req.query["schoolId"]) !== userSchoolId) {
                res.status(403).json({ success: false, message: "User does not belong to this school" });
                return;
            }

            const filters: CurriculumFilters = {
                ...(req.query["search"] && { search: req.query["search"] as string }),
                schoolId: userSchoolId,
                ...(req.query["pos"] && { pos: Number(req.query["pos"]) }),
                ...(req.query["delta"] && { delta: Number(req.query["delta"]) }),
                ...(req.query["isSystem"] && { isSystem: req.query["isSystem"] === 'true' }), 
            };

            const result = await curriculumService.getAllCurriculums(filters);
            res.status(result.success ? 200 : 400).json(result);
        } catch (error: any) {
            logger.error("Error in getAllCurriculums controller:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    }

    /**
     * Get curriculum by ID
     */
    async getCurriculumById(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const curriculumId = Number(req.params["id"]);

            if (isNaN(curriculumId)) {
                res.status(400).json({
                    success: false,
                    message: "Invalid curriculum ID",
                });
                return;
            }

            const userSchoolId = requireSchoolId(req);
            const isSystem = req.query["isSystem"] ? req.query["isSystem"] === "true" : undefined;

            const result = await curriculumService.getCurriculumById(curriculumId, userSchoolId, isSystem);
            res.status(result.success ? 200 : 404).json(result);
        } catch (error: any) {
            logger.error("Error in getCurriculumById controller:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    }

    /**
     * Update a curriculum
     */
    async updateCurriculum(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const curriculumId = Number(req.params["id"]);

            if (isNaN(curriculumId)) {
                res.status(400).json({
                    success: false,
                    message: "Invalid curriculum ID",
                });
                return;
            }

            // Check if user has a schoolId
            if (!req.user?.schoolId) {
                res.status(400).json({
                    success: false,
                    message: "User is not associated with a school. Please contact support.",
                });
                return;
            }

            const userSchoolId = requireSchoolId(req);

            const updateData: UpdateCurriculumData = {
                schoolId: userSchoolId,
                ...(req.body.title && { title: req.body.title }),
                ...(req.body.attachmentUrl && { attachmentUrl: req.body.attachmentUrl }),
                ...(req.body.description && { description: req.body.description }),
            };

            const result = await curriculumService.updateCurriculum(curriculumId, updateData);

            if (result.success && result.curriculum && req.user) {
                await activityLogger.log({
                    userId: req.user.id,
                    resource: "curriculum",
                    action: "update",
                    title: `Curriculum updated: ${result.curriculum.title}`,
                    description: `Curriculum #${curriculumId} for school #${result.curriculum.schoolId}`,
                    ipAddress: req.ip,
                    userAgent: req.get("user-agent"),
                });
            }

            res.status(result.success ? 200 : 400).json(result);
        } catch (error: any) {
            logger.error("Error in updateCurriculum controller:", {
                message: error?.message,
                stack: error?.stack,
                name: error?.name,
                error: error
            });
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    }

    /**
     * Delete a curriculum
     */
    async deleteCurriculum(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const curriculumId = Number(req.params["id"]);

            if (isNaN(curriculumId)) {
                res.status(400).json({
                    success: false,
                    message: "Invalid curriculum ID",
                });
                return;
            }

            const userSchoolId = requireSchoolId(req);

            const result = await curriculumService.deleteCurriculum(curriculumId, userSchoolId);

            if (result.success && req.user) {
                await activityLogger.log({
                    userId: req.user.id,
                    resource: "curriculum",
                    action: "delete",
                    title: `Curriculum deleted: #${curriculumId}`,
                    description: `Curriculum #${curriculumId} was deleted`,
                    ipAddress: req.ip,
                    userAgent: req.get("user-agent"),
                });
            }

            res.status(result.success ? 200 : 400).json(result);
        } catch (error: any) {
            logger.error("Error in deleteCurriculum controller:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    }

}

export const curriculumController = new CurriculumController();