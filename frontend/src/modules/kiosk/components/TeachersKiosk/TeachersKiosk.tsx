"use client";

import React, { useState } from "react";
import { Typography, Box } from "@mui/material";
import SchoolLogo from "@/modules/shared/assets/svgs/schoolLogo.svg";
import SearchIcon from "@mui/icons-material/Search";
import { ReusableInput } from "@/modules/shared/component/CustomInputField";
import { PaginationControls } from "@/modules/shared/component/Pagination/Pagination";
import useTeachersKiosk from "./hooks/useTeachersKiosk";
import PINModal from "@/modules/kiosk/components/PINModal/PINModal";
import TeacherDetailModal from "@/modules/kiosk/components/TeacherDetailModal/TeacherDetailModal";
import ForgotPINModal from "@/modules/kiosk/components/ForgotPINModal/ForgotPINModal";
import LogoutIcon from "@/modules/shared/assets/svgs/logout-primary.svg";
import { useRouter } from "next/navigation";
import InitialsAvatar from "@/modules/shared/component/InitialsAvatar/InitialsAvatar";

const TeachersKiosk = () => {
  const router = useRouter();
  const [isForgotPINOpen, setIsForgotPINOpen] = useState(false);
  const {
    searchQuery,
    handleSearchChange,
    isTeachersLoading,
    currentPage,
    rowsPerPage,
    paginatedTeachers,
    filteredTeachers,
    handlePageChange,
    selectedTeacher,
    handleTeacherClick,
    isPINModalOpen,
    isDetailModalOpen,
    handlePINConfirm,
    handleClosePINModal,
    handleCloseDetailModal,
    handleClockIn,
    handleClockOut,
    schoolName,
    schoolLogoUrl,
  } = useTeachersKiosk();

  return (
    <div className="min-h-screen min-h-[100dvh] bg-dashboard-bg px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-screen-2xl flex-1 flex-col">
      {/* Header */}
      <Box className="mb-6 flex justify-between gap-2 sm:gap-3 items-center">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          {schoolLogoUrl && <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-white shrink-0">
              <img
                src={schoolLogoUrl}
                alt={schoolName || "School"}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            
          </div>}
          <Typography className="truncate text-base! font-medium! text-[#008080]! sm:text-lg! md:text-xl!">
            {schoolName || "School"}
          </Typography>
        </div>
        <Box
          className="flex shrink-0 cursor-pointer items-center gap-1 text-xs font-medium text-[#008080] sm:gap-1.5 sm:text-sm"
          onClick={() => router.back()}
        >
          <LogoutIcon />
          <span className="hidden sm:inline">Back</span>
        </Box>
      </Box>

      {/* Search Bar */}
      <div className="mb-6 flex justify-start">
        <Box className="w-full max-w-md md:max-w-lg">
          <ReusableInput
            variant="search"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search here..."
            startAdornment={<SearchIcon sx={{ fontSize: 20, color: "gray" }} />}
            showDefaultAdornment={false}
            sx={{
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              backgroundColor: "white",
              "&:focus-within": {
                borderColor: "#008080",
                boxShadow: "0 0 0 2px rgba(0, 128, 128, 0.1)",
                backgroundColor: "white",
              },
            }}
            inputClassName="!text-sm !text-gray-700 placeholder:!text-gray-400"
          />
        </Box>
      </div>

      {/* Teachers List */}
      <div className="mb-6 flex-1 overflow-hidden rounded-xl border border-[#E4E7EC] bg-white">
        <div className="max-h-full divide-y divide-gray-200 overflow-y-auto">
          {isTeachersLoading ? (
            <div className="min-h-[50vh] flex items-center justify-center bg-gray-100">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#008080]"></div>
            </div>
          ) : paginatedTeachers.length > 0 ? (
            paginatedTeachers.map((teacher) => (
              <div
                key={teacher.id}
                onClick={() => handleTeacherClick(teacher)}
                className="flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50 sm:gap-4"
              >
                <InitialsAvatar
                  src={teacher.photoUrl}
                  name={teacher.name}
                  className="h-11 w-11 shrink-0 sm:h-12 sm:w-12"
                  initialsClassName="text-sm"
                />
                <div className="flex-1 min-w-0">
                  <Typography className="mb-0.5! text-sm! font-semibold! text-gray-800!">
                    {teacher.name}
                  </Typography>
                  <Typography className="text-xs! text-gray-500! font-normal! mb-0.5!">
                    {teacher.email}
                  </Typography>
                  <Typography className="text-[11px]! font-medium! text-[#008080]!">
                    {teacher.roleLabel}
                  </Typography>
                </div>
                {(teacher.currentStatus === "Signed In" || teacher.currentStatus === "Clocked In") &&
                teacher.currentClockInTime ? (
                  <div className="w-fit rounded-full bg-[#EDFFF7] px-2 py-1">
                    <Typography className="text-xs! text-success-green font-medium!">
                      Clocked-In • {teacher.currentClockInTime}
                    </Typography>
                  </div>
                ) : null}
              </div>
            ))
          ) : (
            <div className="px-4 py-8 text-center">
              <Typography className="text-sm! text-gray-500!">No admins or teachers found</Typography>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {filteredTeachers.length > 0 && (
        <Box className="flex justify-center">
          <PaginationControls
            currentPage={currentPage}
            rowsPerPage={rowsPerPage}
            totalItems={filteredTeachers.length}
            isCondense
            onPageChange={handlePageChange}
          />
        </Box>
      )}

      {/* PIN Modal */}
      <PINModal
        isOpen={isPINModalOpen}
        onClose={handleClosePINModal}
        teacher={selectedTeacher}
        onPINConfirm={handlePINConfirm}
        onForgotPin={
          selectedTeacher?.entityType === "staff" ? () => setIsForgotPINOpen(true) : undefined
        }
      />

      {/* Forgot PIN Modal (does not affect admin session) */}
      <ForgotPINModal
        isOpen={isForgotPINOpen}
        onClose={() => setIsForgotPINOpen(false)}
        type="teacher"
        prefilledEmail={selectedTeacher?.email}
      />

      {/* Teacher Detail Modal */}
      <TeacherDetailModal
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        teacher={selectedTeacher}
        onClockIn={handleClockIn}
        onClockOut={handleClockOut}
        isClockedIn={
          selectedTeacher?.currentStatus === "Signed In" ||
          selectedTeacher?.currentStatus === "Clocked In"
        }
      />
      </div>
    </div>
  );
};

export default TeachersKiosk;
