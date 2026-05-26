"use client";

import React from "react";
import CancelIcon from "@/modules/shared/assets/svgs/cancelicon.svg";

interface CancelTourModalForLeadsProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isConfirming?: boolean;
}

const CancelTourModalForLeads: React.FC<CancelTourModalForLeadsProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isConfirming = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg max-w-lg mx-auto min-w-[30vw] px-6 py-6 relative">
        {/* Header Icon */}
        <div className="flex items-center justify-center mb-4">
          <CancelIcon />
        </div>

        {/* Title & Description */}
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Are you sure you want to cancel this tour?
          </h3>
          <p className="text-sm text-gray-600">
            Cancelling will remove the scheduled tour from the system and notify the participant.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center space-x-2 mb-3">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isConfirming}
            className="w-1/3 px-2 py-2 text-sm font-medium cursor-pointer text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConfirming ? "Cancelling..." : "Cancel"}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isConfirming}
            className="w-1/3 px-2 py-2 text-sm font-medium cursor-pointer text-white bg-[#008080] border border-transparent rounded-md hover:bg-[#006666] transition-colors"
          >
            Keep Tour
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelTourModalForLeads;
