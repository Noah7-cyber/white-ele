"use client";

import React, { useEffect, useState } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { Table } from "@/modules/shared/component/Table";
import { PaginationControls } from "@/modules/shared/component/Pagination";
import OwnerRowActions from "@/modules/admin/component/OwnerRowActions/ownerRowActions";
import { headers } from "./constants";
import useAdmissions, { AdmissionApplication, AdmissionChild } from "./hooks/useAdmissions";
import { SearchTextfield } from "@/modules/shared/component/SearchTextfield";
import ViewTourBookingModal from "@/modules/admin/component/EventModal/ViewTourBookingModal";
import FormResponseDetailModal from "@/modules/admin/page/LeadsAndRequests/FormResponseDetailModal";
import {
  BookedTour,
  GetTourBookingByIdResponse,
  tourDynamicEndpoints,
} from "@/services/tour.service";
import { formDynamicEndpoints, GetFormResponseByIdResponse } from "@/services/form.service";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { MobileAdmissionApplicationCard } from "@/modules/admin/component/MobileAdmissionApplicationCard";
import ConfirmModal from "@/components/ConfirmModal/confirmModal";

function getStatusBadge(status: string) {
  const base = "px-4 py-[3px] text-xs font-medium rounded-full text-center";
  switch (status.trim().toLowerCase()) {
    case "accepted":
      return <span className={`${base} bg-[#EDFFF7] text-success-green`}>Accepted</span>;
    case "offer sent":
      return <span className={`${base} bg-[#4F4F4F1A] text-[#4F4F4F]`}>Offer sent</span>;
    case "withdrawn":
    case "withdraw":
      return <span className={`${base} bg-[#CF000B1A] text-badge-red`}>Withdrawn</span>;
    default:
      return <span className={base}>{status}</span>;
  }
}

const AdmissionPage = () => {
  const {
    admissions,
    isLoading,
    currentPage,
    totalItems,
    rowsPerPage,
    handlePageChange,
    handleSearch,
    resendOfferForAdmission,
    isResendingOffer,
    selectedBookedTourId,
    withdrawAdmission,
    selectedWithdrawId,
    isWithdrawingAdmission,
  } = useAdmissions();

  const [selectedBooking, setSelectedBooking] = useState<BookedTour | null>(null);
  const [selectedFormResponseId, setSelectedFormResponseId] = useState<number | null>(null);
  const [selectedTourBookingId, setSelectedTourBookingId] = useState<number | null>(null);
  const [withdrawTarget, setWithdrawTarget] = useState<AdmissionApplication | null>(null);

  const { data: selectedTourBookingResponse } = useQueryService<
    Record<string, never>,
    GetTourBookingByIdResponse
  >({
    service: tourDynamicEndpoints.getTourBookingById(selectedTourBookingId ?? 0),
    options: {
      enabled: selectedTourBookingId != null,
      keys: ["tourBookingById", String(selectedTourBookingId ?? "")],
    },
  });

  useEffect(() => {
    if (!selectedTourBookingResponse?.booking) return;
    setSelectedBooking(selectedTourBookingResponse.booking);
  }, [selectedTourBookingResponse]);

  const { data: selectedFormResponseData, isLoading: isLoadingFormResponseDetails } =
    useQueryService<Record<string, never>, GetFormResponseByIdResponse>({
      service: formDynamicEndpoints.getFormResponseById(selectedFormResponseId ?? 0),
      options: {
        enabled: selectedFormResponseId != null,
        keys: ["formResponseById", String(selectedFormResponseId ?? "")],
      },
    });

  const openAdmissionView = (application: AdmissionApplication) => {
    if (application.recordType === "form_response") {
      setSelectedTourBookingId(null);
      setSelectedBooking(null);
      setSelectedFormResponseId(application.id);
      return;
    }
    setSelectedFormResponseId(null);
    setSelectedBooking(null);
    setSelectedTourBookingId(application.id);
  };

  const renderRowActions = (application: AdmissionApplication) => {
    const normalizedStatus = application.status.trim().toLowerCase();
    const offerActionLabel = normalizedStatus === "offer sent" ? "Resend Offer" : "Send Offer";
    const shouldShowOfferAction = normalizedStatus !== "accepted";

    return (
      <OwnerRowActions
        customActions={[
          { label: "View", onClick: () => openAdmissionView(application) },
          ...(shouldShowOfferAction
            ? [
              {
                label: offerActionLabel,
                disabled: isResendingOffer,
                onClick: () => {
                  void resendOfferForAdmission(application);
                },
              },
            ]
            : []),
          ...(normalizedStatus === "offer sent" ? [{
            label:
              isWithdrawingAdmission && selectedWithdrawId === application.id
                ? "Withdrawing..."
                : "Withdraw",
            disabled: isWithdrawingAdmission,
            onClick: () => setWithdrawTarget(application),
          }] : []),
        ]}
      />
    );
  };

  const formatChild = (c: AdmissionChild) => {
    return `${c.firstName} ${c.lastName}`.trim();
  };

  const rows = admissions.map((app) => ({
    0: app.parents,
    1: <Typography className="!text-[13px] !font-medium sm:max-w-[220px] truncate">{app.children?.length ? app.children.map(formatChild).join(", ") : "—"}</Typography>,
    2: app.applicationDate,
    3: getStatusBadge(app.status),
    4:
      (isResendingOffer && app.id === selectedBookedTourId) ||
        (isWithdrawingAdmission && app.id === selectedWithdrawId) ? (
        <CircularProgress className="!text-primary-text-dark" size={20} thickness={7} />
      ) : (
        renderRowActions(app)
      ),
  }));

  return (
    <>
      <Box className="space-y-6">
        <Box className="w-full flex items-center justify-between gap-4">
          <SearchTextfield
            onChange={handleSearch}
            placeholder="Search by name, status, etc"
            fullWidth
            className="max-w-full md:w-96 md:max-w-112.5 bg-white"
          />
        </Box>

        <div className="md:hidden flex flex-col gap-3">
          {isLoading
            ? Array.from({ length: rowsPerPage }).map((_, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-[#E4E7EC] bg-white p-4 h-32 animate-pulse"
              />
            ))
            : admissions.map((app) => (
              <MobileAdmissionApplicationCard
                key={`${app.recordType}-${app.id}`}
                parents={app.parents}
                childNames={app.children?.length ? app.children.map(formatChild).join(", ") : "—"}
                applicationDate={app.applicationDate}
                statusBadge={getStatusBadge(app.status)}
                actionComponent={renderRowActions(app)}
              />
            ))}

          {!!admissions.length && (
            <Box className="flex justify-center pt-2">
              <PaginationControls
                currentPage={currentPage}
                rowsPerPage={rowsPerPage}
                totalItems={totalItems}
                onPageChange={handlePageChange}
                isCondense
                bottomTableClasses="!text-xs"
              />
            </Box>
          )}
        </div>

        <div className="hidden md:block">
          <Table
            headers={headers}
            tableData={rows}
            centeredHeaderIndex={[2, 3]}
            rightAlignedIndex={[4]}
            isCollapse
            isLoading={isLoading}
          />

          <div className="flex justify-center pt-4">
            <PaginationControls
              currentPage={currentPage}
              rowsPerPage={rowsPerPage}
              totalItems={totalItems}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </Box>

      <ViewTourBookingModal
        isOpen={!!selectedBooking}
        onClose={() => {
          setSelectedBooking(null);
          setSelectedTourBookingId(null);
        }}
        booking={selectedBooking}
      />

      <FormResponseDetailModal
        isOpen={selectedFormResponseId != null}
        onClose={() => setSelectedFormResponseId(null)}
        response={selectedFormResponseData?.response ?? null}
        isLoading={isLoadingFormResponseDetails}
      />

      <ConfirmModal
        open={!!withdrawTarget}
        onClose={() => {
          if (!isWithdrawingAdmission) {
            setWithdrawTarget(null);
          }
        }}
        onConfirm={async () => {
          if (!withdrawTarget) return;
          await withdrawAdmission(withdrawTarget);
          setWithdrawTarget(null);
        }}
        title="Are you sure you want to withdraw this admission?"
        description="This will update the admission status to withdrawn."
        confirmLabel="Withdraw"
        confirmLabelClassName="!bg-[#D92D20]"
        cancelLabel="Cancel"
        loading={isWithdrawingAdmission}
      />
    </>
  );
};

export default AdmissionPage;
