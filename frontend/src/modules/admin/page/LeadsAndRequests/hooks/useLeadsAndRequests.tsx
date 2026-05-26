/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useCallback, useState, ChangeEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { useFilter } from "@/utils/hooks/useFilter";
import { ITEMS_PER_PAGE } from "@/constants";
import {
  scheduleTourServices,
  BookedTour,
  AdmissionBooking,
  GetAdmissionBookingsResponse,
  tourDynamicEndpoints,
} from "@/services/tour.service";
import { showToast } from "@/modules/shared/component/Toast";
import client from "@/utils/client";
import { useDebouncer } from "@/utils/hooks/useDebouncer";
import { formDynamicEndpoints } from "@/services/form.service";

export interface LeadAndRequest {
  recordType: "tour_booking" | "form_response";
  parents: string; // Display as string (joined array)
  parentsArray?: string[]; // Store original array
  date: string;
  time?: string;
  dateTime?: string;
  status: string;
  source: string;
  bookingId: number;
  tourEventId?: number;
  slotId?: number;
  booking?: BookedTour; // Full API booking for View modal
}

const useLeadsAndRequests = () => {
  const queryClient = useQueryClient();
  const { filters, applyFilters } = useFilter({
    search: "",
    delta: ITEMS_PER_PAGE,
    pos: 0,
  });

  const { debouncedSearch, setSearch } = useDebouncer();

  // Fetch booked tours - fetch a large batch to support client-side filtering and pagination
  const {
    data: admissionBookingsResponse,
    isLoading,
    refetch,
  } = useQueryService<any, GetAdmissionBookingsResponse>({
    service: {
      ...scheduleTourServices.getAdmissionBookings,
      data: {
        delta: Number(filters?.delta ?? ITEMS_PER_PAGE),
        pos: Number(filters?.pos ?? 0),
        search: debouncedSearch,
        isAdmission: false,
      },
    },
  });

  const leadsAndRequests: LeadAndRequest[] = useMemo(() => {
    const bookings: AdmissionBooking[] = admissionBookingsResponse?.bookings || [];

    return bookings.map((booking) => {
      const dateValue = booking.createdAt || booking.date || "";
      const formattedDate = dateValue
        ? new Date(dateValue).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "N/A";

      const statusMap: Record<string, string> = {
        tour_booked: "Tour booked",
        "tour booked": "Tour booked",
        rescheduled: "Rescheduled",
        completed: "Completed",
        cancelled: "Cancelled",
        accepted: "Accepted",
        rejected: "Rejected",
        offer_sent: "Offer sent",
        submitted: "Submitted",
      };
      const displayStatus = statusMap[booking.status?.toLowerCase()] || booking.status || "—";
      const finalStatus = booking.complete === true ? "Completed" : displayStatus;

      const parentsArray = Array.isArray(booking.names) ? booking.names : [];
      const parentsDisplay = parentsArray.length > 0 ? parentsArray.join(", ") : "";
      const guests = Array.isArray(booking.guests) ? booking.guests : [];
      const viewBooking: BookedTour = {
        id: booking.id,
        names: parentsArray,
        email: booking.email,
        note: booking.note ?? "",
        referralSource: booking.referralSource,
        guests,
        date: booking.date,
        status: booking.status,
        accepted: booking.accepted ?? undefined,
        complete: booking.complete ?? undefined,
        createdAt: booking.createdAt,
        slot: {
          id: 0,
          availabilityId: 0,
          date: booking.date,
          startTime: "00:00:00",
          booked: false,
        },
        availability: {
          day: "",
          startHour: 0,
          startMinute: 0,
          startMeridiem: "",
          endHour: 0,
          endMinute: 0,
          endMeridiem: "",
          id: 0,
          startTime: "",
          endTime: "",
          createdAt: booking.createdAt,
          updatedAt: booking.createdAt,
          slots: [],
        },
        tourEvent: {
          id: booking.tourEventId ?? 0,
          title: "",
          description: "",
          url: "",
          duration: 0,
          location: "",
          beforeTour: 0,
          afterTour: 0,
          minimumNotice: 0,
          minimumNoticeUnit: "",
          limitTotalTourDuration: false,
          timeSlotInterval: 0,
          status: "",
          limitNumberOfUpcomingTours: false,
          createdAt: booking.createdAt,
          updatedAt: booking.createdAt,
        },
      };

      return {
        recordType: booking.type,
        parents: parentsDisplay,
        parentsArray,
        date: formattedDate,
        time: "",
        dateTime: booking.date || "",
        status: finalStatus,
        source: booking.referralSource || "N/A",
        bookingId: booking.id,
        tourEventId: booking.tourEventId ?? undefined,
        slotId: booking?.slot?.id,
        booking: viewBooking,
      };
    });
  }, [admissionBookingsResponse]);
  // Pagination calculations based on filtered list
  const posVal = Number(filters?.pos ?? 0) || 0;
  const deltaVal = Number(filters?.delta ?? ITEMS_PER_PAGE) || ITEMS_PER_PAGE;
  const currentPage = Math.floor(posVal / deltaVal) + 1;

  const totalItems = admissionBookingsResponse?.pagination?.count ?? leadsAndRequests.length;
  const totalPages = Math.ceil(totalItems / deltaVal) || 1;

  // Delete booked tour functionality
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteBookedTour = useCallback(
    async (bookingId: number) => {
      try {
        setIsDeleting(true);

        const deleteEndpoint = tourDynamicEndpoints.deleteBookedTour(bookingId);
        await client.request({
          path: deleteEndpoint.path,
          method: deleteEndpoint.method,
        });

        showToast({
          message: "Tour Deleted",
          description: "The booked tour has been successfully deleted.",
          severity: "success",
          duration: 3000,
        });

        await refetch();
      } catch (error: any) {
        showToast({
          message: "Error",
          description: error?.response?.data?.message || "Unable to delete booked tour.",
          severity: "error",
          duration: 3000,
        });
        throw error;
      } finally {
        setIsDeleting(false);
      }
    },
    [refetch],
  );

  // Complete booked tour functionality
  const [isCompleting, setIsCompleting] = useState(false);
  const [completingBookingId, setCompletingBookingId] = useState<number | null>(null);

  const completeBookedTour = useCallback(
    async (bookingId: number) => {
      try {
        setIsCompleting(true);
        setCompletingBookingId(bookingId);

        const updateEndpoint = tourDynamicEndpoints.updateBookedTour(bookingId);
        await client.request({
          path: updateEndpoint.path,
          method: updateEndpoint.method,
          data: {
            accepted: true,
            complete: true,
            status: "completed",
          },
        });

        showToast({
          message: "Tour Completed",
          description: "The booked tour has been marked as completed successfully.",
          severity: "success",
          duration: 3000,
        });

        // Refetch the data after successful update
        await refetch();
      } catch (error: any) {
        showToast({
          message: "Error",
          description: error?.response?.data?.message || "Unable to complete booked tour.",
          severity: "error",
          duration: 3000,
        });
        throw error;
      } finally {
        setIsCompleting(false);
        setCompletingBookingId(null);
      }
    },
    [refetch],
  );

  const [isCompletingFormResponse, setIsCompletingFormResponse] = useState(false);
  const [completingFormResponseId, setCompletingFormResponseId] = useState<number | null>(null);

  const completeFormResponse = useCallback(
    async (responseId: number) => {
      try {
        setIsCompletingFormResponse(true);
        setCompletingFormResponseId(responseId);
        const endpoint = formDynamicEndpoints.patchFormResponseStatus(responseId);
        await client.request({
          path: endpoint.path,
          method: endpoint.method,
          data: { status: "completed" },
        });

        showToast({
          message: "Response updated",
          description: "The form response has been marked as completed.",
          severity: "success",
          duration: 3000,
        });

        await refetch();
        await queryClient.invalidateQueries({
          queryKey: ["formResponseById", String(responseId)],
        });
      } catch (error: any) {
        showToast({
          message: "Error",
          description: error?.response?.data?.message || "Unable to update form response.",
          severity: "error",
          duration: 3000,
        });
        throw error;
      } finally {
        setIsCompletingFormResponse(false);
        setCompletingFormResponseId(null);
      }
    },
    [refetch, queryClient],
  );

  // Reschedule booked tour functionality
  const [isRescheduling, setIsRescheduling] = useState(false);

  const rescheduleBookedTour = useCallback(
    async (bookingId: number, date: string, startTime: string, slotId: number) => {
      try {
        setIsRescheduling(true);

        const updateEndpoint = tourDynamicEndpoints.updateBookedTour(bookingId);
        await client.request({
          path: updateEndpoint.path,
          method: updateEndpoint.method,
          data: {
            complete: false,
            reschedule: {
              slotId,
              date,
              startTime,
            },
          },
        });

        showToast({
          message: "Tour Rescheduled",
          description: "The booked tour has been rescheduled successfully.",
          severity: "success",
          duration: 3000,
        });

        await refetch();
      } catch (error: any) {
        showToast({
          message: "Error",
          description: error?.response?.data?.message || "Unable to reschedule booked tour.",
          severity: "error",
          duration: 3000,
        });
        throw error;
      } finally {
        setIsRescheduling(false);
      }
    },
    [refetch],
  );

  // Handle page change
  const handlePageChange = ({ page, rowsPerPage }: { page: number; rowsPerPage: number }) => {
    applyFilters({
      ...filters,
      delta: rowsPerPage,
      pos: (page - 1) * rowsPerPage,
    });
  };

  const handleSearch = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    applyFilters({
      ...filters,
      pos: 0,
    });
    setSearch(e.target.value);
  };

  return {
    leadsAndRequests,
    isLoading: isLoading,
    refetch,
    deleteBookedTour,
    isDeleting,
    completeBookedTour,
    isCompleting,
    completingBookingId,
    completeFormResponse,
    isCompletingFormResponse,
    completingFormResponseId,
    rescheduleBookedTour,
    isRescheduling,
    currentPage,
    totalItems,
    totalPages,
    rowsPerPage: deltaVal,
    handlePageChange,
    filters,
    applyFilters,
    handleSearch,
  };
};

export default useLeadsAndRequests;
