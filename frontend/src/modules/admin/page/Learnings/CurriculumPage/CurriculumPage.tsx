"use client";

import { Box, Typography } from "@mui/material";
import { InsightCard } from "@/components/InsightCard";
import ArrowRight from "@/modules/shared/assets/svgs/arrow-top-right.svg";
import useCurriculumPage from "./hooks/useCurriculumPage";
import CurriculumCardItem from "./CurriculumCardItem";
import { useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardRoutes } from "@/routes/dashboard.routes";
import { useLearningActions } from "@/layout/Shared/LearningActionsContext";
import ManageCurriculumModal from "@/modules/admin/component/ManageCurriculumModal/manageCurriculumModal";
import { DataRenderer } from "@/modules/shared/component/DataRenderer";
import type { CurriculumCard } from "../learning.constants";
import ConfirmModal from "@/components/ConfirmModal/confirmModal";
import TrashIcon from "@/modules/shared/assets/svgs/logoutIcon.svg";
import { useMediaQuery } from "@/utils/hooks/useMediaQuery";

export default function CurriculumPage({ teacherId }: { teacherId?: number | null } = {}) {
  const { setCurriculumActions, filterState } = useLearningActions();
  const router = useRouter();
  const {
    totalCurriculums,
    templatesCount,
    customCount,
    myLibraryCards,
    templateLibraryCards,
    addModalOpen,
    setAddModalOpen,
    onCurriculumAdded,
    handleDeleteCurriculum,
    deleteModalOpen,
    setDeleteModalOpen,
    selectedCard,
    setSelectedCard,
    isLoading,
    isDeleting,
  } = useCurriculumPage(teacherId, filterState.classroomId);
  const isMobile = useMediaQuery("(max-width:768px)");
  const handleOpenAddCurriculum = useCallback(() => {
    setAddModalOpen(true);
  }, [setAddModalOpen]);

  useEffect(() => {
    setCurriculumActions({
      openAdd: handleOpenAddCurriculum,
    });
    return () => setCurriculumActions(null);
  }, [setCurriculumActions, handleOpenAddCurriculum]);

  useEffect(() => {
    window.addEventListener("open-learning-add", handleOpenAddCurriculum);
    return () => window.removeEventListener("open-learning-add", handleOpenAddCurriculum);
  }, [handleOpenAddCurriculum]);

  const handleCardClick = (card: CurriculumCard) => {
    router.push(`${DashboardRoutes.viewCurriculum.replace(":id", card.id)}?source=my-library`);
  };

  return (
    <Box className="h-full space-y-6">
      <Box
        className={
          isMobile
            ? "flex gap-4 overflow-x-auto hide-scrollbar *:min-w-[220px]"
            : "grid grid-cols-3 gap-4"
        }
      >
        <InsightCard name="Total Curriculums" value={totalCurriculums} />
        <InsightCard name="Templates" value={templatesCount} />
        <InsightCard name="Custom" value={customCount} />
      </Box>

      <Box>
        <Box className="flex items-center justify-between mb-4">
          <Typography className="!text-base !font-semibold !text-primary-dark">
            My Library
          </Typography>
          <Link
            href={DashboardRoutes.learningMyLibrary}
            className="flex items-center gap-1 text-sm font-medium text-primary-dark"
          >
            View all
            <ArrowRight />
          </Link>
        </Box>
        <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <DataRenderer isLoading={isLoading}>
            {() => (
              <>
                {myLibraryCards.slice(0, 3).map((card) => (
                  <CurriculumCardItem
                    key={card.id}
                    card={card}
                    onClick={handleCardClick}
                    onDelete={(c) => {
                      setSelectedCard(c);
                      setDeleteModalOpen(true);
                    }}
                  />
                ))}
              </>
            )}
          </DataRenderer>
        </Box>
      </Box>

      <Box>
        <Box className="flex items-center justify-between mb-4">
          <Typography className="!text-base !font-semibold !text-primary-dark">
            Template Library
          </Typography>
          <Link
            href={DashboardRoutes.learningTemplatesLibrary}
            className="flex items-center gap-1 text-sm font-medium text-primary-dark"
          >
            View all
            <ArrowRight />
          </Link>
        </Box>
        <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {templateLibraryCards.slice(0, 8).map((card) => (
            <CurriculumCardItem
              key={card.id}
              card={card}
              showUseTemplate
              onUseTemplate={() => router.push(DashboardRoutes.learningTemplatesLibrary)}
              isTemplate
            />
          ))}
        </Box>
      </Box>

      <ConfirmModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={() => {
          handleDeleteCurriculum(selectedCard);
          setDeleteModalOpen(false);
        }}
        title="Delete Curriculum"
        description="Are you sure you want to delete this curriculum?"
        icon={<TrashIcon />}
        confirmLabel="Delete"
        confirmLabelClassName="!bg-[#D92D20]"
        cancelLabel="Cancel"
        loading={isDeleting}
      />
      {addModalOpen && (
        <ManageCurriculumModal
          open={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          onCurriculumAdded={() => {
            setAddModalOpen(false);
            onCurriculumAdded?.();
          }}
        />
      )}
    </Box>
  );
}
