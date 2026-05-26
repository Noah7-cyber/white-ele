"use client";

import { useCallback, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import type { Portfolio } from "@/services/curriculum.service";
import {
  portfolioDynamicEndpoints,
  type PortfolioSection,
  type CreateSectionRequest,
  type UpdateSectionRequest,
} from "@/services/portfolio.service";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { showToast } from "@/modules/shared/component/Toast";

export default function usePortfolioDetail(propPortfolioId?: number) {
  const params = useParams();
  const portfolioId = propPortfolioId || (params?.id as number | string);
  const [addSectionModalOpen, setAddSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<PortfolioSection | null>(null);
  const [deletingSectionId, setDeletingSectionId] = useState<number | null>(null);

  // Fetch portfolio details
  const {
    data: portfolioData,
    isLoading: isLoadingPortfolio,
    refetch,
  } = useQueryService<object, { data: Portfolio }>({
    service: portfolioDynamicEndpoints.getPortfolioById(portfolioId),
  });

  // Create section mutation
  const { mutateAsync: createSection, isPending: isCreatingSection } = useMutationService<
    CreateSectionRequest,
    { data: PortfolioSection }
  >({
    service: portfolioDynamicEndpoints.createSection(portfolioId),
  });
  const { mutateAsync: updateSection, isPending: isUpdatingSection } = useMutationService<
    UpdateSectionRequest,
    { data: PortfolioSection }
  >({
    service: () =>
      portfolioDynamicEndpoints.updateSection(
        Number(editingSection?.portfolioId || 0),
        Number(editingSection?.id || 0),
      ),
  });

  // Delete section mutation
  const { mutateAsync: deleteSection, isPending: isDeletingSection } = useMutationService<
    Record<string, never>,
    { data: PortfolioSection }
  >({
    service: () => portfolioDynamicEndpoints.deleteSection(portfolioId, deletingSectionId || 0),
  });

  const portfolio = useMemo(() => {
    if (!portfolioData?.data) return portfolioData?.data;

    const sortedSections = [...(portfolioData.data.sections || [])].sort((a, b) => {
      const aUpdatedAt = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const bUpdatedAt = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return bUpdatedAt - aUpdatedAt;
    });

    return {
      ...portfolioData.data,
      sections: sortedSections,
    };
  }, [portfolioData?.data]);

  const handleCreateSection = useCallback(
    async (values: CreateSectionRequest) => {
      try {
        await createSection(values);

        setAddSectionModalOpen(false);
        refetch();
      } catch {}
    },
    [createSection, refetch],
  );

  const handleDeleteSection = useCallback(
    async (sectionId: number) => {
      try {
        setDeletingSectionId(sectionId);
        await deleteSection({});
        setDeletingSectionId(null);
        refetch();
      } catch (error) {
        setDeletingSectionId(null);
        const errObj = error as { message?: string };
        showToast({ message: errObj?.message || "Failed to delete section", severity: "error" });
      }
    },
    [deleteSection, refetch],
  );

  const handleUpdateSection = useCallback(
    async (values: UpdateSectionRequest) => {
      if (!editingSection?.id) return;
      try {
        await updateSection(values);
        setEditingSection(null);
        setAddSectionModalOpen(false);
        refetch();
      } catch (error) {
        const errObj = error as { message?: string };
        showToast({ message: errObj?.message || "Failed to update section", severity: "error" });
      }
    },
    [editingSection?.id, refetch, updateSection],
  );

  return {
    portfolio,

    isLoading: isLoadingPortfolio,
    addSectionModalOpen,
    setAddSectionModalOpen,
    editingSection,
    setEditingSection,
    handleCreateSection,
    handleUpdateSection,
    isCreatingSection,
    isUpdatingSection,
    handleDeleteSection,
    isDeletingSection,
    deletingSectionId,
  };
}
