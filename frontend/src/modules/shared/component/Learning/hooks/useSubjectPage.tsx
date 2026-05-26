/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardRoutes } from "@/routes/dashboard.routes";
import { StaffRoutes } from "@/routes/staff.routes";
import { showToast } from "@/modules/shared/component/Toast";
import MilestoneRowActions from "@/modules/shared/component/Learning/MilestoneRowActions/milestoneRowActions";
import AssessmentRowActions from "@/modules/shared/component/Learning/AssessmentRowActions/assessmentRowActions";
import type {
  SubjectDetail,
  SubjectAssessment,
  SubjectMilestone,
} from "@/modules/admin/page/Curriculum/curriculum.mock";

type TabKey = "milestones" | "assessments";

interface UseSubjectPageArgs {
  curriculumId: string;
  subject: SubjectDetail;
  role?: "admin" | "staff";
}

// ========================
// Formatters
// ========================

const formatDate = (value?: string) => {
  if (!value) return "--";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const formatted = date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const [day, month, year] = formatted.split(" ");

  return `${day} ${month}, ${year}`;
};

const formatMilestoneStatus = (status: SubjectMilestone["status"]) => {
  const statusMap: Record<SubjectMilestone["status"], { label: string; className: string }> = {
    daily: { label: "Daily", className: "" },
    weekly: { label: "Weekly", className: "" },
    termly: { label: "Termly", className: "" },
  };
  const config = statusMap[status] || statusMap.daily;
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
};

const formatStatus = (status: SubjectAssessment["status"]) => {
  const statusMap: Record<SubjectAssessment["status"], { label: string; className: string }> = {
    active: { label: "Active", className: "bg-badge-blue/10 text-badge-blue" },
    inactive: { label: "Inactive", className: "bg-warning-yellow/15 text-warning-yellow" },
    graded: { label: "Graded", className: "bg-success-green/15 text-success-green" },
    archived: {
      label: "",
      className: "",
    },
    draft: {
      label: "",
      className: "",
    },
  };
  const config = statusMap[status] || statusMap.active;
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
};

// ========================
// Hook Implementation
// ========================

const useSubjectPage = ({ curriculumId, subject, role = "admin" }: UseSubjectPageArgs) => {
  const routes = role === "admin" ? DashboardRoutes : (StaffRoutes as any);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("milestones");
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null);
  const [deleteMilestoneModalOpen, setDeleteMilestoneModalOpen] = useState(false);
  const [deleteAssessmentModalOpen, setDeleteAssessmentModalOpen] = useState(false);
  const [isDeletingMilestone, setIsDeletingMilestone] = useState(false);
  const [isDeletingAssessment, setIsDeletingAssessment] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(4);

  const allMilestones = subject.milestones ?? [];
  const allAssessments = subject.assessments ?? [];
  const isLoadingMilestones = false;
  const isLoadingAssessments = false;

  const refetchMilestones = () => {
    // Mock refetch
  };
  const refetchAssessments = () => {
    // Mock refetch
  };

  const metrics = useMemo(() => {
    const totalMilestones = allMilestones?.length || 0;
    const completedMilestones =
      allMilestones?.filter((m: any) => m.status === "completed").length || 0;
    const totalAssessments = allAssessments?.length || 0;
    const gradedAssessments = allAssessments?.filter((a: any) => a.status === "graded").length || 0;
    const lastUpdated = subject.lastUpdated || "--";
    return {
      totalMilestones,
      completedMilestones,
      openMilestones: totalMilestones - completedMilestones,
      totalAssessments,
      gradedAssessments,
      lastUpdated,
    };
  }, [allMilestones, allAssessments]);

  const milestoneHeaders = ["Milestone Name", "Description", "Milestone Type", "Action"];
  const assessmentHeaders = ["Title", "Score Type", "No. of Milestones", "Date Added", "Action"];

  const milestoneTableData =
    allMilestones?.map((milestone: SubjectMilestone) => ({
      0: (
        <div className="flex flex-col gap-1">
          <span className="text-sm ">{milestone.title}</span>
        </div>
      ),
      1: formatDate(milestone.description),
      2: formatMilestoneStatus(milestone.status),

      3: (
        <MilestoneRowActions
          onEdit={() => {
            setSelectedMilestoneId(milestone.id);
            router.push(
              routes.curriculumSubjectEditMilestone
                .replace(":curriculumId", curriculumId)
                .replace(":subjectId", subject.id)
                .replace(`:milestoneId`, milestone.id),
            );
          }}
          onDelete={() => {
            setSelectedMilestoneId(milestone.id);
            setDeleteMilestoneModalOpen(true);
          }}
        />
      ),
    })) ?? [];

  const assessmentTableData =
    allAssessments?.map((assessment: SubjectAssessment) => ({
      0: (
        <div className="flex flex-col gap-1">
          <span className="text-sm">{assessment.title}</span>
        </div>
      ),
      1: assessment.type || "--",

      2: assessment.noOfMilestones ?? "--",
      3: assessment.dueDate ? formatDate(assessment.dueDate) : "--",
      4: (
        <AssessmentRowActions
          onEdit={() => {
            setSelectedAssessmentId(assessment.id);
            router.push(
              routes.curriculumSubjectEditAssessment
                .replace(":curriculumId", curriculumId)
                .replace(":subjectId", subject.id)
                .replace(`:assessmentId`, assessment.id),
            );
          }}
          onDelete={() => {
            setSelectedAssessmentId(assessment.id);
            setDeleteAssessmentModalOpen(true);
          }}
        />
      ),
    })) ?? [];

  const paginatedMilestones = milestoneTableData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  );

  const paginatedAssessments = assessmentTableData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  );
  const handlePageChange = ({
    page,
    rowsPerPage: newRowsPerPage,
  }: {
    page: number;
    rowsPerPage: number;
  }) => {
    setCurrentPage(page);

    if (newRowsPerPage !== rowsPerPage) {
      setRowsPerPage(newRowsPerPage);
      setCurrentPage(1);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const handleDeleteMilestone = useCallback(async () => {
    if (!selectedMilestoneId) return;

    try {
      setIsDeletingMilestone(true);
      await new Promise((resolve) => setTimeout(resolve, 500));

      showToast({
        message: "Milestone Deleted",
        description: "The milestone has been successfully removed.",
        severity: "success",
        duration: 3000,
      });

      setDeleteMilestoneModalOpen(false);
      setSelectedMilestoneId(null);
      refetchMilestones();
    } catch (error: any) {
      showToast({
        message: "Error",
        description: error?.message || "Unable to delete milestone.",
        severity: "error",
        duration: 3000,
      });
    } finally {
      setIsDeletingMilestone(false);
    }
  }, [selectedMilestoneId, refetchMilestones]);

  const handleDeleteAssessment = useCallback(async () => {
    if (!selectedAssessmentId) return;

    try {
      setIsDeletingAssessment(true);
      await new Promise((resolve) => setTimeout(resolve, 500));

      showToast({
        message: "Assessment Deleted",
        description: "The assessment has been successfully removed.",
        severity: "success",
        duration: 3000,
      });

      setDeleteAssessmentModalOpen(false);
      setSelectedAssessmentId(null);
      refetchAssessments();
    } catch (error: any) {
      showToast({
        message: "Error",
        description: error?.message || "Unable to delete assessment.",
        severity: "error",
        duration: 3000,
      });
    } finally {
      setIsDeletingAssessment(false);
    }
  }, [selectedAssessmentId, refetchAssessments]);

  const handleAddMilestone = () => {
    router.push(
      routes.curriculumSubjectAddMilestone
        .replace(":curriculumId", curriculumId)
        .replace(":subjectId", subject.id)
        .concat("?milestoneId=add"),
    );
  };

  const handleAddAssessment = () => {
    router.push(
      routes.curriculumSubjectAddAssessment
        .replace(":curriculumId", curriculumId)
        .replace(":subjectId", subject.id)
        .concat("?assessmentId=add"),
    );
  };

  const handleBack = () => router.back();

  const isMilestoneTab = activeTab === "milestones";
  const currentHeaders = isMilestoneTab ? milestoneHeaders : assessmentHeaders;
  const currentTableData = isMilestoneTab ? milestoneTableData : assessmentTableData;
  const isLoading = isMilestoneTab ? isLoadingMilestones : isLoadingAssessments;
  const totalItems = isMilestoneTab ? milestoneTableData.length : assessmentTableData.length;

  return {
    activeTab,
    setActiveTab,
    handleBack,
    milestoneHeaders,
    assessmentHeaders,
    milestoneTableData,
    assessmentTableData,
    currentHeaders,
    currentTableData,
    metrics,
    handleAddMilestone,
    handleAddAssessment,
    isLoading,
    deleteMilestoneModalOpen,
    setDeleteMilestoneModalOpen,
    deleteAssessmentModalOpen,
    setDeleteAssessmentModalOpen,
    handleDeleteMilestone,
    handleDeleteAssessment,
    isDeletingMilestone,
    isDeletingAssessment,
    isMilestoneTab,
    formatDate,
    paginatedMilestones,
    paginatedAssessments,

    currentPage,
    rowsPerPage,
    totalItems,
    handlePageChange,
    formatStatus,
  };
};

export default useSubjectPage;
