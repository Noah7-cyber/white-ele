"use client";

import { useEffect, useRef, useState } from "react";
import { Box, IconButton, Typography } from "@mui/material";
import { Modal } from "@/modules/shared/component/modal";
import ClockIcon from "@/modules/shared/assets/svgs/clock-Icon.svg";
import CaretDown from "@/modules/shared/assets/svgs/caretDown.svg";
import { CWPopover } from "@/modules/shared/component/Popover";
import useActivities from "../Activities/hook/useActivities";
import { ClassAttendanceChart } from "../../component/ClassAttendanceChart";
import { Button } from "@/modules/shared/component/Button";
import ResetIcon from "@/modules/shared/assets/svgs/resetWhite.svg";
import KeyIcon from "@/modules/shared/assets/svgs/keyLinear.svg";
import useParentDashboard from "./hooks/useParentDashboard";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { profileServices, type ProfileResponse } from "@/services/profile.service";
import { PERIOD_OPTIONS } from "@/constants";
import TimeRangeFilterPopover from "@/modules/shared/component/FilterPopover/timeRangeFilterPopover";
import FilterIcon from "@/modules/shared/assets/svgs/filter.svg";
import { MobileFilterDrawer } from "@/modules/shared/component/MobileFilterDrawer/MobileFilterDrawer";
import { Dropdown } from "@/modules/shared/component/Dropdown";
import CloseIcon from "@/modules/shared/assets/svgs/closeIcon.svg";
import LateArrivalIcon from "@/modules/shared/assets/svgs/clockLight.svg";
import FullAbsenseIcon from "@/modules/shared/assets/svgs/calendarRed.svg";
import { Controller } from "react-hook-form";
import { DatePicker } from "@/modules/shared/component/DatePicker";
import { useFormValidator } from "@/utils/hooks/useFormValidator";
import * as Yup from "yup";
import { CWTextArea } from "@/modules/shared/component/FormFields/CWTextArea";
import { SearchTextfield } from "@/modules/shared/component/SearchTextfield/searchTextfield";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { AttendanceServices, ClockInChildRequest } from "@/services/attendance.service";
import { showToast } from "@/modules/shared/component/Toast";
import { useUser } from "@/utils/hooks/useUser";
import { QRCodeSVG } from "qrcode.react";
import { getSchoolFromCookie, getSchoolPortalOrigin } from "@/utils/helper";
import { encodeKioskParentCredentials } from "@/utils/kioskQrPayload";
import { CopyIcon, ShareIcon } from "lucide-react";

export const ParentHome = () => {
  const { parentId } = useUser();
  const { data: profileData } = useQueryService<Record<string, never>, ProfileResponse>({
    service: profileServices.getProfile,
    options: {
      keys: ["profile"],
    },
  });

  const {
    currentPeriod,
    startDate,
    endDate,
    kioskPin,
    handlePeriodChange,
    handleCustomDateApply,
    renderPinBoxes,
    attendanceChartData,
    percentageGrowth,
    isLoading: isDashboardLoading,
  } = useParentDashboard();
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [periodAnchorEl, setPeriodAnchorEl] = useState<HTMLElement | null>(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [mobileCustomPeriodOpen, setMobileCustomPeriodOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportType, setReportType] = useState<"absence" | "late">("absence");
  const [hasCopiedKioskLink, setHasCopiedKioskLink] = useState(false);

  const {
    activities: recentActivities,
    isActivitiesLoading,
    children,
    childrenFilter,
    handleChildrenFilterChange,
    getChildName,
    getActivityDescription,
    getActivityTitle,
    getActivityDateAndTime,
    renderActivityIcon,
  } = useActivities({ startDate, endDate });

  const periodOptions = PERIOD_OPTIONS.map((o) => ({ label: o.name, value: o.name }));
  const reportChildrenOptions = children.map((child) => ({
    value: String(child.id),
    name: child.fullName,
  }));

  const userName = profileData?.data?.user?.firstName || "there";
  const hasTriggeredChangePasswordModal = useRef(false);
  const { mutateAsync: reportAttendanceAsync, isPending: isReportSubmitting } = useMutationService<
    ClockInChildRequest,
    unknown
  >({
    service: AttendanceServices.clockInChild,
    options: { disableToast: true },
  });

  useEffect(() => {
    const user = profileData?.data?.user as { isSystemGeneratedPassword?: boolean } | undefined;
    const shouldForceChange = Boolean(user?.isSystemGeneratedPassword);

    if (
      shouldForceChange &&
      !hasTriggeredChangePasswordModal.current &&
      typeof window !== "undefined"
    ) {
      hasTriggeredChangePasswordModal.current = true;
      window.dispatchEvent(new CustomEvent("openChangePasswordModal"));
    }
  }, [profileData?.data?.user]);

  const attendanceKioskLink = (() => {
    const parentEmail = profileData?.data?.user?.email?.trim() || "";
    const parentKioskPin = kioskPin?.trim() || "";
    if (!parentEmail || !parentKioskPin) return "";

    const token = encodeKioskParentCredentials({
      email: parentEmail,
      kioskPin: parentKioskPin,
    });

    const kioskPath = `/kiosk/parents/login?role=admin&q=${encodeURIComponent(token)}`;
    if (typeof window !== "undefined") {
      return new URL(kioskPath, window.location.origin).toString();
    }
    const school = getSchoolFromCookie();
    if (school?.subDomain) {
      return `${getSchoolPortalOrigin(school.subDomain)}${kioskPath}`;
    }
    return "";
  })();
  const attendanceKioskQrValue = (() => {
    if (!attendanceKioskLink) return "";
    return attendanceKioskLink;
  })();

  const handleCopyKioskLink = async () => {
    if (!attendanceKioskQrValue || typeof window === "undefined") return;
    try {
      await navigator.clipboard.writeText(attendanceKioskQrValue);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = attendanceKioskQrValue;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
    setHasCopiedKioskLink(true);
    setTimeout(() => setHasCopiedKioskLink(false), 1500);
  };

  const handleShareKioskLink = async () => {
    if (!attendanceKioskQrValue || typeof window === "undefined") return;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Attendance Kiosk", url: attendanceKioskQrValue });
        return;
      } catch {
        // Continue to fallback.
      }
    }
    await handleCopyKioskLink();
  };

  const openReportModal = (type: "absence" | "late") => {
    setReportType(type);
    setIsReportModalOpen(true);
  };

  const closeReportModal = () => {
    setIsReportModalOpen(false);
    form.reset();
  };

  const form = useFormValidator<{
    reportChildId: string;
    reportDate: string;
    reportReason: string;
  }>({
    validationSchema: Yup.object({
      reportChildId: Yup.string().required("Child is required"),
      reportDate: Yup.string().required("Date is required"),
      reportReason: Yup.string().required("Reason is required"),
    }),
    defaultValues: {
      reportChildId: "",
      reportDate: "",
      reportReason: "",
    },
    reValidateMode: "onChange",
  });

  const handleSubmitReport = async () => {
    await form.handleSubmit(async (data) => {
      if (!parentId) {
        showToast({
          message: "Unable to submit report",
          description: "Parent account could not be resolved. Please refresh and try again.",
          severity: "error",
        });
        return;
      }
      const childId = Number(data.reportChildId);
      const selectedChild = children.find((child) => child.id === childId);
      const reportLabel = reportType === "absence" ? "Absence" : "Late Arrival";
      const notes = `Attendance report (${reportLabel}) - Child: ${selectedChild?.fullName || "Unknown"} - Date: ${data.reportDate}${data.reportReason ? ` - Reason: ${data.reportReason}` : ""}`;
      try {
        await reportAttendanceAsync({
          parentId,
          studentIds: [childId],
          notes,
        });

        showToast({
          message: `${reportLabel} reported`,
          description: `Your report for ${selectedChild?.fullName || "the selected child"} has been submitted.`,
          severity: "success",
        });

        closeReportModal();
      } catch (error) {
        const err = error as { response?: { data?: { message?: string } } };
        showToast({
          message: "Report submission failed",
          description:
            err?.response?.data?.message || "Unable to submit attendance report right now.",
          severity: "error",
        });
      }
    })();
  };

  return (
    <Box className="h-auto flex flex-col gap-5 p-4 md:p-5 !bg-dashboard-bg">
      <Box className="hidden md:flex justify-between items-center gap-3">
        <Typography className="!text-xl !text-text-primary !font-semibold">Dashboard</Typography>
        <Box className="flex flex-wrap items-center gap-2">
          <CWPopover
            actionComponent={
              <>
                {childrenFilter === "All Children"
                  ? "All Children"
                  : getChildName(childrenFilter as number)}{" "}
                <CaretDown className="ml-2" />
              </>
            }
            buttonProps={{
              isRounded: false,
              variant: "outlined",
              className:
                "!rounded-lg !border !border-[#D0D5DD] !text-[#022F2F] !bg-transparent text-sm !font-normal !text-nowrap !min-w-fit !cursor-pointer",
            }}
          >
            {(closePopover) => (
              <Box paddingY={1} className="flex flex-col gap-y-2 2xl:gap-y-3 p-4!">
                <button
                  type="button"
                  className="text-sm! 2xl:text-base! p-1 flex flex-row gap-2 items-center cursor-pointer"
                  onClick={() => {
                    handleChildrenFilterChange("All Children");
                    closePopover();
                  }}
                >
                  All Children
                </button>
                {children.map((child) => (
                  <button
                    key={child.id}
                    type="button"
                    className="text-sm! 2xl:text-base! p-1 flex flex-row gap-2 items-center cursor-pointer"
                    onClick={() => {
                      handleChildrenFilterChange(child.id);
                      closePopover();
                    }}
                  >
                    {child.fullName}
                  </button>
                ))}
              </Box>
            )}
          </CWPopover>
          <button
            type="button"
            onClick={(e) => setPeriodAnchorEl(e.currentTarget)}
            className="!rounded-lg !border !border-[#D0D5DD] !text-[#022F2F] !bg-transparent text-sm flex items-center gap-2 px-3 py-2 !text-nowrap !min-w-fit !cursor-pointer "
          >
            {currentPeriod} <CaretDown className="ml-2" />
          </button>
        </Box>
      </Box>

      <Box className="md:hidden flex flex-col gap-3">
        <Box className="text-primary-text-dark">
          <Typography className="!text-lg !font-semibold">Welcome back, {userName}!</Typography>
          <Typography className="!text-sm !font-normal">
            Here&apos;s what&apos;s happening with your children today.
          </Typography>
        </Box>
        <Box className="flex items-center gap-2">
          <SearchTextfield
            role="parent"
            className="!w-full"
            fullWidth
            endAction={
              <button
                type="button"
                onClick={() => setMobileFilterOpen(true)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-[#022F2F] bg-transparent cursor-pointer"
                aria-label="Open filters"
              >
                <FilterIcon className="text-gray-500" />
              </button>
            }
          />
        </Box>
      </Box>

      <Box className="hidden md:block text-primary-text-dark">
        <Typography className="!text-lg !font-semibold">Welcome back, {userName}!</Typography>
        <Typography className="!text-sm !font-normal">
          Here&apos;s what&apos;s happening with your children today.
        </Typography>
      </Box>

      <Box className="flex flex-col xl:flex-row gap-4">
        <ClassAttendanceChart
          className="w-full"
          data={attendanceChartData}
          percentageGrowth={percentageGrowth}
          isLoading={isDashboardLoading}
        />
         
      </Box>

      <Box className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Box className="p-4 md:p-6 md:py-7 flex flex-col justify-between gap-6 md:gap-8 bg-white rounded-lg border border-brandColor-active/20 w-full">
          <Box className="flex gap-2.5 items-center">
            <Box className="bg-white rounded-lg flex items-center ">
              <KeyIcon />
            </Box>
            <Box className="flex flex-col">
              <Typography className="text-primary-dark text-base! !font-bold">Kiosk PIN</Typography>
              <Typography className="text-sm! !font-normal text-text-tertiary/70!">
                Use this PIN clock-in/out for your child.
              </Typography>
            </Box>
          </Box>

          <Box className="overflow-x-auto">{renderPinBoxes()}</Box>

          <Box className="flex flex-col gap-1.5 items-center justify-center">
            <Typography className="text-sm! text-center !font-light text-text-tertiary/70!">
              Use this PIN for Kiosk to clock-in/out for your child.
            </Typography>
            <Button
              startIcon={<ResetIcon />}
              className="mt-4 !px-6 !rounded-lg !bg-brandColor-active !text-white !font-semibold w-full !text-sm!"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new CustomEvent("openResetKioskPinModal"));
                }
              }}
            >
              Reset PIN
            </Button>
          </Box>
        </Box>
        <Box className="p-4 md:p-6 flex flex-col gap-4 bg-white rounded-lg border border-brandColor-active/20 w-full ">
          <Box className="flex flex-col">
            <Typography className="text-primary-dark !text-lg !font-bold">
              Scan Kiosk QR Code
            </Typography>
            <Typography className="text-sm! !font-normal text-text-tertiary/70!">
              Scan the QR Code to clock in/out.
            </Typography>
          </Box>

          <button
            type="button"
            onClick={() => setIsQrModalOpen(true)}
            disabled={!attendanceKioskQrValue}
            className="mx-auto cursor-pointer disabled:cursor-not-allowed"
          >
            {attendanceKioskQrValue ? (
              <Box
                data-parent-kiosk-qr="true"
                className="h-[180px] w-[180px] rounded-md border border-border-lightGray bg-white flex items-center justify-center p-2"
              >
                <QRCodeSVG value={attendanceKioskQrValue} size={180} />
              </Box>
            ) : (
              <Box className="h-[150px] w-[150px] rounded-md border border-dashed border-border-lightGray flex items-center justify-center text-xs text-text-tertiary/70">
                QR not available
              </Box>
            )}
          </button>

          <Typography className="text-center text-sm! !font-semibold text-primary-dark">
            Tap Me!
          </Typography>

          <Box className="rid grid-cols-2 gap-2  flex items-center justify-center">
            <Box className="relative">
              <Button
                variant="outlined"
                className="!rounded-lg !border !border-[#D0D5DD] !bg-white !text-[#022F2F] !text-sm !font-medium w-fit"
                onClick={() => void handleCopyKioskLink()}
                disabled={!attendanceKioskQrValue}
                startIcon={<CopyIcon />}
              >
                Copy
              </Button>
              {hasCopiedKioskLink && (
                <Box className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#022F2F] text-white text-[10px] px-2 py-1 rounded shadow-sm whitespace-nowrap">
                  Copied
                </Box>
              )}
            </Box>
            {/* <Button
              variant="outlined"
              className="!rounded-lg !border !border-[#D0D5DD] !bg-white !text-[#022F2F] !text-sm !font-medium"
              onClick={() => void handleShareKioskLink()}
              disabled={!attendanceKioskQrValue}
              startIcon={<ShareIcon />}
            >
              Share
            </Button> */}
          </Box>
        </Box>
        {/* <Box className="p-4 md:p-6 bg-white rounded-lg border border-brandColor-active/20 flex flex-col gap-4">
          <Box className="flex flex-col">
            <Typography className="text-primary-dark !text-lg !font-bold">
              Report Attendance
            </Typography>
            <Typography className="text-sm! !font-normal text-text-tertiary/70!">
              Notify the school if your child will be late or absent today.
            </Typography>
          </Box>
          <button
            type="button"
            onClick={() => openReportModal("absence")}
            className="w-full rounded-xl border border-border-lightGray p-4 text-left hover:bg-[#FAFAFA] transition-colors flex gap-5 cursor-pointer"
          >
            <IconButton size="small" className="!p-2 !bg-badge-red/10 rounded-full">
              <FullAbsenseIcon />
            </IconButton>
            <Box className="flex flex-col justify-center">
              <Typography className="!text-base !font-semibold text-primary-dark">
                Full-day Absence
              </Typography>
              <Typography className="!text-sm text-text-tertiary/70">
                Child will be absent for today.
              </Typography>
            </Box>
          </button>
          <button
            type="button"
            onClick={() => openReportModal("late")}
            className="w-full rounded-xl border border-border-lightGray p-4 text-left hover:bg-[#FAFAFA] transition-colors flex gap-5 cursor-pointer"
          >
            <IconButton size="small" className="!p-2 !bg-barchart-yellow/10 rounded-full">
              <LateArrivalIcon />
            </IconButton>
            <Box className="flex flex-col justify-center">
              <Typography className="!text-base !font-semibold text-primary-dark">
                Late Arrival
              </Typography>
              <Typography className="!text-sm text-text-tertiary/70">
                Child will be arriving late.
              </Typography>
            </Box>
          </button>
        </Box> */}
      </Box>
      <Box className="bg-white rounded-lg p-3 md:p-4 flex flex-col gap-2 flex-1 border border-brandColor-active/20">
        <Typography className="!text-base p-2 pb-0 !font-bold">Recent Activities</Typography>

        <Box className="flex-1 h-full">
          <Box className="mt-2 sm:max-h-[560px] overflow-y-scroll [scrollbar-width:1px] [&::-webkit-scrollbar]:hidden p-2 flex flex-col gap-4 ">
            {isActivitiesLoading ? (
              <Typography className="text-sm! text-text-tertiary/70! px-4 py-6 text-center">
                Loading recent activities...
              </Typography>
            ) : recentActivities.length === 0 ? (
              <Typography className="text-sm! text-text-tertiary/70! px-4 py-6 text-center">
                No activities logged yet.
              </Typography>
            ) : (
              recentActivities.map((activity) => (
                <Box
                  key={activity.id}
                  className="px-4 md:px-6 gap-3 py-4 flex flex-col sm:flex-row rounded-md bg-[#F8F9FA]!"
                >
                  <Box className="bg-white p-3 rounded-lg flex items-center justify-center">
                    {renderActivityIcon(activity.activityType)}
                  </Box>
                  <Box className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-2">
                    <Box className="flex flex-col gap-2 sm:pr-4">
                      <Typography className="text-primary-dark text-base! !font-medium">
                        {getActivityTitle(activity)}
                      </Typography>
                      <Typography className="text-sm! text-text-tertiary/70!">
                        {getActivityDescription(activity)}
                      </Typography>
                    </Box>
                    <Box className="flex flex-row items-center  gap-x-2 text-sm! font-medium! text-text-tertiary/70! whitespace-nowrap">
                      <ClockIcon />
                      <span>{getActivityDateAndTime(activity)}</span>
                    </Box>
                  </Box>
                </Box>
              ))
            )}
          </Box>
        </Box>
      </Box>

      <TimeRangeFilterPopover
        open={Boolean(periodAnchorEl)}
        anchorEl={periodAnchorEl}
        onClose={() => setPeriodAnchorEl(null)}
        options={periodOptions}
        onSelect={(value) => {
          handlePeriodChange(value);
          setPeriodAnchorEl(null);
        }}
        onCustomApply={(s, e) => {
          handleCustomDateApply(s, e);
          setPeriodAnchorEl(null);
        }}
        currentStartDate={startDate}
        currentEndDate={endDate}
        customButtonLabel="OK"
        width={120}
        forceOpenCustomModal={mobileCustomPeriodOpen}
        onForceOpenCustomModalHandled={() => setMobileCustomPeriodOpen(false)}
      />

      <MobileFilterDrawer
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        onApply={() => setMobileFilterOpen(false)}
        onReset={() => {
          handleChildrenFilterChange("All Children");
          handlePeriodChange("This week");
          setMobileFilterOpen(false);
        }}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Typography className="!text-sm !font-medium !text-[#02273A]">Child</Typography>
            <Dropdown
              isForm
              options={[
                { value: "all", name: "All Children" },
                ...children.map((child) => ({ value: String(child.id), name: child.fullName })),
              ]}
              value={childrenFilter === "All Children" ? "all" : String(childrenFilter)}
              onSelect={(value) =>
                handleChildrenFilterChange(value === "all" ? "All Children" : Number(value))
              }
              textFieldProps={{ placeholder: "Filter by child", isRounded: true }}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Typography className="!text-sm !font-medium !text-[#02273A]">Period</Typography>
            <Dropdown
              isForm
              options={PERIOD_OPTIONS.map((o) => ({
                value: (o as { name: string }).name,
                name: (o as { name: string }).name,
              }))}
              value={currentPeriod}
              onSelect={(value) => {
                const selectedValue = value as string;
                if (selectedValue === "Custom") {
                  setMobileFilterOpen(false);
                  setMobileCustomPeriodOpen(true);
                  return;
                }
                handlePeriodChange(selectedValue);
              }}
              textFieldProps={{ placeholder: "Date range", isRounded: true }}
            />
          </div>
        </div>
      </MobileFilterDrawer>

      <Modal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        className="md:w-[600px] w-[90vw] !p-6 !rounded-md"
      >
        <Box className="flex flex-col gap-6">
          <Box className="flex items-center justify-between">
            <Typography className="!text-2xl !font-bold text-primary-dark">
              Scan Kiosk QR Code
            </Typography>
            <button
              type="button"
              onClick={() => setIsQrModalOpen(false)}
              aria-label="Close QR modal"
            >
              <CloseIcon />
            </button>
          </Box>
          <Box className="mt-6 flex justify-center">
            {attendanceKioskQrValue ? (
              <Box className="w-full max-w-[440px] aspect-square rounded-md border border-border-lightGray bg-white flex items-center justify-center p-4">
                <Box data-parent-kiosk-qr="true" className="flex items-center justify-center">
                <QRCodeSVG value={attendanceKioskQrValue} size={380} />
                </Box>
              </Box>
            ) : (
              <Typography className="text-sm! text-text-tertiary/70">
                QR code is not available.
              </Typography>
            )}
          </Box>
        </Box>
      </Modal>

      <Modal
        isOpen={isReportModalOpen}
        onClose={closeReportModal}
        className="md:w-[600px] w-[90vw] !p-6 !rounded-md"
      >
        <Box className="flex flex-col gap-4">
          <Box className="flex items-center justify-between">
            <Typography className="!text-lg !font-bold text-primary-dark">
              {reportType === "absence" ? "Report Absence" : "Report Late Arrival"}
            </Typography>
            <button type="button" onClick={closeReportModal} aria-label="Close report modal">
              <CloseIcon />
            </button>
          </Box>
          <Box className=" flex flex-col gap-5">
            <Box className="flex flex-col gap-2">
              <Typography className="!text-sm !font-medium !text-input-gray">Child</Typography>
              <Controller
                name="reportChildId"
                control={form.control}
                render={({ field: { value, onChange }, fieldState: { error } }) => (
                  <Box>
                    <Dropdown
                      isForm
                      options={reportChildrenOptions}
                      value={value}
                      onSelect={(selectedValue) => onChange(String(selectedValue))}
                      textFieldProps={{ placeholder: "Select child", isRounded: true }}
                    />
                    {error?.message ? (
                      <Typography className="!text-xs !text-red-600 !mt-1">
                        {error.message}
                      </Typography>
                    ) : null}
                  </Box>
                )}
              />
            </Box>
            <Box className="flex flex-col gap-2">
              <Controller
                name="reportDate"
                control={form.control}
                render={({ field: { value, onChange }, fieldState: { error } }) => (
                  <DatePicker
                    label="Date"
                    labelOnTop
                    labelClassName="!text-sm !font-medium !text-input-gray !mb-1"
                    fullWidth
                    value={value}
                    onChange={onChange}
                    errorText={error?.message}
                    // isRounded={isMobile}
                  />
                )}
              />
            </Box>
            <Box className="flex flex-col gap-2">
              <CWTextArea
                control={form.control}
                name="reportReason"
                label="Reason"
                placeholder="Add reason..."
                rows={6}
                labelOnTop
                labelClassName="!text-sm !font-medium !text-input-gray"
                inputClasses="mt-1 !text-xs !px-3.5 !pt-3 !pb-4 !text-input-gray"
                className="w-full"
              />
            </Box>
            <Box className="flex items-center justify-end gap-3">
              <Button
                variant="outlined"
                className="!rounded-lg !border !border-[#D0D5DD] !bg-white !text-[#022F2F] !font-medium !px-8"
                onClick={closeReportModal}
              >
                Cancel
              </Button>
              <Button
                className="!rounded-lg !font-medium !px-8"
                onClick={handleSubmitReport}
                disabled={
                  isReportSubmitting || form.formState.isSubmitting || !form.formState.isValid
                }
              >
                {isReportSubmitting ? "Submitting..." : "Submit"}
              </Button>
            </Box>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};
