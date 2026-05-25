import { Response } from "express";
import { AuthenticatedRequest } from "../../auth/middleware/middleware";
import { assessmentService, CreateAssessmentData, AssessmentFilters } from "../service/assessment.service";
import { requireSchoolId } from "../../shared/utils/tenant-context";
import { TermEnum, AssessmentStatus, AssessmentType } from "../../shared/entities";
import { activityLogger } from "../../shared/services/activity-logger.service";

export class AssessmentController {

    async createAssessment(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const schoolId = requireSchoolId(req);
            const data: CreateAssessmentData = {
                ...req.body,
                creatorId: req.user.id,
                schoolId
            };

            const result = await assessmentService.createAssessment(data);

            if (result.success && result.data) {
                await activityLogger.logFromRequest(req, {
                    userId: req.user.id,
                    resource: "assessment",
                    action: "create",
                    title: `Assessment created #${result.data.id}`,
                    metadata: {
                        assessmentId: result.data.id,
                        creatorId: result.data.creatorId,
                        assessmentName: result.data.title,
                        assessmentDueDate: result.data.dueDate,
                    },
                });
            }
            res.status(result.success ? 201 : 400).json(result);
        } catch (error: any) {
            console.error("Create Assessment Error:", error);
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    }

    async ListAssessments(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const schoolId = requireSchoolId(req);

            const filters: AssessmentFilters = {
                schoolId,
                page: req.query['page'] ? Number(req.query['page']) : 1,
                limit: req.query['limit'] ? Number(req.query['limit']) : 10,
                search: req.query['search'] as string,
                classroomsId: req.query['classroomsId'] ? Number(req.query['classroomsId']) : undefined,
                term: req.query['term'] as TermEnum,
                subjectId: req.query['subjectId'] ? Number(req.query['subjectId']) : undefined,
                teacherId: req.query['teacherId'] ? Number(req.query['teacherId']) : undefined,
                creatorId: req.query['creatorId'] ? Number(req.query['creatorId']) : undefined,
                status: req.query['status'] as AssessmentStatus,
                type: req.query['assessmentType'] as AssessmentType || req.query['type'] as AssessmentType,
                academicYear: req.query['academicYear'] as string,
                dateAssigned: req.query['dateAssigned'] ? new Date(req.query['dateAssigned'] as string) : undefined,
                dueDate: req.query['dueDate'] ? new Date(req.query['dueDate'] as string) : undefined,
                startDate: req.query['startDate'] ? new Date(req.query['startDate'] as string) : undefined,
                endDate: req.query['endDate'] ? new Date(req.query['endDate'] as string) : undefined,
                minScore: req.query['minScore'] ? Number(req.query['minScore']) : undefined,
                maxScore: req.query['maxScore'] ? Number(req.query['maxScore']) : undefined,
            };

            const result = await assessmentService.listAssessments(filters);
            res.status(result.success ? 200 : 400).json(result);
        } catch (error: any) {
            console.error("Get Assessments Error:", error);
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    }

    async getAssessmentById(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const schoolId = requireSchoolId(req);
            const id = Number(req.params['id']);

            const result = await assessmentService.getAssessmentById(id, schoolId);
            if (!result.success) {
                res.status(404).json(result);
                return;
            }
            res.status(200).json(result);
        } catch (error: any) {
            console.error("Get Assessment By ID Error:", error);
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    }

    async updateAssessment(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const schoolId = requireSchoolId(req);
            const id = Number(req.params['id']);

            const result = await assessmentService.updateAssessment(id, schoolId, req.body);
            if (result.success && result.data) {
                await activityLogger.logFromRequest(req, {
                    userId: req.user.id,
                    resource: "assessment",
                    action: "update",
                    title: `Assessment updated #${result.data.id}`,
                    metadata: {
                        assessmentId: result.data.id,
                        gradedById: result.data.staffId,
                        assessmentName: result.data.title,
                        assessmentDueDate: result.data.dueDate,
                    },
                });
            }
            res.status(result.success ? 200 : 400).json(result);
        } catch (error: any) {
            console.error("Update Assessment Error:", error);
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    }

    async deleteAssessment(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const schoolId = requireSchoolId(req);
            const id = Number(req.params['id']);

            const result = await assessmentService.deleteAssessment(id, schoolId);
            if (result.success && result.data) {
                await activityLogger.logFromRequest(req, {
                    userId: req.user.id,
                    resource: "assessment",
                    action: "delete",
                    title: `Assessment deleted #${result.data.id}`,
                    metadata: {
                        assessmentId: result.data.id,
                        creatorId: result.data.creatorId,
                        assessmentName: result.data.title,
                        assessmentDueDate: result.data.dueDate,
                    },
                });
            }
            res.status(result.success ? 200 : 400).json(result);
        } catch (error: any) {
            console.error("Delete Assessment Error:", error);
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    }

    async recordAssessmentScore(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const schoolId = requireSchoolId(req);
            const gradedById = req.user.id

            const result = await assessmentService.recordAssessmentScore({
                gradedById,
                schoolId,
                ...req.body
            });

            if (result.success && result.data) {
                const resourceId = req.body.milestoneId;
                await activityLogger.logFromRequest(req, {
                    userId: req.user.id,
                    resource: "assessment",
                    action: "record_score",
                    title: `Score recorded/updated for ${req.body.milestoneId ? 'milestone' : 'assessment'} #${resourceId}`,
                    metadata: {
                        milestoneId: req.body.milestoneId,
                        gradedById: gradedById,
                        studentCount: req.body.studentIds?.length,
                    },
                });
            }
            res.status(result.success ? 200 : 400).json(result);
        } catch (error: any) {
            console.error("Record Assessment Score Error:", error);
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    }
}
