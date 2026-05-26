"use client";

import type React from "react";
import { useParams } from "next/navigation";

import { Table } from "@/modules/shared/component/Table/table";
import { Box, IconButton, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useResultsDetail } from "@/modules/shared/component/Learning/hooks/useResultsDetails";
import ConfirmModal from "@/components/ConfirmModal/confirmModal";
import WarnIcon from "@/modules/shared/assets/svgs/warnIcon.svg";
import TrashIcon from "@/modules/shared/assets/svgs/trashicon.svg";
import DownloadIcon from "@/modules/shared/assets/svgs/downloadOutline.svg";
import ShareIcon from "@/modules/shared/assets/svgs/share.svg";
import LeftIcon from "@/modules/shared/assets/images/chevronBack.png";
import Image from "next/image";

import { useState } from "react";
import { PaginationControls } from "@/modules/shared/component/Pagination";
import ResultRowActions from "@/modules/shared/component/Learning/ResultRowActions/resultRowActions";
import { EditScoreModal } from "@/modules/shared/component/Learning/EditScoreModal/editScoreModal";


interface ResultsDetailsPageProps {
  params?: Promise<{ id: string }>;
}

export const ResultsDetails: React.FC<ResultsDetailsPageProps> = ({ params }) => {
  const router = useRouter();
  const { id, tab } = useParams() as { id: string; tab: string };

  // const { classId } = useParams<{ classId: string }>();
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const {
    results,
    resultLists,
    childName,
    deactivateModalOpen,
    setDeactivateModalOpen,
    deleteModalOpen,
    setDeleteModalOpen,
    handleDeactivate,
    handleDelete,
    statsInfo,
    editScoreModalOpen,
    setEditScoreModalOpen,
    editControl,
    handleSaveEditScore,
    handleOpenEditModal,
    selectedResultIndex,
  } = useResultsDetail(id as string);

  // const [activeTab, setActiveTab] = useState<DetailTab>((tab as DetailTab) || "profile");

  //   if (!results) {
  //     return <div className="p-5">Classroom not found</div>;
  //   }

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
        return <span className={`${base} bg-[#EDFFF7] text-success-green`}>Pass</span>;
      case "failed":
        return <span className={`${base} bg-badge-red/15 w-full text-badge-red`}>Failed</span>;
      default:
        return status;
    }
  };

  const renderRowActions = (idx: number) => (
    <ResultRowActions
      onEdit={() => {
        handleOpenEditModal(idx);
      }}
    />
  );

  const row = resultLists.map((owner, idx) => ({
    0: owner.childName,
    1: owner.subject,
    2: owner.score,
    3: owner.grade,
    4: owner.date,
    5: getStatusBadge(owner.status),
    6: renderRowActions(idx),
  }));

  const paginatedData = row.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const totalItems = resultLists.length;

  return (
    <>
      <Box className="h-full p-5 space-y-6">
        {/* Header */}
        <Box className="flex items-center justify-between">
          <Box className="flex items-center gap-3">
            <IconButton
              onClick={() => router.back()}
              className="!rounded-full !border !border-brandColor-active/20"
            >
              <Image src={LeftIcon || "/placeholder.svg"} alt="back" width={20} height={20} />
            </IconButton>
            <Box>
              <Typography className="!text-xl !font-semibold">{childName}</Typography>
            </Box>
          </Box>
          <Box className="flex items-center justify-center border-[1px] border-border-input rounded-lg overflow-">
            <IconButton
              className="p-2 !border-r-[0.5px]  !border-border-input !rounded-none"
              onClick={() => console.log("Download clicked")}
            >
              <DownloadIcon />
            </IconButton>

            <IconButton
              className="p-2 !border-l-[0.5px] !border-border-input !rounded-none"
              onClick={() => console.log("Share clicked")}
            >
              <ShareIcon />
            </IconButton>
          </Box>
        </Box>

        <Box className="bg-white border border-brandColor-active/20 rounded-lg p-6 ">
          <Box className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {statsInfo.map((item, idx) => (
              <Box key={idx}>
                <p className="text-sm text-[#667085] mb-1">{item.label}</p>
                <p className="text-base font-medium text-[#101828]">{getStatusBadge(item.value)}</p>
              </Box>
            ))}
          </Box>
        </Box>

        <Box className=" rounded-xl overflow- flex flex-col gap-3 flex-1">
          <Box className="flex-1 !bg-white rounded-xl overflow-auto">
            <Table
              headers={[
                "Assessment Title",
                "Subject",
                "Score",
                "Grade",
                "Date",
                "Status",
                "Action",
              ]}
              tableData={paginatedData}
              isCollapse
              centeredHeaderIndex={[1, 2, 3, 4, 5, 6]}
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
        </Box>

        <ConfirmModal
          open={deactivateModalOpen}
          onClose={() => setDeactivateModalOpen(false)}
          onConfirm={handleDeactivate}
          icon={<WarnIcon />}
          title="Are you sure you want to deactivate this classroom?"
          description="You will be able to reactivate this classroom later."
          confirmLabel="Deactivate"
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
      </Box>

      <ConfirmModal
        open={deactivateModalOpen}
        onClose={() => setDeactivateModalOpen(false)}
        onConfirm={handleDeactivate}
        icon={<WarnIcon />}
        title="Are you sure you want to deactivate this child?"
        description="You will be able to reactivate this child later."
        confirmLabel="Deactivate"
        cancelLabel="Cancel"
      />

      <ConfirmModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        icon={<TrashIcon />}
        title="Are you sure you want to delete this child?"
        description="This action cannot be undone. Once deleted, all related data will be permanently removed."
        confirmLabel="Delete"
        cancelLabel="Cancel"
      />

      <EditScoreModal
        isOpen={editScoreModalOpen}
        onClose={() => setEditScoreModalOpen(false)}
        onSave={handleSaveEditScore}
        control={editControl}
        childName={childName}
        score={selectedResultIndex !== null ? resultLists[selectedResultIndex]?.score : 0}
        totalMarks={100}
      />
    </>
  );
};

export default ResultsDetails;
