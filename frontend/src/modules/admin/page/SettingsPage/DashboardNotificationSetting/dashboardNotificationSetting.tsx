/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  Box,
  styled,
  Switch,
  Typography,
  Radio,
  RadioGroup,
  CircularProgress,
} from "@mui/material";
import React, { useState, useEffect } from "react";
import { Button } from "@/modules/shared/component/Button/WPButton";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { useQueryService } from "@/utils/hooks/useQueryService";
import {
  schoolDynamicEndpoints,
  type UpdateNotificationSettingsRequest,
  type GetNotificationSettingsResponse,
} from "@/services/school.service";

// Styled toggle switch
const AntSwitch = styled(Switch)(() => ({
  width: 32,
  height: 18,
  padding: 0,
  display: "flex",
  "& .MuiSwitch-switchBase": {
    padding: 2,
    "&.Mui-checked": {
      transform: "translateX(14px)",
      color: "#fff",
      "& + .MuiSwitch-track": { opacity: 1, backgroundColor: "#007C79", border: 0 },
    },
  },
  "& .MuiSwitch-thumb": { width: 14, height: 14, boxShadow: "none" },
  "& .MuiSwitch-track": {
    borderRadius: 9,
    opacity: 1,
    backgroundColor: "#E9E9EA",
    boxSizing: "border-box",
  },
}));

const NotificationRow = ({
  title,
  description,
  checked,
  onChange,
  disabled = false,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) => (
  <Box className="flex flex-row items-start justify-between gap-3 py-5 border-b border-solid border-border-lightGray last:border-b-0">
    <Box className="flex min-w-0 flex-col gap-1 pr-2">
      <Typography className="font-medium! text-sm! text-[#02273A]!">{title}</Typography>
      <Typography className="text-xs! text-text-tertiary/70!">{description}</Typography>
    </Box>
    <AntSwitch checked={checked} onChange={(e) => onChange(e.target.checked)} disabled={disabled} />
  </Box>
);

export const DashboardNotificationSetting = () => {
  // ---- Fetch school to get schoolId ----
  const { data: schoolData, isLoading: isLoadingSchool } = useQueryService<any, any>({
    service: schoolDynamicEndpoints.getParticularSchool(),
    options: {},
  });

  const schoolId = schoolData?.school?.id;

  // ---- Fetch notification settings ----
  const { data: settingsData, isLoading: isLoadingSettings } = useQueryService<
    any,
    GetNotificationSettingsResponse
  >({
    service: schoolDynamicEndpoints.getNotificationSettings(schoolId ?? 0),
    options: { enabled: !!schoolId },
  });

  // ---- Local form state ----
  const [adminEmail, setAdminEmail] = useState(false);
  const [adminSms, setAdminSms] = useState(false);
  const [adminWhatsApp, setAdminWhatsApp] = useState(false);
  const [parentEmail, setParentEmail] = useState(false);
  const [parentSms, setParentSms] = useState(false);
  const [parentWhatsApp, setParentWhatsApp] = useState(false);
  const [staffEmail, setStaffEmail] = useState(false);
  const [staffSms, setStaffSms] = useState(false);
  const [staffWhatsApp, setStaffWhatsApp] = useState(false);
  const [reportFrequency, setReportFrequency] = useState<"daily" | "weekly" | "monthly">("daily");

  // ---- Populate from API ----
  useEffect(() => {
    if (!settingsData?.settings) return;
    const s = settingsData.settings;
    setAdminEmail(s.adminEmail ?? false);
    setAdminSms(s.adminSms ?? false);
    setAdminWhatsApp(s.adminWhatsApp ?? false);
    setParentEmail(s.parentEmail ?? false);
    setParentSms(s.parentSms ?? false);
    setParentWhatsApp(s.parentWhatsApp ?? false);
    setStaffEmail(s.staffEmail ?? false);
    setStaffSms(s.staffSms ?? false);
    setStaffWhatsApp(s.staffWhatsApp ?? false);
    setReportFrequency(s.dailyReportFrequency ?? "daily");
  }, [settingsData]);

  // ---- Update mutation ----
  const { mutateAsync: updateSettings, isPending: isSaving } = useMutationService<
    UpdateNotificationSettingsRequest,
    any
  >({
    service: schoolDynamicEndpoints.updateNotificationSettings(schoolId ?? 0),
    options: {
      successMessage: "Notification settings updated successfully",
      errorTitle: "Failed to update notification settings",
    },
  });

  const handleSave = async () => {
    await updateSettings({
      adminEmail,
      adminSms: false,
      adminWhatsApp,
      parentEmail,
      parentSms: false,
      parentWhatsApp,
      staffEmail,
      staffSms: false,
      staffWhatsApp,
      dailyReportFrequency: reportFrequency,
    });
  };

  const isLoading = isLoadingSchool || isLoadingSettings;

  if (isLoading) {
    return (
      <Box className="flex items-center justify-center py-12">
        <CircularProgress size={32} sx={{ color: "#007C79" }} />
      </Box>
    );
  }

  return (
    <Box className="rounded-lg bg-white flex flex-col gap-5 p-4 sm:p-5">
      <Box className="flex flex-col gap-1 border-b border-solid border-border-lightGray pb-4">
        <Typography className="font-bold! text-black!">Notification Channels</Typography>
        <Typography className="text-[13px]! text-[#001F1FB2]!">
          Configure how each user receives notifications from your school.
        </Typography>
      </Box>

      <Box className="flex flex-col gap-6 md:border-b border-solid border-border-lightGray pb-8">
        {/* Admin Section */}
        <Box className="bg-white rounded-xl border border-solid border-border-lightGray p-4 pb-0 sm:p-6 sm:pb-0">
          <Box className="mb-2 border-b border-solid border-border-lightGray pb-4 flex flex-col gap-1">
            <Typography className="font-semibold! text-sm! text-[#022F2F]!">
              Admin Notifications
            </Typography>
            <Typography className="text-[13px]! text-[#001F1FB2]!">
              Choose how you want to receive notifications.
            </Typography>
          </Box>
          <Box className="flex flex-col">
            <NotificationRow
              title="Email"
              description="Receive notifications via your registered email address."
              checked={adminEmail}
              onChange={setAdminEmail}
            />
            <NotificationRow
              title="SMS"
              description="Get critical alerts via text message."
              checked={adminSms}
              onChange={setAdminSms}
              disabled
            />
            <NotificationRow
              title="WhatsApp"
              description="Instant messages through WhatsApp Business."
              checked={adminWhatsApp}
              onChange={setAdminWhatsApp}
            />
          </Box>
        </Box>

        {/* Parent Section */}
        <Box className="bg-white rounded-xl border border-solid border-border-lightGray p-4 pb-0 sm:p-6 sm:pb-0">
          <Box className="mb-2 border-b border-solid border-border-lightGray pb-4 flex flex-col gap-1">
            <Typography className="font-semibold! text-sm! text-[#022F2F]!">
              Parent Notifications
            </Typography>
            <Typography className="text-[13px]! text-[#001F1FB2]!">
              Choose how parents receive notifications from your school.
            </Typography>
          </Box>
          <Box className="flex flex-col">
            <NotificationRow
              title="Email"
              description="Receive notifications via your registered email address."
              checked={parentEmail}
              onChange={setParentEmail}
            />
            <NotificationRow
              title="SMS"
              description="Get critical alerts via text message."
              checked={parentSms}
              onChange={setParentSms}
              disabled
            />
            <NotificationRow
              title="WhatsApp"
              description="Instant messages through WhatsApp Business."
              checked={parentWhatsApp}
              onChange={setParentWhatsApp}
            />

            {/* Daily Reports Frequency */}
            <Box className="mt-6 pb-6">
              <Box className="mb-6 flex flex-col gap-1">
                <Typography className="font-semibold! text-sm! text-black!">
                  Daily Reports Frequency
                </Typography>
                <Typography className="text-xs! text-[#001F1FB2]!">
                  Choose how often daily reports are sent to parents.
                </Typography>
              </Box>

              <RadioGroup
                value={reportFrequency}
                onChange={(e) =>
                  setReportFrequency(e.target.value as "daily" | "weekly" | "monthly")
                }
                className="flex flex-col gap-5 sm:gap-8"
              >
                {[
                  { value: "daily", label: "Daily", sub: "Send reports to parents every day." },
                  {
                    value: "weekly",
                    label: "Weekly",
                    sub: "Send a weekly summary report to parents.",
                  },
                  {
                    value: "monthly",
                    label: "Monthly",
                    sub: "Send a monthly summary report to parents.",
                  },
                ].map((option) => (
                  <Box key={option.value} className="flex flex-row items-start gap-3">
                    <Radio
                      value={option.value}
                      sx={{
                        color: "#E9E9EA",
                        padding: 0,
                        "&.Mui-checked": { color: "#008080" },
                      }}
                    />
                    <Box className="flex flex-col gap-1">
                      <Typography className="text-[13px]! font-medium! text-black!">
                        {option.label}
                      </Typography>
                      <Typography className="text-xs! text-text-tertiary/70!">
                        {option.sub}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </RadioGroup>
            </Box>
          </Box>
        </Box>

        {/* Staff Section */}
        <Box className="bg-white rounded-xl border border-solid border-border-lightGray p-4 pb-0 sm:p-6 sm:pb-0">
          <Box className="mb-2 border-b border-solid border-border-lightGray pb-4 flex flex-col gap-1">
            <Typography className="font-semibold! text-sm! text-[#022F2F]!">
              Staff Notifications
            </Typography>
            <Typography className="text-[13px]! text-[#001F1FB2]!">
              Choose how staffs receive notifications from the school.
            </Typography>
          </Box>
          <Box className="flex flex-col">
            <NotificationRow
              title="Email"
              description="Receive notifications via your registered email address."
              checked={staffEmail}
              onChange={setStaffEmail}
            />
            <NotificationRow
              title="SMS"
              description="Get critical alerts via text message."
              checked={staffSms}
              onChange={setStaffSms}
              disabled
            />
            <NotificationRow
              title="WhatsApp"
              description="Instant messages through WhatsApp Business."
              checked={staffWhatsApp}
              onChange={setStaffWhatsApp}
            />
          </Box>
        </Box>
      </Box>

      {/* Footer Actions */}
      <Box className="grid grid-cols-2 gap-3 mt-4 sm:flex sm:flex-row sm:justify-end">
        <Button
          variant="outlined"
          className="rounded-lg! bg-transparent border border-solid border-border-input! text-[#022F2F]/80! px-4 py-3 sm:px-6"
          onClick={() => {
            // Reset to fetched values
            if (settingsData?.settings) {
              const s = settingsData.settings;
              setAdminEmail(s.adminEmail ?? false);
              setAdminSms(s.adminSms ?? false);
              setAdminWhatsApp(s.adminWhatsApp ?? false);
              setParentEmail(s.parentEmail ?? false);
              setParentSms(s.parentSms ?? false);
              setParentWhatsApp(s.parentWhatsApp ?? false);
              setStaffEmail(s.staffEmail ?? false);
              setStaffSms(s.staffSms ?? false);
              setStaffWhatsApp(s.staffWhatsApp ?? false);
              setReportFrequency(s.dailyReportFrequency ?? "daily");
            }
          }}
        >
          Cancel
        </Button>
        <Button className="rounded-lg! px-4 py-3 sm:px-6" onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </Box>
    </Box>
  );
};
