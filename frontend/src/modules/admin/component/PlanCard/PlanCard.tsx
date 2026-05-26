/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React from "react";
import { Box, Typography, Button, Stack } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { CashViewer } from "@/modules/shared/component/CashViewer";
import { unitToAmount } from "@/utils/helpers";

type PlanCardProps = {
  title: string;
  price: string;
  description: string;
  buttonText: string;
  buttonVariant: "text" | "outlined" | "contained";
  featuresTitle: string;
  features: any[];
  billingText?: "monthly" | "yearly";
  isCurrentPlan?: boolean;
  disabled?: boolean;
  onClick?: () => void;
};

export const PlanCard = ({
  title,
  price,
  description,
  buttonText,
  buttonVariant,
  featuresTitle,
  features,
  billingText = "monthly",
  isCurrentPlan = false,
  disabled = false,
  onClick,
}: PlanCardProps) => {
  const isCustom = price === "Custom";
  const displayButtonText = isCurrentPlan
    ? "Current Plan"
    : isCustom
      ? "Contact Sales"
      : buttonText;

  return (
    <Box
      sx={{
        borderRadius: "10px",
        p: 4,
        width: "100%",
        display: "flex",
        flexDirection: "column",
        border: isCurrentPlan ? "1px solid #00808033" : "1px solid #00808033",
        transition: "all 0.3s ease",
        backgroundColor: "#fff",
        height: "100%",
        position: "relative",
        ...(isCurrentPlan && {
          boxShadow: "0px 4px 20px rgba(0, 126, 126, 0.1)",
        }),
      }}
    >
      <Typography
        className="!text-xl"
        sx={{ fontWeight: 600, color: "#1A202C", mb: 2, fontSize: "1.25rem" }}
      >
        {title}
      </Typography>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <Typography
          sx={{ fontWeight: 600, color: "#111827", letterSpacing: "1px" }}
        >
          <CashViewer amount={unitToAmount(+price || 0)} valueClassName="!text-2xl !font-semibold" symbolClassName="!text-2xl !font-semibold" />
        </Typography>
        <Box>
          <Typography sx={{ fontSize: "0.75rem", color: "#6B7280", lineHeight: 1.2 }}>
            per user
          </Typography>
          <Typography sx={{ fontSize: "0.75rem", color: "#6B7280", lineHeight: 1.2 }}>
            {billingText}
          </Typography>
        </Box>
      </Stack>
      <Typography
        sx={{ fontSize: "0.875rem", color: "#4B5563", mb: 3, minHeight: 40, lineHeight: 1.5 }}
      >
        {description}
      </Typography>

      <Button
        variant={isCurrentPlan ? "contained" : buttonVariant}
        fullWidth
        disabled={disabled || isCurrentPlan}
        onClick={onClick}
        sx={{
          py: 1,
          borderRadius: "8px",
          textTransform: "none",

          fontSize: "0.95rem",
          mb: 4,
          ...(isCurrentPlan
            ? {
              backgroundColor: "#008080 !important",
              color: "white !important",
              opacity: "1 !important",
              fontWeight: 600,
              "&.Mui-disabled": {
                backgroundColor: "#008080 !important",
                color: "white !important",
                opacity: 1,
              },
            }
            : buttonVariant === "outlined"
              ? {
                color: "#111827",
                borderColor: "#E5E7EB",
                fontWeight: 500,
                "&:hover": {
                  borderColor: "#D1D5DB",
                  backgroundColor: "transparent",
                },
              }
              : {
                backgroundColor: "#007E7E",
                color: "white",
                fontWeight: 500,
                "&:hover": {
                  backgroundColor: "#006B6B",
                },
              }),
        }}
      >
        {displayButtonText}
      </Button>

      <Box sx={{ flexGrow: 1 }}>
        <Typography sx={{ fontWeight: 600, color: "#111827", mb: 0.5, fontSize: "0.95rem" }}>
          Features:
        </Typography>
        <Typography sx={{ color: "#6B7280", fontSize: "0.875rem", mb: 3 }}>
          {featuresTitle}
        </Typography>

        <Stack spacing={2}>
          {features?.map((feature, index) => (
            <Stack direction="row" alignItems="flex-start" spacing={1.5} key={index}>
              <CheckCircleIcon sx={{ color: "#007E7E", fontSize: 20, mt: 0.2 }} />
              <Typography sx={{ color: "#4B5563", fontSize: "0.875rem", lineHeight: 1.4 }}>
                {feature?.name}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Box>
    </Box>
  );
};
