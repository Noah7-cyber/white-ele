"use client";

import { Table } from "@/modules/shared/component/Table";
import { PaginationControls } from "@/modules/shared/component/Pagination/Pagination";

import { InsightCard } from "@/components/InsightCard";
import { Box } from "@mui/material";

import useClassroomPage from "./hooks/useClassroomPage";

import ConfirmModal from "@/components/ConfirmModal/confirmModal";
import TrashIcon from "@/modules/shared/assets/svgs/trashicon.svg";
import WarnIcon from "@/modules/shared/assets/svgs/warnIcon.svg";
import { SearchTextfield } from "@/modules/shared/component/SearchTextfield";
import { useRouter } from "next/navigation";
import { DashboardRoutes } from "@/routes/dashboard.routes";
import { Button } from "@/modules/shared/component/Button";
import PlusIcon from "@/modules/shared/assets/svgs/plus-icon.svg";
import { MobileFilterDrawer } from "@/modules/shared/component/MobileFilterDrawer/MobileFilterDrawer";
import { useState, useEffect } from "react";
import { MobileClassroomCard, MobileClassroomCardSkeleton } from "./MobileClassroomCard";
export default function ClassroomPage() {
  const router = useRouter();
  const {
    pagination,
    filters,
    applyFilters,
    ClassroomList,
    classroomIds,
    deactivateModalOpen,
    deleteModalOpen,
    handleDeactivate,
    handleDelete,
    setDeactivateModalOpen,
    setDeleteModalOpen,
    currentPage,
    isLoading,
    activeClassroomCount,
    totalEnrolled,
    totalCapacity,
    totalStaff,
    handleSearch,
    mobileClassroomData,
    selectedClassroomStatus,
    canCreateClassroom,
  } = useClassroomPage();

  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setMobileFilterOpen(true);
    window.addEventListener("open-classroom-filter", handleOpen);
    return () => window.removeEventListener("open-classroom-filter", handleOpen);
  }, []);

  const handleRowClick = (_rowData: unknown, rowIndex: number) => {
    const id = classroomIds?.[rowIndex];
    if (id != null) router.push(DashboardRoutes.classroomView.replace(":classId", String(id)));
  };

  return (
    <Box className="flex flex-col gap-6">
      <div className="flex md:grid md:grid-cols-4 gap-4 overflow-x-auto md:overflow-x-visible hide-scrollbar sm:min-h-35 *:shrink-0 md:*:shrink">
        <InsightCard
          name="Active Classroom"
          value={activeClassroomCount}
          className="!h-20 md:h-35 !min-w-52 md:min-w-0 border! border-[#00808033]! rounded-lg!"
        />
        <InsightCard
          name="Total Enrolled"
          value={totalEnrolled}
          className="!h-20 md:h-35 !min-w-52 md:min-w-0 border! border-[#00808033]! rounded-lg!"
        />
        <InsightCard
          name="Total Capacity"
          value={totalCapacity}
          className="!h-20 md:h-35 !min-w-52 md:min-w-0 border! border-[#00808033]! rounded-lg!"
        />
        <InsightCard
          name="Total Staff"
          value={totalStaff}
          className="!h-20 md:h-35 !min-w-52 md:min-w-0 border! border-[#00808033]! rounded-lg!"
        />
      </div>
      <Box className="w-full flex items-center justify-between gap-4">
        <div className="w-full lg:w-full max-w-md">
          <SearchTextfield
            onChange={handleSearch}
            placeholder="Search by class name, etc"
            // endIcon={
            //   <button
            //     className="md:hidden "
            //     onClick={() => setMobileFilterOpen(true)}
            //     aria-label="Open filters"
            //   >
            //     <FilterIcon className="text-gray-500" />
            //   </button>
            // }
            isRounded={true}
            fullWidth={true}
            className="max-w-full "
            inputClasses="max-w-full !bg-white"
          />
        </div>
        <Button
          className="rounded-lg! !hidden md:!flex"
          startIcon={<PlusIcon />}
          onClick={() => router.push("/admin/rooms/classes/add")}
          disabled={!canCreateClassroom}
        >
          Add Classroom
        </Button>
      </Box>

      <div className="md:hidden flex flex-col gap-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, idx) => <MobileClassroomCardSkeleton key={idx} />)
          : mobileClassroomData?.map(
            (room: { id: number; teachers: string; className: string; status: string }) => (
              <MobileClassroomCard
                key={room.id}
                id={room.id}
                classroomName={room.className}
                teachers={room.teachers ? `${room.teachers}` : "No teacher"}
                classroom={undefined}
                status={room.status}
                onClick={() =>
                  router.push(DashboardRoutes.classroomView.replace(":classId", String(room.id)))
                }

              />
            ),
          )}
        {!!mobileClassroomData?.length && (
          <PaginationControls
            currentPage={currentPage}
            rowsPerPage={filters?.delta}
            totalItems={pagination?.count}
            onPageChange={(event) => {
              applyFilters({
                pos: (event.page - 1) * event.rowsPerPage,
                delta: event.rowsPerPage,
              });
            }}
            isCondense
            bottomTableClasses="!text-xs"
          />
        )}
      </div>

      <Box className="hidden md:block !pb-4 rounded-2xl">
        <Box className="bg-white rounded-2xl border !border-border-table">
          <Table
            headers={[
              " Name",
              "Age Range",
              "Capacity",
              "Student Enrolled",
              "Assigned Staff",
              "Status",
              "Action",
            ]}
            tableData={ClassroomList}
            onRowClick={handleRowClick}
            preventRowClickColumnIndex={6}
            isCollapse
            centeredHeaderIndex={[]}
            rightAlignedIndex={[6]}
            isLoading={isLoading}
          />
        </Box>

        <Box className="flex justify-center pt-4">
          <PaginationControls
            currentPage={currentPage}
            rowsPerPage={filters?.delta}
            totalItems={pagination?.count}
            onPageChange={(event) => {
              applyFilters({
                pos: (event.page - 1) * event.rowsPerPage,
                delta: event.rowsPerPage,
              });
            }}
            isCondense
            bottomTableClasses="!text-xs"
          />
        </Box>
      </Box>

      <ConfirmModal
        open={deactivateModalOpen}
        onClose={() => setDeactivateModalOpen(false)}
        onConfirm={handleDeactivate}
        icon={<WarnIcon />}
        title={
          selectedClassroomStatus === "inactive"
            ? "Are you sure you want to activate this classroom?"
            : "Are you sure you want to deactivate this classroom?"
        }
        description={
          selectedClassroomStatus === "inactive"
            ? "You can deactivate this classroom later."
            : "You will be able to reactivate this classroom later."
        }
        confirmLabel={selectedClassroomStatus === "inactive" ? "Activate" : "Deactivate"}
        cancelLabel="Cancel"
      />

      <MobileFilterDrawer
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        onApply={() => setMobileFilterOpen(false)}
        onReset={() => setMobileFilterOpen(false)}
      >
        <div className="flex flex-col gap-2">
          {/* Additional filters can be injected here based on mobile layout */}
        </div>
      </MobileFilterDrawer>

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
    </Box>
  );
}
