"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { DashboardRoutes } from "@/routes/dashboard.routes";
import { showToast } from "@/modules/shared/component/Toast";

interface Results {
  id: string;
  name: string;
  ageRange: string;
  capacity: number;
  enrolled: number;
  staffAssigned: number;
  staffChildRatio: string;
  status: string;
}

interface EditScoreFormData {
  score: number | string;
  comment: string;
}

export const useResultsDetail = (childId: string) => {
  const router = useRouter();
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editScoreModalOpen, setEditScoreModalOpen] = useState(false);
  const [selectedResultIndex, setSelectedResultIndex] = useState<number | null>(null);
  const [results, setResults] = useState<Results | null>(null);
  const childName = "Sarah Johnson";

  const {
    control: editControl,
    handleSubmit: handleEditSubmit,
    reset: resetEditForm,
  } = useForm<EditScoreFormData>({
    defaultValues: {
      score: "",
      comment: "",
    },
  });

  const resultLists = [
    {
      childName: "Mid-Term Test",
      subject: "English",
      score: 57,
      grade: "F",
      date: "10 Jan, 2025",
      status: "Failed",
    },
    {
      childName: "Final Exam",
      subject: "Mathematics",
      score: 72.4,
      grade: "C",
      date: "22 Feb, 2025",
      status: "Pass",
    },
    {
      childName: "Numeracy Quiz",
      subject: "Science",
      score: 78.7,
      grade: "C",
      date: "13 Mar, 2025",
      status: "Pass",
    },
    {
      childName: "Mid-Term Test",
      subject: "Literature",
      score: 59.9,
      grade: "F",
      date: "24 Apr, 2025",
      status: "Failed",
    },
    {
      childName: "Numeracy Quiz",
      subject: "Mathematics",
      score: 63.6,
      grade: "A",
      date: "15 May, 2025",
      status: "Pass",
    },
    {
      childName: "Mid-Term Test",
      subject: "English",
      score: 61.7,
      grade: "B",
      date: "26 Jun, 2025",
      status: "Pass",
    },
    {
      childName: "Numeracy Quiz",
      subject: "Mathematics",
      score: 64.5,
      grade: "F",
      date: "17 Jul, 2025",
      status: "Failed",
    },
    {
      childName: "Final Exam",
      subject: "History",
      score: 40.2,
      grade: "A",
      date: "08 Aug, 2025",
      status: "Pass",
    },
    {
      childName: "Mid-Term Test",
      subject: "Religion",
      score: 57,
      grade: "A",
      date: "20 Aug, 2025",
      status: "Failed",
    },
    {
      childName: "Final Exam",
      subject: "Literature",
      score: 80,
      grade: "A",
      date: "12 Sep, 2025",
      status: "Failed",
    },
    {
      childName: "Final Exam",
      subject: "English",
      score: 57,
      grade: "A",
      date: "19 Oct, 2025",
      status: "Pass",
    },
  ];

  const statsInfo = [
    { label: "Class", value: "Grade 1" },
    { label: "Average Score", value: "62.9%" },
    { label: "Overall Grade", value: "A" },
    { label: "Status", value: "Pass" },
  ];

  const handleDeactivate = () => {
    showToast({
      message: "Child Deactivated",
      description: "The child has been successfully deactivated.",
      severity: "success",
      duration: 3000,
    });
    setDeactivateModalOpen(false);
    router.push(DashboardRoutes.children);
  };

  const handleDelete = () => {
    showToast({
      message: "Child Deleted",
      description: "The child has been successfully deleted.",
      severity: "success",
      duration: 3000,
    });
    setDeleteModalOpen(false);
    router.push(DashboardRoutes.children);
  };

  const handleOpenEditModal = (index: number) => {
    setSelectedResultIndex(index);
    const result = resultLists[index];
    resetEditForm({
      score: result.score,
      comment: "",
    });
    setEditScoreModalOpen(true);
  };

  const handleSaveEditScore = handleEditSubmit(async (data) => {
    try {
      showToast({
        message: "Score Updated",
        description: `Score updated to ${data.score}.`,
        severity: "success",
        duration: 3000,
      });
      setEditScoreModalOpen(false);
      resetEditForm();
      setSelectedResultIndex(null);
    } catch (error) {
      showToast({
        message: "Error",
        description: "Failed to update score.",
        severity: "error",
        duration: 3000,
      });
    }
  });

  return {
    results,
    resultLists,
    childName,
    deactivateModalOpen,
    setDeactivateModalOpen,
    deleteModalOpen,
    setDeleteModalOpen,
    handleDeactivate,
    handleDelete,
    statsInfo,
    editScoreModalOpen,
    setEditScoreModalOpen,
    editControl,
    handleSaveEditScore,
    handleOpenEditModal,
    selectedResultIndex,
  };
};
