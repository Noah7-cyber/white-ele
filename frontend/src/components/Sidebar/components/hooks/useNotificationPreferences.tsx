/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

/**
 * Parent notification toggles — consumed by the in-app profile tab
 * (`NotificationPreferencesPanel` on `/parent/profile?tab=notifications`), not a modal.
 */
import { useState, useEffect } from "react";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { showToast } from "@/modules/shared/component/Toast";
import { accountServices, type GetProfileResponse } from "@/services/account.service";

export interface NotificationPreferences {
  attendanceAlerts: boolean;
  activityUpdates: boolean;
  billingNotifications: boolean;
  messages: boolean;
  reminders: boolean;
}

export const defaultPreferences: NotificationPreferences = {
  attendanceAlerts: true,
  activityUpdates: true,
  billingNotifications: true,
  messages: true,
  reminders: false,
};

const useNotificationPreferences = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);

  const { data: profileData, isLoading: isLoadingPreferences } = useQueryService<
    Record<string, never>,
    GetProfileResponse
  >({
    service: accountServices.getProfile,
    options: {
      // onSuccess: (data: any) => {
      //   // Map user profile data to notification preferences
      //   // This is a placeholder - adjust based on actual API response structure
      //   if (data?.user) {
      //     setPreferences({
      //       attendanceAlerts: data.user.attendanceAlerts ?? defaultPreferences.attendanceAlerts,
      //       activityUpdates: data.user.activityUpdates ?? defaultPreferences.activityUpdates,
      //       billingNotifications: data.user.billingNotifications ?? defaultPreferences.billingNotifications,
      //       messages: data.user.messages ?? defaultPreferences.messages,
      //       reminders: data.user.reminders ?? defaultPreferences.reminders,
      //     });
      //   }
      //   setIsLoading(false);
      // },
      // onError: () => {
      //   setIsLoading(false);
      // },
    },
  });

  useEffect(() => {
    if (profileData?.data?.user) {
      const user = profileData.data.user;
      setPreferences((prev) => ({
        ...prev,
        billingNotifications: user.enableEmailNotification ?? prev.billingNotifications,
        reminders: user.enableSmsNotification ?? prev.reminders,
        attendanceAlerts: user.enableInAppNotification ?? prev.attendanceAlerts,
        activityUpdates: user.enableInAppNotification ?? prev.activityUpdates,
        messages: user.enableInAppNotification ?? prev.messages,
      }));
    }

    if (!isLoadingPreferences) setIsLoading(false);
  }, [isLoadingPreferences, profileData]);

  const { mutateAsync: updatePreferencesAsync, isPending: isSaving } = useMutationService<any, any>({
    service: accountServices.updateSettings,
    options: {
      successTitle: "Preferences Updated",
      successMessage: "Your notification preferences have been updated successfully.",
      errorTitle: "Failed to Update Preferences",
      disableToast: true, // We'll handle toast manually
    },
  });

  const updatePreference = (key: keyof NotificationPreferences, value: boolean) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const savePreferences = async () => {
    try {
      await updatePreferencesAsync({
        enableEmailNotification: preferences.billingNotifications,
        enableSmsNotification: preferences.reminders,
        enableInAppNotification:
          preferences.attendanceAlerts || preferences.activityUpdates || preferences.messages,
      });
      showToast({
        message: "Preferences Updated",
        description: "Your notification preferences have been updated successfully.",
        severity: "success",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error updating preferences:", error);
      // Error is already handled by useMutationService
    }
  };

  return {
    preferences,
    updatePreference,
    savePreferences,
    isSaving,
    isLoading,
  };
};

export default useNotificationPreferences;

