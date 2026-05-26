/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Box, Typography, Grid, Chip, IconButton } from "@mui/material";
import React, { useState } from "react";
import { PlanCard } from "@/modules/admin/component/PlanCard/PlanCard";
import { Table } from "@/modules/shared/component/Table";
import { PaginationControls } from "@/modules/shared/component/Pagination/Pagination";
import DownloadIcon from "@/modules/shared/assets/svgs/downloadOutline.svg";
import Link from "next/link";
import { usePlans } from "./hooks/usePlans";
import { capitalizeFirstLetter, dateFormatter, unitToAmount } from "@/utils/helpers";
import { DataRenderer } from "@/modules/shared/component/DataRenderer";
import { PlanSubscriptionModal } from "@/modules/admin/component/PlanSubscriptionModal";
import { PlanUpgradeModal } from "@/modules/admin/component/PlanUpgradeModal";
import { PayStackCheckModal } from "@/modules/admin/component/PayStackCheckModal";
import { showToast } from "@/modules/shared/component/Toast";
import { CashViewer } from "@/modules/shared/component/CashViewer";
import classNames from "classnames";

export const DashboardBillingSetting = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const { billingPlans, isLoading, billingCycle, setBillingCycle, subscriptions,
    isLoadingSubscription, activeSubscription, refetchSubscription, refetchCurrentSubscription } = usePlans();
  const [checkoutURL, setCheckoutURL] = useState("");
  const handleCloseSubscriptionModal = () => setSelectedPlan(null);

  const tableData = subscriptions?.map((item: any) => ({
    date: dateFormatter(item?.startDate),
    planName: (
      <Typography className="!text-[#101828] !text-[13px] !font-medium">
        {capitalizeFirstLetter(item?.plan?.name)}
      </Typography>
    ),
    expireOn: (
      <Typography className="!text-[#101828] !text-[13px] !font-medium">
        {dateFormatter(item?.endDate || item?.renewalDate)}
      </Typography>
    ),
    amount: (
      <Typography className="!text-[#101828] !text-[13px] !font-medium">
        <CashViewer amount={unitToAmount(item?.amountAtSubscription || 0)} valueClassName="!text-[#101828] !text-[13px] !font-medium" symbolClassName="!text-[#101828] !text-[13px] !font-medium" />
      </Typography>
    ),
    status: (
      <Chip
        label={capitalizeFirstLetter(item?.status)}
        size="small"
        className={classNames("!font-medium !px-5", /active/.test(item?.status) ? "!bg-[#ECFDF3] !text-[#027A48]" : "!bg-[#CB1A14] !text-[#fff]")}
      />
    ),
    // action: (
    //   <IconButton className="!p-">
    //     <DownloadIcon className="" />
    //   </IconButton>
    // ),
  }));

  return (
    <Box className="flex flex-col gap-6">
      <Box className="bg-white rounded-xl p-4 md:p-6 border border-[#E4E7EC]">
        <Box className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <Box>
            <Typography className="!font-bold !text-lg !text-[#101828]">
              Subscription Plans
            </Typography>
            <Typography className="!text-sm !text-[#667085]">
              Select the tier that best fits your needs.
            </Typography>
          </Box>

          <Box className="flex gap-2 bg-white border border-brandColor-active/20 p-1.5 rounded-lg w-full md:w-auto">
            <Box
              onClick={() => setBillingCycle("monthly")}
              className={`flex-1 md:flex-none text-center p-2.5 rounded-md cursor-pointer transition-all !text-xs ${billingCycle === "monthly" ? "bg-brandColor-active  text-white shadow-sm" : "text-[#667085]"
                }`}
            >
              <Typography className="!text-sm !font-medium">Monthly billing</Typography>
            </Box>
            {/* <Box
              onClick={() => setBillingCycle("yearly")}
              className={`flex-1 md:flex-none text-center p-2.5 rounded-md cursor-pointer transition-all !text-xs ${billingCycle === "yearly" ? "bg-brandColor-active  text-white shadow-sm" : "text-[#667085]"
                }`}
            >
              <Typography className="!text-sm !font-medium">Yearly billing</Typography>
            </Box> */}
          </Box>
        </Box>

        <DataRenderer isLoading={isLoading}>
          {() => (
            <Grid container spacing={{ xs: 2, md: 4 }}>
              {billingPlans?.map((item: any, index: number) => {
                const planTitle = capitalizeFirstLetter(item?.subscriptionPlan?.displayName);
                const isCurrentPlan = activeSubscription?.status === "active" && activeSubscription?.billingPlanId === item?.id;
                const activePlanPrice = Number(activeSubscription?.amountAtSubscription || 0);
                const itemPrice = Number(item?.price || 0);

                const buttonText = isCurrentPlan
                  ? "Current Plan"
                  : activeSubscription?.status === "active"
                    ? itemPrice > activePlanPrice
                      ? "Upgrade"
                      : "Downgrade"
                    : "Subscribe";

                return (
                  <Grid item xs={12} md={4} key={item?.id}>
                    <PlanCard
                      title={planTitle}
                      price={item?.price}
                      billingText={item?.period}
                      description={item?.subscriptionPlan?.description || ""}
                      featuresTitle={""}
                      features={item?.subscriptionPlan?.features || []}
                      buttonText={buttonText}
                      buttonVariant={isCurrentPlan ? "contained" : "outlined"}
                      isCurrentPlan={isCurrentPlan}
                      disabled={item?.subscriptionPlan?.isCustom}
                      onClick={() => {
                        if (item?.subscriptionPlan?.isCustom) {
                          window.open("https://whitepenguin.co/contact/", "_blank");
                        } else if (buttonText === "Downgrade") {
                          showToast({
                            message: "Downgrade will be available on your next renewal.",
                            severity: "error",
                          });
                        } else {
                          setSelectedPlan(item);
                        }
                      }}
                    />
                  </Grid>
                );
              })}
            </Grid>
          )}
        </DataRenderer>

        <Box className="mt-8 text-center">
          <Link href="https://whitepenguin.co/pricing/" target="_blank" className="inline-flex items-center gap-1 cursor-pointer group">
            <Typography className="!text-brandColor-active !font-semibold !text-sm border-b-2 border-brandColor-active/90 group-hover:border-brandColor-active transition-all">
              Compare all plans
            </Typography>
            <Typography className="!text-brandColor-active group-hover:translate-x-1 transition-transform">

              →{" "}
            </Typography>
          </Link >
        </Box>
      </Box>

      {/* Payment History Section */}
      <Box className="bg-white rounded-xl border border-[#E4E7EC] overflow-hidden">
        <Box className="p-4 md:p-6 border-b border-[#E4E7EC]">
          <Typography className="!font-bold !text-lg !text-[#101828]">Payment History</Typography>
          <Typography className="!text-sm !text-[#667085]">
            Manage users and their access permissions.
          </Typography>
        </Box>

        <Box className="overflow-x-auto p-4 max-w-[100vw] sm:max-w-none">
          <Table
            headers={["Date", "Plan Name", "Expire On", "Amount", "Status"]}
            tableData={tableData}
            isLoading={isLoadingSubscription}
            headerRowClassName="!bg-[#F9FAFB] !border-b !border-[#E4E7EC] !text-sm"
            headerCellClassName="!text- !text-dark font-avenir !font-medium whitespace-nowrap"
            bodyCellClassName="!text-secondary-text-gray !text-md !font-medium font-avenir !text- align-middle !py-4 whitespace-nowrap"
            bodyRowClassName="border-b border-[#E4E7EC] last:border-0"
            tableContainerClassName="!border !border-[#E4E7EC] !rounded-lg !overflow-hidden !bg-white min-w-[600px] md:min-w-full"
            isCondense
            centeredHeaderIndex={[2, 3]}
            rightAlignedIndex={[4]}
            renderMobileCard={(row: any, index: number) => (
              <Box key={index} className="bg-white border border-[#E4E7EC] rounded-lg p-4 mb-4 flex flex-col gap-3">
                <Box className="flex justify-between items-center">
                  <Typography className="!text-sm !font-bold !text-[#101828]">Status</Typography>
                  {row.status}
                </Box>
                <Box className="flex justify-between items-center">
                  <Typography className="!text-sm !text-[#667085]">Plan</Typography>
                  {row.invoiceNumber}
                </Box>
                <Box className="flex justify-between items-center">
                  <Typography className="!text-sm !text-[#667085]">Amount</Typography>
                  {row.amount}
                </Box>
                <Box className="flex justify-between items-center">
                  <Typography className="!text-sm !text-[#667085]">Date</Typography>
                  <Typography className="!text-sm !font-medium !text-[#101828]">{row.date}</Typography>
                </Box>
                {/* <Box className="flex justify-end pt-2 mt-1 border-t border-[#E4E7EC]">
                  {row.action}
                </Box> */}
              </Box>
            )}
          />
        </Box>

        <Box className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">

          <PaginationControls
            currentPage={currentPage}
            rowsPerPage={rowsPerPage}
            totalItems={1}
            onPageChange={({ page, rowsPerPage: newRowsPerPage }) => {
              setCurrentPage(page);
              if (newRowsPerPage !== rowsPerPage) {
                setRowsPerPage(newRowsPerPage);
                setCurrentPage(1);
              }
            }}
            isCondense
            bottomTableClasses="!text-xs"
          />
        </Box>
      </Box>

      {activeSubscription?.status === 'active' ? (
        <PlanUpgradeModal
          open={!!selectedPlan}
          onClose={handleCloseSubscriptionModal}
          onSuccessful={(event: any) => {
            setCheckoutURL(event?.checkoutUrl);
            handleCloseSubscriptionModal();
          }}
          selectedPlan={selectedPlan}
          activeSubscription={activeSubscription}
        />
      ) : (
        <PlanSubscriptionModal
          open={!!selectedPlan}
          onClose={handleCloseSubscriptionModal}
          onSuccessful={(event: any) => {
            setCheckoutURL(event?.checkoutUrl);
            handleCloseSubscriptionModal();
          }}
          selectedPlan={selectedPlan}
        />
      )}
      <PayStackCheckModal
        url={checkoutURL}
        onSuccess={() => {
          setCheckoutURL("");
          showToast({
            message: 'Subscription Successful',
            description: 'Your have successfully subscribe to a plan'
          })
          refetchSubscription()
          refetchCurrentSubscription()
        }}
        onCancel={() => setCheckoutURL("")}
      />
    </Box>
  );
};
