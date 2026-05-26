/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardRoutes } from "@/routes/dashboard.routes";
import { showToast } from "@/modules/shared/component/Toast";
import { GetChildByIdResponse, childDynamicEndpoints } from "@/services/child.service";
import { calculateAge } from "@/utils/helper";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { unwrapQueryDataBody } from "@/utils/unwrapQueryResponse";
export const useChildDetail = (childId: string) => {
  const router = useRouter();
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const childDetailQuery = useQueryService<any, GetChildByIdResponse>({
    service: childDynamicEndpoints.getChildById(childId!),
  });
  const { isPending, refetch } = childDetailQuery;
  const childResponse = unwrapQueryDataBody<any>(childDetailQuery.data);
  const lastGradedMilestone = childResponse?.milestones?.lastGradedMilestone?.[0];

  const profileData = childResponse
    ? {
        statsInfo: [
          { label: "Age", value: calculateAge(childResponse?.user?.dateOfBirth).toString() },
          {
            label: "Overall Progress",
            value: `${Number(childResponse?.averageDevelopmentPercent ?? 0).toFixed(2)}%`,
          },
          { label: "Gender", value: childResponse?.user?.gender ?? "N/A" },
          {
            label: "Days per week",
            value: `${childResponse?.schedule?.length?.toString() ?? "0"}`,
          },
          { label: "Documents", value: childResponse?.documents?.length.toString() ?? "0" },
        ],

        generalInfo: [
          { label: "Student ID", value: childResponse?.admissionNumber },
          { label: "Classroom", value: childResponse?.currentClassroom?.classroomName ?? "N/A" }, // adjust dynamically if needed
          { label: "Address", value: childResponse?.user?.address ?? "N/A" },
          { label: "Date of Birth", value: childResponse?.user?.dateOfBirth },
          { label: "Schedule", value: childResponse?.schedule?.join(", ") ?? "N/A" },
          { label: "Enrolment Date", value: childResponse?.enrolmentDate },
        ],
        medicalInfo: [
          { label: "Allergies", value: childResponse?.medicalRecord?.allergies ?? "None" },
          { label: "Medication", value: childResponse?.medicalRecord?.medications ?? "None" },
          {
            label: "Diet Restrictions",
            value: childResponse?.medicalRecord?.dietRestriction ?? "None",
          },
          {
            label: "Food Preferences",
            value: childResponse?.medicalRecord?.foodPreferences ?? "None",
          },
          { label: "Notes", value: childResponse?.medicalRecord?.notes ?? "None" },
        ],
        emergencyContact: childResponse?.emergencyContact
          ? [
              { label: "Name", value: childResponse?.emergencyContact?.contactName ?? "N/A" },
              { label: "Phone", value: childResponse?.emergencyContact?.phone ?? "N/A" },
              { label: "Email", value: childResponse?.emergencyContact?.email ?? "N/A" },
              {
                label: "Relationship",
                value: childResponse?.emergencyContact?.relationship ?? "N/A",
              },
              { label: "Address", value: childResponse?.emergencyContact?.address ?? "N/A" },
            ]
          : [
              {
                label: "Name",
                value: childResponse?.emergencyContact?.contactName ?? "Not provided",
              },
              { label: "Phone", value: childResponse?.emergencyContact?.phone ?? "Not provided" },
              { label: "Email", value: childResponse?.emergencyContact?.email ?? "Not provided" },
              {
                label: "Relationship",
                value: childResponse?.emergencyContact?.relationship ?? "Not provided",
              },
              {
                label: "Address",
                value: childResponse?.emergencyContact?.address ?? "Not provided",
              },
            ],
        curriculum: {
          completedCount: Number(childResponse?.milestones?.totalCompleted ?? 0),
          totalCount:
            Number(childResponse?.milestones?.totalEnrolled ?? 0) +
            Number(childResponse?.milestones?.totalCompleted ?? 0),
          currentMilestone:
            lastGradedMilestone?.title ||
            childResponse?.milestones?.completed?.[0]?.milestoneName ||
            childResponse?.milestones?.enrolled?.[0]?.milestoneName ||
            "No active milestone",
          gradeScore: Number(lastGradedMilestone?.score ?? 0),
          gradeTotal: 3,
        },
      }
    : null;

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

  return {
    childResponse: childResponse,
    profileData,
    isPending,
    refetch,
    deactivateModalOpen,
    setDeactivateModalOpen,
    deleteModalOpen,
    setDeleteModalOpen,
    handleDeactivate,
    handleDelete,
  };
};
