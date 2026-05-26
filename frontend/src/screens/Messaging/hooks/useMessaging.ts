/* eslint-disable @typescript-eslint/no-explicit-any */

import { useQueryService } from "@/utils/hooks/useQueryService";
import { unwrapQueryDataBody } from "@/utils/unwrapQueryResponse";
import { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import isToday from "dayjs/plugin/isToday";
import isYesterday from "dayjs/plugin/isYesterday";
import { messageServices } from "@/services/messaging.service";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { CombinedReducerType } from "@/redux/store/combine.reducers";
import { socket } from "@/lib/socket";
import { usePathname } from "next/navigation";

const checkOptions = [
  { value: "All", label: "All", color: "!text-[#02273A]", onclick: () => {} },
  { value: "Read", label: "Read", color: "!text-[#02273A]", onclick: () => {} },
  { value: "Unread", label: "Unread", color: "!text-[#02273A]", onclick: () => {} },
];
const filterOptions = [
  { value: "All", label: "All", color: "!text-[#02273A]", onclick: () => {} },
  { value: "Parents", label: "Parents", color: "!text-[#02273A]", onclick: () => {} },
  { value: "Staff", label: "Staff", color: "!text-[#02273A]", onclick: () => {} },
];

export function useMessaging() {
  const pathname = usePathname();
  const activeRole = useMemo(() => {
    if (pathname?.startsWith("/admin")) return "admin";
    if (pathname?.startsWith("/staff")) return "staff";
    if (pathname?.startsWith("/parent")) return "parent";
    return "unknown";
  }, [pathname]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [readFilter, setReadFilter] = useState<"All" | "Read" | "Unread">("All");
  const [recipientFilter, setRecipientFilter] = useState<"All" | "Staff" | "Parents">("All");
  const [clearAllModalOpen, setClearAllModalOpen] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState("");
  const [markedUnreadIds, setMarkedUnreadIds] = useState<Set<number>>(new Set());

  const queryClient = useQueryClient();
  const { user } = useSelector(({ auth }: CombinedReducerType) => auth);
  const currentUserId = user?.id;
  const messageQueryKey = useMemo(
    () => ["messages", activeRole, Number(currentUserId ?? 0)],
    [activeRole, currentUserId],
  );

  useEffect(() => {
    const handler = (e: Event) => {
      const { conversationId } = (e as CustomEvent<{ conversationId: number }>).detail ?? {};
      if (conversationId != null) {
        setMarkedUnreadIds((prev) => new Set(prev).add(conversationId));
      }
    };
    window.addEventListener("app:mark_unread", handler);
    return () => window.removeEventListener("app:mark_unread", handler);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const { conversation } =
        (e as CustomEvent<{ conversation: any }>).detail ?? ({} as { conversation?: any });
      if (conversation) {
        setSelectedChat(conversation);
      }
    };
    window.addEventListener("app:open_conversation", handler);
    return () => window.removeEventListener("app:open_conversation", handler);
  }, []);

  // When a chat is opened (e.g. from ChatModal or elsewhere), refetch messages list so it stays in sync
  useEffect(() => {
    const handler = () => {
      queryClient.invalidateQueries({ queryKey: messageQueryKey });
    };
    window.addEventListener("app:chat_opened", handler);
    return () => window.removeEventListener("app:chat_opened", handler);
  }, [messageQueryKey, queryClient]);

  // Keep the list in sync even when the modal is closed.
  // Socket is connected globally via AuthProvider; here we only subscribe.
  useEffect(() => {
    const refetchMessagingState = () => {
      queryClient.invalidateQueries({ queryKey: messageQueryKey });
      // Refetch any open conversation queries so ChatModal stays in sync too
      queryClient.invalidateQueries({ queryKey: ["conversation", activeRole, Number(currentUserId ?? 0)] });
    };

    const onAppChat = (_payload: any) => {
      refetchMessagingState();
    };
    const onNewConversation = (_payload: any) => {
      refetchMessagingState();
    };
    const onNewNotification = (_payload: any) => {
      // Notifications can affect unread badges/counts on the messaging list.
      refetchMessagingState();
    };
    const onMarkUnread = (_payload: any) => {
      refetchMessagingState();
    };
    const onMessageStatusUpdated = (_payload: any) => {
      // Sender side read receipts / status updates
      refetchMessagingState();
    };

    // Legacy/backcompat events
    const onNewMessage = () => refetchMessagingState();
    const onLoadMessages = () => refetchMessagingState();

    socket.on("app:chat", onAppChat);
    socket.on("app:new_conversation", onNewConversation);
    socket.on("app:new_notification", onNewNotification);
    socket.on("app:mark_unread", onMarkUnread);
    socket.on("messageStatusUpdated", onMessageStatusUpdated);
    socket.on("newMessage", onNewMessage);
    socket.on("loadMessages", onLoadMessages);
    return () => {
      socket.off("app:chat", onAppChat);
      socket.off("app:new_conversation", onNewConversation);
      socket.off("app:new_notification", onNewNotification);
      socket.off("app:mark_unread", onMarkUnread);
      socket.off("messageStatusUpdated", onMessageStatusUpdated);
      socket.off("newMessage", onNewMessage);
      socket.off("loadMessages", onLoadMessages);
    };
  }, [activeRole, currentUserId, messageQueryKey, queryClient]);

  useEffect(() => {
    const handler = () => {
      queryClient.invalidateQueries({ queryKey: messageQueryKey });
    };
    window.addEventListener("app:message_sent", handler);
    return () => window.removeEventListener("app:message_sent", handler);
  }, [messageQueryKey, queryClient]);

  const isMarkedUnread = useCallback(
    (conversationId: number | undefined) =>
      conversationId != null && markedUnreadIds.has(conversationId),
    [markedUnreadIds],
  );

  const clearMarkedUnread = useCallback((conversationId: number | undefined) => {
    if (conversationId == null) return;
    setMarkedUnreadIds((prev) => {
      const next = new Set(prev);
      next.delete(conversationId);
      return next;
    });
  }, []);

  dayjs.extend(isToday);
  dayjs.extend(isYesterday);

  function formatMessageTime(date: string | undefined): string {
    if (!date) return "";
    const d = dayjs(date);
    if (d.isToday()) return d.format("h:mm A");
    if (d.isYesterday()) return "Yesterday";
    if (d.isAfter(dayjs().subtract(7, "day"))) return d.format("dddd");
    return d.format("D MMM, YYYY");
  }
  const { mutateAsync: deleteBulkConversations, isPending: isDeletingBulk } = useMutationService({
    service: messageServices.deleteBulkConversations,
    options: {
      successTitle: "Conversations deleted",
      successMessage: "Selected conversations have been deleted.",
      errorTitle: "Failed to delete conversations",
      onSuccess: () => {
        setClearAllModalOpen(false);
        setSelectedIds(new Set());
        queryClient.invalidateQueries({ queryKey: messageQueryKey });
      },
    },
  });

  const messagesQuery = useQueryService({
    service: messageServices.getMessages,
    options: {
      keys: messageQueryKey as string[],
    },
  });
  const { isLoading } = messagesQuery;
  const messageData = unwrapQueryDataBody<Record<string, unknown>>(messagesQuery.data);

  const conversations = useMemo(() => {
    const list = messageData?.conversations ?? [];
    const seen = new Set<string>();
    return (list as any[]).filter((item) => {
      const conversationId = item?.id ?? item?.conversationId;
      const sender1 = item?.sender1?.id ?? item?.sender1Id ?? 0;
      const sender2 = item?.sender2?.id ?? item?.sender2Id ?? 0;
      const key =
        conversationId != null
          ? `id:${conversationId}`
          : `pair:${Math.min(Number(sender1), Number(sender2))}-${Math.max(Number(sender1), Number(sender2))}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [messageData?.conversations]);

  const messages = useMemo(() => conversations || [], [conversations]);

  const resolveOtherParticipant = useCallback(
    (conversation: any) => {
      if (!conversation) return null;

      const { sender1, sender2 } = conversation || {};

      // If we don't know the current user, prefer sender2 (existing behaviour), then sender1
      if (!currentUserId) {
        return sender2 || sender1 || null;
      }

      // When the current user matches one side, return the other side
      if (sender1?.id === currentUserId) return sender2 || sender1 || null;
      if (sender2?.id === currentUserId) return sender1 || sender2 || null;

      // Fallback: preserve previous behaviour
      return sender2 || sender1 || null;
    },
    [currentUserId],
  );
  const filteredMessages = useMemo(() => {
    let list = messages || [];

    if (recipientFilter !== "All") {
      list = list.filter((msg: any) => {
        const other = resolveOtherParticipant(msg);
        const role = (other?.role || "").toLowerCase();

        if (recipientFilter === "Parents") return role === "parent";
        if (recipientFilter === "Staff")
          return ["teacher", "admin", "staff"].some((r) => role.includes(r));

        return true;
      });
    }
    if (readFilter === "Read")
      list = list.filter(
        (msg: any) =>
          msg?.lastMessage?.isRead === true && !markedUnreadIds.has(msg?.id ?? msg?.conversationId),
      );
    else if (readFilter === "Unread")
      list = list.filter(
        (msg: any) =>
          msg?.lastMessage?.isRead === false || markedUnreadIds.has(msg?.id ?? msg?.conversationId),
      );
    return list;
  }, [messages, readFilter, recipientFilter, resolveOtherParticipant, markedUnreadIds]);

  const displayConversations = useMemo(() => {
    if (!chatSearchQuery.trim()) return filteredMessages;
    const q = chatSearchQuery.trim().toLowerCase();
    return filteredMessages.filter((conv: any) => {
      const other = resolveOtherParticipant(conv);
      const name = `${other?.firstName ?? ""} ${other?.lastName ?? ""}`.trim().toLowerCase();
      return name.includes(q);
    });
  }, [filteredMessages, chatSearchQuery, resolveOtherParticipant]);

  const conversationIds = useMemo(
    () => displayConversations.map((m: any) => m?.id ?? m?.conversationId).filter(Boolean),
    [displayConversations],
  );
  const isAllSelected = conversationIds.length > 0 && selectedIds.size === conversationIds.length;
  const isIndeterminate = selectedIds.size > 0 && selectedIds.size < conversationIds.length;

  const toggleSelectAll = useCallback(() => {
    if (isAllSelected || isIndeterminate) setSelectedIds(new Set());
    else setSelectedIds(new Set(conversationIds));
  }, [isAllSelected, isIndeterminate, conversationIds]);

  const toggleSelectOne = useCallback((id: string | number, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const readFilterActions = useMemo(
    () =>
      checkOptions.map((opt) => ({
        label: opt.label,
        onClick: () => setReadFilter(opt.value as "All" | "Read" | "Unread"),
        color: "!text-[#02273A]" as string,
      })),
    [],
  );

  const recipientFilterActions = useMemo(
    () =>
      filterOptions.map((opt) => ({
        label: opt.label,
        onClick: () => setRecipientFilter(opt.value as "All" | "Staff" | "Parents"),
        color: "!text-[#02273A]" as string,
      })),
    [],
  );

  const deleteSelectedConversations = useCallback(async () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;

    await deleteBulkConversations({ conversationIds: ids });
  }, [deleteBulkConversations, selectedIds]);

  return {
    resolveOtherParticipant,
    conversations,
    isLoading,
    messages,
    deleteSelectedConversations,
    isDeletingBulk,
    selectedChat,
    setSelectedChat,
    selectedIds,
    setSelectedIds,
    readFilter,
    setReadFilter,
    recipientFilter,
    setRecipientFilter,
    clearAllModalOpen,
    setClearAllModalOpen,
    toggleSelectAll,
    toggleSelectOne,
    readFilterActions,
    recipientFilterActions,
    conversationIds,
    isAllSelected,
    isIndeterminate,
    formatMessageTime,
    filteredMessages,
    displayConversations,
    chatSearchQuery,
    setChatSearchQuery,
    isMarkedUnread,
    clearMarkedUnread,
    messageQueryKey,
  };
}
