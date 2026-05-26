/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useCallback } from "react";
import { Box, Button, IconButton, Typography, Divider, CircularProgress } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { CWTextField } from "@/modules/shared/component/FormFields/CWTextField";
import { CWTextArea } from "@/modules/shared/component/FormFields/CWTextArea";
import { useFormValidator } from "@/utils/hooks/useFormValidator";
import * as yup from "yup";
import type { SendOfferEmailData } from "../../page/LeadsAndRequests/hooks/useSendOffer";
import Dropzone from "react-dropzone";
import { useMediaQuery } from "@/utils/hooks/useMediaQuery";
import { MobileFormDrawer } from "@/modules/shared/component/MobileFormDrawer/MobileFormDrawer";

interface SendOfferEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: SendOfferEmailData | null;
  onSend?: (data: any) => void;
  onAddAttachment?: (file: File) => void;
  onRemoveAttachment?: (index: number) => void;
  isUploadingDocuments?: boolean;
  isLoading?: boolean;
}

const sendOfferEmailSchema = yup.object().shape({
  to: yup.string().email("Invalid email").required("Recipient email is required"),
  subject: yup.string().required("Subject is required"),
  body: yup.string().required("Message body is required"),
});




const SendOfferEmailModal: React.FC<SendOfferEmailModalProps> = ({
  isOpen,
  onClose,
  data,
  onSend,
  onAddAttachment,
  onRemoveAttachment,
  isUploadingDocuments,
  isLoading = false,
}) => {
  const isMobile = useMediaQuery("(max-width:768px)");
  const { control, handleSubmit } = useFormValidator({
    validationSchema: sendOfferEmailSchema,
    values: {
      to: data?.to || "",
      subject: data?.subject || "",
      body: data?.body || "",
    },
  });

  const onSubmit = (formData: any) => {
    onSend?.({
      ...formData,
      attachments: data?.attachments || [],
    });
    // Do NOT call onClose() here — the parent's handleSendFinalOffer closes
    // the modal after the API call succeeds.
  };

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      acceptedFiles.forEach((file) => {
        onAddAttachment?.(file);
      });
    },
    [onAddAttachment],
  );

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  if (!isOpen) return null;

  const content = (
    <div
      className={`space-y-6 ${isMobile ? "px-0 py-2 pb-32" : "px-6 py-4 max-h-[75vh] overflow-y-auto custom-scrollbar"}`}
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-5">
          <CWTextField
            name="to"
            control={control}
            fullWidth
            labelOnTop
            label="Recipient"
            size="small"
            disabled={!!data?.to}
            startIcon={<Typography className="!text-[#4F4F4F] !text-xs !font-normal">To:</Typography>}
            inputClasses="!rounded-lg !font-semibold flex items-center"
            labelClassName="!text-sm !font-medium !text-input-gray"
          />

          <CWTextField
            name="subject"
            control={control}
            fullWidth
            size="small"
            startIcon={<Typography className="!text-[#4F4F4F] !text-xs !font-normal">Subject:</Typography>}
            inputClasses="!rounded-lg !text-[#022F2F] !font-semibold"
          />

          <CWTextArea
            name="body"
            control={control}
            fullWidth
            minRows={8}
            maxRows={12}
            placeholder="Enter message..."
            labelClassName="!text-sm !font-medium !text-input-gray"
            inputClasses="mt-1 !text-sm  !text-input-gray"
            className="!text-xs !text-[#344054] !font-normal"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <Typography className="!text-sm !font-medium text-[#022F2F]">Attachments</Typography>
          <Dropzone onDrop={onDrop}>
            {({ getRootProps, getInputProps }) => (
              <div {...getRootProps()}>
                <input {...getInputProps()} />
                <Button
                  size="small"
                  className="!text-[#008080] !text-xs !font-semibold !normal-case !bg-transparent hover:!bg-[#0080800A] !whitespace-nowrap"
                >
                  + Add attachment
                </Button>
              </div>
            )}
          </Dropzone>
        </div>

        <div className="space-y-2">
          {data?.attachments.map((attachment, idx) => {
            return (
              <div
                key={`${attachment.url}-${idx}`}
                className="flex items-center justify-between gap-2 rounded-lg border border-[#EAECF0] p-3 bg-[#F9FAFB]"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#008080] text-white shrink-0">
                    <UploadFileIcon />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#344054] truncate">{attachment.name}</p>
                    <p className="text-xs text-[#667085] truncate">{attachment.url}</p>
                  </div>
                </div>

                <IconButton
                  size="small"
                  className="text-[#98A2B3] hover:text-[#F04438]"
                  onClick={() => onRemoveAttachment?.(idx)}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const footer = (
    <div className={`flex gap-3 ${isMobile ? "flex-col-reverse" : "justify-end"}`}>
      <Button
        variant="outlined"
        onClick={onClose}
        className={`!border-[#D0D5DD] !text-[#344054] !rounded-lg !px-5 !py-2 !normal-case !font-semibold ${isMobile ? "!w-full" : ""}`}
      >
        Cancel
      </Button>
      <Button
        onClick={handleSubmit(onSubmit)}
        variant="contained"
        disabled={isLoading || isUploadingDocuments}
        className={`!bg-[#008080] hover:!bg-[#006666] !text-white !rounded-lg !px-8 !py-2 !normal-case !font-semibold shadow-sm disabled:!bg-opacity-50 ${isMobile ? "!w-full" : ""}`}
      >
        {(isLoading || isUploadingDocuments) && <CircularProgress size={20} className="!text-white" />}
        {!(isLoading || isUploadingDocuments) && "Send"}
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <MobileFormDrawer open={isOpen} onClose={onClose} title="Send Offer" footer={footer}>
        {content}
      </MobileFormDrawer>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <Box
        className="bg-white rounded-xl max-w-2xl w-full shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4">
          <Typography variant="h6" className="!font-bold text-[#022F2F]">
            Send Offer
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </div>

        <Divider className="w-full" />

        {/* Body */}
        {content}

        <Divider className="w-full" />

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 bg-white">{footer}</div>
      </Box>
    </div>
  );
};

export default SendOfferEmailModal;
