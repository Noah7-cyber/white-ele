/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { ChangeEvent, useMemo, useState } from "react";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { useFilter } from "@/utils/hooks/useFilter";
import { ITEMS_PER_PAGE } from "@/constants";
import {
  scheduleTourServices,
  BookedTour,
  AdmissionBooking,
  GetAdmissionBookingsResponse,
  tourDynamicEndpoints,
} from "@/services/tour.service";
import { useDebouncer } from "@/utils/hooks/useDebouncer";
import { formDynamicEndpoints } from "@/services/form.service";
import client from "@/utils/client";
import { showToast } from "@/modules/shared/component/Toast";

export interface AdmissionChild {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  classroomId: number;
}

export interface AdmissionApplication {
  id: number;
  recordType: "tour_booking" | "form_response";
  parents: string;
  children: AdmissionChild[];
  applicationDate: string;
  status: string;
  booking?: BookedTour;
}

type ResendOfferPayload =
  | { bookedTourId: number; formResponseId?: never }
  | { formResponseId: number; bookedTourId?: never };

function admissionBookingToViewBooking(booking: AdmissionBooking): BookedTour {
  const parentsArray = Array.isArray(booking.names) ? booking.names : [];
  const guests = Array.isArray(booking.guests) ? booking.guests : [];
  return {
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
}

const useAdmissions = () => {
  const { filters, applyFilters } = useFilter({
    search: "",
    delta: ITEMS_PER_PAGE,
    pos: 0,
  });
  const { debouncedSearch, setSearch } = useDebouncer();

  const [selectedBookedTourId, setSelectedBookedTourId] = useState<string | number>("");
  const [selectedWithdrawId, setSelectedWithdrawId] = useState<number | null>(null);
  const [isWithdrawingAdmission, setIsWithdrawingAdmission] = useState(false);

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
        isAdmission: true,
      },
    },
  });

  const { mutateAsync: resendOffer, isPending: isResendingOffer } = useMutationService<
    ResendOfferPayload,
    { message?: string }
  >({
    service: scheduleTourServices.resendOffer,
    options: {
      successTitle: "Offer Resent",
      successMessage: "Offer email has been resent successfully.",
      errorTitle: "Unable to resend offer",
    },
  });

  const admissions: AdmissionApplication[] = useMemo(() => {
    const bookings: AdmissionBooking[] = admissionBookingsResponse?.bookings || [];

    return bookings.map((booking: AdmissionBooking) => {
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
        withdraw: "Withdrawn",
        withdrawn: "Withdrawn",
      };
      const displayStatus = statusMap[booking.status?.toLowerCase()] || booking.status || "—";

      const parentsArray = Array.isArray(booking.names) ? booking.names : [];
      const parentsDisplay = parentsArray.length > 0 ? parentsArray.join(", ") : "";

      const apiChildren = (booking as any).students as AdmissionChild[] | undefined;
      const children: AdmissionChild[] =
        Array.isArray(apiChildren) && apiChildren.length > 0 ? apiChildren : [];

      return {
        id: booking.id,
        recordType: booking.type,
        parents: parentsDisplay,
        children,
        applicationDate: formattedDate,
        status: displayStatus,
        booking: admissionBookingToViewBooking(booking),
      };
    });
  }, [admissionBookingsResponse]);

  const posVal = Number(filters?.pos ?? 0) || 0;
  const deltaVal = Number(filters?.delta ?? ITEMS_PER_PAGE) || ITEMS_PER_PAGE;
  const currentPage = Math.floor(posVal / deltaVal) + 1;

  const totalItems = admissionBookingsResponse?.pagination?.count ?? admissions.length;

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

  const resendOfferForAdmission = async (application: AdmissionApplication) => {
    setSelectedBookedTourId(application.id);
    const payload: ResendOfferPayload =
      application.recordType === "form_response"
        ? { formResponseId: application.id }
        : { bookedTourId: application.id };

    await resendOffer(payload);
    await refetch();
    setSelectedBookedTourId("");
  };

  const withdrawAdmission = async (application: AdmissionApplication) => {

    try {
      setSelectedWithdrawId(application.id);
      setIsWithdrawingAdmission(true);

      const endpoint = tourDynamicEndpoints.updateBookedTour(application.id);
      await client.request({
        path: endpoint.path,
        method: endpoint.method,
        data: { status: "withdraw" },
      });

      showToast({
        message: "Admission withdrawn",
        description: "The admission has been withdrawn successfully.",
        severity: "success",
        duration: 3000,
      });

      await refetch();
    } catch (error: any) {
      showToast({
        message: "Error",
        description: error?.message || "Unable to withdraw admission.",
        severity: "error",
        duration: 3000,
      });
      throw error;
    } finally {
      setIsWithdrawingAdmission(false);
      setSelectedWithdrawId(null);
    }
  };

  return {
    admissions,
    isLoading,
    refetch,
    currentPage,
    totalItems,
    rowsPerPage: deltaVal,
    handlePageChange,
    handleSearch,
    resendOfferForAdmission,
    selectedBookedTourId,
    isResendingOffer,
    withdrawAdmission,
    selectedWithdrawId,
    isWithdrawingAdmission,
  };
};

export default useAdmissions;
