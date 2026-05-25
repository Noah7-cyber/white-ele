import { Repository, EntityManager, In, Brackets } from "typeorm";
import { AppDataSource } from "../../core";
import { Conversation } from '../../shared/entities/Conversation';
import { Messaging } from '../../shared/entities/Messaging';
import { MessageStatus, MessageType, UserRole } from "../../shared/entities";
import { Parent } from "../../shared/entities/Parent";
import { getUserRoleAndSchoolIds } from "../../shared/utils/user-school";

export interface Message {
    conversationId?: number;
    sender1Id?: number;
    sender2Id?: number;
    content?: string;
    type?: MessageType;
    messageSubject?: string;
    mediaUrl?: string | string[];
    status?: MessageStatus;
}

export interface ServiceResponse {
    success: boolean;
    message?: string;
    data?: any;
}

export interface GetConversationMessagesOptions {
    limit?: number;
    offset?: number;
    markAsRead?: boolean;
}

export class MessageService {

    private get messagingRepository(): Repository<Messaging> {
        return AppDataSource.getRepository(Messaging);
    }

    private get conversationRepository(): Repository<Conversation> {
        return AppDataSource.getRepository(Conversation);
    }

    private get parentRepository(): Repository<Parent> {
        return AppDataSource.getRepository(Parent);
    }

    private get entityManager(): EntityManager {
        return AppDataSource.manager;
    }

    /**
     * Saves a new message to the database after validation.
     * Creates a conversation if conversationId is omitted and sender1Id/sender2Id are provided.
     */
    async saveMessage(data: Message): Promise<ServiceResponse> {
        try {
            return await this.entityManager.transaction(async (tx) => {
                const content = typeof data.content === "string" ? data.content.trim() : "";
                if (!content && !data.mediaUrl) {
                    return { success: false, message: "Message content or media is required." };
                }

                let conversation: Conversation | null = null;
                if (data.conversationId) {
                    conversation = await tx.findOne(Conversation, {
                        where: { id: data.conversationId },
                    });
                }

                let isNewConversation = false;

                if (!conversation) {
                    if (!data.sender1Id || !data.sender2Id) {
                        return { success: false, message: "Cannot create conversation: sender1Id and sender2Id required." };
                    }

                    const sender1 = await getUserRoleAndSchoolIds(tx, data.sender1Id);
                    const sender2 = await getUserRoleAndSchoolIds(tx, data.sender2Id);

                    if (!sender1 || !sender2) {
                        return { success: false, message: "One or both users not found." };
                    }

                    if (sender1.role === UserRole.STUDENT || sender2.role === UserRole.STUDENT) {
                        return { success: false, message: "Student cannot be a part of conversation." };
                    }

                    if (!sender1.schoolIds.length || !sender2.schoolIds.length) {
                        return { success: false, message: "One or both users do not belong to a school." };
                    }

                    const sharedSchoolIds = Array.from(new Set(sender1.schoolIds.filter((id) => sender2.schoolIds.includes(id))));
                    if (!sharedSchoolIds.length) {
                        return { success: false, message: "Users belong to different schools and cannot message each other." };
                    }

                    // Check if conversation already exists between these users
                    const existingConversation = await tx.findOne(Conversation, {
                        where: [
                            { sender1Id: data.sender1Id, sender2Id: data.sender2Id },
                            { sender1Id: data.sender2Id, sender2Id: data.sender1Id }
                        ]
                    });

                    if (existingConversation) {
                        conversation = existingConversation;
                    } else {
                        conversation = tx.create(Conversation, {
                            sender1Id: data.sender1Id,
                            sender2Id: data.sender2Id,
                        });
                        conversation = await tx.save(conversation);
                        isNewConversation = true;
                    }
                }

                if (!isNewConversation && data.sender1Id) {
                    const access = this.validateConversationAccess(data.sender1Id, conversation);
                    if (!access.success) return access;
                }

                const receiverId =
                    conversation.sender1Id === data.sender1Id
                        ? conversation.sender2Id
                        : conversation.sender1Id;

                const newMessage = this.messagingRepository.create({
                    content: content || (data.mediaUrl ? "" : ""),
                    conversationId: conversation.id,
                    sender: { id: data.sender1Id },
                    type: data.type ?? MessageType.TEXT,
                    messageSubject: data.messageSubject,
                    mediaUrl: data.mediaUrl ? Array.isArray(data.mediaUrl) ? data.mediaUrl : [data.mediaUrl] : undefined,
                    status: data.status ?? MessageStatus.SENT,
                });

                const savedMessage = await tx.save(newMessage);

                // Reset deletion flags for both participants when a new message is sent
                // This ensures the conversation reappears for users who previously deleted it
                const conversationUpdate: Partial<Conversation> = {
                    lastMessageId: savedMessage.id,
                    updatedAt: new Date(),
                    deletedBySender1: false,
                    deletedBySender2: false,
                };
                await tx.update(Conversation, { id: conversation.id }, conversationUpdate);

                return {
                    success: true,
                    message: "Message saved successfully.",
                    data: { message: savedMessage, conversation, receiverId },
                };
            });
        } catch (err: any) {
            return {
                success: false,
                message: err?.message ?? "Failed to save message.",
            };
        }
    }

    /**
     * Retrieves all conversations for a user with last message, participant info, and unread count.
     */
    async getUserConversations(userId: number) {
        const conversations = await this.conversationRepository
            .createQueryBuilder("chat")
            .leftJoin("chat.lastMessage", "lastMessage")
            .leftJoin("chat.sender1", "sender1")
            .leftJoin("chat.sender2", "sender2")
            .leftJoin("sender1.profile", "profile1")
            .leftJoin("sender2.profile", "profile2")
            .leftJoin("sender1.parent", "parent1")
            .leftJoin("sender2.parent", "parent2")
            .select([
                "chat.id",
                "chat.updatedAt",
                "chat.sender1Id",
                "chat.sender2Id",
                "lastMessage.id",
                "lastMessage.content",
                "lastMessage.mediaUrl",
                "lastMessage.createdAt",
                "lastMessage.messageSubject",
                "lastMessage.senderId",
                "sender1.id",
                "sender1.firstName",
                "sender1.lastName",
                "sender1.role",
                "profile1.photo",
                "parent1.photoUrl",
                "sender2.id",
                "sender2.firstName",
                "sender2.lastName",
                "sender2.role",
                "profile2.photo",
                "parent2.photoUrl",
            ])
            .where(new Brackets(qb => {
                qb.where("chat.sender1Id = :userId", { userId })
                    .orWhere("chat.sender2Id = :userId", { userId });
            }))
            .andWhere(
                "NOT ( (chat.sender1Id = :userId AND chat.deletedBySender1 = true) OR (chat.sender2Id = :userId AND chat.deletedBySender2 = true) )",
                { userId }
            )
            .orderBy("chat.updatedAt", "DESC")
            .getMany();

        const conversationIds = conversations.map((c) => c.id);
        const unreadCounts = conversationIds.length
            ? await this.getUnreadCountByConversation(conversationIds, userId)
            : new Map<number, number>();

        const enrichedConversations = await Promise.all(
            conversations.map(async (chat) => {
                this.fixSenderPhoto(chat.sender1 as any);
                this.fixSenderPhoto(chat.sender2 as any);

                if (chat.sender2Id === userId) {
                    const tempId = chat.sender1Id;
                    chat.sender1Id = chat.sender2Id;
                    chat.sender2Id = tempId;

                    const tempSender = chat.sender1;
                    chat.sender1 = chat.sender2;
                    chat.sender2 = tempSender;
                }

                if (chat.sender1?.role === UserRole.PARENT) {
                    const pData = await this.getParentData(chat.sender1.id);
                    if (pData) (chat.sender1 as any).parentData = pData;
                }
                if (chat.sender2?.role === UserRole.PARENT) {
                    const pData = await this.getParentData(chat.sender2.id);
                    if (pData) (chat.sender2 as any).parentData = pData;
                }

                (chat as any).unreadCount = unreadCounts.get(chat.id) ?? 0;
                return chat;
            })
        );

        const userParentData = await this.getParentData(userId);

        return {
            conversations: enrichedConversations,
            parentData: userParentData,
        };
    }



    async getUserConversationIds(userId: number) {
        if (!userId) {
            return {
                success: false,
                message: "User ID is required.",
            };
        }

        const result = await this.conversationRepository
            .createQueryBuilder("conversation")
            .select("conversation.id", "id")
            .where(new Brackets(qb => {
                qb.where("conversation.sender1Id = :userId", { userId })
                    .orWhere("conversation.sender2Id = :userId", { userId });
            }))
            .getRawMany();

        return {
            success: true,
            data: result.map(response => response.id),
        };
    }


    /**
     * Retrieves messages for a conversation with optional pagination and mark-as-read.
     */
    async getConversationMessages(
        conversationId: number,
        userId?: number,
        options: GetConversationMessagesOptions = {}
    ) {
        const { limit = 100, offset = 0, markAsRead = true } = options;

        const conversation = await this.conversationRepository
            .createQueryBuilder("conversation")
            .leftJoin("conversation.sender1", "sender1")
            .leftJoin("conversation.sender2", "sender2")
            .leftJoin("sender1.profile", "profile1")
            .leftJoin("sender2.profile", "profile2")
            .leftJoin("sender1.parent", "parent1")
            .leftJoin("sender2.parent", "parent2")
            .select([
                "conversation.id",
                "conversation.updatedAt",
                "conversation.sender1Id",
                "conversation.sender2Id",
                "conversation.deletedBySender1At",
                "conversation.deletedBySender2At",
                "sender1.id",
                "sender1.firstName",
                "sender1.lastName",
                "sender1.role",
                "sender1.schoolId",
                "profile1.photo",
                "parent1.photoUrl",
                "sender2.id",
                "sender2.firstName",
                "sender2.lastName",
                "sender2.role",
                "sender2.schoolId",
                "profile2.photo",
                "parent2.photoUrl",
            ])
            .where("conversation.id = :conversationId", { conversationId })
            .getOne();

        if (!conversation) {
            throw new Error("Conversation not found.");
        }

        let deletedAtForUser: Date | null | undefined;

        if (userId) {
            const sender1Id = conversation.sender1?.id;
            const sender2Id = conversation.sender2?.id;
            if (userId !== sender1Id && userId !== sender2Id) {
                throw new Error("You are not authorized to access this conversation.");
            }

            deletedAtForUser =
                userId === sender1Id
                    ? conversation.deletedBySender1At
                    : userId === sender2Id
                        ? conversation.deletedBySender2At
                        : undefined;

            // Normalize participants: ensure sender1 is the current user
            if (conversation.sender2?.id === userId) {
                const tempId = conversation.sender1Id;
                conversation.sender1Id = conversation.sender2Id;
                conversation.sender2Id = tempId;

                const tempSender = conversation.sender1;
                conversation.sender1 = conversation.sender2;
                conversation.sender2 = tempSender;
            }
        }

        const qb = this.messagingRepository
            .createQueryBuilder("message")
            .leftJoin("message.sender", "sender")
            .leftJoin("sender.profile", "profile")
            .leftJoin("sender.parent", "parent")
            .select([
                "message.id",
                "message.content",
                "message.mediaUrl",
                "message.messageSubject",
                "message.type",
                "message.status",
                "message.sentAt",
                "message.readAt",
                "message.isRead",
                "message.createdAt",
                "sender.id",
                "sender.role",
                "sender.firstName",
                "sender.lastName",
                "profile.photo",
                "parent.photoUrl",
            ])
            .where("message.conversationId = :conversationId", { conversationId })
            .orderBy("message.createdAt", "ASC");

        if (userId) {
            qb.andWhere(
                "NOT ( (message.senderId = :userId AND message.deletedBySender = true) OR (message.senderId != :userId AND message.deletedByReceiver = true) )",
                { userId }
            );

            // Filter out messages stamped before the user "deleted" the conversation
            if (deletedAtForUser) {
                qb.andWhere("message.createdAt > :deletedAt", { deletedAt: deletedAtForUser });
            }
        }

        const [messages, total] = await qb
            .skip(offset)
            .take(limit)
            .getManyAndCount();

        messages.forEach((msg) => this.fixSenderPhoto(msg.sender as any));

        if (userId && markAsRead) {
            await this.markConversationMessagesAsRead(conversationId, userId);
        }

        this.fixSenderPhoto(conversation.sender1 as any);
        this.fixSenderPhoto(conversation.sender2 as any);

        if (conversation.sender1?.role === UserRole.PARENT) {
            const pData = await this.getParentData(conversation.sender1.id);
            if (pData) (conversation.sender1 as any).parentData = pData;
        }
        if (conversation.sender2?.role === UserRole.PARENT) {
            const pData = await this.getParentData(conversation.sender2.id);
            if (pData) (conversation.sender2 as any).parentData = pData;
        }

        return {
            messages,
            conversation,
            pagination: { total, limit, offset },
        };
    }

    async deleteConversationsForUser(userId: number, conversationIds: number[]): Promise<ServiceResponse> {
        try {
            if (!conversationIds?.length) {
                return { success: false, message: "conversationIds array is required and must not be empty." };
            }

            await this.conversationRepository.update(
                { id: In(conversationIds), sender1Id: userId },
                { deletedBySender1: true, deletedBySender1At: new Date() }
            );

            await this.conversationRepository.update(
                { id: In(conversationIds), sender2Id: userId },
                { deletedBySender2: true, deletedBySender2At: new Date() }
            );

            return {
                success: true,
                message: `Conversations deleted for you.`,
            };
        } catch (err: any) {
            return {
                success: false,
                message: err?.message ?? "Failed to delete conversations.",
            };
        }
    }

    /**
     * Deletes multiple messages for the current user only.
     */
    async deleteMessagesForUser(userId: number, conversationId: number, messageIds: number[]): Promise<ServiceResponse> {
        try {
            if (!messageIds?.length) {
                return { success: false, message: "messageIds array is required and must not be empty." };
            }

            // Verify user is a participant of the conversation
            const conversation = await this.conversationRepository.findOne({
                where: { id: conversationId },
                select: ["id", "sender1Id", "sender2Id"],
            });
            if (!conversation || (userId !== conversation.sender1Id && userId !== conversation.sender2Id)) {
                return { success: false, message: "Conversation not found or access denied." };
            }

            // Update messages where user is sender
            await this.messagingRepository.createQueryBuilder()
                .update(Messaging)
                .set({ deletedBySender: true })
                .where("id IN (:...ids)", { ids: messageIds })
                .andWhere("conversationId = :conversationId", { conversationId })
                .andWhere("senderId = :userId", { userId })
                .execute();

            // Update messages where user is NOT sender
            await this.messagingRepository.createQueryBuilder()
                .update(Messaging)
                .set({ deletedByReceiver: true })
                .where("id IN (:...ids)", { ids: messageIds })
                .andWhere("conversationId = :conversationId", { conversationId })
                .andWhere("senderId != :userId", { userId })
                .execute();

            return {
                success: true,
                message: `Messages deleted for you.`,
            };
        } catch (err: any) {
            return {
                success: false,
                message: err?.message ?? "Failed to delete messages.",
            };
        }
    }

    /**
     * Marks all messages in a conversation as read for the given user (only messages not sent by them).
     */
    async markConversationMessagesAsRead(conversationId: number, userId: number): Promise<void> {
        await this.messagingRepository
            .createQueryBuilder()
            .update(Messaging)
            .set({ isRead: true, readAt: new Date() })
            .where("conversationId = :conversationId", { conversationId })
            .andWhere("senderId != :userId", { userId })
            .execute();
    }

    /**
     * Marks the most recent received message in a conversation as unread.
     * This makes the conversation appear as "unread" in the user's list.
     */
    async markConversationAsUnread(conversationId: number, userId: number): Promise<ServiceResponse> {
        try {
            // Find the latest message where senderId != userId
            const messageToMark = await this.messagingRepository.createQueryBuilder("message")
                .where("message.conversationId = :conversationId", { conversationId })
                .andWhere("message.senderId != :userId", { userId })
                .orderBy("message.createdAt", "DESC")
                .getOne();

            if (!messageToMark) {
                return { success: false, message: "No received messages found to mark as unread." };
            }

            // Mark as unread
            await this.messagingRepository.update(
                { id: messageToMark.id },
                { isRead: false, readAt: null as any }
            );

            return { success: true, message: "Conversation marked as unread." };
        } catch (error: any) {
            return { success: false, message: error.message || "Failed to mark conversation as unread." };
        }
    }


    /**
     * Returns a map of conversationId -> unread message count for the given user (messages not sent by them).
     */
    private async getUnreadCountByConversation(
        conversationIds: number[],
        userId: number
    ): Promise<Map<number, number>> {
        const rows = await this.messagingRepository
            .createQueryBuilder("m")
            .select("m.conversationId", "conversationId")
            .addSelect("COUNT(m.id)", "count")
            .where("m.conversationId IN (:...ids)", { ids: conversationIds })
            .andWhere("m.senderId != :userId", { userId })
            .andWhere("(m.isRead = :false OR m.isRead IS NULL)", { false: false })
            .andWhere(
                "NOT ( (m.senderId = :userId AND m.deletedBySender = true) OR (m.senderId != :userId AND m.deletedByReceiver = true) )",
                { userId }
            )
            .groupBy("m.conversationId")
            .getRawMany();

        const map = new Map<number, number>();
        for (const r of rows) map.set(Number(r.conversationId), Number(r.count));
        return map;
    }

    private validateConversationAccess(
        userId: number,
        conversation: Conversation
    ): ServiceResponse {
        const { sender1Id, sender2Id } = conversation;

        if (userId !== sender1Id && userId !== sender2Id) {
            return {
                success: false,
                message: "You are not authorized to access this conversation."
            }
        }
        return {
            success: true,
            message: "Conversation access granted."
        }
    }

    private async getParentData(userId: number) {
        const parent = await this.parentRepository.findOne({
            where: { userId },
            relations: [
                "children",
                "children.user",
                "children.currentClassroom",
                "children.currentClassroom.school"
            ]
        });

        if (!parent) return null;

        const children = (parent.children || []).map(child => {
            return {
                id: child.id,
                userId: child.userId,
                admissionNumber: child.admissionNumber,
                photoUrl: child.photoUrl,
                firstName: child.user?.firstName,
                lastName: child.user?.lastName,
                classId: child.classroomId,
                className: child.currentClassroom?.classroomName
            };
        });

        return {
            children
        };
    }
    
    /** Normalize sender profile photo (use parent.photoUrl for parents when profile.photo is missing). */
    private fixSenderPhoto(user: { profile?: { photo?: string }; role?: string; parent?: { photoUrl?: string } } | null): void {
        if (!user) return;
        user.profile = user.profile ?? {};
        const profile = user.profile;
        if (!profile.photo && user.role === UserRole.PARENT && user.parent?.photoUrl) {
            profile.photo = user.parent.photoUrl;
        }
        delete (user as any).parent;
    }
}

const messagingService = new MessageService();
export { messagingService };