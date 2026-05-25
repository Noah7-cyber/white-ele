import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { jwtService } from "../../auth/services/jwt.service";
import { AppDataSource } from "../../core/config/database";
import { User } from "../../shared/entities/User";
import { Repository } from "typeorm";
import { logger } from "../../shared/utils/logger";
import { messagingService } from "../../messaging/services/message.service";
import { MessageStatus, MessageType } from "../../shared/entities";
import { getSchoolIdsForUser } from "../../shared/utils/user-school";
import { notificationService } from "..";
import { NotificationType } from "../../shared/entities/Notification";
import { joinFrontendUrl } from "../../shared/services/utils";

interface AuthenticatedSocket extends Socket {
  userId?: number;
  userRole?: string;
}

interface SendMessageData {
  conversationId?: number;
  content?: string;
  messageSubject?: string;
  sender: number;
  mediaUrl?: string | string[];
}

export class WebSocketService {
  private io: SocketIOServer | null = null;
  private userRepo: Repository<User>;
  private connectedUsers: Map<number, Set<string>> = new Map(); // userId -> Set of socketIds

  constructor() {
    this.userRepo = AppDataSource.getRepository(User);
  }

  /** 
   * Initialize Socket.IO server
   */
  initialize(httpServer: HTTPServer): SocketIOServer {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true,
      },
      transports: ["websocket", "polling"],
      allowUpgrades: true,
      pingInterval: 25000,
      pingTimeout: 60000
    });

    // Authentication middleware   
    this.io.use(async (socket: AuthenticatedSocket, next: any) => {
      try {
        const token = socket.handshake.auth["token"] || socket.handshake.headers.authorization?.replace("Bearer ", "");

        if (!token) {
          return next(new Error("Authentication token required"));
        }

        const decoded = await jwtService.verifyAccessToken(token);

        // Verify user exists
        const user = await this.userRepo.findOne({
          where: { id: decoded.userId },
        });

        if (!user || !user.isActive) {
          return next(new Error("Invalid or inactive user"));
        }

        socket.userId = decoded.userId;
        socket.userRole = decoded.role;
        next();
      } catch (error) {
        logger.error("Socket authentication error:", error);
        next(new Error("Authentication failed"));
      }
    });

    // Connection handler
    this.io.on("connection", (socket: AuthenticatedSocket) => {
      this.handleConnection(socket);
    });

    logger.info("WebSocket service initialized");
    return this.io;
  }

  async processSendMessage(params: {
    conversationId?: number;
    senderId?: number;
    receiverId?: number;
    content?: string;
    mediaUrl?: string | string[];
    messageSubject?: string;
    emitToConversation?: boolean;
  }): Promise<any> {
    const {
      conversationId,
      senderId,
      content,
      mediaUrl,
      messageSubject,
      emitToConversation = true,
      receiverId: paramReceiverId,
    } = params

    if (!conversationId && !paramReceiverId) {
      throw new Error("conversationId or receiverId is required.");
    }

    const normalizedContent = typeof content === "string" ? content.trim() : "";
    const hasMedia =
      (typeof mediaUrl === "string" && mediaUrl.trim().length > 0) ||
      (Array.isArray(mediaUrl) && mediaUrl.some((v) => typeof v === "string" && v.trim().length > 0));

    if (!normalizedContent && !hasMedia) {
      throw new Error("Message content or media is required.");
    }

    const response = await messagingService.saveMessage({
      conversationId,
      sender1Id: senderId,
      sender2Id: paramReceiverId,
      content: normalizedContent,
      type: MessageType.TEXT,
      status: MessageStatus.SENT,
      mediaUrl: mediaUrl ? Array.isArray(mediaUrl) ? mediaUrl : [mediaUrl] : undefined,
      messageSubject: messageSubject || "",
    });

    if (!response.success || !response.data) {
      throw new Error(response.message || "Failed to save message");
    }

    const { message: newMessage, conversation, receiverId: msgReceiverId } = response.data;
    const validConversationId = conversationId || conversation?.id;

    // Emit to WebSocket subscribers (only if enabled)
    if (emitToConversation && this.io && validConversationId) {
      this.io
        .to(`conversation:${validConversationId}`)
        .emit("app:chat", {
          id: newMessage.id,
          conversationId: validConversationId,
          senderId,
          content: normalizedContent,
          sentAt: newMessage.sentAt,
          mediaUrl: newMessage.mediaUrl ? Array.isArray(newMessage.mediaUrl) ? newMessage.mediaUrl : [newMessage.mediaUrl] : undefined,
          messageSubject,
          type: newMessage.type,
          status: newMessage.status,
          sender1Id: conversation?.sender1Id,
          receiverId: msgReceiverId,
        });

      if (msgReceiverId) {
        this.io.to(`user:${msgReceiverId}`).emit("app:new_conversation", {
          conversationId: validConversationId,
          message: newMessage,
          senderId,
          isNewConversation: !conversationId,
          conversation: conversation
        });
      }
    }

    // Trigger email notification for the receiver
    if (msgReceiverId) {
      try {
        const receiver = await this.userRepo.findOne({
          where: { id: msgReceiverId },
          select: ["id", "email", "firstName", "lastName", "enableEmailNotification"]
        });

        // Only send email if the receiver is not currently connected to WebSocket (or if you want to notify regardless)
        // and has enabled email notifications.
        if (receiver && receiver.email && receiver.enableEmailNotification) {
          const sender = await this.userRepo.findOne({
            where: { id: senderId },
            select: ["firstName", "lastName"]
          });

          const senderName = sender ? `${sender.firstName} ${sender.lastName}` : "Someone";
          const recipientName = receiver.firstName || "there";
          const conversationUrl = joinFrontendUrl(`messages?id=${validConversationId}`);

          const { emailService } = await import("../../shared/services/email.service");
          await emailService.sendNewMessageEmail(
            receiver.email,
            recipientName,
            senderName,
            normalizedContent,
            conversationUrl
          );
          logger.info(`Message email notification sent to user ${msgReceiverId}`);
        }
      } catch (emailError) {
        logger.error(`Failed to send message email notification to user ${msgReceiverId}:`, emailError);
      }
    }

    // Persist In-App Notification
    if (msgReceiverId) {
      try {
        const sender = await this.userRepo.findOne({
          where: { id: senderId },
          select: ["firstName", "lastName"]
        });
        const senderName = sender ? `${sender.firstName} ${sender.lastName}` : "Someone";

        // Get school context if possible (default to 0 if not found, though in multi-tenant we'd prefer a real ID)
        // For now, using schoolId 0 or fetching from previous logic if available.
        // Since messages are often cross-tenant or person-to-person, we might need to resolve a primary school.
        // For consistency with other services, we'll try to find a relevant schoolId.
        const schoolIds = await getSchoolIdsForUser(AppDataSource.manager, msgReceiverId);
        const targetSchoolId = (schoolIds.length > 0 && schoolIds[0] !== undefined) ? schoolIds[0] : 0;

        await notificationService.sendNotification({
          userId: msgReceiverId,
          schoolId: targetSchoolId,
          title: "New Message",
          message: `${senderName}: ${normalizedContent.substring(0, 100)}${normalizedContent.length > 100 ? "..." : ""}`,
          type: NotificationType.MESSAGE,
          sendEmail: false, // Already handled above in special logic
          data: {
            conversationId: validConversationId,
            senderId,
            messageId: newMessage.id
          }
        });

      } catch (notifError) {
        logger.error(`Failed to persist chat notification for user ${msgReceiverId}:`, notifError);
      }
    }

    return response.data;
  }


  private async handleSendMessage(socket: AuthenticatedSocket, data: SendMessageData) {
    const { conversationId, content, mediaUrl, messageSubject, sender } = data;
    const senderId = socket.userId;

    try {
      const newMessage = await this.processSendMessage({
        conversationId,
        senderId,
        receiverId: sender,
        content,
        mediaUrl: mediaUrl ? Array.isArray(mediaUrl) ? mediaUrl : [mediaUrl] : undefined,
        messageSubject,
        emitToConversation: true,
      });

      // Optionally return to sender only
      socket.emit("message_sent", newMessage);

    } catch (error: any) {
      logger.error(`[ChatSocketHandler] Failed to send message:`, error);
      socket.emit("message_error", { error: error.message });
    }
  }


  /**
   * Handle new socket connection
   */
  private async handleConnection(socket: AuthenticatedSocket): Promise<void> {
    const userId = socket.userId
    if (!userId) return;

    logger.info(`User ${userId} connected via socket ${socket.id}`);

    // Track connected user
    if (!this.connectedUsers.has(userId)) {
      this.connectedUsers.set(userId, new Set());
    }
    this.connectedUsers.get(userId)?.add(socket.id);

    try {
      const response = await messagingService.getUserConversationIds(userId);

      if (response.success && Array.isArray(response.data)) {
        const conversationIds = response.data;
        conversationIds.forEach((convId: number) => {
          const roomName = `conversation:${convId}`;
          socket.join(roomName);
        });

        socket.emit("conversations_ready", {
          message: `Joined ${conversationIds.length} conversation rooms.`,
          rooms: conversationIds.map((id: number) => `conversation:${id}`)
        });
        logger.info(`User ${userId} joined ${conversationIds.length} conversation rooms.`);
      } else {
        logger.error(`[Socket] Failed to load conversations for user ${userId}: ${response.message}`);
      }

    } catch (error) {
      logger.error(`[Socket] Error joining conversation rooms for user ${userId}:`, error);
    }

    socket.on("app:chat", (data: SendMessageData) => {
      this.handleSendMessage(socket, data);
    });

    // Join role-based room
    if (socket.userRole) {
      socket.join(`role:${socket.userRole}`);
    }

    // Join school-based room for notifications (NEW: Added for school-scoped notifications)
    try {
      const user = await this.userRepo.findOne({
        where: { id: userId },
        select: { id: true, role: true },
      });

      // Join user-specific room
      socket.join(`user:${userId}`);
      logger.info(`User ${userId} joined user room: user:${userId}`);

      if (user) {
        // For staff, derive schoolId(s) from the Staff (teachers) table.
        const schoolIds = await getSchoolIdsForUser(AppDataSource.manager, userId);
        if (schoolIds.length) {
          schoolIds.forEach((sid) => socket.join(`school:${sid}`));
          logger.info(`User ${userId} joined school rooms: ${schoolIds.map((sid) => `school:${sid}`).join(", ")}`);
        }
      }
    } catch (error) {
      logger.error(`Error joining rooms for user ${userId}:`, error);
    }

    // Handle disconnection
    socket.on("disconnect", () => {
      this.handleDisconnection(socket);
    });

    // Handle custom events
    socket.on("app:mark_read", (data: any) => {
      this.handleMarkNotificationRead(socket, data);
    });

    socket.on("app:mark_all_read", () => {
      this.handleMarkAllRead(socket);
    });

    socket.on("app:mark_as_unread", (data: { conversationId: number }) => {
      this.handleMarkConversationAsUnread(socket, data);
    });

    // Alias event (backwards/forwards compatibility with clients expecting this name)
    socket.on("app:mark_unread", (data: { conversationId: number }) => {
      this.handleMarkConversationAsUnread(socket, data);
    });

    socket.on("join_room", (roomName: string) => {
      socket.join(roomName);
      socket.emit("room_joined", { room: roomName });
    });

    socket.on("leave_room", (roomName: string) => {
      socket.leave(roomName);
      socket.emit("room_left", { room: roomName });
    });

    // Send welcome message
    socket.emit("connected", {
      message: "Connected to whitePenguin chat service",
      userId,
      socketId: socket.id,
    });
  }

  /**
   * Handle socket disconnection
   */
  private handleDisconnection(socket: AuthenticatedSocket): void {
    const userId = socket.userId;
    if (!userId) return;

    logger.info(`User ${userId} disconnected from socket ${socket.id}`);

    const userSockets = this.connectedUsers.get(userId);
    if (userSockets) {
      userSockets.delete(socket.id);
      if (userSockets.size === 0) {
        this.connectedUsers.delete(userId);
      }
    }
  }

  /**
   * Handle mark notification as read event
   */
  private handleMarkNotificationRead(socket: AuthenticatedSocket, data: { notificationId: number }): void {
    logger.info(`User ${socket.userId} marked notification ${data.notificationId} as read`);
    socket.emit("notification_marked_read", { notificationId: data.notificationId });
  }

  /**
   * Handle mark all notifications as read event
   */
  private handleMarkAllRead(socket: AuthenticatedSocket): void {
    logger.info(`User ${socket.userId} marked all notifications as read`);
    socket.emit("all_notifications_marked_read", { userId: socket.userId });
  }

  /**
   * Handle mark conversation as unread event
   */
  private async handleMarkConversationAsUnread(socket: AuthenticatedSocket, data: { conversationId: number }): Promise<void> {
    if (!socket.userId) return;

    const result = await messagingService.markConversationAsUnread(data.conversationId, socket.userId);

    if (result.success) {
      logger.info(`User ${socket.userId} marked conversation ${data.conversationId} as unread`);
      socket.emit("app:conversation_unread", {
        conversationId: data.conversationId,
        success: true
      });
    } else {
      logger.error(`Failed to mark conversation ${data.conversationId} as unread: ${result.message}`);
      socket.emit("app:error", { message: result.message });
    }
  }

  /**
   * Send notification to a specific user
   */
  sendToUser(userId: number, event: string, data: any): void {
    if (!this.io) {
      logger.error("WebSocket server not initialized");
      return;
    }

    this.io.to(`user:${userId}`).emit(event, data);
    logger.info(`Sent event '${event}' to user ${userId}`);
  }

  /**
   * Send notification to all users with a specific role
   */
  sendToRole(role: string, event: string, data: any): void {
    if (!this.io) {
      logger.error("WebSocket server not initialized");
      return;
    }

    this.io.to(`role:${role}`).emit(event, data);
    logger.info(`Sent event '${event}' to role ${role}`);
  }

  /**
   * Send notification to a specific room
   */
  sendToRoom(room: string, event: string, data: any): void {
    if (!this.io) {
      logger.error("WebSocket server not initialized");
      return;
    }

    this.io.to(room).emit(event, data);
    logger.info(`Sent event '${event}' to room ${room}`);
  }

  /**
   * Broadcast notification to all connected clients
   */
  broadcast(event: string, data: any): void {
    if (!this.io) {
      logger.error("WebSocket server not initialized");
      return;
    }

    this.io.emit(event, data);
    logger.info(`Broadcast event '${event}' to all clients`);
  }

  /**
   * Check if a user is currently connected
   */
  isUserConnected(userId: number): boolean {
    return this.connectedUsers.has(userId) && (this.connectedUsers.get(userId)?.size ?? 0) > 0;
  }

  /**
   * Get the number of active connections for a user
   */
  getUserConnectionCount(userId: number): number {
    return this.connectedUsers.get(userId)?.size ?? 0;
  }

  /**
   * Get total number of connected users
   */
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  /**
   * Get all connected user IDs
   */
  getConnectedUserIds(): number[] {
    return Array.from(this.connectedUsers.keys());
  }

  /**
   * Disconnect a specific user from all their sockets
   */
  disconnectUser(userId: number): void {
    if (!this.io) return;

    const socketIds = this.connectedUsers.get(userId);
    if (socketIds) {
      socketIds.forEach((socketId) => {
        const socket = this.io?.sockets.sockets.get(socketId);
        if (socket) {
          socket.disconnect(true);
        }
      });
      this.connectedUsers.delete(userId);
      logger.info(`Disconnected all sockets for user ${userId}`);
    }
  }

  /**
   * Get the Socket.IO server instance
   */
  getIO(): SocketIOServer | null {
    return this.io;
  }

  /**
   * Send notification to a specific user via WebSocket
   * This method is used by the notification service to send real-time notifications
   */
  sendNotificationToUser(userId: number, notification: any): void {
    if (!this.io) {
      logger.error("WebSocket server not initialized");
      return;
    }

    // Send to user-specific room
    this.io.to(`user:${userId}`).emit("new_notification", {
      notification,
    });

    logger.info(`Sent notification to user ${userId}`);
  }

  /**
   * Send notification to all users in a specific school
   * Users must be in the school room: school:{schoolId}
   */
  sendNotificationToSchool(schoolId: number, notification: any): void {
    if (!this.io) {
      logger.error("WebSocket server not initialized");
      return;
    }

    // Send to school-specific room
    this.io.to(`school:${schoolId}`).emit("new_notification", {
      notification,
    });

    logger.info(`Sent notification to school ${schoolId}`);
  }

  /**
   * Send notification to users with a specific role within a school
   */
  sendNotificationToSchoolRole(schoolId: number, role: string, notification: any): void {
    if (!this.io) {
      logger.error("WebSocket server not initialized");
      return;
    }

    // Send to school and role specific room
    this.io.to(`school:${schoolId}`).to(`role:${role}`).emit("new_notification", {
      notification,
    });

    logger.info(`Sent notification to role ${role} in school ${schoolId}`);
  }
}

// Singleton instance
export const websocketService = new WebSocketService();
