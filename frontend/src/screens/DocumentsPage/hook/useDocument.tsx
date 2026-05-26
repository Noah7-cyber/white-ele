import { IconButton } from "@mui/material";
import { ActionModal } from "@/modules/shared/component/ActionModal/actionModal";
import { MoreHoriz } from "@mui/icons-material";
import { documents } from "../constants";
import { useState } from "react";

export function useDocument() {
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleOpenPDF = (url: string) => {
    window.open(url, "_blank");
  };

  const documentTable = documents?.map((doc) => {
    return {
      Name: (
        <div className="flex flex-col items-start">
          <span className="!text-md">{doc.name}</span>
          <span className="!text-xs !text-primary-text-dark opacity-70 !font-light">
            {doc.size} . {doc.type}
          </span>
        </div>
      ),
      "Date Uploaded": doc.dateUploaded,
      "Uploaded by": doc.uploadedBy,
      Action: (
        <ActionModal
          actions={[
            {
              label: "View",
              onClick: () => {
                handleOpenPDF("/assets/previewInvoicePdf.pdf");
              },
              color: "!text-[#02273A]",
            },
            {
              label: "Delete",
              onClick: () => setShowDeleteModal(true),
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
  return { documentTable, showDeleteModal, setShowDeleteModal };
}
