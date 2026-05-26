"use client";

import { Box, Typography, Card, CardContent } from "@mui/material";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/modules/shared/component/Button";
import usePortfolioDetail from "./hooks/usePortfolioDetail";
import AddSectionModal from "../../../component/AddSectionModal/addSectionModal";
import ConfirmModal from "@/components/ConfirmModal/confirmModal";
import TrashIcon from "@/modules/shared/assets/svgs/trashicon.svg";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@/modules/shared/assets/svgs/add.svg";
import PlusIcon from "@/modules/shared/assets/svgs/plus-icon.svg";
import Image from "next/image";
import LeftIcon from "@/modules/shared/assets/images/chevronBack.png";
import { useState } from "react";
import type { CreateSectionRequest, PortfolioSection } from "@/services/portfolio.service";
import { ButtonIcon } from "@/modules/shared/component/ButtonIcon";
import { DataRenderer } from "@/modules/shared/component/DataRenderer";
import CalendarIcon from "@/modules/shared/assets/svgs/calendarLinear.svg";
import { LazyChatImage } from "@/modules/shared/component/ChatModal/chatModal";
import { useMediaQuery } from "@/utils/hooks/useMediaQuery";
import CheckCircleIcon from "@/modules/shared/assets/svgs/gg_check-o.svg";
export default function PortfolioDetailPage({
  portfolioId: propPortfolioId,
}: {
  portfolioId?: number;
}) {
  const router = useRouter();
  const isMobile = useMediaQuery("(max-width:768px)");
  const {
    portfolio,
    isLoading,
    addSectionModalOpen,
    setAddSectionModalOpen,
    editingSection,
    setEditingSection,
    handleCreateSection,
    handleUpdateSection,
    isCreatingSection,
    isUpdatingSection,
    handleDeleteSection,
    // isDeletingSection,
  } = usePortfolioDetail(propPortfolioId);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<PortfolioSection | null>(null);
  const params = useParams();
  const portfolioId = Number(params?.id);
  // if (isLoading) {
  //   return (
  //     <Box className="flex items-center justify-center h-full">
  //       <CircularProgress />
  //     </Box>
  //   );
  // }

  // if (!portfolio) {
  //   return (
  //     <Box className="flex flex-col items-center justify-center h-full gap-4">
  //       <Typography className="!text-lg !font-semibold">Portfolio not found</Typography>
  //       <Button onClick={() => router.back()}>Go Back</Button>
  //     </Box>
  //   );
  // }

  const handleConfirmDelete = async () => {
    if (sectionToDelete?.id) {
      await handleDeleteSection(sectionToDelete.id);
      setDeleteConfirmOpen(false);
      setSectionToDelete(null);
    }
  };

  const handleEditClick = (section: PortfolioSection) => {
    setEditingSection(section);
    setAddSectionModalOpen(true);
  };

  const formatPortfolioDate = (dateStr?: string | null): string => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Box className="h-full space-y-6 sm:p-">
      {/* Header */}
      <Box className="flex items-center justify-between">
        <Box className="flex items-center gap-4">
          <ButtonIcon
            className="rounded-full !border !border-brandColor-active/20 !p-2 flex items-center justify-center"
            onClick={() => router.back()}
          >
            <Image src={LeftIcon || "/placeholder.svg"} alt="back" />
          </ButtonIcon>
          <Box>
            <DataRenderer isLoading={isLoading}>
              {() => (
                <>
                  <Typography className="!text-xl sm:!text-2xl !font-bold !text-text-primary">
                    {`${portfolio?.student?.firstName} ${portfolio?.student?.lastName}` ||
                      "Untitled Portfolio"}
                  </Typography>
                  <Typography className="!text-xs sm:!text-sm !text-text-secondary">
                    {portfolio?.student.classroom
                      ? `${portfolio?.student.classroom.name} . ${formatPortfolioDate(portfolio.startDate)} - ${formatPortfolioDate(portfolio.endDate)}`
                      : "No grade set"}
                  </Typography>
                </>
              )}
            </DataRenderer>
          </Box>
        </Box>
        {isMobile ? (
          <ButtonIcon
            className="rounded-full !border !border-brandColor-active/20 !text-black !p-2 flex items-center justify-center"
            onClick={() => setAddSectionModalOpen(true)}
          >
            <AddIcon />
          </ButtonIcon>
        ) : (
          <Button
            className="!rounded-lg !bg-brandColor-active !px-4"
            startIcon={<PlusIcon />}
            onClick={() => setAddSectionModalOpen(true)}
          >
            Add Section
          </Button>
        )}
      </Box>

      {/* Milestones */}
      <Box
        className={`${isLoading ? "h-[200px]" : ""} space-y-4 p-4 border border-brandColor-active/20 rounded-lg bg-white`}
      >
        <DataRenderer isLoading={isLoading}>
          {() => (
            <>
              <Typography className="!text-base !font-semibold !text-text-primary pb-4 border-b border-border-light">
                Completed Milestones ({portfolio?.milestones?.length ?? 0})
              </Typography>

              {!portfolio?.milestones?.length ? (
                <Box className="py-8 text-center">
                  <Typography className="!text-sm sm:!text-sm !font-bold !text-text-primary">
                    No completed milestones are added to this portfolio
                  </Typography>
                </Box>
              ) : (
                <Box className="space-y-4">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {portfolio.milestones.map((milestone: any) => {
                    const milestoneId = milestone.milestoneId ?? milestone.id;
                    const milestoneLabel =
                      milestone.milestoneName ??
                      milestone.title ??
                      milestone.name ??
                      "Untitled milestone";

                    return (
                      <Box
                        key={milestoneId ?? `${milestoneLabel}-${milestone.createdAt ?? "idx"}`}
                        className="py-2.5 border-b border-border-light last:border-0 flex items-center gap-2"
                      >
                        <CheckCircleIcon className="" />

                        <Typography className="!text-sm !font-medium !text-text-primary">
                          {milestoneLabel}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </>
          )}
        </DataRenderer>
      </Box>

      {/* Sections */}
      <Box
        className={`${isLoading ? "h-[200px]" : ""} space-y-4 p-4 border border-brandColor-active/20 rounded-lg bg-white`}
      >
        <DataRenderer isLoading={isLoading}>
          {() => (
            <>
              <Typography className="!text-base !font-semibold !text-text-primary pb-4 border-b border-border-light">
                Sections
              </Typography>

              {!portfolio?.sections?.length ? (
                <Card className="!rounded-lg !border-none !shadow-none">
                  <CardContent className="!p-8 !text-center">
                    <Typography className="!text-text-secondary">
                      No sections added yet. Click &ldquo;Add Section&quot; to create one.
                    </Typography>
                  </CardContent>
                </Card>
              ) : (
                <Box className="divide-y flex flex-col gap-3 divide-gray-100">
                  {portfolio.sections.map((section) => {
                    const dateLabel = section.contentEntryDate
                      ? new Date(section.contentEntryDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : section.createdAt
                        ? new Date(section.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "";
                    const timeLabel = section.contentEntryTime
                      ? section.contentEntryTime.slice(0, 5).replace(":", ":") +
                        " " +
                        (Number(section.contentEntryTime.slice(0, 2)) >= 12 ? "PM" : "AM")
                      : "";

                    return (
                      <Box
                        key={section.id}
                        className="p-5 border border-border-light rounded-lg mt- first:mt-4"
                      >
                        {/* Date/time header */}
                        <Box className="flex items-center gap-2 mb-3">
                          <CalendarIcon />
                          <Typography className="!text-xs sm:!text-sm !text-brandColor-active flex items-center !gap-3">
                            <span>{dateLabel}</span>
                            {timeLabel ? `  ${timeLabel}` : ""}
                          </Typography>
                        </Box>

                        {/* Content text */}
                        {section.content && (
                          <Typography className="!text-xs sm:!text-sm !text-text-primary !whitespace-pre-wrap !mb-4">
                            {section.content}
                          </Typography>
                        )}

                        {/* Media images — side by side */}
                        {section.mediaUrls && section.mediaUrls.length > 0 && (
                          <Box className="flex flex-row flex-wrap gap-3 mt-2">
                            {section.mediaUrls.map((url, idx) => (
                              <a
                                key={idx}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block shrink-0"
                              >
                                {}
                                <LazyChatImage
                                  src={url}
                                  alt={`Section media ${idx + 1}`}
                                  className="max-w-52 max-h-40 object-cover rounded-lg  w-auto h-auto border border-gray-200 hover:opacity-90 transition-opacity"
                                  wrapperClassName="inline-block"
                                />
                              </a>
                            ))}
                          </Box>
                        )}

                        <Box className="flex justify-end mt-3 gap-2">
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<EditIcon />}
                            onClick={() => handleEditClick(section)}
                            className="!text-brandColor-active !border-brandColor-active hover:!bg-brandColor-active/5"
                          >
                            Edit
                          </Button>
                        </Box>
                        {/* Delete action */}
                        {/* <Box className="flex justify-end mt-3">
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<DeleteIcon />}
                            onClick={() => handleDeleteClick(section)}
                            className="!text-red-500 !border-red-500 hover:!bg-red-50"
                            disabled={deletingSectionId === section.id}
                          >
                            Delete
                          </Button>
                        </Box> */}
                      </Box>
                    );
                  })}
                </Box>
              )}
            </>
          )}
        </DataRenderer>
      </Box>

      {/* Modals */}
      <AddSectionModal
        open={addSectionModalOpen}
        onClose={() => {
          setAddSectionModalOpen(false);
          setEditingSection(null);
        }}
        onSubmit={(values) => {
          if (editingSection) {
            return handleUpdateSection(values);
          }
          return handleCreateSection(values as CreateSectionRequest);
        }}
        isLoading={isCreatingSection || isUpdatingSection}
        portfolioId={portfolioId}
        mode={editingSection ? "edit" : "create"}
        initialValues={
          editingSection
            ? { content: editingSection.content, mediaUrls: editingSection.mediaUrls || [] }
            : undefined
        }
      />

      <ConfirmModal
        open={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setSectionToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        icon={<TrashIcon />}
        title="Are you sure you want to delete this section?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
      />
    </Box>
  );
}
