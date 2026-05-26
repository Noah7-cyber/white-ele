/* eslint-disable @typescript-eslint/no-explicit-any */

import { Typography, Box, IconButton } from "@mui/material";

import { Button } from "@/modules/shared/component/Button";
import React, { useRef, useState } from "react";
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
import { Control, useWatch, useFormContext } from "react-hook-form";

export default function DocumentTab({
  control,
  handleImageUpload: _handleImageUpload,
  selectedImage: _selectedImage,
  onRemoveDocument,
}: {
  control: Control<any>;
  handleImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  selectedImage: string | null;
  onRemoveDocument?: (doc: { id?: number }) => void;
}) {
  const params = useParams();
  const childId = params?.id as string | undefined;
  const { setValue } = useFormContext();
  const documents = useWatch({ control, name: "documents" }) || [];

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [documentToRemove, setDocumentToRemove] = useState<any>(null);

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload document mutation
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

  // Delete logic: only remove from table; actual delete happens on main Save
  const handleDeleteClick = (doc: any) => {
    setDocumentToRemove(doc);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    if (documentToRemove && onRemoveDocument) {
      onRemoveDocument(documentToRemove);
    }
    setShowDeleteModal(false);
    setDocumentToRemove(null);
  };

  // Upload logic
  const handleAddDocument = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("documents", file);
      formData.append("folder", "documents");
      // Optionally add childId if needed by backend
      if (childId) formData.append("studentId", childId);

      const response: any = await uploadDocumentAsync(formData);
      const uploaded = response.files?.[0];
      if (uploaded) {
        const newDoc = {
          docName: uploaded.fileName.replace(/^documents\//, ""),
          documentUrl: uploaded.url,
          dateUploaded: new Date().toISOString(),
          // Optionally add more fields as needed
        };
        setValue("documents", [...documents, newDoc]);
        showToast({
          message: "Document uploaded successfully",
          severity: "success",
          duration: 3000,
        });
      }
    } catch (_error) {
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

  // Table data
  const documentTable = documents?.map((doc: any) => {
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
              onClick: () => handleDeleteClick(doc),
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

  // Only show table if editing (childId exists)
  if (!childId) {
    return (
      <Box className="flex flex-col gap-5 !bg-white !px-4 md:!px-5 rounded-xl pb-5">
        <Box className="py-4 border-b border-border-lightGray flex flex-col">
          <Typography className="!font-bold  !text-lg !text-primary-dark">
            Document & Files
          </Typography>
          <Typography className="!font-normal !text-sm !text-text-gray">
            Basic information about your child.
          </Typography>
        </Box>
        <Typography className="!text-center !text-gray-400 !py-8">
          You can only manage documents after creating the child profile.
        </Typography>
      </Box>
    );
  }
  // return (
  //   <Box className="flex flex-col gap-5 !bg-white !px-5 rounded-xl pb-5">
  //     <Box className="py-4 border-b border-border-lightGray flex flex-col">
  //       <Typography className="!font-bold  !text-lg !text-primary-dark">
  //         Document & Files
  //       </Typography>
  //       <Typography className="!font-normal !text-sm !text-text-gray">
  //         Basic information about your child.
  //       </Typography>
  //     </Box>

  //     <Dropzone onDrop={(files) => console.log(files)}>
  //       {({ getRootProps, getInputProps }) => (
  //         <section className="border border-dashed border-border-input rounded-2xl py-8 px-4">
  //           <Box
  //             {...getRootProps()}
  //             className="w-full flex flex-col gap-y-3 items-center justify-center"
  //           >
  //             <>
  //               <input {...getInputProps()} />
  //               <Box className="flex flex-col gap-y-3 items-center justify-center cursor-pointer">
  //                 <Image src={UploadState} alt="image-upload-img" className="w-12 h-12" />
  //                 <Box className="flex flex-col gap-y-0.5 items-center ">
  //                   <p className="!text-xs !text-grey500">
  //                     <span className="!font-semibold !text-primary-text">Click to upload</span> or
  //                     drag and drop
  //                   </p>
  //                   <p className="!text-[10px] !text-brandColor-inactive">
  //                     PDF, PNG, WORD or DOCX (max. 12MB)
  //                   </p>
  //                 </Box>
  //               </Box>
  //             </>
  //             OR
  //             <Button className="!rounded-sm">
  //               <Typography className="!font-medium !text-xs  !text-white">Browse Files</Typography>
  //             </Button>
  //           </Box>
  //         </section>
  //       )}
  //     </Dropzone>
  //   </Box>
  // );

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
        <Box className="flex justify-end mb-4 md:mb-0">
          <Button
            variant="contained"
            color="primary"
            onClick={handleAddDocument}
            disabled={isUploading}
          >
            {isUploading ? "Uploading..." : "Add Document"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            aria-label="Upload Document"
            accept=".pdf,.doc,.docx"
            className="hidden"
            onChange={handleFileChange}
          />
        </Box>
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
