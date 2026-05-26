import AdmissionLiveForm, {
  FormData,
} from "@/modules/admin/page/AdmissionLiveForm/admissionLiveForm";
import { Modal } from "@/modules/shared/component/modal";
import { Typography } from "@mui/material";
import React, { FC } from "react";
import { X } from "lucide-react";

interface FormPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  previewData: FormData;
  contentClassName?: string;
}

const FormPreviewModal: FC<FormPreviewModalProps> = ({
  isOpen,
  onClose,
  previewData,
  contentClassName,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="md:w-175 w-[90vw] rounded-md!"
      width="700px"
    >
      <div className="flex flex-col bg-dashboard max-h-[85vh]">
        <div className="flex flex-row items-center justify-between py-4 px-10 shrink-0">
          <Typography className="text-2xl! font-semibold! tracking-tight text-brandColor-active!">
            Preview
          </Typography>
          <X className="cursor-pointer text-brandColor-active!" onClick={onClose} size={20} />
        </div>
        <div className="overflow-y-auto scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <AdmissionLiveForm
            previewData={previewData}
            preview
            contentClassName={contentClassName}
          />
        </div>
      </div>
    </Modal>
  );
};

export default FormPreviewModal;
