"use client";

import { Box, Typography } from "@mui/material";
import React, { useState, useMemo } from "react";
import { Button } from "@/modules/shared/component/Button";
import { Table } from "@/modules/shared/component/Table";
import { PaginationControls } from "@/modules/shared/component/Pagination";
import { InviteUserModal } from "./InviteUserModal";
import { EditAdminUserModal } from "./EditAdminUserModal";
import { UserRowActions } from "./UserRowActions";
import {
  buildSchoolAdminUsers,
  getAssignedRoleDisplayName,
  getInvitationStatus,
  type SchoolAdminUser,
  type StatusType,
} from "./dashboardPermissionSetting.utils";
import { useSchoolRoleOptions } from "./hooks/useSchoolRoleOptions";
import ConfirmModal from "@/components/ConfirmModal/confirmModal";
import TrashIcon from "@/modules/shared/assets/svgs/trashicon.svg";
import WarnIcon from "@/modules/shared/assets/svgs/warnIcon.svg";

import {
  useInvitations,
  useResendInvitation,
  useDeleteInvitation,
  useSchoolAdmins,
} from "./hooks/useInviteUser";

const StatusBadge = ({ status }: { status: StatusType }) => {
  const isActive = status === "Active";
  const isExpired = status === "Expired";
  return (
    <Box
      className={`flex items-center justify-center py-1 rounded-full text-xs font-normal ${
        isActive
          ? "bg-green-100 text-green-700"
          : isExpired
            ? "bg-gray-200 text-gray-700"
            : "bg-badge-red/10 text-badge-red"
      }`}
    >
      {status}
    </Box>
  );
};

export const DashboardPermissionSetting = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [selectedUser, setSelectedUser] = useState<SchoolAdminUser | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [resendModalOpen, setResendModalOpen] = useState(false);
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const { getRoleName } = useSchoolRoleOptions();
  const { data: invitationsData, isLoading: isLoadingInvitations } = useInvitations();
  const { data: schoolData, isLoading: isLoadingSchool } = useSchoolAdmins();
  const { resendInvitation, isResending } = useResendInvitation();
  const { deleteInvitation, isDeleting } = useDeleteInvitation();

  const isLoading = isLoadingInvitations || isLoadingSchool;

  const adminUsers = useMemo(
    () =>
      buildSchoolAdminUsers(
        invitationsData?.invitations ?? [],
        schoolData?.admins ?? [],
      ),
    [invitationsData?.invitations, schoolData?.admins],
  );

  const handleInvite = () => {
    setIsModalOpen(false);
  };

  const handleEdit = (user: SchoolAdminUser) => {
    setSelectedUser(user);
    setEditModalOpen(true);
  };

  const handleDeactivate = (user: SchoolAdminUser) => {
    setSelectedUser(user);
    setDeactivateModalOpen(true);
  };

  const handleDelete = (user: SchoolAdminUser) => {
    setSelectedUser(user);
    setDeleteModalOpen(true);
  };

  const handleResendInvite = (user: SchoolAdminUser) => {
    setSelectedUser(user);
    setResendModalOpen(true);
  };

  const confirmDeactivate = () => {
    if (selectedUser) {
      setDeactivateModalOpen(false);
      setSelectedUser(null);
    }
  };

  const confirmDelete = async () => {
    if (selectedUser && selectedUser.id > 0) {
      await deleteInvitation({ invitationId: selectedUser.id });
      setDeleteModalOpen(false);
      setSelectedUser(null);
    }
  };

  const confirmResend = async () => {
    if (selectedUser && selectedUser.id > 0) {
      await resendInvitation({ invitationId: selectedUser.id });
      setResendModalOpen(false);
      setSelectedUser(null);
    }
  };

  const handlePageChange = ({
    page,
    rowsPerPage: newRowsPerPage,
  }: {
    page: number;
    rowsPerPage: number;
  }) => {
    setCurrentPage(page);
    if (newRowsPerPage !== rowsPerPage) {
      setRowsPerPage(newRowsPerPage);
      setCurrentPage(1);
    }
  };

  const paginatedUsers = useMemo(() => {
    return adminUsers.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  }, [adminUsers, currentPage, rowsPerPage]);

  const tableHeaders = ["Name", "Email", "Role", "Date Added", "Status", "Action"];

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const tableData = paginatedUsers.map((user: SchoolAdminUser) => {
    const status = getInvitationStatus(user);
    const isActive = status === "Active";
    const hasInvitationRecord = user.id > 0;
    const roleLabel = getAssignedRoleDisplayName(user, getRoleName);

    return {
      0: (
        <Typography className="text-dark! text-[13px]! text-table-text! font-medium!">
          {user.firstName || "N/A"} {user.lastName || ""}
        </Typography>
      ),
      1: (
        <Typography className="text-dark! text-[13px]! text-table-text! font-medium!">
          {user.email}
        </Typography>
      ),
      2: (
        <Typography className="text-dark! text-[13px]! text-table-text! font-medium!">
          {roleLabel}
        </Typography>
      ),
      3: (
        <Typography className="text-dark! text-[13px]! text-table-text! font-medium!">
          {formatDate(user.createdAt)}
        </Typography>
      ),
      4: <StatusBadge status={status} />,
      5: (
        <UserRowActions
          onEdit={() => handleEdit(user)}
          onDeactivate={isActive ? () => handleDeactivate(user) : undefined}
          onResendInvite={
            !isActive && hasInvitationRecord ? () => handleResendInvite(user) : undefined
          }
          onDelete={hasInvitationRecord ? () => handleDelete(user) : undefined}
        />
      ),
    };
  });

  return (
    <Box className="rounded-lg bg-white flex flex-col gap-5 p-4 sm:p-5">
      <Box className="flex flex-col gap-1 border-b border-solid border-border-lightGray pb-4">
        <Box className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Box className="flex flex-col gap-1">
            <Typography className="font-bold! text-black!">Admin Users</Typography>
            <Typography className="text-xs! text-text-tertiary/70!">
              Manage admin users and their access permissions.
            </Typography>
          </Box>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="rounded-lg! px-4! py-3! bg-[#008080]! text-white! flex items-center justify-center gap-2! !w-full sm:!w-fit"
          >
            <span className="text-lg">+</span>
            <span>Invite User</span>
          </Button>
        </Box>
      </Box>

      <Box className="flex-1">
        <Box className="hidden md:block">
          <Table
            headers={tableHeaders}
            tableData={tableData}
            isLoading={isLoading}
            tableClassName="text-sm"
            tableContainerClassName="border border-gray-200"
            centeredHeaderIndex={[1, 2, 3, 4, 5]}
          />
        </Box>

        <Box className="flex flex-col gap-3 md:hidden">
          {paginatedUsers.map((user: SchoolAdminUser) => {
            const status = getInvitationStatus(user);
            const isActive = status === "Active";
            const hasInvitationRecord = user.id > 0;
            const roleLabel = getAssignedRoleDisplayName(user, getRoleName);

            return (
              <Box
                key={`${user.id}-${user.email}`}
                className="rounded-2xl border border-border-lightGray bg-white px-4 py-4"
              >
                <Box className="flex items-start justify-between gap-3">
                  <Box className="flex min-w-0 flex-col gap-1">
                    <Typography className="text-lg! font-semibold! text-[#022F2F]!">
                      {user.firstName || "N/A"} {user.lastName || ""}
                    </Typography>
                    <Typography className="text-sm! text-[#475467]!">
                      {roleLabel}
                    </Typography>
                  </Box>
                  <UserRowActions
                    onEdit={() => handleEdit(user)}
                    onDeactivate={isActive ? () => handleDeactivate(user) : undefined}
                    onResendInvite={
                      !isActive && hasInvitationRecord ? () => handleResendInvite(user) : undefined
                    }
                    onDelete={hasInvitationRecord ? () => handleDelete(user) : undefined}
                  />
                </Box>

                <Box className="mt-4 flex items-center justify-between gap-3">
                  <Typography className="min-w-0 truncate text-sm! text-[#667085]!">
                    {user.email}
                  </Typography>
                  <Box className="min-w-[84px]">
                    <StatusBadge status={status} />
                  </Box>
                </Box>
              </Box>
            );
          })}

          {!isLoading && paginatedUsers.length === 0 && (
            <Box className="rounded-2xl border border-border-lightGray bg-white px-4 py-8 text-center">
              <Typography className="text-sm! text-[#667085]!">No admin users to show.</Typography>
            </Box>
          )}
        </Box>

        <Box className="flex justify-center pt-4">
          <PaginationControls
            currentPage={currentPage}
            rowsPerPage={rowsPerPage}
            totalItems={adminUsers.length}
            onPageChange={handlePageChange}
            isCondense
            bottomTableClasses="!text-xs"
          />
        </Box>
      </Box>

      <InviteUserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onInvite={handleInvite}
      />

      <EditAdminUserModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedUser(null);
        }}
        invitation={selectedUser}
        status={selectedUser ? getInvitationStatus(selectedUser) : "Inactive"}
        onSaved={handleInvite}
      />

      <ConfirmModal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedUser(null);
        }}
        onConfirm={confirmDelete}
        icon={<TrashIcon />}
        title="Are you sure you want to delete this invitation?"
        description="This action cannot be undone. The invitation will be removed and the user will no longer be able to accept it."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        loading={isDeleting}
      />

      <ConfirmModal
        open={resendModalOpen}
        onClose={() => {
          setResendModalOpen(false);
          setSelectedUser(null);
        }}
        onConfirm={confirmResend}
        icon={<WarnIcon />}
        title="Resend invitation?"
        description="A new invitation email will be sent to this user. The previous invitation link will no longer work."
        confirmLabel="Resend"
        cancelLabel="Cancel"
        loading={isResending}
      />

      <ConfirmModal
        open={deactivateModalOpen}
        onClose={() => {
          setDeactivateModalOpen(false);
          setSelectedUser(null);
        }}
        onConfirm={confirmDeactivate}
        icon={<WarnIcon />}
        title="Are you sure you want to deactivate this?"
        description="You will be signed out of you account and redirected to the login page."
        confirmLabel="Deactivate"
        cancelLabel="Cancel"
      />
    </Box>
  );
};
