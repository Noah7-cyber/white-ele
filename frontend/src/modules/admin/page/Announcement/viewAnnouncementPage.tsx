"use client";

import AnnouncementsPageComponent from "@/modules/shared/component/AnnoucementComponent/AnnoucementPageComp";
import { useParams } from "next/navigation";

export function ViewAnnouncementPage() {
  const params = useParams();
  const announcementId = params?.id;

  return (
    <AnnouncementsPageComponent
      role="staff"
      initialAnnouncementId={String(announcementId)}
      singleAnnouncementView
    />
  );
}
