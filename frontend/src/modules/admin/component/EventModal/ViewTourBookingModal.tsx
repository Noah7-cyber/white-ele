"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import sucesss from "@/modules/shared/assets/images/success.png";
import { BookedTour } from "@/services/tour.service";
import CloseIcon from "@mui/icons-material/Close";
import { useMediaQuery } from "@mui/material";
import { MobileFormDrawer } from "@/modules/shared/component/MobileFormDrawer/MobileFormDrawer";

interface ViewTourBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookedTour | null;
}

const ViewTourBookingModal: React.FC<ViewTourBookingModalProps> = ({
  isOpen,
  onClose,
  booking,
}) => {
  const isMobile = useMediaQuery("(max-width:768px)");
  const { formattedDate, startTime, endTime, timeZoneShort } =
    useMemo(() => {
      if (!booking?.slot?.date || !booking?.slot?.startTime) {
        return {
          formattedDate: "—",
          startTime: "—",
          endTime: "—",
          timeZoneShort: "",
        };
      }
      const dateStr = booking.slot.date;
      const timeStr = booking.slot.startTime;
      const slotDateTime = new Date(`${dateStr}T${timeStr}`);
      if (Number.isNaN(slotDateTime.getTime())) {
        return {
          formattedDate: "—",
          startTime: "—",
          endTime: "—",
          timeZoneShort: "",
        };
      }
      const duration = booking.tourEvent?.duration ?? 0;
      const formattedDate = slotDateTime.toLocaleDateString("en-GB", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
      const startTime = slotDateTime.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      const endDate = new Date(
        slotDateTime.getTime() + duration * 60000
      );
      const endTime = endDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      const timeZoneShort =
        slotDateTime.toLocaleTimeString("en-US", { timeZoneName: "short" }).split(" ")[2] || "";
      return { formattedDate, startTime, endTime, timeZoneShort };
    }, [booking]);

  if (!isOpen || !booking) return null;

  const location = booking.tourEvent?.location ?? "—";
  const description = booking.tourEvent?.description ?? "—";
  const names = Array.isArray(booking.names) ? booking.names : [];
  const guests = Array.isArray(booking.guests) ? booking.guests : [];

  const dataRow = (label: string, value: React.ReactNode) => (
    <div className="flex flex-col gap-1 py-2 text-sm sm:flex-row sm:gap-4 first:pt-0 last:pb-0 last:border-b-0">
      <p className="shrink-0 font-medium text-[#344054] sm:w-1/4">{label}</p>
      <div className="font-mormal text-[#022F2F] sm:w-3/4">{value}</div>
    </div>
  );

  const content = (
    <div className={isMobile ? "px-0 py-5" : "p-1"}>
      <div className={`rounded-lg bg-white border-gray-100 text-center ${isMobile ? "px-0" : "w-xl p-8"}`}>
        <div className="mb-6 flex justify-center">
          <Image src={sucesss} alt="Success Image" />
        </div>

        <h1 className="mb-2 text-xl font-semibold text-gray-900 sm:text-2xl">
          This tour is scheduled
        </h1>
        <p className="mb-8 border-b border-gray-300 pb-5 text-sm text-gray-500 sm:mb-10">
          We sent an email with a calendar invitation with the details to everyone.
        </p>

        <div className={`space-y-4 text-left ${isMobile ? "" : "pl-5"}`}>
          {dataRow("Description:", <p>{description}</p>)}

          {dataRow(
            "Date/Time:",
            <p className="flex flex-col gap-2 text-xs sm:text-sm">
              <span>{formattedDate}</span>
              <span>
                {startTime} - {endTime}
                {timeZoneShort ? ` (${timeZoneShort})` : ""}
              </span>
            </p>,
          )}

          {dataRow(
            "School:",
            <span className="flex items-center text-xs sm:text-sm">
              {location}{" "}
              <span className="ml-2 rounded-full bg-success-green px-2 py-0.5 text-[9px] font-normal text-white">
                Host
              </span>
            </span>,
          )}

          {dataRow(
            "Parents:",
            <div className="space-y-1 text-xs sm:text-sm">
              {names.length > 0 ? names.map((name, idx) => <p key={idx}>{name}</p>) : <p>—</p>}
              <p className="text-primary-lightGreen/30">{booking.email}</p>
              {guests.map((guest, idx) => (
                <p key={idx} className="text-xs text-primary-lightGreen/30 sm:text-sm">
                  {guest}
                </p>
              ))}
            </div>,
          )}

          {dataRow("Location:", <p className="text-xs sm:text-sm">{location}</p>)}
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <MobileFormDrawer open={isOpen} onClose={onClose} title="Tour Details">
        <div className="px-5">{content}</div>
      </MobileFormDrawer>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative mx-4 max-h-[90vh] max-w-2xl overflow-y-auto rounded-lg bg-white [&::-webkit-scrollbar]:hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 rounded p-1 text-gray-500 hover:bg-gray-100"
          aria-label="Close"
        >
          <span className="text-xl leading-none">
            <CloseIcon />
          </span>
        </button>
        {content}
      </div>
    </div>
  );
};

export default ViewTourBookingModal;
