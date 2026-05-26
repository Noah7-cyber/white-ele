"use client";

import type React from "react";
import { useState } from "react";
import { Box, Typography } from "@mui/material";
import Image from "next/image";
import LeftIcon from "@/modules/shared/assets/images/chevronBack.png";

import { Button } from "@/modules/shared/component/Button";
import { ButtonIcon } from "@/modules/shared/component/ButtonIcon";

import useAddChild, { type AddChildTab } from "./hook/useAddChild";
import { useRouter } from "next/navigation";
import ProfileTab from "./tabs/ProfileTab";
import { ParentTab } from "./tabs/ParentTab";
import DocumentTab from "./tabs/DocumentTab";
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

export const AddChildPage: React.FC = () => {
  const router = useRouter();
  const isMobile = useMediaQuery("(max-width: 767px)");
  const [mobileStep, setMobileStep] = useState<MobileStep>("generalInfo");

  const {
    control,
    activeTab,
    setActiveTab,
    goNext,
    goPrev: _goPrev,
    handleSave,
    selectedImage,
    handleImageUpload,
    parents,
    addParent,
    removeParent,
  } = useAddChild();

  const isDocuments = activeTab === "documents";

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
      handleSave();
    } else {
      goToNextMobileStep();
    }
  };

  // ─── Desktop action button ─────────────────────────────────────────────
  const desktopActionButton = isDocuments ? (
    <Button className="!rounded-lg !px-8" onClick={handleSave}>
      Save
    </Button>
  ) : (
    <Button className="!rounded-lg !px-8" onClick={goNext}>
      Next
    </Button>
  );

  return (
    <Box className="h-full p-4 md:p-5 space-y-4 md:space-y-6 pb-20 md:pb-5">
      {/* HEADER */}
      <Box className="flex items-center justify-between">
        <Box className="flex items-center gap-2">
          <ButtonIcon
            className="rounded-full !border !border-brandColor-active/20 !p- flex items-center justify-center"
            onClick={isMobile ? goToPrevMobileStep : () => router.back()}
          >
            <Image src={LeftIcon || "/placeholder.svg"} alt="" />
          </ButtonIcon>
          <Typography className="!text-lg md:!text-2xl !font-semibold">
            {isMobile ? getMobileTitle() : "Add Child"}
          </Typography>
        </Box>
        <Box className="hidden md:flex gap-2">
          {desktopActionButton}
        </Box>
      </Box>

      {/* Mobile sticky bottom button */}
      <Box className="fixed bottom-0 left-0 right-0 px-4 py-4 bg-white border-t border-border-lightGray z-30 md:hidden">
        <Button className="!rounded-lg !w-full" onClick={handleMobileAction}>
          {getMobileButtonText()}
        </Button>
      </Box>

      {/* CONTENT */}
      <Box className="rounded-2xl flex flex-col gap-5">
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

            {isChildInfoPhase && (
              <ProfileTab
                control={control}
                handleImageUpload={handleImageUpload}
                selectedImage={selectedImage}
                mobileSection={getMobileProfileSection()}
              />
            )}

            {mobileStep === "parent" && (
              <ParentTab
                control={control}
                handleImageUpload={handleImageUpload}
                selectedImage={selectedImage}
                parents={parents}
                addParent={addParent}
                removeParent={removeParent}
              />
            )}

            {mobileStep === "documents" && (
              <DocumentTab
                control={control}
                handleImageUpload={handleImageUpload}
                selectedImage={selectedImage}
              />
            )}
          </>
        ) : (
          /* ─── DESKTOP TABS (unchanged) ─────────────────────── */
          <>
            <ScrollableTabBar className="border-b border-border-lightGray">
              {[
                { id: "profile", label: "Profile" },
                { id: "parent", label: "Parent" },
                { id: "documents", label: "Documents" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`shrink-0 whitespace-nowrap !text-sm !font-normal pb-2 px-3 ${
                    activeTab === (t.id as AddChildTab)
                      ? "!text-brandColor-active border-b !font-medium !border-brandColor-active"
                      : "text-gray-500"
                  }`}
                  onClick={() => setActiveTab(t.id as AddChildTab)}
                >
                  {t.label}
                </button>
              ))}
            </ScrollableTabBar>

            {activeTab === "profile" && (
              <ProfileTab
                control={control}
                handleImageUpload={handleImageUpload}
                selectedImage={selectedImage}
              />
            )}

            {activeTab === "parent" && (
              <ParentTab
                control={control}
                handleImageUpload={handleImageUpload}
                selectedImage={selectedImage}
                parents={parents}
                addParent={addParent}
                removeParent={removeParent}
              />
            )}

            {activeTab === "documents" && (
              <Box className="flex flex-col">
                <DocumentTab
                  control={control}
                  handleImageUpload={handleImageUpload}
                  selectedImage={selectedImage}
                />
              </Box>
            )}
          </>
        )}
      </Box>
    </Box>
  );
};
