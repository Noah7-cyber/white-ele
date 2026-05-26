"use client";

import { Box } from "@mui/material";
import { Typography } from "@mui/material";
import { Table } from "@/modules/shared/component/Table";
import { PaginationControls } from "@/modules/shared/component/Pagination/Pagination";
import useMilestonesPage from "./hooks/useMilestonesPage";
import { useEffect } from "react";
import { useLearningActions } from "@/layout/Shared/LearningActionsContext";
import ManageMilestoneModal from "../../../component/ManageMilestoneModal/manageMilestoneModal";
import AddMilestoneFromLibraryModal from "../../../component/AddMilestoneFromLibraryModal/addMilestoneFromLibraryModal";
import ConfirmModal from "@/components/ConfirmModal/confirmModal";
import WarnIcon from "@/modules/shared/assets/svgs/warnIcon.svg";
import TrashIcon from "@/modules/shared/assets/svgs/trashicon.svg";
import { SearchTextfield } from "@/modules/shared/component/SearchTextfield";
import LearningPageActions from "@/layout/Shared/LearningPageActions";
import FilterIcon from "@/modules/shared/assets/svgs/filter.svg";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import Drawer from "@mui/material/Drawer";
import { useMediaQuery } from "@/utils/hooks/useMediaQuery";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { milestoneDynamicEndpoints } from "@/services/milestone.service";

const DATE_DISPLAY_OPTIONS: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  year: "numeric",
};

function formatMilestoneDate(dateStr?: string | null): string | undefined {
  if (!dateStr) return undefined;
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", DATE_DISPLAY_OPTIONS);
  } catch {
    return dateStr;
  }
}

function formatPeriod(startDate?: string | null, endDate?: string | null): string {
  if (!startDate && !endDate) return "—";
  const startFormatted = formatMilestoneDate(startDate);
  const endFormatted = formatMilestoneDate(endDate);
  if (!startFormatted && !endFormatted) return "—";
  if (!startFormatted) return endFormatted ?? "—";
  if (!endFormatted) return startFormatted;
  return `${startFormatted} - ${endFormatted}`;
}

export default function MilestonesPage({ teacherId }: { teacherId?: number | null } = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { setMilestoneActions } = useLearningActions();
  const {
    filters,
    applyFilters,
    MilestoneList,
    currentPage,
    totalItems,
    isLoading,
    addModalOpen,
    setAddModalOpen,
    editingMilestone,
    setEditingMilestone,
    handleAddMilestone,
    handleEditMilestone,
    isSubmitting,
    deleteModalOpen,
    setDeleteModalOpen,
    draftModalOpen,
    setDraftModalOpen,
    addFromLibraryModalOpen,
    setAddFromLibraryModalOpen,
    handleAddMilestoneFromLibrary,
    handleSearch,
    mobileMilestoneData,
    handleDeactivateMilestone,
    isDeactivatingMilestone,
    milestoneStatus,
  } = useMilestonesPage(teacherId);

  const isMobile = useMediaQuery("(max-width:768px)");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [mobileAddOpen, setMobileAddOpen] = useState(false);
  const [mobileActionMilestoneId, setMobileActionMilestoneId] = useState<number | null>(null);
  const [mobileViewMilestoneId, setMobileViewMilestoneId] = useState<number | null>(null);

  const { data: viewMilestoneData, isLoading: isViewMilestoneLoading } = useQueryService<
    Record<string, never>,
    {
      data: {
        title?: string;
        status?: string;
        createdAt?: string;
        startDate?: string;
        endDate?: string;
        classrooms?: { name: string }[];
      };
    }
  >({
    service: milestoneDynamicEndpoints.getMilestoneById(Number(mobileViewMilestoneId)),
    options: {
      enabled: !!mobileViewMilestoneId,
    },
  });

  useEffect(() => {
    setMilestoneActions({
      openAdd: () => (isMobile ? setMobileAddOpen(true) : setAddModalOpen(true)),
      openFromLibrary: () => (isMobile ? setMobileAddOpen(true) : setAddFromLibraryModalOpen(true)),
    });
    return () => setMilestoneActions(null);
  }, [setMilestoneActions, setAddModalOpen, setAddFromLibraryModalOpen, isMobile]);

  useEffect(() => {
    const openFromReturn = searchParams?.get("openMilestoneModal") === "1";
    if (!openFromReturn) return;
    setAddModalOpen(true);
    router.replace(pathname);
  }, [searchParams, setAddModalOpen, router, pathname]);

  const statusClassName = (status: string) => {
    const normalized = String(status || "").toLowerCase();
    if (normalized === "completed") return "bg-[#EDFFF7] text-success-green";
    if (normalized === "active") return "bg-success-green/15 text-success-green";
    if (normalized === "draft") return "bg-primary-dark/10 text-primary-dark";
    return "bg-gray-100 text-gray-700";
  };

  return (
    <Box className="sm:p-0 flex flex-col gap-6">
      <Box className="md:flex justify-between items-center w-full gap-3 md:mt-4">
        <Box className="w-full lg:w-fit">
          <SearchTextfield
            placeholder="Search milestone"
            onChange={handleSearch}
            isRounded={isMobile}
            fullWidth={isMobile}
            endIcon={
              <button
                className="md:hidden"
                onClick={() => setMobileFilterOpen(true)}
                aria-label="Open filters"
              >
                <FilterIcon className="text-gray-500" />
              </button>
            }
          />
        </Box>
        <LearningPageActions
          mobileFilterOpen={mobileFilterOpen}
          setMobileFilterOpen={setMobileFilterOpen}
        />
      </Box>
      <div className="md:hidden flex flex-col gap-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-[#E4E7EC] bg-white p-4 h-24 animate-pulse"
              />
            ))
          : mobileMilestoneData?.map((milestone) => (
              <div
                key={milestone.id}
                className="w-full rounded-xl border border-[#E4E7EC] bg-white p-4 text-left"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-sm text-text-primary truncate">
                    {milestone.milestoneName}
                  </span>
                  <button
                    onClick={() => setMobileActionMilestoneId(Number(milestone.id))}
                    className="p-1 rounded-full hover:bg-gray-100 shrink-0"
                    aria-label="More options"
                  >
                    <MoreHorizIcon className="text-gray-500" fontSize="small" />
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-text-secondary">{milestone.class}</span>
                  <span
                    className={`text-xs font-medium capitalize px-2 py-1 rounded-full ${statusClassName(
                      milestone.status,
                    )}`}
                  >
                    {milestone.status}
                  </span>
                </div>
              </div>
            ))}
        {!!mobileMilestoneData?.length && (
          <PaginationControls
            currentPage={currentPage}
            rowsPerPage={filters?.delta}
            totalItems={totalItems}
            onPageChange={(event) => {
              applyFilters({
                pos: (event?.page - 1) * event?.rowsPerPage,
                delta: event?.rowsPerPage,
              });
            }}
            isCondense
            bottomTableClasses="!text-xs"
          />
        )}
      </div>

      <Box className="hidden md:block !pb-4 rounded-xl">
        <Box className="bg-white rounded-xl  !border-border-table">
          <Table
            headers={["Milestone Name", "Class", "Milestone Period", "Status", "Action"]}
            tableData={MilestoneList}
            isCollapse
            centeredHeaderIndex={[3]}
            rightAlignedIndex={[4]}
            className="relative"
            headerRowClassName="!bg-[#F9FAFB] !border-b !border-[#E4E7EC] !text-sm"
            headerCellClassName="!text-dark !font-medium"
            // bodyCellClassName="!text-dark !text-base !font-medium !text-center !text- align-middle !py-4"
            bodyRowClassName="border-b border-[#E4E7EC] last:border-0"
            tableContainerClassName="!border !border-[#E4E7EC] !rounded-lg !overflow-hidden !bg-white"
            isLoading={isLoading}
          />
        </Box>
        <Box className="flex justify-center pt-4">
          <PaginationControls
            currentPage={currentPage}
            rowsPerPage={filters?.delta}
            totalItems={totalItems}
            onPageChange={(event) => {
              applyFilters({
                pos: (event?.page - 1) * event?.rowsPerPage,
                delta: event?.rowsPerPage,
              });
            }}
            isCondense
            bottomTableClasses="!text-xs"
          />
        </Box>
      </Box>

      <ManageMilestoneModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSubmit={handleAddMilestone}
        isLoading={isSubmitting}
        isSubmitting={isSubmitting}
        baseReturnPath={pathname}
      />
      <ManageMilestoneModal
        open={!!editingMilestone}
        onClose={() => setEditingMilestone(null)}
        onSubmit={handleEditMilestone}
        milestone={editingMilestone ?? undefined}
        isSubmitting={isSubmitting}
        isLoading={isSubmitting}
        baseReturnPath={pathname}
      />
      <ConfirmModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={() => {}}
        icon={<TrashIcon />}
        title="Are you sure you want to delete this milestone?"
        description="This action cannot be undone. Once deleted, all related data will be permanently removed."
        confirmLabel="Delete"
        cancelLabel="Cancel"
      />

      {/* Mobile bottom drawer for adding milestone */}
      <Drawer
        anchor="bottom"
        open={mobileAddOpen}
        onClose={() => setMobileAddOpen(false)}
        PaperProps={{
          className: "rounded-t-2xl",
          style: { maxHeight: "40vh" },
        }}
      >
        <div className="px-6 pt-3 pb-10">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />
          <button
            className="w-full text-left py-4 text-sm font-medium border-b border-gray-100 text-[#022F2F]"
            onClick={() => {
              setMobileAddOpen(false);
              setAddModalOpen(true);
            }}
          >
            + Add Milestone
          </button>
          <button
            className="w-full text-left py-4 text-sm font-medium text-[#022F2F]"
            onClick={() => {
              setMobileAddOpen(false);
              setAddFromLibraryModalOpen(true);
            }}
          >
            + Add from library
          </button>
        </div>
      </Drawer>

      <Drawer
        anchor="bottom"
        open={!!mobileActionMilestoneId}
        onClose={() => setMobileActionMilestoneId(null)}
        PaperProps={{
          className: "rounded-t-2xl",
          style: { maxHeight: "70vh" },
        }}
      >
        <div className="px-5 pt-3 pb-8">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />
          <button
            className="w-full text-left py-4 text-sm font-medium border-b border-gray-100 text-[#022F2F]"
            onClick={() => {
              if (!mobileActionMilestoneId) return;
              setMobileViewMilestoneId(mobileActionMilestoneId);
              setMobileActionMilestoneId(null);
            }}
          >
            View
          </button>
          <button
            className="w-full text-left py-4 text-sm font-medium border-b border-gray-100 text-[#022F2F]"
            onClick={() => {
              const selectedMilestone = mobileMilestoneData?.find(
                (item) => Number(item.id) === mobileActionMilestoneId,
              );
              if (selectedMilestone) {
                setEditingMilestone(selectedMilestone);
              }
              setMobileActionMilestoneId(null);
            }}
          >
            Edit
          </button>
          <button
            className="w-full text-left py-4 text-sm font-medium text-red-500"
            onClick={() => {
              setDeleteModalOpen(true);
              setMobileActionMilestoneId(null);
            }}
          >
            Delete
          </button>
        </div>
      </Drawer>

      <Drawer
        anchor="bottom"
        open={!!mobileViewMilestoneId}
        onClose={() => setMobileViewMilestoneId(null)}
        PaperProps={{
          className: "rounded-t-2xl",
          style: { maxHeight: "75vh" },
        }}
      >
        <div className="px-5 pt-3 pb-8">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />
          {isViewMilestoneLoading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-6 bg-gray-200 rounded w-2/3" />
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-28 bg-gray-200 rounded" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3">
                <Typography className="!text-xl !font-semibold !text-text-primary">
                  {viewMilestoneData?.data?.title ?? "Milestone"}
                </Typography>
                <span
                  className={`text-xs font-medium capitalize px-3 py-1 rounded-full ${statusClassName(
                    viewMilestoneData?.data?.status ?? "",
                  )}`}
                >
                  {viewMilestoneData?.data?.status ?? "Draft"}
                </span>
              </div>
              <Typography className="!text-sm !text-input-gray !mt-3">
                Overview of milestone information.
              </Typography>
              <div className="border-t border-border-light my-4" />
              <Typography className="!text-base !font-semibold !text-text-primary !mb-3">
                Milestone Details
              </Typography>
              <div className="border border-border-light/60 rounded-lg overflow-hidden">
                <div className="flex items-center px-4 py-3">
                  <Typography className="!text-sm !text-input-gray w-[140px]">Class:</Typography>
                  <Typography className="!text-sm !font-medium !text-text-primary">
                    {(viewMilestoneData?.data?.classrooms ?? []).map((c) => c.name).join(", ") || "—"}
                  </Typography>
                </div>
                <div className="flex items-center px-4 py-3">
                  <Typography className="!text-sm !text-input-gray w-[140px]">
                    Milestone Period:
                  </Typography>
                  <Typography className="!text-sm !font-medium !text-text-primary">
                    {formatPeriod(
                      viewMilestoneData?.data?.startDate,
                      viewMilestoneData?.data?.endDate,
                    )}
                  </Typography>
                </div>
                <div className="flex items-center px-4 py-3">
                  <Typography className="!text-sm !text-input-gray w-[140px]">Created On:</Typography>
                  <Typography className="!text-sm !font-medium !text-text-primary">
                    {viewMilestoneData?.data?.createdAt
                      ? new Date(viewMilestoneData.data.createdAt).toLocaleDateString("en-GB", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : "—"}
                  </Typography>
                </div>
              </div>
            </>
          )}
        </div>
      </Drawer>

      <ConfirmModal
        open={draftModalOpen}
        onClose={() => setDraftModalOpen(false)}
        onConfirm={handleDeactivateMilestone}
        icon={<WarnIcon />}
        title={
          String(milestoneStatus || "").toLowerCase() === "active"
            ? "Are you sure you want to deactivate this milestone?"
            : "Are you sure you want to activate this milestone?"
        }
        description={
          String(milestoneStatus || "").toLowerCase() === "active"
            ? "You will be able to reactivate this milestone later."
            : "This milestone will be able to access active features again."
        }
        confirmLabel={
          String(milestoneStatus || "").toLowerCase() === "active" ? "Deactivate" : "Activate"
        }
        cancelLabel="Cancel"
        loading={isDeactivatingMilestone}
      />
      <AddMilestoneFromLibraryModal
        open={addFromLibraryModalOpen}
        onClose={() => setAddFromLibraryModalOpen(false)}
        onSubmit={handleAddMilestoneFromLibrary}
        isLoading={isSubmitting}
      />
    </Box>
  );
}
