import { Response } from 'express';
import { messagingService } from '../services/message.service';
import { AuthenticatedRequest } from '../../auth';
import { logger } from '../../shared';
import { websocketService } from '../../notification';

class MessageController {


    async getUserConversations(req: AuthenticatedRequest, res: Response): Promise<void> {
        const userId = req.user.id;

        try {
            const { conversations, parentData } = await messagingService.getUserConversations(userId);

            res.status(200).json({
                success: true,
                data: { conversations, parentData }
            });

        } catch (error) {
            logger.error("Failed to get conversations", error);
            res.status(500).json({
                success: false,
                message: "Failed to get conversations"
            })
        }
    };

    async getConversationMessages(req: AuthenticatedRequest, res: Response): Promise<void> {
        const conversationId = parseInt(req.params["conversationId"] as string);
        const userId = req.user.id;
        const limit = req.query["limit"] != null ? Math.min(parseInt(String(req.query["limit"]), 10) || 100, 200) : undefined;
        const offset = req.query["offset"] != null ? parseInt(String(req.query["offset"]), 10) || 0 : undefined;
        const markAsRead = req.query["markAsRead"] !== "false";

        try {
            const result = await messagingService.getConversationMessages(conversationId, userId, {
                limit,
                offset,
                markAsRead,
            });

            res.status(200).json({
                success: true,
                data: {
                    messages: result.messages,
                    conversation: result.conversation,
                    pagination: result.pagination,
                },
            });
        } catch (error: any) {
            logger.error("Failed to get messages", error);
            const status = error?.message?.includes("not authorized") ? 403 : error?.message?.includes("not found") ? 404 : 500;
            res.status(status).json({
                success: false,
                message: error?.message ?? "Failed to get messages",
            });
        }
    }

    async deleteMessages(req: AuthenticatedRequest, res: Response): Promise<void> {
        const conversationId = parseInt(req.params["conversationId"] as string, 10);
        const userId = req.user.id;
        const messageId = req.params["messageId"] ? parseInt(req.params["messageId"] as string, 10) : null;
        const messageIds = req.body.messageIds as number[];

        const idsToDelete = messageIds || (messageId ? [messageId] : []);

        if (idsToDelete.length === 0) {
            res.status(400).json({ success: false, message: "No message IDs provided." });
            return;
        }

        try {
            const result = await messagingService.deleteMessagesForUser(userId, conversationId, idsToDelete);
            if (!result.success) {
                res.status(400).json({ success: false, message: result.message });
                return;
            }
            res.status(200).json({
                success: true,
                message: result.message,
                data: result.data,
            });
        } catch (error: any) {
            logger.error("Failed to delete messages", error);
            res.status(500).json({ success: false, message: error?.message ?? "Failed to delete messages." });
        }
    }

    async deleteConversations(req: AuthenticatedRequest, res: Response): Promise<void> {
        const userId = req.user.id;
        const conversationId = req.params["conversationId"] ? parseInt(req.params["conversationId"] as string, 10) : null;
        const conversationIds = req.body.conversationIds as number[];

        const idsToDelete = conversationIds || (conversationId ? [conversationId] : []);

        if (idsToDelete.length === 0) {
            res.status(400).json({ success: false, message: "No conversation IDs provided." });
            return;
        }

        try {
            const result = await messagingService.deleteConversationsForUser(userId, idsToDelete);
            if (!result.success) {
                res.status(400).json({ success: false, message: result.message });
                return;
            }
            res.status(200).json({
                success: true,
                message: result.message,
                data: result.data,
            });
        } catch (error: any) {
            logger.error("Failed to delete conversations", error);
            res.status(500).json({ success: false, message: error?.message ?? "Failed to delete conversations." });
        }
    }

    async sendMessageHttp(req: AuthenticatedRequest, res: Response) {
        const { conversationId, content, mediaUrl, messageSubject, receiverId } = req.body;
        const senderId = req.user.id;

        try {
            const newMessage = await websocketService.processSendMessage({
                conversationId,
                senderId,
                receiverId,
                content,
                mediaUrl,
                messageSubject,
                emitToConversation: true,
            });

            // Return full data including conversation details for frontend to add to list
            res.status(200).json({
                success: true,
                data: {
                    message: newMessage, // The message object
                    conversation: newMessage.conversation, // The full conversation object if available
                    receiverId: newMessage.receiverId
                }
            });

        } catch (error: any) {
            console.log(error)
            logger.error("Failed to send message", error);
            res.status(400).json
                ({
                    success: false,
                    error: error.message
                });
        }
    }
}


export const messagingController = new MessageController();
