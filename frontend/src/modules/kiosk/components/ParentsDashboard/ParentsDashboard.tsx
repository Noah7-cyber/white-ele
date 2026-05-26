"use client";

import React from "react";
import { Box, Typography, Checkbox, FormControlLabel } from "@mui/material";
import CloseIcon from "@/modules/shared/assets/svgs/closeIcon.svg";
import ClockIn from "@/modules/shared/assets/svgs/login-white.svg";
import { Button } from "@/modules/shared/component/Button";
import ChildDetailModal from "@/modules/kiosk/components/ChildDetailModal/ChildDetailModal";
import useParentsDashboard from "./hooks/useParentsDashboard";
import InitialsAvatar from "@/modules/shared/component/InitialsAvatar/InitialsAvatar";

const ParentsDashboard = () => {
  const {
    children,
    parentName,
    parentId,
    selectedChildren,
    selectAll,
    selectedChild,
    isModalOpen,
    clockedInChildren,
    clockedOutChildren,
    hasClockedInSelected,
    hasNotClockedInSelected,
    isClockInPending,
    isClockOutPending,
    isParentLoading,
    hasUnscheduledClockInSelected,
    handleSelectAll,
    handleChildSelect,
    handleChildClick,
    handleCloseModal,
    handleBulkClockIn,
    handleBulkClockOut,
    onAttendanceSuccess,
    handleClearSelection,
    isChildClockedIn,
    isChildScheduledForToday,
    canSelectChildForAttendance,
  } = useParentsDashboard();

  if (isParentLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-10">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#008080] mb-4"></div>
        <Typography className="text-gray-500 font-medium">Loading your children&apos;s data...</Typography>
      </div>
    );
  }

  return (
    <div
      className={`mx-auto w-full max-w-screen-2xl flex-1 px-4 sm:px-6 lg:px-8 ${selectedChildren.length > 0 ? "pb-28 sm:pb-32" : "pb-8"}`}
    >
      {/* Greeting Section */}
      <div className="mb-5 rounded-xl border border-[#E4E7EC] bg-white px-4 py-3 sm:px-5 sm:py-4">
        <div className="flex items-start justify-between gap-3 sm:gap-4">
          <Box>
            <div className="mb-1 flex items-center gap-1.5">
              <Typography className="text-lg! font-semibold! text-gray-800! md:text-xl!">
              Good Morning, {parentName}
              </Typography>
              <span className="text-base">✨</span>
            </div>
            <Typography className="text-xs! font-normal! text-gray-500! md:text-sm!">
              Welcome back! Here&apos;s an overview of your dashboard.
            </Typography>
          </Box>
        </div>
      </div>

      {/* Your Children Section */}
      <Box className="mb-3">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Typography className="text-base! font-semibold! text-gray-800!">
              Your Children
            </Typography>
            <div className="rounded bg-white px-1.5 py-0.5">
              <Typography className="text-xs! font-medium! text-gray-800!">
                {children.length}
              </Typography>
            </div>
          </div>
          <FormControlLabel
            className="!mr-0"
            control={
              <Checkbox
                checked={selectAll}
                onChange={handleSelectAll}
                size="small"
                sx={{
                  color: "#D0D5DD",
                  "&.Mui-checked": {
                    color: "#008080",
                  },
                }}
              />
            }
            label={
              <Typography className="text-xs! text-gray-700! font-normal!">Select All</Typography>
            }
          />
        </div>

        {/* Children Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {children.map((child) => {
            const isSelectable = canSelectChildForAttendance(child);
            const isScheduledForToday = isChildScheduledForToday(child);
            return (
              <Box
                key={child.id}
              className={`relative cursor-pointer rounded-2xl border-2 p-4 transition-all duration-200 sm:p-5 ${selectedChildren.includes(child.id)
                ? "bg-[#008080]/5 border-[#008080]"
                : "bg-white border-transparent shadow-sm hover:shadow-md"
                }`}
              onClick={() => handleChildClick(child)}
            >
              <div
                className="absolute right-3 top-3"
                onClick={(e) => e.stopPropagation()}
              >
                <Checkbox
                  checked={selectedChildren.includes(child.id)}
                  onChange={() => handleChildSelect(child.id)}
                  disabled={!isSelectable}
                  size="small"
                  sx={{
                    color: "#D0D5DD",
                    "&.Mui-checked": {
                      color: "#008080",
                    },
                  }}
                />
              </div>
              <div className="flex items-start gap-3 sm:gap-4">
                <InitialsAvatar
                  src={child.photoUrl}
                  name={child.name}
                  className="h-14 w-14 shrink-0 sm:h-16 sm:w-16"
                  initialsClassName="text-base sm:text-lg"
                />
                <div className="min-w-0 flex-1">
                  <Typography className="mb-0.5! pr-8 text-base! font-semibold! text-gray-800!">
                    {child.name}
                  </Typography>
                  <Typography className="mb-2 text-xs! font-normal! text-gray-500!">
                    {child.studentId} {child.currentStatus === "Signed In" && `• ${child.classroom}`}
                  </Typography>
                  <Typography className={`mb-1! text-sm! font-normal! text-teal-700/80! ${child.currentStatus === "Signed In" ? "hidden" : "block"}`}>
                    {child.classroom}
                  </Typography>
                  {child.currentStatus === "Signed In" && child.currentClockInTime ? (
                    <div className="mt-1 w-fit rounded-full bg-[#EDFFF7] px-3 py-1.5">
                      <Typography className="text-xs! text-success-green font-medium!">
                        Clocked-In • {child.currentClockInTime}
                      </Typography>
                    </div>
                  ) : (
                    <Typography className="text-sm! text-gray-500! font-normal!">
                      {child.age}
                    </Typography>
                  )}
                  {child.currentStatus === "Signed Out" && !isScheduledForToday && (
                    <Typography className="text-xs! !font-medium !text-red-600 mt-1">
                      Not scheduled for today
                    </Typography>
                  )}
                </div>
              </div>
              </Box>
            );
          })}
        </div>
      </Box>

      {/* Child Details Modal */}
      <ChildDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        child={selectedChild}
        parentId={parentId}
        onClockIn={onAttendanceSuccess}
        onClockOut={onAttendanceSuccess}
        isClockedIn={selectedChild ? isChildClockedIn(selectedChild.id) : false}
      />

      {/* Bottom Action Bar */}
      {selectedChildren.length > 0 && (
        <div className="fixed inset-x-0 bottom-4 z-50 px-4 sm:bottom-5 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-screen-2xl rounded-xl border border-gray-200 bg-white shadow-lg">
            <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="flex items-center gap-3">
              <button
                onClick={handleClearSelection}
                className="cursor-pointer p-1 hover:bg-gray-100 rounded"
                aria-label="Clear selection"
                title="Clear selection"
              >
                <CloseIcon className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex flex-col">
                <Typography className="text-sm! font-medium! text-gray-800!">
                  {selectedChildren.length} selected
                </Typography>
                <Typography className="text-xs! text-gray-500! font-normal!">
                  Select action to perform
                </Typography>
              </div>
            </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                {hasNotClockedInSelected && (
                  <Button
                    className="rounded-lg! bg-[#008080]! text-white! hover:bg-[#006666]!"
                    onClick={handleBulkClockIn}
                    disabled={isClockInPending || hasUnscheduledClockInSelected}
                    sx={{
                      textTransform: "none",
                      minHeight: "44px",
                      px: 3,
                      py: 1,
                    }}
                    fullWidth
                  >
                    <span className="flex items-center gap-2">
                      <ClockIn />
                      {isClockInPending ? "Clocking In..." : "Clock In"}
                    </span>
                  </Button>
                )}
                {hasClockedInSelected && (
                  <Button
                    className="rounded-lg! bg-gray-600! text-white! hover:bg-gray-700!"
                    onClick={handleBulkClockOut}
                    disabled={isClockOutPending}
                    sx={{
                      textTransform: "none",
                      minHeight: "44px",
                      px: 3,
                      py: 1,
                    }}
                    fullWidth
                  >
                    <span className="flex items-center gap-2">
                      <ClockIn />
                      {isClockOutPending ? "Clocking Out..." : "Clock Out"}
                    </span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentsDashboard;
