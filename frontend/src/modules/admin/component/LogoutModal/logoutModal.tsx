"use client";

import * as React from "react";
import { Modal, Box, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { ReusableButton } from "../../../shared/component/CustomButton";

interface LogoutModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const LogoutModal: React.FC<LogoutModalProps> = ({ open, onClose, onConfirm }) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      disableAutoFocus
      disableEnforceFocus
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Box
        className="w-[92vw] max-w-[400px] rounded-xl bg-white font-sans text-sm shadow-lg max-h-[85dvh] overflow-y-auto"
        sx={{ outline: "none" }}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <span className="text-base font-semibold text-gray-900">Logout</span>
          <IconButton onClick={onClose} size="small" className="text-gray-500">
            <CloseIcon fontSize="small" />
          </IconButton>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6">
          <p className="text-base text-gray-700">Are you sure you want to log out?</p>

          {/* Buttons */}
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
            <ReusableButton
              label="Yes, Logout"
              variant="primary"
              size="md"
              onClick={onConfirm}
              className="rounded-full w-full sm:w-auto"
            />
            <ReusableButton
              label="No, Cancel"
              variant="secondary"
              size="md"
              onClick={onClose}
              className="rounded-full w-full sm:w-auto"
            />
          </div>
        </div>
      </Box>
    </Modal>
  );
};

export default LogoutModal;
