"use client";

import React from "react";
import { Box, Typography, Switch, styled } from "@mui/material";
import { Button } from "@/modules/shared/component/Button";
import ChatIcon from "@/modules/shared/assets/svgs/chatOutline.svg";
import ReminderIcon from "@/modules/shared/assets/svgs/bellOutline.svg";
import NairaIcon from "@/modules/shared/assets/svgs/nairaOutline.svg";
import ClockIcon from "@/modules/shared/assets/svgs/timeOutline.svg";
import CalendarIcon from "@/modules/shared/assets/svgs/calendarOutline.svg";
import useNotificationPreferences from "@/components/Sidebar/components/hooks/useNotificationPreferences";
import type { NotificationPreferences } from "@/components/Sidebar/components/hooks/useNotificationPreferences";

const AntSwitch = styled(Switch)(({ theme }) => ({
  width: 24,
  height: 12,
  padding: 0,
  display: "flex",
  "&:active": {
    "& .MuiSwitch-thumb": {
      width: 15,
    },
    "& .MuiSwitch-switchBase.Mui-checked": {
      transform: "translateX(12px)",
    },
  },
  "& .MuiSwitch-switchBase": {
    padding: 2,
    "&.Mui-checked": {
      transform: "translateX(12px)",
      color: "#fff",
      "& + .MuiSwitch-track": {
        opacity: 1,
        backgroundColor: "#008080",
      },
    },
  },
  "& .MuiSwitch-thumb": {
    boxShadow: "0 2px 4px 0 rgb(0 35 11 / 20%)",
    width: 8,
    height: 8,
    borderRadius: 6,
    transition: theme.transitions.create(["width"], {
      duration: 200,
    }),
  },
  "& .MuiSwitch-track": {
    borderRadius: 16 / 2,
    opacity: 1,
    backgroundColor: "#001F1F1A",
    boxSizing: "border-box",
    ...theme.applyStyles("dark", {
      backgroundColor: "rgba(255,255,255,.35)",
    }),
  },
}));

const notificationItems: {
  key: keyof NotificationPreferences;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    key: "attendanceAlerts",
    title: "Attendance Alerts",
    description: "Check-in/check-out notifications",
    icon: ClockIcon,
  },
  {
    key: "activityUpdates",
    title: "Activity Updates",
    description: "New activities and events",
    icon: CalendarIcon,
  },
  {
    key: "billingNotifications",
    title: "Billing Notifications",
    description: "Invoices and payment reminders",
    icon: NairaIcon,
  },
  {
    key: "messages",
    title: "Messages",
    description: "New messages from teachers",
    icon: ChatIcon,
  },
  {
    key: "reminders",
    title: "Reminders",
    description: "Upcoming events and deadlines",
    icon: ReminderIcon,
  },
];

/** In-page notification settings (parent app profile tab). */
export function NotificationPreferencesPanel() {
  const { preferences, updatePreference, savePreferences, isSaving } = useNotificationPreferences();

  return (
    <Box className="flex flex-col gap-4 w-full">
      <Box>
        <Typography className="!text-lg md:!text-xl !font-semibold !text-primary-dark">
          Notification Preferences
        </Typography>
        <Typography className="!text-sm !font-normal !text-text-tertiary/70 mt-1">
          Choose which notifications you&apos;d like to receive.
        </Typography>
      </Box>

      <Box className="flex flex-col gap-3 md:gap-4">
        {notificationItems.map((item) => (
          <Box
            key={item.key}
            className="flex items-center gap-4 px-4 py-3 bg-[#FAFAFA] md:bg-bg-color rounded-xl md:rounded-lg border border-[#E4E7EC]/60 md:border-0"
          >
            <Box className="p-1 rounded-lg bg-brandColor-active/20 flex items-center w-10 h-10 justify-center shrink-0">
              <item.icon className="text-primary-text/70!" />
            </Box>
            <Box className="flex-1 flex flex-col gap-1 min-w-0">
              <Typography className="text-sm! font-medium! text-primary-dark!">
                {item.title}
              </Typography>
              <Typography className="text-xs! font-normal! text-text-tertiary/70!">
                {item.description}
              </Typography>
            </Box>
            <AntSwitch
              checked={preferences[item.key]}
              onChange={(e) => updatePreference(item.key, e.target.checked)}
              inputProps={{ "aria-label": item.title }}
            />
          </Box>
        ))}
      </Box>

      <Box className="flex justify-end pt-2 border-t border-gray-200">
        <Button onClick={() => void savePreferences()} className="px-6! py-2! rounded-lg!" loading={isSaving}>
          Save Preferences
        </Button>
      </Box>
    </Box>
  );
}
