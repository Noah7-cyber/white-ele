"use client";

import { useState } from "react";
import { Box, IconButton, Modal, Typography } from "@mui/material";
import { Table } from "@/modules/shared/component/Table";
import { PaginationControls } from "@/modules/shared/component/Pagination/Pagination";
import { tableHeaders } from "./constants";
import ConfirmModal from "@/components/ConfirmModal/confirmModal";
import TrashIcon from "@/modules/shared/assets/svgs/trashicon.svg";
import { ActionModal } from "@/modules/shared/component/ActionModal/actionModal";
import { MoreHoriz } from "@mui/icons-material";
import { uploadServices } from "@/services/upload.service";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { showToast } from "@/modules/shared/component/Toast";
import {
  documentServices,
  studentDocumentDynamicEndpoints,
} from "@/services/studentdocument.service";

interface UploadedDocument {
  id?: number;
  phone: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}
interface Document {
  id?: number;
  docName: string;
  documentUrl: string;
  verified?: boolean;
  dateUploaded?: string;
  uploadedBy?: UploadedDocument;
  studentId?: number;
}

interface DocumentsPageProps {
  documents: Document[];
  childId?: string;
  /** Called after a document is successfully deleted so the parent can refetch child data. */
  onDocumentDeleted?: () => void;
}

export default function DocumentsPage({ documents, onDocumentDeleted }: DocumentsPageProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentDocumentId, setCurrentDocumentId] = useState<number | null>(null);
  const [currentDocumentUrl, setCurrentDocumentUrl] = useState<string>("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewTitle, setPreviewTitle] = useState("");

  const { mutateAsync: deleteDocumentAsync, isPending: isDeletingDocument } = useMutationService({
    service: studentDocumentDynamicEndpoints.deleteDocument(currentDocumentId!),
    options: { disableToast: true },
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
      setCurrentPage(1);
    }
  };

  const handleDeleteClick = (id: number, docUrl: string) => {
    setCurrentDocumentId(id);
    setCurrentDocumentUrl(docUrl);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      // Extract file path from URL (e.g., "documents/12345.pdf")
      // Assuming documentUrl is the full URL, we need to extract the path
      const urlParts = currentDocumentUrl.split("/");
      const fileName = urlParts.slice(-2).join("/"); // Get last two parts: folder/filename

      await deleteDocumentAsync({});

      showToast({
        message: "Document deleted successfully",
        severity: "success",
        duration: 3000,
      });
      onDocumentDeleted?.();
    } catch (error) {
      console.error("Error deleting document:", error);
      showToast({
        message: "Failed to delete document",
        severity: "error",
        duration: 3000,
      });
    } finally {
      setShowDeleteModal(false);
      setCurrentDocumentId(null);
      setCurrentDocumentUrl("");
    }
  };

  // Format date to "18th Jan 2020" format
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return "";

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const day = date.getDate();
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const year = date.getFullYear();

    // Get ordinal suffix (st, nd, rd, th)
    const getOrdinalSuffix = (n: number): string => {
      if (n > 3 && n < 21) return "th";
      switch (n % 10) {
        case 1:
          return "st";
        case 2:
          return "nd";
        case 3:
          return "rd";
        default:
          return "th";
      }
    };

    return `${day}${getOrdinalSuffix(day)} ${monthNames[date.getMonth()]} ${year}`;
  };

  // Get file type from document URL or name
  const getFileType = (url: string, docName: string): "pdf" | "doc" | "docx" => {
    const lowerUrl = url.toLowerCase();
    const lowerName = docName.toLowerCase();

    if (lowerUrl.endsWith(".pdf") || lowerName.endsWith(".pdf")) {
      return "pdf";
    } else if (lowerUrl.endsWith(".docx") || lowerName.endsWith(".docx")) {
      return "docx";
    } else if (lowerUrl.endsWith(".doc") || lowerName.endsWith(".doc")) {
      return "doc";
    }
    // Default to docx if unknown
    return "docx";
  };

  // Handle document viewing based on file type
  const handleViewDocument = (doc: Document) => {
    const fileType = getFileType(doc.documentUrl, doc.docName);

    const nextUrl =
      fileType === "pdf"
        ? doc.documentUrl
        : `https://docs.google.com/viewer?url=${encodeURIComponent(doc.documentUrl)}&embedded=true`;
    setPreviewTitle(doc.docName);
    setPreviewUrl(nextUrl);
    setPreviewOpen(true);
  };

  const totalItems = documents.length;
  const documentTable = documents?.map((doc) => {
    const fileType = getFileType(doc.documentUrl, doc.docName);

    return {
      Name: (
        <div className="flex flex-col items-start">
          <span className="!text-md">{doc.docName}</span>
          <span className="!text-xs !text-primary-text-dark opacity-70 !font-light">
            {fileType.toUpperCase()}
          </span>
        </div>
      ),
      "Date Uploaded": formatDate(doc.dateUploaded),
      "Uploaded by": `${doc.uploadedBy?.firstName} ${doc.uploadedBy?.lastName}` || "N/A",
      Action: (
        <ActionModal
          actions={[
            {
              label: "View",
              onClick: () => {
                handleViewDocument(doc);
              },
              color: "!text-[#02273A]",
            },
            {
              label: "Delete",
              onClick: () => {
                if (doc.id) {
                  handleDeleteClick(doc.id, doc.documentUrl);
                }
              },
              color: "!text-[#02273A]",
            },
          ]}
          classNames="items-center !gap-0 !p-1"
          customModalclassNames="!p-0"
          width={140}
          Iconcomponent={({ onClick, ref }) => (
            <IconButton ref={ref} onClick={onClick} size="small">
              <MoreHoriz />
            </IconButton>
          )}
        />
      ),
    };
  });

  return (
    <Box className="w-full rounded-2xl px-3 py-4 sm:px-5 md:p-6 bg-dashboard-bg md:bg-white">
      <Box className="flex flex-col justify-between mb-4 md:mb-6">
        <Typography className="!text-xl !font-bold text-primary-text-dark mb-0">
          Documents & Files
        </Typography>
        <Typography className="!text-sm !font-light text-[#888888] mb-0">
          Basic information about your child.
        </Typography>
      </Box>
      <Box className="w-full -mx-3 px-3 sm:mx-0 sm:px-0 overflow-x-auto [scrollbar-width:thin]">
        <Box className="min-w-[640px] md:min-w-0">
          <Table
            headers={tableHeaders}
            tableData={documentTable}
            headerRowClassName="!bg-[#F9FAFB] !border-b !border-[#E4E7EC] !text-sm"
            headerCellClassName="!text-center !text-dark font-avenir !font-medium"
            bodyCellClassName="!text-secondary-text-gray !text-md !font-medium font-avenir !text-center align-middle !py-4"
            bodyRowClassName="border-b border-[#E4E7EC] last:border-0"
            tableContainerClassName="!border !border-[#E4E7EC] !rounded-lg !overflow-hidden !bg-white"
            isCollapse={true}
            isCondense={true}
            leftAlignedIndex={[0]}
          />
        </Box>
      </Box>
      <ConfirmModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        icon={<TrashIcon />}
        title="Are you sure you want to delete this?"
        description="This action cannot be undone. Once deleted, all related data will be permanently removed."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        loading={isDeletingDocument}
      />
      <Modal open={previewOpen} onClose={() => setPreviewOpen(false)}>
        <Box className="h-[90vh] w-[92vw] max-w-[1100px] bg-white rounded-xl mx-auto mt-[3vh] flex flex-col">
          <Box className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <Typography className="!text-sm !font-semibold">
              {previewTitle || "Document preview"}
            </Typography>
            <button
              type="button"
              onClick={() => setPreviewOpen(false)}
              className="text-sm text-gray-600 hover:text-gray-900 cursor-pointer"
            >
              Close
            </button>
          </Box>
          <Box className="flex-1">
            <iframe title="Document preview" src={previewUrl} className="w-full h-full border-0" />
          </Box>
        </Box>
      </Modal>
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
  );
}
