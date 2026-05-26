"use client";
import React from "react";
import LearningsLayout from "@/layout/Shared/learningsLayout";

interface StaffLearningLayoutProps {
  children?: React.ReactNode;
}

export default function StaffLearningLayout({ children }: StaffLearningLayoutProps) {
  return (
    <LearningsLayout basePath="/staff/learning" title="Learning" role="staff">
      {children}
    </LearningsLayout>
  );
}
