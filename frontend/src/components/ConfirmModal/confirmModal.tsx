"use client";

import * as React from "react";
import { Modal, Box } from "@mui/material";
import { Button } from "@/modules/shared/component/Button/WPButton";
import { useMediaQuery } from "@/utils/hooks/useMediaQuery";

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  confirmLabel?: string;
  confirmLabelClassName?: string;
  cancelLabel?: string;
  confirmClassName?: string;
  loading?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  loading,
  onClose,
  onConfirm,
  icon,
  title = "Are you sure?",
  description = "This action cannot be undone. Please confirm.",
  confirmLabel = "Confirm",
  confirmLabelClassName,
  cancelLabel = "Cancel",
}) => {
  const isMobile = useMediaQuery("(max-width: 767px)");

  return (
    <Modal
      open={open}
      onClose={onClose}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.2)",
      }}
    >
      <Box
        className={`bg-white !h-fit shadow-xl text-center ${
          isMobile ? "w-[90vw] max-w-[620px] rounded-[24px] px-6 py-8" : "w-[480px] rounded-lg px-6 py-8"
        }`}
        sx={{
          outline: "none",
          height: "auto",
          maxHeight: isMobile ? "none" : "45vh",
        }}
      >
        {/* Icon */}
        {icon && (
          <div className={`flex justify-center ${isMobile ? "mb-3" : "mb-4"}`}>
            <div className="w-25 h-20 rounded-full flex items-center justify-center">{icon}</div>
          </div>
        )}

        {/* Title */}
        <h2
          className={`font-semibold text-gray-900 ${
            isMobile ? "text-[18px] leading-[1.25] mb-3" : "text-lg mb-2"
          }`}
        >
          {title}
        </h2>

        {/* Description */}
        <p
          className={`text-gray-400 leading-relaxed ${
            isMobile ? "text-[14px] mb-7 max-w-[280px] mx-auto" : "text-sm mb-5"
          }`}
        >
          {description}
        </p>

        {/* Buttons */}
        <div className={`flex justify-center w-full ${isMobile ? "gap-3" : "gap-3"}`}>
          <Button
            onClick={onClose}
            isRounded={false}
            className={`rounded-full !border !font-medium hover:bg-gray-50 transition cursor-pointer ${
              isMobile
                ? "flex-1 !border-transparent !bg-[#F7F7F7] !text-primary-dark-text text-[14px] py-3"
                : "px-5 w-48 py-2.5 !border-gray-300 !text-primary-dark-text text-sm"
            }`}
            sx={{
              borderRadius: isMobile ? "12px" : "8px",
              textTransform: "none",
              backgroundColor: isMobile ? "#F7F7F7" : "#fff",
              px: 2,
              height: isMobile ? "52px" : "40px",
              whiteSpace: "nowrap",
              color: "#022F2F",
            }}
          >
            {cancelLabel}
          </Button>
          <Button
            variant="contained"
            isRounded={false}
            loading={loading}
            onClick={onConfirm}
            className={`${confirmLabelClassName} ${
              isMobile ? "flex-1 py-3 text-[14px]" : "px-5 !w-48 py-2.5"
            }`}
            sx={{
              borderRadius: isMobile ? "12px" : "8px",
              textTransform: "none",
              ":hover": { backgroundColor: "#0B7568" },
              px: 2,
              height: isMobile ? "52px" : "40px",
              whiteSpace: "nowrap",
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </Box>
    </Modal>
  );
};

export default ConfirmModal;
