"use client";

import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { format } from "date-fns";
import { EventDetailsModalProps } from "../EventTypes";
import type { BookedTour } from "@/services/tour.service";
import CloseIcon from "@/modules/shared/assets/svgs/closeIcon.svg";
import ClockIcon from "@/modules/shared/assets/svgs/clock-Icon.svg";
import CalendarIcon from "@/modules/shared/assets/svgs/calendar.svg";
import DotsIcon from "@/modules/shared/assets/svgs/dots.svg";
import { useModalRoute } from "@/utils/hooks/useModalRoute";
import { ModalRoute } from "@/routes/modalRoutes";

const EventDetailsModal: React.FC<EventDetailsModalProps> = ({ event, onClose, position, onViewTourDetails }) => {
  const [showActions, setShowActions] = useState(false);
  const { openModal } = useModalRoute();
  const modalRef = useRef<HTMLDivElement>(null);

  // Calculate modal width (320px = w-80) and adjust to stay within container bounds
  const modalWidth = 320; // w-80 = 320px
  const offset = modalWidth / 2; // Half width for centering
  
  // Calculate adjusted left position to keep modal within container bounds
  const initialLeft = position ? position.x - offset : 0;
  const [adjustedLeft, setAdjustedLeft] = useState(initialLeft);
  
  // Get container bounds to ensure modal stays within
  useLayoutEffect(() => {
    if (!modalRef.current || !position) return;
    
    const container = modalRef.current.closest('.bg-white.relative') as HTMLElement;
    if (!container) {
      setAdjustedLeft(position.x - offset);
      return;
    }
    
    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width;
    
    // Calculate desired left position (centered on click point)
    let leftPosition = position.x - offset;
    
    // Ensure modal doesn't go outside left edge
    if (leftPosition < 0) {
      leftPosition = 0;
    }
    
    // Ensure modal doesn't go outside right edge
    if (leftPosition + modalWidth > containerWidth) {
      leftPosition = containerWidth - modalWidth;
    }
    
    setAdjustedLeft(leftPosition);
  }, [position, offset, modalWidth]);

  // Handle click outside to close modal
  useEffect(() => {
    if (!event || !position) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        // Don't close if clicking on the actions dropdown
        const actionsDropdown = document.querySelector('.absolute.z-60');
        if (actionsDropdown && actionsDropdown.contains(event.target as Node)) {
          return;
        }
        onClose();
      }
    };

    // Add event listener after a short delay to avoid immediate closure
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose, event, position]);

  if (!event || !position) return null;

  // Destructure event data
  const { title, start, extendedProps } = event;

  // Format the date/time string
  const formattedTime = start ? format(start, "hh:mm a") : "N/A";
  const formattedDate = start ? format(start, "EEEE, do MMMM, yyyy") : "N/A";

  const modalStyle: React.CSSProperties = {
    position: "absolute",
    top: position.y,
    left: adjustedLeft,
    width: `${modalWidth}px`,
    transform: "translateY(calc(-100% - 8px))",
  };

  const handleDotsClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    setShowActions(true);
  };

  const handleAction = async (action: string) => {
    setShowActions(false);

    // Handle different actions
    switch (action) {
      case "view": {
        const booking = extendedProps?.booking as BookedTour | undefined;
        if (onViewTourDetails && booking) {
          onViewTourDetails(booking);
        }
        break;
      }
      case "reschedule":
        openModal(ModalRoute.rescheduleTour, {
          bookingId: (extendedProps?.bookingId as number)?.toString(),
          tourEventId: (extendedProps?.tourEventId as number)?.toString(),
          slotId: (extendedProps?.slotId as number)?.toString(),
          date: extendedProps?.date as string,
          time: extendedProps?.time as string,
        });
        break;
      case "cancel":
        // Get bookingId from extendedProps and pass it to the cancel modal
        const bookingId = extendedProps?.bookingId as number | undefined;
        if (bookingId) {
          openModal(ModalRoute.cancelTour, { bookingId: bookingId.toString() });
        } else {
          openModal(ModalRoute.cancelTour);
        }
        break;
      default:
        break;
    }
  };
  return (
    // Modal with absolute positioning to scroll with page
    <div
      ref={modalRef}
      style={modalStyle}
      className="bg-white rounded-lg shadow-2xl p-5 w-80 transition-all duration-300 scale-100 border border-gray-200 absolute z-50"
    >
        {/* Header - Title and Close Button */}
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-base font-semibold text-gray-800">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>

        {/* --- Separator --- */}
        <div className="border-t border-gray-100 mb-4"></div>

        {/* Body - Event Details */}
        <div className="space-y-3 text-sm">
          <div className="text-gray-700 mb-3">
            <div className="flex items-center gap-3 mb-4">
              <ClockIcon />
              <p className="font-medium">{formattedTime}</p>
            </div>
            <div className="flex items-center gap-3">
              <CalendarIcon />
              <span className="font-normal">{formattedDate}</span>
            </div>
          </div>

          {extendedProps?.organizer && (
            <div className="flex items-center text-gray-700">
              {/* User Icon */}
              <svg
                className="w-5 h-5 mr-3 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                ></path>
              </svg>
              <p className="text-sm">{extendedProps.organizer}</p>
            </div>
          )}
        </div>

        {/* --- Separator --- */}
        <div className="border-t border-gray-100 my-3"></div>

        {/* Footer - Status and Actions */}
        <div className="flex justify-start gap-5 items-center">
          {/* Status Badge */}
          {extendedProps?.status && (
            <div className="flex items-center gap-3 text-sm">
              Status:
              <div
                className={`px-4 py-1 font-medium rounded-full ${
                  extendedProps.status === "Scheduled"
                    ? "bg-[#0086C9]/10 text-[#0086C9]"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {extendedProps.status}
              </div>
            </div>
          )}

          {/* Action Buttons (Three dots) */}
          <div className="flex space-x-2 relative">
            <button
              onClick={handleDotsClick}
              aria-label="More actions"
              className="p-2 cursor-pointer bg-background-offwhite hover:text-gray-600 rounded-md transition-colors border border-border-gray hover:border-gray-400"
            >
              <DotsIcon />
            </button>

            {/* Custom Actions Modal */}
            {showActions && (
              <div
                className="absolute z-60 bg-white rounded-lg shadow-xl border border-gray-200 min-w-48 top-15 right-10 mt-1"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
              >
                {/* Actions List */}
                <div className="py-1">
                  <button
                    onClick={() => handleAction("view")}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    View Tour Details
                  </button>
                  <button
                    onClick={() => handleAction("reschedule")}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Reschedule Tour
                  </button>
                  <button
                    onClick={() => handleAction("cancel")}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 transition-colors border-t border-gray-100"
                  >
                    Cancel Tour
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
    </div>
  );
};

export default EventDetailsModal;
