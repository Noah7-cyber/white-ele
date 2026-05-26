"use client";

import { Table } from "@/modules/shared/component/Table";
import { InsightCard } from "@/components/InsightCard";
import { Box } from "@mui/material";
import useCurriculum from "@/modules/shared/component/Learning/hooks/useCurriculum";

import { PaginationControls } from "@/modules/shared/component/Pagination";

import ConfirmModal from "@/components/ConfirmModal/confirmModal";
import TrashIcon from "@/modules/shared/assets/svgs/trashicon.svg";
import { showToast } from "@/modules/shared/component/Toast";

const headers = [
  "Curriculum Title",
  "Class",
  "Assigned Staff",
  "Subjects",
  "Last Updated",
  "Status",
  "Action",
];

export function CurriculumPage({ role = "admin" }: { role?: "admin" | "staff" }) {
  const {
    selectedFilter: _selectedFilter,
    curriculumList,
    classrooms: _classrooms,
    filters: _filters,
    applyFilters,
    paginatedData,
    totalItems,
    currentPage,
    rowsPerPage,
    archiveModal,
    deleteModal,
    setArchiveModal,
    setDeleteModal,
    isLoading,
    pagination: _pagination,
    handleDeactivate,
  } = useCurriculum(role);

  return (
    <Box className="h-full space-y-6">
      <Box className="grid grid-cols-3 gap-4">
        <InsightCard name="Total Curriculum" value={curriculumList.length} />
        <InsightCard
          name="Active Curriculum"
          value={curriculumList.filter((c) => c.status.toLowerCase() === "active").length}
        />
        <InsightCard
          name="Subjects"
          value={curriculumList.reduce((acc, curr) => acc + (curr.subjects || 0), 0)}
        />
      </Box>

      <Box className="flex-1">
        <Table
          headers={headers}
          tableData={paginatedData}
          isCollapse
          centeredHeaderIndex={[5]}
          rightAlignedIndex={[6]}
          isLoading={isLoading}
        />

        <Box className="flex justify-center pt-4">
          <PaginationControls
            currentPage={currentPage}
            rowsPerPage={rowsPerPage}
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

      {/* Archive confirmation modal */}
      <ConfirmModal
        open={archiveModal}
        onClose={() => setArchiveModal(false)}
        onConfirm={() => {
          setArchiveModal(false);
          showToast({
            message: "Curriculum Archived",
            description: "The curriculum has been successfully archived.",
            severity: "success",
            duration: 3000,
          });
        }}
        icon={<TrashIcon />}
        title="Archive Curriculum?"
        description="You can restore this curriculum anytime from the archived section."
        confirmLabel="Archive"
        cancelLabel="Cancel"
      />

      {/* Delete confirmation modal */}
      <ConfirmModal
        open={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={handleDeactivate}
        icon={<TrashIcon />}
        title="Delete Curriculum?"
        description="This action cannot be undone. Once deleted, all related data will be permanently removed."
        confirmLabel="Delete"
        cancelLabel="Cancel"
      />
    </Box>
  );
}
