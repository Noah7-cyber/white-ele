"use client";

import type React from "react";
import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Box, Typography } from "@mui/material";
import { CWTextField } from "@/modules/shared/component/FormFields/CWTextField";
import { Button } from "@/modules/shared/component/Button";

import { ButtonIcon } from "@/modules/shared/component/ButtonIcon";

import LeftIcon from "@/modules/shared/assets/images/chevronBack.png";

import EditIcon from "@/modules/shared/assets/svgs/editColored.svg";

import Image from "next/image";

import useCreateAnnouncementPage from "./hooks/useCreateAnnouncementPage";
import SendIcon from "@/modules/shared/assets/svgs/publish.svg";
import dynamic from "next/dynamic";
import { MobileFormDrawer } from "@/modules/shared/component/MobileFormDrawer/MobileFormDrawer";
import { useMediaQuery } from "@/utils/hooks/useMediaQuery";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { announcementDynamicEndpoints } from "@/services/announcements.service";

// Dynamically import EditorComponent to avoid SSR issues
const EditorComponent = dynamic(() => import("@/components/Editor/editor"), {
  ssr: false,
});

function normalizeEditorContent(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === "object" && Array.isArray((raw as { blocks?: unknown }).blocks)) {
    return raw as Record<string, unknown>;
  }
  if (typeof raw === "string" && raw.trim()) {
    return {
      blocks: [{ type: "paragraph", data: { text: raw } }],
    };
  }
  return { blocks: [] };
}

export const CreateAnnouncementPage: React.FC = ({}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const duplicateId = searchParams.get("duplicate");
  const isMobile = useMediaQuery("(max-width:768px)");
  const prefilledRef = useRef<string | null>(null);

  const {
    control,
    isPending,
    isSavingDraft,
    setValue,
    onSaveDraft,
    onSave,
    handleSubmit,
  } = useCreateAnnouncementPage();

  const { data: duplicateSource } = useQueryService({
    service: announcementDynamicEndpoints.getAnnouncementById(duplicateId || ""),
    options: { enabled: Boolean(duplicateId) },
  });

  useEffect(() => {
    if (!duplicateId || !duplicateSource) return;
    const ann = (duplicateSource as { announcement?: { subject?: string; content?: unknown } })
      ?.announcement;
    if (!ann || prefilledRef.current === duplicateId) return;
    prefilledRef.current = duplicateId;
    const baseTitle = ann.subject?.trim() || "";
    setValue("title", baseTitle ? `${baseTitle} (copy)` : "");
    setValue("content", normalizeEditorContent(ann.content) as never);
  }, [duplicateId, duplicateSource, setValue]);

  const formBody = (
    <Box className="flex flex-col gap-4 md:gap-5 w-full">
      <CWTextField
        control={control}
        name="title"
        label="Announcement Title"
        placeholder="Enter a brief headline for the announcement"
        labelOnTop
        labelClassName="!text-sm !font-medium !text-input-gray"
        inputClasses="mt-1 !text-sm !h-10 !text-input-gray"
        className="w-full"
      />
      <EditorComponent
        onChange={(_, data) => {
          setValue("content", data);
        }}
      />
    </Box>
  );

  const actionButtons = (
    <Box className="flex flex-col gap-2 w-full">
      <Button
        className="!rounded-lg !w-full !px-4 !pl-5 !bg-background-offwhite/50 !text-sm !text-primary-dark !border !border-border-gray"
        onClick={handleSubmit(onSaveDraft)}
        loading={isSavingDraft}
        disabled={isPending}
        startIcon={<EditIcon />}
      >
        Save to Draft
      </Button>
      <Button
        className="!rounded-lg !w-full !px-4 !text-sm disabled:cursor-no-drop"
        onClick={handleSubmit(onSave)}
        disabled={isSavingDraft}
        loading={isPending && !isSavingDraft}
        startIcon={<SendIcon />}
      >
        Publish
      </Button>
    </Box>
  );

  if (isMobile) {
    return (
      <MobileFormDrawer
        open
        onClose={() => router.back()}
        title="Create Announcement"
        footer={actionButtons}
      >
        <Box className="py-2">{formBody}</Box>
      </MobileFormDrawer>
    );
  }

  return (
    <Box className=" h-full rounded-xl !p-5 pb-8 space-y-6">
      <Box className="flex items-center justify-between">
        <Box className="flex items-center gap-2">
          <ButtonIcon
            className="rounded-full !border !border-brandColor-active/20 !p- flex items-center justify-center"
            onClick={() => router.back()}
          >
            <Image src={LeftIcon} alt="" />
          </ButtonIcon>
          <Typography className="!text-xl !font-semibold !text-text-primary">
            Create Announcement
          </Typography>
        </Box>
        <Box className="flex gap-2">
          <Button
            className="!rounded-lg !px-4 !pl-5 !bg-background-offwhite/50 !text-sm !text-primary-dark !border !border-border-gray !bg-"
            onClick={handleSubmit(onSaveDraft)}
            loading={isSavingDraft}
            disabled={isPending}
            startIcon={<EditIcon />}
          >
            Save to Draft
          </Button>
          <Button
            className="!rounded-lg !px-4 !text-sm disabled:cursor-no-drop"
            onClick={handleSubmit(onSave)}
            disabled={isSavingDraft}
            loading={isPending && !isSavingDraft}
            startIcon={<SendIcon />}
          >
            Publish
          </Button>
        </Box>
      </Box>
      <Box className="bg-white p-4 h-full rounded-xl">
        <Box className="flex flex-col gap-4">
          <Box className="flex items-center border-b border-border-input pb-3 justify-between">
            <Box>
              <Typography className="!text-lg !font-semibold !text-primary-dark">
                General Information
              </Typography>
              <Typography className="!text-xs !font-normal !text-primary-dark/30">
                Write a detailed information to let parents know what the announcement is about.
              </Typography>
            </Box>
          </Box>
          {formBody}
        </Box>
      </Box>
    </Box>
  );
};
