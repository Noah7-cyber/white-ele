"use client";

import type React from "react";
import { useState } from "react";
import { Box, Typography } from "@mui/material";
import Image from "next/image";
import LeftIcon from "@/modules/shared/assets/images/chevronBack.png";
import { Button } from "@/modules/shared/component/Button";
import { ButtonIcon } from "@/modules/shared/component/ButtonIcon";
import { useRouter } from "next/navigation";
import ProfileTab from "./tabs/ProfileTab";
import DocumentTab from "./tabs/DocumentTab";
import ConfirmModal from "@/components/ConfirmModal/confirmModal";
import WarnIcon from "@/modules/shared/assets/svgs/warnIcon.svg";
import TrashIcon from "@/modules/shared/assets/svgs/trashicon.svg";
import { showToast } from "@/modules/shared/component/Toast";
import useAddChild from "./hook/useAddChild";
import ScrollableTabBar from "@/layout/Shared/ScrollableTabBar";
import { useMediaQuery } from "@/utils/hooks/useMediaQuery";

type ChildDetailTab = "profile" | "parent" | "documents";

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

interface ChildDetailProps {
  isEditMode?: boolean;
}

export const ChildDetail: React.FC<ChildDetailProps> = ({ isEditMode = false }) => {
  const router = useRouter();
  const isMobile = useMediaQuery("(max-width: 767px)");
  const [activeTab, setActiveTab] = useState<ChildDetailTab>("profile");
  const [mobileStep, setMobileStep] = useState<MobileStep>("generalInfo");
  const [deactivateModal, setDeactivateModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const { control } = useAddChild();

  const tabs = [
    { id: "profile", label: "Profile" },
    { id: "parent", label: "Parents" },
    { id: "documents", label: "Documents" },
  ];

  const handleDeactivate = () => {
    setDeactivateModal(false);
    showToast({
      message: "Child Deactivated",
      description: "The child has been successfully deactivated.",
      severity: "success",
      duration: 3000,
    });
    router.back();
  };

  const handleDelete = () => {
    setDeleteModal(false);
    showToast({
      message: "Child Deleted",
      description: "The child has been successfully deleted.",
      severity: "success",
      duration: 3000,
    });
    router.back();
  };

  // ─── Mobile flow helpers (edit mode) ────────────────────────────────────
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

  return (
    <Box className={`h-full p-4 md:p-5 space-y-4 md:space-y-6 ${isEditMode && isMobile ? "pb-20" : ""}`}>
      {/* HEADER */}
      <Box className="flex items-center justify-between">
        <Box className="flex items-center gap-2">
          <ButtonIcon
            className="rounded-full !border !border-brandColor-active/20 !p-2 flex items-center justify-center"
            onClick={isMobile && isEditMode ? goToPrevMobileStep : () => router.back()}
          >
            <Image src={LeftIcon || "/placeholder.svg"} alt="back" />
          </ButtonIcon>
          <Typography className="!text-lg md:!text-2xl !font-semibold">
            {isEditMode ? "Edit Child" : "Child Profile"}
          </Typography>
        </Box>
        <Box className="hidden md:flex gap-2">
          {!isEditMode && (
            <>
              <Button className="!rounded-lg !px-8">
                Edit Profile
              </Button>
              <Box className="flex gap-2">
                <Button
                  variant="outlined"
                  className="!rounded-lg !px-8"
                  onClick={() => setDeactivateModal(true)}
                >
                  Deactivate
                </Button>
                <Button
                  variant="outlined"
                  className="!rounded-lg !px-8 !text-red-600"
                  onClick={() => setDeleteModal(true)}
                >
                  Delete
                </Button>
              </Box>
            </>
          )}
          {isEditMode && <Button className="!rounded-lg !px-8">Save Changes</Button>}
        </Box>
      </Box>

      {/* Mobile sticky bottom button (edit mode only) */}
      {isEditMode && (
        <Box className="fixed bottom-0 left-0 right-0 px-4 py-4 bg-white border-t border-border-lightGray z-30 md:hidden">
          <Button className="!rounded-lg !w-full" onClick={goToNextMobileStep}>
            {getMobileButtonText()}
          </Button>
        </Box>
      )}

      {/* CONTENT */}
      <Box className="rounded-2xl px-0 md:px-4 flex flex-col gap-5">
        {/* ─── MOBILE EDIT FLOW ──────────────────────────────── */}
        {isMobile && isEditMode ? (
          <>
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
                handleImageUpload={() => {}}
                selectedImage={null}
                mobileSection={getMobileProfileSection()}
              />
            )}

            {mobileStep === "parent" && (
              <ProfileTab control={control} handleImageUpload={() => {}} selectedImage={null} />
            )}

            {mobileStep === "documents" && (
              <DocumentTab control={control} handleImageUpload={() => {}} selectedImage={null} />
            )}
          </>
        ) : (
          /* ─── DESKTOP / MOBILE VIEW MODE (tabs unchanged) ── */
          <>
            <ScrollableTabBar
              className="border-b border-border-lightGray !overflow-x-visible lg:!overflow-x-auto"
              innerClassName="flex flex-nowrap items-center gap-2 w-full justify-between lg:w-auto lg:justify-start lg:min-w-min"
            >
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`shrink-0 whitespace-nowrap !text-sm !font-normal pb-2 px-3 ${
                    activeTab === (tab.id as ChildDetailTab)
                      ? "!text-brandColor-active border-b !font-medium !border-brandColor-active"
                      : "text-gray-500"
                  }`}
                  onClick={() => setActiveTab(tab.id as ChildDetailTab)}
                >
                  {tab.label}
                </button>
              ))}
            </ScrollableTabBar>

            {activeTab === "profile" && (
              <ProfileTab control={control} handleImageUpload={() => {}} selectedImage={null} />
            )}

            {activeTab === "parent" && (
              <ProfileTab control={control} handleImageUpload={() => {}} selectedImage={null} />
            )}

            {activeTab === "documents" && (
              <DocumentTab control={control} handleImageUpload={() => {}} selectedImage={null} />
            )}
          </>
        )}
      </Box>

      {/* Deactivate Modal */}
      <ConfirmModal
        open={deactivateModal}
        onClose={() => setDeactivateModal(false)}
        onConfirm={handleDeactivate}
        icon={<WarnIcon />}
        title="Are you sure you want to deactivate this child?"
        description="You will be able to reactivate this child later."
        confirmLabel="Deactivate"
        cancelLabel="Cancel"
      />

      {/* Delete Modal */}
      <ConfirmModal
        open={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={handleDelete}
        icon={<TrashIcon />}
        title="Are you sure you want to delete this child?"
        description="This action cannot be undone. Once deleted, all related data will be permanently removed."
        confirmLabel="Delete"
        cancelLabel="Cancel"
      />
    </Box>
  );
};
