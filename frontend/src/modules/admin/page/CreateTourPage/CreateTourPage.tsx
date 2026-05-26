"use client";

import { Button } from "@/modules/shared/component/Button";
import { ButtonIcon } from "@/modules/shared/component/ButtonIcon";
import Image from "next/image";
import LeftIcon from "@/modules/shared/assets/images/chevronBack.png";
import ThrashIcon from "@/modules/shared/assets/svgs/trash-black.svg";
import PreviewIcon from "@/modules/shared/assets/svgs/click.svg";
import MainContent from "./MainContent";
import { useRouter } from "next/navigation";
import { useCreateTour } from "./hooks/useCreateTour";
import { useState } from "react";
import Link from "next/link";
import { useMediaQuery } from "@/utils/hooks/useMediaQuery";
import { Drawer, IconButton } from "@mui/material";
import MoreIcon from "@/modules/shared/assets/svgs/more-icon.svg";
import { MobileFormDrawer } from "@/modules/shared/component/MobileFormDrawer/MobileFormDrawer";

const isRequiredTourDataComplete = (values: {
  basicInfo?: {
    title?: string;
    description?: string;
    url?: string;
    duration?: number;
    location?: string;
  };
  availability?: Array<{
    day?: string;
    startHour?: number | null;
    startMinute?: number | null;
    startMeridiem?: string | null;
    endHour?: number | null;
    endMinute?: number | null;
    endMeridiem?: string | null;
  }>;
  notification?: {
    minimumNotice?: number;
    minimumNoticeUnit?: string;
  };
}) => {
  const basicInfo = values.basicInfo;
  const hasBasicInfo =
    Boolean(basicInfo?.title?.trim()) &&
    Boolean(basicInfo?.description?.trim()) &&
    Boolean(basicInfo?.url?.trim()) &&
    Boolean(basicInfo?.location?.trim()) &&
    Number(basicInfo?.duration ?? 0) > 0;

  const hasAvailability =
    Array.isArray(values.availability) &&
    values.availability.length > 0 &&
    values.availability.every(
      (slot) =>
        Boolean(slot?.day) &&
        slot?.startHour !== null &&
        slot?.startHour !== undefined &&
        slot?.startMinute !== null &&
        slot?.startMinute !== undefined &&
        Boolean(slot?.startMeridiem) &&
        slot?.endHour !== null &&
        slot?.endHour !== undefined &&
        slot?.endMinute !== null &&
        slot?.endMinute !== undefined &&
        Boolean(slot?.endMeridiem),
    );

  const hasNotification =
    values.notification?.minimumNotice !== null &&
    values.notification?.minimumNotice !== undefined &&
    Boolean(values.notification?.minimumNoticeUnit);

  return hasBasicInfo && hasAvailability && hasNotification;
};

const CreateTourPage = ({ mode = "create", tourId }: { mode?: "create" | "edit"; tourId?: string }) => {
  const router = useRouter();
  const isMobile = useMediaQuery("(max-width:768px)");
  const [activeTab, setActiveTab] = useState("basic");
  const [isActionDrawerOpen, setIsActionDrawerOpen] = useState(false);
  const {
    handleSave,
    isCreatingTour,
    control,
    setValue,
    getValues,
    watch,
    trigger,
    formState,
    updateRequestBody,
    reset,
    clearTourData,
    isLoadingExistingTour,
    isEditMode,
  } = useCreateTour({ mode, tourId });

  const handleReset = () => {
    reset();
    clearTourData();
    setActiveTab("basic");
  };
  const previewPath = "/admin/admission/tours/create/preview";

  const allFormValues = watch();
  const isRequiredDataComplete = isRequiredTourDataComplete(allFormValues);
  const isFormReadyToSubmit = formState.isValid && isRequiredDataComplete;
  const getFirstInvalidTab = () => {
    const errors = formState.errors as Record<string, unknown> | undefined;
    if (!errors) return "basic";
    if (errors.basicInfo) return "basic";
    if (errors.availability) return "availability";
    if (errors.notification) return "notification";
    return "basic";
  };

  const handleAttemptSave = async () => {
    // Validate the required sections across the multi-step form.
    const valid = await trigger(["basicInfo", "availability", "notification"]);
    if (!valid) {
      setActiveTab(getFirstInvalidTab());
      return;
    }
    await handleSave();
  };
  const handleNavigateBack = () => {
    router.push("/admin/admission/tours/");
  };

  const handlePreview = () => {
    updateRequestBody();
    setIsActionDrawerOpen(false);
    router.push(previewPath);
  };

  const handleClearAll = () => {
    handleReset();
    setIsActionDrawerOpen(false);
  };

  if (isMobile) {
    return (
      <>
        <MobileFormDrawer
          open
          onClose={handleNavigateBack}
          title={isEditMode ? "Edit Tour Event" : "Create Tour Event"}
          headerRight={
            <IconButton
              onClick={() => setIsActionDrawerOpen(true)}
              className="!rounded-full !border !border-brandColor-active/20 !w-9 !h-9"
              aria-label="More actions"
            >
              <MoreIcon />
            </IconButton>
          }
          footer={
            <Button
              className="!w-full !rounded-lg"
              onClick={handleAttemptSave}
              disabled={isCreatingTour || !isFormReadyToSubmit || (isEditMode && isLoadingExistingTour)}
            >
              {isCreatingTour ? "Saving..." : isEditMode ? "Update" : "Save"}
            </Button>
          }
        >
          {isEditMode && isLoadingExistingTour ? (
            <section className="h-max bg-white rounded-xl border border-[#008080]/20 p-5 mt-3">
              <p className="text-primary-text-light">Loading tour details...</p>
            </section>
          ) : (
            <section className="h-full bg-white rounded-xl border border-[#008080]/20 mt-3 overflow-hidden">
              <MainContent
                control={control}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                setValue={setValue}
                getValues={getValues}
                watch={watch}
                trigger={trigger}
                formState={formState}
              />
            </section>
          )}
        </MobileFormDrawer>

        <Drawer
          anchor="bottom"
          open={isActionDrawerOpen}
          onClose={() => setIsActionDrawerOpen(false)}
          PaperProps={{
            className: "rounded-t-3xl",
          }}
        >
          <div className="px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-white">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-gray-300" />
            <h3 className="text-sm font-semibold text-[#022F2F] mb-1">Tour Actions</h3>
            <p className="text-xs text-[#667085] mb-4">
              Preview or clear all fields and return to the first tab.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleClearAll}
                className="flex-1 py-3 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Clear form
              </button>
              <button
                onClick={handlePreview}
                className="flex-1 py-3 rounded-lg bg-brandColor-active text-white text-sm font-medium hover:opacity-90"
              >
                Preview
              </button>
            </div>
          </div>
        </Drawer>
      </>
    );
  }

  return (
    <main className="min-h-screen p-5 mb-3">
      <div className="flex items-center justify-between gap-5 py-1 border-b border-[#E4E7EC] pb-4">
        <div className="flex items-center gap-3">
          <ButtonIcon
            onClick={handleNavigateBack}
            className="rounded-full border! border-brandColor-active/20! !p- flex items-center justify-center"
          >
            <Image src={LeftIcon} alt="back icon" />
          </ButtonIcon>
          <h1 className="text-xl font-semibold">
            {isEditMode ? "Edit Tour Event" : "Create Tour Event"}
          </h1>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-1  border border-[#D0D5DD] rounded-sm justify-center">
            <Link href={previewPath} target="_blank" rel="noopener noreferrer">
              <button
                aria-label="Preview"
                onClick={() => {
                  updateRequestBody();
                }}
                className="cursor-pointer p-1 pl-2 flex items-center justify-center"
              >
                <PreviewIcon />
              </button>
            </Link>
            <div className="w-[1px] h-full bg-[#D0D5DD]"></div>

            <button
              type="button"
              className="p-1 pr-2 cursor-pointer"
              onClick={handleReset}
            >
              <ThrashIcon />
            </button>
          </div>
          <Button
            className="px-8! rounded-lg!"
            onClick={handleAttemptSave}
            disabled={isCreatingTour || !isFormReadyToSubmit}
          >
            {isCreatingTour ? "Saving..." : isEditMode ? "Update" : "Save"}
          </Button>
        </div>
      </div>

      {isEditMode && isLoadingExistingTour ? (
        <section className="h-max bg-white rounded-xl border border-[#008080]/20 p-8">
          <p className="text-primary-text-light">Loading tour details...</p>
        </section>
      ) : (
        <section className="h-max bg-white rounded-xl border border-[#008080]/20 mt-6">
          <MainContent
            control={control}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            setValue={setValue}
            getValues={getValues}
            watch={watch}
            trigger={trigger}
            formState={formState}
          />
        </section>
      )}

    </main>
  );
};

export default CreateTourPage;
