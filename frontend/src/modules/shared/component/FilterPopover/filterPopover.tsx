"use client";

import { Popover } from "@mui/material";
import React, { ReactNode } from "react";

export type FilterOption = {
  label: ReactNode;
  value: string;
};

type FilterPopoverProps = {
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  options: FilterOption[];
  onSelect: (value: string) => void;
  width?: number | string;
  /** Called when the list is scrolled near the bottom — use to trigger fetchNextPage */
  onScrollEnd?: () => void;
};

export default function FilterPopover({
  open,
  anchorEl,
  onClose,
  options,
  onSelect,
  width = 180,
  onScrollEnd,
}: FilterPopoverProps) {
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!onScrollEnd) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 20) {
      onScrollEnd();
    }
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      slotProps={{
        root: {
          className: "!z-[80]  rounded bg-black/20 !bg-opacity-50",
        },
        paper: {
          className: `!bg-white !p-4 !max-h-80 !rounded-md flex flex-col text-left !gap-3 !mt-2 
          !shadow-[0px_0px_40px_rgba(0,0,0,0.1)] overflow-y-auto`,
          style: { width },
          onScroll: handleScroll,
        },
      }}
    >
      {options.map((opt, index) => (
        <button
          key={index}
          className="text-sm! 2xl:text-xs! p-1 flex flex-row gap-2 !text-nowrap w-full items-center cursor-pointer"
          onClick={() => {
            onSelect?.(opt.value);
            onClose();
          }}
        >
          {opt.label}
        </button>
      ))}
    </Popover>
  );
}
