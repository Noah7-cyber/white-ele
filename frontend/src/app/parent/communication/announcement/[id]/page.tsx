import AnnouncementsPageComponent from "@/modules/shared/component/AnnoucementComponent/AnnoucementPageComp";

export default async function ParentAnnouncementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AnnouncementsPageComponent
      role="parent"
      singleAnnouncementView
      initialAnnouncementId={id}
    />
  );
}
