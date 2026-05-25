import { Response } from "express";
import { MilestoneService, CreateMilestoneData, UpdateMilestoneData, ListMilestonesFilters } from "../services/milestone.service";
import { AuthenticatedRequest } from "../../auth";
import { logger } from "../../shared";
import { requireSchoolId, validateSchoolAccess } from "../../shared/utils/tenant-context";
import { GradingType, MilestoneStatus } from "../../shared/entities/EntityEnums";

export class MilestoneController {
    private milestoneService: MilestoneService;

    constructor() {
        this.milestoneService = new MilestoneService();
    }

    async createMilestone(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const schoolId = requireSchoolId(req);
            const data: CreateMilestoneData = {
                title: req.body.title,
                curriculumId: req.body.curriculumId,
                subjectId: req.body.subjectId,
                gradingType: req.body.gradingType,
                startDate: req.body.startDate,
                endDate: req.body.endDate,
                schoolId,
            };

            const result = await this.milestoneService.createMilestone(data);
            res.status(result.success ? 201 : 400).json(result);
        } catch (error: any) {
            logger.error("Create milestone error:", error);
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    }

    async addMilestoneFromLibrary(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const schoolId = requireSchoolId(req);
            const milestoneIds = (req.body.milestoneIds || []) as number[];
            const classroomId = req.body.classroomId ? Number(req.body.classroomId) : undefined;
            const assignedStaffId = req.body.assignedStaffId ? Number(req.body.assignedStaffId) : undefined;

            const result = await this.milestoneService.addMilestoneFromLibrary({
                milestoneIds,
                schoolId,
                classroomId,
                assignedStaffId,
            });

            res.status(result.success ? 201 : 400).json(result);
        } catch (error: any) {
            logger.error("Add milestone from library error:", error);
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    }

    async listMilestones(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const schoolId = requireSchoolId(req);
            const statusQuery = req.query["status"];
            const normalizedStatuses = statusQuery
                ? (Array.isArray(statusQuery) ? statusQuery : [statusQuery])
                    .flatMap((item) => String(item).split(","))
                    .map((item) => item.trim())
                    .filter(Boolean) as MilestoneStatus[]
                : undefined;

            const filters: ListMilestonesFilters = {
                schoolId,
                curriculumId: req.query["curriculumId"] ? Number(req.query["curriculumId"]) : undefined,
                subjectId: req.query["subjectId"] ? Number(req.query["subjectId"]) : undefined,
                status: normalizedStatuses && normalizedStatuses.length > 0 ? Array.from(new Set(normalizedStatuses)) : undefined,
                gradingType: req.query["gradingType"] as GradingType,
                pos: req.query["pos"] ? Number(req.query["pos"]) : undefined,
                delta: req.query["delta"] ? Number(req.query["delta"]) : undefined,
                search: req.query["search"] as string,
                classroomId: req.query["classroomId"] ? Number(req.query["classroomId"]) : undefined,
                studentId: req.query["studentId"] ? Number(req.query["studentId"]) : undefined,
                isSystem: req.query["isSystem"] ? req.query["isSystem"] === 'true' : undefined,
            };

            const result = await this.milestoneService.listMilestones(filters);
            res.status(result.success ? 200 : 400).json(result);
        } catch (error: any) {
            logger.error("List milestones error:", error);
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    }

    async getMilestoneById(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const id = Number(req.params["id"]);
            if (Number.isNaN(id)) {
                res.status(400).json({ success: false, message: "Invalid milestone ID" });
                return;
            }

            const result = await this.milestoneService.getMilestoneById(id);

            if (!result.success || !result.data) {
                res.status(404).json(result);
                return;
            }

            validateSchoolAccess(req, result.data.schoolId);
            res.status(200).json(result);
        } catch (error: any) {
            const msg = error instanceof Error ? error.message : String(error);
            logger.error("Get milestone by ID error:", msg, error);
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    }

    async updateMilestone(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const id = Number(req.params["id"]);
            if (Number.isNaN(id)) {
                res.status(400).json({ success: false, message: "Invalid milestone ID" });
                return;
            }

            const existing = await this.milestoneService.getMilestoneById(id);
            if (!existing.success || !existing.data) {
                res.status(404).json(existing);
                return;
            }

            validateSchoolAccess(req, existing.data.schoolId);

            const updateData: UpdateMilestoneData = {
                title: req.body.title,
                status: req.body.status,
                curriculumId: req.body.curriculumId,
                subjectId: req.body.subjectId,
                gradingType: req.body.gradingType,
            };

            const result = await this.milestoneService.updateMilestone(id, updateData);
            res.status(result.success ? 200 : 400).json(result);
        } catch (error: any) {
            logger.error("Update milestone error:", error);
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    }

    async deleteMilestone(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const id = Number(req.params["id"]);
            if (Number.isNaN(id)) {
                res.status(400).json({ success: false, message: "Invalid milestone ID" });
                return;
            }

            const existing = await this.milestoneService.getMilestoneById(id);
            if (!existing.success || !existing.data) {
                res.status(404).json(existing);
                return;
            }

            validateSchoolAccess(req, existing.data.schoolId);

            const result = await this.milestoneService.deleteMilestone(id);
            res.status(result.success ? 200 : 400).json(result);
        } catch (error: any) {
            logger.error("Delete milestone error:", error);
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    }
}