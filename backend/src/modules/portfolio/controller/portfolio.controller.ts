import { Response } from "express";
import { portfolioService } from "../service/portfolio.service";
import { logger } from "../../shared";
import { AuthenticatedRequest } from "../../auth";
import { requireSchoolId } from "../../shared/utils/tenant-context";
import { activityLogger } from "../../shared/services/activity-logger.service";

export class PortfolioController {
    async createEntry(req: AuthenticatedRequest, res: Response) {
        try {
            const schoolId = requireSchoolId(req);
            const result = await portfolioService.createPortfolioEntry({
                ...req.body,
                schoolId
            });

            if (!result.success || !result.data) {
                return res.status(400).json(result);
            }

            const entry = result.data;

            await activityLogger.log({
                userId: req.user.id,
                resource: "portfolio",
                action: "create",
                title: `Created portfolio entry: ${entry.id}`,
                description: `Portfolio entry "${entry.id}" for ""`,
                ipAddress: req.ip,
                userAgent: req.get("user-agent")
            });
            return res.status(201).json({
                success: true,
                message: "Portfolio entry created successfully",
                data: entry
            });

        } catch (error: any) {
            logger.error("Error creating portfolio entry:", error);
            return res.status(500).json({
                success: false,
                message: error.message || "Internal server error"
            });
        }
    }

    async addPortfolioSection(req: AuthenticatedRequest, res: Response) {
        try {
            const schoolId = requireSchoolId(req);

            const result = await portfolioService.addPortfolioSection({
                ...req.body,
                schoolId
            });

            if (!result.success || !result.data) {
                return res.status(400).json(result);
            }

            const section = result.data;

            await activityLogger.log({
                userId: req.user.id,
                resource: "portfolio",
                action: "create",
                title: `Created portfolio section: ${section.id}`,
                description: `Portfolio section "${section.id}" for ""`,
                ipAddress: req.ip,
                userAgent: req.get("user-agent")
            });
            return res.status(201).json({
                success: true,
                message: "Portfolio section added successfully",
                data: section
            });

        } catch (error: any) {
            logger.error("Error adding portfolio section:", error);
            return res.status(500).json({
                success: false,
                message: error.message || "Internal server error"
            });
        }
    }

    async getPortfolio(req: AuthenticatedRequest, res: Response) {
        try {
            const schoolId = requireSchoolId(req);
            const { studentId, classroomId, startDate, endDate, pos, delta } = req.query;
            const result = await portfolioService.getPortfolios({
                schoolId,
                studentId: studentId ? Number(studentId) : undefined,
                classroomId: classroomId ? Number(classroomId) : undefined,
                startDate: startDate ? new Date(startDate as string) : undefined,
                endDate: endDate ? new Date(endDate as string) : undefined,
                pos: pos ? Number(pos) : 1,
                delta: delta ? Number(delta) : 10
            });
            return res.status(200).json({
                success: true,
                message: "Portfolio retrieved successfully",
                data: result.data,
                pagination: result.pagination
            });
        } catch (error: any) {
            logger.error("Error retrieving portfolio:", error);
            return res.status(500).json({
                success: false,
                message: error.message || "Internal server error"
            });
        }
    }

    async getPortfolioById(req: AuthenticatedRequest, res: Response) {
        try {
            const schoolId = requireSchoolId(req);
            const { id } = req.params;
            const { startDate, endDate } = req.query;
            const result = await portfolioService.getPortfolioById(
                Number(id),
                schoolId,
                startDate ? new Date(startDate as string) : undefined,
                endDate ? new Date(endDate as string) : undefined
            );

            if (!result) {
                return res.status(404).json({
                    success: false,
                    message: "Portfolio not found"
                });
            }

            return res.status(200).json({
                success: true,
                message: "Portfolio retrieved successfully",
                data: result
            });
        } catch (error: any) {
            logger.error("Error retrieving portfolio by ID:", error);
            return res.status(500).json({
                success: false,
                message: error.message || "Internal server error"
            });
        }
    }

    async updateEntry(req: AuthenticatedRequest, res: Response) {
        try {
            const schoolId = requireSchoolId(req);
            const { id } = req.params;

            const result = await portfolioService.updatePortfolioEntry(
                Number(id),
                schoolId,
                {
                    startDate: new Date(req.body.startDate),
                    endDate: new Date(req.body.endDate)
                }
            );

            if (!result.success || !result.data) {
                return res.status(404).json(result);
            }

            return res.status(200).json({
                success: true,
                message: "Portfolio updated successfully",
                data: result.data
            });
        } catch (error: any) {
            logger.error("Error updating portfolio entry:", error);
            return res.status(500).json({
                success: false,
                message: error.message || "Internal server error"
            });
        }
    }

    async patchStatus(req: AuthenticatedRequest, res: Response) {
        try {
            const schoolId = requireSchoolId(req);
            const { id } = req.params;
            const { status } = req.body;

            const result = await portfolioService.patchPortfolioStatus(
                Number(id),
                schoolId,
                { status }
            );

            if (!result.success || !result.data) {
                return res.status(404).json(result);
            }

            return res.status(200).json({
                success: true,
                message: "Portfolio status updated successfully",
                data: result.data
            });
        } catch (error: any) {
            logger.error("Error updating portfolio status:", error);
            return res.status(500).json({
                success: false,
                message: error.message || "Internal server error"
            });
        }
    }

    async updateSection(req: AuthenticatedRequest, res: Response) {
        try {
            const { id } = req.params;
            const result = await portfolioService.updatePortfolioSection(Number(id), req.body);

            if (!result.success || !result.data) {
                return res.status(400).json(result);
            }

            const section = result.data;

            await activityLogger.log({
                userId: req.user.id,
                resource: "portfolio",
                action: "update",
                title: `Updated portfolio section: ${section.id}`,
                description: `Updated portfolio section "${section.id}"`,
                ipAddress: req.ip,
                userAgent: req.get("user-agent")
            });

            return res.status(200).json({
                success: true,
                message: "Portfolio section updated successfully",
                data: section
            });
        } catch (error: any) {
            logger.error("Error updating portfolio section:", error);
            return res.status(500).json({
                success: false,
                message: error.message || "Internal server error"
            });
        }
    }

    async getStudentGrades(req: AuthenticatedRequest, res: Response) {
        try {
            const schoolId = requireSchoolId(req);
            const { studentId } = req.query;

            const data = await portfolioService.getStudentGrades(
                schoolId,
                studentId ? Number(studentId) : undefined
            );

            return res.status(200).json({
                success: true,
                message: "Student grades retrieved successfully",
                data
            });
        } catch (error: any) {
            logger.error("Error retrieving student grades:", error);
            return res.status(500).json({
                success: false,
                message: error.message || "Internal server error"
            });
        }
    }

    async deleteEntry(req: AuthenticatedRequest, res: Response) {
        try {
            const { id } = req.params;
            await portfolioService.deletePortfolioEntry(Number(id));

            await activityLogger.log({
                userId: req.user.id,
                resource: "portfolio",
                action: "delete",
                title: `Deleted portfolio entry: ${id}`,
                description: `Portfolio entry "${id}" for ""`,
                ipAddress: req.ip,
                userAgent: req.get("user-agent")
            });

            return res.status(200).json({
                success: true,
                message: "Portfolio entry deleted successfully"
            });
        } catch (error: any) {
            logger.error("Error deleting portfolio entry:", error);
            return res.status(500).json({
                success: false,
                message: error.message || "Internal server error"
            });
        }
    }

    async deleteSection(req: AuthenticatedRequest, res: Response) {
        try {
            const { id } = req.params;
            const result = await portfolioService.deletePortfolioSection(Number(id));

            if (!result.success) {
                return res.status(404).json(result);
            }

            await activityLogger.log({
                userId: req.user.id,
                resource: "portfolio",
                action: "delete",
                title: `Deleted portfolio section: ${id}`,
                description: `Portfolio section "${id}" deleted`,
                ipAddress: req.ip,
                userAgent: req.get("user-agent")
            });

            return res.status(200).json(result);
        } catch (error: any) {
            logger.error("Error deleting portfolio section:", error);
            return res.status(500).json({
                success: false,
                message: error.message || "Internal server error"
            });
        }
    }
}

export const portfolioController = new PortfolioController();
