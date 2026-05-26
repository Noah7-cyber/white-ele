/* eslint-disable @typescript-eslint/no-explicit-any */

import { Typography, Grid, Box, IconButton } from "@mui/material";

import AddIcon from "@/modules/shared/assets/svgs/addBorder.svg";
import React, { useEffect, useRef, useState } from "react";
import { Table } from "@/modules/shared/component/Table";
import { PaginationControls } from "@/modules/shared/component/Pagination/Pagination";
import { ActionModal } from "@/modules/shared/component/ActionModal/actionModal";
import TrashIcon from "@/modules/shared/assets/svgs/trashicon.svg";
import { MoreHoriz } from "@mui/icons-material";
import { useParams } from "next/navigation";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { uploadServices } from "@/services/upload.service";
import { showToast } from "@/modules/shared/component/Toast";
import ConfirmModal from "@/components/ConfirmModal/confirmModal";
import { Control, useWatch } from "react-hook-form";
import DocumentUpload from "@/modules/shared/component/DocumentUpload/documentUpload";

export default function DocumentTab({
  control,
  handleImageUpload,
  selectedImage,
  setValue,
  onRemoveDocument,
  onUploadingChange,
}: {
  control: Control<any>;
  handleImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  selectedImage: string | null;
  setValue: any;
  onRemoveDocument?: (doc: { id?: number }) => void;
  onUploadingChange?: (isUploading: boolean) => void;
}) {
  const params = useParams();
  const childId = params?.id as string | undefined;
  const documents = useWatch({ control, name: "documents" }) || [];

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [documentToRemove, setDocumentToRemove] = useState<any>(null);

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    onUploadingChange?.(isUploading);
  }, [isUploading, onUploadingChange]);

  const { mutateAsync: uploadDocumentAsync } = useMutationService({
    service: uploadServices.uploadDocuments,
    options: { isFormData: true, disableToast: true },
  });

  // Helpers
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

  const getFileType = (url: string, docName: string): "pdf" | "doc" | "docx" => {
    const lowerUrl = url.toLowerCase();
    const lowerName = docName.toLowerCase();
    if (lowerUrl.endsWith(".pdf") || lowerName.endsWith(".pdf")) return "pdf";
    if (lowerUrl.endsWith(".docx") || lowerName.endsWith(".docx")) return "docx";
    if (lowerUrl.endsWith(".doc") || lowerName.endsWith(".doc")) return "doc";
    return "docx";
  };

  const handleViewDocument = (doc: any) => {
    const fileType = getFileType(doc.documentUrl, doc.docName);
    if (fileType === "pdf") {
      window.open(doc.documentUrl, "_blank");
    } else {
      const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(doc.documentUrl)}&embedded=true`;
      window.open(viewerUrl, "_blank");
    }
  };

  // Remove from table only; actual delete happens when user clicks main Save
  const handleDeleteConfirm = () => {
    if (documentToRemove && onRemoveDocument) {
      onRemoveDocument(documentToRemove);
    }
    setShowDeleteModal(false);
    setDocumentToRemove(null);
  };

  const handleAddDocument = () => {
    fileInputRef.current?.click();
  };

  const ALLOWED_DOC_TYPES = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isAllowed =
      ALLOWED_DOC_TYPES.includes(file.type) ||
      /\.(pdf|doc|docx)$/i.test(file.name);
    if (!isAllowed) {
      showToast({
        message: "Invalid file type",
        description: "Only PDF and Word documents (.doc, .docx) are allowed. Images are not allowed.",
        severity: "error",
        duration: 4000,
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("documents", file);
      formData.append("folder", "documents");
      const response: any = await uploadDocumentAsync(formData);
      const uploaded = response.files?.[0];
      if (uploaded) {
        const newDoc = {
          docName: file.name,
          documentUrl: uploaded.url,
          dateUploaded: new Date().toISOString(),
        };
        setValue("documents", [...documents, newDoc]);
        showToast({
          message: "Document uploaded successfully",
          severity: "success",
          duration: 3000,
        });
      }
    } catch (error) {
      showToast({
        message: "Failed to upload document",
        severity: "error",
        duration: 3000,
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };


  const getFileTypeUniversal = (doc: any): string => {
    if (!doc) return "";
    if (doc.documentUrl || doc.docName) {

      const url = doc.documentUrl?.toLowerCase() || "";
      const name = doc.docName?.toLowerCase() || "";
      if (url.endsWith(".pdf") || name.endsWith(".pdf")) return "PDF";
      if (url.endsWith(".docx") || name.endsWith(".docx")) return "DOCX";
      if (url.endsWith(".doc") || name.endsWith(".doc")) return "DOC";
      if (url.endsWith(".png") || name.endsWith(".png")) return "IMG";
      if (
        url.endsWith(".jpg") ||
        url.endsWith(".jpeg") ||
        name.endsWith(".jpg") ||
        name.endsWith(".jpeg")
      )
        return "IMG";
      return "DOCX";
    }
    // File object
    if (doc.type) {
      if (doc.type === "application/pdf") return "PDF";
      if (doc.type === "application/msword") return "DOC";
      if (doc.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
        return "DOCX";
      if (doc.type.startsWith("image/")) return "IMG";
      return "DOCX";
    }

    return "DOCX";
  };

  const getFileNameUniversal = (doc: any): string => {
    if (doc.docName) return doc.docName;
    if (doc.name) return doc.name;
    return "Unknown";
  };

  const getFileSizeUniversal = (doc: any): string => {
    if (doc.size) {
      if (doc.size < 1024) return doc.size + " B";
      if (doc.size < 1024 * 1024) return (doc.size / 1024).toFixed(2) + " KB";
      return (doc.size / (1024 * 1024)).toFixed(2) + " MB";
    }
    return "";
  };


  // Delete logic: existing docs (with id) → confirm modal then onRemoveDocument; new files → remove from form only
  const handleDeleteClick = (doc: any, index: number) => {
    if (doc.id && onRemoveDocument) {
      setDocumentToRemove(doc);
      setShowDeleteModal(true);
    } else {
      handleDeleteNewFile(index);
    }
  };

  const handleDeleteNewFile = (index: number) => {
    const updatedDocs = documents.filter((_: any, i: number) => i !== index);
    setValue("documents", updatedDocs);
  };

  // Table data
  const documentTable = documents?.map((doc: any, index: number) => {
    const fileType = getFileTypeUniversal(doc);
    const fileName = getFileNameUniversal(doc);
    const fileSize = getFileSizeUniversal(doc);

    return {
      Name: (
        <div className="flex flex-col items-start">
          <span className="!text-md">{fileName}</span>
          <span className="!text-xs !text-primary-text-dark opacity-70 !font-light">
            {fileType}
          </span>
          {fileSize && <span className="!text-xs !text-gray-400">{fileSize}</span>}
        </div>
      ),
      "Date Uploaded": formatDate(doc.dateUploaded),
      Action: (
        <ActionModal
          actions={[
            {
              label: "View",
              onClick: () => handleViewDocument(doc),
              color: "!text-[#02273A]",
            },
            {
              label: "Delete",
              onClick: () => handleDeleteClick(doc, index),
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

  if (!childId) {
    return (
      <Box className="flex flex-col gap-5 !bg-white !px-4 md:!px-5 rounded-xl pb-5">
        <Box className="flex items-center justify-between">
          <Box className="py-4 border-b border-border-lightGray flex flex-col">
            <Typography className="!font-bold  !text-lg !text-primary-dark">
              Document & Files
            </Typography>
            <Typography className="!font-normal !text-sm !text-text-gray">
              Basic information about your child.
            </Typography>
          </Box>
        </Box>
        <DocumentUpload name="documents" control={control} maxFiles={5} acceptOnlyPdfAndDocs />
      </Box>
    );
  }

  return (
    <Box className="flex flex-col gap-5 !bg-white !px-4 md:!px-5 rounded-xl pb-5">
      <Box className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        <Box className="py-4 border-b md:border-b-0 border-border-lightGray flex flex-col">
          <Typography className="!font-bold  !text-lg !text-primary-dark">
            Document & Files
          </Typography>
          <Typography className="!font-normal !text-sm !text-text-gray">
            Basic information about your child.
          </Typography>
        </Box>
        <button
          className="flex items-center cursor-pointer gap-1.5 px-4 py-2 text-brandColor-active hover:bg-brandColor-active/5 rounded-lg transition-colors self-start md:self-auto"
          onClick={handleAddDocument}
          disabled={isUploading}
        >
          <AddIcon />
          <Typography className="!text-sm !font-medium">Add new document</Typography>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={handleFileChange}
        />
      </Box>

      <Box className="overflow-x-auto">
      <Table
        headers={["Name", "Date Uploaded", "Action"]}
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
      <ConfirmModal
        open={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDocumentToRemove(null);
        }}
        onConfirm={handleDeleteConfirm}
        icon={<TrashIcon />}
        title="Are you sure you want to delete this?"
        description="The document will be removed from the list. Click Save to apply changes and delete it permanently."
        confirmLabel="Remove"
        cancelLabel="Cancel"
      />
      <Box className="flex justify-center pt-4">
        <PaginationControls
          currentPage={currentPage}
          rowsPerPage={rowsPerPage}
          totalItems={documents.length}
          onPageChange={({ page, rowsPerPage: newRowsPerPage }) => {
            setCurrentPage(page);
            if (newRowsPerPage !== rowsPerPage) {
              setRowsPerPage(newRowsPerPage);
              setCurrentPage(1);
            }
          }}
          isCondense
          bottomTableClasses="!text-xs"
        />
      </Box>
    </Box>
  );
}
