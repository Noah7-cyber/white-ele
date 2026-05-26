/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Table } from "@/modules/shared/component/Table";
import { useEffect, useMemo, useState } from "react";
import { Box, Typography } from "@mui/material";
import Drawer from "@mui/material/Drawer";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { PaginationControls } from "@/modules/shared/component/Pagination";
import AnnouncementRowActions from "@/modules/admin/component/AnnouncementRowActions";
import ConfirmModal from "@/components/ConfirmModal/confirmModal";
import TrashIcon from "@/modules/shared/assets/svgs/trashicon.svg";
import { useAnnouncementsPageComponent } from "./hooks/useAnnouncementsPageComponent";
import { dateFormatter } from "@/utils/helpers";
import { DataRenderer } from "../DataRenderer";
import { Button } from "@/modules/shared/component/Button";
import LeftIcon from "@/modules/shared/assets/images/chevronBack.png";
import PlusIcon from "@/modules/shared/assets/svgs/plus-icon.svg";
import { useRouter } from "next/navigation";
import { SearchTextfield } from "@/modules/shared/component/SearchTextfield";
import { DashboardRoutes } from "@/routes/dashboard.routes";
import { ButtonIcon } from "../ButtonIcon";
import Image from "next/image";
import { serializeAnnouncementContent } from "@/utils/announcementContent";
import { useMediaQuery } from "@/utils/hooks/useMediaQuery";
import FilterIcon from "@/modules/shared/assets/svgs/filter.svg";
import { MobileFilterDrawer } from "../MobileFilterDrawer/MobileFilterDrawer";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { getRelativeTime } from "@/utils/helper";

export interface Announcement {
  id: number | string;
  title: string;
  subject: string;
  createdBy: string;
  datePublished: string;
  views: string;
  announcementStatus: "published" | "archived" | "draft";
}

const headers = ["Title", "Created by", "Date Published", "Views", "Status", "Action"];

interface AnnouncementPageComponentProps {
  role: "admin" | "staff" | "parent";
  initialAnnouncementId?: string;
  singleAnnouncementView?: boolean;
}
function AnnouncementsPageComponent({
  role,
  initialAnnouncementId,
  singleAnnouncementView = false,
}: AnnouncementPageComponentProps) {
  const router = useRouter();
  const {
    currentPage,
    publishModal,
    announcements,
    isUpdating,
    selectedAnnouncement,
    selectedAnnouncementDetail,
    isAnnouncementDetailLoading,
    isLoading,
    filters,
    pagination,
    deleteModal,
    archiveModal,
    isDeleting,
    onDelete,
    setArchiveModal,
    onPublish,
    setDeleteModal,
    setPublishModal,
    onArchive,
    setSelectedAnnouncement,
    applyFilters,
    handleSearch,
  } = useAnnouncementsPageComponent(role, initialAnnouncementId);

  const isMobile = useMediaQuery("(max-width:768px)");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [mobileAnnouncementActions, setMobileAnnouncementActions] = useState<any | null>(null);
  const [statusSelection, setStatusSelection] = useState(String(filters?.announcementStatus || ""));
  const canFilterByDraft = role === "admin";

  const filteredAnnouncements = useMemo(
    () =>
      role === "admin"
        ? announcements
        : announcements?.filter(
            (announcement: any) =>
              String(announcement?.announcementStatus || "").toLowerCase() === "published",
          ) || [],
    [announcements, role],
  );

  // Auto-select the first announcement for staff/parent views
  useEffect(() => {
    if (
      (role === "staff" || role === "parent") &&
      !selectedAnnouncement &&
      filteredAnnouncements?.length
    ) {
      setSelectedAnnouncement(filteredAnnouncements[0]);
    }
  }, [role, filteredAnnouncements, selectedAnnouncement, setSelectedAnnouncement]);

  useEffect(() => {
    if (!initialAnnouncementId || !announcements?.length) return;
    const matchedAnnouncement = announcements.find(
      (announcement: any) => String(announcement?.id) === String(initialAnnouncementId),
    );

    if (matchedAnnouncement && selectedAnnouncement?.id !== matchedAnnouncement?.id) {
      setSelectedAnnouncement(matchedAnnouncement);
    }
  }, [announcements, initialAnnouncementId, selectedAnnouncement?.id, setSelectedAnnouncement]);

  useEffect(() => {
    setStatusSelection(String(filters?.announcementStatus || ""));
  }, [filters?.announcementStatus]);

  const getStatusBadge = (status: string) => {
    const base = "px-4 py-[3px] text-xs font-medium rounded-full text-center";
    switch (status.toLowerCase()) {
      case "published":
        return <span className={`${base} bg-green-100 text-green-700`}>Published</span>;
      case "archived":
        return <span className={`${base} bg-blue-100 text-blue-600`}>Archived</span>;
      case "draft":
        return <span className={`${base} bg-red-100 text-red-600`}>Draft</span>;
      default:
        return status;
    }
  };

  const renderRowActions = (announcement: Announcement) => {
    return (
      <AnnouncementRowActions
        status={announcement?.announcementStatus}
        onView={() => {
          router.push(`${DashboardRoutes.announcement}/${announcement?.id}`);
        }}
        onEdit={() => {
          // router.push(`/admin/communication/announcement/${announcement.id}/edit`);
        }}
        onPublish={() => {
          setSelectedAnnouncement(announcement);
          setPublishModal(true);
        }}
        onRestore={() => {
          setSelectedAnnouncement(announcement);
          setArchiveModal(true);
        }}
        onArchive={() => {
          setSelectedAnnouncement(announcement);
          setArchiveModal(true);
        }}
        onDelete={() => {
          setSelectedAnnouncement(announcement);
          setDeleteModal(true);
        }}
      />
    );
  };

  const rows = announcements?.map((announcement: any) => ({
    0: announcement?.subject,
    1: announcement?.creator
      ? `${announcement?.creator?.firstName || ""} ${announcement?.creator?.lastName || ""}`
      : "N/A",
    2: dateFormatter(announcement?.createdAt),
    3: `${announcement?.viewCount || 0} ${announcement?.viewCount > 1 ? "Views" : "View"}` || "N/A",
    4: getStatusBadge(announcement?.announcementStatus),
    5: renderRowActions(announcement),
  }));

  const applyStatusFilter = () => {
    applyFilters({
      announcementStatus: statusSelection || "",
      pos: 0,
    });
    setMobileFilterOpen(false);
  };

  const resetStatusFilter = () => {
    setStatusSelection("");
    applyFilters({ search: "", announcementStatus: "", pos: 0 });
    setMobileFilterOpen(false);
  };

  // Admin retains the table + actions view (cards on mobile)
  if (role === "admin") {
    const closeAnnouncementActions = () => setMobileAnnouncementActions(null);

    const openActionFor = (announcement: any) => {
      setSelectedAnnouncement(announcement);
      setMobileAnnouncementActions(announcement);
    };

    const handleDuplicate = (announcement: any) => {
      closeAnnouncementActions();
      router.push(`${DashboardRoutes.createAnnouncement}?duplicate=${announcement?.id}`);
    };

    const adminSharedModals = (
      <>
        <ConfirmModal
          open={archiveModal}
          onClose={() => setArchiveModal(false)}
          onConfirm={onArchive}
          icon={<TrashIcon />}
          loading={isUpdating}
          title={
            selectedAnnouncement?.announcementStatus === "archived"
              ? "Restore Announcement?"
              : "Archive Announcement?"
          }
          description="You can restore this announcement anytime from the archived section."
          confirmLabel={
            selectedAnnouncement?.announcementStatus === "archived" ? "Restore" : "Archive"
          }
          cancelLabel="Cancel"
        />
        <ConfirmModal
          open={publishModal}
          onClose={() => setPublishModal(false)}
          onConfirm={onPublish}
          icon={<TrashIcon />}
          loading={isUpdating}
          title="Publish Announcement?"
          description="You can archive this announcement anytime."
          confirmLabel="Publish"
          cancelLabel="Cancel"
        />
        <ConfirmModal
          open={deleteModal}
          onClose={() => setDeleteModal(false)}
          onConfirm={onDelete}
          loading={isDeleting}
          icon={<TrashIcon />}
          title="Delete Announcement?"
          description="This action cannot be undone. Once deleted, all related data will be permanently removed."
          confirmLabel="Delete"
          cancelLabel="Cancel"
        />
        <MobileFilterDrawer
          open={mobileFilterOpen}
          onClose={() => setMobileFilterOpen(false)}
          onApply={applyStatusFilter}
          onReset={resetStatusFilter}
        >
          <div className="flex flex-col gap-3">
            <Typography className="!text-sm !font-semibold !text-[#02273A]">Status</Typography>
            <button
              type="button"
              onClick={() => setStatusSelection("published")}
              className={`w-full rounded-xl border px-3 py-2 text-left text-sm ${
                statusSelection === "published"
                  ? "border-brandColor-active bg-brandColor-active/10 text-brandColor-active"
                  : "border-gray-200 bg-white text-gray-700"
              }`}
            >
              Published
            </button>
            {canFilterByDraft && (
              <button
                type="button"
                onClick={() => setStatusSelection("draft")}
                className={`w-full rounded-xl border px-3 py-2 text-left text-sm ${
                  statusSelection === "draft"
                    ? "border-brandColor-active bg-brandColor-active/10 text-brandColor-active"
                    : "border-gray-200 bg-white text-gray-700"
                }`}
              >
                Draft
              </button>
            )}
          </div>
        </MobileFilterDrawer>
        <Drawer
          anchor="bottom"
          open={Boolean(mobileAnnouncementActions)}
          onClose={closeAnnouncementActions}
          PaperProps={{
            className: "rounded-t-2xl",
            style: { maxHeight: "70vh" },
          }}
        >
          <div className="px-6 pt-3 pb-8">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />
            <button
              type="button"
              onClick={() => {
                if (!mobileAnnouncementActions?.id) return;
                closeAnnouncementActions();
                router.push(`${DashboardRoutes.announcement}/${mobileAnnouncementActions.id}`);
              }}
              className="w-full text-left py-4 text-sm font-medium border-b border-gray-100 text-[#022F2F]"
            >
              View
            </button>
            <button
              type="button"
              onClick={() =>
                mobileAnnouncementActions && handleDuplicate(mobileAnnouncementActions)
              }
              className="w-full text-left py-4 text-sm font-medium border-b border-gray-100 text-[#022F2F]"
            >
              Duplicate
            </button>
            {mobileAnnouncementActions?.announcementStatus === "published" && (
              <button
                type="button"
                onClick={() => {
                  closeAnnouncementActions();
                  setArchiveModal(true);
                }}
                className="w-full text-left py-4 text-sm font-medium border-b border-gray-100 text-[#022F2F]"
              >
                Deactivate
              </button>
            )}
            {mobileAnnouncementActions?.announcementStatus === "draft" && (
              <button
                type="button"
                onClick={() => {
                  closeAnnouncementActions();
                  setPublishModal(true);
                }}
                className="w-full text-left py-4 text-sm font-medium border-b border-gray-100 text-[#022F2F]"
              >
                Publish
              </button>
            )}
            {mobileAnnouncementActions?.announcementStatus === "archived" && (
              <button
                type="button"
                onClick={() => {
                  closeAnnouncementActions();
                  setArchiveModal(true);
                }}
                className="w-full text-left py-4 text-sm font-medium border-b border-gray-100 text-[#022F2F]"
              >
                Restore
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                closeAnnouncementActions();
                setDeleteModal(true);
              }}
              className="w-full text-left py-4 text-sm font-medium text-red-600"
            >
              Delete
            </button>
          </div>
        </Drawer>
      </>
    );

    if (isMobile) {
      return (
        <Box className="h-full space-y-4 md:space-y-6 -mx-1 px-1 md:mx-0 md:px-0 min-h-[50vh] md:min-h-0 bg-[#eef2f6] md:bg-transparent p-3 md:p-0 rounded-xl md:rounded-none">
          <Box className="w-full">
            <SearchTextfield
              onChange={handleSearch}
              placeholder="Search..."
              isRounded
              fullWidth
              className="max-w-full"
              endIcon={
                <button
                  type="button"
                  onClick={() => setMobileFilterOpen(true)}
                  aria-label="Open filters"
                >
                  <FilterIcon className="text-gray-500" />
                </button>
              }
            />
          </Box>

          <DataRenderer isLoading={isLoading} isEmpty={!announcements?.length}>
            {() => (
              <Box className="flex flex-col gap-3 pb-4">
                {announcements?.map((announcement: any) => {
                  const creatorName = announcement?.creator
                    ? `${announcement?.creator?.firstName || ""} ${announcement?.creator?.lastName || ""}`.trim()
                    : "—";
                  const status = String(announcement?.announcementStatus || "").toLowerCase();
                  return (
                    <Box
                      key={announcement?.id}
                      className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3.5"
                    >
                      <Box className="flex items-start justify-between gap-2">
                        <Typography className="!text-sm !font-semibold !text-slate-900 line-clamp-1">
                          {creatorName}
                        </Typography>
                        <button
                          type="button"
                          className="p-1 rounded-full hover:bg-gray-100 shrink-0 -mr-1"
                          aria-label="More options"
                          onClick={() => openActionFor(announcement)}
                        >
                          <MoreHorizIcon className="text-gray-500" fontSize="small" />
                        </button>
                      </Box>
                      <Box className="flex items-start justify-between gap-2 mt-2">
                        <Typography className="!text-sm !text-slate-500 line-clamp-2 flex-1 min-w-0">
                          {announcement?.subject || "—"}
                        </Typography>
                        <Box className="shrink-0">{getStatusBadge(status)}</Box>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
          </DataRenderer>

          <Box className="flex justify-between items-center pt-2">
            <PaginationControls
              currentPage={currentPage}
              rowsPerPage={filters?.delta}
              totalItems={pagination?.count || pagination?.total || 0}
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

          {adminSharedModals}
        </Box>
      );
    }

    return (
      <Box className="h-full space-y-6">
        <Box className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <Box className="w-full md:max-w-xs transition-all duration-300">
            <SearchTextfield
              onChange={handleSearch}
              placeholder="Search by title, etc"
              isRounded={isMobile}
              fullWidth={isMobile}
              className="max-w-full"
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
          <Button
            className="rounded-full! md:rounded-lg! py-3 md:py-2 flex items-center justify-center gap-2"
            startIcon={<PlusIcon />}
            onClick={() => router.push(DashboardRoutes.createAnnouncement)}
          >
            Add Announcement
          </Button>
        </Box>
        <Box className="flex-1">
          <Table
            headers={headers}
            tableData={rows}
            isCollapse
            centeredHeaderIndex={[1, 2, 3, 4]}
            rightAlignedIndex={[5]}
            isLoading={isLoading}
          />

          <Box className="flex justify-between items-center pt-4">
            <PaginationControls
              currentPage={currentPage}
              rowsPerPage={filters?.delta}
              totalItems={pagination?.count || pagination?.total || 0}
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

        {adminSharedModals}
      </Box>
    );
  }

  const activeAnnouncement = selectedAnnouncementDetail || selectedAnnouncement;
  const announcementBasePath =
    role === "staff"
      ? "/staff/communication/announcement"
      : role === "parent"
        ? "/parent/communication/announcement"
        : "/admin/communication/announcement";

  if (singleAnnouncementView) {
    return (
      <Box className="h-full w-full bg-transparent p-4 rounded-lg border border-brandColor-active/20 space-y-6">
        <Box className="flex items-center justify-start gap-4 mb-6">
          <ButtonIcon
            className="rounded-full !border !border-brandColor-active/20 !p-1.5 flex items-center justify-center mt-0.5"
            onClick={() => {
              if (typeof window !== "undefined" && window.history.length > 1) {
                router.back();
              } else {
                router.push(announcementBasePath);
              }
            }}
          >
            <Image src={LeftIcon} alt="Back" />
          </ButtonIcon>
          <Typography className="!text-base md:!text-xl !font-semibold">
            View Announcement
          </Typography>
        </Box>
        <Box className="w-full min-h-[500px] rounded-2xl border border-brandColor-active/20 bg-white flex flex-col overflow-hidden">
          {isAnnouncementDetailLoading && (
            <Box className="p-6 text-sm text-slate-500">Loading announcement...</Box>
          )}

          {!isAnnouncementDetailLoading && !activeAnnouncement && (
            <Box className="p-6 text-sm text-slate-500">No announcement selected.</Box>
          )}

          <DataRenderer isLoading={isAnnouncementDetailLoading} isEmpty={!activeAnnouncement}>
            {() => (
              <>
                {!isAnnouncementDetailLoading && activeAnnouncement && (
                  <>
                    {activeAnnouncement?.mediaUrl && (
                      <Box className="w-full h-56 md:h-72 overflow-hidden">
                        <img
                          src={activeAnnouncement.mediaUrl}
                          alt={activeAnnouncement.subject}
                          className="w-full h-full object-cover"
                        />
                      </Box>
                    )}

                    <Box className="p-6 md:p-8 flex flex-col gap-4">
                      <Box className="space-y-2">
                        <h2 className="text-xl md:text-2xl font-semibold text-slate-900">
                          {activeAnnouncement.subject}
                        </h2>
                        <Box className="items-center gap-x-2 gap-y-1 !text-sm !text-text-tertiary/70">
                          {activeAnnouncement?.creator && (
                            <span>
                              by{" "}
                              {`${activeAnnouncement.creator.firstName || ""} ${
                                activeAnnouncement.creator.lastName || ""
                              }`.trim()}
                            </span>
                          )}
                          <Box className="flex items-center gap-x-2 mt-2">
                            {activeAnnouncement?.createdAt && (
                              <Box>
                                <span>{dateFormatter(activeAnnouncement.createdAt)}</span>
                              </Box>
                            )}
                            <span>•</span>
                            <span>
                              {(activeAnnouncement.viewCount || 0).toLocaleString()}{" "}
                              {activeAnnouncement.viewCount === 1 ? "view" : "views"}
                            </span>
                          </Box>
                        </Box>
                      </Box>

                      <Typography className="mt-2 !text-base !text-text-tertiary/80 leading-relaxed whitespace-pre-line break-words">
                        {serializeAnnouncementContent(activeAnnouncement.content)}
                      </Typography>
                    </Box>
                  </>
                )}
              </>
            )}
          </DataRenderer>
        </Box>
      </Box>
    );
  }

  if (isMobile) {
    return (
      <Box className="h-full space-y-4 rounded-xl sm:!border-none max-sm:!border-transparent max-sm:p-3 bg-white">
        <Box className="w-full">
          <SearchTextfield
            onChange={handleSearch}
            placeholder="Search announcements"
            isRounded
            fullWidth
            className="max-w-full"
            endIcon={
              <button
                type="button"
                onClick={() => setMobileFilterOpen(true)}
                aria-label="Open filters"
              >
                <FilterIcon className="text-gray-500" />
              </button>
            }
          />
        </Box>
        <DataRenderer isLoading={isLoading} isEmpty={!filteredAnnouncements?.length}>
          {() => (
            <Box className="flex flex-col gap-3 pb-4">
              {filteredAnnouncements?.map((announcement: any) => {
                const creatorName = announcement?.creator
                  ? `${announcement?.creator?.firstName || ""} ${announcement?.creator?.lastName || ""}`.trim()
                  : "—";
                const announcementContent = serializeAnnouncementContent(announcement?.content);
                const avatarUrl =
                  announcement?.creator?.profileUrl ||
                  announcement?.creator?.profilePicture ||
                  announcement?.creator?.avatar ||
                  "";
                return (
                  <button
                    key={announcement?.id}
                    type="button"
                    onClick={() => router.push(`${announcementBasePath}/${announcement?.id}`)}
                    className="text-left rounded-3xl border border-brandColor-active/20 p-3 space-y-2"
                  >
                    <Box className="flex items-start gap-3">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={creatorName}
                          className="w-10 h-10 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <Box className="w-10 h-10 rounded-full shrink-0 bg-[#D9E7EC] flex items-center justify-center text-sm font-semibold text-[#1F4E5F]">
                          {creatorName?.charAt(0)?.toUpperCase() || "A"}
                        </Box>
                      )}
                      <Box className="min-w-0 flex-1">
                        <Typography className="!text-base !font-semibold !text-[#022F2F] line-clamp-1">
                          {announcement?.subject || "—"}
                        </Typography>
                        <Typography className="!text-xs !text-[#4A616B] mt-0.5 line-clamp-1">
                          by {creatorName}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography className="!text-sm !text-[#4A616B] line-clamp-2 mt-3">
                      {announcementContent || "—"}
                    </Typography>
                    <Box className="mt-3 flex items-center justify-end gap-2 text-[#4A616B]">
                      <Typography className="!text-xs !text-[#4A616B]">
                        {announcement?.createdAt ? getRelativeTime(announcement?.createdAt) : "—"}
                      </Typography>
                      <span className="text-xs">•</span>
                      <VisibilityOutlinedIcon fontSize="small" />
                    </Box>
                  </button>
                );
              })}
            </Box>
          )}
        </DataRenderer>
        <MobileFilterDrawer
          open={mobileFilterOpen}
          onClose={() => setMobileFilterOpen(false)}
          onApply={applyStatusFilter}
          onReset={resetStatusFilter}
        >
          <div className="flex flex-col gap-3">
            <Typography className="!text-sm !font-semibold !text-[#02273A]">Status</Typography>
            <button
              type="button"
              onClick={() => setStatusSelection("published")}
              className={`w-full rounded-xl border px-3 py-2 text-left text-sm ${
                statusSelection === "published"
                  ? "border-brandColor-active bg-brandColor-active/10 text-brandColor-active"
                  : "border-gray-200 bg-white text-gray-700"
              }`}
            >
              Published
            </button>
            {canFilterByDraft && (
              <button
                type="button"
                onClick={() => setStatusSelection("draft")}
                className={`w-full rounded-xl border px-3 py-2 text-left text-sm ${
                  statusSelection === "draft"
                    ? "border-brandColor-active bg-brandColor-active/10 text-brandColor-active"
                    : "border-gray-200 bg-white text-gray-700"
                }`}
              >
                Draft
              </button>
            )}
          </div>
        </MobileFilterDrawer>
        <Box className="flex justify-between items-center pt-2">
          <PaginationControls
            currentPage={currentPage}
            rowsPerPage={filters?.delta}
            totalItems={pagination?.count || pagination?.total || 0}
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
    );
  }

  return (
    <Box className="h-full  flex flex-col lg:flex-row gap-4 sm:!bg-dashboard-bg max-sm:!border-none max-sm:!border-transparent max-sm:p-3 rounded-lg bg-white">
      {/* Left: list of announcements */}
      <Box className="flex-1 space-y-3 overflow-y-auto pr-0 lg:pr-4">
        <DataRenderer isLoading={isLoading} isEmpty={!filteredAnnouncements?.length}>
          {() => (
            <>
              {filteredAnnouncements?.map((announcement: any) => {
                const isActive = activeAnnouncement?.id === announcement?.id;
                const creatorName = announcement?.creator
                  ? `${announcement?.creator?.firstName || ""} ${announcement?.creator?.lastName || ""}`.trim()
                  : "";
                const announcementContent = serializeAnnouncementContent(announcement?.content);

                return (
                  <button
                    key={announcement?.id}
                    type="button"
                    onClick={() => setSelectedAnnouncement(announcement)}
                    className={`w-full text-left border rounded-2xl px-3.5 py-4 transition hover:shadow-sm  ${
                      isActive
                        ? " bg-brandColor-active/15 border-transparent"
                        : " bg-white border-brandColor-active/20"
                    }`}
                  >
                    <Box className="flex flex-col justify-between gap-3">
                      <Box className="flex justify-between">
                        <Box className="space-y-1 flex justify- gap-2">
                          {announcement?.mediaUrl !== "" && (
                            <img
                              src={announcement?.mediaUrl}
                              alt={announcement?.subject}
                              width={40}
                              height={40}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          )}

                          <Box className="flex flex-col">
                            <h3 className="text-sm md:text-base font-semibold text-slate-900">
                              {announcement?.subject}
                            </h3>{" "}
                            {creatorName && (
                              <span className="!text-xs !text-text-tertiary/70">
                                by {creatorName}
                              </span>
                            )}
                          </Box>
                        </Box>

                        <Box className="flex items-start justify-between">
                          <Box className="flex items-center gap-2">
                            <Typography className="!text-sm !text-text-tertiary/70">
                              {dateFormatter(announcement?.createdAt)}
                            </Typography>
                            <span className="!text-xs !text-text-tertiary/70">•</span>
                            <Box className="flex flex-col items-end justify-between !text-sm text-slate-500 m">
                              <span>
                                {(announcement?.viewCount || 0).toLocaleString()}{" "}
                                {announcement?.viewCount === 1 ? "view" : "views"}
                              </span>
                            </Box>
                          </Box>
                        </Box>
                      </Box>
                      <Typography className="mt-1 !text-sm !text-text-tertiary/70 line-clamp-2 whitespace-pre-line break-words">
                        {announcementContent}
                      </Typography>
                    </Box>
                  </button>
                );
              })}
            </>
          )}
        </DataRenderer>
      </Box>

      {/* Right: detail of selected announcement */}
      <Box className="w-full min-h-[400px] lg:w-[40%] rounded-2xl border border-brandColor-active/20 bg-white flex flex-col overflow-hidden">
        {isAnnouncementDetailLoading && (
          <Box className="p-6 text-sm text-slate-500">Loading announcement...</Box>
        )}

        {!isAnnouncementDetailLoading && !activeAnnouncement && (
          <Box className="p-6 text-sm text-slate-500">No announcement selected.</Box>
        )}
        <DataRenderer isLoading={isAnnouncementDetailLoading} isEmpty={!activeAnnouncement}>
          {() => (
            <>
              {" "}
              {!isAnnouncementDetailLoading && activeAnnouncement && (
                <>
                  {activeAnnouncement?.mediaUrl && (
                    <Box className="w-full h-40 md:h-48 overflow-hidden">
                      <img
                        src={activeAnnouncement.mediaUrl}
                        alt={activeAnnouncement.subject}
                        className="w-full h-full object-cover"
                      />
                    </Box>
                  )}

                  <Box className="p-4 flex flex-col gap-3">
                    <Box className="space-y-1">
                      <h2 className="text-sm md:text-base font-semibold text-slate-900">
                        {activeAnnouncement.subject}
                      </h2>
                      <Box className=" items-center gap-x-2 gap-y-1 !text-xs !text-text-tertiary/70">
                        {activeAnnouncement?.creator && (
                          <span>
                            by{" "}
                            {`${activeAnnouncement.creator.firstName || ""} ${
                              activeAnnouncement.creator.lastName || ""
                            }`.trim()}
                          </span>
                        )}
                        <Box className="flex items-center gap-x-2 mt-2">
                          {activeAnnouncement?.createdAt && (
                            <Box>
                              <span>{dateFormatter(activeAnnouncement.createdAt)}</span>
                            </Box>
                          )}
                          <span>•</span>
                          <span>
                            {(activeAnnouncement.viewCount || 0).toLocaleString()}{" "}
                            {activeAnnouncement.viewCount === 1 ? "view" : "views"}
                          </span>
                        </Box>
                      </Box>
                    </Box>

                    <Typography className="mt-2 flex-1 overflow-y-auto pr-1 !text-sm !text-text-tertiary/70 leading-relaxed whitespace-pre-line break-words">
                      {serializeAnnouncementContent(activeAnnouncement.content)}
                    </Typography>
                  </Box>
                </>
              )}
            </>
          )}
        </DataRenderer>
      </Box>
    </Box>
  );
}

export default AnnouncementsPageComponent;
