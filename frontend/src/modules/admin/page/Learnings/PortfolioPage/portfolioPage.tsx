"use client";

import { Box } from "@mui/material";
import { Table } from "@/modules/shared/component/Table";
import { PaginationControls } from "@/modules/shared/component/Pagination/Pagination";
import usePortfolioPage from "./hooks/usePortfolioPage";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardRoutes } from "@/routes/dashboard.routes";
import { useLearningActions } from "@/layout/Shared/LearningActionsContext";
import CreatePortfolioModal from "../../../component/CreatePortfolioModal/createPortfolioModal";
import ConfirmModal from "@/components/ConfirmModal/confirmModal";
import TrashIcon from "@/modules/shared/assets/svgs/trashicon.svg";
import { SearchTextfield } from "@/modules/shared/component/SearchTextfield";
import LearningPageActions from "@/layout/Shared/LearningPageActions";
import FilterIcon from "@/modules/shared/assets/svgs/filter.svg";
import { useMediaQuery } from "@/utils/hooks/useMediaQuery";
import { useState } from "react";
import Drawer from "@mui/material/Drawer";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";

export default function PortfolioPage({ teacherId }: { teacherId?: number | null } = {}) {
  const router = useRouter();
  const isMobile = useMediaQuery("(max-width:768px)");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [mobileActionPortfolioId, setMobileActionPortfolioId] = useState<number | null>(null);
  const { setPortfolioActions } = useLearningActions();
  const {
    filters,
    applyFilters,
    PortfolioList,
    portfolioIds,
    currentPage,
    totalItems,
    isLoading,
    createModalOpen,
    setCreateModalOpen,
    isSubmitting,
    deleteModalOpen,
    setDeleteModalOpen,
    handleDeletePortfolio,
    editingPortfolio,
    setEditingPortfolio,
    updateStatusModalOpen,
    setUpdateStatusModalOpen,
    statusAction,
    setStatusAction,
    setStatusTargetPortfolio,
    isUpdatingStatus,
    handleConfirmStatusUpdate,
    handleSearch,
    refetch,
    mobilePortfolioData,
  } = usePortfolioPage(teacherId);

  const handleRowClick = (_rowData: unknown, rowIndex: number) => {
    const id = portfolioIds?.[rowIndex];
    if (id != null) router.push(DashboardRoutes.viewReport.replace(":id", String(id)));
  };

  const getStatusClassName = (status: string) => {
    const normalized = String(status || "").toLowerCase();
    if (normalized === "published") return "bg-success-green/15 text-success-green";
    if (normalized === "draft") return "bg-gray-100 text-gray-700";
    if (normalized === "archived") return "bg-gray-100 text-gray-700";
    return "bg-gray-100 text-gray-700";
  };

  useEffect(() => {
    setPortfolioActions?.({
      openCreate: () => setCreateModalOpen(true),
    });
    return () => setPortfolioActions?.(null);
  }, [setPortfolioActions, setCreateModalOpen]);

  return (
    <Box className="sm:p-0 flex flex-col gap-6">
      <Box className="md:flex justify-between items-center w-full gap-3 md:mt-4">
        <Box className="w-full lg:w-fit">
          <SearchTextfield
            onChange={handleSearch}
            placeholder="Search by child name, status, etc"
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
          : mobilePortfolioData?.map((portfolio) => (
              <button
                key={portfolio.id}
                type="button"
                // onClick={() =>
                //   router.push(
                //     DashboardRoutes.viewReport.replace(":id", String(portfolio.raw?.id)),
                //   )
                // }
                className="w-full rounded-xl border border-[#E4E7EC] bg-white p-4 text-left"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-sm text-text-primary truncate">
                    {portfolio.childName}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMobileActionPortfolioId(Number(portfolio.id));
                    }}
                    className="p-1 rounded-full hover:bg-gray-100 shrink-0"
                    aria-label="More options"
                  >
                    <MoreHorizIcon className="text-gray-500" fontSize="small" />
                  </button>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="mt-3 text-xs text-text-secondary whitespace-pre-line">
                    {portfolio.duration}
                  </div>
                  <div className="mt-3 flex items-center justify-end">
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusClassName(
                        portfolio.status,
                      )}`}
                    >
                      {portfolio.status}
                    </span>
                  </div>
                </div>
              </button>
            ))}
        {!!mobilePortfolioData?.length && (
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
      <Drawer
        anchor="bottom"
        open={!!mobileActionPortfolioId}
        onClose={() => setMobileActionPortfolioId(null)}
        PaperProps={{
          className: "rounded-t-2xl",
          style: { maxHeight: "70vh" },
        }}
      >
        <div className="px-6 pt-3 pb-8">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />
          <button
            className="w-full text-left py-4 text-sm font-medium border-b border-gray-100 text-[#022F2F]"
            onClick={() => {
              const selected = mobilePortfolioData?.find(
                (item) => Number(item.id) === mobileActionPortfolioId,
              );
              if (selected) router.push(DashboardRoutes.viewReport.replace(":id", String(selected.id)));
            }}
          > View</button>
          <button
            className="w-full text-left py-4 text-sm font-medium border-b border-gray-100 text-[#022F2F]"
            onClick={() => {
              const selected = mobilePortfolioData?.find(
                (item) => Number(item.id) === mobileActionPortfolioId,
              );
              if (selected) setEditingPortfolio(selected);
              setMobileActionPortfolioId(null);
            }}
          >
            Edit
          </button>
          <button
            className="w-full text-left py-4 text-sm font-medium border-b border-gray-100 text-[#022F2F]"
            onClick={() => {
              const selected = mobilePortfolioData?.find(
                (item) => Number(item.id) === mobileActionPortfolioId,
              );
              if (selected) {
                setStatusTargetPortfolio(selected);
                setStatusAction(selected.status === "Published" ? "draft" : "publish");
                setUpdateStatusModalOpen(true);
              }
              setMobileActionPortfolioId(null);
            }}
          >
            {mobilePortfolioData?.find((item) => Number(item.id) === mobileActionPortfolioId)?.status ===
            "Published"
              ? "Make Draft"
              : "Make Publish"}
          </button>
          <button
            className="w-full text-left py-4 text-sm font-medium text-red-500"
            onClick={() => {
              const selected = mobilePortfolioData?.find(
                (item) => Number(item.id) === mobileActionPortfolioId,
              );
              if (selected) {
                setEditingPortfolio(selected);
                setDeleteModalOpen(true);
              }
              setMobileActionPortfolioId(null);
            }}
          >
            Delete
          </button>
        </div>
      </Drawer>

      <Box className="hidden md:block !pb-4 rounded-xl">
        <Box className="bg-white rounded-xl !border-border-table">
          <Table
            headers={["Child Name", "Class", "Sections", "Duration", "Status", "Action"]}
            tableData={PortfolioList}
            onRowClick={handleRowClick}
            preventRowClickColumnIndex={5}
            isCollapse
            centeredHeaderIndex={[2, 3, 4]}
            rightAlignedIndex={[5]}
            className="relative"
            headerRowClassName="!bg-[#F9FAFB] !border-b !border-[#E4E7EC] !text-sm"
            headerCellClassName="!text-dark !font-medium"
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

      <CreatePortfolioModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => {
          refetch();
        }}
        isLoading={isSubmitting}
      />
      <CreatePortfolioModal
        open={Boolean(editingPortfolio)}
        onClose={() => setEditingPortfolio(null)}
        onSuccess={() => {
          refetch();
          setEditingPortfolio(null);
        }}
        isLoading={isSubmitting}
        mode="edit"
        portfolioId={editingPortfolio?.raw?.id}
        initialValues={{
          classroomId: editingPortfolio?.raw?.student?.classroom?.id,
          classroomName: editingPortfolio?.raw?.student?.classroom?.name,
          studentId: editingPortfolio?.raw?.student?.id,
          studentName: editingPortfolio?.childName,
          startDate: editingPortfolio?.raw?.startDate,
          endDate: editingPortfolio?.raw?.endDate,
        }}
      />

      <ConfirmModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeletePortfolio}
        icon={<TrashIcon />}
        title="Are you sure you want to delete this portfolio?"
        description="This action cannot be undone. Once deleted, all related data will be permanently removed."
        confirmLabel="Delete"
        cancelLabel="Cancel"
      />
      <ConfirmModal
        open={updateStatusModalOpen}
        onClose={() => {
          setUpdateStatusModalOpen(false);
          setStatusTargetPortfolio(null);
        }}
        onConfirm={handleConfirmStatusUpdate}
        title={`Are you sure you want to ${statusAction === "publish" ? "publish" : "move to draft"} this report?`}
        description="This will update the report visibility status immediately."
        confirmLabel={statusAction === "publish" ? "Publish" : "Make Draft"}
        cancelLabel="Cancel"
        loading={isUpdatingStatus}
      />
    </Box>
  );
}
