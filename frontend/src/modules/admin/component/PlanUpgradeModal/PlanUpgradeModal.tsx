/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Box, Chip, Dialog, Drawer, IconButton, Stack, Typography, useMediaQuery, useTheme, Skeleton } from "@mui/material";
import { Button } from "@/modules/shared/component/Button/WPButton";
import { CashViewer } from "@/modules/shared/component/CashViewer";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { subscriptionDynamicEndpoints, subscriptionServices } from "@/services/subscription.service";
import { useUser } from "@/utils/hooks/useUser";
import { dateFormatter, unitToAmount } from "@/utils/helpers";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { showToast } from "@/modules/shared/component/Toast";

type PlanUpgradeModalProps = {
  open: boolean;
  activeSubscription?: any;
  onClose: () => void;
  selectedPlan: any;
  onSuccessful?: (event: any) => void;
};

export const PlanUpgradeModal = ({
  open,
  onClose,
  onSuccessful,
  selectedPlan,
  activeSubscription
}: PlanUpgradeModalProps) => {
  const billingLabel = selectedPlan?.period === "yearly" ? "Annually Billing" : "Monthly Billing";
  const { user } = useUser();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const { data: upgradeSummary, isLoading: isLoadingSummary } = useQueryService({
    service: {
      ...subscriptionDynamicEndpoints.upgradeSummary(activeSubscription?.id),
      data: {
        newPlanId: selectedPlan?.subscriptionPlan?.id,
        newBillingPlanId: selectedPlan?.id,
      },
    },
    options: {
      enabled: !!activeSubscription?.id && !!selectedPlan?.id && open,
    },
  });

  const { mutateAsync, isPending } = useMutationService({
    service: subscriptionServices.planUpgrade,
    options: {
      disableToast: true,
    },
  });

  async function onSubmit() {
    try {
      const response = await mutateAsync({
        newPlanId: selectedPlan?.subscriptionPlan?.id,
        newBilingPlanId: selectedPlan?.id,
        email: user?.email,
        callbackUrl: "http://localhost:3000/api/v1/subscriptions/paystack/callback",
        status: "active",
        replaceActive: true,
      });
      if (!(response as any)?.checkoutUrl) {
        showToast({
          message: (response as any)?.message,
          severity: "error",
        });
        return
      }
      onSuccessful?.(response);
    } catch (error) { }
  }

  const summary = upgradeSummary as any;

  const content = (
    <Box
      sx={{
        p: { xs: 3, sm: 4 },
        pb: { xs: 5, sm: 4 },
        display: "flex",
        flexDirection: "column",
        gap: 3,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={2}>
        <IconButton
          onClick={onClose}
          className="!md:block !hidden"
          sx={{
            width: 48,
            height: 48,
            backgroundColor: "#F4F6F8",
            "&:hover": { backgroundColor: "#ECEFF3" },
          }}
        >
          <ArrowBackIcon sx={{ color: "#1E1E1E" }} />
        </IconButton>
        <Typography
          sx={{ fontSize: { xs: "1.3rem", sm: "1.75rem" }, fontWeight: 700, color: "#111827" }}
        >
          Plan Upgrade
        </Typography>
      </Stack>

      {/* Current Plan Info */}
      <Box sx={{ p: 2, bgcolor: "#F9FAFB", borderRadius: "12px", border: "1px solid #E4E7EC" }}>
        <Typography sx={{ fontSize: "0.875rem", color: "#6B7280", mb: 1 }}>
          Current Plan
        </Typography>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            {isLoadingSummary ? (
              <Stack spacing={0.5}>
                <Skeleton width={140} height={24} />
                <Skeleton width={180} height={20} />
              </Stack>
            ) : (
              <>
                <Typography sx={{ fontWeight: 700, color: "#111827", textTransform: "capitalize" }}>
                  {summary?.current?.planName || activeSubscription?.plan?.displayName || activeSubscription?.plan?.name || "Current Plan"}
                </Typography>
                <Typography sx={{ fontSize: "0.875rem", color: "#6B7280" }}>
                  Expires on: {dateFormatter(summary?.current?.renewalDate || activeSubscription?.endDate || activeSubscription?.renewalDate)}
                </Typography>
              </>
            )}
          </Box>
          <Chip
            label="Active"
            size="small"
            sx={{ bgcolor: "#ECFDF3", color: "#027A48", fontWeight: 600 }}
          />
        </Stack>
      </Box>

      <Typography
        sx={{
          color: "#6B7280",
          fontSize: "1rem",
          lineHeight: 1.7,
          maxWidth: "620px",
        }}
      >
        You are about to upgrade to the{" "}
        <Box component="span" sx={{ fontWeight: 700, color: "#4B5563" }}>
          {selectedPlan?.subscriptionPlan?.name} Plan
        </Box>
      </Typography>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        sx={{ p: 2, border: "1px solid #E4E7EC", borderRadius: "12px" }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Box>
            <Typography sx={{ fontSize: "1.125rem", fontWeight: 700, color: "#111827" }}>
              {selectedPlan?.subscriptionPlan?.displayName} Plan Upgrade
            </Typography>
            <Typography sx={{ fontSize: "0.95rem", color: "#6B7280" }}>{billingLabel}</Typography>
          </Box>
        </Stack>
        <Box sx={{ textAlign: "right" }}>
          <Typography sx={{ fontSize: "0.875rem", color: "#6B7280" }}>Amount to Pay</Typography>
          {isLoadingSummary ? (
            <Skeleton width={120} height={40} />
          ) : (
            <>
              <CashViewer
                amount={unitToAmount(summary?.proration?.upgradeCost ?? selectedPlan?.price ?? 0)}
                valueClassName="text-2xl! font-bold! color-[#111827]!"
                symbolClassName="text-2xl! font-bold! color-[#111827]!"
              />
              {summary?.proration?.newRenewalDate && (
                <Typography sx={{ fontSize: "0.75rem", color: "#027A48", fontWeight: 500, mt: 0.5 }}>
                  Next Renewal: {dateFormatter(summary.proration.newRenewalDate)}
                </Typography>
              )}
            </>
          )}
        </Box>
      </Stack>

      <Stack spacing={2}>
        <Button
          fullWidth
          onClick={onSubmit}
          loading={isPending || isLoadingSummary}
          sx={{
            height: 58,
            borderRadius: "12px",
            color: "#FFFFFF",
            fontSize: "1rem",
            fontWeight: 600,
          }}
        >
          Confirm Upgrade
        </Button>
        <Button
          variant="outlined"
          fullWidth
          onClick={onClose}
          className="!text-[#202124] !border-[#EAECF0] !bg-[#F3F4F6]"
          sx={{
            height: 58,
            borderRadius: "12px",
            fontSize: "1rem",
            fontWeight: 500,
            "&:hover": {
              borderColor: "#D0D5DD",
              backgroundColor: "#ECEEF2",
            },
          }}
        >
          Cancel
        </Button>
      </Stack>
    </Box>
  );

  return isMobile ? (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: "24px 24px 0 0",
        },
      }}
    >
      {content}
    </Drawer>
  ) : (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      slotProps={{
        paper: {
          sx: {
            borderRadius: "16px",
            width: "100%",
            maxWidth: "744px",
            m: { xs: 2, sm: 4 },
            overflow: "hidden",
          },
        },
      }}
    >
      {content}
    </Dialog>
  );
};
