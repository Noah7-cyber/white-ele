"use client";

import { Popover } from "@mui/material";
import React, { ReactNode, useState, useEffect } from "react";
import dayjs from "dayjs";
import { Button } from "@/modules/shared/component/Button";
import { DateRangeModal } from "@/modules/shared/component/DateRangeModal";

export type TimeRangeFilterOption = {
  label: ReactNode;
  value: string;
  isActive?: boolean;
};

type TimeRangeFilterPopoverProps = {
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  options: TimeRangeFilterOption[];
  onSelect: (value: string) => void;
  onCustomApply: (startDate: string, endDate: string) => void;
  currentStartDate: string;
  currentEndDate: string;
  width?: number | string;
  customButtonLabel?: string;
  forceOpenCustomModal?: boolean;
  onForceOpenCustomModalHandled?: () => void;
};

export default function TimeRangeFilterPopover({
  open,
  anchorEl,
  onClose,
  options,
  onSelect,
  onCustomApply,
  currentStartDate,
  currentEndDate,
  width = 280,
  customButtonLabel = "Apply",
  forceOpenCustomModal = false,
  onForceOpenCustomModalHandled,
}: TimeRangeFilterPopoverProps) {
  const [showCustomView, setShowCustomView] = useState(false);
  const [customStart, setCustomStart] = useState(currentStartDate);
  const [customEnd, setCustomEnd] = useState(currentEndDate);
  const [rangeError, setRangeError] = useState<string | null>(null);
  const [customModalOpen, setCustomModalOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setShowCustomView(false);
      setCustomStart(currentStartDate);
      setCustomEnd(currentEndDate);
      setRangeError(null);
    }
  }, [open, currentStartDate, currentEndDate]);

  useEffect(() => {
    if (!forceOpenCustomModal) return;
    setCustomModalOpen(true);
    onForceOpenCustomModalHandled?.();
  }, [forceOpenCustomModal, onForceOpenCustomModalHandled]);

  const handleOptionClick = (value: string) => {
    if (value === "Custom") {
      // Custom should open centered date range picker.
      setCustomModalOpen(true);
      return;
    }
    onSelect(value);
    onClose();
  };

  const handleCustomApply = () => {
    const start = customStart;
    const end = customEnd;
    if (!start || !end) {
      setRangeError("Please select both dates");
      return;
    }
    if (dayjs(start).isAfter(dayjs(end))) {
      setRangeError("Start date must be before or equal to end date");
      return;
    }
    setRangeError(null);
    onCustomApply(start, end);
    onClose();
  };

  const handleBack = () => {
    setShowCustomView(false);
    setRangeError(null);
  };

  const presetOptions = options.filter((opt) => opt.value !== "Custom");
  const customOption = options.find((opt) => opt.value === "Custom");

  return (
    <>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={onClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          root: {
            className: "!z-[80] rounded bg-black/20 !bg-opacity-50",
          },
          paper: {
            className: `!bg-white !p-4 !max-h-80 !rounded-md flex flex-col text-left !gap-3 !mt-2 
            !shadow-[0px_0px_40px_rgba(0,0,0,0.1)]`,
            style: { width },
          },
        }}
      >
        {!showCustomView ? (
          <>
            {presetOptions.map((opt, index) => (
              <button
                key={index}
                className="text-sm! 2xl:text-xs! p-1 flex flex-row gap-2 w-full items-center !cursor-pointer"
                onClick={() => handleOptionClick(opt.value)}
              >
                {opt.label}
              </button>
            ))}
            {customOption && (
              <button
                className="text-sm! 2xl:text-xs! p-1 flex flex-row gap-2 w-full items-center !cursor-pointer"
                onClick={() => handleOptionClick(customOption.value)}
              >
                {customOption.label}
              </button>
            )}
          </>
        ) : (
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="text-xs text-left cursor-pointer   text-gray-500 hover:text-gray-700 -mt-1"
            >
              ← Back
            </button>
            {rangeError && <p className="text-xs text-red-500">{rangeError}</p>}
            <Button
              // variant="contained"
              size="small"
              onClick={handleCustomApply}
              className="normal-case! rounded-lg!"
            >
              {customButtonLabel}
            </Button>
          </div>
        )}
      </Popover>

      <DateRangeModal
        open={customModalOpen}
        title="Custom date range"
        startDate={customStart}
        endDate={customEnd}
        onClose={() => {
          setCustomModalOpen(false);
          onClose();
        }}
        onApply={(s, e) => {
          // validate
          if (dayjs(s).isAfter(dayjs(e))) {
            setRangeError("Start date must be before or equal to end date");
            return;
          }
          setCustomStart(s);
          setCustomEnd(e);
          setRangeError(null);
          onCustomApply(s, e);
          setCustomModalOpen(false);
        }}
      />
    </>
  );
}
