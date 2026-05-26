/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useRef, useState } from "react";
import CircularProgress from "@mui/material/CircularProgress";
import { Box, IconButton, Typography, Popover } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import AddIcon from "@mui/icons-material/Add";
import DoneIcon from "@mui/icons-material/Done";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import ScheduleIcon from "@mui/icons-material/Schedule";
import MailOutlineIcon from "@/modules/shared/assets/svgs/unreadMail.svg";
import DeleteOutlineIcon from "@/modules/shared/assets/svgs/deleteIcon.svg";
import { Modal } from "../modal";
import { useChatModal } from "./hooks/useChatModal";
import { capitalizeFirstLetter } from "@/utils/helpers";
import { ApiMessage } from "./hooks/useChatModal";
import ConfirmModal from "@/components/ConfirmModal/confirmModal";
import { DataRenderer } from "@/modules/shared/component/DataRenderer";
import { Button } from "../Button";
import InitialsAvatar from "../InitialsAvatar/InitialsAvatar";
import dayjs from "dayjs";
import Drawer from "@mui/material/Drawer";
import { useMediaQuery } from "@/utils/hooks/useMediaQuery";

interface ChatModalProps {
  selectedChat: any;
  isOpen: boolean;
  onClose: () => void;
  onConversationDeleted?: () => void;
}

/** Normalize mediaUrl from API: can be string (single URL), array, or JSON string of array/object-like list */
function normalizeMediaUrls(mediaUrl: string | string[] | null | undefined): string[] {
  if (mediaUrl == null || mediaUrl === "") return [];
  if (Array.isArray(mediaUrl)) return mediaUrl.filter((u) => typeof u === "string" && u);
  const str = String(mediaUrl).trim();
  if (!str) return [];
  if (str.startsWith("[")) {
    try {
      const parsed = JSON.parse(str);
      return Array.isArray(parsed) ? parsed.filter((u: unknown) => typeof u === "string") : [str];
    } catch {
      return [str];
    }
  }
  if (str.startsWith("{")) {
    try {
      const asArray = str.replace(/^\s*\{/, "[").replace(/\}\s*$/, "]");
      const parsed = JSON.parse(asArray);
      return Array.isArray(parsed) ? parsed.filter((u: unknown) => typeof u === "string") : [str];
    } catch {
      const urls = str
        .replace(/^\{|^\s*"|"\s*\}$/g, "")
        .split(/"\s*,\s*"/)
        .map((s) => s.replace(/^"|"$/g, "").trim())
        .filter(Boolean);
      return urls.length ? urls : [str];
    }
  }
  return [str];
}

function MessageStatusIcon({ status, isRead }: { status: string; isRead: boolean }) {
  if (status === "sending") return <ScheduleIcon sx={{ fontSize: 14, color: "text.secondary" }} />;
  if (isRead) return <DoneAllIcon sx={{ fontSize: 14, color: "primary.main" }} />;
  if (status === "delivered") return <DoneAllIcon sx={{ fontSize: 14, color: "text.secondary" }} />;
  return <DoneIcon sx={{ fontSize: 14, color: "text.secondary" }} />;
}

export function LazyChatImage({
  src,
  alt,
  className,
  wrapperClassName,
  placeholderMinHeight,
}: {
  src: string;
  alt: string;
  className?: string;
  wrapperClassName?: string;
  placeholderMinHeight?: number;
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (error) {
    return (
      <span
        className={`inline-flex items-center justify-center bg-gray-200 text-gray-500 text-xs rounded-lg ${wrapperClassName ?? ""}`}
        style={{ minWidth: placeholderMinHeight ?? 120, minHeight: placeholderMinHeight ?? 120 }}
      >
        Failed to load
      </span>
    );
  }

  return (
    <span className={`block relative ${wrapperClassName ?? ""}`}>
      {!loaded && (
        <span
          className="absolute inset-0 rounded-lg bg-gray-200 animate-pulse"
          style={placeholderMinHeight != null ? {} : { minHeight: 120 }}
          aria-hidden
        />
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={className}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        style={{ opacity: loaded ? 1 : 0, transition: "opacity 0.2s ease-in" }}
      />
    </span>
  );
}

function LazyChatVideo({ src }: { src: string }) {
  const [ready, setReady] = useState(false);

  return (
    <span className="block relative max-w-[min(320px,85vw)] max-h-[240px] rounded-lg overflow-hidden bg-black shadow-md border border-gray-200/80">
      {!ready && (
        <span
          className="absolute inset-0 flex items-center justify-center bg-gray-800 animate-pulse rounded-lg"
          style={{ minHeight: 180 }}
          aria-hidden
        />
      )}
      <video
        src={src}
        controls
        playsInline
        preload="metadata"
        className="max-w-[min(320px,85vw)] max-h-[240px] w-full h-auto rounded-lg object-contain bg-black"
        style={{ opacity: ready ? 1 : 0, transition: "opacity 0.2s ease-in" }}
        onLoadedData={() => setReady(true)}
      >
        Your browser does not support the video tag.
      </video>
    </span>
  );
}

export function ChatModal({
  selectedChat,
  isOpen,
  onClose,
  onConversationDeleted,
}: ChatModalProps) {
  const isMobile = useMediaQuery("(max-width:768px)");
  const {
    messages,
    isLoading,
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    deleteConversation,
    isDeleting,
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
  } = useChatModal({ selectedChat, isOpen, onClose, onConversationDeleted });
  const mobileInputRef = useRef<HTMLTextAreaElement | null>(null);
  const desktopInputRef = useRef<HTMLTextAreaElement | null>(null);

  // isCurrentUser is provided by useChatModal (uses myId with Number() coercion)

  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
  const menuOpen = Boolean(menuAnchorEl);

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setMenuAnchorEl(e.currentTarget);
  };

  const handleMenuClose = () => setMenuAnchorEl(null);

  const handleMenuAction = (onClick: () => void) => {
    handleMenuClose();
    (onClick as () => void)();
  };

  const menuItemsWithIcons = [
    {
      label: "Mark as unread",
      icon: <MailOutlineIcon className="w-6 h-6" />,
    },
    {
      label: "Delete conversation",
      icon: <DeleteOutlineIcon className="w-6 h-6" />,
    },
  ];

  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageViewerUrls, setImageViewerUrls] = useState<string[]>([]);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);

  const openImageViewer = (urls: string[], idx: number) => {
    setImageViewerUrls(urls);
    setImageViewerIndex(idx);
    setImageViewerOpen(true);
  };

  const closeImageViewer = () => {
    setImageViewerOpen(false);
    setImageViewerUrls([]);
    setImageViewerIndex(0);
  };

  const currentViewerUrl = imageViewerUrls[imageViewerIndex] ?? "";

  const autoResize = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  const handleComposerKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  useEffect(() => {
    autoResize(mobileInputRef.current);
    autoResize(desktopInputRef.current);
  }, [messageInput]);

  return isMobile ? (
    <Drawer
      anchor="right"
      open={isOpen}
      onClose={onClose}
      PaperProps={{
        className: "w-full !max-w-[100vw] flex flex-col !h-[100dvh] !max-h-[100dvh]",
        style: { backgroundColor: "#fff" },
      }}
    >
      <Box className="bg-white w-full flex flex-col h-full min-h-0 overflow-hidden">
        {/* Mobile header with back arrow */}
        <Box className="px-4 py-3 flex items-center gap-3 border-b border-gray-100 shrink-0 bg-white">
          <IconButton
            onClick={onClose}
            size="small"
            className="!p-1.5 !rounded-full !bg-[#E8F6F4] !border !border-brandColor-active/20"
          >
            <ArrowBackIcon fontSize="small" className="!text-brandColor-active" />
          </IconButton>
          <InitialsAvatar
            src={effectiveConversation?.sender2?.profile?.photo || ""}
            name={`${effectiveConversation?.sender2?.firstName ?? ""} ${effectiveConversation?.sender2?.lastName ?? ""}`.trim()}
            className="w-9 h-9"
            initialsClassName="text-sm font-medium text-white"
          />
          <Box className="flex flex-col ml-1 min-w-0 flex-1">
            <Box className="flex items-center gap-1.5 min-w-0">
              <Typography className="!text-sm !font-bold !text-[#022F2F] leading-tight truncate">
                {[
                  effectiveConversation?.sender2?.firstName,
                  effectiveConversation?.sender2?.lastName,
                ]
                  .filter(Boolean)
                  .join(" ") || "—"}
              </Typography>
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Online" />
            </Box>
            {effectiveConversation?.sender2?.role?.toLowerCase() === "parent" &&
              (effectiveConversation?.sender2?.parentData?.children?.length ?? 0) > 0 && (
                <Typography className="!text-[11px] !text-gray-500 truncate">
                  {(() => {
                    const children = effectiveConversation?.sender2?.parentData?.children;
                    const first = children[0];
                    const name = `${first?.firstName ?? ""} ${first?.lastName ?? ""}`.trim();
                    return first?.className
                      ? `Parent of ${name} (${first.className})`
                      : `Parent of ${name}`;
                  })()}
                </Typography>
              )}
          </Box>
          <Box className="flex-1" />
          <Box className="relative" onClick={(e) => e.stopPropagation()}>
            <IconButton size="small" onClick={handleMenuOpen} className="!p-0">
              <MoreVertIcon fontSize="small" />
            </IconButton>
            <>
              {menuOpen && (
                <div
                  style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(0,0,0,0.2)",
                    zIndex: 1300,
                  }}
                  onClick={handleMenuClose}
                />
              )}
              <Popover
                open={menuOpen}
                anchorEl={menuAnchorEl}
                onClose={handleMenuClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                slotProps={{
                  paper: {
                    className:
                      "!rounded-lg !shadow-[0_8px_24px_rgba(0,0,0,0.12)] !mt-2 !min-w-[180px]",
                  },
                }}
                disableRestoreFocus
              >
                <Box className="flex flex-col gap-0 py-1">
                  {menuActions.map((action, idx) => (
                    <button
                      key={action.label}
                      type="button"
                      className="flex items-center gap-2 w-full text-left px-4 py-2.5 !text-sm hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleMenuAction(action.onClick)}
                    >
                      {menuItemsWithIcons[idx]?.icon ?? null}
                      <span>{action.label}</span>
                    </button>
                  ))}
                </Box>
              </Popover>
            </>
          </Box>
        </Box>

        {/* Messages */}
        <DataRenderer isLoading={isLoading} isEmpty={!messages?.length}>
          {() => (
            <Box
              ref={messagesContainerRef}
              className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3 bg-[#F5F7F9]"
              onLoadCapture={() => {
                const container = messagesContainerRef.current;
                if (!container) return;
                container.scrollTo({ top: container.scrollHeight, behavior: "auto" });
              }}
            >
              {messages?.map((msg: ApiMessage, idx: number) => {
                const fromMe = isCurrentUser(msg);
                const currentDay = msg?.sentAt ? dayjs(msg.sentAt).format("YYYY-MM-DD") : "";
                const prevDay =
                  idx > 0 && messages[idx - 1]?.sentAt
                    ? dayjs(messages[idx - 1].sentAt).format("YYYY-MM-DD")
                    : "";
                const showDaySeparator = idx === 0 ? true : currentDay !== prevDay;
                const dayLabel = (() => {
                  if (!msg?.sentAt) return "";
                  const d = dayjs(msg.sentAt);
                  if (d.isSame(dayjs(), "day")) return "Today";
                  if (d.isSame(dayjs().subtract(1, "day"), "day")) return "Yesterday";
                  return d.format("D MMM, YYYY");
                })();
                const mediaUrls = normalizeMediaUrls(msg.mediaUrl);
                const imageUrls = mediaUrls.filter((url) => /\.(jpe?g|png|gif|webp)$/i.test(url));
                const nonImageUrls = mediaUrls.filter(
                  (url) => !/\.(jpe?g|png|gif|webp)$/i.test(url),
                );
                const sentLabel = msg?.sentAt ? dayjs(msg.sentAt).format("h:mm a") : "";
                return (
                  <React.Fragment key={msg.id}>
                    {showDaySeparator && (
                      <Box className="flex justify-center py-2">
                        <span className="text-[11px] text-gray-500 bg-gray-200/60 px-3 py-1 rounded-full">
                          {dayLabel}
                        </span>
                      </Box>
                    )}
                    <Box
                      className={`flex flex-col sm:max-w-[80vw] ${fromMe ? "self-end items-end" : "self-start items-start"}`}
                    >
                      <Box className="p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-line bg-white text-gray-800 shadow-sm border border-gray-100/80">
                        {imageUrls.length > 0 && (
                          <Box
                            className={`grid gap-1.5 mb-1 ${imageUrls.length === 1 ? "grid-cols-1" : imageUrls.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}
                          >
                            {imageUrls.map((url, i) => (
                              <button
                                key={url}
                                type="button"
                                onClick={() => openImageViewer(imageUrls, i)}
                                className="block rounded-lg overflow-hidden"
                              >
                                <LazyChatImage
                                  src={url}
                                  alt={`Attachment ${i + 1}`}
                                  className="w-full h-auto max-h-[200px] object-cover"
                                />
                              </button>
                            ))}
                          </Box>
                        )}
                        {nonImageUrls.map((url, i) =>
                          /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url) ? (
                            <LazyChatVideo key={url} src={url} />
                          ) : (
                            <a
                              key={url}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="!text-[#008080] underline"
                            >
                              View attachment {i + 1}
                            </a>
                          ),
                        )}
                        <Box className="flex items-end gap-1">
                          <span className="flex-1">{msg.content}</span>
                          {fromMe && (
                            <span className="flex items-center">
                              <MessageStatusIcon status={msg.status} isRead={msg.isRead} />
                            </span>
                          )}
                        </Box>
                        {/* {fromMe && (
                          <Box className="mt-1 flex items-center gap-2 justify-end">
                            <button
                              type="button"
                              className="text-[10px] text-[#008080]"
                              onClick={async () => {
                                const next = window.prompt("Edit message", msg.content ?? "");
                                if (next == null) return;
                                await editMessage(msg.id, next);
                              }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="text-[10px] text-red-600"
                              onClick={() => deleteMessage(msg.id)}
                            >
                              Delete
                            </button>
                          </Box>
                        )} */}
                      </Box>
                      {sentLabel ? (
                        <span
                          className={`text-[10px] text-gray-400 mt-1 px-0.5 ${fromMe ? "text-right" : "text-left"}`}
                        >
                          {sentLabel}
                        </span>
                      ) : null}
                    </Box>
                  </React.Fragment>
                );
              })}
              <div ref={messagesEndRef} />
            </Box>
          )}
        </DataRenderer>

        {/* Input area — + outside, pill field, send inside (mobile reference) */}
        <Box className="px-3 py-3 pb-[max(12px,env(safe-area-inset-bottom))] bg-white border-t border-gray-100 flex items-end gap-2 shrink-0">
          <label
            htmlFor="chat-mobile-file-upload"
            className={`flex items-center justify-center w-10 h-10 shrink-0 ${isUploadingFile || attachedMedia.length >= 3 ? "cursor-not-allowed opacity-50" : "cursor-pointer text-gray-400"}`}
          >
            <input
              id="chat-mobile-file-upload"
              type="file"
              className="hidden"
              accept="image/*,video/*"
              multiple
              onChange={handleFileSelect}
              disabled={isUploadingFile || attachedMedia.length >= 3}
            />
            <AddIcon sx={{ fontSize: 26, fontWeight: 200 }} />
          </label>
          <Box className="flex-1 flex items-end gap-1 rounded-full border border-gray-200 bg-white pl-3 pr-1 py-1 min-h-[44px]">
            <textarea
              ref={mobileInputRef}
              className="flex-1 bg-transparent text-sm outline-none resize-none min-h-[36px] max-h-[120px] py-2 text-gray-800 placeholder:text-gray-400 leading-snug"
              placeholder="Write a message..."
              rows={1}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onInput={(e) => autoResize(e.currentTarget)}
              onKeyDown={handleComposerKeyDown}
              disabled={isUploadingFile}
            />
            <Button
              className="!bg-[#008080] !text-white !p-2 !rounded-full !min-w-0 !mb-0.5 disabled:opacity-70"
              onClick={sendMessage}
              disabled={
                isUploadingFile ||
                isSendingMessage ||
                (!messageInput.trim() && attachedMedia.length === 0)
              }
            >
              {isSendingMessage ? (
                <CircularProgress size={16} sx={{ color: "white" }} />
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              )}
            </Button>
          </Box>
        </Box>

        <ConfirmModal
          open={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
          onConfirm={() => deleteConversation({})}
          title="Delete conversation?"
          description="This conversation will be permanently deleted. This action cannot be undone."
          confirmLabel="Delete"
          confirmLabelClassName="!bg-[#CF000B] !text-white hover:!bg-[#CF000B]/80"
          loading={isDeleting}
        />
      </Box>
    </Drawer>
  ) : (
    <Modal isOpen={isOpen} onClose={onClose} className="!p-0 rounded-2xl">
      <Box className="bg-white w-full min-w-2xl rounded-2xl shadow-xl flex flex-col h-[90vh] overflow-hidden">
        <Box className="p-6">
          <Box className="flex items-start gap-4 border-b border-border-light pb-4">
            <InitialsAvatar
              src={effectiveConversation?.sender2?.profile?.photo || ""}
              name={`${effectiveConversation?.sender2?.firstName ?? ""} ${
                effectiveConversation?.sender2?.lastName ?? ""
              }`.trim()}
              className="w-[54px] h-[54px]"
              initialsClassName="text-xl font-semibold text-white"
            />
            <Box className="flex flex-col gap-0.5">
              <Box className="flex gap-1 items-center flex-wrap">
                <Typography className="!text-lg !font-bold !text-black">
                  {[
                    effectiveConversation?.sender2?.firstName,
                    effectiveConversation?.sender2?.lastName,
                  ]
                    .filter(Boolean)
                    .join(" ") || "—"}
                </Typography>
                {effectiveConversation?.sender2?.role && (
                  <span className="px-3 py-[2px] bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    {capitalizeFirstLetter(effectiveConversation?.sender2.role)}
                  </span>
                )}
              </Box>
              {effectiveConversation?.sender2?.role?.toLowerCase() === "parent" &&
                (effectiveConversation?.sender2?.parentData?.children?.length ?? 0) > 0 && (
                  <Typography className="!text-xs !text-gray-500">
                    {(() => {
                      const children = effectiveConversation?.sender2?.parentData?.children;
                      const first = children[0];
                      const name = `${first?.firstName ?? ""} ${first?.lastName ?? ""}`.trim();
                      if (children.length === 1) {
                        return first?.className ? `${name} • ${first.className}` : name || "—";
                      }
                      return `${name} +${children.length - 1}`;
                    })()}
                  </Typography>
                )}
            </Box>
            <Box className="flex-1" />
            <Box className="relative" onClick={(e) => e.stopPropagation()}>
              <IconButton
                size="small"
                aria-label="Conversation options"
                aria-haspopup="true"
                aria-expanded={menuOpen}
                className="!p-0"
                onClick={handleMenuOpen}
              >
                <MoreVertIcon />
              </IconButton>
              <>
                {menuOpen && (
                  <div
                    style={{
                      position: "fixed",
                      inset: 0,
                      background: "rgba(0,0,0,0.2)",
                      zIndex: 1300, // should be below Popover (MUI default: 1300, Popover: 1500)
                    }}
                    onClick={handleMenuClose}
                  />
                )}
                <Popover
                  open={menuOpen}
                  anchorEl={menuAnchorEl}
                  onClose={handleMenuClose}
                  anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                  transformOrigin={{ vertical: "top", horizontal: "right" }}
                  slotProps={{
                    paper: {
                      className:
                        "!rounded-lg !shadow-[0_8px_24px_rgba(0,0,0,0.12)] !mt-2 !min-w-[180px]",
                    },
                  }}
                  disableRestoreFocus
                >
                  <Box className="flex flex-col gap-0 py-1">
                    {menuActions.map((action, idx) => (
                      <button
                        key={action.label}
                        type="button"
                        className="flex items-center gap-2 w-full text-left px-4 py-2.5 !text-sm !text-textColor hover:bg-gray-100 rounded-none cursor-pointer"
                        onClick={() => handleMenuAction(action.onClick)}
                      >
                        {menuItemsWithIcons[idx]?.icon ?? null}
                        <span>{action.label}</span>
                      </button>
                    ))}
                  </Box>
                </Popover>
              </>
            </Box>
            <IconButton onClick={onClose} size="small" className="!p-0">
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        <DataRenderer isLoading={isLoading} isEmpty={!messages?.length}>
          {() => (
            <Box
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto px-4 space-y-2"
              onLoadCapture={() => {
                const container = messagesContainerRef.current;
                if (!container) return;
                container.scrollTo({ top: container.scrollHeight, behavior: "auto" });
              }}
            >
              {messages?.map((msg: ApiMessage, idx: number) => {
                const fromMe = isCurrentUser(msg);
                const currentDay = msg?.sentAt ? dayjs(msg.sentAt).format("YYYY-MM-DD") : "";
                const prevDay =
                  idx > 0 && messages[idx - 1]?.sentAt
                    ? dayjs(messages[idx - 1].sentAt).format("YYYY-MM-DD")
                    : "";
                const showDaySeparator = idx === 0 ? true : currentDay !== prevDay;
                const dayLabel = (() => {
                  if (!msg?.sentAt) return "";
                  const d = dayjs(msg.sentAt);
                  if (d.isSame(dayjs(), "day")) return "Today";
                  if (d.isSame(dayjs().subtract(1, "day"), "day")) return "Yesterday";
                  return d.format("D MMM, YYYY");
                })();

                const mediaUrls = normalizeMediaUrls(msg.mediaUrl);
                const imageUrls = mediaUrls.filter((url) => /\.(jpe?g|png|gif|webp)$/i.test(url));
                const nonImageUrls = mediaUrls.filter(
                  (url) => !/\.(jpe?g|png|gif|webp)$/i.test(url),
                );
                return (
                  <React.Fragment key={msg.id}>
                    {showDaySeparator && (
                      <Box className="flex justify-center py-3">
                        <span className="text-[11px] text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                          {dayLabel}
                        </span>
                      </Box>
                    )}
                    <Box className={`flex items-start gap-3 ${fromMe ? "flex-row-reverse" : ""}`}>
                      <InitialsAvatar
                        src={msg.sender?.profile?.photo || ""}
                        name={`${msg.sender?.firstName ?? ""} ${msg.sender?.lastName ?? ""}`.trim()}
                        className="w-10 h-10"
                        initialsClassName="text-xs"
                      />

                      <Box
                        className={`p-4 py-2 !bg-[#F1F1F1] rounded-lg max-w-[min(520px,65%)] !text-text-tertiary/70 leading-relaxed !text-xs whitespace-pre-line`}
                      >
                        {imageUrls.length > 0 && (
                          <Box
                            className={`grid gap-2 mb-2 ${
                              imageUrls.length === 1
                                ? "grid-cols-1"
                                : imageUrls.length === 2
                                  ? "grid-cols-2"
                                  : "grid-cols-3"
                            }`}
                          >
                            {imageUrls.map((url: string, i: number) => (
                              <button
                                key={url}
                                type="button"
                                onClick={() => openImageViewer(imageUrls, i)}
                                className="block rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow border border-gray-200/80 bg-white"
                              >
                                <LazyChatImage
                                  src={url}
                                  alt={`Attachment ${i + 1}`}
                                  className="w-full h-auto max-h-[260px] object-cover"
                                  wrapperClassName="block"
                                  placeholderMinHeight={120}
                                />
                              </button>
                            ))}
                          </Box>
                        )}

                        {nonImageUrls.length > 0 && (
                          <Box className="flex flex-col gap-2 mb-2">
                            {nonImageUrls.map((url: string, i: number) =>
                              /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url) ? (
                                <LazyChatVideo key={url} src={url} />
                              ) : (
                                <a
                                  key={url}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="!text-[#008080] underline"
                                >
                                  View attachment {i + 1}
                                </a>
                              ),
                            )}
                          </Box>
                        )}

                        <Box className="flex items-end gap-2">
                          <span className="flex-1">{msg.content}</span>
                          {fromMe && (
                            <span className="flex items-center">
                              <MessageStatusIcon status={msg.status} isRead={msg.isRead} />
                            </span>
                          )}
                        </Box>
                        {/* {fromMe && (
                          <Box className="mt-1 flex items-center gap-2 justify-end">
                            <button
                              type="button"
                              className="text-[10px] text-[#008080]"
                              onClick={async () => {
                                const next = window.prompt("Edit message", msg.content ?? "");
                                if (next == null) return;
                                await editMessage(msg.id, next);
                              }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="text-[10px] text-red-600"
                              onClick={() => deleteMessage(msg.id)}
                            >
                              Delete
                            </button>
                          </Box>
                        )} */}
                      </Box>
                    </Box>
                  </React.Fragment>
                );
              })}
              <div ref={messagesEndRef} />
            </Box>
          )}
        </DataRenderer>

        <Box className="p-4 bg-dashboard-bg flex items-center gap-3">
          <Box className="relative flex-1 rounded-lg">
            <textarea
              ref={desktopInputRef}
              className="w-full bg-white rounded-xl p-4 pr-24 resize-none outline-none border border-border-input mt-1 !text-xs !px-3.5 !pt-3 !pb-4 !text-input-gray disabled:opacity-70 disabled:cursor-not-allowed"
              placeholder={isUploadingFile ? "Uploading attachment..." : "Type a message..."}
              rows={1}
              style={{ minHeight: "48px" }}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onInput={(e) => autoResize(e.currentTarget)}
              onKeyDown={handleComposerKeyDown}
              disabled={isUploadingFile}
              readOnly={isUploadingFile}
            />
            {isUploadingFile && (
              <Box
                className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/80 pointer-events-none"
                sx={{ zIndex: 1 }}
              >
                <span className="text-xs text-gray-600">Uploading...</span>
              </Box>
            )}
            {attachedMedia.length > 0 && !isUploadingFile && (
              <Box className="absolute bottom-1.5 left-3 flex flex-wrap items-center gap-1.5 max-w-[calc(100%-120px)] z-[2]">
                {attachedMedia.map((item, index) => (
                  <span
                    key={item.url}
                    className="flex items-center gap-0.5 text-[10px] text-[#008080] truncate max-w-[140px] bg-white/90 px-1.5 py-0.5 rounded"
                    title={item.name}
                  >
                    <span className="truncate">{item.name}</span>
                    <IconButton
                      size="small"
                      onClick={() => removeAttachment(index)}
                      className="!p-0.5 !min-w-0 !min-h-0"
                      aria-label="Remove attachment"
                    >
                      <CloseIcon sx={{ fontSize: 12 }} />
                    </IconButton>
                  </span>
                ))}
              </Box>
            )}
            <Box className="absolute bottom-3 right-3 flex gap-2 z-[2]">
              <label
                htmlFor="chat-modal-file-upload"
                className={
                  isUploadingFile || attachedMedia.length >= 3
                    ? "cursor-not-allowed opacity-60"
                    : "cursor-pointer"
                }
              >
                <input
                  id="chat-modal-file-upload"
                  type="file"
                  className="hidden"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleFileSelect}
                  disabled={isUploadingFile || attachedMedia.length >= 3}
                />
                <IconButton
                  size="small"
                  component="span"
                  disabled={isUploadingFile || attachedMedia.length >= 3}
                >
                  <AttachFileIcon />
                </IconButton>
              </label>
              <Button
                className="!bg-[#008080] !text-white !px-4 !py-1.5 !rounded-lg flex items-center gap-2 hover:opacity-90 transition-all min-h-0 min-w-0 disabled:opacity-70"
                onClick={sendMessage}
                disabled={
                  isUploadingFile ||
                  isSendingMessage ||
                  (!messageInput.trim() && attachedMedia.length === 0)
                }
              >
                {isSendingMessage ? (
                  <>
                    <CircularProgress size={12} sx={{ color: "white" }} />
                    {/* <span>Sending...</span> */}
                  </>
                ) : (
                  "Send"
                )}
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>

      <ConfirmModal
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={() => deleteConversation({})}
        title="Delete conversation?"
        description="This conversation will be permanently deleted. This action cannot be undone."
        confirmLabel="Delete"
        confirmLabelClassName="!bg-[#CF000B] !text-white hover:!bg-[#CF000B]/80"
        loading={isDeleting}
      />

      {imageViewerOpen && (
        <div
          className="fixed inset-0 z-[2000] bg-black/70 flex items-center justify-center p-4"
          onClick={closeImageViewer}
          role="presentation"
        >
          <div
            className="relative max-w-[min(1000px,75vw)] max-h-[70vh] w-full"
            onClick={(e) => e.stopPropagation()}
            role="presentation"
          >
            <button
              type="button"
              onClick={closeImageViewer}
              className="absolute -top-10 right-0 text-white text-sm"
            >
              Close
            </button>
            {currentViewerUrl ? (
              <img
                src={currentViewerUrl}
                alt="Attachment preview"
                className="w-full h-auto max-h-[90vh] object-contain rounded-lg bg-black"
              />
            ) : null}

            {imageViewerUrls.length > 1 && (
              <div className="flex items-center justify-between mt-3">
                <button
                  type="button"
                  className="text-white text-sm px-3 py-1 rounded bg-white/10 hover:bg-white/20"
                  onClick={() =>
                    setImageViewerIndex(
                      (p) => (p - 1 + imageViewerUrls.length) % imageViewerUrls.length,
                    )
                  }
                >
                  Prev
                </button>
                <span className="text-white/80 text-xs">
                  {imageViewerIndex + 1} / {imageViewerUrls.length}
                </span>
                <button
                  type="button"
                  className="text-white text-sm px-3 py-1 rounded bg-white/10 hover:bg-white/20"
                  onClick={() => setImageViewerIndex((p) => (p + 1) % imageViewerUrls.length)}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
