/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { InsightCard } from "@/components/InsightCard";
import FilterPopover from "@/modules/shared/component/FilterPopover/filterPopover";
import { PaginationControls } from "@/modules/shared/component/Pagination";
import { Table } from "@/modules/shared/component/Table";
import { Dropdown } from "@/modules/shared/component/Dropdown";
import { MobileFilterDrawer } from "@/modules/shared/component/MobileFilterDrawer";
import { Typography } from "@mui/material";
import { Box } from "@mui/system";
import ExpandMoreIcon from "@/modules/shared/assets/svgs/downIcon.svg";
import { useParents } from "./hooks/useParents";
import ParentRowActions from "../../component/ParentRowActions";
import { useRouter } from "next/navigation";
import TrashIcon from "@/modules/shared/assets/svgs/trashicon.svg";
import ConfirmModal from "@/components/ConfirmModal/confirmModal";
import { SearchTextfield } from "@/modules/shared/component/SearchTextfield";
import WarnIcon from "@/modules/shared/assets/svgs/warnIcon.svg";
import InitialsAvatar from "@/modules/shared/component/InitialsAvatar/InitialsAvatar";
import FilterIcon from "@/modules/shared/assets/svgs/filter.svg";
import {
  MobileChildrenCard,
  MobileChildrenCardSkeleton,
} from "@/modules/shared/component/ChildrenPageComponent/MobileChildrenCard";

export const Parents = () => {
  const router = useRouter();
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const {
    classRoomAnchorEl,
    statusAnchorEl,
    selectedClassRoomFilter,
    selectedClassRoomLabel,
    selectedStatusFilter,
    selectedStatusLabel,
    classRoomOptions,
    statusOptions,
    isLoading,
    parentsList,
    setSelectedClassRoomFilter,
    setSelectedStatusFilter,
    setClassRoomAnchorEl,
    setStatusAnchorEl,
    handleOpenClassRoomFilter,
    handleOpenStatusFilter,
    deleteAccount,
    isPending,
    setDeleteAccount,
    handleDelete,
    statusAccount,
    setStatusAccount,
    handleToggleStatus,
    handleResendInvite,
    isStatusPending,
    metadata,
    totalItems,
    currentPage,
    rowsPerPage,
    handlePageChange,
    getStatusConfig,
    fetchMoreClassRoom,
    hasMoreClassRoom,
    handleSearch,
    hasPermission,
  } = useParents();

  const tableHeaders = ["Name", "Email", "Phone Number", "No. of Children", "Status", "Action"];

  const handleRowClick = (_rowData: unknown, rowIndex: number) => {
    const parent = parentsList?.[rowIndex];
    if (parent?.id != null) router.push(`/admin/parents/${parent.id}`);
  };

  const renderRowActions = (item: any) => {
    const isActive = String(item?.status || "").toLowerCase() === "active";
    return (
      <ParentRowActions
        onView={() => {
          router.push(`/admin/parents/${item?.id}`);
        }}
        resendInvite={
          hasPermission("parent", "create")
            ? () => {
                handleResendInvite(item?.id);
              }
            : undefined
        }
        onToggleStatus={
          hasPermission("parent", "update")
            ? () => {
                setStatusAccount(item);
              }
            : undefined
        }
        toggleStatusLabel={isActive ? "Deactivate" : "Activate"}
        onDelete={
          hasPermission("parent", "delete")
            ? () => {
                setDeleteAccount(item);
              }
            : undefined
        }
      />
    );
  };

  const StatusCell = ({ status }: { status: string }) => {
    const { chip } = getStatusConfig(status);

    return (
      <Box
        className={`flex items-center justify-center gap-2 px-2 py-1 rounded-full min-w-[80px] w-1/2 ${chip}`}
      >
        <span className="text-xs! font-normal! capitalize ">{status}</span>
      </Box>
    );
  };

  const rows = parentsList?.map((parent: any) => ({
    0: (
      <div className="flex gap-2 items-center">
        <InitialsAvatar
          src={parent?.photoUrl || ""}
          name={`${parent?.user?.firstName || ""} ${parent?.user?.lastName || ""}`.trim()}
          className="w-10 h-10"
          initialsClassName="text-[10px]"
        />
        <Typography className="text-dark! text-[13px]! text-table-text! font-medium!">
          {`${parent?.user?.firstName}
     ${parent?.user?.lastName}`}
        </Typography>
      </div>
    ),
    1: parent?.user?.email || "N/A",
    2: parent?.user?.phone || "N/A",
    3: parent?.childrenCount || "N/A",
    4: (
      <div className="flex items-center justify-center">
        <StatusCell status={parent?.status} />
      </div>
    ),
    5: renderRowActions(parent),
  }));

  return (
    <Box className="space-y-6 flex flex-col h-full p-5">
      <Box className="w-full md:flex hidden items-center justify-between">
        <Typography className="font-semibold! text-xl! text-text-primary!">Parents</Typography>
      </Box>

      <div className="flex md:grid md:grid-cols-3 gap-4 overflow-x-auto md:overflow-x-visible hide-scrollbar min-h-35 *:shrink-0 md:*:shrink">
        <InsightCard
          name="Total Parents"
          className="h-20 md:h-35 min-w-52  md:min-w-0  border! border-[#00808033]! rounded-lg! shrink-0"
          titleClassName="!text-[#002C51] !font-medium !text-base leading-6 tracking-normal"
          valueClassName="!text-2xl !font-bold !text-gray-900"
          value={metadata?.totalParents || 0}
        />
        <InsightCard
          name="Multi-Child Parents"
          className="h-20 md:h-35 min-w-52  md:min-w-0  border! border-[#00808033]! rounded-lg! shrink-0"
          titleClassName="!text-[#002C51] !font-medium !text-base leading-6 tracking-normal"
          valueClassName="!text-2xl !font-bold !text-gray-900"
          value={metadata?.multiChildParents || 0}
        />
        <InsightCard
          name="Active Parents"
          className="h-20 md:h-35 min-w-52  md:min-w-0  border! border-[#00808033]! rounded-lg! shrink-0"
          titleClassName="!text-[#002C51] !font-medium !text-base leading-6 tracking-normal"
          valueClassName="!text-2xl !font-bold !text-gray-900"
          value={metadata?.activeParents || 0}
        />
      </div>
      <Box className="w-full flex items-center justify-between gap-4">
        <SearchTextfield
          onChange={handleSearch}
          placeholder="Search by name, email, etc"
          endIcon={
            <button
              className="md:hidden"
              onClick={() => setMobileFilterOpen(true)}
              aria-label="Open filters"
            >
              <FilterIcon className="text-gray-500" />
            </button>
          }
          isRounded
          fullWidth
          className="max-w-full md:w-96 md:max-w-112.5 bg-white rounded-full"
        />

        <Box className="gap-3 hidden md:flex">
          <button
            onClick={handleOpenStatusFilter}
            className="flex items-center justify-around px-2 h-10 w-36 text-gray-700 rounded-lg cursor-pointer border border-gray-200"
          >
            <span className="text-sm font-medium">{selectedStatusLabel}</span>
            <ExpandMoreIcon className="" />
          </button>
          <FilterPopover
            open={Boolean(statusAnchorEl)}
            anchorEl={statusAnchorEl}
            onClose={() => setStatusAnchorEl(null)}
            options={statusOptions}
            onSelect={(value) => {
              setSelectedStatusFilter(value);
            }}
            width={140}
          />
          <button
            onClick={handleOpenClassRoomFilter}
            className="flex items-center justify-around px-2 h-10 w-36 text-gray-700 rounded-lg cursor-pointer border border-gray-200"
          >
            <span className="text-sm font-medium">{selectedClassRoomLabel}</span>
            <ExpandMoreIcon className="" />
          </button>
          <FilterPopover
            open={Boolean(classRoomAnchorEl)}
            anchorEl={classRoomAnchorEl}
            onClose={() => setClassRoomAnchorEl(null)}
            options={classRoomOptions}
            onSelect={(value) => {
              setSelectedClassRoomFilter(value);
            }}
            onScrollEnd={fetchMoreClassRoom}
            width={150}
          />
        </Box>
      </Box>

      <div className="md:hidden flex flex-col gap-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <MobileChildrenCardSkeleton key={i} />)
          : parentsList.map((parent: any) => (
            <MobileChildrenCard
              key={parent.id}
              id={parent.id}
              name={`${parent?.user?.firstName || ""} ${parent?.user?.lastName || ""}`.trim()}
              photoUrl={parent?.photoUrl || ""}
              age={
                `${parent?.childrenCount ?? 0} ${parent?.childrenCount === 1 ? "Child" : "Children"}` ||
                "N/A"
              }
              status={parent?.status || "N/A"}
              onClick={() => router.push(`/admin/parents/${parent.id}`)}
            />
          ))}

        {!!parentsList?.length && <PaginationControls
          currentPage={currentPage}
          rowsPerPage={rowsPerPage}
          totalItems={totalItems ?? 0}
          onPageChange={handlePageChange}
          isCondense
          bottomTableClasses="!text-xs"
        />}
      </div>

      <div className="hidden md:flex flex-col flex-1">
        <Table
          headers={tableHeaders}
          tableData={rows}
          onRowClick={handleRowClick}
          preventRowClickColumnIndex={5}
          headerRowClassName="!bg-[#F9FAFB] !border-b !border-[#E4E7EC] !text-sm"
          headerCellClassName="!text-dark !font-medium"
          bodyCellClassName="!text-dark !text-base !font-medium !text-center !text- align-middle !py-4"
          bodyRowClassName="border-b border-[#E4E7EC] last:border-0"
          tableContainerClassName="!border !border-[#E4E7EC] !rounded-lg !overflow-hidden !bg-white"
          isCollapse={true}
          isCondense={true}
          isLoading={isLoading}
          centeredHeaderIndex={[1, 2, 3, 4, 5, 6]}
        />

        <Box
          className="flex justify-center pt-4"
          sx={{
            opacity: totalItems === 0 ? 0.6 : 1,
            pointerEvents: totalItems === 0 ? "none" : "auto",
          }}
        >
          <PaginationControls
            currentPage={currentPage}
            rowsPerPage={rowsPerPage}
            totalItems={totalItems ?? 0}
            onPageChange={handlePageChange}
            isCondense
            bottomTableClasses="!text-xs"
          />
        </Box>
      </div>
      <MobileFilterDrawer
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        onApply={() => setMobileFilterOpen(false)}
        onReset={() => {
          setSelectedStatusFilter("all");
          setSelectedClassRoomFilter("");
          setMobileFilterOpen(false);
        }}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Typography className="!text-sm !font-medium !text-[#02273A]">Status</Typography>
            <Dropdown
              isForm
              options={statusOptions.map((option) => ({
                value: option.value,
                name: option.label,
              }))}
              value={selectedStatusFilter}
              onSelect={(value) => setSelectedStatusFilter(value as string)}
              textFieldProps={{ placeholder: "Select status", isRounded: true }}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Typography className="!text-sm !font-medium !text-[#02273A]">Classroom</Typography>
            <Dropdown
              isForm
              options={classRoomOptions.map((option) => ({
                value: option.value,
                name: option.label,
              }))}
              value={selectedClassRoomFilter}
              onSelect={(value) => setSelectedClassRoomFilter(value as string)}
              textFieldProps={{ placeholder: "Select classroom", isRounded: true }}
              hasMore={Boolean(hasMoreClassRoom)}
              onLoadMore={fetchMoreClassRoom}
            />
          </div>
        </div>
      </MobileFilterDrawer>
      <ConfirmModal
        open={!!statusAccount}
        onClose={() => setStatusAccount(null)}
        onConfirm={handleToggleStatus}
        icon={<WarnIcon />}
        title={
          String(statusAccount?.status || "").toLowerCase() === "active"
            ? "Are you sure you want to deactivate this parent?"
            : "Are you sure you want to activate this parent?"
        }
        description={
          String(statusAccount?.status || "").toLowerCase() === "active"
            ? "You will be able to reactivate this parent later."
            : "This parent will be able to access the platform again."
        }
        confirmLabel={
          String(statusAccount?.status || "").toLowerCase() === "active" ? "Deactivate" : "Activate"
        }
        cancelLabel="Cancel"
        loading={isStatusPending}
      />
      <ConfirmModal
        open={!!deleteAccount}
        onClose={() => setDeleteAccount(null)}
        onConfirm={handleDelete}
        icon={<TrashIcon />}
        title="Are you sure you want to delete this parent?"
        description="This action cannot be undone. Once deleted, all related data will be permanently removed."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        loading={isPending}
      />
    </Box>
  );
};
