import { Announcement } from "../../shared/entities/Announcement";
import { Repository } from "typeorm";
import { AppDataSource } from "../../core";
import { AnnouncementStatus, AnnouncementType, logger, User } from "../../shared";
import { UserRole } from "../../shared/entities";
import { AnnouncementViews } from "../../shared/entities/AnnouncementViews";
import { sendAnnouncementPublishedEmails } from "./announcement-notification.service";


export interface CreateAnnouncement {
    creatorId: number;
    content: string;
    creatorType: 'USER' | 'STAFF';
    mediaUrl?: string;
    announcementType?: AnnouncementType;
    announcementStatus?: AnnouncementStatus;
    link?: string;
    schoolId: number;
    subject: string;
}


export interface UpdateAnnouncement {
    subject?: string;
    content?: string;
    link?: string;
    announcementId: number;
    mediaUrl?: string;
    announcementType?: AnnouncementType;
    announcementStatus?: AnnouncementStatus;
}

export interface AnnouncementSearchFilters {
    search?: string;
    schoolId?: number;
    announcementStatus?: AnnouncementStatus;
    announcementType?: AnnouncementType;
    pos?: number;
    delta?: number;
    sortBy?: string;
    sortOrder?: "ASC" | "DESC";
}

export interface ServiceResponse {
    success: boolean;
    message: string;
    announcement?: Announcement;
}

export interface AnnouncementFilterResponse {
    success: boolean;
    message: string;
    announcement?: Announcement[];
    pagination?: {
        pos: number;
        delta: number;
        count: number;
    };
}
export class AnnouncementService {
    private get announcementRepository(): Repository<Announcement> {
        return AppDataSource.getRepository(Announcement)
    }
    private get announcementViewsRepository(): Repository<AnnouncementViews> {
        return AppDataSource.getRepository(AnnouncementViews)
    }

    private get userRepository(): Repository<User> {
        return AppDataSource.getRepository(User)
    }

    async createAnnouncement(data: CreateAnnouncement): Promise<ServiceResponse> {

        try {

            const creator = await this.userRepository.findOne({ where: { id: data.creatorId } });

            if (!creator) {
                return {
                    success: false,
                    message: "Creator not found",
                };
            }

            const newAnnouncement = this.announcementRepository.create({
                creatorId: data.creatorId,
                creatorType: data.creatorType,
                subject: data.subject,
                content: data.content,
                mediaUrl: data.mediaUrl,
                link: data.link,
                schoolId: data.schoolId,
                announcementStatus: data.announcementStatus,
                announcementType: data.announcementType
            })

            await this.announcementRepository.save(newAnnouncement)

            if (data.announcementStatus === AnnouncementStatus.PUBLISHED) {
                void sendAnnouncementPublishedEmails(newAnnouncement.id).catch((err) =>
                    logger.error("Announcement published emails (create) failed:", err),
                );
            }

            return {
                success: true,
                message: `Announcement created with Subject ${data.subject}`,
                announcement: newAnnouncement
            }
        } catch (error) {
            logger.error("Error creating announcement:", error);
            console.error("the error", error)
            return {
                success: false,
                message: `Failed to create announcement`
            }
        }
    }

    async getAnnouncementById(announcementId: number, userId: number): Promise<ServiceResponse> {

        try {
            const announcement = await this.announcementRepository.findOne({
                where: { id: announcementId },
                relations: ["school", "creator"],
                select: {
                    creator: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        role: true
                    },
                    school: {
                        schoolName: true,
                        id: true,
                    }
                }
            })

            if (!announcement)
                return {
                    success: false,
                    message: `announcement with  ${announcementId} not found`
                }

            // Increment view count
          await this.incrementViewCount(announcementId, userId);

            return {
                success: true,
                message: `announcement retrieved successfully`,
                announcement: announcement
            }
        } catch (error) {
            logger.error("Error retrieving Announcement", error)
            return {
                success: false,
                message: `Failed to retrieve announcement`
            }
        }
    }

    async updateAnnouncement(data: UpdateAnnouncement): Promise<ServiceResponse> {
        try {
            const announcement = await this.announcementRepository.findOne({
                where: { id: data.announcementId },
                relations: ["school"]
            })

            if (!announcement)
                return {
                    success: false,
                    message: `announcement with ${data.announcementId} not found`
                }

            const previousStatus = announcement.announcementStatus;

            if (data.subject) announcement.subject = data.subject;
            if (data.content) announcement.content = data.content;
            if (data.mediaUrl) announcement.mediaUrl = data.mediaUrl;
            if (data.link) announcement.link = data.link;
            if (data.announcementStatus) announcement.announcementStatus = data.announcementStatus;
            if (data.announcementType) announcement.announcementType = data.announcementType;

            await this.announcementRepository.save(announcement)

            const justPublished =
                data.announcementStatus === AnnouncementStatus.PUBLISHED &&
                previousStatus !== AnnouncementStatus.PUBLISHED;
            if (justPublished) {
                void sendAnnouncementPublishedEmails(announcement.id).catch((err) =>
                    logger.error("Announcement published emails (update) failed:", err),
                );
            }

            return {
                success: true,
                message: "announcement updated successfully",
                announcement: announcement
            }
        } catch (error) {
            logger.error("Error updating announcement", error);
            return {
                success: false,
                message: "Failed to update announcement"
            }
        }
    }

    async ListSchoolAnnouncement(filters: AnnouncementSearchFilters): Promise<AnnouncementFilterResponse> {
        try {
            const {
                search,
                announcementStatus,
                announcementType,
                schoolId,
                pos = 0,
                delta = 10,
                sortBy = "createdAt",
                sortOrder = "DESC"
            } = filters;

            const queryBuilder = this.announcementRepository
                .createQueryBuilder("announcement")
                .leftJoinAndSelect("announcement.school", "school")
                .leftJoinAndSelect("announcement.creator", "creator")
                .select([
                        "announcement.id",
                        "announcement.subject",
                        "announcement.content",
                        "announcement.mediaUrl",
                        "announcement.link",
                        "announcement.createdAt",
                        "announcement.viewCount",
                        "announcement.announcementStatus",
                        "announcement.announcementType",
                        "announcement.creatorType",
                        "announcement.schoolId", 
                        "announcement.updatedAt",

                        "school.id",
                        "school.schoolName", 

                        "creator.id",
                        "creator.firstName",
                        "creator.lastName",
                        "creator.role"
                    ]);

            if (announcementStatus) {
                queryBuilder.andWhere("announcement.announcementStatus = :announcementStatus", { announcementStatus });
            }

            if (announcementType) {
                queryBuilder.andWhere("announcement.announcementType = :announcementType", { announcementType });
            }

            if (search) {
                queryBuilder.andWhere(
                    "(LOWER(announcement.subject) LIKE LOWER(:search) OR LOWER(announcement.content) LIKE LOWER(:search))",
                    {
                        search: `%${search}%`,
                    }
                );
            }

            if (schoolId) {
                queryBuilder.andWhere("announcement.schoolId = :schoolId", { schoolId });
            }

            const sortFieldMap: { [key: string]: string } = {
                createdAt: "announcement.createdAt",
            };

            const sortField = sortFieldMap[sortBy] || "announcement.createdAt";
            queryBuilder.orderBy(sortField, sortOrder);

            queryBuilder.skip(pos).take(delta);

            const [announcement, count] = await queryBuilder.getManyAndCount();

            if (!announcement)
                return {
                    success: false,
                    message: "announcement not found"
                }

            return {
                success: true,
                message: "announcement retrieved successfully",
                announcement: announcement,
                pagination: {
                    count,
                    pos,
                    delta
                }
            }
        } catch (error) {
            console.log(error)
            logger.error("Failed to retrieve announcement(s)", error)
            return {
                success: false,
                message: "failed to retrieve announcement"
            }
        }
    }

    async deleteAnnouncement(announcementId: number): Promise<ServiceResponse> {
        try {
            const announcement = await this.announcementRepository.findOne({
                where: { id: announcementId },
                relations: ["school"]
            })

            if (!announcement) {
                return {
                    success: false,
                    message: "announcement not found"
                }
            }

            if (announcement.deletedAt) {
                return {
                    success: false,
                    message: "announcement is already deleted"
                }
            }

            await this.announcementRepository.softRemove(announcement);

            return {
                success: true,
                message: "announcement deleted successfully"
            }
        } catch (error) {
            logger.error("Error deleting announcement:", error);
            console.error("Announcement deletion error details:", error);
            return {
                success: false,
                message: "Failed to delete announcement"
            }
        }

    }

    private async incrementViewCount(announcementId: number, userId: number): Promise<void> {
        try {
            const user = await this.userRepository.findOne({ 
                where: { id: userId },
                select: ["id","role"]
             });
            if (!user) {
                logger.warn(`User with ID ${userId} not found. Cannot increment view count.`);
                return;
            }

            if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) {
                return;
            }
            
        const result = await this.announcementViewsRepository
             .createQueryBuilder()
             .insert()
             .into('announcementViews')
             .values({ announcementId, userId })
             .orIgnore() 
             .execute();

        if (result.raw?.rowCount !== 1) {
            return; 
        }

        await this.announcementRepository.increment(
            { id: announcementId }, 'viewCount', 1 )
        } catch (error) {
            logger.error(`Error incrementing view count for announcement ID ${announcementId}:`, error);
        }
    }
}
    
const announcementService = new AnnouncementService();
export default announcementService;
