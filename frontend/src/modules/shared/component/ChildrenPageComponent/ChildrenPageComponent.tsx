/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { InsightCard } from "@/components/InsightCard";
import { Box, Typography } from "@mui/material";
import { useState } from "react";
import { Table } from "@/modules/shared/component/Table";
import { Dropdown } from "@/modules/shared/component/Dropdown";
import { useChildren } from "./hooks/useChildren";
import { Button } from "@/modules/shared/component/Button";
import AddIcon from "@/modules/shared/assets/svgs/plus-icon-white.svg";
import { PaginationControls } from "@/modules/shared/component/Pagination/Pagination";
import { DashboardRoutes } from "@/routes/dashboard.routes";
import { StaffRoutes } from "@/routes/staff.routes";
import { useRouter } from "next/navigation";
import ConfirmModal from "@/components/ConfirmModal/confirmModal";
import WarnIcon from "@/modules/shared/assets/svgs/warnIcon.svg";
import TrashIcon from "@/modules/shared/assets/svgs/trashicon.svg";
import FilterPopover from "@/modules/shared/component/FilterPopover/filterPopover";
import ExpandMoreIcon from "@/modules/shared/assets/svgs/downIcon.svg";
import FilterListIcon from "@mui/icons-material/FilterList";
import { SearchTextfield } from "../SearchTextfield";
import { useMediaQuery } from "@/utils/hooks/useMediaQuery";
import FilterIcon from "@/modules/shared/assets/svgs/filter.svg";
import { MobileChildrenCard, MobileChildrenCardSkeleton } from "./MobileChildrenCard";
import { MobileFilterDrawer } from "@/modules/shared/component/MobileFilterDrawer/MobileFilterDrawer";

interface ChildrenPageComponentProps {
  role: "admin" | "staff";
}

export function ChildrenPageComponent({ role }: ChildrenPageComponentProps) {
  const {
    childrenTableData,
    mobileChildrenData,
    tableHeaders,
    tabletHiddenColumnIndices,
    deactivateAccount,
    setDeactivateAccount,
    isLoading,
    deleteAccount,
    setDeleteAccount,
    gradeAnchorEl,
    setGradeAnchorEl,
    handleOpenGradeFilter,
    handlePageChange,
    handleDeactivate,
    handleDelete,
    currentPage,
    totalItems,
    rowsPerPage,
    classroomFilters,
    handleClassroomFilterChange,
    fetchMoreClassrooms,
    hasMoreClassrooms,
    displayedStudentIds,
    handleSearch,
    activeEnrollmentsCount,
    totalChildrenCount,
    averageDevelopmentPercent,
    selectedChildStatus,
    hasPermission
  } = useChildren(role);

  const router = useRouter();
  const baseChildPath = role === "admin" ? DashboardRoutes.children : StaffRoutes.children;

  const handleRowClick = (_rowData: unknown, rowIndex: number) => {
    const id = displayedStudentIds?.[rowIndex];
    if (id != null) router.push(`${baseChildPath}/${id}`);
  };
  const isMobile = useMediaQuery("(max-width:768px)");
  // const isMobile = useMediaQuery("(max-width:768px)");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  return (
    <Box className="space-y-6 flex flex-col h-full p-4 md:p-5">
      <Box className="hidden w-full md:flex items-center justify-between gap-4">
        <Typography className="font-semibold! text-xl! text-text-primary!">Children</Typography>
      </Box>

      <div className="flex md:grid md:grid-cols-3 gap-4 overflow-x-auto md:overflow-x-visible hide-scrollbar min-h-20 md:min-h-35 *:shrink-0 md:*:shrink">
        <InsightCard
          name="Total Children"
          className="h-20 md:h-35 min-w-52 md:min-w-0 border! border-[#00808033]! rounded-lg!"
          titleClassName="!text-[#002C51] !font-medium !text-base leading-6 tracking-normal"
          valueClassName="!text-2xl !font-bold !text-gray-900"
          value={totalChildrenCount || 0}
        />
        <InsightCard
          name="Active Enrollments"
          className="h-20 md:h-35 min-w-52 md:min-w-0 border! border-[#00808033]! rounded-lg!"
          titleClassName="!text-[#002C51] !font-medium !text-base leading-6 tracking-normal"
          valueClassName="!text-2xl !font-bold !text-gray-900"
          value={activeEnrollmentsCount ?? 0}
        />
        <InsightCard
          name="Average Development"
          className="h-20 md:h-35 min-w-52 md:min-w-0 border! border-[#00808033]! rounded-lg!"
          titleClassName="!text-[#002C51] !font-medium !text-base leading-6 tracking-normal"
          valueClassName="!text-2xl !font-bold !text-gray-900"
          value={`${averageDevelopmentPercent ?? 0}%`}
        />
      </div>

      <Box>
        <Box className="gap-3 hidden md:flex justify-end lg:hidden">
          <button
            onClick={handleOpenGradeFilter}
            className="flex items-center justify-around px-3 h-10 text-gray-700 rounded-lg cursor-pointer border border-gray-200 bg-transparent"
          >
            <span className="text-sm font-medium">
              {classroomFilters.find((f) => f.isActive)?.label || "All Classrooms"}
            </span>
            <ExpandMoreIcon className="ml-2" />
          </button>
          <FilterPopover
            open={Boolean(gradeAnchorEl)}
            anchorEl={gradeAnchorEl}
            onClose={() => setGradeAnchorEl(null)}
            options={classroomFilters}
            onSelect={handleClassroomFilterChange}
            onScrollEnd={fetchMoreClassrooms}
            width={180}
          />
          {role === "admin" && hasPermission("student", "create") && (
            <Button
              className="rounded-lg!"
              onClick={() => router.push(`${DashboardRoutes.addChildren}`)}
              startIcon={<AddIcon />}
            >
              Add Child
            </Button>
          )}
        </Box>
      </Box>

      <Box className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
        <div className="w-full lg:w-fit">
          <SearchTextfield
            onChange={handleSearch}
            placeholder="Search by name, classroom, etc."
            endIcon={
              <button
                type="button"
                className="md:hidden"
                onClick={() => setMobileFilterOpen(true)}
                aria-label="Open filters"
              >
                <FilterIcon className="text-gray-500" />
              </button>
            }
            isRounded={isMobile}
            fullWidth={isMobile}
            className="max-w-full md:w-96 md:max-w-md bg-white md:bg-transparent rounded-full"
            inputClasses="max-w-full bg-white"
          />
        </div>
        {
          <Box className="gap-3 hidden lg:flex">
            <button
              onClick={handleOpenGradeFilter}
              className="flex items-center justify-around px-3 h-10 text-gray-700 rounded-lg cursor-pointer border border-gray-200 bg-transparent"
            >
              <span className="text-sm font-medium">
                {classroomFilters.find((f) => f.isActive)?.label || "All Classrooms"}
              </span>
              <ExpandMoreIcon className="ml-2" />
            </button>
            <FilterPopover
              open={Boolean(gradeAnchorEl)}
              anchorEl={gradeAnchorEl}
              onClose={() => setGradeAnchorEl(null)}
              options={classroomFilters}
              onSelect={handleClassroomFilterChange}
              onScrollEnd={fetchMoreClassrooms}
              width={180}
            />
            {role === "admin" && hasPermission("student", "create") && (
              <Button
                className="rounded-lg!"
                onClick={() => router.push(`${DashboardRoutes.addChildren}`)}
                startIcon={<AddIcon />}
              >
                Add Child
              </Button>
            )}
          </Box>
        }
      </Box>

      {/* Mobile card list */}
      <div className="md:hidden flex flex-col gap-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <MobileChildrenCardSkeleton key={i} />)
          : mobileChildrenData.map((child: any) => (
              <MobileChildrenCard
                key={child.id}
                {...child}
                onClick={() => {
                  const basePath =
                    role === "admin" ? DashboardRoutes.children : StaffRoutes.children;
                  router.push(`${basePath}/${child.id}`);
                }}
              />
            ))}
        {!!mobileChildrenData?.length && (
          <Box className="flex justify-center pt-2">
            <PaginationControls
              currentPage={currentPage}
              rowsPerPage={rowsPerPage}
              totalItems={totalItems || 0}
              onPageChange={handlePageChange}
              isCondense
              bottomTableClasses="!text-xs"
            />
          </Box>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:flex flex-col flex-1">
        <Table
          headers={tableHeaders}
          tableData={childrenTableData}
          onRowClick={handleRowClick}
          preventRowClickColumnIndex={6}
          headerRowClassName="!bg-[#F9FAFB] !border-b !border-[#E4E7EC] !text-sm"
          headerCellClassName="!text-dark !font-medium"
          bodyCellClassName="!text-dark !text-base !font-medium !text-center !text- align-middle !py-4"
          bodyRowClassName="border-b border-[#E4E7EC] last:border-0"
          tableContainerClassName="!border !border-[#E4E7EC] !rounded-lg !overflow-hidden !bg-white"
          isCollapse={true}
          isCondense={true}
          isLoading={isLoading}
          centeredHeaderIndex={[1, 2, 3, 4, 5, 6]}
          tabletHiddenColumnIndices={tabletHiddenColumnIndices}
        />

        <Box className="flex justify-center pt-4">
          <PaginationControls
            currentPage={currentPage}
            rowsPerPage={rowsPerPage}
            totalItems={totalItems || 0}
            onPageChange={handlePageChange}
            isCondense
            bottomTableClasses="!text-xs"
          />
        </Box>
      </div>

      <MobileFilterDrawer
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        onApply={() => setMobileFilterOpen(false)}
        onReset={() => handleClassroomFilterChange("all")}
      >
        <div className="flex flex-col gap-2">
          <Typography className="!text-sm !font-medium !text-[#02273A]">All Classes</Typography>
          <Dropdown
            isForm
            options={classroomFilters.map((f) => ({ value: f.value, name: f.label }))}
            value={classroomFilters.find((f) => f.isActive)?.value ?? "all"}
            onSelect={(value) => handleClassroomFilterChange(value as string)}
            textFieldProps={{ placeholder: "Select classes", isRounded: true }}
            hasMore={Boolean(hasMoreClassrooms)}
            onLoadMore={fetchMoreClassrooms}
          />
        </div>
      </MobileFilterDrawer>

      <ConfirmModal
        open={deactivateAccount || deleteAccount}
        onClose={() => (deleteAccount ? setDeleteAccount(false) : setDeactivateAccount(false))}
        onConfirm={deleteAccount ? handleDelete : handleDeactivate}
        icon={deleteAccount ? <TrashIcon /> : <WarnIcon />}
        title={
          deleteAccount
            ? "Are you sure you want to delete this child?"
            : String(selectedChildStatus || "").toLowerCase() === "inactive" ||
                String(selectedChildStatus || "").toLowerCase() === "deactive"
              ? "Are you sure you want to activate this child?"
              : "Are you sure you want to deactivate this child?"
        }
        description={
          deleteAccount
            ? "This action cannot be undone. Once deleted, all related data will be permanently removed."
            : String(selectedChildStatus || "").toLowerCase() === "inactive" ||
                String(selectedChildStatus || "").toLowerCase() === "deactive"
              ? "This child will be able to access active features again."
              : "You will be able to reactivate this child later."
        }
        confirmLabel={
          deleteAccount
            ? "Delete"
            : String(selectedChildStatus || "").toLowerCase() === "inactive" ||
                String(selectedChildStatus || "").toLowerCase() === "deactive"
              ? "Activate"
              : "Deactivate"
        }
        cancelLabel="Cancel"
      />
    </Box>
  );
}
