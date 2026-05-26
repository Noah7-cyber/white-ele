/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { ActionModal } from "@/modules/shared/component/ActionModal/actionModal";
import { showToast } from "@/modules/shared/component/Toast";
import { DashboardRoutes } from "@/routes/dashboard.routes";
import { StaffRoutes } from "@/routes/staff.routes";
import { useDebouncer } from "@/utils/hooks/useDebouncer";
import { MoreHoriz } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import { useRouter } from "next/navigation";
import { ChangeEvent } from "react";

interface UseAssessmentProps {
  setDeleteModal: (open: boolean) => void;
  setArchiveModal: (open: boolean) => void;
  role?: "admin" | "staff";
}

export const useAssessment = ({
  setDeleteModal,
  setArchiveModal,
  role = "admin",
}: UseAssessmentProps) => {
  const routes = role === "admin" ? DashboardRoutes : (StaffRoutes as any);
  const router = useRouter();
  const assessmentHeader = [
    "Assessment Title",
    "Subject",
    "Class",
    "Type",
    "Date/Time",
    "Submission",
    "Status",
    "Action",
  ];

  const { debouncedSearch, setSearch } = useDebouncer();

  const assessment = [
    {
      id: "1",
      title: "Mid-Term Test",
      subject: "English",
      class: "Grade 1",
      type: "Quiz",
      date: "Jan 10, 2023",
      submission: "14/20",
      status: "Archived",
    },
    {
      id: "2",
      title: "Final Exams",
      subject: "Mathematics",
      class: "Grade 2",
      type: "Test",
      date: "Jan 10, 2023",
      submission: "14/20",
      status: "Active",
    },
    {
      id: "3",
      title: "Numeracy Quiz",
      subject: "Sciences",
      class: "Grade 3",
      type: "Continuous Assessment (CA)",
      date: "Jan 10, 2023",
      submission: "14/20",
      status: "Draft",
    },
    {
      id: "4",
      title: "Mid-Term Test",
      subject: "English",
      class: "Grade 1",
      type: "Quiz",
      date: "Jan 10, 2023",
      submission: "14/20",
      status: "Archived",
    },
    {
      id: "5",
      title: "Final Exams",
      subject: "Mathematics",
      class: "Grade 2",
      type: "Test",
      date: "Jan 10, 2023",
      submission: "14/20",
      status: "Active",
    },
    {
      id: "6",
      title: "Numeracy Quiz",
      subject: "Sciences",
      class: "Grade 3",
      type: "Continuous Assessment (CA)",
      date: "Jan 10, 2023",
      submission: "14/20",
      status: "Draft",
    },
  ];

  const DEFAULT_STYLE = {
    dot: "bg-gray-400",
    chip: "bg-gray-100 text-gray-700",
  };

  const STATUS_CONSTANT: Record<string, { chip: string }> = {
    active: {
      chip: "bg-[#EDFFF7] text-[#057646]",
    },
    draft: {
      chip: "bg-[#CF000B]/10 text-[#CF000B]",
    },
    archived: {
      chip: "bg-[#5988F726] text-[#5988F7]",
    },
  };

  const getStatusConfig = (status: string) =>
    STATUS_CONSTANT[status?.toLowerCase()] ?? DEFAULT_STYLE;

  const StatusCell = ({ status }: { status: string }) => {
    const { chip } = getStatusConfig(status);

    return (
      <div
        className={`flex items-center justify-center gap-2 px-2 py-1 rounded-full min-w-[100px]  ${chip}`}
      >
        <span className="!text-xs !font-medium">{status}</span>
      </div>
    );
  };

  const assessmentTableData = assessment?.map((data) => {
    return {
      Title: data.title,
      Subject: data.subject,
      Class: data.class,
      Type: data.type,
      Date: data.date,
      Submission: data.submission,
      Status: (
        <div className="w-full flex items-center justify-center">
          <StatusCell status={data.status} />
        </div>
      ),
      Action: (
        <ActionModal
          actions={(() => {
            const status = data.status.toLowerCase();
            switch (status) {
              case "archived":
                return [
                  {
                    label: "View",
                    onClick: () => {
                      router.push(`${routes.assessments}/${data.id}/view`);
                    },
                  },
                  {
                    label: "Edit",
                    onClick: () => router.push(`${routes.assessments}/${data.id}/edit`),
                  },
                  {
                    label: "Grade",
                    onClick: () => {
                      router.push(`${routes.assessments}/${data.id}/grade`);
                    },
                  },

                  {
                    label: "Restore",
                    onClick: () =>
                      showToast({
                        message: "Assessment Restored",
                        description: "The assessment has been successfully restored.",
                        severity: "success",
                        duration: 3000,
                      }),
                  },
                  { label: "Delete", onClick: () => setDeleteModal(true) },
                ];
              case "active":
                return [
                  {
                    label: "View",
                    onClick: () => {
                      router.push(`${routes.assessments}/${data.id}/view`);
                    },
                  },
                  {
                    label: "Edit",
                    onClick: () => router.push(`${routes.assessments}/${data.id}/edit`),
                  },
                  {
                    label: "Grade",
                    onClick: () => {
                      router.push(`${routes.assessments}/${data.id}/grade`);
                    },
                  },

                  { label: "Archive", onClick: () => setArchiveModal(true) },
                  {
                    label: "Duplicate",
                    onClick: () =>
                      showToast({
                        message: "Assessment Duplicated",
                        description: "The assessment has been successfully duplicated.",
                        severity: "success",
                        duration: 3000,
                      }),
                  },
                  { label: "Delete", onClick: () => setDeleteModal(true) },
                ];
              case "draft":
                return [
                  {
                    label: "View",
                    onClick: () => {
                      router.push(`${routes.assessments}/${data.id}/view`);
                    },
                  },
                  {
                    label: "Edit",
                    onClick: () => router.push(`${routes.assessments}/${data.id}/edit`),
                  },
                  {
                    label: "Grade",
                    onClick: () => {
                      router.push(`${routes.assessments}/${data.id}/grade`);
                    },
                  },
                  {
                    label: "Publish",
                    onClick: () =>
                      showToast({
                        message: "Assessment Published",
                        description: "The assessment has been successfully published.",
                        severity: "success",
                        duration: 3000,
                      }),
                  },
                  {
                    label: "Duplicate",
                    onClick: () =>
                      showToast({
                        message: "Assessment Duplicated",
                        description: "The assessment has been successfully duplicated.",
                        severity: "success",
                        duration: 3000,
                      }),
                  },
                  { label: "Delete", onClick: () => setDeleteModal(true) },
                ];
              default:
                return [];
            }
          })()}
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

  const handleSearch = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSearch(e.target.value);
  };

  return {
    assessmentHeader,
    assessmentTableData,
    handleSearch,
  };
};
