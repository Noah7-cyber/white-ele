import React, { FC } from "react";
import { Box, Typography, Drawer, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import CloseIcon from "@/modules/shared/assets/svgs/closeIcon.svg";
import LeftIcon from "@/modules/shared/assets/svgs/chevronLeft.svg";
import { Modal } from "../../modal";
import { ActivityForm } from "./ActivityForm";
import {
  Control,
  UseFormGetValues,
  UseFormReset,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
import { AllActivityFormData, SelectOption } from "../activities.constants";

// Define a type union for the activity identifiers (using lowercase to match form mapping)
export type ActivityType =
  | "nap"
  | "medication"
  | "meal"
  | "water"
  | "photo"
  | "video"
  | "bathroom"
  | string;

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  activityType: ActivityType;
  formControl: Control<AllActivityFormData>;
  formSetValue: UseFormSetValue<AllActivityFormData>;
  formGetValues: UseFormGetValues<AllActivityFormData>;
  formWatch: UseFormWatch<AllActivityFormData>;
  formReset: UseFormReset<AllActivityFormData>; // KEY: Discriminator to load the correct form fields
  onActivityCreated?: () => void;
  classroomOptions: SelectOption[];
  studentOptions: SelectOption[];
  isClassroomsLoading?: boolean;
  selectedClassroomId?: number | string;
}

export const ActivityModal: FC<ActivityModalProps> = ({
  isOpen,
  onClose,
  activityType,
  formControl,
  formSetValue,
  formGetValues,
  formReset,
  onActivityCreated,
  classroomOptions,
  studentOptions,
  isClassroomsLoading,
  selectedClassroomId,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Function to determine the title based on the type
  const getTitle = (type: ActivityType) => {
    switch (type) {
      case "nap":
        return "Log Nap Time";
      case "medication":
        return "Log Medication";
      case "meal":
        return "Log Meal";
      case "water":
        return "Log Water Intake";
      case "photo":
      case "video":
        return "Add Media";
      case "bathroom":
        return "Log Bathroom/Diaper ";
      default:
        return "Log Activity";
    }
  };

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
            aria-label="Close activity modal"
          >
            <LeftIcon className="text-[#0A8EA0] -ml-2" />
          </button>
          <span className="text-[16px] font-semibold text-[#0B2F2F]">{getTitle(activityType)}</span>
        </div>

        <div className="flex-1 overflow-y-auto bg-white px-5 pb-8">
          <Box className="pt-2">
            <ActivityForm
              activityType={activityType}
              onClose={onClose}
              formControl={formControl}
              formSetValue={formSetValue}
              formGetValues={formGetValues}
              formReset={formReset}
              onActivityCreated={onActivityCreated}
              classroomOptions={classroomOptions}
              studentOptions={studentOptions}
              isClassroomsLoading={isClassroomsLoading}
              selectedClassroomId={selectedClassroomId}
            />
          </Box>
        </div>
      </Drawer>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="rounded-lg p-5 w-[640px]">
      <Box className="flex flex-col gap-6">
        {/* Header Section */}
        <Box className="flex flex-row items-center justify-between pb-5 border-b border-solid border-border-light">
          <Typography className="font-bold!">{getTitle(activityType)}</Typography>
          <button aria-label="close" onClick={onClose} className="cursor-pointer">
            <CloseIcon />
          </button>
        </Box>

        {/* Content Section: The Single Form */}
        <ActivityForm
          activityType={activityType}
          onClose={onClose}
          formControl={formControl}
          formSetValue={formSetValue}
          formGetValues={formGetValues}
          formReset={formReset}
          onActivityCreated={onActivityCreated}
          classroomOptions={classroomOptions}
          studentOptions={studentOptions}
          isClassroomsLoading={isClassroomsLoading}
          selectedClassroomId={selectedClassroomId}
        />
      </Box>
    </Modal>
  );
};
