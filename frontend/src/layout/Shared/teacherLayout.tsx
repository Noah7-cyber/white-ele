"use client";

import type React from "react";
import { Typography, IconButton } from "@mui/material";
import { useRouter } from "next/navigation";
import CaretBack from "@/modules/shared/assets/svgs/chevron-back.svg";
import { Button } from "@/modules/shared/component/Button";
import { DashboardRoutes } from "@/routes/dashboard.routes";

interface TeacherLayoutProps {
  title: string;
  showEditButton?: boolean;
  onEdit?: () => void;
  children?: React.ReactNode;
  buttonContent?: React.ReactNode;
}

export const TeacherLayout: React.FC<TeacherLayoutProps> = ({
  title,
  showEditButton = true,
  onEdit,
  children,
  buttonContent = "Edit Profile",
}) => {
  const router = useRouter();

  return (
    <div className={`w-full border-b border-[#E5E7EB] rounded-t-xl p-5`}>
      <div className="flex items-center justify-between py-3">
        <div className="w-full flex items-center gap-2">
          <IconButton
            size="small"
            className="!flex !items-center !justify-center !p-0 w-10 h-10 !rounded-full !border !border-[#008080]"
            onClick={() => router.push(DashboardRoutes.teachers)}
          >
            <CaretBack sx={{ color: "#101828" }} />
          </IconButton>

          <Typography className="!font-semibold !text-primary-gray !text-2xl !mr-5">
            {title}
          </Typography>

          <div
            className={`flex items-center justify-center gap-2 px-2 py-1 rounded-full w-[auto] bg-green-100 text-green-700`}
          >
            <span className="!text-sm !font-medium font-avenir">Active</span>
          </div>
        </div>

        {showEditButton && (
          <Button
            variant="contained"
            onClick={onEdit}
            isRounded={false}
            sx={{
              borderRadius: "8px",
              textTransform: "none",
              ":hover": { backgroundColor: "#0B7568" },
              px: 2,
              height: "40px",
              minWidth: "auto",
              width: "auto",
              whiteSpace: "nowrap",
            }}
          >
            {buttonContent}
          </Button>
        )}
      </div>

      {children && <div className="mb-5 flex items-center gap-6 w-full">{children}</div>}
    </div>
  );
};

export default TeacherLayout;
