"use client";

import { Box } from "@mui/material";
import { Table } from "@/modules/shared/component/Table";
import { PaginationControls } from "@/modules/shared/component/Pagination/Pagination";
import useGradingPage from "./hooks/useGradingPage";
import ConfirmModal from "@/components/ConfirmModal/confirmModal";
import TrashIcon from "@/modules/shared/assets/svgs/trashicon.svg";
import FilterIcon from "@/modules/shared/assets/svgs/filter.svg";

import { SearchTextfield } from "@/modules/shared/component/SearchTextfield";
import LearningPageActions from "@/layout/Shared/LearningPageActions";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { DashboardRoutes } from "@/routes/dashboard.routes";
import { StaffRoutes } from "@/routes/staff.routes";
import { useMediaQuery } from "@/utils/hooks/useMediaQuery";
import { useState } from "react";
import Drawer from "@mui/material/Drawer";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";

export default function GradingPage({ teacherId }: { teacherId?: number | null } = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    filters,
    applyFilters,
    GradingList,
    currentPage,
    totalItems,
    isLoading,
    deleteModalOpen,
    setDeleteModalOpen,

    handleSearch,
    mobileGradingData,
    gradingIds,
  } = useGradingPage(teacherId);

  const isMobile = useMediaQuery("(max-width:768px)");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [mobileActionGrade, setMobileActionGrade] = useState<{
    id: number;
    class: string;
    milestoneTitle: string;
    status: string;
  } | null>(null);
  const isStaffPath = pathname?.startsWith("/staff/learning");

  const handleRowClick = (_rowData: unknown, rowIndex: number) => {
    const id = gradingIds?.[rowIndex];
    if (id) {
      const gradeRoute = (isStaffPath ? StaffRoutes.learningViewGrade : DashboardRoutes.learningViewGrade).replace(
        ":id",
        String(id),
      );
      router.push(gradeRoute);
    }
  };

  const getStatusClassName = (status: string) => {
    const normalized = String(status || "").toLowerCase();
    if (normalized === "completed") return "bg-[#EDFFF7] text-success-green";
    if (normalized === "in progress") return "bg-brandColor-yellow/15 text-brandColor-yellow";
    return "bg-gray-100 text-gray-700";
  };

  return (
    <Box className="sm:p-0 flex flex-col gap-6">
      <Box className="w-full flex items-center justify-between gap-4">
        <Box className="w-full lg:w-fit">
          <SearchTextfield
            onChange={handleSearch}
            placeholder="Search by milestone name, status, etc"
            isRounded={isMobile}
            fullWidth={isMobile}
            endIcon={
              <button
                className="md:hidden"
                onClick={() => setMobileFilterOpen(true)}
                aria-label="Open filters"
              >
                <FilterIcon className="text-gray-500" />
              </button>
            }
          />
        </Box>
        <LearningPageActions mobileFilterOpen={mobileFilterOpen} setMobileFilterOpen={setMobileFilterOpen} />
      </Box>
      <div className="md:hidden flex flex-col gap-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-[#E4E7EC] bg-white p-4 h-24 animate-pulse"
              />
            ))
          : mobileGradingData?.map((grade) => (
              <div
                key={grade.id}
                className="w-full rounded-xl border border-[#E4E7EC] bg-white p-4 text-left"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-sm text-text-primary truncate">
                    {grade.class}
                  </span>
                  <button
                    onClick={() => setMobileActionGrade({
                      id: parseInt(grade.id),
                      class: grade.class,
                      milestoneTitle: grade.milestoneTitle,
                      status: grade.status,
                    })}
                    className="p-1 rounded-full hover:bg-gray-100 shrink-0"
                    aria-label="More options"
                  >
                    <MoreHorizIcon className="text-gray-500" fontSize="small" />
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-text-secondary truncate">{grade.milestoneTitle}</span>
                  <span
                    className={`text-xs font-medium capitalize px-2 py-1 rounded-full ${getStatusClassName(
                      grade.status,
                    )}`}
                  >
                    {grade.status}
                  </span>
                </div>
              </div>
            ))}
        {!!mobileGradingData?.length && (
          <PaginationControls
            currentPage={currentPage}
            rowsPerPage={filters?.delta}
            totalItems={totalItems}
            onPageChange={(event) => {
              applyFilters({
                pos: (event?.page - 1) * event?.rowsPerPage,
                delta: event?.rowsPerPage,
              });
            }}
            isCondense
            bottomTableClasses="!text-xs"
          />
        )}
      </div>

      <Box className="hidden md:block !pb-4 rounded-xl">
        <Box className="bg-white rounded-xl border !border-border-table">
          <Table
            headers={["Milestone Title", "Class", "No of Students", "Grading Status", "Action"]}
            tableData={GradingList}
            onRowClick={handleRowClick}
            preventRowClickColumnIndex={4}
            isCollapse
            centeredHeaderIndex={[2, 3]}
            rightAlignedIndex={[4]}
            className="relative"
            isLoading={isLoading}
          />
        </Box>
        <Box className="flex justify-center pt-4">
          <PaginationControls
            currentPage={currentPage}
            rowsPerPage={filters?.delta}
            totalItems={totalItems}
            onPageChange={(event) => {
              applyFilters({
                pos: (event?.page - 1) * event?.rowsPerPage,
                delta: event?.rowsPerPage,
              });
            }}
            isCondense
            bottomTableClasses="!text-xs"
          />
        </Box>
      </Box>
      <ConfirmModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={() => {}}
        icon={<TrashIcon />}
        title="Are you sure you want to delete this grading?"
        description="This action cannot be undone. Once deleted, all related data will be permanently removed."
        confirmLabel="Delete"
        cancelLabel="Cancel"
      />

      <Drawer
        anchor="bottom"
        open={Boolean(mobileActionGrade)}
        onClose={() => setMobileActionGrade(null)}
        PaperProps={{
          className: "rounded-t-2xl",
          style: { maxHeight: "70vh" },
        }}
      >
        <div className="px-6 pt-3 pb-8">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />
          <button
            onClick={() => {
              if (!mobileActionGrade) return;
              const detailRoute = isStaffPath
                ? StaffRoutes.learningViewGradeDetail.replace(":id", String(mobileActionGrade.id))
                : DashboardRoutes.learningViewGradeDetail.replace(":id", String(mobileActionGrade.id));
              router.push(detailRoute);
              setMobileActionGrade(null);
            }}
            className="w-full text-left py-4 text-sm font-medium border-b border-gray-100 text-[#022F2F]"
          >
            View
          </button>
          <button
            onClick={() => {
              if (!mobileActionGrade) return;
              const gradeRoute = isStaffPath
                ? StaffRoutes.learningViewGrade.replace(":id", String(mobileActionGrade.id))
                : DashboardRoutes.learningViewGrade.replace(":id", String(mobileActionGrade.id));
              router.push(gradeRoute);
              setMobileActionGrade(null);
            }}
            className="w-full text-left py-4 text-sm font-medium text-[#022F2F]"
          >
            Grade
          </button>
        </div>
      </Drawer>
    </Box>
  );
}
