"use client";

import React from "react";
// import Image from "next/image";
import { Box, Typography } from "@mui/material";
import { Modal } from "@/modules/shared/component/modal";
import { Button } from "@/modules/shared/component/Button";
import CloseIcon from "@/modules/shared/assets/svgs/closeIcon.svg";
import ArrowLeftIcon from "@/modules/shared/assets/svgs/arrow-left.svg";
import useChildDetailModal from "./hooks/useChildDetailModal";
import InitialsAvatar from "@/modules/shared/component/InitialsAvatar/InitialsAvatar";

export interface Child {
  id: string;
  name: string;
  studentId: string;
  classroom: string;
  age: string;
  photoUrl?: string;
  currentStatus: "Signed In" | "Signed Out";
  status: "Punctual" | "Late";
  lastClockInTime?: string;
  lastClockInDate?: string;
  currentClockInTime?: string;
  schedule: string[];
}
interface ChildDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  child: Child | null;
  parentId: number;
  onClockIn: (notes: string) => void;
  onClockOut: (notes: string) => void;
  isClockedIn: boolean;
}

const ChildDetailModal: React.FC<ChildDetailModalProps> = ({
  isOpen,
  onClose,
  child,
  parentId,
  onClockIn,
  onClockOut,
  isClockedIn,
}) => {
  const { notes, setNotes, isRecording, isClockInBlockedBySchedule, handleAction, handleClose, formatLastClockIn } = useChildDetailModal({
    child,
    parentId,
    isClockedIn,
    onClose,
    onClockIn,
    onClockOut,
  });


  if (!child) return null;

  function getStatusBadge(status: string) {
    const base = "px-4 py-[3px] text-xs font-medium rounded-full text-center";
    if (status.toLowerCase().includes("late"))
      return <span className={`${base} bg-red-100 text-red-600`}>Late</span>;
    return <span className={`${base}  bg-green-100 text-green-600`}>Punctual</span>;
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="w-[92vw] max-w-xl rounded-xl">
      <Box className="flex max-h-[85dvh] flex-col gap-4 overflow-y-auto p-4 sm:p-5">
        {/* Modal Header */}
        <Box className="flex items-center justify-between gap-2 border-b border-gray-200 pb-3">
          <button
            onClick={handleClose}
            className="cursor-pointer"
            aria-label="Go back"
            title="Go back"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <Typography className="line-clamp-2 flex-1 text-center text-sm! font-semibold! text-gray-800! sm:text-base!">
            {isClockedIn ? `Clock Out for ${child.name}` : `Clock In for ${child.name}`}
          </Typography>
          <button
            onClick={handleClose}
            className="cursor-pointer"
            aria-label="Close modal"
            title="Close"
          >
            <CloseIcon />
          </button>
        </Box>

        {/* Child Details */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Box className="flex items-center gap-3 pb-1 sm:pb-3">
            <InitialsAvatar
              src={child.photoUrl}
              name={child.name}
              className="w-14 h-14 shrink-0"
              initialsClassName="text-base"
            />
            <div className="flex-1 min-w-0">
              <Typography className="text-sm! font-semibold! text-gray-800! mb-0.5!">
                {child.name}
              </Typography>
              <Typography className="text-xs! text-gray-500! font-normal! mb-0.5!">
                {child.studentId}
              </Typography>
              <Typography className="text-xs! text-gray-500! font-normal! mb-0.5!">
                {child.classroom}
              </Typography>
              <Typography className="text-xs! text-gray-500! font-normal!">{child.age}</Typography>
            </div>
          </Box>
          <Typography className="flex items-start gap-1 text-sm! font-medium! sm:items-center sm:text-right">
            <span>Status</span> <span>{getStatusBadge(child.status)}</span>
          </Typography>
        </div>

        {/* Status Information */}
        <Box className="grid gap-3 rounded-lg border-b border-gray-200 bg-bg-color p-4 sm:grid-cols-2 sm:items-center sm:p-5">
          <Typography className="flex flex-col items-start gap-1 text-sm! font-medium! text-gray-800!">
            <span className="text-gray-600 font-normal!">Current Status:</span>{" "}
            <span>
              {isClockedIn && child.currentClockInTime
                ? `Clocked-In • ${child.currentClockInTime}`
                : child.currentStatus}
            </span>
          </Typography>

          <Typography className="flex flex-col gap-1 text-sm! font-normal! text-gray-700!">
            <span>Last Clock-In Time & Date:</span>{" "}
            <span className="text-black">
              {formatLastClockIn(child.lastClockInTime || "", child.lastClockInDate || "")}
            </span>
          </Typography>
        </Box>

        {/* Notes Section */}
        <Box className="flex flex-col gap-2">
          <Typography className="text-sm! font-medium! text-gray-800!">Notes (optional)</Typography>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes (e.g, late pick-up, special instructions)..."
            className="w-full resize-none rounded-lg border border-gray-300 p-3 text-sm! text-gray-700! focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#008080]"
            rows={3}
          />
        </Box>

        {/* Clock In/Out Button */}
        <Button
          className={`text-white! rounded-lg! ${
            isClockInBlockedBySchedule ? "bg-gray-300! text-gray-600!" : "bg-[#008080]! hover:bg-[#006666]!"
          }`}
          fullWidth
          onClick={handleAction}
          disabled={isRecording || isClockInBlockedBySchedule}
          sx={{
            textTransform: "none",
            height: "44px",
            py: 1,
          }}
        >
          {isRecording ? (isClockedIn ? "Clocking Out..." : "Clocking In...") : isClockedIn ? "Clock Out" : "Clock In"}
        </Button>
        {isClockInBlockedBySchedule && (
          <Typography className="!text-xs !font-medium !text-red-600 text-center">
            Not scheduled for today
          </Typography>
        )}
      </Box>
    </Modal>
  );
};

export default ChildDetailModal;
