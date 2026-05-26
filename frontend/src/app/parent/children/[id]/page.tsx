import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ChildDetailPage({ params }: PageProps) {
  const { id } = await params;
  redirect(`/parent/children/${id}/profile`);
}
