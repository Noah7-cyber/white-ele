/* eslint-disable @typescript-eslint/no-explicit-any */

import { CombinedReducerType } from "@/redux/store/combine.reducers";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

function useMediaRef<T>(value: T) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}
import { useSelector } from "react-redux";
import { messageDynamicEndpoints } from "@/services/messaging.service";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { useQueryClient } from "@tanstack/react-query";
import { uploadServices } from "@/services/upload.service";
import { showToast } from "@/modules/shared/component/Toast";
import { getAccessTokenFromCookie } from "@/utils/helper";
import { socket } from "@/lib/socket";
import { usePathname } from "next/navigation";

export interface ApiMessageSender {
  id: number;
  role: string;
  firstName: string;
  lastName: string;
  profile: {
    photo?: string;
  } | null;
}

export interface ConversationParticipant {
  id: number;
  role: string;
  firstName: string;
  lastName: string;
  schoolId?: number;
  profile?: {
    photo?: string;
  } | null;
  parentData?: {
    children?: {
      id: number;
      userId: number;
      admissionNumber: string;
      photoUrl: string;
      firstName: string;
      lastName: string;
      classId: number;
      className: string;
    }[];
  };
}

export interface Conversation {
  id: number;
  sender1Id: number;
  sender2Id: number;
  updatedAt: string;
  sender1: ConversationParticipant;
  sender2: ConversationParticipant;
}

export interface Pagination {
  total: number;
  limit: number;
  offset: number;
}

interface ChatModalProps {
  selectedChat: any;
  isOpen: boolean;
  onClose: () => void;
  onConversationDeleted?: () => void;
}

export interface ApiMessage {
  id: number | string;
  mediaUrl: string | string[];
  content: string;
  messageSubject: string;
  status: string;
  type: string;
  sentAt: string;
  readAt: string | null;
  isRead: boolean;
  sender: ApiMessageSender;
  isDeleted?: boolean;
}

const MAX_MEDIA_ATTACHMENTS = 2;

export interface ConversationResponse {
  success: boolean;
  data: {
    messages: ApiMessage[];
    conversation: Conversation;
    pagination: Pagination;
  };
}

export function useChatModal({
  selectedChat,
  isOpen,
  onClose,
  onConversationDeleted,
}: ChatModalProps) {
  const pathname = usePathname();
  const conversationId = selectedChat?.id ?? selectedChat?.conversationId;
  const activeRole = useMemo(() => {
    if (pathname?.startsWith("/admin")) return "admin";
    if (pathname?.startsWith("/staff")) return "staff";
    if (pathname?.startsWith("/parent")) return "parent";
    return "unknown";
  }, [pathname]);

  const user = useSelector((state: CombinedReducerType) => state.auth.user);
  const messageListQueryKey = useMemo(
    () => ["messages", activeRole, Number(user?.id ?? 0)],
    [activeRole, user?.id],
  );
  const conversationQueryKey = useMemo(
    () => ["conversation", activeRole, Number(user?.id ?? 0), conversationId],
    [activeRole, conversationId, user?.id],
  );

  const { data, isLoading } = useQueryService<any, ConversationResponse>({
    service: conversationId ? messageDynamicEndpoints.getConversation(conversationId) : ({} as any),
    options: { keys: conversationQueryKey, enabled: !!conversationId },
  });

  const apiMessages = useMemo<ApiMessage[]>(
    () => data?.data?.messages ?? [],
    [data?.data?.messages],
  );
  const conversationFromApi = data?.data?.conversation;
  // token is already managed by AuthProvider for the shared socket connection,
  // but keep this here since other logic depends on cookie presence.
  getAccessTokenFromCookie();

  // ─── Conversation participants ─────────────────────────────────────────────
  // Use conversationFromApi first; fall back to selectedChat from the list.
  const effectiveConversation = conversationFromApi ?? selectedChat;

  // sender1Id from the conversation — the "initiator" (admin in this system).
  // Messages from sender1 go RIGHT; messages from sender2 go LEFT.
  const conversationSender1Id: number | null = useMemo(() => {
    if (!effectiveConversation) return null;
    return effectiveConversation.sender1?.id ?? effectiveConversation.sender1Id ?? null;
  }, [effectiveConversation]);

  // "myId" — the participant ID of the currently logged-in user within this
  // conversation. Derived by comparing user.id to the known participant IDs.
  const myId: number | null = useMemo(() => {
    if (!user) return null;
    const conv = effectiveConversation;
    if (!conv) return (user.id as number) ?? null;
    const s1Id: number | undefined = conv.sender1?.id ?? conv.sender1Id;
    const s2Id: number | undefined = conv.sender2?.id ?? conv.sender2Id;
    if (Number(user.id) === Number(s1Id)) return Number(s1Id);
    if (Number(user.id) === Number(s2Id)) return Number(s2Id);
    return (user.id as number) ?? null;
  }, [effectiveConversation, user]);

  // Third party = the other participant (not me).
  const thirdPartyDetails: ConversationParticipant | null = useMemo(() => {
    if (!effectiveConversation || !user) return null;
    const s1Id = effectiveConversation.sender1?.id ?? effectiveConversation.sender1Id;
    return Number(user.id) === Number(s1Id)
      ? effectiveConversation.sender2
      : effectiveConversation.sender1;
  }, [effectiveConversation, user]);

  // ─── Local state ───────────────────────────────────────────────────────────
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const queryClient = useQueryClient();
  const refreshDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const REFRESH_DEBOUNCE_MS = 1500;
  const [messageInput, setMessageInput] = useState("");
  const [socketMessages, setSocketMessages] = useState<ApiMessage[]>([]);
  const [attachedMedia, setAttachedMedia] = useState<{ url: string; name: string }[]>([]);
  const attachedMediaRef = useMediaRef(attachedMedia);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  // Ref so socket event handlers always see the latest isSendingMessage value
  const isSendingRef = useRef(false);
  useEffect(() => {
    isSendingRef.current = isSendingMessage;
  }, [isSendingMessage]);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { mutateAsync: uploadDocumentsAsync } = useMutationService({
    service: uploadServices.uploadDocuments,
    options: { isFormData: true, disableToast: true },
  });
  const { mutateAsync: uploadImageAsync } = useMutationService({
    service: uploadServices.uploadImage,
    options: { isFormData: true, disableToast: true },
  });

  // Reset textarea + attachments whenever the active conversation changes
  useEffect(() => {
    setMessageInput("");
    setAttachedMedia([]);
    setSocketMessages([]);
  }, [conversationId]);

  // ─── Optimistic message dedup ──────────────────────────────────────────────
  // After every API refetch, drop any optimistic messages that now have a
  // matching confirmed entry in apiMessages. Match by sender + content + time.
  // Uses a ref for myId so the closure always has the latest value.
  const myIdRef = useRef<number | null>(null);
  useEffect(() => {
    myIdRef.current = myId;
  }, [myId]);

  useEffect(() => {
    if (!socketMessages.length) return;
    const currentMyId = myIdRef.current;
    setSocketMessages((prev) =>
      prev.filter((opt) => {
        const optSender = Number(opt.sender?.id);
        // Only process messages from the current user
        if (currentMyId != null && optSender !== currentMyId) return true;
        // Drop if the API has a matching confirmed message from the same sender
        const confirmed = apiMessages.some(
          (m) =>
            Number(m.sender?.id) === optSender &&
            m.content === opt.content &&
            Math.abs(new Date(opt.sentAt).getTime() - new Date(m.sentAt).getTime()) < 60000,
        );
        return !confirmed;
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiMessages]);

  // All messages = confirmed API messages + pending optimistic ones
  const displayMessages = useMemo(() => {
    const merged = [...(apiMessages ?? []), ...socketMessages];
    return merged
      .slice()
      .sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
  }, [apiMessages, socketMessages]);

  // ─── Scroll ────────────────────────────────────────────────────────────────
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const el = messagesContainerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const id = setTimeout(() => scrollToBottom("smooth"), 120);
    return () => clearTimeout(id);
  }, [isOpen, displayMessages.length, scrollToBottom]);

  // ─── Query helpers ─────────────────────────────────────────────────────────
  const invalidateMessagesAndConversation = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: messageListQueryKey });
    queryClient.invalidateQueries({ queryKey: ["conversation", activeRole, Number(user?.id ?? 0)] });
  }, [activeRole, messageListQueryKey, queryClient, user?.id]);

  const scheduleRefresh = useCallback(() => {
    if (refreshDebounceRef.current) clearTimeout(refreshDebounceRef.current);
    refreshDebounceRef.current = setTimeout(() => {
      refreshDebounceRef.current = null;
      invalidateMessagesAndConversation();
    }, REFRESH_DEBOUNCE_MS);
  }, [invalidateMessagesAndConversation]);

  const refetchConversation = useCallback(() => {
    invalidateMessagesAndConversation();
  }, [invalidateMessagesAndConversation]);

  const markConversationReadOptimistically = useCallback(() => {
    if (!conversationId) return;
    queryClient.setQueryData(conversationQueryKey, (prev: any) => {
      const messages = prev?.data?.messages;
      if (!Array.isArray(messages)) return prev;
      return {
        ...prev,
        data: {
          ...prev.data,
          messages: messages.map((m: ApiMessage) => ({ ...m, isRead: true, readAt: m.readAt ?? new Date().toISOString() })),
        },
      };
    });
    queryClient.setQueryData(messageListQueryKey, (prev: any) => {
      const conversations = prev?.data?.conversations ?? prev?.conversations;
      if (!Array.isArray(conversations)) return prev;
      const updated = conversations.map((c: any) => {
        const cid = c?.id ?? c?.conversationId;
        if (Number(cid) !== Number(conversationId)) return c;
        return {
          ...c,
          unreadCount: 0,
          lastMessage: c?.lastMessage ? { ...c.lastMessage, isRead: true } : c?.lastMessage,
        };
      });
      if (prev?.data?.conversations) return { ...prev, data: { ...prev.data, conversations: updated } };
      return { ...prev, conversations: updated };
    });
  }, [conversationId, conversationQueryKey, messageListQueryKey, queryClient]);

  // When chat opens: refresh list, mark as read, trigger app events
  useEffect(() => {
    if (!conversationId || !isOpen) return;
    // Immediately refetch locally so unread clears without waiting
    invalidateMessagesAndConversation();

    // Inform backend in real-time so sender sees read receipts update immediately.
    // Keep a fallback alias in case the server expects the app:* prefix.
    socket.emit("markRead", { conversationId });
    socket.emit("app:mark_read", { conversationId });
    markConversationReadOptimistically();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("app:chat_opened", { detail: { conversationId } }));
      window.dispatchEvent(
        new CustomEvent("app:conversation_viewed", { detail: { conversationId } }),
      );
    }
  }, [conversationId, isOpen, invalidateMessagesAndConversation, markConversationReadOptimistically]);

  // ─── Mutations ─────────────────────────────────────────────────────────────
  const { mutateAsync: deleteConversation, isPending: isDeleting } = useMutationService({
    service: conversationId
      ? messageDynamicEndpoints.deleteConversation(conversationId)
      : ({} as any),
    options: {
      successTitle: "Conversation deleted",
      successMessage: "The conversation has been deleted.",
      errorTitle: "Failed to delete conversation",
      onSuccess: () => {
        setDeleteConfirmOpen(false);
        onClose();
        onConversationDeleted?.();
        queryClient.invalidateQueries({ queryKey: ["messages"] });
      },
    },
  });

  const handleMarkAsUnread = () => {
    const id = conversationId;
    onClose();
    if (id == null) return;
    setTimeout(() => {
      // Mark-unread is a socket listener in this backend (not an HTTP endpoint).
      socket.emit("app:mark_unread", { conversationId: id });
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("app:mark_unread", { detail: { conversationId: id } }),
        );
      }
    }, 0);
  };

  const menuActions = [
    { label: "Mark as unread", onClick: handleMarkAsUnread },
    { label: "Delete conversation", onClick: () => setDeleteConfirmOpen(true) },
  ];

  const { mutateAsync: deleteMessageAsync } = useMutationService({
    service: ({ messageId }: { messageId: string | number }) =>
      messageDynamicEndpoints.deleteMessage(messageId),
    options: { disableToast: true },
  });
  const { mutateAsync: editMessageAsync } = useMutationService({
    service: ({ messageId }: { messageId: string | number; content: string }) =>
      messageDynamicEndpoints.updateMessage(messageId),
    options: { disableToast: true },
  });

  // isCurrentUser: message sender ID matches myId (the logged-in participant)
  const isCurrentUser = (msg: ApiMessage) => {
    if (myId != null) return Number(msg.sender?.id) === myId;
    return Number(msg.sender?.id) === Number(user?.id);
  };

  // ─── Socket ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedChat) return;

    const onConnect = () => socket.emit("joinRoom", {});
    const onLoadMessages = () => scheduleRefresh();
    const onNewMessage = () => {
      // Server confirmed a new message — immediately:
      // 1. Clear the sending indicator (if we were waiting for our own message confirmation)
      // 2. Cancel the fallback timer since we don't need it
      // 3. Refetch so the real message replaces the optimistic one + lists update
      // 4. Dispatch window event so messaging list also refreshes
      if (isSendingRef.current) {
        setIsSendingMessage(false);
        isSendingRef.current = false;
      }
      if (sendFallbackTimerRef.current) {
        clearTimeout(sendFallbackTimerRef.current);
        sendFallbackTimerRef.current = null;
      }
      invalidateMessagesAndConversation();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("app:message_sent", { detail: { conversationId } }));
      }
      setTimeout(() => scrollToBottom("smooth"), 200);
    };
    const onMessageStatusUpdated = () => refetchConversation();
    const onLoadMoreMessages = () => scheduleRefresh();

    // Backend events observed in production
    const onAppChat = (payload: any) => {
      // payload looks like: { id, conversationId, senderId, content, sentAt, ... }
      const incomingConvId = payload?.conversationId;
      if (incomingConvId != null && conversationId != null && Number(incomingConvId) !== Number(conversationId)) {
        return;
      }
      invalidateMessagesAndConversation();
      setTimeout(() => scrollToBottom("smooth"), 200);
    };

    const onAppNewConversation = (payload: any) => {
      const incomingConvId = payload?.conversationId ?? payload?.conversation?.id;
      if (incomingConvId != null && conversationId != null && Number(incomingConvId) !== Number(conversationId)) {
        return;
      }
      invalidateMessagesAndConversation();
      setTimeout(() => scrollToBottom("smooth"), 200);
    };

    const onAppNewNotification = () => {
      // Notification can indicate new messages/unread updates.
      invalidateMessagesAndConversation();
    };
    const onAppMarkUnread = () => {
      invalidateMessagesAndConversation();
    };

    socket.on("connect", onConnect);
    socket.on("loadMessages", onLoadMessages);
    socket.on("newMessage", onNewMessage);
    socket.on("messageStatusUpdated", onMessageStatusUpdated);
    socket.on("loadMoreMessages", onLoadMoreMessages);
    socket.on("app:chat", onAppChat);
    socket.on("app:new_conversation", onAppNewConversation);
    socket.on("app:new_notification", onAppNewNotification);
    socket.on("app:mark_unread", onAppMarkUnread);

    // If already connected, ensure we joined the room now
    if (socket.connected) {
      onConnect();
    }

    return () => {
      if (refreshDebounceRef.current) clearTimeout(refreshDebounceRef.current);
      socket.off("connect", onConnect);
      socket.off("loadMessages", onLoadMessages);
      socket.off("newMessage", onNewMessage);
      socket.off("messageStatusUpdated", onMessageStatusUpdated);
      socket.off("loadMoreMessages", onLoadMoreMessages);
      socket.off("app:chat", onAppChat);
      socket.off("app:new_conversation", onAppNewConversation);
      socket.off("app:new_notification", onAppNewNotification);
      socket.off("app:mark_unread", onAppMarkUnread);
    };
  }, [
    selectedChat,
    scheduleRefresh,
    invalidateMessagesAndConversation,
    refetchConversation,
    scrollToBottom,
    conversationId,
  ]);

  // ─── Send message ──────────────────────────────────────────────────────────
  const sendFallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sendMessage = () => {
    const content = messageInput.trim();
    const mediaUrls = attachedMedia.map((m) => m.url);
    const hasAttachment = mediaUrls.length > 0;
    if (!content && !hasAttachment) return;
    if (!socket.connected) {
      showToast({ message: "Connection not ready. Please try again.", severity: "warning" });
      return;
    }

    const displayContent = content || (hasAttachment ? "Attachment" : "");
    // Use the confirmed participant ID so the optimistic message aligns correctly
    const senderId = myId ?? (user?.id as number) ?? 0;

    const optimisticMessage: ApiMessage = {
      id: `temp-${Date.now()}-${Math.random().toString(36).slice(2)}` as any,
      mediaUrl: mediaUrls,
      content: displayContent,
      messageSubject: "",
      status: "sending",
      type: hasAttachment ? "file" : "text",
      sentAt: new Date().toISOString(),
      readAt: null,
      isRead: false,
      sender: {
        id: senderId,
        role: user?.role ?? "",
        firstName: user?.name?.split(" ")[0] || "",
        lastName: user?.name?.split(" ")[1] || "",
        profile: user?.profile?.photo ? { photo: user.profile.photo } : null,
      },
    };

    setSocketMessages((prev) => [...prev, optimisticMessage]);
    setIsSendingMessage(true);

    socket.emit("app:chat", {
      conversationId,
      content: displayContent,
      mediaUrl: mediaUrls,
    });

    setMessageInput("");
    setAttachedMedia([]);

    setTimeout(() => scrollToBottom("smooth"), 50);

    // Fallback: if the socket newMessage event hasn't fired in 5s, force-clear.
    // In practice the socket fires in < 1s so this is just a safety net.
    sendFallbackTimerRef.current = setTimeout(() => {
      if (isSendingRef.current) {
        invalidateMessagesAndConversation();
        setIsSendingMessage(false);
      }
      sendFallbackTimerRef.current = null;
    }, 5000);
  };

  const removeAttachment = (index: number) => {
    setAttachedMedia((prev) => prev.filter((_, i) => i !== index));
  };

  const deleteMessage = async (messageId: string | number) => {
    const previous = queryClient.getQueryData(conversationQueryKey);
    queryClient.setQueryData(conversationQueryKey, (prev: any) => {
      const messages = prev?.data?.messages;
      if (!Array.isArray(messages)) return prev;
      return {
        ...prev,
        data: {
          ...prev.data,
          messages: messages.filter((msg: ApiMessage) => String(msg.id) !== String(messageId)),
        },
      };
    });
    try {
      await deleteMessageAsync({ messageId });
      invalidateMessagesAndConversation();
    } catch {
      queryClient.setQueryData(conversationQueryKey, previous);
      showToast({ message: "Could not delete message", severity: "error" });
    }
  };

  const editMessage = async (messageId: string | number, content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;
    const previous = queryClient.getQueryData(conversationQueryKey);
    queryClient.setQueryData(conversationQueryKey, (prev: any) => {
      const messages = prev?.data?.messages;
      if (!Array.isArray(messages)) return prev;
      return {
        ...prev,
        data: {
          ...prev.data,
          messages: messages.map((msg: ApiMessage) =>
            String(msg.id) === String(messageId) ? { ...msg, content: trimmed } : msg,
          ),
        },
      };
    });
    try {
      await editMessageAsync({ messageId, content: trimmed });
      invalidateMessagesAndConversation();
    } catch {
      queryClient.setQueryData(conversationQueryKey, previous);
      showToast({
        message: "Edit not available",
        description: "Message editing is not supported for this account yet.",
        severity: "warning",
      });
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (!files.length) return;
    const valid = files.filter((f) => f.type.startsWith("image/") || f.type.startsWith("video/"));
    const invalidCount = files.length - valid.length;
    if (invalidCount > 0) {
      showToast({ message: "Only images and videos are allowed", severity: "warning" });
    }
    if (!valid.length) {
      e.target.value = "";
      return;
    }
    const currentCount = attachedMediaRef.current.length;
    const remaining = Math.max(0, MAX_MEDIA_ATTACHMENTS - currentCount);
    const toAdd = valid.slice(0, remaining);
    if (toAdd.length < valid.length) {
      showToast({
        message: `Maximum ${MAX_MEDIA_ATTACHMENTS} attachments allowed`,
        severity: "warning",
      });
    }
    if (!toAdd.length) {
      e.target.value = "";
      return;
    }
    setIsUploadingFile(true);
    try {
      const newEntries: { url: string; name: string }[] = [];
      for (const file of toAdd) {
        const isImage = file.type.startsWith("image/");
        let url = "";
        if (isImage) {
          const formData = new FormData();
          formData.append("image", file);
          formData.append("folder", "properties");
          const response: any = await uploadImageAsync(formData);
          url = response?.url ?? response?.data?.url ?? "";
        } else {
          const formData = new FormData();
          formData.append("documents", file);
          formData.append("folder", "properties");
          const response: any = await uploadDocumentsAsync(formData);
          url =
            response?.url ??
            response?.data?.url ??
            response?.files?.[0]?.url ??
            response?.data?.[0]?.url ??
            "";
        }
        if (url) newEntries.push({ url, name: file.name });
      }
      if (newEntries.length) {
        setAttachedMedia((prev) => [...prev, ...newEntries].slice(0, MAX_MEDIA_ATTACHMENTS));
        showToast({ message: "File(s) uploaded successfully", severity: "success" });
      }
    } catch {
      showToast({ message: "File upload failed", severity: "error" });
    } finally {
      setIsUploadingFile(false);
      e.target.value = "";
    }
  };

  return {
    messages: displayMessages,
    apiMessages,
    user,
    myId,
    conversationSender1Id,
    isLoading,
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    deleteConversation,
    isDeleting,
    thirdPartyDetails,
    effectiveConversation,
    menuActions,
    isCurrentUser,
    sendMessage,
    messageInput,
    setMessageInput,
    messagesEndRef,
    messagesContainerRef,
    attachedMedia,
    removeAttachment,
    isUploadingFile,
    isSendingMessage,
    handleFileSelect,
    deleteMessage,
    editMessage,
    activeRole,
  };
}
