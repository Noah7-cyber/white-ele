"use client";

import React from "react";
import { CustomModal } from "@/modules/shared/component/CustomModal";
import { Button } from "@/modules/shared/component/Button/WPButton";
import { useMediaQuery } from "@/utils/hooks/useMediaQuery";

interface ParentDeleteConfirmModalProps {
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ParentDeleteConfirmModal: React.FC<ParentDeleteConfirmModalProps> = ({
  open,
  loading,
  onClose,
  onConfirm,
}) => {
  const isMobile = useMediaQuery("(max-width: 767px)");

  return (
    <CustomModal
      isOpen={open}
      onClose={onClose}
      className="!p-0"
      width={isMobile ? "100%" : "520px"}
      radius={isMobile ? "16px 16px 0 0" : "16px"}
      maxHeight="80vh"
      modalStyle={
        isMobile
          ? {
              alignItems: "flex-end",
              justifyContent: "center",
            }
          : undefined
      }
      contentStyle={
        isMobile
          ? {
              bottom: 0,
              left: 0,
              transform: "none",
            }
          : undefined
      }
    >
      <div className="px-6 py-8 text-center">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Are you sure you want to delete this?
        </h2>
        <p className="text-sm text-gray-400 mb-6">
          This action cannot be undone once deleted
        </p>

        <div className="flex gap-4 justify-center">
          <Button
            onClick={onClose}
            isRounded={false}
            className="px-6 w-40 py-2.5 rounded-full !border !border-gray-200 !text-primary-dark-text !font-medium text-sm hover:bg-gray-50 transition cursor-pointer"
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              backgroundColor: "#F5F5F5",
              px: 2,
              height: "44px",
              whiteSpace: "nowrap",
              color: "#0B2E2E",
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            isRounded={false}
            loading={loading}
            onClick={onConfirm}
            className="px-6 w-40 py-2.5 !bg-red-600 hover:!bg-red-700 !text-white"
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              px: 2,
              height: "44px",
              whiteSpace: "nowrap",
            }}
          >
            Delete
          </Button>
        </div>
      </div>
    </CustomModal>
  );
};

