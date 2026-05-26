import classNames from "classnames";
import React, { FC, ReactNode } from "react";

import { Box, Fade, Modal as MUIModal } from "@mui/material";

import "./modal.css";

interface ModalProps {
  children?: ReactNode;
  className?: string;
  isOpen: boolean;
  onClose?: () => void;
  id?: string;
  height?: number | string;
  width?: number | string;
  modalStyle?: React.CSSProperties;
}

export const Modal: FC<ModalProps> = ({
  children,
  className,
  isOpen,
  onClose,
  modalStyle,
  ...props
}) => {
  const defaultModalStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <MUIModal
      open={isOpen}
      onClose={onClose}
      closeAfterTransition
      sx={{ ...defaultModalStyle, ...modalStyle }}
      {...props}
    >
      <Fade in={isOpen}>
        <Box
          className={classNames(
            "absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white shadow-lg transition-transform duration-300 ease-in-out outline-none border-none flex flex-col max-h-[90vh] overflow-hidden",
            className,
          )}
          sx={{
            width: props.width ,
            height: props.height || "auto",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </Box>
      </Fade>
    </MUIModal>
  );
};
