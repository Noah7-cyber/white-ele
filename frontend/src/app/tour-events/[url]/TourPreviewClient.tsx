"use client";

import React from "react";
import { useParams } from "next/navigation";
import TourPreview from "@/modules/admin/page/TourPreviewPage/TourPreview";
import { useTourByUrl } from "@/modules/public/hooks/useTourByUrl";
import { SchoolLogoLoading } from "@/components/Loading/SchoolLogoLoading";

const PublicTourClient = () => {
  const params = useParams();
  const url = params?.url as string;
  const { data: tourData, isLoading } = useTourByUrl(url);

  if (isLoading) return <SchoolLogoLoading />;

  return <TourPreview tourData={tourData} isPublic />;
};

export default PublicTourClient;
