"use client";

import { Box, styled, Switch, Typography } from "@mui/material";
import React, { useState, useEffect } from "react";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { accountServices, UpdateAccountSettingsRequest, UpdateAccountSettingsResponse, GetProfileResponse } from "@/services/account.service";

export const DashboardStaffNotificationSetting = () => {
    const [enableEmailNotification, setEnableEmailNotification] = useState(false);
    const [enableSmsNotification, setEnableSmsNotification] = useState(false);

    // Fetch current settings from profile
    const { data: profileData } = useQueryService<Record<string, never>, GetProfileResponse>({
        service: accountServices.getProfile,
        options: {},
    });

    // Initialize state from API response
    useEffect(() => {
        if (profileData?.data?.user) {
            setEnableEmailNotification(profileData.data.user.enableEmailNotification ?? false);
            setEnableSmsNotification(profileData.data.user.enableSmsNotification ?? false);
        }
    }, [profileData]);

    const { mutateAsync: updateSettings } = useMutationService<
        UpdateAccountSettingsRequest,
        UpdateAccountSettingsResponse
    >({
        service: accountServices.updateSettings,
        options: {
            successMessage: "Notification settings updated successfully",
            errorTitle: "Failed to update notification settings",
        },
    });

    const handleEmailNotificationChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.checked;
        setEnableEmailNotification(newValue);

        try {
            await updateSettings({
                enableEmailNotification: newValue,
                enableSmsNotification,
            });
        } catch {
            // Revert on error
            setEnableEmailNotification(!newValue);
        }
    };

    const handleSmsNotificationChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.checked;
        setEnableSmsNotification(newValue);

        try {
            await updateSettings({
                enableEmailNotification,
                enableSmsNotification: newValue,
            });
        } catch {
            // Revert on error
            setEnableSmsNotification(!newValue);
        }
    };
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

    return (
        <Box className="rounded-lg bg-white flex flex-col gap-5 p-4">
            <Box className="flex flex-col gap-1 border-b border-solid border-border-lightGray pb-4">
                <Typography className="font-bold! text-black!">Notification Channels</Typography>
                <Typography className="text-xs! text-text-tertiary/70!">
                    Choose how you want to receive notifications.
                </Typography>
            </Box>
            <Box className="flex flex-col gap-5">
                <Box className="flex flex-row items-center gap-2 border border-solid border-border-lightGray rounded-lg p-4">
                    <Box className="flex-1 flex flex-col gap-2">
                        <Typography className="font-medium! text-xs!">Emails</Typography>
                        <Typography className="text-[#001F1FB2] text-xs!">
                            Receive notifications via your registered email address.
                        </Typography>
                    </Box>
                    <AntSwitch
                        checked={enableEmailNotification}
                        onChange={handleEmailNotificationChange}
                        inputProps={{ "aria-label": "email notification toggle" }}
                    />
                </Box>
                <Box className="flex flex-row items-center gap-2 border border-solid border-border-lightGray rounded-lg p-4">
                    <Box className="flex-1 flex flex-col gap-2">
                        <Typography className="font-medium! text-xs!">SMS</Typography>
                        <Typography className="text-[#001F1FB2] text-xs!">
                            Get critical alerts via text message.
                        </Typography>
                    </Box>
                    <AntSwitch
                        checked={enableSmsNotification}
                        onChange={handleSmsNotificationChange}
                        inputProps={{ "aria-label": "SMS notification toggle" }}
                    />
                </Box>
            </Box>
        </Box>
    );
};
