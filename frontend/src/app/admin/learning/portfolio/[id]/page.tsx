import PortfolioDetailPage from "@/modules/admin/page/Learnings/PortfolioPage/PortfolioDetailPage";
import LearningsLayout from "@/layout/Shared/learningsLayout";

export default async function Page({ params }: { params: Promise<{ id: number }> }) {
  const { id } = await params;

  return (
    <LearningsLayout title="Portfolio Detail" role="admin">
      <PortfolioDetailPage portfolioId={id} />
    </LearningsLayout>
  );
}
