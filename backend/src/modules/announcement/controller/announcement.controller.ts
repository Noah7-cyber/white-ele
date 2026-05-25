import { Response } from "express";
import { AnnouncementService } from "../service/announcement.service";
import { CreateAnnouncement, UpdateAnnouncement, AnnouncementSearchFilters } from "../service/announcement.service";
import { AuthenticatedRequest } from "../../auth";
import { activityLogger } from "../../shared/services/activity-logger.service";
import { logger } from "../../shared";
import { requireSchoolId, validateSchoolAccess } from "../../shared/utils/tenant-context";

export class AnnouncementController {
    private announcementService: AnnouncementService;

    constructor() {
        this.announcementService = new AnnouncementService();
    }

    /**
     * Create a new announcement
     */
    async createAnnouncement(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            // Determine creator ID and type from authenticated user
            let creatorId: number | null = null;
            let creatorType: "STAFF" | "USER" | null = null;

     
            creatorId = Number(req.user.id);
            const staffAccount = Array.isArray(req.user.staff) ? (req.user as any).staff?.[0] : (req.user as any).staff;
            creatorType = staffAccount?.id ? "STAFF" : "USER";
           
            
            if (!creatorId || isNaN(creatorId)) {
                res.status(400).json({
                    success: false,
                    message: "Creator could not be determined from the logged-in user",
                });
                return;
            }

            // Validate that schoolId from body matches user's schoolId
            const bodySchoolId = Number(req.body.schoolId);
            try {
                validateSchoolAccess(req, bodySchoolId);
            } catch (error: any) {
                res.status(403).json({ success: false, message: error.message });
                return;
            }

            const payload: CreateAnnouncement = {
                creatorId,
                creatorType,
                subject: req.body.subject,
                content: req.body.content,
                schoolId: bodySchoolId,
                announcementType: req.body.announcementType,
                announcementStatus: req.body.announcementStatus,
                mediaUrl: req.body.mediaUrl,
                link: req.body.link,
            };

            const result = await this.announcementService.createAnnouncement(payload);

            if (result.success && result.announcement && req.user) {
                await activityLogger.log({
                    userId: req.user.id,
                    resource: "announcement",
                    action: "create",
                    title: `Announcement created: ${result.announcement.subject}`,
                    description: `Announcement for school #${result.announcement.schoolId}`,
                    ipAddress: req.ip,
                    userAgent: req.get("user-agent"),
                });
            }

            res.status(result.success ? 201 : 400).json(result);
        } catch (error) {
            logger.error("Error in createAnnouncement controller:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    }

    /**
     * Get announcement by ID
     */
    async getAnnouncementById(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const announcementId = Number(req.params["id"]);

            if (isNaN(announcementId)) {
                res.status(400).json({
                    success: false,
                    message: "Invalid announcement ID",
                });
                return;
            }

            const result = await this.announcementService.getAnnouncementById(announcementId, req?.user?.id);
            
            // Validate school access
            if (result.success && result.announcement) {
                try {
                    validateSchoolAccess(req, result.announcement.schoolId);
                } catch (error: any) {
                    res.status(403).json({ success: false, message: error.message });
                    return;
                }
            }

            res.status(result.success ? 200 : 404).json(result);
        } catch (error) {
            logger.error("Error in getAnnouncementById controller:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    }

    /**
     * List announcements with filters
     */
    async listAnnouncements(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            // Use user's schoolId to ensure data isolation
            const userSchoolId = requireSchoolId(req);
            
            // Validate that if schoolId is provided in query, it matches user's schoolId
            if (req.query["schoolId"] && Number(req.query["schoolId"]) !== userSchoolId) {
                res.status(403).json({ success: false, message: "User does not belong to this school" });
                return;
            }

            const filters: AnnouncementSearchFilters = {
                ...(req.query["search"] && { search: req.query["search"] as string }),
                schoolId: userSchoolId, // Always use user's schoolId
                ...(req.query["announcementStatus"] && { announcementStatus: req.query["announcementStatus"] as any }),
                ...(req.query["announcementType"] && { announcementType: req.query["announcementType"] as any }),
                ...(req.query["pos"] && { pos: Number(req.query["pos"]) }),
                ...(req.query["delta"] && { delta: Number(req.query["delta"]) }),
                ...(req.query["sortBy"] && { sortBy: req.query["sortBy"] as string }),
                ...(req.query["sortOrder"] && { sortOrder: req.query["sortOrder"] as "ASC" | "DESC" }),
            };

            const result = await this.announcementService.ListSchoolAnnouncement(filters);

            res.status(result.success ? 200 : 400).json(result);
        } catch (error) {
            logger.error("Error in listAnnouncements controller:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    }

    /**
     * Update an announcement
     */
    async updateAnnouncement(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const announcementId = Number(req.params["id"]);

            if (isNaN(announcementId)) {
                res.status(400).json({
                    success: false,
                    message: "Invalid announcement ID",
                });
                return;
            }

            // First get the announcement to validate school access
            const existingAnnouncement = await this.announcementService.getAnnouncementById(announcementId, req?.user?.id);
            if (!existingAnnouncement.success || !existingAnnouncement.announcement) {
                res.status(404).json({
                    success: false,
                    message: "Announcement not found",
                });
                return;
            }

            // Validate school access
            try {
                validateSchoolAccess(req, existingAnnouncement.announcement.schoolId);
            } catch (error: any) {
                res.status(403).json({ success: false, message: error.message });
                return;
            }

            const payload: UpdateAnnouncement = {
                announcementId,
                ...(req.body.subject && { subject: req.body.subject }),
                ...(req.body.content && { content: req.body.content }),
                ...(req.body.link && { link: req.body.link }),
                ...(req.body.mediaUrl && { mediaUrl: req.body.mediaUrl }),
                ...(req.body.announcementType && { announcementType: req.body.announcementType }),
                ...(req.body.announcementStatus && { announcementStatus: req.body.announcementStatus }),
            };

            const result = await this.announcementService.updateAnnouncement(payload);

            if (result.success && result.announcement && req.user) {
                await activityLogger.log({
                    userId: req.user.id,
                    resource: "announcement",
                    action: "update",
                    title: `Announcement updated: ${result.announcement.subject}`,
                    description: `Announcement for school #${result.announcement.schoolId}`,
                    ipAddress: req.ip,
                    userAgent: req.get("user-agent"),
                });
            }

            res.status(result.success ? 200 : 400).json(result);
        } catch (error) {
            logger.error("Error in updateAnnouncement controller:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    }

    /**
     * Delete an announcement
     */
    async deleteAnnouncement(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const announcementId = Number(req.params["id"]);

            if (isNaN(announcementId)) {
                res.status(400).json({
                    success: false,
                    message: "Invalid announcement ID",
                });
                return;
            }

            // Get announcement details before deletion for logging and validation
            const existing = await this.announcementService.getAnnouncementById(announcementId, req?.user?.id);
            
            if (!existing.success || !existing.announcement) {
                res.status(404).json({
                    success: false,
                    message: "Announcement not found",
                });
                return;
            }

            // Validate school access
            try {
                validateSchoolAccess(req, existing.announcement.schoolId);
            } catch (error: any) {
                res.status(403).json({ success: false, message: error.message });
                return;
            }

            const result = await this.announcementService.deleteAnnouncement(announcementId);

            if (result.success && existing.success && existing.announcement && req.user) {
                await activityLogger.log({
                    userId: req.user.id,
                    resource: "announcement",
                    action: "delete",
                    title: `Announcement deleted: ${existing.announcement.subject}`,
                    description: `Announcement for school #${existing.announcement.schoolId}`,
                    ipAddress: req.ip,
                    userAgent: req.get("user-agent"),
                });
            }

            res.status(result.success ? 200 : 400).json(result);
        } catch (error) {
            logger.error("Error in deleteAnnouncement controller:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    }
}

export const announcementController = new AnnouncementController();