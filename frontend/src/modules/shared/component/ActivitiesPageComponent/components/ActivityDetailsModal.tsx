"use client";

import React, { FC, useMemo } from "react";
import { Box, Typography, IconButton, Drawer, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import CloseIcon from "@/modules/shared/assets/svgs/closeIcon.svg";
import { Modal } from "@/modules/shared/component/modal";
import { useActivityDetails } from "../hooks/useActivityDetails";
import CalendarIcon from "@/modules/shared/assets/svgs/calendarOutline.svg";
import ClockIcon from "@/modules/shared/assets/svgs/time.svg";
import StopwatchIcon from "@/modules/shared/assets/svgs/stop-watch.svg";
import UserIconSvg from "@/modules/shared/assets/svgs/groupUser.svg";
import LocationIcon from "@/modules/shared/assets/svgs/locationIcon.svg";
import HashtagIcon from "@/modules/shared/assets/svgs/hashIcon.svg";
import NotesIcon from "@/modules/shared/assets/svgs/notesIcon.svg";
import { CircularProgress } from "@mui/material";
import UserIcon from "@/modules/shared/assets/svgs/user.svg";
import { renderActivityIcon } from "../ActivitiesPageComponent";
import InitialsAvatar from "@/modules/shared/component/InitialsAvatar/InitialsAvatar";
import LeftIcon from "@/modules/shared/assets/svgs/chevronLeft.svg";

const VIDEO_FILE_EXTENSIONS = [".mp4", ".webm", ".ogg", ".mov", ".avi", ".mkv", ".3gp", ".3g2"];

interface ActivityDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activityId: number | null;
  /** When provided (e.g. parent context), only show students whose id is in this list */
  parentChildrenIds?: number[];
}

const getActivityTitle = (
  activityType: string,
  mealType?: string | null,
  bathroomType?: string | null,
) => {
  switch (activityType) {
    case "meal":
      return mealType
        ? `${mealType.charAt(0).toUpperCase() + mealType.slice(1)} Time`
        : "Meal Time";
    case "water":
      return "Water Intake";
    case "medication":
      return "Medication";
    case "bathroom":
      return bathroomType
        ? `Bathroom • ${bathroomType === "diaper_change" ? "Diaper Change" : bathroomType.charAt(0).toUpperCase() + bathroomType.slice(1)}`
        : "Bathroom Break";
    case "nap":
      return "Nap Time";
    case "photo":
      return "Media Activity";
    default:
      return `${activityType.charAt(0).toUpperCase() + activityType.slice(1)} Activity`;
  }
};

const isVideoUrl = (url?: string | null) => {
  if (!url) return false;
  const normalizedUrl = url.toLowerCase().split("?")[0];
  return VIDEO_FILE_EXTENSIONS.some((extension) => normalizedUrl.endsWith(extension));
};

const getActivityDescription = (activity: {
  notes?: string | null;
  foodItem?: string | null;
  medicationName?: string | null;
  dosage?: string | null;
  bathroomType?: string | null;
}) => {
  if (activity.notes) {
    return activity.notes;
  }
  if (activity.foodItem) {
    return `Food Item: ${activity.foodItem}`;
  }
  if (activity.medicationName) {
    return `Dosage: ${activity.dosage ?? "N/A"}`;
  }
  if (activity.bathroomType) {
    return `Bathroom type: ${activity.bathroomType}`;
  }
  return "No additional notes provided.";
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return date.toLocaleDateString("en-US", options);
};

const formatTime = (timeString: string | Date | null) => {
  if (!timeString) return "—";
  const timeStr = typeof timeString === "string" ? timeString : timeString.toString();
  // If time is in HH:mm format, convert to 12-hour format
  const [hours, minutes] = timeStr.split(":");
  const hour = parseInt(hours, 10);
  if (isNaN(hour)) return timeStr;
  const ampm = hour >= 12 ? "pm" : "am";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

/** Format ISO date string (e.g. from createdAt) to time like "10:58 PM" */
const formatCreatedAtTime = (isoString: string | null | undefined) => {
  if (!isoString) return "—";
  try {
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "—";
  }
};

const calculateDuration = (startTime: string | null, endTime: string | null) => {
  if (!startTime || !endTime) return null;

  const [startHours, startMinutes] = startTime.split(":").map(Number);
  const [endHours, endMinutes] = endTime.split(":").map(Number);

  const startTotalMinutes = startHours * 60 + startMinutes;
  const endTotalMinutes = endHours * 60 + endMinutes;

  const diffMinutes = endTotalMinutes - startTotalMinutes;

  if (diffMinutes < 60) {
    return `${diffMinutes} minutes`;
  }

  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes} minutes`;
};

export const ActivityDetailsModal: FC<ActivityDetailsModalProps> = ({
  isOpen,
  onClose,
  activityId,
  parentChildrenIds,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { activityData, isLoading } = useActivityDetails(activityId);

  const duration = useMemo(() => {
    if (!activityData) return null;
    return calculateDuration(activityData?.startTime || null, activityData?.endTime || null);
  }, [activityData]);

  const students = useMemo(() => {
    if (!activityData?.students || !Array.isArray(activityData?.students)) return [];
    const list = activityData?.students;
    if (parentChildrenIds && parentChildrenIds.length > 0) {
      const idSet = new Set(parentChildrenIds);
      return list.filter((s: { id: number }) => idSet.has(s.id));
    }
    return list;
  }, [activityData, parentChildrenIds]);

  const timeValue = activityData
    ? activityData?.startTime && activityData?.endTime
      ? `${formatTime(activityData?.startTime)} - ${formatTime(activityData?.endTime)}`
      : activityData?.timeGiven
        ? formatTime(activityData?.timeGiven)
        : activityData?.startTime
          ? formatTime(activityData?.startTime)
          : activityData?.activityType === "photo" && activityData?.createdAt
            ? formatCreatedAtTime(activityData?.createdAt)
            : "—"
    : "—";

  const loggerRole = activityData
    ? activityData?.creator?.role === "admin"
      ? "Admin"
      : activityData?.creator?.role === "staff"
        ? "Teacher"
        : activityData?.creator?.role || "Staff"
    : "—";

  if (!isOpen) return null;

  if (isMobile) {
    return (
      <Drawer
        anchor="right"
        open={isOpen}
        onClose={onClose}
        PaperProps={{
          className: "w-full flex flex-col",
          style: { maxWidth: "100vw" },
        }}
      >
        <div className="flex items-center gap-3 px-5 py-5 bg-white">
          <button
            onClick={onClose}
            className="w-8 min-w-8 h-8 rounded-full bg-[#EEF7F8] flex items-center justify-center shrink-0"
            aria-label="Close activity details"
          >
            <LeftIcon className="text-[#0A8EA0] -ml-2" />
          </button>
          <span className="text-[16px] font-semibold text-[#0B2F2F]">
            {getActivityTitle(
              activityData?.activityType || "",
              activityData?.mealType,
              activityData?.bathroomType,
            )}
          </span>
        </div>
        {isLoading ? (
          <Box className="flex flex-1 items-center justify-center py-12">
            <CircularProgress />
          </Box>
        ) : !activityData ? (
          <Box className="flex flex-1 items-center justify-center py-12">
            <Typography className="text-gray-500">Activity not found</Typography>
          </Box>
        ) : (
          <div className="flex-1 overflow-y-auto bg-white px-5 pb-8">
            <div className="flex gap-2 pt-2">
              <Box className="px-3 py-1 rounded-full bg-[#F2F4F7] text-primary-text-light text-xs font-normal">
                {activityData?.activityType}
              </Box>
              {activityData?.classroom?.name && (
                <Box className="px-3 py-1 rounded-full bg-[#F2F4F7] text-primary-text-light text-xs font-normal">
                  {activityData?.classroom.name}
                </Box>
              )}
            </div>

            <Typography className="!mt-7 !text-[15px] !leading-7 !text-[#334E58]">
              {getActivityDescription(activityData)}
            </Typography>

            <hr className="border-border-light my-6" />

            {students.length > 0 && (
              <>
                <Box className="flex flex-col gap-3">
                  <Box className="flex items-center gap-2">
                    <UserIconSvg />
                    <Typography className="text-sm! font-normal! text-textColor!">
                      Child Involved ({students.length})
                    </Typography>
                  </Box>
                  <Box className="flex flex-wrap items-center gap-2">
                    {students.map((student) => (
                      <Box
                        key={student.id}
                        className="flex items-center gap-2 bg-[#F2F4F7] pr-4 pl-1.5 py-1 rounded-full"
                      >
                        <InitialsAvatar
                          src={student.photoUrl}
                          name={student.name}
                          className=" !bg-transparent"
                          initialsClassName="!text-[10px] !font-normal rounded-full !text-primary-text-light"
                        />
                        <Typography className="text-xs! font-normal! text-primary-text-light!">
                          {student.name}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
                <hr className="border-border-light my-6" />
              </>
            )}

            <Box className="grid grid-cols-2 gap-x-8 gap-y-6">
              <Box className="flex items-start gap-3">
                <CalendarIcon />
                <Box>
                  <Typography className="text-sm! font-normal! text-textColor! mb-1!">
                    Date
                  </Typography>
                  <Typography className="text-sm! text-primary-text-light! font-normal!">
                    {activityData?.createdAt
                      ? new Date(activityData?.createdAt).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "—"}
                  </Typography>
                </Box>
              </Box>
              <Box className="flex items-start gap-3">
                <ClockIcon />
                <Box>
                  <Typography className="text-sm! font-normal! text-textColor! mb-1!">
                    Time
                  </Typography>
                  <Typography className="text-sm! text-primary-text-light! font-normal!">
                    {timeValue}
                  </Typography>
                </Box>
              </Box>

              {duration !== null && (
                <Box className="flex items-start gap-3">
                  <StopwatchIcon />
                  <Box>
                    <Typography className="text-sm! font-normal! text-textColor! mb-1!">
                      Duration
                    </Typography>
                    <Typography className="text-sm! text-primary-text-light! font-normal!">
                      {duration}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>

            <hr className="border-border-light my-6" />

            <Box className="grid grid-cols-2 gap-x-8 gap-y-6">
              <Box className="flex items-start gap-3">
                <HashtagIcon />
                <Box>
                  <Typography className="text-sm! font-normal! text-textColor! mb-1!">
                    Activity ID
                  </Typography>
                  <Typography className="text-sm! text-primary-text-light! font-normal!">
                    #{String(activityData?.id).padStart(4, "0")}
                  </Typography>
                </Box>
              </Box>
              {activityData?.classroom?.name && (
                <Box className="flex items-start gap-3">
                  <LocationIcon />
                  <Box>
                    <Typography className="text-sm! font-normal! text-textColor! mb-1!">
                      Classroom
                    </Typography>
                    <Typography className="text-sm! text-primary-text-light! font-normal!">
                      {activityData?.classroom.name}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>

            <hr className="border-border-light my-6" />

            <Box className="flex flex-col gap-3 mb-6">
              <Box className="flex items-center gap-2">
                <UserIcon />
                <Typography className="text-sm! font-normal! text-textColor!">Logged by</Typography>
              </Box>
              <Box className="bg-[#F8F9FA] p-4 rounded-xl flex items-center gap-3">
                <InitialsAvatar
                  src={activityData?.creator?.profileUrl}
                  name={activityData?.creator?.name || ""}
                  className=" !bg-transparent"
                  initialsClassName="!text-sm !font-medium rounded-full !text-[#B42318]"
                />
                <Box>
                  <Typography className="text-sm! mb-1! text-textColor! font-normal!">
                    {activityData?.creator?.name ||
                      `Creator #${activityData?.creator?.id ?? "Unknown"}`}
                  </Typography>
                  <Typography className="text-sm! text-primary-text-light! font-normal!">
                    {loggerRole}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <hr className="border-border-light my-6" />

            <Box className="flex flex-col gap-3">
              <Box className="flex items-center gap-2">
                <NotesIcon />
                <Typography className="text-sm! font-normal! text-textColor!">
                  Notes & Observations
                </Typography>
              </Box>
              <Box className="bg-[#F8F9FA] p-5 rounded-xl">
                <Typography className="text-sm! text-primary-text-light! font-normal! leading-relaxed!">
                  {activityData?.notes || "No additional notes provided."}
                </Typography>
              </Box>
            </Box>
          </div>
        )}
      </Drawer>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="rounded-lg p-6 w-[580px] max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden"
    >
      {isLoading ? (
        <Box className="flex items-center justify-center py-12">
          <CircularProgress />
        </Box>
      ) : !activityData ? (
        <Box className="flex items-center justify-center py-12">
          <Typography className="text-gray-500">Activity not found</Typography>
        </Box>
      ) : (
        <Box className="flex flex-col">
          {/* Header */}
          <Box className="flex items-start justify-between mb-2">
            <Box className="flex items-center gap-4">
              <Box className="bg-header-gray p-4 rounded-2xl flex items-center justify-center border border-[#F2F4F7] w-16 h-16">
                <Box className="scale-125">{renderActivityIcon(activityData?.activityType)}</Box>
              </Box>
              <Box>
                <Typography className="text-lg! font-semibold! text-[#101828]! mb-1!">
                  {getActivityTitle(
                    activityData?.activityType,
                    activityData?.mealType,
                    activityData?.bathroomType,
                  )}
                </Typography>
                <Box className="flex gap-2">
                  <Box className="px-3 py-1 rounded-full bg-[#F2F4F7] text-primary-text-light text-xs font-normal">
                    {activityData?.activityType}
                  </Box>
                  {activityData?.classroom?.name && (
                    <Box className="px-3 py-1 rounded-full bg-[#F2F4F7] text-primary-text-light text-xs font-normal">
                      {activityData?.classroom.name}
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
            <IconButton
              onClick={onClose}
              size="small"
              className="p-1! hover:bg-[#F2F4F7]!"
              aria-label="Close"
            >
              <CloseIcon className="w-5 h-5 text-primary-text-light!" />
            </IconButton>
          </Box>

          {/* Activity Description */}
          <Box className="mb-6 ml-1">
            <Typography className="text-sm! text-primary-text-light! font-normal!">
              {getActivityDescription(activityData)}
            </Typography>
          </Box>

          {/* Medication: Dosage & Time given (for parents/guardians) */}
          {activityData?.activityType === "medication" &&
            (activityData?.medicationName || activityData?.dosage || activityData?.timeGiven) && (
              <Box className="mb-6 p-4 rounded-xl bg-[#F8F9FA] border border-[#EAECF0]">
                <Typography className="text-sm! font-medium! text-[#101828]! mb-3!">
                  Medication details
                </Typography>
                <Box className="grid grid-cols-2 gap-4">
                  {activityData?.medicationName && (
                    <Box>
                      <Typography className="text-xs! text-primary-text-light! mb-0.5!">
                        Medication
                      </Typography>
                      <Typography className="text-sm! text-[#101828]! font-normal!">
                        {activityData?.medicationName}
                      </Typography>
                    </Box>
                  )}
                  {activityData?.dosage != null && activityData?.dosage !== "" && (
                    <Box>
                      <Typography className="text-xs! text-primary-text-light! mb-0.5!">
                        Dosage
                      </Typography>
                      <Typography className="text-sm! text-[#101828]! font-normal!">
                        {activityData?.dosage}
                      </Typography>
                    </Box>
                  )}
                  {activityData?.timeGiven != null && activityData?.timeGiven !== "" && (
                    <Box>
                      <Typography className="text-xs! text-primary-text-light! mb-0.5!">
                        Time given
                      </Typography>
                      <Typography className="text-sm! text-[#101828]! font-normal!">
                        {formatTime(activityData?.timeGiven)}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            )}

          <hr className="border-border-light mb-6" />

          {/* Child Involved */}
          {students.length > 0 && (
            <Box className="flex flex-col gap-3 mb-6">
              <Box className="flex items-center gap-2">
                <UserIconSvg />
                <Typography className="text-sm! font-normal! text-textColor!">
                  Child Involved ({students.length})
                </Typography>
              </Box>
              <Box className="flex flex-wrap items-center gap-2 ml-7">
                {students.map((student) => (
                  <Box
                    key={student.id}
                    className="flex items-center gap-2 bg-[#F2F4F7] pr-4 pl-1.5 py-1 rounded-full"
                  >
                    <InitialsAvatar
                      src={student.photoUrl}
                      name={student.name}
                      className="w-7 h-7 !bg-[#E4E7EC]"
                      initialsClassName="!text-[10px] !font-normal !text-primary-text-light"
                    />
                    <Typography className="text-xs! font-normal! text-primary-text-light!">
                      {student.name}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          <hr className="border-border-light mb-6" />

          {/* Date & Time */}
          <Box className="grid grid-cols-2 gap-8 mb-6">
            <Box className="flex items-start gap-4">
              <Box className="mt-0.5">
                <CalendarIcon />
              </Box>
              <Box className="flex flex-1 flex-col">
                <Typography className="text-sm! font-normal! text-textColor! mb-1.5!">
                  Date
                </Typography>
                <Typography className="text-sm! text-primary-text-light! font-normal!">
                  {activityData?.createdAt ? formatDate(activityData?.createdAt) : "—"}
                </Typography>
              </Box>
            </Box>
            <Box className="flex items-start gap-4">
              <Box className="mt-0.5">
                <ClockIcon />
              </Box>
              <Box className="flex flex-1 flex-col">
                <Typography className="text-sm! font-normal! text-textColor! mb-1.5!">
                  Time
                </Typography>
                <Typography className="text-sm! text-primary-text-light! font-normal!">
                  {timeValue}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Duration */}
          {duration !== null && (
            <Box className="flex items-start gap-4 mb-6">
              <Box className="mt-0.5">
                <StopwatchIcon />
              </Box>
              <Box className="flex flex-1 flex-col">
                <Typography className="text-sm! font-normal! text-textColor! mb-1.5!">
                  Duration
                </Typography>
                <Typography className="text-sm! text-primary-text-light! font-normal!">
                  {duration}
                </Typography>
              </Box>
            </Box>
          )}

          <hr className="border-border-light mb-6" />

          {/* Activity ID & Classroom */}
          <Box className="grid grid-cols-2 gap-8 mb-6">
            <Box className="flex items-start gap-4">
              <Box className="mt-0.5">
                <HashtagIcon />
              </Box>
              <Box className="flex flex-1 flex-col">
                <Typography className="text-sm! font-normal! text-textColor! mb-1.5!">
                  Activity ID
                </Typography>
                <Typography className="text-sm! text-primary-text-light! font-normal!">
                  #{String(activityData?.id).padStart(4, "0")}
                </Typography>
              </Box>
            </Box>
            {activityData?.classroom?.name && (
              <Box className="flex items-start gap-4">
                <Box className="mt-0.5">
                  <LocationIcon />
                </Box>
                <Box className="flex flex-1 flex-col">
                  <Typography className="text-sm! font-normal! text-textColor! mb-1.5!">
                    Classroom
                  </Typography>
                  <Typography className="text-sm! text-primary-text-light! font-normal!">
                    {activityData?.classroom?.name}
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>

          <hr className="border-border-light mb-6" />
          {/* Media: Attached image/video & Time created */}
          {(activityData?.activityType === "photo" || activityData?.activityType === "video") && (
            <Box className="mb-6 p-4 rounded-xl bg-[#F8F9FA] border border-[#EAECF0]">
              <Typography className="text-sm! font-medium! text-[#101828]! mb-3!">Media</Typography>
              {activityData?.photoUrl ? (
                <Box className="flex flex-col gap-3">
                  <Box className="rounded-lg overflow-hidden border border-[#E4E7EC] bg-[#F2F4F7] flex items-center justify-center min-h-[200px] max-h-[220px]">
                    {isVideoUrl(activityData?.photoUrl) ? (
                      <video
                        src={activityData?.photoUrl}
                        controls
                        className="max-w-full max-h-[220px] w-auto h-auto object-contain"
                      />
                    ) : (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={activityData?.photoUrl}
                          alt="Activity media"
                          className="max-w-full max-h-[220px] w-auto h-auto object-contain"
                        />
                      </>
                    )}
                  </Box>
                </Box>
              ) : (
                <Typography className="text-sm! text-primary-text-light!">
                  No media attached. Time created: {formatCreatedAtTime(activityData?.createdAt)}
                  {activityData?.createdAt && ` (${formatDate(activityData?.createdAt)})`}.
                </Typography>
              )}
            </Box>
          )}
          {/* Logged by */}
          <Box className="flex flex-col gap-3 mb-6">
            <Box className="flex items-center gap-2">
              <UserIcon />
              <Typography className="text-sm! font-normal! text-textColor!">Logged by</Typography>
            </Box>
            <Box className="bg-[#F8F9FA] p-4 rounded-xl flex items-center gap-3 ">
              <InitialsAvatar
                src={activityData?.creator?.profileUrl}
                name={activityData?.creator?.name || ""}
                className="!bg-transarent"
                initialsClassName="!text-sm !font-medium rounded-full !text-[#B42318]"
              />
              <Box>
                <Typography className="text-sm! mb-1! text-textColor! font-normal!">
                  {activityData?.creator?.name ||
                    `Creator #${activityData?.creator?.id ?? "Unknown"}`}
                </Typography>
                <Typography className="text-sm! text-primary-text-light! font-normal!">
                  {loggerRole}
                </Typography>
              </Box>
            </Box>
          </Box>

          <hr className="border-border-light mb-6" />

          {/* Notes & Observations */}
          <Box className="flex flex-col gap-3">
            <Box className="flex items-center gap-2">
              <NotesIcon />
              <Typography className="text-sm! font-normal! text-textColor!">
                Notes & Observations
              </Typography>
            </Box>
            <Box className="bg-[#F8F9FA] p-5 rounded-md">
              <Typography className="text-sm! text-primary-text-light! font-normal! leading-relaxed!">
                {activityData?.notes || "No additional notes provided."}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
    </Modal>
  );
};
