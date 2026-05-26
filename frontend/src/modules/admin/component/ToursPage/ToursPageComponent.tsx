/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useMemo } from "react";
import { Box } from "@mui/material";
import { Table } from "@/modules/shared/component/Table";
import { PaginationControls } from "@/modules/shared/component/Pagination";
import { ButtonIcon, ButtonVariant } from "@/modules/shared/component/ButtonIcon";
import { CWPopover } from "@/modules/shared/component/Popover/popover";
import useTour from "./hooks/useTour";
import { Tours } from "@/services/tour.service";
import { useRouter } from "next/navigation";
import { capitalizeFirstLetter } from "@/utils/helpers";
import { SearchTextfield } from "@/modules/shared/component/SearchTextfield";
import { useDeleteForm } from "@/screens/AdmissionForms/hooks/useFormApi";
import { useQueryClient } from "@tanstack/react-query";
import EllipsesIcon from "@/modules/shared/assets/svgs/ellipses.svg";
import { MobileAdmissionCard } from "@/modules/admin/component/MobileAdmissionCard";
import ConfirmModal from "@/components/ConfirmModal/confirmModal";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { formDynamicEndpoints } from "@/services/form.service";
import WarnIcon from "@/modules/shared/assets/svgs/warnIcon.svg";
import TrashIcon from "@/modules/shared/assets/svgs/trashicon.svg";

const headers = ["Name", "Type", "Date Created", "Status", "Action"];

function formatTourDate(isoDate: string): string {
  const date = new Date(isoDate);
  const day = date.getDate();
  const month = date.toLocaleDateString("en-US", { month: "short" });
  const year = date.getFullYear();
  return `${day} ${month}, ${year}`;
}

function transformAdmissionsData(admissions: Tours[]) {
  return admissions.map((admission) => ({
    name: admission.name,
    type: capitalizeFirstLetter(admission.type),
    date: formatTourDate(admission.createdAt),
    createdAt: admission.createdAt,
    status: admission.status,
    url: admission.type === "tour" ? admission.url : admission.slug || admission.url,
    slug: admission.slug || admission.url,
    id: admission.id,
  }));
}

function getStatusBadge(status: string) {
  const base = "px-5 py-[4px] text-xs font-medium rounded-full text-center";
  if (status.toLowerCase().includes("draft"))
    return <span className={`${base} bg-[#FF414B26] text-[#FF414B]`}>Not Published</span>;
  return <span className={`${base}  bg-[#FEB92B26] text-[#A3720D]`}>Published</span>;
}

type FormItem = {
  name: string;
  type: "Form";
  date: string;
  createdAt: string;
  status: string;
  url?: string;
  id: number;
  slug?: string;
};

type AdmissionItem = {
  name: string;
  type: string;
  date: string;
  createdAt: string;
  status: string;
  url?: string;
  id: number;
  slug?: string;
};

function TourActionPopover({ item }: { item: { url?: string; id: number } }) {
  const router = useRouter();

  return (
    <CWPopover
      buttonProps={{ className: "!p-0 !min-w-0" }}
      actionComponent={
        <ButtonIcon
          variant={ButtonVariant.outlined}
          className="rotate-90! bg-white! rounded-sm!"
        >
          <EllipsesIcon />
        </ButtonIcon>
      }
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      popoverProps={{ transformOrigin: { vertical: "top", horizontal: "right" } }}
    >
      {(closePopover) => (
        <Box className="flex flex-col py-1 gap-1 min-w-37.5">
          <button
            className="px-4 py-2 text-left text-xs hover:bg-gray-100 cursor-pointer"
            onClick={() => {
              closePopover();
              window.open(`/tour-events/${item.url}`, "_blank");
            }}
          >
            View tour
          </button>
          {/* <button
            className="px-4 py-2 text-left text-xs hover:bg-gray-100 cursor-pointer"
            onClick={() => {
              closePopover();
              router.push(`/admin/admission/tours/${item.id}/edit`);
            }}
          >
            Edit tour
          </button> */}
        </Box>
      )}
    </CWPopover>
  );
}

function FormActionPopover({
  item,
  onDeleteRequest,
  onStatusUpdateRequest,
}: {
  item: FormItem;
  onDeleteRequest: (item: FormItem) => void;
  onStatusUpdateRequest: (item: FormItem, nextStatus: "published" | "draft") => void;
}) {
  // ? should be uncommented when status is provided
  const isPublished = !item.status.toLowerCase().includes("not");
  const liveSlug = item.slug || item.url;
  const editSlug = item.slug || item.url;
  const router = useRouter();

  return (
    <CWPopover
      buttonProps={{
        className: "!p-0 !min-w-0",
      }}
      actionComponent={
        <ButtonIcon
          variant={ButtonVariant.outlined}
          className="rotate-90! bg-white! rounded-sm!"
        >
          <EllipsesIcon />
        </ButtonIcon>
      }
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
      popoverProps={{
        transformOrigin: { vertical: "top", horizontal: "right" },
      }}
    >
      {(closePopover) => (
        <Box className="flex flex-col py-1 gap-1 min-w-37.5">
          {isPublished ? (
            <>
              <button
                className={`px-4 py-2 text-left text-xs ${liveSlug ? "hover:bg-gray-100 cursor-pointer" : "text-gray-400 cursor-not-allowed"
                  }`}
                disabled={!liveSlug}
                onClick={() => {
                  if (!liveSlug) return;
                  closePopover();
                  window.open(`/forms/live/${liveSlug}`, "_blank");
                }}
              >
                Preview Form
              </button>
              <button
                className="px-4 py-2 text-left text-xs hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  closePopover();
                  router.push(`/admin/admission/forms/${item.url}`);
                }}
              >
                View Responses
              </button>
              <button
                className={`px-4 py-2 text-left text-xs ${editSlug ? "hover:bg-gray-100 cursor-pointer" : "text-gray-400 cursor-not-allowed"}`}
                disabled={!editSlug}
                onClick={() => {
                  if (!editSlug) return;
                  closePopover();
                  router.push(`/admin/admission/forms/${editSlug}/edit`);
                }}
              >
                Edit Form
              </button>
              {item?.status?.toLowerCase() === "published" ? <button
                className="px-4 py-2 text-left text-xs hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  closePopover();
                  onStatusUpdateRequest(item, "draft");
                }}
              >
                Unpublish
              </button> : <button
                className="px-4 py-2 text-left text-xs hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  closePopover();
                  onStatusUpdateRequest(item, "published");
                }}
              >
                Publish
              </button>}
            </>
          ) : (
            <>
              <button
                className={`px-4 py-2 text-left text-xs ${editSlug ? "hover:bg-gray-100 cursor-pointer" : "text-gray-400 cursor-not-allowed"}`}
                disabled={!editSlug}
                onClick={() => {
                  if (!editSlug) return;
                  closePopover();
                  router.push(`/admin/admission/forms/${editSlug}/edit`);
                }}
              >
                Edit Form
              </button>
              <button
                className="px-4 py-2 text-left text-xs hover:bg-gray-100 cursor-pointer text-brandColor-active"
                onClick={() => {
                  closePopover();
                  onStatusUpdateRequest(item, "published");
                }}
              >
                Publish
              </button>
            </>
          )}
          <button
            className="px-4 py-2 text-left text-xs text-red-600 hover:bg-red-50 cursor-pointer pt-2"
            onClick={() => {
              closePopover();
              onDeleteRequest(item);
            }}
          >
            Delete
          </button>
        </Box>
      )}
    </CWPopover>
  );
}

export default function ToursPageComponent() {
  const [rowsPerPage] = useState(10);
  const [deleteTarget, setDeleteTarget] = useState<FormItem | null>(null);
  const [statusUpdateTarget, setStatusUpdateTarget] = useState<{
    item: FormItem;
    nextStatus: "published" | "draft";
  } | null>(null);
  const queryClient = useQueryClient();

  const { mutateAsync: deleteFormAsync, isPending: isDeletingForm } = useDeleteForm();

  const { mutateAsync: patchStatusAsync, isPending: isPatchingStatus } = useMutationService({
    service: (variables: { id: number; status: string }) =>
      formDynamicEndpoints.patchFormStatus(variables.id),
  });

  const {
    fetchedAdmissions,
    isAdmissionsLoading,
    isFetchingNextAdmissions,
    admissionsTotalCount,
    handlePageChange,
    currentPage,
    handleSearch,
    fetchAllTours,
    fetchAllAdmissions
  } = useTour({ delta: rowsPerPage });

  // Merge and sort by createdAt descending
  const transformedItems: AdmissionItem[] = useMemo(() => {
    return transformAdmissionsData(fetchedAdmissions ?? []);
  }, [fetchedAdmissions]);

  // Paginate client-side over accumulated items
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return transformedItems.slice(start, end);
  }, [transformedItems, currentPage, rowsPerPage]);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteFormAsync({ formId: deleteTarget.id });
      fetchAllAdmissions()
      queryClient.invalidateQueries({ queryKey: ["admissions"] });
    } catch (error) {
      console.error(error);
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleConfirmStatusUpdate = async () => {
    if (!statusUpdateTarget) return;
    try {
      await patchStatusAsync({
        id: statusUpdateTarget.item.id,
        status: statusUpdateTarget.nextStatus,
      });
      fetchAllAdmissions()
      queryClient.invalidateQueries({ queryKey: ["admissions"] });
    } catch (error) {
      console.error(error);
    } finally {
      setStatusUpdateTarget(null);
    }
  };

  const rows = paginatedItems.map((item: any) => ({
    0: item.name,
    1: item.type,
    2: item.date,
    3: getStatusBadge(item.status),
    4: (
      <Box className="flex justify-center">
        {item.type.toLowerCase() === "tour" ? (
          <TourActionPopover item={item} />
        ) : (
          <FormActionPopover
            item={item}
            onDeleteRequest={setDeleteTarget}
            onStatusUpdateRequest={(item, nextStatus) => setStatusUpdateTarget({ item, nextStatus })}
          />
        )}
      </Box>
    ),
  }));

  const isLoading = isAdmissionsLoading;
  const isFetchingMore = isFetchingNextAdmissions;

  return (
    <Box className="space-y-6">
      <Box className="flex flex-col gap-4">
        <SearchTextfield
          onChange={handleSearch}
          placeholder="Search by name, status, etc"
          fullWidth
          className="max-w-full md:w-96 md:max-w-112.5 bg-white"
        />

        <div className="md:hidden flex flex-col gap-3">
          {isLoading || isFetchingMore
            ? Array.from({ length: rowsPerPage }).map((_, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-[#E4E7EC] bg-white p-4 h-28 animate-pulse"
              />
            ))
            : paginatedItems.map((item: AdmissionItem) => (
              <MobileAdmissionCard
                key={`${item.type}-${item.id}`}
                name={item.name}
                type={item.type}
                date={item.date}
                statusBadge={getStatusBadge(item.status)}
                actionComponent={
                  item.type.toLowerCase() === "tour" ? (
                    <TourActionPopover item={item} />
                  ) : (
                    <FormActionPopover
                      item={item as FormItem}
                      onDeleteRequest={setDeleteTarget}
                      onStatusUpdateRequest={(item, nextStatus) => setStatusUpdateTarget({ item, nextStatus })}
                    />
                  )
                }
              />
            ))}

          {!!paginatedItems?.length && <Box
            className="flex justify-center pt-2"
            sx={{
              opacity: admissionsTotalCount === 0 ? 0.6 : 1,
              pointerEvents: admissionsTotalCount === 0 ? "none" : "auto",
            }}
          >
            <PaginationControls
              currentPage={currentPage}
              rowsPerPage={rowsPerPage}
              totalItems={admissionsTotalCount}
              onPageChange={handlePageChange}
              isCondense
              bottomTableClasses="!text-xs"
            />
          </Box>}
        </div>

        <div className="hidden md:block">
          <Table
            headers={headers}
            tableData={rows}
            centeredHeaderIndex={[1, 2, 3, 4]}
            isCollapse
            isLoading={isLoading || isFetchingMore}
          />

          <Box className="flex justify-center">
            <PaginationControls
              currentPage={currentPage}
              rowsPerPage={rowsPerPage}
              totalItems={admissionsTotalCount}
              onPageChange={handlePageChange}
            />
          </Box>
        </div>
      </Box>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        loading={isDeletingForm}
        title="Delete form"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmLabelClassName="!bg-red-600 hover:!bg-red-700"
        icon={<TrashIcon />}
      />

      <ConfirmModal
        open={!!statusUpdateTarget}
        onClose={() => setStatusUpdateTarget(null)}
        onConfirm={handleConfirmStatusUpdate}
        loading={isPatchingStatus}
        title={statusUpdateTarget?.nextStatus === "published" ? "Publish form" : "Unpublish form"}
        description={`Are you sure you want to ${statusUpdateTarget?.nextStatus === "published" ? "publish" : "unpublish"} "${statusUpdateTarget?.item.name}"?`}
        confirmLabel={statusUpdateTarget?.nextStatus === "published" ? "Publish" : "Unpublish"}
        icon={<WarnIcon />}
      />
    </Box>
  );
}
