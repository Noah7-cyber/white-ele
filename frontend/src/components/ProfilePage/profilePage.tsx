"use client";

import React from "react";
import {
  StatsCard,
  GeneralInfoSection,
  MedicalInfoSection,
  EmergencyContactSection,
  CurriculumCard,
} from "./ProfileSections";

export interface ProfileData {
  statsInfo?: { label: string; value: string | number }[];
  generalInfo?: { label: string; value: string | number }[];
  medicalInfo?: { label: string; value: string }[];
  emergencyContact?: { label: string; value: string }[];
  curriculum?: {
    completedCount: number;
    totalCount: number;
    currentMilestone: string;
    gradeScore?: number;
    gradeTotal?: number;
  };
}

interface ProfilePageProps {
  childData: ProfileData | null;
  childId?: string;
  childPhoto?: string;
  childName?: string;
}
export default function ProfilePage({ childData, childPhoto, childName }: ProfilePageProps) {
  if (!childData) return null;
  const { generalInfo, medicalInfo, statsInfo, emergencyContact, curriculum } = childData;

  return (
    <div className="space-y-6 w-full sm:px-4 md:px-0 bg-dashboard-bg! md:bg-transparent">
      <StatsCard items={statsInfo ?? []} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GeneralInfoSection
          title="General Information"
          fields={generalInfo ?? []}
          childPhoto={childPhoto}
          childName={childName}
        />
        <CurriculumCard
          title="Active Curriculum"
          completedCount={curriculum?.completedCount ?? 0}
          totalCount={curriculum?.totalCount ?? 0}
          currentMilestone={curriculum?.currentMilestone ?? "No active milestone"}
          gradeScore={curriculum?.gradeScore ?? 0}
          gradeTotal={curriculum?.gradeTotal ?? 3}
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EmergencyContactSection title="Emergency Contact" items={emergencyContact ?? []} />
        <MedicalInfoSection title="Medical Information" fields={medicalInfo ?? []} />
      </div>
    </div>
  );
}
