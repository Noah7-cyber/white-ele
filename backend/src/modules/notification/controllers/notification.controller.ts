import { Request, Response } from "express";
import { notificationService } from "../services/notification.service";
import { websocketService } from "../services/websocket.service";
import { NotificationType, NotificationPriority } from "../../shared/entities/Notification";
import { logger } from "../../shared/utils/logger";
import { AuthenticatedRequest } from "../../auth/middleware/middleware";
import { requireSchoolId } from "../../shared/utils/tenant-context";

export class NotificationController {
  /**
   * Get all notifications for the authenticated user
   */
  async getUserNotifications(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      const { isRead, type, priority, pos, delta, sortBy, sortOrder } = req.query;

      const result = await notificationService.getUserNotifications(userId, {
        isRead: isRead === "true" ? true : isRead === "false" ? false : undefined,
        type: type as NotificationType,
        priority: priority as NotificationPriority,
        pos: pos ? parseInt(pos as string) : undefined,
        delta: delta ? parseInt(delta as string) : undefined,
        sortBy: sortBy as string,
        sortOrder: (sortOrder as "ASC" | "DESC") || "DESC",
      });

      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error("Error in getUserNotifications:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      const count = await notificationService.getUnreadCount(userId);

      return res.status(200).json({
        success: true,
        count,
      });
    } catch (error) {
      logger.error("Error in getUnreadCount:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Get a single notification by ID
   */
  async getNotificationById(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      const notificationId = parseInt(req.params["id"] || "0");
      if (isNaN(notificationId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid notification ID",
        });
      }

      const result = await notificationService.getNotificationById(notificationId, userId);

      return res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      logger.error("Error in getNotificationById:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Create a new notification (admin only)
   */
  async createNotification(req: Request, res: Response): Promise<Response> {
    try {
      const result = await notificationService.createNotification(req.body);

      return res.status(result.success ? 201 : 400).json(result);
    } catch (error) {
      logger.error("Error in createNotification:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      const notificationId = parseInt(req.params["id"] || "0");
      if (isNaN(notificationId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid notification ID",
        });
      }

      const result = await notificationService.markAsRead(notificationId, userId);

      return res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      logger.error("Error in markAsRead:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      const result = await notificationService.markAllAsRead(userId);

      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error("Error in markAllAsRead:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      const notificationId = parseInt(req.params["id"] || "0");
      if (isNaN(notificationId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid notification ID",
        });
      }

      const result = await notificationService.deleteNotification(notificationId, userId);

      return res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      logger.error("Error in deleteNotification:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Delete all notifications for a user
   */
  async deleteAllNotifications(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      const result = await notificationService.deleteAllNotifications(userId);

      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error("Error in deleteAllNotifications:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Send bulk notifications (admin only)
   */
  async sendBulkNotifications(req: Request, res: Response): Promise<Response> {
    try {
      const result = await notificationService.sendBulkNotifications(req.body);

      return res.status(result.success ? 201 : 400).json(result);
    } catch (error) {
      logger.error("Error in sendBulkNotifications:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Get WebSocket connection stats (admin only)
   */
  async getWebSocketStats(_req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const stats = {
        connectedUsers: websocketService.getConnectedUsersCount(),
        userIds: websocketService.getConnectedUserIds(),
      };

      return res.status(200).json({
        success: true,
        stats,
      });
    } catch (error) {
      logger.error("Error in getWebSocketStats:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Disconnect a user from WebSocket (admin only)
   */
  async disconnectUser(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = parseInt(req.params["userId"] || "0");
      if (isNaN(userId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID",
        });
      }

      websocketService.disconnectUser(userId);

      return res.status(200).json({
        success: true,
        message: `User ${userId} disconnected from WebSocket`,
      });
    } catch (error) {
      logger.error("Error in disconnectUser:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Test sending a notification (development only)
   */
  async testNotification(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user.id;
      let schoolId: number;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      try {
        schoolId = requireSchoolId(req);
      } catch (error: any) {
        return res.status(400).json({
          success: false,
          message: error?.message || "User does not have a schoolId",
        });
      }

      const result = await notificationService.createNotification({
        userId,
        schoolId,
        type: NotificationType.INFO,
        priority: NotificationPriority.LOW,
        title: "Test Notification",
        message: "This is a test notification sent via API",
        actionUrl: "/dashboard",
        actionLabel: "Go to Dashboard",
      });

      return res.status(result.success ? 201 : 400).json(result);
    } catch (error) {
      logger.error("Error in testNotification:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
}

export const notificationController = new NotificationController();
