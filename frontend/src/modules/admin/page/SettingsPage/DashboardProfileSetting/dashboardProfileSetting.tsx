"use client";

import { Button } from "@/modules/shared/component/Button";

import { Box, Typography } from "@mui/material";
import React from "react";
import { Controller } from "react-hook-form";
import { CWTextField } from "@/modules/shared/component/FormFields/CWTextField";
import useDashboardSettings from "../hooks/useDashboardSettings";
import { CWTextArea } from "@/modules/shared/component/FormFields/CWTextArea";
import { CWDropdown } from "@/modules/shared/component/FormFields/CWDropdown";
import ImageUpload from "@/modules/shared/component/ImageUpload/imageUpload";
import { DataRenderer } from "@/modules/shared/component/DataRenderer";
import { getSchoolPortalBaseDomain, getSchoolPortalOrigin } from "@/utils/helper";
import { schoolTypeOptions } from "../school.constant";
import { ColorPicker } from "@/modules/shared/component/ColorPicker";
import ConfirmModal from "@/components/ConfirmModal/confirmModal";
import { Modal } from "@/modules/shared/component/modal";
import DeleteIcon from "@/modules/shared/assets/svgs/trashicon.svg";
import CopyIcon from "@/modules/shared/assets/svgs/copy.svg";
import ArrowUpRightIcon from "@/modules/shared/assets/svgs/share-icon.svg";
import { TextField } from "@/modules/shared/component/TextField";
import { QRCodeSVG } from "qrcode.react";
import { Printer } from "lucide-react";

export const DashboardProfileSetting = () => {
  const schoolPortalDomain = getSchoolPortalBaseDomain();
  const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] = React.useState(false);
  const [isQrPreviewOpen, setIsQrPreviewOpen] = React.useState(false);
  const [hasCopiedKioskLink, setHasCopiedKioskLink] = React.useState(false);
  const kioskLinkCopyTimeoutRef = React.useRef<number | null>(null);
  const kioskQrCodeRef = React.useRef<HTMLDivElement | null>(null);
  const {
    control,
    onHandleSubmit,
    handleSubmit,
    isUpdatingSchool,
    countryOptions,
    isLoading,
    timezoneOptions,
    handleDeleteAccount,
    isDeletingSchool,
    schoolData,
  } = useDashboardSettings();

  const attendanceKioskLink =
    schoolData?.school?.subDomain
      ? `${getSchoolPortalOrigin(schoolData.school.subDomain)}/parent/children?openAttendanceModal=1`
      : "";
  const defaultAttendanceKioskLink =schoolData?.school?.subDomain
  ?  `${getSchoolPortalOrigin(schoolData?.school?.subDomain || "")}/kiosk/check-in`
  : "";
  const attendanceKioskQrValue = attendanceKioskLink;
  const schoolName = schoolData?.school?.schoolName || "School";
  const schoolLogoUrl =
    schoolData?.school?.schoolLogoUrl || schoolData?.school?.logoUrl || schoolData?.school?.logo || "";

  const handleCopyText = async (value: string): Promise<boolean> => {
    if (!value || typeof window === "undefined") return false;
    const clipboardValue = `${value}`;
    try {
      await navigator.clipboard.writeText(clipboardValue);
      return true;
    } catch {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = clipboardValue;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        return true;
      } catch {
        return false;
      }
    }
  };

  const handlePreview = (value: string) => {
    if (!value || typeof window === "undefined") return;
    window.open(value, "_blank", "noopener,noreferrer");
  };

  const handlePrintKioskQrCode = () => {
    if (typeof window === "undefined") return;
    if (!attendanceKioskQrValue) return;

    const qrSvgMarkup = kioskQrCodeRef.current?.querySelector("svg")?.outerHTML;
    if (!qrSvgMarkup) return;

    const printWindow = window.open("", "_blank", "width=720,height=900");
    if (!printWindow) return;

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>Kiosk QR Code</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 32px; color: #022f2f; }
            .container { display: flex; flex-direction: column; align-items: center; gap: 16px; }
            .logo-wrap { width: 88px; height: 88px; border: 1px solid #d0d5dd; border-radius: 12px; display: flex; align-items: center; justify-content: center; overflow: hidden; background: #fff; }
            .logo { width: 100%; height: 100%; object-fit: contain; }
            .title { font-size: 24px; font-weight: 700; text-align: center; line-height: 1.2; }
            .title-sub { font-size: 14px; color: #475467; font-weight: 500; }
            .subtitle { font-size: 14px; color: #475467; text-align: center; }
            .qr { padding: 16px; border: 1px solid #d0d5dd; border-radius: 12px; }
            .qr svg { width: 280px; height: 280px; }
          </style>
        </head>
        <body>
          <div class="container">
            ${schoolLogoUrl
        ? `<div class="logo-wrap"><img src="${schoolLogoUrl}" alt="${schoolName} logo" class="logo" /></div>`
        : ""
      }
            <div class="title">${schoolName}<br /><span class="title-sub">Attendance QR Code</span></div>
            <div class="subtitle">Parents can scan this QR code to take attendance for their children.</div>
            <div class="qr">${qrSvgMarkup}</div>
          </div>
          <script>
            window.onload = function () {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  React.useEffect(() => {
    return () => {
      if (kioskLinkCopyTimeoutRef.current) {
        window.clearTimeout(kioskLinkCopyTimeoutRef.current);
      }
    };
  }, []);

  return (
    <DataRenderer isLoading={isLoading}>
      {() => (
        <Box className="flex flex-col gap-4 py-4 sm:gap-5">
          <Box className="rounded-lg bg-white flex flex-col gap-4 p-4 sm:gap-5">
            <Box className="flex flex-col gap-1">
              <Typography className="font-bold! text-black!">Basic Information</Typography>
              <Typography className="text-xs! text-text-tertiary/70!">
                Update your school&apos;s public profile and details
              </Typography>
            </Box>
            <Box className="border-y border-solid border-border-lightGray flex flex-col gap-5 py-4">
              <Box className="flex flex-col gap-4 border-border-lightGray pb-4 md:flex-row md:items-start md:justify-between">
                <Box className="flex-1 flex flex-col gap-1">
                  <Typography className="text-sm! font-medium!">School Logo</Typography>
                  <ImageUpload name="schoolLogoUrl" control={control} label="Profile Photo" />
                </Box>
                <Box className="flex flex-col items-center">
                  <Box className="flex items-center gap-2">
                    <label className="text-sm! font-medium! text-input-gray!">Attendance QR Code</label>
                    <button
                      type="button"
                      aria-label="Print kiosk qr code"
                      onClick={handlePrintKioskQrCode}
                      disabled={!attendanceKioskQrValue}
                      className="h-8 w-8 rounded-md flex items-center justify-center"
                    >
                      <Printer size={16} />
                    </button>
                  </Box>
                  <Box className="mt-1 flex items-start gap-2">
                    <button
                      type="button"
                      onClick={() => setIsQrPreviewOpen(true)}
                      disabled={!attendanceKioskQrValue}
                      className="cursor-pointer disabled:cursor-not-allowed"
                    >
                      <Box
                        ref={kioskQrCodeRef}
                        className="h-[128px] w-[128px] rounded-md border border-border-lightGray bg-white flex items-center justify-center p-2"
                      >
                        {attendanceKioskQrValue ? (
                          <QRCodeSVG value={attendanceKioskQrValue} size={108} />
                        ) : (
                          <Typography className="text-[10px]! text-text-tertiary/70! text-center!">
                            QR not available
                          </Typography>
                        )}
                      </Box>
                    </button>
                  </Box>
                </Box>
              </Box>
              <Box className="flex flex-col gap-4 md:flex-row md:gap-3">
                <CWTextField
                  control={control}
                  requiredAsterisk
                  name="schoolName"
                  label="School Name"
                  placeholder="Enter school name"
                  labelOnTop
                  labelClassName="!text-sm !font-medium !text-input-gray"
                  inputClasses="mt-1 !text-xs !h-10 !text-input-gray placeholder:!text-input-gray"
                  className="flex-1"
                />
                <CWTextField
                  control={control}
                  requiredAsterisk
                  name="schoolMotto"
                  label="School Motto"
                  placeholder="Enter school motto"
                  labelOnTop
                  labelClassName="!text-sm !font-medium !text-input-gray"
                  inputClasses="mt-1 !text-xs !h-10 !text-input-gray placeholder:!text-input-gray"
                  className="flex-1"
                />
              </Box>
              <div>
                <label className="text-sm! font-medium! text-input-gray!">Subdomain</label>
                <Controller
                  name="subDomain"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <>
                      <div
                        className={`mt-1 flex w-full flex-col overflow-hidden rounded-md border md:flex-row md:items-stretch ${error ? "border-red-500" : "border-gray-300"
                          }`}
                      >
                        <div className="flex min-h-10 min-w-0 flex-row items-stretch md:flex-1">
                          <span className="flex shrink-0 items-center border-r border-gray-300 bg-white px-3 text-xs text-[#414141] select-none">
                            https://
                          </span>
                          <input
                            {...field}
                            type="text"
                            placeholder="your-school"
                            className="min-h-10 min-w-0 flex-1 border-0 bg-white px-3 py-2 text-xs text-input-gray outline-none focus:ring-0"
                            onChange={(e) => {
                              const cleaned = e.target.value
                                .toLowerCase()
                                .replace(/\s+/g, "-")
                                .replace(/[^a-z0-9-]/g, "");
                              field.onChange(cleaned);
                            }}
                          />
                          <span className="hidden shrink-0 items-center border-l border-gray-300 bg-white px-3 text-xs text-[#414141] select-none md:flex md:whitespace-nowrap">
                            .{schoolPortalDomain}
                          </span>
                        </div>
                        <span className="border-t border-gray-300 bg-white px-3 py-2 text-xs text-[#414141] select-none break-all md:hidden">
                          .{schoolPortalDomain}
                        </span>
                      </div>
                      {error && <p className="text-red-500 text-xs mt-1 ml-3">{error.message}</p>}
                    </>
                  )}
                />
              </div>
              <Controller
                control={control}
                name="brandColor"
                render={({ field }) => (
                  <ColorPicker
                    labelOnTop
                    labelClassName="!text-sm !font-medium !text-input-gray"
                    label="School Color"
                    name="brandColor"
                    inputClasses="mt-1 !text-xs !h-10 !text-input-gray placeholder:!text-input-gray"
                    className="flex-1"
                    value={field.value}
                    onInput={(e) => field.onChange(e.target.value)}
                  />
                )}
              />
              {/* <div>
              <label className="text-sm! font-medium! text-input-gray!">
                Custom Domain<span className="text-red-500 ml-0.5">*</span>
              </label>
              <Controller
                name="subDomain"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <>
                    <div
                      className={`flex items-center border rounded-md mt-1 h-10 w-full ${
                        error ? "border-red-500" : "border-gray-300"
                      }`}
                    >
                      <span className="pl-3 text-xs text-[#414141] bg-white h-full flex items-center rounded-l-md whitespace-nowrap select-none">
                        https://
                      </span>
                      <input
                        {...field}
                        type="text"
                        placeholder="your-school"
                        style={{
                          width: `${Math.max((field.value || "").length, 11)}ch`,
                          maxWidth: "100%",
                        }}
                        className="min-w-[40px] border-none outline-none focus:ring-0 text-xs text-input-gray h-full px-1 transition-all duration-200"
                        onChange={(e) => {
                          const cleaned = e.target.value
                            .toLowerCase()
                            .replace(/\s+/g, "-")
                            .replace(/[^a-z0-9-]/g, "");
                          field.onChange(cleaned);
                        }}
                      />
                      <span className="pr-3 text-xs text-[#414141] bg-white h-full flex items-center rounded-r-md whitespace-nowrap select-none">
                        .whitepenguin.heimdallprodev.com
                      </span>
                    </div>
                    {error && <p className="text-red-500 text-xs mt-1 ml-3">{error.message}</p>}
                  </>
                )}
              />
            </div> */}
              <Box className="flex flex-col gap-4 md:flex-row md:gap-3">
                <CWTextField
                  control={control}
                  requiredAsterisk
                  name="address"
                  label="Address"
                  placeholder="Enter school address"
                  labelOnTop
                  labelClassName="!text-sm !font-medium !text-input-gray"
                  inputClasses="mt-1 !text-xs !h-10 !text-input-gray placeholder:!text-input-gray"
                  className="flex-1"
                />
                <CWDropdown
                  name="country"
                  control={control}
                  options={countryOptions}
                  hasSearch
                  isForm
                  textFieldProps={{
                    label: "Country",
                    labelClassName: "!text-sm !font-medium !text-input-gray",
                    placeholder: "Select country",
                    inputClasses: "mt-1 !text-xs !h-10 !text-input-gray",
                    labelOnTop: true,
                    className: "!w-full",
                  }}
                  dialogBodyClassName="!p-0"
                  maxDialogWidth={120}
                />
              </Box>
              <Box className="flex flex-col gap-4 md:flex-row md:gap-3">
                <CWDropdown
                  name="timezone"
                  control={control}
                  options={timezoneOptions}
                  hasSearch
                  isForm
                  textFieldProps={{
                    label: "Timezone",
                    placeholder: "Select timezone",
                    labelOnTop: true,
                    labelClassName: "!text-sm !font-medium !text-input-gray",
                    inputClasses: "mt-1 !text-xs !h-10 !text-input-gray",
                    className: "!w-full",
                  }}
                />
                <CWDropdown
                  name="schoolType"
                  control={control}
                  options={schoolTypeOptions}
                  isForm
                  textFieldProps={{
                    label: "School Type",
                    placeholder: "Select school type",
                    labelOnTop: true,
                    labelClassName: "!text-sm !font-medium !text-input-gray",
                    inputClasses: "mt-1 !text-xs !h-10 !text-input-gray",
                    className: "!w-full",
                  }}
                />
              </Box>
              <Box className="">
                <CWTextArea
                  control={control}
                  name="description"
                  label="Description"
                  placeholder="Enter brief description..."
                  labelOnTop
                  labelClassName="!text-sm !font-medium !text-input-gray"
                  inputClasses="mt-1 !text-xs !px-3.5 !py-3 !text-input-gray placeholder:!text-input-gra"
                  className="w-full"
                />
              </Box>
            </Box>
            <Box className="flex flex-col gap-4">
              <Box className="flex flex-col gap-1 border-b border-solid border-border-lightGray pb-4">
                <Typography className="font-bold! text-[#022F2F]! ">Daily Schedule</Typography>
                <Typography className="text-xs! text-text-tertiary/70!">
                  School and staff opening and closing times
                </Typography>
              </Box>
              <Box className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-3">
                <CWTextField
                  control={control}
                  name="studentResumptionTime"
                  type="time"
                  label="Children Resumption Time"
                  labelOnTop
                  placeholder="--:-- --"
                  labelClassName="!text-sm !font-medium !text-input-gray"
                  inputClasses="mt-1 !text-xs !h-10 !text-input-gray placeholder:!text-input-gray"
                  className="flex-1 min-w-[140px]"
                />
                <CWTextField
                  control={control}
                  name="schoolClosingTime"
                  type="time"
                  label="Children Closing Time"
                  labelOnTop
                  placeholder="--:-- --"
                  labelClassName="!text-sm !font-medium !text-input-gray"
                  inputClasses="mt-1 !text-xs !h-10 !text-input-gray placeholder:!text-input-gray"
                  className="flex-1 min-w-[140px]"
                />

                <CWTextField
                  control={control}
                  name="staffResumptionTime"
                  type="time"
                  label="Teacher Resumption Time"
                  labelOnTop
                  placeholder="--:-- --"
                  labelClassName="!text-sm !font-medium !text-input-gray"
                  inputClasses="mt-1 !text-xs !h-10 !text-input-gray placeholder:!text-input-gray"
                  className="flex-1 min-w-[140px]"
                />
                <CWTextField
                  control={control}
                  name="staffClosingTime"
                  type="time"
                  label="Teacher Closing Time"
                  labelOnTop
                  placeholder="--:-- --"
                  labelClassName="!text-sm !font-medium !text-input-gray"
                  inputClasses="mt-1 !text-xs !h-10 !text-input-gray placeholder:!text-input-gray"
                  className="flex-1 min-w-[140px]"
                />
              </Box>
              <Box className="flex flex-col gap-1 border-b border-solid border-border-lightGray pb-4 pt-2">
                <Typography className="font-bold! text-[#022F2F]! ">Contact Details</Typography>
                <Typography className="text-xs! text-text-tertiary/70!">
                  How parents and prospects can get in touch
                </Typography>
              </Box>
              <Box className="flex flex-col gap-4 md:flex-row md:gap-3">
                <CWTextField
                  control={control}
                  requiredAsterisk
                  name="phoneNumber"
                  label="Phone number"
                  placeholder="Enter phone number"
                  labelOnTop
                  labelClassName="!text-sm !font-medium !text-input-gray"
                  inputClasses="mt-1 !text-xs !h-10 !text-input-gray placeholder:!text-input-gray"
                  className="flex-1"
                />
                <CWTextField
                  control={control}
                  requiredAsterisk
                  name="email"
                  label="Email Address"
                  placeholder="Enter email address"
                  labelOnTop
                  labelClassName="!text-sm !font-medium !text-input-gray"
                  inputClasses="mt-1 !text-xs !h-10 !text-input-gray placeholder:!text-input-gray"
                  className="flex-1"
                />
              </Box>
              <Box className="flex flex-col gap-4 md:flex-row md:gap-3">
                <CWTextField
                  control={control}
                  name="x"
                  label="X (Twitter)"
                  placeholder="Enter X handle"
                  labelOnTop
                  labelClassName="!text-sm !font-medium !text-input-gray"
                  inputClasses="mt-1 !text-xs !h-10 !text-input-gray placeholder:!text-input-gray"
                  className="flex-1"
                />
                <CWTextField
                  control={control}
                  name="instagram"
                  label="Instagram"
                  placeholder="Enter instagram handle"
                  labelOnTop
                  labelClassName="!text-sm !font-medium !text-input-gray"
                  inputClasses="mt-1 !text-xs !h-10 !text-input-gray placeholder:!text-input-gray"
                  className="flex-1"
                />
              </Box>
              <Box className="flex flex-col gap-4 md:flex-row md:gap-3">
                <CWTextField
                  control={control}
                  name="facebook"
                  label="Facebook"
                  placeholder="Enter facebook handle"
                  labelOnTop
                  labelClassName="!text-sm !font-medium !text-input-gray"
                  inputClasses="mt-1 !text-xs !h-10 !text-input-gray placeholder:!text-input-gray"
                  className="flex-1"
                />
                <CWTextField
                  control={control}
                  name="tiktok"
                  label="Tiktok"
                  placeholder="Enter tiktok handle"
                  labelOnTop
                  labelClassName="!text-sm !font-medium !text-input-gray"
                  inputClasses="mt-1 !text-xs !h-10 !text-input-gray placeholder:!text-input-gray"
                  className="flex-1"
                />
              </Box>
              <Box className="flex flex-col gap-1 border-b border-solid border-border-lightGray pb-4 pt-2">
                <Typography className="font-bold! text-[#022F2F]! ">
                  Attendance Kiosk Details
                </Typography>
                <Typography className="text-xs! text-text-tertiary/70!">
                  How parents and prospects can get in touch.
                </Typography>
              </Box>
              <Box className="flex flex-col gap-4 md:flex-row md:gap-3">
                <Box className="flex-1">
                  <label className="text-sm! font-medium! text-input-gray!">Kiosk Link</label>
                  <Box className="mt-1 flex items-center gap-2">
                    <TextField
                      value={defaultAttendanceKioskLink}
                      readOnly
                      placeholder="Kiosk link not available"
                      className="flex-1"
                      inputClasses="!h-10 !text-xs !text-input-gray"
                    />
                    <button
                      type="button"
                      aria-label="Preview kiosk link"
                      onClick={() => handlePreview(defaultAttendanceKioskLink)}
                      className="h-10 w-10 rounded-md flex items-center justify-center hover:bg-[#F9FAFB]"
                    >
                      <ArrowUpRightIcon />
                    </button>
                    <Box className="relative shrink-0">
                      <button
                        type="button"
                        aria-label="Copy kiosk link"
                        onClick={async () => {
                          const ok = await handleCopyText(defaultAttendanceKioskLink);
                          if (!ok) return;
                          setHasCopiedKioskLink(true);
                          if (kioskLinkCopyTimeoutRef.current) {
                            window.clearTimeout(kioskLinkCopyTimeoutRef.current);
                          }
                          kioskLinkCopyTimeoutRef.current = window.setTimeout(
                            () => setHasCopiedKioskLink(false),
                            1500,
                          );
                        }}
                        className="h-10 w-10 rounded-md flex items-center justify-center hover:bg-[#F9FAFB]"
                      >
                        <CopyIcon />
                      </button>
                      {hasCopiedKioskLink && (
                        <Box className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#022F2F] text-white text-[10px] px-2 py-1 rounded shadow-sm whitespace-nowrap z-10">
                          Copied
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
            <Box className="grid grid-cols-2 gap-3 sm:flex sm:flex-row sm:justify-end mt-4 md:mt-0">
              <Button
                variant="outlined"
                className="rounded-lg! bg-transparent border border-solid border-border-input! text-[#022F2F]/80! px-4 py-3 sm:px-6"
              >
                Cancel
              </Button>
              <Button
                className="rounded-lg! px-4 py-3 sm:px-6"
                onClick={handleSubmit(onHandleSubmit)}
                loading={isUpdatingSchool}
              >
                Save Changes
              </Button>
            </Box>
          </Box>

          <Box className="rounded-lg bg-white flex flex-col md:flex-row justify-between gap-4 p-4 sm:gap-5">
            <Box className="flex flex-col gap-1">
              <Typography className="font-bold! text-black!">Delete this account</Typography>
              <Typography className="text-xs! text-text-tertiary/70!">
                Once deleted, you would not be able to see this account again.
              </Typography>
            </Box>
            <Button
              className="rounded-lg! px-4 py-3 !bg-red-600 sm:px-6"
              onClick={() => setShowDeleteAccountConfirm(true)}
            >
              Delete Account
            </Button>
          </Box>
          <ConfirmModal
            open={showDeleteAccountConfirm}
            onClose={() => setShowDeleteAccountConfirm(false)}
            onConfirm={() => void handleDeleteAccount()}
            loading={isDeletingSchool}
            icon={<DeleteIcon />}
            title="Delete Account?"
            description="This action cannot be undone. Please confirm."
            confirmLabel="Delete"
            confirmLabelClassName="!bg-red-500 hover:!bg-red-700 !text-white"
          />
          <Modal
            isOpen={isQrPreviewOpen}
            onClose={() => setIsQrPreviewOpen(false)}
            className="md:w-[620px] w-[90vw] p-6! rounded-md!"
          >
            <Box className="flex flex-col items-center gap-4 text-center">
              {schoolLogoUrl && (
                <Box className="h-[88px] w-[88px] rounded-xl border border-border-lightGray bg-white overflow-hidden flex items-center justify-center">
                  <img src={schoolLogoUrl} alt={`${schoolName} logo`} className="h-full w-full object-contain" />
                </Box>
              )}
              <Typography className="text-2xl! font-bold! text-[#022F2F]!">
                {schoolName} <br /><small className="text-sm! text-text-tertiary/70!">Attendance QR Code</small>
              </Typography>
              <Typography className="text-sm! text-text-tertiary/70!">
                Parents can scan this QR code to take attendance for their children.
              </Typography>
              <Box className="rounded-xl border border-border-lightGray bg-white p-4 mb-4">
                <QRCodeSVG value={attendanceKioskQrValue} size={280} />
              </Box>
              <Button
                className=" rounded-lg! px-6 py-2.5"
                onClick={handlePrintKioskQrCode}
                disabled={!attendanceKioskQrValue}
                startIcon={<Printer size={16} />}
              >
                Print
              </Button>
            </Box>
          </Modal>
        </Box>
      )}
    </DataRenderer>
  );
};
