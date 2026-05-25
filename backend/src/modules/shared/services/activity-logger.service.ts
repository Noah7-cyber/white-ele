import { Request } from "express";
import { AppDataSource } from "../../core/config/database";
import { ActivityLog } from "../entities/ActivityLog";
import { logger } from "../utils/logger";
import { notificationService } from "../../notification";
import { NotificationType, NotificationPriority } from "../entities/Notification";
import { getSchoolIdsForUser } from "../utils/user-school";

export interface ActivityLogData {
  userId?: number;
  resource: string;
  action: string;
  title: string;
  description?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

interface NotificationConfig {
  enabled: boolean;
  type: NotificationType;
  priority: NotificationPriority;
  titleTemplate: (resource: string, id?: string | number, metadata?: Record<string, any>) => string;
  messageTemplate: (resource: string, id?: string | number, metadata?: Record<string, any>) => string;
  actionUrl?: (resource: string, id?: string | number) => string;
  actionLabel?: string;
  sendEmail?: boolean | ((metadata?: Record<string, any>) => boolean);
  sendSms?: boolean | ((metadata?: Record<string, any>) => boolean);
  // Optional: custom userId resolver for notifications (e.g., notify owner instead of actor)
  getTargetUserId?: (userId?: number, metadata?: Record<string, any>) => number | undefined;
}

/**
 * Activity Logger Service
 *
 * Centralized service for logging all user activities and triggering notifications
 * Use this for controller-level logging with Express Request context
 *
 * NOTIFICATION TRIGGERS:
 * This service automatically creates notifications for configured activity types.
 * To enable notification for an activity, include metadata in the log call:
 *
 * @example
 * await activityLogger.log({
 *   userId: 123,
 *   resource: "booking",
 *   action: "create",
 *   title: "Created booking #456",
 *   metadata: {
 *     id: 456,              // Entity ID for notification linking
 *     propertyName: "Ocean Villa",  // Used in notification message
 *     // Add any other data needed for notification templates
 *   }
 * });
 *
 * See notificationConfigs Map below for configured activity:action triggers
 */
export class ActivityLoggerService {
  private activityLogRepository = AppDataSource.getRepository(ActivityLog);

  /**
   * Notification configuration for different activity types
   * Maps resource:action to notification settings
   */
  private notificationConfigs: Map<string, NotificationConfig> = new Map<string, NotificationConfig>([
    // Booking notifications
    [
      "booking:create",
      {
        enabled: true,
        type: NotificationType.BOOKING,
        priority: NotificationPriority.HIGH,
        titleTemplate: () => "Booking Confirmed",
        messageTemplate: (_resource, id, metadata) =>
          `Your booking ${id ? `#${id}` : ""} has been confirmed${metadata?.["propertyName"] ? ` for ${metadata["propertyName"]}` : ""}`,
        actionUrl: (_resource, id) => `/bookings/${id}`,
        actionLabel: "View Booking",
        sendEmail: true,
      },
    ],
    [
      "booking:status_change",
      {
        enabled: true,
        type: NotificationType.BOOKING,
        priority: NotificationPriority.MEDIUM,
        titleTemplate: () => "Booking Status Updated",
        messageTemplate: (_resource, id, metadata) =>
          `Booking ${id ? `#${id}` : ""} status changed to ${metadata?.["newStatus"] || "updated"}`,
        actionUrl: (_resource, id) => `/bookings/${id}`,
        actionLabel: "View Booking",
      },
    ],
    [
      "booking:delete",
      {
        enabled: true,
        type: NotificationType.BOOKING,
        priority: NotificationPriority.HIGH,
        titleTemplate: () => "Booking Cancelled",
        messageTemplate: (_resource, id) => `Booking ${id ? `#${id}` : ""} has been cancelled`,
        actionUrl: () => "/bookings",
        actionLabel: "View Bookings",
      },
    ],

    // Property notifications
    [
      "property:create",
      {
        enabled: true,
        type: NotificationType.PROPERTY,
        priority: NotificationPriority.MEDIUM,
        titleTemplate: () => "Property Listed Successfully",
        messageTemplate: (_resource, id, metadata) =>
          `Property ${metadata?.["name"] ? `"${metadata["name"]}"` : `#${id}`} has been successfully listed`,
        actionUrl: (_resource, id) => `/properties/${id}`,
        actionLabel: "View Property",
      },
    ],
    [
      "property:status_change",
      {
        enabled: true,
        type: NotificationType.PROPERTY,
        priority: NotificationPriority.MEDIUM,
        titleTemplate: () => "Property Status Updated",
        messageTemplate: (_resource, _id, metadata) => `Property status changed to ${metadata?.["newStatus"] || "updated"}`,
        actionUrl: (_resource, id) => `/properties/${id}`,
        actionLabel: "View Property",
      },
    ],
    [
      "property:approve",
      {
        enabled: true,
        type: NotificationType.SUCCESS,
        priority: NotificationPriority.HIGH,
        titleTemplate: () => "Property Approved",
        messageTemplate: (_resource, id, metadata) =>
          `Your property ${metadata?.["name"] ? `"${metadata["name"]}"` : `#${id}`} has been approved and is now live`,
        actionUrl: (_resource, id) => `/properties/${id}`,
        actionLabel: "View Property",
        sendEmail: true,
      },
    ],

    // Invoice notifications
    [
      "invoice:create",
      {
        enabled: true,
        type: NotificationType.INVOICE,
        priority: NotificationPriority.HIGH,
        titleTemplate: () => "New Invoice",
        messageTemplate: (_resource, id, metadata) =>
          `Invoice ${metadata?.["invoiceNumber"] || `#${id}`} for ${metadata?.["totalAmount"] ? `$${metadata["totalAmount"]}` : "payment"
          } has been created`,
        actionUrl: (_resource, id) => `/invoices/${id}`,
        actionLabel: "View Invoice",
        sendEmail: true,
      },
    ],
    [
      "invoice:status_change",
      {
        enabled: true,
        type: NotificationType.PAYMENT,
        priority: NotificationPriority.MEDIUM,
        titleTemplate: (_resource, _id, metadata) => (metadata?.["newStatus"] === "paid" ? "Payment Received" : "Invoice Status Updated"),
        messageTemplate: (_resource, id, metadata) =>
          metadata?.["newStatus"] === "paid"
            ? `Payment received for invoice ${metadata?.["invoiceNumber"] || `#${id}`}`
            : `Invoice ${metadata?.["invoiceNumber"] || `#${id}`} status: ${metadata?.["newStatus"]}`,
        actionUrl: (_resource, id) => `/invoices/${id}`,
        actionLabel: "View Invoice",
        sendEmail: (metadata) => metadata?.["newStatus"] === "paid" || metadata?.["newStatus"] === "overdue",
      },
    ],

    // Maintenance notifications
    [
      "maintenance:create",
      {
        enabled: true,
        type: NotificationType.MAINTENANCE,
        priority: NotificationPriority.HIGH,
        titleTemplate: () => "New Maintenance Request",
        messageTemplate: (_resource, id, metadata) =>
          `New ${metadata?.["serviceType"] || "maintenance"} request ${id ? `#${id}` : ""}${metadata?.["propertyName"] ? ` for ${metadata["propertyName"]}` : ""
          }`,
        actionUrl: (_resource, id) => `/maintenance/${id}`,
        actionLabel: "View Request",
        getTargetUserId: (userId, metadata) => metadata?.["ownerId"] || userId, // Notify owner, not requester
      },
    ],
    [
      "maintenance:status_change",
      {
        enabled: true,
        type: NotificationType.MAINTENANCE,
        priority: NotificationPriority.MEDIUM,
        titleTemplate: (_resource, _id, metadata) =>
          metadata?.["newStatus"] === "completed" ? "Maintenance Completed" : "Maintenance Status Updated",
        messageTemplate: (_resource, id, metadata) =>
          metadata?.["newStatus"] === "completed"
            ? `Maintenance request ${id ? `#${id}` : ""} has been completed`
            : `Maintenance request ${id ? `#${id}` : ""} status: ${metadata?.["newStatus"]}`,
        actionUrl: (_resource, id) => `/maintenance/${id}`,
        actionLabel: "View Details",
        getTargetUserId: (userId, metadata) => metadata?.["requestedBy"] || userId, // Notify requester
      },
    ],

    // User/Account notifications
    [
      "auth:register",
      {
        enabled: true,
        type: NotificationType.SUCCESS,
        priority: NotificationPriority.MEDIUM,
        titleTemplate: () => "Welcome!",
        messageTemplate: (_resource, _id, metadata) => `Welcome to our platform, ${metadata?.["name"] || ""}!`,
        actionUrl: () => "/dashboard",
        actionLabel: "Get Started",
        sendEmail: true,
      },
    ],
    [
      "auth:reset_password",
      {
        enabled: true,
        type: NotificationType.INFO,
        priority: NotificationPriority.HIGH,
        titleTemplate: () => "Password Reset",
        messageTemplate: () => "Your password has been successfully reset",
        actionUrl: () => "/login",
        actionLabel: "Login Now",
        sendEmail: true,
      },
    ],
    [
      "auth:change_password",
      {
        enabled: true,
        type: NotificationType.INFO,
        priority: NotificationPriority.MEDIUM,
        titleTemplate: () => "Password Changed",
        messageTemplate: () => "Your password has been successfully changed",
        actionUrl: () => "/account/security",
        actionLabel: "Security Settings",
      },
    ],

    // Agent/Owner/Customer account notifications
    [
      "agent:create",
      {
        enabled: true,
        type: NotificationType.SUCCESS,
        priority: NotificationPriority.MEDIUM,
        titleTemplate: () => "Welcome, Agent!",
        messageTemplate: (_resource, _id, metadata) => `Welcome ${metadata?.["name"] || ""}! Your agent account has been created`,
        actionUrl: () => "/dashboard",
        actionLabel: "Get Started",
        sendEmail: true,
      },
    ],
    [
      "owner:create",
      {
        enabled: true,
        type: NotificationType.SUCCESS,
        priority: NotificationPriority.MEDIUM,
        titleTemplate: () => "Welcome, Property Owner!",
        messageTemplate: (_resource, _id, metadata) => `Welcome ${metadata?.["name"] || ""}! Your owner account has been created`,
        actionUrl: () => "/dashboard",
        actionLabel: "Get Started",
        sendEmail: true,
      },
    ],
    [
      "customer:create",
      {
        enabled: true,
        type: NotificationType.SUCCESS,
        priority: NotificationPriority.MEDIUM,
        titleTemplate: () => "Welcome!",
        messageTemplate: (_resource, _id, metadata) => `Welcome ${metadata?.["name"] || ""}! Your account has been created`,
        actionUrl: () => "/dashboard",
        actionLabel: "Get Started",
        sendEmail: true,
      },
    ],

    // Lead notifications
    [
      "lead:create",
      {
        enabled: true,
        type: NotificationType.INFO,
        priority: NotificationPriority.LOW,
        titleTemplate: () => "Thank You for Your Interest",
        messageTemplate: () => "We've received your inquiry and will get back to you soon",
        actionUrl: () => "/dashboard",
        actionLabel: "View Dashboard",
      },
    ],
  ]);

  /**
   * Log an activity with Express Request context
   */
  async logFromRequest(req: Request, data: Omit<ActivityLogData, "ipAddress" | "userAgent">): Promise<void> {
    try {
      const userId = (req as any).user?.id || data.userId;
      const ipAddress = this.extractIpAddress(req);
      const userAgent = req.get("user-agent");

      // Ensure userId is defined before logging
      if (!userId) {
        logger.warn("Activity log attempted without userId", {
          resource: data.resource,
          action: data.action,
          title: data.title,
        });
      }

      await this.log({
        ...data,
        userId: userId ? Number(userId) : undefined,
        ipAddress,
        userAgent,
      });
    } catch (error) {
      logger.error("Failed to log activity from request:", error);
    }
  }

  /**
   * Log an activity manually and trigger notifications if configured
   */
  async log(data: ActivityLogData): Promise<void> {
    try {
      const description = data.description || (data.metadata ? JSON.stringify(data.metadata) : undefined);

      // Ensure userId is a number or undefined (not null)
      const userId = data.userId ? Number(data.userId) : undefined;

      const activityLog = this.activityLogRepository.create({
        userId,
        resource: data.resource,
        action: data.action,
        title: data.title,
        description,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      });

      await this.activityLogRepository.save(activityLog);

      // Trigger notification if configured for this activity
      await this.triggerNotification(data);
    } catch (error) {
      logger.error("Failed to log activity:", error);
    }
  }

  /**
   * Trigger a notification based on activity if configured
   */
  private async triggerNotification(data: ActivityLogData): Promise<void> {
    try {
      const configKey = `${data.resource}:${data.action}`;
      const config = this.notificationConfigs.get(configKey);

      if (!config || !config.enabled) {
        return; // No notification configured for this activity
      }

      // Extract ID from metadata if available
      const entityId = data.metadata?.["id"] || data.metadata?.["entityId"];

      // Determine target user ID
      const targetUserId = config.getTargetUserId ? config.getTargetUserId(data.userId, data.metadata) : data.userId;

      if (!targetUserId) {
        return; // No user to notify
      }

      // Get schoolId from metadata or fetch from user
      let schoolId: number | undefined = data.metadata?.["schoolId"];

      if (!schoolId && targetUserId) {
        const ids = await getSchoolIdsForUser(AppDataSource.manager, targetUserId);
        // If user has multiple schools, pick the first one as fallback instead of failing
        schoolId = ids.length > 0 ? ids[0] : undefined;
      }

      if (!schoolId) {
        // Last resort: check if there's a system-wide fallback or log a more detailed warning
        logger.warn(`Notification skipped for user ${targetUserId}: Multiple or zero school associations found, and no schoolId provided in metadata.`);
        return;
      }

      // Resolve email/SMS flags
      const sendEmail = typeof config.sendEmail === "function" ? config.sendEmail(data.metadata) : config.sendEmail || false;

      const sendSms = typeof config.sendSms === "function" ? config.sendSms(data.metadata) : config.sendSms || false;

      // Create notification
      await notificationService.createNotification({
        userId: targetUserId,
        schoolId,
        type: config.type,
        priority: config.priority,
        title: config.titleTemplate(data.resource, entityId, data.metadata),
        message: config.messageTemplate(data.resource, entityId, data.metadata),
        actionUrl: config.actionUrl ? config.actionUrl(data.resource, entityId) : undefined,
        actionLabel: config.actionLabel,
        relatedEntityType: data.resource,
        relatedEntityId: entityId ? Number(entityId) : undefined,
        metadata: data.metadata,
        sendEmail,
        sendSms,
      });
    } catch (error) {
      // Don't throw - notification failures shouldn't break activity logging
      logger.error("Failed to trigger notification for activity:", error);
    }
  }

  /**
   * Log multiple activities in batch
   */
  async logBatch(activities: ActivityLogData[]): Promise<void> {
    try {
      const activityLogs = activities.map((data) => {
        const description = data.description || (data.metadata ? JSON.stringify(data.metadata) : undefined);

        return this.activityLogRepository.create({
          userId: data.userId,
          resource: data.resource,
          action: data.action,
          title: data.title,
          description,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        });
      });

      await this.activityLogRepository.save(activityLogs);
    } catch (error) {
      logger.error("Failed to log batch activities:", error);
    }
  }

  /**
   * Helper: Log CREATE operation
   */
  async logCreate(resource: string, id: number | string, userId?: number, metadata?: Record<string, any>, req?: Request): Promise<void> {
    const data: ActivityLogData = {
      userId,
      resource,
      action: "create",
      title: `Created ${resource} #${id}`,
      metadata,
    };

    if (req) {
      await this.logFromRequest(req, data);
    } else {
      await this.log(data);
    }
  }

  /**
   * Helper: Log UPDATE operation
   */
  async logUpdate(resource: string, id: number | string, userId?: number, metadata?: Record<string, any>, req?: Request): Promise<void> {
    const data: ActivityLogData = {
      userId,
      resource,
      action: "update",
      title: `Updated ${resource} #${id}`,
      metadata,
    };

    if (req) {
      await this.logFromRequest(req, data);
    } else {
      await this.log(data);
    }
  }

  /**
   * Helper: Log DELETE operation
   */
  async logDelete(resource: string, id: number | string, userId?: number, metadata?: Record<string, any>, req?: Request): Promise<void> {
    const data: ActivityLogData = {
      userId,
      resource,
      action: "delete",
      title: `Deleted ${resource} #${id}`,
      metadata,
    };

    if (req) {
      await this.logFromRequest(req, data);
    } else {
      await this.log(data);
    }
  }

  /**
   * Helper: Log APPROVE operation
   */
  async logApprove(resource: string, id: number | string, userId?: number, metadata?: Record<string, any>, req?: Request): Promise<void> {
    const data: ActivityLogData = {
      userId,
      resource,
      action: "approve",
      title: `Approved ${resource} #${id}`,
      metadata,
    };

    if (req) {
      await this.logFromRequest(req, data);
    } else {
      await this.log(data);
    }
  }

  /**
   * Helper: Log STATUS CHANGE operation
   */
  async logStatusChange(
    resource: string,
    id: number | string,
    oldStatus: string,
    newStatus: string,
    userId?: number,
    req?: Request
  ): Promise<void> {
    const data: ActivityLogData = {
      userId,
      resource,
      action: "status_change",
      title: `Changed ${resource} #${id} status from ${oldStatus} to ${newStatus}`,
      metadata: {
        oldStatus,
        newStatus,
      },
    };

    if (req) {
      await this.logFromRequest(req, data);
    } else {
      await this.log(data);
    }
  }

  /**
   * Extract IP address from Express Request
   */
  private extractIpAddress(req: Request): string | undefined {
    const forwardedFor = req.headers["x-forwarded-for"] as string | undefined;
    const firstIp = forwardedFor ? forwardedFor.split(",")[0]?.trim() : undefined;
    return firstIp || (req.headers["x-real-ip"] as string) || req.socket.remoteAddress || req.ip;
  }

  /**
   * Add or update a notification configuration for a specific activity type
   * Useful for adding custom notification triggers at runtime
   */
  public setNotificationConfig(resource: string, action: string, config: NotificationConfig): void {
    const key = `${resource}:${action}`;
    this.notificationConfigs.set(key, config);
  }

  /**
   * Disable notifications for a specific activity type
   */
  public disableNotification(resource: string, action: string): void {
    const key = `${resource}:${action}`;
    const config = this.notificationConfigs.get(key);
    if (config) {
      config.enabled = false;
    }
  }

  /**
   * Enable notifications for a specific activity type
   */
  public enableNotification(resource: string, action: string): void {
    const key = `${resource}:${action}`;
    const config = this.notificationConfigs.get(key);
    if (config) {
      config.enabled = true;
    }
  }

  /**
   * Get notification configuration for debugging
   */
  public getNotificationConfig(resource: string, action: string): NotificationConfig | undefined {
    const key = `${resource}:${action}`;
    return this.notificationConfigs.get(key);
  }
}

// Export singleton instance
export const activityLogger = new ActivityLoggerService();
