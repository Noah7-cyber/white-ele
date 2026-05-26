"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { FC, MouseEvent, ReactNode, useState } from "react";
import { Button, MUIButtonProps } from "../Button/WPButton";
import Popover, { PopoverOrigin, PopoverProps } from "@mui/material/Popover";

interface CWPopoverProps {
  buttonProps?: MUIButtonProps;
  actionComponent?: ReactNode;
  children?: ReactNode | ((closePopover: () => void) => ReactNode);
  handlePopoverClose?: () => void;
  anchorOrigin?: PopoverOrigin;
  slotProps?: any;
  transformOrigin?: PopoverOrigin;
  onClickButton?: () => void;
  popoverProps?: Partial<PopoverProps>;
  transitionDuration?: number;
}

export const CWPopover: FC<CWPopoverProps> = ({
  buttonProps,
  actionComponent,
  handlePopoverClose,
  children,
  anchorOrigin = {
    vertical: "bottom",
    horizontal: "left",
  },
  slotProps = {
    root: {
      className: "!z-[80] rounded bg-black/30 !bg-opacity-50",
    },
    paper: {
      className: "!bg-white !rounded-[10px] !mt-2 !shadow-[0px_0px_40px_rgba(0,0,0,0.1)]",
    },
  },
  onClickButton,
  transitionDuration = 200,
  ...popoverProps
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    onClickButton?.();
  };

  const handleClose = () => {
    setAnchorEl(null);
    handlePopoverClose?.();
  };

  const isOpen = Boolean(anchorEl);
  const id = isOpen ? "cw-simple-popover" : undefined;
  const customerPopoverProps: Partial<PopoverProps> = {
    transformOrigin: { vertical: "top", horizontal: "left" },
    ...popoverProps,
  };

  return (
    <>
      <Button onClick={handleClick} {...buttonProps}>
        {actionComponent}
      </Button>

      <Popover
        id={id}
        transitionDuration={transitionDuration}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={anchorOrigin}
        slotProps={slotProps}
        PaperProps={{
          className: "!bg-white !rounded-[10px] !mt-2 !shadow-[0px_0px_40px_rgba(0,0,0,0.1)] !p-2",
        }}
        {...customerPopoverProps}
        open={isOpen}
      >
        {typeof children === "function" ? children(handleClose) : children}
      </Popover>
    </>
  );
};
