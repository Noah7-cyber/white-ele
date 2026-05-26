/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { GetChildByIdResponse, childDynamicEndpoints } from "@/services/child.service";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { showToast } from "@/modules/shared/component/Toast";
import { calculateAge } from "@/utils/helper";
import { ProfileData } from "@/components/ProfilePage/profilePage";

export const useChildDetail = (childId: string) => {
  const [childData, setChildData] = useState<GetChildByIdResponse["data"] | null>(null);
  const [loading, setLoading] = useState(true);

  const { mutateAsync: getChildById } = useMutationService<any, GetChildByIdResponse>({
    service: childDynamicEndpoints.getChildById(childId!),
  });

  const fetchChild = async () => {
    if (!childId) return;
    try {
      setLoading(true);
      const res = await getChildById({});
      setChildData(res.data);
    } catch (error) {
      console.error(error);
      showToast({
        message: "Error",
        description: "Failed to fetch child details.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChild();
  }, [childId]);

  const profileData: ProfileData | null = childData
    ? {
        statsInfo: [
          { label: "Age", value: calculateAge(childData.user.dateOfBirth).toString() },
          { label: "Overall Progress", value: "87%" },
          { label: "Days per week", value: `${childData.schedule.length.toString()}` },
          { label: "Documents", value: childData.documents.length.toString() },
        ],

        generalInfo: [
          { label: "Student ID", value: childData.admissionNumber },
          { label: "Classroom", value: "N/A" }, // adjust dynamically if needed
          { label: "Address", value: childData.user.address },
          { label: "Date of Birth", value: childData.user.dateOfBirth },
          { label: "Schedule", value: childData.schedule.join(", ") },
          { label: "Enrolment Date", value: childData.enrolmentDate },
        ],
        medicalInfo: [
          { label: "Allergies", value: childData.medicalRecord?.allergies ?? "None" },
          { label: "Medication", value: childData.medicalRecord?.medications ?? "None" },
          { label: "Diet Restrictions", value: childData.medicalRecord?.dietRestriction ?? "None" },
          { label: "Food Preferences", value: childData.medicalRecord?.foodPreferences ?? "None" },
          { label: "Notes", value: childData.medicalRecord?.notes ?? "None" },
        ],
        emergencyContact: childData.emergencyContact
          ? [
              { label: "Name", value: childData.emergencyContact.contactName },
              { label: "Phone", value: childData.emergencyContact.phone },
              { label: "Email", value: childData.emergencyContact.email },
              { label: "Relationship", value: childData.emergencyContact.relationship },
              { label: "Address", value: childData.emergencyContact.address },
            ]
          : [],
      }
    : null;

  return {
    childData,
    profileData,
    loading,
    refetchChild: fetchChild,
  };
};
