/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState } from "react";
import { Box, Button, Stack } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { PlanCard } from "../../component/PlanCard";
import { PlanSubscriptionModal } from "../../component/PlanSubscriptionModal";
import { usePlans } from "../SettingsPage/DashboardBillingSetting/hooks/usePlans";
import { capitalizeFirstLetter } from "@/utils/helpers";
import { DataRenderer } from "@/modules/shared/component/DataRenderer";
import { PayStackCheckModal } from "../../component/PayStackCheckModal";
import { useUser } from "@/utils/hooks/useUser";

export const Plans = () => {
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const { billingPlans, isLoading, billingCycle, setBillingCycle } = usePlans();
  const [checkoutURL, setCheckoutURL] = useState("");

  const { user } = useUser()

  const handleMonthly = () => setBillingCycle("monthly");
  const handleYearly = () => setBillingCycle("yearly");
  const handleCloseSubscriptionModal = () => setSelectedPlan(null);

  const isYearly = billingCycle === "yearly";

  return (
    <Box
      sx={{
        minHeight: "100%",
        py: 6,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Toggle */}
      <Stack
        direction="row"
        sx={{
          backgroundColor: "white",
          borderRadius: "100px",
          p: 0.5,
          mb: 4,
          alignItems: "center",
          boxShadow: "0px 2px 4px rgba(0,0,0,0.02)",
        }}
      >
        <Box
          onClick={handleMonthly}
          sx={{
            borderRadius: "100px",
            backgroundColor: !isYearly ? "#007E7E" : "transparent",
            color: !isYearly ? "white" : "#4B5563",
            px: 3,
            py: 1.5,
            cursor: "pointer",
            fontWeight: 500,
            fontSize: "0.875rem",
            transition: "all 0.3s ease",
          }}
        >
          Monthly billing
        </Box>
        <Box
          onClick={handleYearly}
          sx={{
            borderRadius: "100px",
            backgroundColor: isYearly ? "#007E7E" : "transparent",
            color: isYearly ? "white" : "#4B5563",
            px: 3,
            py: 1.5,
            cursor: "pointer",
            fontWeight: 500,
            fontSize: "0.875rem",
            display: "flex",
            alignItems: "center",
            gap: 1,
            transition: "all 0.3s ease",
          }}
        >
          Yearly billing
          <Box
            className="md:block hidden"
            sx={{
              backgroundColor: isYearly ? "rgba(255,255,255,0.2)" : "#F3F4F6",
              color: isYearly ? "white" : "#6B7280",
              fontSize: "0.65rem",
              px: 1,
              py: 0.25,
              borderRadius: "4px",
              fontWeight: "bold",
              transition: "all 0.3s ease",
            }}
          >
            Save 20%
          </Box>
        </Box>
      </Stack>

      <DataRenderer isLoading={isLoading}>
        {() => (
          <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 2, height: "100%" }}>
            {billingPlans?.map((item: any) => (
              <PlanCard
                key={item?.id}
                title={capitalizeFirstLetter(item?.subscriptionPlan?.displayName)}
                price={item?.price}
                billingText={item?.period}
                description="For creches and daycares just getting started, up to 30 children."
                buttonText="Subscribe"
                buttonVariant="outlined"
                onClick={() => {
                  setSelectedPlan(item);
                }}
                featuresTitle="Access to starter:"
                features={[
                  "Attendance tracking",
                  "Child profiles",
                  "Basic parent communication",
                  "Basic invoicing",
                  "Basic invoicing",
                ]}
              />
            ))}
          </Box>
        )}
      </DataRenderer>

      {/* Compare All Plans */}
      <Box sx={{ mt: 6 }}>
        <Button
          endIcon={<ArrowForwardIcon sx={{ fontSize: 18 }} />}
          sx={{
            color: "#007E7E",
            textTransform: "none",
            fontWeight: 600,
            fontSize: "0.95rem",
            textDecoration: "underline",
            textUnderlineOffset: "4px",
            "&:hover": {
              backgroundColor: "transparent",
              color: "#006B6B",
            },
          }}
          disableRipple
        >
          Compare all plans
        </Button>
      </Box>

      <PlanSubscriptionModal
        open={!!selectedPlan}
        onClose={handleCloseSubscriptionModal}
        onSuccessful={(event) => {
          setCheckoutURL(event?.checkoutUrl);
          handleCloseSubscriptionModal()
        }}
        selectedPlan={selectedPlan}
      />
      <PayStackCheckModal
        url={checkoutURL}
        onSuccess={() => {
          setCheckoutURL("");
        }}
        onCancel={() => setCheckoutURL("")}
      />
    </Box>
  );
};
