"use client";

import { Table } from "@/modules/shared/component/Table";
import { PaginationControls } from "@/modules/shared/component/Pagination";
import { useState } from "react";
import { InsightCard } from "@/components/InsightCard";
import { Box } from "@mui/material";
import { useAssessment } from "@/modules/shared/component/Learning/hooks/useAssessment";
import ConfirmModal from "@/components/ConfirmModal/confirmModal";
import { showToast } from "@/modules/shared/component/Toast";

import TrashIcon from "@/modules/shared/assets/svgs/trashicon.svg";
import { SearchTextfield } from "@/modules/shared/component/SearchTextfield";

export function AssessmentsPage({ role = "admin" }: { role?: "admin" | "staff" }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(2);
  const [deleteModal, setDeleteModal] = useState(false);
  const [archiveModal, setArchiveModal] = useState(false);

  const { assessmentHeader, assessmentTableData, handleSearch } = useAssessment({
    setDeleteModal,
    setArchiveModal,
    role,
  });

  const handlePageChange = ({
    page,
    rowsPerPage: newRowsPerPage,
  }: {
    page: number;
    rowsPerPage: number;
  }) => {
    setCurrentPage(page);
    if (newRowsPerPage !== rowsPerPage) {
      setRowsPerPage(newRowsPerPage);
      setCurrentPage(1); // Reset to page 1 on rows change
    }
  };
  const totalItems = assessmentTableData.length;

  return (
    <Box className="h-full space-y-6">
      <Box className="grid grid-cols-3 gap-4">
        <InsightCard name="Completed" value={4} />
        <InsightCard name="Pending" value={54} />
        <InsightCard name="Observations" value={65} />
      </Box>

      <Box className="w-full flex items-center justify-between gap-4">
        <SearchTextfield
          onChange={handleSearch}
          placeholder="Search by assessment title, subject, class, status, etc"
        />
      </Box>

      <div className="flex items-center justify-end gap-4 mb-3">
        <div className="flex items-center gap-4">
          {/* <div className="relative w-64">
              <TextField isSearch placeholder="Search by ID, Name, or Subject" />
            </div> */}

          {/* <Box className="flex items-center gap-1">
            <IconButton className="!bg-[#FEB92B]">
              <ListIcon />
            </IconButton>
            <IconButton className="!bg-[#FEB92B]">
              <GridIcon />
            </IconButton>
            <IconButton className="!bg-[#FEB92B]">
              <PlusIcon />
            </IconButton>
          </Box> */}
        </div>
      </div>

      <Table
        headers={assessmentHeader}
        tableData={assessmentTableData}
        headerRowClassName="!bg-[#F9FAFB] !border-b !border-[#E4E7EC] !text-sm"
        headerCellClassName="!text-dark !font-medium !text-center first:!text-left"
        bodyCellClassName="!text-dark !text-base w-[200px] !font-medium !text-center first:!text-left align-middle !py-4"
        bodyRowClassName="border-b border-[#E4E7EC] last:border-0"
        tableContainerClassName="!border !border-[#E4E7EC] !rounded-lg !overflow-hidden !bg-white"
        isCollapse={true}
        isCondense={true}
        centeredHeaderIndex={[1, 2, 3, 4, 5, 6]}
        rightAlignedIndex={[7]}
      />

      <Box className="flex justify-center">
        <PaginationControls
          currentPage={currentPage}
          rowsPerPage={rowsPerPage}
          totalItems={totalItems}
          onPageChange={handlePageChange}
          isCondense
          bottomTableClasses="!text-xs"
        />
      </Box>
      <ConfirmModal
        open={archiveModal}
        onClose={() => setArchiveModal(false)}
        onConfirm={() => {
          setArchiveModal(false);
          showToast({
            message: "Assessment Archived",
            description: "The Assessment has been successfully archived.",
            severity: "success",
            duration: 3000,
          });
        }}
        icon={<TrashIcon />}
        title="Archive Assessment"
        description="You can restore this assessment anytime from the archived section."
        confirmLabel="Archive"
        cancelLabel="Cancel"
      />
      <ConfirmModal
        open={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={() => {
          setDeleteModal(false);
          showToast({
            message: "Assessment Deleted",
            description: "The assessment has been successfully deleted.",
            severity: "success",
            duration: 3000,
          });
        }}
        icon={<TrashIcon />}
        title="Are you sure you want to delete this?"
        description="This action cannot be undone. Once deleted, all related data will be permanently removed."
        confirmLabel="Delete"
        cancelLabel="Cancel"
      />
    </Box>
  );
}
