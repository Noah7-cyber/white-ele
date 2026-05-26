/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Box, Dialog, Drawer, IconButton, Stack, Typography, useMediaQuery, useTheme } from "@mui/material";
import { Button } from "@/modules/shared/component/Button/WPButton";
import { CashViewer } from "@/modules/shared/component/CashViewer";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { subscriptionServices } from "@/services/subscription.service";
import { useUser } from "@/utils/hooks/useUser";
import { unitToAmount } from "@/utils/helpers";

type PlanSubscriptionModalProps = {
  open: boolean;
  onClose: () => void;
  selectedPlan: any;
  onSuccessful?: (event: any) => void;
};

export const PlanSubscriptionModal = ({
  open,
  onClose,
  onSuccessful,
  selectedPlan,
}: PlanSubscriptionModalProps) => {
  const billingLabel = selectedPlan?.period === "yearly" ? "Annually Billing" : "Monthly Billing";
  const { user } = useUser();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const { mutateAsync, isPending } = useMutationService({
    service: subscriptionServices.subscribePlan,
    options: {
      disableToast: true,
    },
  });

  async function onSubmit() {
    try {
      try {
        const response = await mutateAsync({
          planId: selectedPlan?.subscriptionPlan?.id,
          billingPlanId: selectedPlan?.id,
          email: user?.email,
          callbackUrl: "http://localhost:3000/api/v1/subscriptions/paystack/callback",
          status: "active",
          replaceActive: true,
        });
        onSuccessful?.(response);
      } catch (error) { }
    } catch (error) { }
  }

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
          Plan Subscription
        </Typography>
      </Stack>

      <Typography
        sx={{
          color: "#6B7280",
          fontSize: "1rem",
          lineHeight: 1.7,
          maxWidth: "620px",
        }}
      >
        You are about to subscribe to the{" "}
        <Box component="span" sx={{ fontWeight: 700, color: "#4B5563" }}>
          {selectedPlan?.subscriptionPlan?.displayName} Plan
        </Box>
        . Your account will be charged immediately and your subscription will renew automatically
        based on the selected billing cycle unless auto-renewal is turned off.
      </Typography>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Box>
            <Typography sx={{ fontSize: "1.125rem", fontWeight: 700, color: "#111827" }}>
              {selectedPlan?.subscriptionPlan?.displayName} Plan Subscription
            </Typography>
            <Typography sx={{ fontSize: "0.95rem", color: "#6B7280" }}>{billingLabel}</Typography>
          </Box>
        </Stack>
        <Typography>
          <CashViewer
            amount={unitToAmount(selectedPlan?.price || 0)}
            valueClassName="text-xl! font-semibold!"
            symbolClassName="text-xl! font-semibold!"
          />
        </Typography>
      </Stack>

      <Stack spacing={2}>
        <Button
          fullWidth
          onClick={onSubmit}
          loading={isPending}
          sx={{
            height: 58,
            borderRadius: "12px",
            color: "#FFFFFF",
            fontSize: "1rem",
            fontWeight: 600,
          }}
        >
          Continue
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
