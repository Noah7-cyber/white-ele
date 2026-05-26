import { useModalRoute } from "@/utils/hooks/useModalRoute";
import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import ErrorIcon from "@/modules/shared/assets/svgs/erroricon.svg";
import useDeleteTour from "@/modules/admin/component/EventsCalendar/hooks/useDeleteTour";
import { showToast } from "@/modules/shared/component/Toast";

const CancelTourModal = () => {
  const { closeModal } = useModalRoute();
  const searchParams = useSearchParams();
  const { deleteBookedTour, isDeleting } = useDeleteTour();
  const [isProcessing, setIsProcessing] = useState(false);

  // Get bookingId from URL search params
  const bookingIdParam = searchParams.get("bookingId");
  const bookingId = bookingIdParam ? parseInt(bookingIdParam, 10) : null;
  return (
    <div className="bg-white rounded-lg max-w-lg mx-auto min-w-[30vw] px-4 relative z-60">
      {/* Header */}
      <div className="flex items-center justify-center mb-4">
        <ErrorIcon />
      </div>
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Are you sure you want to cancel tour?
        </h3>
        <p className="text-sm text-gray-600">
          Your booking details will be lost and you may need to reschedule if you change your mind.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center space-x-2 mb-3">
        <button
          onClick={() => closeModal()}
          className="w-1/3 px-2 py-2 text-sm cursor-pointer font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          onClick={async () => {
            if (!bookingId) {
              showToast({
                message: "Error",
                description: "Booking ID is missing. Please try again.",
                severity: "error",
                duration: 3000,
              });
              return;
            }

            try {
              setIsProcessing(true);
              await deleteBookedTour(bookingId);
              closeModal();
              // Dispatch custom event to trigger calendar refresh
              window.dispatchEvent(new CustomEvent('tourDeleted'));
            } catch (error) {
              // Error is already handled in deleteBookedTour
              console.error("Failed to cancel tour", error);
            } finally {
              setIsProcessing(false);
            }
          }}
          disabled={isDeleting || isProcessing || !bookingId}
          className="w-1/3 px-2 py-2 text-sm cursor-pointer font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDeleting || isProcessing ? "Cancelling..." : "Yes, Cancel Tour"}
        </button>
      </div>
    </div>
  );
};

export default CancelTourModal;
