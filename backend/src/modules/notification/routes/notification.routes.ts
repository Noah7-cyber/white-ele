import { Router } from "express";
import { notificationController } from "../controllers/notification.controller";
import { authenticate, requireRole } from "../../auth/middleware/middleware";
import {
  createNotificationValidation,
  bulkNotificationValidation,
  getNotificationsValidation,
  notificationIdValidation,
  userIdValidation,
} from "../validation/notification.validation";

const router = Router();

/**
 * User notification routes (authenticated users)
 */

// Get all notifications for the authenticated user
router.get("/", authenticate, ...getNotificationsValidation, (req, res) => notificationController.getUserNotifications(req as any, res));

// Get unread notification count
router.get("/unread-count", authenticate, (req, res) => notificationController.getUnreadCount(req as any, res));

// Get a single notification by ID
router.get("/:id", authenticate, ...notificationIdValidation, (req, res) => notificationController.getNotificationById(req as any, res));

// Mark a notification as read
router.patch("/:id/read", authenticate, ...notificationIdValidation, (req, res) => notificationController.markAsRead(req as any, res));

// Mark all notifications as read
router.patch("/read-all", authenticate, (req, res) => notificationController.markAllAsRead(req as any, res));

// Delete a notification
router.delete("/:id", authenticate, ...notificationIdValidation, (req, res) => notificationController.deleteNotification(req as any, res));

// Delete all notifications
router.delete("/", authenticate, (req, res) => notificationController.deleteAllNotifications(req as any, res));

/**
 * Admin notification routes
 */

// Create a new notification (admin only)
router.post("/admin/create", authenticate, requireRole(["admin", "super_admin"]) as any, ...createNotificationValidation, (req, res) =>
  notificationController.createNotification(req as any, res)
);

// Send bulk notifications (admin only)
router.post("/admin/bulk", authenticate, requireRole(["admin", "super_admin"]) as any, ...bulkNotificationValidation, (req, res) =>
  notificationController.sendBulkNotifications(req as any, res)
);

// Get WebSocket connection stats (admin only)
router.get("/admin/websocket/stats", authenticate, requireRole(["admin", "super_admin"]) as any, (req, res) =>
  notificationController.getWebSocketStats(req as any, res)
);

// Disconnect a user from WebSocket (admin only)
router.post(
  "/admin/websocket/disconnect/:userId",
  authenticate,
  requireRole(["admin", "super_admin"]) as any,
  ...userIdValidation,
  (req, res) => notificationController.disconnectUser(req as any, res)
);

/**
 * Development/Testing routes
 */

// Test notification endpoint (only enable in development)
if (process.env["NODE_ENV"] !== "production") {
  router.post("/test", authenticate, (req, res) => notificationController.testNotification(req as any, res));
}

export { router as notificationRouter };
