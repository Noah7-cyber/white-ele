/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Box, Typography, CircularProgress } from "@mui/material";
import Image from "next/image";
import { useRouter } from "next/navigation";
import LeftIcon from "@/modules/shared/assets/images/chevronBack.png";

import { Button } from "@/modules/shared/component/Button";
import { ButtonIcon } from "@/modules/shared/component/ButtonIcon";

import ProfileTab from "./tabs/ProfileTab";
import { ParentTab } from "./tabs/ParentTab";
import DocumentTab from "./tabs/DocumentTab";
import useManageChild from "./hook/useManageChildren";
import { FC, useState } from "react";
import { AddChildTab } from "../Children/hook/useAddChild";
import { DataRenderer } from "@/modules/shared/component/DataRenderer";
import ScrollableTabBar from "@/layout/Shared/ScrollableTabBar";
import { useMediaQuery } from "@/utils/hooks/useMediaQuery";

type MobileStep =
  | "generalInfo"
  | "medicalInfo"
  | "emergencyContact"
  | "parent"
  | "documents";

const MOBILE_STEPS: MobileStep[] = [
  "generalInfo",
  "medicalInfo",
  "emergencyContact",
  "parent",
  "documents",
];

const CHILD_INFO_TABS: { id: MobileStep; label: string }[] = [
  { id: "generalInfo", label: "General Information" },
  { id: "medicalInfo", label: "Medical Information" },
  { id: "emergencyContact", label: "Emergency Contact" },
];

interface ManageChildrenProps {
  isOpen?: boolean;
  onClose?: () => void;
  onCompleteCreation?: () => void;
  isEdit?: boolean;
  child?: any;
}

export const ManageChildPage: FC<ManageChildrenProps> = ({ child, isEdit }) => {
  const router = useRouter();
  const isMobile = useMediaQuery("(max-width: 767px)");
  const [isDocumentUploadInProgress, setIsDocumentUploadInProgress] = useState(false);
  const [mobileStep, setMobileStep] = useState<MobileStep>("generalInfo");

  const desktopTabs: { id: AddChildTab; label: string }[] = [
    { id: "profile", label: "Profile" },
    { id: "parent", label: "Parent" },
    { id: "documents", label: "Documents" },
  ];

  const {
    control,
    activeTab,
    setActiveTab,
    goNext,
    onSubmitChild,
    selectedImage,
    handleImageUpload,
    parents,
    addParent,
    addParentFromExisting,
    appendParentFromExisting,
    removeParent,
    childId,
    isCreatingChild,
    isUpdatingChild,
    isLoading,
    isClassroomsLoading,
    classroomOptions,
    childAdmissionNumber,
    isUploadingImage,
    isUploadingDocument,
    setValue,
    onRemoveDocument,
    formState,
  } = useManageChild({ child, isEdit });

  const isDocuments = activeTab === "documents";

  const isSaving =
    isLoading ||
    isCreatingChild ||
    isUpdatingChild ||
    isUploadingImage ||
    isUploadingDocument ||
    isDocumentUploadInProgress;

  // ─── Mobile flow helpers ───────────────────────────────────────────────
  const isChildInfoPhase = ["generalInfo", "medicalInfo", "emergencyContact"].includes(mobileStep);

  const getMobileProfileSection = (): "general" | "medical" | "emergency" | undefined => {
    switch (mobileStep) {
      case "generalInfo":
        return "general";
      case "medicalInfo":
        return "medical";
      case "emergencyContact":
        return "emergency";
      default:
        return undefined;
    }
  };

  const getMobileButtonText = (): string => {
    if (mobileStep === "documents") return "Save";
    if (mobileStep === "parent") return "Continue";
    return "Next";
  };

  const getMobileTitle = (): string => {
    if (childId) return "Edit Child";
    switch (mobileStep) {
      case "generalInfo":
      case "medicalInfo":
      case "emergencyContact":
        return "Add Child";
      case "parent":
        return "Add Parent";
      case "documents":
        return "Add Documents";
      default:
        return "Add Child";
    }
  };

  const goToNextMobileStep = () => {
    const idx = MOBILE_STEPS.indexOf(mobileStep);
    if (idx < MOBILE_STEPS.length - 1) {
      setMobileStep(MOBILE_STEPS[idx + 1]);
    }
  };

  const goToPrevMobileStep = () => {
    const idx = MOBILE_STEPS.indexOf(mobileStep);
    if (idx > 0) {
      setMobileStep(MOBILE_STEPS[idx - 1]);
    } else {
      router.back();
    }
  };

  const handleMobileAction = () => {
    if (mobileStep === "documents") {
      onSubmitChild();
    } else {
      goToNextMobileStep();
    }
  };

  // ─── Desktop action button ─────────────────────────────────────────────
  const desktopActionButton = isDocuments ? (
    <Button
      className="!rounded-lg !px-8"
      onClick={onSubmitChild}
      disabled={isSaving}
    >
      {isSaving ? (
        <CircularProgress size={20} className="!text-white" />
      ) : (
        "Save"
      )}
    </Button>
  ) : (
    <Button className="!rounded-lg !px-8" onClick={goNext}>
      Next
    </Button>
  );
  const mobileFooterOffset = "calc(7.5rem + env(safe-area-inset-bottom, 0px))";

  return (
    <Box
      className="h-full p-4 md:p-5 space-y-4 md:space-y-6 pb-5 md:pb-5"
      sx={{
        scrollPaddingBottom: { xs: mobileFooterOffset, md: 0 },
        paddingBottom: { xs: mobileFooterOffset, md: "1.25rem" },
      }}
    >
      {/* HEADER */}
      <Box className="flex items-center justify-between">
        <Box className="flex items-center gap-2">
          <ButtonIcon
            className="rounded-full !border !border-brandColor-active/20"
            onClick={isMobile ? goToPrevMobileStep : () => router.back()}
          >
            <Image src={LeftIcon} alt="" />
          </ButtonIcon>

          <Typography className="!text-lg md:!text-2xl !font-semibold">
            {isMobile
              ? getMobileTitle()
              : childId
                ? "Edit Child Profile"
                : "Add Child"}
          </Typography>
        </Box>

        {/* Desktop action button */}
        <Box className="hidden md:block">
          {desktopActionButton}
        </Box>
      </Box>

      {/* Mobile fixed bottom button */}
      <Box
        className="fixed bottom-0 left-0 right-0 px-4 pt-4 bg-white border-t border-border-lightGray z-30 md:hidden"
        sx={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))" }}
      >
        <Button
          className="!rounded-lg !w-full"
          onClick={handleMobileAction}
          disabled={mobileStep === "documents" && isSaving}
        >
          {mobileStep === "documents" && isSaving ? (
            <CircularProgress size={20} className="!text-white" />
          ) : (
            getMobileButtonText()
          )}
        </Button>
      </Box>

      {/* CONTENT */}
      <DataRenderer isLoading={isLoading}>
        {() => (
          <Box className="rounded-2xl flex flex-col gap-5">
            {formState?.errors && Object.keys(formState.errors).length > 0 && (
              <Box className="py-3 px-4 rounded-lg bg-red-50 border border-red-200">
                <Typography className="text-sm! text-red-700!">
                  Please fix the errors below before saving. Use the tabs to find and correct any missing or invalid fields.
                </Typography>
              </Box>
            )}

            {/* ─── MOBILE FLOW ──────────────────────────────────────── */}
            {isMobile ? (
              <>
                {/* Child info phase: sub-tabs */}
                {isChildInfoPhase && (
                  <ScrollableTabBar className="border-b border-border-lightGray">
                    {CHILD_INFO_TABS.map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        className={`shrink-0 whitespace-nowrap pb-2 px-3 !cursor-pointer text-sm ${
                          mobileStep === tab.id
                            ? "!text-brandColor-active border-b !border-brandColor-active !font-medium"
                            : "text-gray-500"
                        }`}
                        onClick={() => setMobileStep(tab.id)}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </ScrollableTabBar>
                )}

                {/* Profile sections (conditional based on mobile step) */}
                {isChildInfoPhase && (
                  <ProfileTab
                    control={control}
                    selectedImage={selectedImage}
                    handleImageUpload={handleImageUpload}
                    classroomOptions={classroomOptions}
                    isClassroomsLoading={isClassroomsLoading}
                    studentId={childAdmissionNumber}
                    mobileSection={getMobileProfileSection()}
                  />
                )}

                {/* Parent phase */}
                {mobileStep === "parent" && (
                  <ParentTab
                    control={control}
                    parents={parents}
                    addParent={addParent}
                    addParentFromExisting={addParentFromExisting}
                    appendParentFromExisting={appendParentFromExisting}
                    removeParent={removeParent}
                    selectedImage={selectedImage}
                    handleImageUpload={handleImageUpload}
                    isEdit={!!childId}
                  />
                )}

                {/* Documents phase */}
                {mobileStep === "documents" && (
                  <DocumentTab
                    control={control}
                    selectedImage={selectedImage}
                    handleImageUpload={handleImageUpload}
                    setValue={setValue}
                    onRemoveDocument={onRemoveDocument}
                    onUploadingChange={setIsDocumentUploadInProgress}
                  />
                )}
                <Box aria-hidden className="md:hidden w-full shrink-0" sx={{ height: mobileFooterOffset }} />

              </>
            ) : (
              /* ─── DESKTOP TABS (unchanged) ─────────────────────── */
              <>
                <ScrollableTabBar className="border-b border-border-lightGray">
                  {desktopTabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      className={`shrink-0 whitespace-nowrap pb-2 px-3 !cursor-pointer ${
                        activeTab === tab.id
                          ? "!text-brandColor-active border-b  !border-brandColor-active"
                          : "text-gray-500"
                      }`}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </ScrollableTabBar>

                {activeTab === "profile" && (
                  <ProfileTab
                    control={control}
                    selectedImage={selectedImage}
                    handleImageUpload={handleImageUpload}
                    classroomOptions={classroomOptions}
                    isClassroomsLoading={isClassroomsLoading}
                    studentId={childAdmissionNumber}
                  />
                )}

                {activeTab === "parent" && (
                  <ParentTab
                    control={control}
                    parents={parents}
                    addParent={addParent}
                    addParentFromExisting={addParentFromExisting}
                    appendParentFromExisting={appendParentFromExisting}
                    removeParent={removeParent}
                    selectedImage={selectedImage}
                    handleImageUpload={handleImageUpload}
                    isEdit={!!childId}
                  />
                )}

                {activeTab === "documents" && (
                  <DocumentTab
                    control={control}
                    selectedImage={selectedImage}
                    handleImageUpload={handleImageUpload}
                    setValue={setValue}
                    onRemoveDocument={onRemoveDocument}
                    onUploadingChange={setIsDocumentUploadInProgress}
                  />
                )}
              </>
            )}
          </Box>
        )}
      </DataRenderer>
    </Box>
  );
};
