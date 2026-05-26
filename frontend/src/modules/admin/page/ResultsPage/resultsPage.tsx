/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { Table } from "@/modules/shared/component/Table";
import { PaginationControls } from "@/modules/shared/component/Pagination/Pagination";
import { useState } from "react";

import { Box } from "@mui/material";
import { useRouter } from "next/navigation";
import ResultRowActions from "@/modules/shared/component/Learning/ResultRowActions/resultRowActions";
import useResultsPage from "@/modules/shared/component/Learning/hooks/useResultsPage";
import { DashboardRoutes } from "@/routes/dashboard.routes";
import { StaffRoutes } from "@/routes/staff.routes";
import ConfirmModal from "@/components/ConfirmModal/confirmModal";
import TrashIcon from "@/modules/shared/assets/svgs/trashicon.svg";

import { showToast } from "@/modules/shared/component/Toast";
import { SearchTextfield } from "@/modules/shared/component/SearchTextfield";

export default function ResultsPage({ role = "admin" }: { role?: "admin" | "staff" }) {
  const routes = role === "admin" ? DashboardRoutes : (StaffRoutes as any);
  const { selectedFilter, teachers, curriculum, handleSearch } = useResultsPage(role);
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  //   const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedTeacherIdx, setSelectedTeacherIdx] = useState<number | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

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
      setCurrentPage(1);
    }
  };

  const getStatusBadge = (status: string) => {
    const base = "px-5 py-[3px] !w-[100px] text-xs font-medium rounded-full text-center";
    switch (status.toLowerCase()) {
      case "pass":
        return <span className={`${base} bg-success-green/15 text-success-green`}>Pass</span>;
      case "failed":
        return <span className={`${base} bg-badge-red/15 w-full text-badge-red`}>Failed</span>;
      default:
        return status;
    }
  };

  const renderRowActions = (idx: number) => (
    <ResultRowActions
      onView={() => {
        router.push(`${routes.results}/${idx}`);
      }}
      onDelete={() => {
        setSelectedTeacherIdx(idx);
        setDeleteModalOpen(true);
      }}
    />
  );

  const handleDelete = () => {
    showToast({
      message: "Teacher Deleted",
      description: "The teacher has been successfully deleted.",
      severity: "success",
      duration: 3000,
    });
    setDeleteModalOpen(false);
  };

  const row = curriculum.map((owner, idx) => ({
    0: owner.childName,
    1: owner.classes,
    2: owner.score,
    3: owner.grade,
    4: owner.assessmentTaken,
    5: getStatusBadge(owner.status),
    6: renderRowActions(idx),
  }));

  //   const paginatedData = rows.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const paginatedData = row.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const totalItems = teachers.length;

  return (
    <Box className="h-full  space-y-6">
      <Box className="w-full flex items-center justify-between gap-4">
        <SearchTextfield onChange={handleSearch} placeholder="Search by child name, status, etc" />
      </Box>
      <Box className="!pb-4 rounded-xl">
        <Box className="bg-white rounded-xl border !border-border-table">
          <Table
            headers={[
              " Name",
              "Class",
              "Average Score",
              "Overall Grade",
              "Assessment Taken",
              "Status",
              "Action",
            ]}
            tableData={paginatedData}
            isCollapse
            centeredHeaderIndex={[2, 3, 4, 5]}
            className="relative"
          />
        </Box>

        <Box className="flex justify-center pt-4">
          <PaginationControls
            currentPage={currentPage}
            rowsPerPage={rowsPerPage}
            totalItems={totalItems}
            onPageChange={handlePageChange}
            isCondense
            bottomTableClasses="!text-xs"
          />
        </Box>
      </Box>

      <ConfirmModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        icon={<TrashIcon />}
        title="Are you sure you want to delete this teacher?"
        description="This action cannot be undone. Once deleted, all related data will be permanently removed."
        confirmLabel="Delete"
        cancelLabel="Cancel"
      />
    </Box>
  );
}
