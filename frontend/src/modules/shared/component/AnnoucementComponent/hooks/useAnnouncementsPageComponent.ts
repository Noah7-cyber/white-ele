/* eslint-disable @typescript-eslint/no-explicit-any */
import { ITEMS_PER_PAGE } from "@/constants";
import {
  ListAnnouncementsQuery,
  announcementDynamicEndpoints,
  announcementServices,
} from "@/services/announcements.service";
import { useFilter } from "@/utils/hooks/useFilter";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { ChangeEvent, useState } from "react";
import { showToast } from "../../Toast";
import { Announcement } from "../AnnoucementPageComp";
import { useDebouncer } from "@/utils/hooks/useDebouncer";

type AnnouncementRole = "admin" | "staff" | "parent";

export function useAnnouncementsPageComponent(
  role: AnnouncementRole = "admin",
  initialAnnouncementId?: string,
) {
  const { filters, applyFilters } = useFilter({
    delta: ITEMS_PER_PAGE || 10,
    search: "",
    pos: 0,
    announcementStatus: "",
  });
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [deleteModal, setDeleteModal] = useState(false);
  const [archiveModal, setArchiveModal] = useState(false);
  const [publishModal, setPublishModal] = useState(false);
  const { debouncedSearch, setSearch } = useDebouncer();

  const handleSearch = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSearch(e.target.value);
  };

  const listQuery: ListAnnouncementsQuery = {
    ...(filters?.delta ? { delta: filters.delta } : {}),
    ...(filters?.pos !== undefined ? { pos: filters.pos } : {}),
    search: debouncedSearch?.trim(),
    sortBy: "createdAt",
    sortOrder: "DESC",
    ...(role === "admin"
      ? filters?.announcementStatus
        ? { announcementStatus: filters.announcementStatus }
        : {}
      : { announcementStatus: "published" }),
  };

  const {
    data = {} as any,
    isLoading,
    refetch,
  } = useQueryService<any, any>({
    service: {
      ...announcementServices.getAnnouncement,
      data: listQuery,
    },
  });

  const selectedAnnouncementId = (selectedAnnouncement as any)?.id || initialAnnouncementId || "";
  const { data: selectedAnnouncementResponse = {} as any, isLoading: isAnnouncementDetailLoading } =
    useQueryService({
      service: announcementDynamicEndpoints.getAnnouncementById(selectedAnnouncementId),
      options: {
        enabled: !!selectedAnnouncementId,
      },
    });

  const announcements = data?.announcement || [];
  const pagination = data?.pagination || null;

  const currentPage =
    Math.floor((pagination?.pos || 0) / (pagination?.delta || ITEMS_PER_PAGE)) + 1;

  const { mutateAsync: deleteMutate, isPending: isDeleting } = useMutationService({
    service: announcementDynamicEndpoints.deleteAnnouncement((selectedAnnouncement as any)?.id),
  });

  async function onDelete() {
    try {
      await deleteMutate({});
      setDeleteModal(false);
      setSelectedAnnouncement(null);
      showToast({
        message: "Announcement Deleted",
        description: "The announcement has been successfully deleted.",
        severity: "success",
        duration: 3000,
      });

      refetch();
    } catch (error: any) {
      showToast({
        message: "Failed to Delete Announcement",
        description: error?.message,
        severity: "success",
        duration: 3000,
      });
    }
  }

  const { mutateAsync: updateMutate, isPending: isUpdating } = useMutationService({
    service: announcementDynamicEndpoints.updateAnnouncement((selectedAnnouncement as any)?.id),
  });

  async function onArchive() {
    try {
      await updateMutate({
        announcementStatus:
          selectedAnnouncement?.announcementStatus === "archived" ? "published" : "archived",
      });
      setArchiveModal(false);
      setSelectedAnnouncement(null);
      refetch();
      showToast({
        message: "Announcement Update",
        description: "The announcement has been successfully updated.",
        severity: "success",
        duration: 3000,
      });
    } catch (error: any) {
      showToast({
        message: "Failed to Update Announcement",
        description: error?.message,
        severity: "success",
        duration: 3000,
      });
    }
  }
  async function onPublish() {
    try {
      await updateMutate({
        announcementStatus: "published",
      });
      setPublishModal(false);
      setSelectedAnnouncement(null);
      refetch();
      showToast({
        message: "Announcement Published",
        description: "The announcement has been successfully published.",
        severity: "success",
        duration: 3000,
      });
    } catch (error: any) {
      showToast({
        message: "Failed to Update Announcement",
        description: error?.message,
        severity: "success",
        duration: 3000,
      });
    }
  }

  return {
    announcements,
    isLoading,
    isAnnouncementDetailLoading,
    selectedAnnouncementDetail: selectedAnnouncementResponse?.announcement || null,
    currentPage,
    filters,
    pagination,
    selectedAnnouncement,
    deleteModal,
    archiveModal,
    isDeleting,
    isUpdating,
    publishModal,
    onPublish,
    onDelete,
    setArchiveModal,
    setPublishModal,
    setDeleteModal,
    setSelectedAnnouncement,
    applyFilters,
    onArchive,
    handleSearch,
  };
}
