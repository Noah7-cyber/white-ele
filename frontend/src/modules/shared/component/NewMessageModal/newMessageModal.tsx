/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { FC, useState, useEffect, useRef, useMemo } from "react";
import { IconButton, Box, Typography, CircularProgress } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import { Modal } from "../modal";
import { Button } from "../Button";
import { TextField } from "../TextField";
import { Dropdown } from "../Dropdown";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { messageServices } from "@/services/messaging.service";
import { useFormValidator } from "@/utils/hooks/useFormValidator";
import { Controller } from "react-hook-form";
import * as Yup from "yup";
import { teacherServices } from "@/services/teacher.service";
import { useQueryClient } from "@tanstack/react-query";
import { parentServices } from "@/services/parent.service";
import { uploadServices } from "@/services/upload.service";
import { showToast } from "../Toast";
import { useInfiniteQueryService } from "@/utils/hooks/useInfiniteQueryService";
import { useMediaQuery } from "@/utils/hooks/useMediaQuery";
import { MobileFormDrawer } from "../MobileFormDrawer/MobileFormDrawer";
import { usePathname } from "next/navigation";

export const validationSchema = Yup.object().shape({
  sendTo: Yup.string().required("Send is required"),
  message: Yup.string().required("Message is required"),
  recipient: Yup.object().nullable().required("Recipient is required"),
});

const MAX_MEDIA_ATTACHMENTS = 3;

interface NewMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewMessageModal: FC<NewMessageModalProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const activeRole = useMemo(() => {
    if (pathname?.startsWith("/admin")) return "admin";
    if (pathname?.startsWith("/staff")) return "staff";
    if (pathname?.startsWith("/parent")) return "parent";
    return "unknown";
  }, [pathname]);
  const isParentContext = activeRole === "parent";
  const [uploadedMedia, setUploadedMedia] = useState<{ url: string; name: string }[]>([]);
  const uploadedMediaRef = useRef(uploadedMedia);
  uploadedMediaRef.current = uploadedMedia;
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const isMobile = useMediaQuery("(max-width:768px)");

  const { mutateAsync: uploadDocumentsAsync } = useMutationService({
    service: uploadServices.uploadDocuments,
    options: { isFormData: true, disableToast: true },
  });
  const { mutateAsync: uploadImageAsync } = useMutationService({
    service: uploadServices.uploadImage,
    options: { isFormData: true, disableToast: true },
  });

  useEffect(() => {
    if (!isOpen) {
      setUploadedMedia([]);
    }
  }, [isOpen]);

  const removeAttachment = (index: number) => {
    setUploadedMedia((prev) => prev.filter((_, i) => i !== index));
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
    const currentCount = uploadedMediaRef.current.length;
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
    setIsUploading(true);
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
        setUploadedMedia((prev) => [...prev, ...newEntries].slice(0, MAX_MEDIA_ATTACHMENTS));
        showToast({ message: "File(s) uploaded successfully", severity: "success" });
      }
    } catch {
      showToast({ message: "File upload failed", severity: "error" });
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const formInstance = useFormValidator({
    validationSchema,
    defaultValues: {
      sendTo: "",
      recipient: null,
      subject: "",
      message: "",
      file: null,
    },
  });

  const { watch, reset, control, handleSubmit } = formInstance;
  const sendTo = watch("sendTo");

  const { mutateAsync, isPending } = useMutationService({
    service: messageServices.sendMessage,
    options: {
      successTitle: "Message successful!",
      successMessage: "Message sent successfully.",
      errorTitle: "Message sending failed",
      isFormData: false,
      onSuccess: () => {
        onClose?.();
        reset();
        queryClient.invalidateQueries({ queryKey: ["messages", activeRole] });
      },
    },
  });

  const findExistingConversationWithUser = (otherUserId: number | string | undefined) => {
    if (otherUserId == null) return null;
    const cachedEntries = queryClient.getQueriesData({ queryKey: ["messages", activeRole] });
    const cached: any = cachedEntries?.[0]?.[1];
    const conversations = cached?.data?.conversations ?? cached?.conversations ?? [];
    const otherId = Number(otherUserId);
    const match = conversations.find((c: any) => {
      const s1 = c?.sender1?.id ?? c?.sender1Id;
      const s2 = c?.sender2?.id ?? c?.sender2Id;
      return Number(s1) === otherId || Number(s2) === otherId;
    });
    return match ?? null;
  };

  async function onSendMessage(values: any) {
    try {
      const isTeacherRecipient = values?.sendTo === "TEACHER";
      const receiverId = isTeacherRecipient
        ? (values?.recipient?.user?.id ?? values?.recipient?.id)
        : values?.recipient?.user?.id;

      const existing = findExistingConversationWithUser(receiverId);
      if (existing) {
        showToast({
          message: "You already have a conversation with this user. Opening it instead.",
          severity: "info",
        });
        onClose?.();
        reset();
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("app:open_conversation", { detail: { conversation: existing } }),
          );
        }
        return;
      }

      await mutateAsync({
        receiverId,
        messageSubject: values?.subject,
        content: values?.message,
        mediaUrl: uploadedMedia.map((m) => m.url),
      });
    } catch {
      // Handle or log error if needed
    }
  }

  const sendOptions = isParentContext
    ? [{ name: "Staff", value: "TEACHER" }]
    : [
        { name: "Parent", value: "PARENT" },
        { name: "Teacher", value: "TEACHER" },
      ];

  const {
    data: teachersData,
    isLoading: isLoadingTeachers,
    hasNextPage: hasNextTeachers,
    fetchNextPage: fetchNextTeachersPage,
    isFetchingNextPage: isFetchingNextTeachers,
  } = useInfiniteQueryService<any, any>({
    service: {
      ...teacherServices.getAllTeachers,
      data: { delta: 50, status: "active", sortBy: "firstName", sortOrder: "ASC" },
    },
    options: { enabled: isOpen && sendTo === "TEACHER" },
  });

  const teachersList = useMemo(
    () =>
      teachersData?.pages?.flatMap(
        (page: any) => page?.staff ?? page?.data?.staff ?? page?.data ?? [],
      ) ?? [],
    [teachersData],
  );

  const hasMoreTeachers = hasNextTeachers; // Simplified for this case

  const {
    data: parentData,
    isLoading: isLoadingParents,
    hasNextPage: hasNextParents,
    fetchNextPage: fetchNextParentsPage,
    isFetchingNextPage: isFetchingNextParents,
  } = useInfiniteQueryService<any, any>({
    service: {
      ...parentServices.getAllParents,
      data: { delta: 50, status: "active", sortBy: "firstName", sortOrder: "ASC" },
    },
    options: { enabled: isOpen && !isParentContext && sendTo === "PARENT" },
  });

  const parentsList = useMemo(
    () =>
      parentData?.pages?.flatMap(
        (page: any) => page?.parents ?? page?.data?.parents ?? page?.data?.data?.parents ?? [],
      ) ?? [],
    [parentData],
  );

  const hasMoreParents = hasNextParents; // Simplified for this case

  const fetchMoreTeachers = async () => {
    if (!hasMoreTeachers || isFetchingNextTeachers) return;
    await fetchNextTeachersPage();
  };

  const fetchMoreParents = async () => {
    if (!hasMoreParents || isFetchingNextParents) return;
    await fetchNextParentsPage();
  };

  const formBody = (
    <>
      <Box className="flex flex-col gap-5 py-5">
        <Controller
          name="sendTo"
          control={control}
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <Dropdown
              options={sendOptions}
              isForm
              value={value}
              textFieldProps={{
                label: "Send To",
                labelOnTop: true,
                placeholder: "Select recipient type",
                isRounded: isMobile,
              }}
              onSelect={onChange}
              errorText={error?.message}
            />
          )}
        />
        {sendTo === "PARENT" && (
          <Controller
            name="recipient"
            control={control}
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <Dropdown
                options={
                  parentsList?.map((item: any) => ({
                    ...item,
                    name: `${item?.user?.firstName || ""} ${item?.user?.lastName || ""}`,
                    value: item,
                  })) as any[]
                }
                isForm
                value={value}
                textFieldProps={{
                  label: "Parent",
                  labelOnTop: true,
                  placeholder: "Choose a recipient",
                  isRounded: isMobile,
                }}
                onSelect={onChange}
                isLoading={isLoadingParents}
                hasMore={hasMoreParents}
                onLoadMore={fetchMoreParents}
                hasSearch
                errorText={error?.message}
              />
            )}
          />
        )}
        {sendTo === "TEACHER" && (
          <Controller
            name="recipient"
            control={control}
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <Dropdown
                options={
                  teachersList?.map((item: any) => ({
                    ...item,
                    name: `${item?.user?.firstName || ""} ${item?.user?.lastName || ""}`,
                    value: item,
                  })) as any[]
                }
                isLoading={isLoadingTeachers}
                hasMore={hasMoreTeachers}
                onLoadMore={fetchMoreTeachers}
                hasSearch
                isForm
                value={value}
                textFieldProps={{
                  label: "Teacher ",
                  labelOnTop: true,
                  placeholder: "Choose a recipient",
                  isRounded: isMobile,
                }}
                onSelect={onChange}
                errorText={error?.message}
              />
            )}
          />
        )}

        <Controller
          name="message"
          control={control}
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <div className="relative">
              <label className="text-sm text-gray-600 font-medium mb-1 block">Message</label>
              <TextField
                fullWidth
                multiline
                rows={5}
                placeholder={isUploading ? "Uploading attachment..." : "Type your message..."}
                value={value}
                onChange={onChange}
                errorText={error?.message}
                disabled={isUploading}
                isRounded={isMobile}
              />
              {isUploading && (
                <Box
                  className="absolute inset-0 flex items-center justify-center rounded-md bg-white/80"
                  sx={{ pointerEvents: "none" }}
                >
                  <CircularProgress size={20} />
                </Box>
              )}
            </div>
          )}
        />

        <Box>
          <label
            htmlFor="file-upload"
            className={`flex items-center space-x-2 text-sm text-[#022F2F] ${isUploading || uploadedMedia.length >= MAX_MEDIA_ATTACHMENTS ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:underline"}`}
          >
            <AttachFileIcon fontSize="small" />
            <span className="text-nowrap">Attach image or video (max {MAX_MEDIA_ATTACHMENTS})</span>
          </label>
          <input
            id="file-upload"
            type="file"
            className="hidden"
            accept="image/*,video/*"
            multiple
            onChange={handleFileSelect}
            disabled={isUploading || uploadedMedia.length >= MAX_MEDIA_ATTACHMENTS}
          />
          <Box className="flex flex-wrap gap-2 mt-2">
            {uploadedMedia.map((item, index) => (
              <span
                key={item.url}
                className="flex items-center gap-1 text-xs text-gray-500 max-w-[180px] bg-gray-50 px-2 py-1 rounded"
              >
                <span className="truncate">{item.name}</span>
                {!isUploading && (
                  <IconButton
                    size="small"
                    onClick={() => removeAttachment(index)}
                    className="!p-0"
                    aria-label="Remove attachment"
                  >
                    <CloseIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                )}
              </span>
            ))}
          </Box>
        </Box>
      </Box>
    </>
  );

  const desktopFooter = (
    <Box className="flex gap-4 justify-end border-t border-gray-200 pt-5">
      <Button
        onClick={onClose}
        className="!bg-[#F6F6F680] !text-[#022F2F] !border !border-[#E7E7E7] !rounded-md !min-w-[100px]"
      >
        Cancel
      </Button>
      <Button
        type="submit"
        form="new-message-form"
        className="!rounded-md !min-w-[150px]"
        loading={isPending}
        disabled={isUploading}
      >
        Send Message
      </Button>
    </Box>
  );

  const mobileFooter = (
    <Box className="flex gap-3 w-full">
      <button
        type="button"
        onClick={onClose}
        className="flex-1 py-3 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Cancel
      </button>
      <button
        type="submit"
        form="new-message-form"
        disabled={isPending || isUploading}
        className="flex-1 py-3 rounded-lg bg-brandColor-active text-white text-sm font-medium hover:opacity-90 flex items-center justify-center gap-2"
      >
        {isPending && <CircularProgress size={16} className="!text-white" />}
        Send Message
      </button>
    </Box>
  );

  if (isMobile) {
    return (
      <MobileFormDrawer
        open={isOpen}
        onClose={onClose}
        title="New Message"
        footer={mobileFooter}
      >
        <form id="new-message-form" onSubmit={handleSubmit(onSendMessage)}>
          {formBody}
        </form>
      </MobileFormDrawer>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="md:w-[600px] w-[90vw] !p-6 !rounded-md">
      <Box className="flex justify-between items-center border-b pb-3 border-[#d1d6de]">
        <Typography className="!text-xl !font-semibold !text-gray-800">New Message</Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>
      <form id="new-message-form" onSubmit={handleSubmit(onSendMessage)}>
        {formBody}
        {desktopFooter}
      </form>
    </Modal>
  );
};
