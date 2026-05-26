import AssessmentEdit from "@/modules/admin/page/Assessment/assessment-edit";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AssessmentEditPage({ params }: PageProps) {
  const { id } = await params;

  return <AssessmentEdit id={id} />;
}
