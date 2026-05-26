import { ChildDetail } from "@/modules/admin/page/Children/child-detail";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ChildRedirectPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <ChildDetail params={Promise.resolve({ id, tab: "profile" })} />
  );
}
