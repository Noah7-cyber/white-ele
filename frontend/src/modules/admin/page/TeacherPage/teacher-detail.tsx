"use client";

import type React from "react";
import { Box, Typography, IconButton } from "@mui/material";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/modules/shared/component/Button";
import EditIcon from "@/modules/shared/assets/svgs/editIcon.svg";
import EllipsesIcon from "@/modules/shared/assets/svgs/ellipses.svg";
import LeftIcon from "@/modules/shared/assets/images/chevronBack.png";
import Image from "next/image";
import { DashboardRoutes } from "@/routes/dashboard.routes";
import ConfirmModal from "@/components/ConfirmModal/confirmModal";
import WarnIcon from "@/modules/shared/assets/svgs/warnIcon.svg";
import TrashIcon from "@/modules/shared/assets/svgs/trashicon.svg";
import { useTeacherDetail } from "./hooks/useTeacherDetail";
import InitialsAvatar from "@/modules/shared/component/InitialsAvatar/InitialsAvatar";
import { useMediaQuery } from "@/utils/hooks/useMediaQuery";
import { CustomModal } from "@/modules/shared/component/CustomModal";
import { useState } from "react";

export const TeacherDetail: React.FC = () => {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const isMobile = useMediaQuery("(max-width: 767px)");
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);

  const {
    teacher,
    isLoading,
    isError,
    deactivateModalOpen,
    setDeactivateModalOpen,
    deleteModalOpen,
    setDeleteModalOpen,
    handleDeactivate,
    handleDelete,
  } = useTeacherDetail(id as string);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-10">
        <p className="text-gray-500 text-sm">Loading teacher details...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-full p-10">
        <p className="text-red-500 text-sm">Failed to load teacher details.</p>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="flex items-center justify-center h-full p-10">
        <p className="text-gray-500 text-sm">Teacher not found</p>
      </div>
    );
  }

  const fullName = `${teacher.firstName} ${teacher.lastName}`;

  const actionItems = [
    {
      label: "Edit Profile",
      onClick: () => {
        setIsActionSheetOpen(false);
        router.push(`${DashboardRoutes.teachers}/${id}/edit`);
      },
    },
    {
      label: "Deactivate",
      onClick: () => {
        setIsActionSheetOpen(false);
        setDeactivateModalOpen(true);
      },
    },
    {
      label: "Delete",
      onClick: () => {
        setIsActionSheetOpen(false);
        setDeleteModalOpen(true);
      },
      danger: true,
    },
  ];

  /* Shared info row helper */
  const InfoRow = ({ label, value }: { label: string; value?: string | null }) => (
    <Box className="flex justify-between items-start py-3 border-b border-gray-50 last:border-b-0">
      <Typography className="!text-xs !text-gray-500">{label}</Typography>
      <Typography className="!font-semibold !text-sm text-right max-w-[60%] break-words">
        {value || "N/A"}
      </Typography>
    </Box>
  );

  /* General Information content */
  const GeneralInfoContent = () => (
    <>
      {isMobile && (
        <Box className="flex items-center gap-3 p-3 rounded-lg bg-[#F9FAFB] mb-4">
          <InitialsAvatar
            src={teacher?.photoUrl}
            name={fullName}
            alt={teacher?.firstName}
            className="w-12 h-12"
            initialsClassName="text-xs"
          />
          <Box>
            <Typography className="!text-sm !font-semibold">{fullName}</Typography>
            <Typography className="!text-xs !text-gray-500">
              {teacher.assignedClassroom || "No classroom"} &middot; {teacher.role || "Teacher"}
            </Typography>
          </Box>
        </Box>
      )}

      {isMobile ? (
        <Box className="flex flex-col">
          <InfoRow label="Email Address" value={teacher.email} />
          <InfoRow label="Phone Number" value={teacher.phone} />
          <InfoRow label="Assigned Classroom" value={teacher.assignedClassroom} />
          <InfoRow label="Address" value={teacher?.address} />
          <InfoRow label="Start Date" value={teacher.startDate} />
          <InfoRow label="Qualification" value={teacher.qualification} />
          <InfoRow label="Role" value={teacher.role} />
        </Box>
      ) : (
        <Box className="grid grid-cols-2 h-full gap-6 py-4">
          <Box className="grid grid-rows-7 space-y-7 h-full ">
            <Box>
              <Typography className="!text-xs !text-gray-500 ">Email Address</Typography>
            </Box>
            <Box>
              <Typography className="!text-xs !text-gray-500 ">Phone Number</Typography>
            </Box>
            <Box>
              <Typography className="!text-xs !text-gray-500 ">Assigned Classroom</Typography>
            </Box>
            <Box>
              <Typography className="!text-xs !text-gray-500 ">Address</Typography>
            </Box>
            <Box>
              <Typography className="!text-xs !text-gray-500 ">Start Date</Typography>
            </Box>
            <Box>
              <Typography className="!text-xs !text-gray-500 ">Qualification</Typography>
            </Box>
            <Box>
              <Typography className="!text-xs !text-gray-500 ">Role</Typography>
            </Box>
          </Box>
          <Box className="grid grid-rows-7 h-full  ">
            <Box className="overflow-x-auto truncate">
              <Typography className="!font-semibold !text-sm overflow-x-auto ">
                {teacher.email}
              </Typography>
            </Box>
            <Box className="overflow-x-auto ">
              <Typography className="!font-semibold !text-sm overflow-x-auto ">
                {teacher.phone}
              </Typography>
            </Box>
            <Box>
              <Typography className="!font-semibold !text-sm overflow-x-auto ">
                {teacher.assignedClassroom || "N/A"}
              </Typography>
            </Box>
            <Box>
              <Typography className="!font-semibold !text-sm">{teacher?.address}</Typography>
            </Box>
            <Box>
              <Typography className="!font-semibold !text-sm">{teacher.startDate}</Typography>
            </Box>
            <Box>
              <Typography className="!font-semibold !text-sm">{teacher.qualification}</Typography>
            </Box>
            <Box>
              <Typography className="!font-semibold !text-sm">{teacher.role}</Typography>
            </Box>
          </Box>
        </Box>
      )}
    </>
  );

  /* Emergency Contact content */
  const emergencyData = teacher.emergencyContact;
  const EmergencyContactContent = () => (
    <>
      {isMobile ? (
        <Box className="flex flex-col">
          <InfoRow label="Name" value={emergencyData?.contactName} />
          <InfoRow label="Phone Number" value={emergencyData?.phone} />
          <InfoRow label="Email Address" value={emergencyData?.email} />
          <InfoRow label="Relationship" value={emergencyData?.relationship} />
          <InfoRow label="Address" value={emergencyData?.address} />
        </Box>
      ) : (
        <Box className="grid grid-cols-2 h-full gap-0 py-4">
          <Box className="grid grid-rows-7 space-y-6 h-full">
            <Box>
              <Typography className="!text-xs !text-gray-500 ">Name</Typography>
            </Box>
            <Box>
              <Typography className="!text-xs !text-gray-500 ">Phone Number</Typography>
            </Box>
            <Box>
              <Typography className="!text-xs !text-gray-500 ">Email Address</Typography>
            </Box>
            <Box>
              <Typography className="!text-xs !text-gray-500 ">Relationship</Typography>
            </Box>
            <Box>
              <Typography className="!text-xs !text-gray-500 ">Address</Typography>
            </Box>
          </Box>
          <Box className="grid grid-rows-7 h-full">
            <Box>
              <Typography className="!font-semibold !text-sm">
                {emergencyData?.contactName || "N/A"}
              </Typography>
            </Box>
            <Box>
              <Typography className="!font-semibold !text-sm">
                {emergencyData?.phone || "N/A"}
              </Typography>
            </Box>
            <Box>
              <Typography className="!font-semibold !text-sm">
                {emergencyData?.email || "N/A"}
              </Typography>
            </Box>
            <Box>
              <Typography className="!font-semibold !text-sm">
                {emergencyData?.relationship || "N/A"}
              </Typography>
            </Box>
            <Box>
              <Typography className="!font-semibold !text-sm">
                {emergencyData?.address || "N/A"}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
    </>
  );

  return (
    <Box className="h-full p-0 md:p-5 space-y-4 md:space-y-6">
      {/* HEADER */}
      <Box className="flex items-center justify-between md:px-0 md:py-0 px-4 py-2 bg-white md:bg-transparent">
        <Box className="flex items-center gap-3">
          <IconButton
            onClick={() => router.back()}
            className="rounded-full !border !border-brandColor-active/20 !p- flex items-center justify-center"
          >
            <Image src={LeftIcon || "/placeholder.svg"} alt="back" width={20} height={20} />
          </IconButton>

          {/* Desktop: avatar + name */}
          <Box className="hidden md:flex items-center gap-3">
            <InitialsAvatar
              src={teacher?.photoUrl}
              name={fullName}
              alt={teacher?.firstName}
              className="w-10 h-10"
              initialsClassName="text-[10px]"
            />
            <Box>
              <Typography className="!text-xl !font-semibold">{fullName}</Typography>
            </Box>
          </Box>

          {/* Mobile: name only */}
          <Typography className="md:hidden !text-lg !font-semibold">{fullName}</Typography>
        </Box>

        {/* Desktop: Edit Profile button */}
        <Button
          onClick={() => router.push(`${DashboardRoutes.teachers}/${id}/edit`)}
          className="!rounded-lg !px-4 hidden! md:flex!"
          startIcon={<EditIcon />}
        >
          Edit Profile
        </Button>

        {/* Mobile: ellipsis menu button */}
        <button
          className="md:hidden p-2"
          onClick={() => setIsActionSheetOpen(true)}
          aria-label="Open teacher actions"
        >
          <EllipsesIcon />
        </button>
      </Box>

      {/* Vertical stacked cards on mobile, side-by-side on desktop */}
      <Box className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 md:p-0 p-4">
        <Box className="bg-white px-4 md:px-5 pb-6 py-4 space-y-6 h-full border border-brandColor-active/20 rounded-xl">
          <Typography className="!text-lg !font-bold pb-4 !text-primary-dark mb-4 border-b border-border-lightGray">
            General Information
          </Typography>
          <GeneralInfoContent />
        </Box>

        <Box className="bg-white px-4 md:px-5 pb-6 py-4 space-y-6 h-full border border-brandColor-active/20 rounded-xl">
          <Typography className="!text-lg !font-bold pb-4 !text-primary-dark mb-4 border-b border-border-lightGray">
            Emergency Contact
          </Typography>
          <EmergencyContactContent />
        </Box>
      </Box>

      {/* Mobile Action Sheet */}
      <CustomModal
        isOpen={isActionSheetOpen}
        onClose={() => setIsActionSheetOpen(false)}
        className="!p-0"
        width="100%"
        radius="16px 16px 0 0"
        maxHeight="70vh"
        modalStyle={isMobile ? { alignItems: "flex-end", justifyContent: "center" } : undefined}
        contentStyle={isMobile ? { bottom: 0, left: 0, transform: "none" } : undefined}
      >
        <div className="px-5 py-4">
          <div className="flex flex-col gap-2">
            {actionItems.map((item) => (
              <button
                key={item.label}
                onClick={item.onClick}
                className={`w-full text-left p-5 rounded-lg text-sm hover:bg-bg-color ${
                  item.danger ? "text-red-600" : "text-gray-900"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </CustomModal>

      <ConfirmModal
        open={deactivateModalOpen}
        onClose={() => setDeactivateModalOpen(false)}
        onConfirm={handleDeactivate}
        icon={<WarnIcon />}
        title="Are you sure you want to deactivate this teacher?"
        description="You will be able to reactivate this teacher later."
        confirmLabel="Deactivate"
        cancelLabel="Cancel"
      />

      <ConfirmModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        icon={<TrashIcon />}
        title="Are you sure you want to delete this teacher?"
        description="This action cannot be undone. Once deleted, all related data will be permanently removed."
        confirmLabel="Delete"
        cancelLabel="Cancel"
      />
    </Box>
  );
};

export default TeacherDetail;
