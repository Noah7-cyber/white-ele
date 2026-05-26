"use client";

import React from "react";
import { Box } from "@mui/material";

interface ChildrenLayoutProps {
  title?: string;
  showNextButton?: boolean;
  onBack?: () => void;
  onNext?: () => void;
  children?: React.ReactNode;
  buttonContent?: React.ReactNode;
}

export const ChildrenLayout: React.FC<ChildrenLayoutProps> = ({ children }) => {
  return (
    <Box
      className={`w-full border-piechart-grey rounded-t-xl p-0 md:p-5 bg-white md:bg-transparent`}
    >
      <Box className="flex items-center justify-between"></Box>

      {children && <Box className="mb-5 flex flex-col items-start md:gap-6 w-full">{children}</Box>}
    </Box>
  );
};
