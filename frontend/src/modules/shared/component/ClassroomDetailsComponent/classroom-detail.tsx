/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { Box, Typography, IconButton, Chip } from "@mui/material";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/modules/shared/component/Button";
import LeftIcon from "@/modules/shared/assets/images/chevronBack.png";
import Image from "next/image";
import { Table } from "@/modules/shared/component/Table";
import { PaginationControls } from "@/modules/shared/component/Pagination/Pagination";
import { DashboardRoutes } from "@/routes/dashboard.routes";
import ConfirmModal from "@/components/ConfirmModal/confirmModal";
import WarnIcon from "@/modules/shared/assets/svgs/warnIcon.svg";
import TrashIcon from "@/modules/shared/assets/svgs/trashicon.svg";
import { useClassroomDetail } from "./hooks/useClassroomDetail";
import { InsightCard } from "@/components/InsightCard";
import { DataRenderer } from "@/modules/shared/component/DataRenderer";
import FilterPopover from "@/modules/shared/component/FilterPopover/filterPopover";
import ExpandMoreIcon from "@/modules/shared/assets/svgs/downIcon.svg";
import { SearchTextfield } from "../SearchTextfield";
import { useMediaQuery } from "@/utils/hooks/useMediaQuery";
import { MobileChildrenCard } from "../ChildrenPageComponent/MobileChildrenCard";
import EllipsesIcon from "@/modules/shared/assets/svgs/ellipses.svg";
import { MobileFilterDrawer } from "@/modules/shared/component/MobileFilterDrawer/MobileFilterDrawer";
import { Dropdown } from "@/modules/shared/component/Dropdown";
import { capitalizeFirstLetter } from "@/utils/helpers";

interface ClassroomDetailProps {
  role: "admin" | "staff";
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-100! text-green-700!",
  inactive: "bg-red-50! text-red-600!",
};

export const ClassroomDetailComponent: React.FC<ClassroomDetailProps> = ({ role }) => {
  const router = useRouter();
  const { classId } = useParams() as { classId: string };
  const [classroomDropdownAnchorEl, setClassroomDropdownAnchorEl] = useState<HTMLElement | null>(
    null,
  );
  const [mobileActionsOpen, setMobileActionsOpen] = useState(false);
  const [staffMobileFilterOpen, setStaffMobileFilterOpen] = useState(false);
  const [pendingStaffClassroom, setPendingStaffClassroom] = useState<string>("all");
  const isMobile = useMediaQuery("(max-width:768px)");

  const {
    classroomData: classroom,
    classrooms,
    deactivateModalOpen,
    setDeactivateModalOpen,
    deleteModalOpen,
    setDeleteModalOpen,
    handleDeactivate,
    handleDelete,
    loading,
    isLoading,
    assignedClassrooms,
    selectedClassroomId,
    setSelectedClassroomId,
    // Pagination
    currentPage,
    totalItems,
    rowsPerPage,
    handlePageChange,
    stats,
    handleSearch,
  } = useClassroomDetail(classId as string, role);

  useEffect(() => {
    if (role !== "staff") return;
    const onOpenFilter = () => {
      setPendingStaffClassroom(selectedClassroomId ?? classId ?? "all");
      setStaffMobileFilterOpen(true);
    };
    window.addEventListener("open-staff-classroom-filter", onOpenFilter);
    return () => window.removeEventListener("open-staff-classroom-filter", onOpenFilter);
  }, [role, selectedClassroomId, classId]);

  const rows = classrooms.map((room: any) => ({
    0: room?.classroomName,
    1: room?.maximumCapacity,
    2: room?.studentsCurrentClass?.length,
    3: room?.assignedStaff?.length,
    4: <span
      className={`text-xs text-blue-main font-medium rounded-full px-3 py-1 shrink-0 ${STATUS_STYLES[room?.classroomStatus || ""] ?? "bg-gray-100"}`}
    >{capitalizeFirstLetter(room?.classroomStatus)}</span>,
  }));
  const assignedStaffCount = stats.numStaff;
  const isAdminMobile = role === "admin" && isMobile;
  const mobileClassroomRows = useMemo(
    () =>
      classrooms.map((room: any) => ({
        id: room?.id,
        name: room?.classroomName,
        age: `Capacity: ${room?.maximumCapacity}`,
        status: room?.classroomStatus,
        studentsCount: room?.studentsCurrentClass?.length || 0,
      })),
    [classrooms],
  );
  const insightCards = (
    <>
      {role === "staff" && isMobile && (
        <Box className="md:hidden w-full">
          <SearchTextfield
            onChange={handleSearch}
            placeholder="Search by name, etc"
            isRounded
            fullWidth
            className="!w-full !max-w-full !bg-white rounded-full"
          />
        </Box>
      )}
      <Box
        className={
          isMobile
            ? "flex gap-3 overflow-x-auto md:overflow-x-visible hide-scrollbar sm:min-h-35 *:shrink-0 md:*:shrink"
            : "grid grid-cols-3 gap-4"
        }
      >
        {role === "admin" && (
          <InsightCard
            name="Enrollment"
            value={stats.enrollment}
            className="!h-20 md:h-35 !min-w-52 md:min-w-0 border! border-[#00808033]! rounded-lg!"
          />
        )}
        {role === "staff" && (
          <InsightCard
            name="Total Classrooms"
            value={totalItems.toString()}
            className="!h-20 md:h-35 !min-w-52 md:min-w-0 border! border-[#00808033]! rounded-lg!"
          />
        )}
        <InsightCard
          name="Teacher Assigned"
          value={assignedStaffCount?.toString() || "0"}
          className="!h-20 md:h-35 !min-w-52 md:min-w-0 border! border-[#00808033]! rounded-lg!"
        />
        <InsightCard
          name="Staff to Child Ratio"
          value={stats.staffChildRatio}
          className="!h-20 md:h-35 !min-w-52 md:min-w-0 border! border-[#00808033]! rounded-lg!"
        />
        {/* <InsightCard
          name="Status"
          value={classroom?.classroomStatus || "Active"}
          className="capitalize!"
        /> */}
      </Box>
      <Box className="w-full md:w-[425px] hidden md:flex items-center justify-between gap-4">
        <SearchTextfield
          onChange={handleSearch}
          placeholder="Search by name, etc"
          className="!hidden md:block"
        />

      </Box>
      <Box className="rounded-2xl overflow-hidden flex flex-col gap-3 flex-1">
        {isMobile ? (
          <Box className="flex flex-col gap-3">
            {mobileClassroomRows.map((room) => (
              <MobileChildrenCard
                key={room.id || room.name}
                id={room.id}
                name={room.name}
                age={room.age}
                classroom={`Students: ${room.studentsCount}`}
                status={room.status}
                removePhoto={true}
              />
            ))}
            {totalItems > 0 && (
              <Box className="flex justify-center pt-2 pb-2">
                <PaginationControls
                  currentPage={currentPage}
                  rowsPerPage={rowsPerPage}
                  totalItems={totalItems}
                  onPageChange={handlePageChange}
                  isCondense
                  bottomTableClasses="!text-xs"
                />
              </Box>
            )}
          </Box>
        ) : (
          <>
            <Box className="flex-1 bg-white! overflow-auto">
              <Table
                headers={["Name", "Classroom Capacity", "No of Students", "Staffs Assigned", "Classroom Status"]}
                tableData={rows}
                isCollapse
                isLoading={isLoading}
                centeredHeaderIndex={[2]}
              />
            </Box>
            <Box className="flex justify-center ">
              <PaginationControls
                currentPage={currentPage}
                rowsPerPage={rowsPerPage}
                totalItems={totalItems}
                onPageChange={handlePageChange}
                isCondense
                bottomTableClasses="!text-xs"
              />
            </Box>
          </>
        )}
      </Box>
    </>
  );

  return (
    <Box className="h-full p-5 space-y-6 relative">
      {role === "staff" && assignedClassrooms.length > 0 && (
        <MobileFilterDrawer
          open={staffMobileFilterOpen}
          onClose={() => setStaffMobileFilterOpen(false)}
          onApply={() => {
            setSelectedClassroomId(pendingStaffClassroom);
            handlePageChange({ page: 1, rowsPerPage });
            setStaffMobileFilterOpen(false);
          }}
          onReset={() => {
            setPendingStaffClassroom("all");
            setSelectedClassroomId("all");
            handlePageChange({ page: 1, rowsPerPage });
            setStaffMobileFilterOpen(false);
          }}
        >
          <div className="flex flex-col gap-2">
            <Typography className="!text-sm !font-medium !text-[#02273A]">Classroom</Typography>
            <Dropdown
              isForm
              options={[
                { value: "all", name: "All Classrooms" },
                ...assignedClassrooms.map((c) => ({
                  value: String(c.id),
                  name: c.classroomName,
                })),
              ]}
              value={pendingStaffClassroom}
              onSelect={(value) => setPendingStaffClassroom(String(value))}
              textFieldProps={{ placeholder: "Classroom", isRounded: true }}
            />
          </div>
        </MobileFilterDrawer>
      )}

      {/* Header */}
      {isMobile && (
        <Box className="flex items-center justify-between">
          {role === "admin" && (<Box className="flex items-center gap-3">
            <IconButton
              onClick={() => router.push(DashboardRoutes.classRooms)}
              className="rounded-full! border! border-brandColor-active/20!"
            >
              <Image src={LeftIcon || "/placeholder.svg"} alt="back" width={20} height={20} />
            </IconButton>
            <Typography className="text-lg! font-semibold! capitalize!">
              {role === "admin" && (classroom?.classroomName || "Classroom")}
            </Typography>
            <Chip
              label={capitalizeFirstLetter(classroom?.classroomStatus)}
              className={`${STATUS_STYLES?.[classroom?.classroomStatus || "active"]}`}
              size="small"
            />
          </Box>)}
          {isAdminMobile && (
            <button onClick={() => setMobileActionsOpen(true)} aria-label="Open classroom actions">
              <EllipsesIcon />
            </button>
          )}
        </Box>
      )}

      <Box className="hidden sm:flex items-center justify-between">
        {role === "admin" ? (
          <Box className="md:flex items-center gap-3 hidden">
            <IconButton
              onClick={() => router.push(DashboardRoutes.classRooms)}
              className="rounded-full! border! border-brandColor-active/20!"
            >
              <Image src={LeftIcon || "/placeholder.svg"} alt="back" width={20} height={20} />
            </IconButton>
            <Box className="flex items-center gap-2">
              <Typography className="text-xl! font-semibold! capitalize!">
                {classroom?.classroomName}
              </Typography>
              <Chip
                label={capitalizeFirstLetter(classroom?.classroomStatus)}
                className={`${STATUS_STYLES?.[classroom?.classroomStatus || "active"]}`}
                size="small"
              />
            </Box>
          </Box>
        ) : (
          <Typography className="font-semibold! text-xl! text-text-primary! ">Classroom</Typography>
        )}

        <Box className="flex items-center gap-3">
          {role === "admin" && !isMobile && (
            <Button
              onClick={() => router.push(`${DashboardRoutes.classRooms}/${classId}/edit`)}
              className="rounded-lg! gap-2 px-8!"
            >
              Edit
            </Button>
          )}
        </Box>
      </Box>

      {role === "staff" ? (
        <>{insightCards}</>
      ) : (
        <DataRenderer isLoading={loading}>{() => <>{insightCards}</>}</DataRenderer>
      )}

      <ConfirmModal
        open={deactivateModalOpen}
        onClose={() => setDeactivateModalOpen(false)}
        onConfirm={handleDeactivate}
        icon={<WarnIcon />}
        title={classroom?.classroomStatus === "inactive" ? "Are you sure you want to activate this classroom?" : "Are you sure you want to deactivate this classroom?"}
        description={classroom?.classroomStatus === "inactive" ? "You will be able to deactivate this classroom later." : "You will be able to reactivate this classroom later."}
        confirmLabel={classroom?.classroomStatus === "inactive" ? "Activate" : "Deactivate"}
        cancelLabel="Cancel"
      />

      <ConfirmModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        icon={<TrashIcon />}
        title="Are you sure you want to delete this classroom?"
        description="This action cannot be undone. Once deleted, all related data will be permanently removed."
        confirmLabel="Delete"
        cancelLabel="Cancel"
      />

      {mobileActionsOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={() => setMobileActionsOpen(false)}
        />
      )}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 transition-transform duration-300 ${mobileActionsOpen ? "translate-y-0" : "translate-y-full"
          }`}
      >
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 mb-4" />
        <div className="flex flex-col pb-8">
          <button
            type="button"
            className="w-full text-left px-6 py-4 text-sm font-medium text-[#101828] border-b border-gray-100"
            onClick={() => {
              setMobileActionsOpen(false);
              router.push(`${DashboardRoutes.classRooms}/${classId}/edit`);
            }}
          >
            Edit
          </button>
          <button
            type="button"
            className="w-full text-left px-6 py-4 text-sm font-medium text-[#101828] border-b border-gray-100"
            onClick={() => {
              setMobileActionsOpen(false);
              setDeactivateModalOpen(true);
            }}
          >
            {classroom?.classroomStatus === "inactive" ? "Activate" : "Deactivate"}
          </button>
          <button
            type="button"
            className="w-full text-left px-6 py-4 text-sm font-medium text-red-500"
            onClick={() => {
              setMobileActionsOpen(false);
              setDeleteModalOpen(true);
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </Box>
  );
};

export default ClassroomDetailComponent;
