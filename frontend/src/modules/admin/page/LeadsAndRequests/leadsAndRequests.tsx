"use client";

import React, { useEffect, useState } from "react";
import { Box, CircularProgress } from "@mui/material";
import { Table } from "@/modules/shared/component/Table";
import { PaginationControls } from "@/modules/shared/component/Pagination";
import OwnerRowActions from "@/modules/admin/component/OwnerRowActions/ownerRowActions";
import { headers } from "./constants";
import useLeadsAndRequests from "./hooks/useLeadsAndRequests";
import { useSendOffer } from "./hooks/useSendOffer";
import CancelTourModalForLeads from "@/modules/admin/component/EventModal/CancelTourModalForLeads";
import RescheduleTourModal from "@/modules/admin/component/EventModal/RescheduleTourModal";
import ViewTourBookingModal from "@/modules/admin/component/EventModal/ViewTourBookingModal";
import SendOfferModal from "@/modules/admin/component/EventModal/SendOfferModal";
import SendOfferEmailModal from "@/modules/admin/component/EventModal/SendOfferEmailModal";
import {
  BookedTour,
  GetTourBookingByIdResponse,
  tourDynamicEndpoints,
} from "@/services/tour.service";
import { SearchTextfield } from "@/modules/shared/component/SearchTextfield";
import { useQueryService } from "@/utils/hooks/useQueryService";
import FormResponseDetailModal from "./FormResponseDetailModal";
import { formDynamicEndpoints, GetFormResponseByIdResponse } from "@/services/form.service";
import { MobileLeadRequestCard } from "@/modules/admin/component/MobileLeadRequestCard";

function getStatusBadge(status: string) {
  const base = "px-4 py-[3px] text-xs font-medium rounded-full text-center";
  switch (status.trim().toLowerCase()) {
    case "completed":
      return <span className={`${base} bg-[#EDFFF7] text-success-green`}>Completed</span>;
    case "rescheduled":
      return <span className={`${base} bg-[#FEB92B26] text-[#FEB92B]`}>Rescheduled</span>;
    case "tour booked":
      return <span className={`${base} bg-[#FEB92B26] text-[#FEB92B]`}>Tour booked</span>;
    case "submitted":
      return <span className={`${base} bg-[#FEB92B26] text-[#FEB92B]`}>Submitted</span>;
    case "accepted":
      return <span className={`${base} bg-[#EDFFF7] text-success-green`}>Accepted</span>;
    case "rejected":
      return <span className={`${base} bg-[#CF000B1A] text-badge-red`}>Rejected</span>;
    case "cancelled":
      return <span className={`${base} bg-[#CF000B1A] text-badge-red`}>Canceled</span>;
    default:
      return <span className={base}>{status}</span>;
  }
}

const LeadsAndRequests = () => {
  const {
    leadsAndRequests,
    isLoading,
    currentPage,
    totalItems,
    rowsPerPage,
    handlePageChange,
    deleteBookedTour,
    completeBookedTour,
    isCompleting,
    completingBookingId,
    completeFormResponse,
    isCompletingFormResponse,
    completingFormResponseId,
    rescheduleBookedTour,
    isRescheduling,
    handleSearch,
    refetch,
  } = useLeadsAndRequests();

  const {
    classroomOptions,
    isLoadingClassrooms,
    showSendOfferModal,
    showSendOfferEmailModal,
    openSendOfferModal,
    closeSendOfferModal,
    closeSendOfferEmailModal,
    emailData,
    addAttachment,
    removeAttachment,
    control,
    items,
    addRow,
    removeRow,
    updateItem,
    children,
    addChild,
    removeChild,
    submitGenerateOffer,
    handleSendFinalOffer,
    isSendingOffer,
    isUploadingDocuments,
  } = useSendOffer(() => {
    void refetch();
  });

  // View modals state
  const [selectedBooking, setSelectedBooking] = useState<BookedTour | null>(null);
  const [selectedFormResponseId, setSelectedFormResponseId] = useState<number | null>(null);

  const [selectedTourBookingId, setSelectedTourBookingId] = useState<number | null>(null);
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

  // Cancel modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedCancelBookingId, setSelectedCancelBookingId] = useState<number | null>(null);
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);

  // Reschedule modal state
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedRescheduleBookingId, setSelectedRescheduleBookingId] = useState<number | null>(
    null,
  );
  const [selectedTourEventId, setSelectedTourEventId] = useState<number | undefined>(undefined);
  const [selectedSlotId, setSelectedSlotId] = useState<number | undefined>(undefined);
  const [initialRescheduleDate, setInitialRescheduleDate] = useState<string | undefined>(undefined);
  const [initialRescheduleTime, setInitialRescheduleTime] = useState<string | undefined>(undefined);

  const openCancelModal = (bookingId: number) => {
    setSelectedCancelBookingId(bookingId);
    setShowCancelModal(true);
  };

  const closeCancelModal = () => {
    setShowCancelModal(false);
    setSelectedCancelBookingId(null);
    setIsConfirmingCancel(false);
  };

  const handleConfirmCancel = async () => {
    if (!selectedCancelBookingId) return;

    try {
      setIsConfirmingCancel(true);
      await deleteBookedTour(selectedCancelBookingId);
      closeCancelModal();
    } catch (error) {
      // Error toast is handled inside deleteBookedTour
      console.error("Failed to cancel tour", error);
    } finally {
      setIsConfirmingCancel(false);
    }
  };

  const openRescheduleModal = (
    bookingId: number,
    tourEventId?: number,
    slotId?: number,
    date?: string,
    time?: string,
  ) => {
    setSelectedRescheduleBookingId(bookingId);
    setSelectedTourEventId(tourEventId);
    setSelectedSlotId(slotId);
    setInitialRescheduleDate(date);
    setInitialRescheduleTime(time);
    setShowRescheduleModal(true);
  };

  const closeRescheduleModal = () => {
    setShowRescheduleModal(false);
    setSelectedRescheduleBookingId(null);
    setSelectedTourEventId(undefined);
    setSelectedSlotId(undefined);
    setInitialRescheduleDate(undefined);
    setInitialRescheduleTime(undefined);
  };

  const handleConfirmReschedule = async (date: string, time: string) => {
    if (!selectedRescheduleBookingId || !selectedSlotId) return;

    try {
      await rescheduleBookedTour(selectedRescheduleBookingId, date, time, selectedSlotId);
      closeRescheduleModal();
    } catch (error) {
      console.error("Failed to reschedule tour", error);
    }
  };

  const renderRowActions = (lead: (typeof leadsAndRequests)[0]) => {
    const isCurrentFormResponseCompleting =
      isCompletingFormResponse && completingFormResponseId === lead.bookingId;
    const isCurrentTourCompleting = isCompleting && completingBookingId === lead.bookingId;

    if (lead.recordType === "form_response") {
      const formStatus = lead.status.trim().toLowerCase();

      const openFormResponseView = () => {
        setSelectedTourBookingId(null);
        setSelectedFormResponseId(lead.bookingId);
      };

      const viewAction = {
        label: "View",
        onClick: openFormResponseView,
      };

      if (formStatus === "submitted") {
        return (
          <OwnerRowActions
            status={lead.status}
            customActions={[
              viewAction,
              {
                label: isCurrentFormResponseCompleting ? "Updating..." : "Mark as completed",
                disabled: isCurrentFormResponseCompleting,
                onClick: async () => {
                  await completeFormResponse(lead.bookingId);
                },
              },
            ]}
          />
        );
      }

      if (formStatus === "completed") {
        return (
          <OwnerRowActions
            status={lead.status}
            customActions={[
              viewAction,
              {
                label: "Send Offer",
                onClick: () => openSendOfferModal(lead),
              },
            ]}
          />
        );
      }

      return <OwnerRowActions status={lead.status} customActions={[viewAction]} />;
    }

    return (
      <OwnerRowActions
        onView={() => {
          if (lead.recordType === "tour_booking") {
            setSelectedFormResponseId(null);
            setSelectedTourBookingId(lead.bookingId);
            return;
          }
          setSelectedTourBookingId(null);
          setSelectedFormResponseId(lead.bookingId);
        }}
        onEdit={() => console.log("edit", lead.bookingId)}
        onCancel={() => {
          openCancelModal(lead.bookingId);
        }}
        status={lead.status}
        isCompleting={isCurrentTourCompleting}
        completeLabel={isCurrentTourCompleting ? "Updating..." : "Mark as Complete"}
        onComplete={async () => {
          await completeBookedTour(lead.bookingId);
        }}
        onReschedule={() => {
          openRescheduleModal(
            lead.bookingId,
            lead.tourEventId,
            lead.slotId,
            lead.dateTime,
            lead.time,
          );
        }}
        onOfferSent={() => openSendOfferModal(lead)}
      />
    );
  };

  const rows = leadsAndRequests.map((lead) => ({
    0: lead.parents || "—", // Parent(s)
    1: lead.date, // Application Date
    2: getStatusBadge(lead.status), // Status
    3: lead.source, // Source
    4:
      (isCompletingFormResponse && completingFormResponseId === lead.bookingId) ||
      (isCompleting && completingBookingId === lead.bookingId) ? (
        <CircularProgress className="!text-primary-text-dark" size={20} thickness={7} />
      ) : (
        renderRowActions(lead)
      ), // Action
  }));

  return (
    <>
      <Box className="space-y-6">
        <Box className="w-full flex items-center justify-between gap-4">
          <SearchTextfield
            onChange={handleSearch}
            placeholder="Search by name, status, source, etc"
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
            : leadsAndRequests.map((lead) => (
                <MobileLeadRequestCard
                  key={`${lead.recordType}-${lead.bookingId}`}
                  parents={lead.parents}
                  source={lead.source}
                  date={lead.date}
                  statusBadge={getStatusBadge(lead.status)}
                  actionComponent={renderRowActions(lead)}
                />
              ))}

          {!!leadsAndRequests.length && (
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
            centeredHeaderIndex={[1, 2, 3]}
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

      <SendOfferModal
        isOpen={showSendOfferModal}
        onClose={closeSendOfferModal}
        classroomOptions={classroomOptions}
        isLoadingClassrooms={isLoadingClassrooms}
        control={control}
        items={items}
        addRow={addRow}
        removeRow={removeRow}
        updateItem={updateItem}
        childrenData={children}
        addChild={addChild}
        removeChild={removeChild}
        onGenerate={submitGenerateOffer}
      />

      <SendOfferEmailModal
        isOpen={showSendOfferEmailModal}
        onClose={closeSendOfferEmailModal}
        data={emailData}
        onAddAttachment={addAttachment}
        onRemoveAttachment={removeAttachment}
        onSend={(data) => {
          handleSendFinalOffer(data);
        }}
        isLoading={isSendingOffer}
        isUploadingDocuments={isUploadingDocuments}
      />

      <CancelTourModalForLeads
        isOpen={showCancelModal}
        onClose={closeCancelModal}
        onConfirm={handleConfirmCancel}
        isConfirming={isConfirmingCancel}
      />

      <RescheduleTourModal
        isOpen={showRescheduleModal}
        onClose={closeRescheduleModal}
        onConfirm={handleConfirmReschedule}
        isConfirming={isRescheduling}
        initialDate={initialRescheduleDate}
        initialTime={initialRescheduleTime}
        tourEventId={selectedTourEventId}
      />
    </>
  );
};

export default LeadsAndRequests;
