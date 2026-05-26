import AnnouncementsPageComponent from "@/modules/shared/component/AnnoucementComponent/AnnoucementPageComp";

export default async function StaffAnnouncementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AnnouncementsPageComponent
      role="staff"
      singleAnnouncementView
      initialAnnouncementId={id}
    />
  );
}
