"use client";
import React from "react";
import LearningsLayout from "@/layout/Shared/learningsLayout";

interface AdminLearningLayoutProps {
  children?: React.ReactNode;
}

export default function AdminLearningLayout({ children }: AdminLearningLayoutProps) {
  return (
    <LearningsLayout basePath="/admin/learning" title="Learning" role="admin">
      {children}
    </LearningsLayout>
  );
}
