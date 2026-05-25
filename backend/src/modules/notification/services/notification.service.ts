import { Repository, LessThan } from "typeorm";
import { AppDataSource } from "../../core/config/database";
import { Notification, NotificationType, NotificationPriority } from "../../shared/entities/Notification";
import { SchoolNotificationSetting } from "../../shared/entities/SchoolNotificationSetting";
import { User } from "../../shared/entities/User";
import { UserRole } from "../../shared/entities/EntityEnums";
import { websocketService } from "./websocket.service";
import { logger } from "../../shared/utils/logger";
import { emailService, smsService } from "../../shared";
import { whatsappService } from "../../shared";
import { getSchoolIdForRole } from "../../shared/utils/user-school";
import { Admin } from "../../shared/entities/Admin";
import { Student } from "../../shared/entities/StudentEntity";

export class NotificationService {
  private notificationRepo: Repository<Notification>;
  private userRepo: Repository<User>;
  private schoolSettingRepo: Repository<SchoolNotificationSetting>;

  constructor() {
    this.notificationRepo = AppDataSource.getRepository(Notification);
    this.userRepo = AppDataSource.getRepository(User);
    this.schoolSettingRepo = AppDataSource.getRepository(SchoolNotificationSetting);
  }

  private get adminRepo(): Repository<Admin> {
    return AppDataSource.getRepository(Admin);
  }

  private get studentRepo(): Repository<Student> {
    return AppDataSource.getRepository(Student);
  }

  /**
   * Create a new notification
   */
  async createNotification(data: {
    userId: number;
    schoolId: number; // Required: schoolId is mandatory
    type: NotificationType;
    priority?: NotificationPriority;
    title: string;
    message: string;
    actionUrl?: string;
    actionLabel?: string;
    relatedEntityType?: string;
    relatedEntityId?: number;
    metadata?: Record<string, any>;
    sendEmail?: boolean;
    sendSms?: boolean;
    /** Teacher-initiated alerts (e.g. notify parent on activity) bypass user email preference */
    transactional?: boolean;
  }): Promise<{ success: boolean; message: string; notification?: Notification }> {
    try {
      // Validate schoolId is provided
      if (!data.schoolId) {
        return {
          success: false,
          message: "schoolId is required",
        };
      }

      // Verify user exists
      const user = await this.userRepo.findOne({
        where: { id: data.userId },
      });

      if (!user) {
        return {
          success: false,
          message: "User not found",
        };
      }

      // Create notification
      const notification = this.notificationRepo.create({
        userId: data.userId,
        schoolId: data.schoolId,
        type: data.type,
        priority: data.priority || NotificationPriority.MEDIUM,
        title: data.title,
        message: data.message,
        actionUrl: data.actionUrl,
        actionLabel: data.actionLabel,
        relatedEntityType: data.relatedEntityType,
        relatedEntityId: data.relatedEntityId,
        metadata: data.metadata,
        sentInApp: true,
        sentEmail: data.sendEmail || false,
        sentSms: data.sendSms || false,
      });

      const savedNotification = await this.notificationRepo.save(notification);

      // Send real-time notification if user is connected
      if (websocketService.isUserConnected(data.userId)) {
        websocketService.sendNotificationToUser(data.userId, savedNotification);
      }

      // Fetch school notification settings
      const schoolSettings = await this.schoolSettingRepo.findOne({
        where: { schoolId: data.schoolId },
      });

      // Determine if a channel is globally enabled for this user's role
      const isChannelEnabled = (channel: "Email" | "Sms" | "WhatsApp"): boolean => {
        if (!schoolSettings) return channel === "Email"; // Default to Email only if no settings found

        const rolePrefix =
          user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN
            ? "admin"
            : user.role === UserRole.PARENT
              ? "parent"
              : user.role === UserRole.STAFF
                ? "staff"
                : null;

        if (!rolePrefix) return false;

        return (schoolSettings as any)[`${rolePrefix}${channel}`] === true;
      };

      // Implement email, sms and whatsapp notification system
      const maySendEmail =
        data.sendEmail &&
        user.email &&
        isChannelEnabled("Email") &&
        (data.transactional || user.enableEmailNotification);

      if (maySendEmail && user.email) {
        try {
          const meta = data.metadata;
          const isClassroomActivity =
            meta?.["activityId"] != null &&
            meta?.["studentId"] != null &&
            meta?.["activityType"] != null;

          const recipientName =
            `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Parent";

          if (isClassroomActivity) {
            await emailService.sendClassroomActivityParentEmail({
              parentEmail: user.email,
              parentName: recipientName,
              schoolId: data.schoolId,
              studentName: String(meta["studentName"] || "your child"),
              activitySummary: String(meta["activitySummary"] || data.message),
            });
          } else {
            await emailService.sendNotificationEmail(
              user.email,
              data.title,
              data.message,
              recipientName,
              data.schoolId
            );
          }
          savedNotification.sentEmail = true;
          savedNotification.emailSentAt = new Date();
        } catch (error) {
          logger.error("Error sending email notification:", error);
        }
        logger.info(`Email notification queued for user ${data.userId}`);
      }

      if (
        data.sendSms &&
        user.enableSmsNotification &&
        user.phone &&
        isChannelEnabled("Sms")
      ) {
        try {
          await smsService.sendSms(user.phone, data.message);
          savedNotification.sentSms = true;
          savedNotification.smsSentAt = new Date();
        } catch (error) {
          logger.error("Error sending SMS notification:", error);
        }
        logger.info(`SMS notification queued for user ${data.userId}`);
      }

      if (
        user.phone &&
        (data.type === NotificationType.SYSTEM || user.enableWhatsAppNotification) &&
        isChannelEnabled("WhatsApp")
      ) {
        try {
          const result = await whatsappService.sendDirectMessage(user.phone, data.message);
          if (result.success && result.messageId) {
            savedNotification.sentWhatsApp = true;
            savedNotification.whatsAppSentAt = new Date();
            savedNotification.whatsAppMessageId = result.messageId;
            savedNotification.whatsAppStatus = "sent";
          }
        } catch (error) {
          logger.error("Error sending WhatsApp notification:", error);
        }
      }

      if (
        savedNotification.sentEmail ||
        savedNotification.sentSms ||
        savedNotification.sentWhatsApp
      ) {
        await this.notificationRepo.save(savedNotification);
      }

      return {
        success: true,
        message: "Notification created successfully",
        notification: savedNotification,
      };
    } catch (error) {
      logger.error("Error creating notification:", error);
      return {
        success: false,
        message: "Failed to create notification",
      };
    }
  }

  /**
   * Get all notifications for a user with pagination
   */
  async getUserNotifications(
    userId: number,
    options?: {
      isRead?: boolean;
      type?: NotificationType;
      priority?: NotificationPriority;
      pos?: number;
      delta?: number;
      sortBy?: string;
      sortOrder?: "ASC" | "DESC";
    }
  ): Promise<{ success: boolean; message: string; notifications?: Notification[]; pagination?: any }> {
    try {
      const { isRead, type, priority, pos = 0, delta = 10, sortBy = "createdAt", sortOrder = "DESC" } = options || {};

      const queryBuilder = this.notificationRepo.createQueryBuilder("notification").where("notification.userId = :userId", { userId });

      // Apply filters
      if (isRead !== undefined) {
        queryBuilder.andWhere("notification.isRead = :isRead", { isRead });
      }

      if (type) {
        queryBuilder.andWhere("notification.type = :type", { type });
      }

      if (priority) {
        queryBuilder.andWhere("notification.priority = :priority", { priority });
      }

      // Apply sorting
      const sortFieldMap: { [key: string]: string } = {
        createdAt: "notification.createdAt",
        priority: "notification.priority",
        type: "notification.type",
        isRead: "notification.isRead",
      };

      const sortField = sortFieldMap[sortBy] || "notification.createdAt";
      queryBuilder.orderBy(sortField, sortOrder);

      // Get total count
      const count = await queryBuilder.getCount();

      // Apply pagination
      queryBuilder.skip(pos).take(delta);

      const notifications = await queryBuilder.getMany();

      return {
        success: true,
        message: "Notifications retrieved successfully",
        notifications,
        pagination: {
          pos,
          delta,
          count,
        },
      };
    } catch (error) {
      logger.error("Error fetching notifications:", error);
      return {
        success: false,
        message: "Failed to fetch notifications",
      };
    }
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId: number): Promise<number> {
    try {
      return await this.notificationRepo.count({
        where: { userId, isRead: false },
      });
    } catch (error) {
      logger.error("Error getting unread count:", error);
      return 0;
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: number, userId: number): Promise<{ success: boolean; message: string; notification?: Notification }> {
    try {
      const notification = await this.notificationRepo.findOne({
        where: { id: notificationId, userId },
      });

      if (!notification) {
        return {
          success: false,
          message: "Notification not found",
        };
      }

      if (notification.isRead) {
        return {
          success: true,
          message: "Notification already marked as read",
          notification,
        };
      }

      notification.isRead = true;
      notification.readAt = new Date();

      const updated = await this.notificationRepo.save(notification);

      // Notify user in real-time
      if (websocketService.isUserConnected(userId)) {
        websocketService.sendToUser(userId, "notification_read", {
          notificationId,
        });
      }

      return {
        success: true,
        message: "Notification marked as read",
        notification: updated,
      };
    } catch (error) {
      logger.error("Error marking notification as read:", error);
      return {
        success: false,
        message: "Failed to mark notification as read",
      };
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: number): Promise<{ success: boolean; message: string; count?: number }> {
    try {
      const result = await this.notificationRepo.update({ userId, isRead: false }, { isRead: true, readAt: new Date() });

      // Notify user in real-time
      if (websocketService.isUserConnected(userId)) {
        websocketService.sendToUser(userId, "all_notifications_read", {
          count: result.affected || 0,
        });
      }

      return {
        success: true,
        message: "All notifications marked as read",
        count: result.affected || 0,
      };
    } catch (error) {
      logger.error("Error marking all notifications as read:", error);
      return {
        success: false,
        message: "Failed to mark all notifications as read",
      };
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: number, userId: number): Promise<{ success: boolean; message: string }> {
    try {
      const result = await this.notificationRepo.delete({
        id: notificationId,
        userId,
      });

      if (result.affected === 0) {
        return {
          success: false,
          message: "Notification not found",
        };
      }

      // Notify user in real-time
      if (websocketService.isUserConnected(userId)) {
        websocketService.sendToUser(userId, "notification_deleted", {
          notificationId,
        });
      }

      return {
        success: true,
        message: "Notification deleted successfully",
      };
    } catch (error) {
      logger.error("Error deleting notification:", error);
      return {
        success: false,
        message: "Failed to delete notification",
      };
    }
  }

  /**
   * Delete all notifications for a user
   */
  async deleteAllNotifications(userId: number): Promise<{ success: boolean; message: string; count?: number }> {
    try {
      const result = await this.notificationRepo.delete({ userId });

      return {
        success: true,
        message: "All notifications deleted successfully",
        count: result.affected || 0,
      };
    } catch (error) {
      logger.error("Error deleting all notifications:", error);
      return {
        success: false,
        message: "Failed to delete notifications",
      };
    }
  }

  /**
   * Get a single notification by ID
   */
  async getNotificationById(
    notificationId: number,
    userId: number
  ): Promise<{ success: boolean; message: string; notification?: Notification }> {
    try {
      const notification = await this.notificationRepo.findOne({
        where: { id: notificationId, userId },
      });

      if (!notification) {
        return {
          success: false,
          message: "Notification not found",
        };
      }

      return {
        success: true,
        message: "Notification retrieved successfully",
        notification,
      };
    } catch (error) {
      logger.error("Error fetching notification:", error);
      return {
        success: false,
        message: "Failed to fetch notification",
      };
    }
  }

  /**
   * Send bulk notifications to multiple users
   */
  async sendBulkNotifications(data: {
    userIds: number[];
    schoolId: number; // Required: schoolId is mandatory
    type: NotificationType;
    priority?: NotificationPriority;
    title: string;
    message: string;
    actionUrl?: string;
    actionLabel?: string;
    metadata?: Record<string, any>;
  }): Promise<{ success: boolean; message: string; count?: number }> {
    try {
      // Validate schoolId is provided
      if (!data.schoolId) {
        return {
          success: false,
          message: "schoolId is required",
        };
      }

      const notifications = data.userIds.map((userId) =>
        this.notificationRepo.create({
          userId,
          schoolId: data.schoolId,
          type: data.type,
          priority: data.priority || NotificationPriority.MEDIUM,
          title: data.title,
          message: data.message,
          actionUrl: data.actionUrl,
          actionLabel: data.actionLabel,
          metadata: data.metadata,
          sentInApp: true,
        })
      );

      const saved = await this.notificationRepo.save(notifications);

      // Send real-time notifications to connected users
      saved.forEach((notification) => {
        if (websocketService.isUserConnected(notification.userId)) {
          websocketService.sendToUser(notification.userId, "new_notification", {
            notification,
          });
        }
      });

      return {
        success: true,
        message: `${saved.length} notifications sent successfully`,
        count: saved.length,
      };
    } catch (error) {
      logger.error("Error sending bulk notifications:", error);
      return {
        success: false,
        message: "Failed to send bulk notifications",
      };
    }
  }

  /**
   * Clean up expired notifications
   */
  async cleanupExpiredNotifications(): Promise<{ success: boolean; message: string; count?: number }> {
    try {
      const result = await this.notificationRepo.delete({
        expiresAt: LessThan(new Date()),
      });

      logger.info(`Cleaned up ${result.affected || 0} expired notifications`);

      return {
        success: true,
        message: "Expired notifications cleaned up",
        count: result.affected || 0,
      };
    } catch (error) {
      logger.error("Error cleaning up expired notifications:", error);
      return {
        success: false,
        message: "Failed to clean up expired notifications",
      };
    }
  }

  /**
   * Helper method to send notification easier from other services
   */
  async sendNotification(data: {
    userId: number;
    title: string;
    message: string;
    type: string | NotificationType;
    data?: any;
    priority?: string | NotificationPriority;
    sendEmail?: boolean;
    sendSms?: boolean;
    schoolId?: number;
    transactional?: boolean;
    actionUrl?: string;
    actionLabel?: string;
    relatedEntityType?: string;
    relatedEntityId?: number;
  }) {
    // Need to find schoolId from user if not provided in future
    // For now we will fetch user to get schoolId
    const user = await this.userRepo.findOne({ where: { id: data.userId }, select: { id: true, role: true } });
    if (!user) {
      logger.warn(`Cannot send notification to user ${data.userId}: User not found`);
      return;
    }

    // Treat 0 as "not provided" so the DB lookup can run; otherwise nullish coalescing would short-circuit on 0.
    const providedSchoolId = data.schoolId && data.schoolId > 0 ? data.schoolId : undefined;
    const schoolId = providedSchoolId ?? (await getSchoolIdForRole(AppDataSource.manager, user.id, user.role));
    if (!schoolId) {
      logger.warn(
        `Cannot send notification to user ${data.userId}: schoolId not provided and the user is associated with zero or multiple schools. Pass schoolId explicitly.`
      );
      return;
    }

    return this.createNotification({
      userId: data.userId,
      schoolId,
      type: data.type as NotificationType,
      priority: (data.priority as NotificationPriority) || NotificationPriority.MEDIUM,
      title: data.title,
      message: data.message,
      metadata: data.data,
      sendEmail: data.sendEmail,
      sendSms: data.sendSms,
      transactional: data.transactional,
      actionUrl: data.actionUrl,
      actionLabel: data.actionLabel,
      relatedEntityType: data.relatedEntityType,
      relatedEntityId: data.relatedEntityId,
    });
  }

  /**
   * Send notification to all admins of a school
   */
  async notifyAdmins(data: {
    schoolId: number;
    title: string;
    message: string;
    type: NotificationType;
    priority?: NotificationPriority;
    data?: any;
    actionUrl?: string;
    actionLabel?: string;
  }) {
    try {
      const admins = await this.adminRepo.find({
        where: { schoolId: data.schoolId },
        select: { userId: true }
      });

      if (admins.length === 0) return;

      const userIds = admins.map(a => a.userId);
      return this.sendBulkNotifications({
        userIds,
        schoolId: data.schoolId,
        type: data.type,
        priority: data.priority,
        title: data.title,
        message: data.message,
        metadata: data.data,
        actionUrl: data.actionUrl,
        actionLabel: data.actionLabel
      });
    } catch (error) {
      logger.error(`Error notifying admins for school ${data.schoolId}:`, error);
      return { success: false, message: "Failed to notify admins" };
    }
  }

  /**
   * Send notification to all parents of a specific student
   */
  async notifyStudentParents(data: {
    studentId: number;
    schoolId: number;
    title: string;
    message: string;
    type: NotificationType;
    priority?: NotificationPriority;
    data?: any;
    actionUrl?: string;
    actionLabel?: string;
    sendEmail?: boolean;
    sendSms?: boolean;
  }) {
    try {
      const student = await this.studentRepo.findOne({
        where: { id: data.studentId },
        relations: ["parents", "parents.user"]
      });

      if (!student || !student.parents || student.parents.length === 0) return;

      const results = [];
      for (const parent of student.parents) {
        if (parent.userId) {
          results.push(this.sendNotification({
            userId: parent.userId,
            schoolId: data.schoolId,
            title: data.title,
            message: data.message,
            type: data.type,
            priority: data.priority,
            data: data.data,
            sendEmail: data.sendEmail,
            sendSms: data.sendSms
          }));
        }
      }
      return Promise.all(results);
    } catch (error) {
      logger.error(`Error notifying parents of student ${data.studentId}:`, error);
      return [];
    }
  }
}

export const notificationService = new NotificationService();
