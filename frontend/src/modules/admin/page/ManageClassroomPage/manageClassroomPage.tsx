/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Box, Typography } from "@mui/material";
import { Button } from "@/modules/shared/component/Button";
import { useRouter } from "next/navigation";
import { ButtonIcon } from "@/modules/shared/component/ButtonIcon";
import { CWTextField } from "@/modules/shared/component/FormFields/CWTextField";
import { CWTextArea } from "@/modules/shared/component/FormFields/CWTextArea";
import { ageOptions } from "../ClassroomPage/classroomOptions";
import LeftIcon from "@/modules/shared/assets/images/chevronBack.png";
import Image from "next/image";

import { FC } from "react";
import useManageClassroomPage from "./hooks/useManageClassroomPage";
import { CWDropdown } from "@/modules/shared/component/FormFields/CWDropdown";
import { DropdownOption } from "@/modules/shared/component/Dropdown";
import { DataRenderer } from "@/modules/shared/component/DataRenderer";
import { useMediaQuery } from "@/utils/hooks/useMediaQuery";
interface ManageClassroomModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onCompleteCreation?: () => void;
  isEdit?: boolean;
  classroom?: any;
}

export const ManageClassroomPage: FC<ManageClassroomModalProps> = ({ classroom }) => {
  const {
    control,
    classroomId,
    setValue,
    onHandleSubmit,
    staffOptions,
    isCreatingClassroom,
    isUpdatingClassroom,
    isPending,
    assignedStaff,
    minAge,
    setMinAge,
    maxAge,
    setMaxAge,
  } = useManageClassroomPage({
    classroom,
  });
  const router = useRouter();
  const isMobile = useMediaQuery("(max-width:768px)");
  const saveLabel =
    classroomId
      ? isUpdatingClassroom
        ? "Saving..."
        : "Save"
      : isCreatingClassroom
        ? "Saving..."
        : "Save";

  return (
    <Box className={`${isMobile ? "h-full flex flex-col bg-white" : "h-full p-5 space-y-6"}`}>
      <Box
        className={`flex items-center justify-between ${isMobile ? "py-4 border-b border-border-input px-5" : ""}`}
      >
        <Box className="flex items-center gap-3">
          <ButtonIcon
            className="rounded-full !border !border-brandColor-active/20 flex items-center justify-center"
            onClick={() => router.back()}
          >
            <Image src={LeftIcon} alt="" />
          </ButtonIcon>
          <Typography className="!text-xl !font-semibold !text-text-primary">
            {classroomId ? "Edit Classroom" : "Add Classroom"}
          </Typography>
        </Box>
        {!isMobile && (
          <Button
            className="hidden md:inline-flex !rounded-lg !px-8"
            onClick={onHandleSubmit}
            disabled={isCreatingClassroom || isUpdatingClassroom || isPending}
          >
            {saveLabel}
          </Button>
        )}
      </Box>
      <Box className={`${isMobile ? "flex-1 overflow-y-auto px-5 py-4" : ""}`}>
        <DataRenderer isLoading={isPending}>
          {() => (
            <Box
              className={`bg-white rounded-2xl border !border-border-table space-y-5 max-w-8xl ${isMobile ? "p-4" : "p-6"}`}
            >
            <Box className="flex flex-col gap-2">
              <CWTextField
                requiredAsterisk
                control={control}
                name="classroomName"
                label="Classroom Name"
                placeholder="Enter class room name"
                labelOnTop
                labelClassName="!text-sm !font-medium !text-input-gray"
                inputClasses="mt-1 !text-sm !h-10 !text-input-gray"
                className="w-full"
                // isRounded={isMobile}
              />
            </Box>
            <Box className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <Box className="flex flex-col gap-2">
                <CWDropdown
                  requiredAsterisk
                  name="minimumAge"
                  control={control}
                  options={ageOptions}
                  isForm
                  value={minAge}
                  onChangeValue={(value) => setMinAge(value as number)}
                  textFieldProps={{
                    label: "Minimum Age",
                    labelClassName: "!text-sm !font-medium !text-input-gray",
                    placeholder: "Select minimum age",
                    inputClasses: "mt-1 !text-sm !h-10 !text-input-gray",
                    labelOnTop: true,
                    className: "!w-full",
                    // isRounded: isMobile,
                  }}
                />
              </Box>
              <Box className="flex flex-col gap-2">
                <CWDropdown
                  requiredAsterisk
                  name="maximumAge"
                  control={control}
                  options={ageOptions.filter((age) => parseInt(age, 10) >= (Number(minAge) ?? 0))}
                  isForm
                  value={maxAge}
                  onChangeValue={(value) => setMaxAge(value as number)}
                  textFieldProps={{
                    label: "Maximum Age",
                    labelClassName: "!text-sm !font-medium !text-input-gray",
                    placeholder: "Select maximum age",
                    inputClasses: "mt-1 !text-sm !h-10 !text-input-gray",
                    labelOnTop: true,
                    className: "!w-full",
                    // isRounded: isMobile,
                  }}
                />
              </Box>
              <CWTextField
                requiredAsterisk
                control={control}
                name="maximumCapacity"
                label="Maximum Capacity"
                placeholder="Enter maximum capacity"
                labelOnTop
                labelClassName="!text-sm !font-medium !text-input-gray"
                inputClasses="mt-1 !text-sm !h-10 !text-input-gray"
                className="w-full"
                // isRounded={isMobile}
              />
            </Box>

            <Box className="grid grid-cols-1  gap-4 mt-4">
              <Box className="flex flex-col gap-2">
                <CWDropdown<number>
                  requiredAsterisk
                  name="assignedStaff"
                  control={control}
                  options={staffOptions as unknown as DropdownOption<number>[]} // Ensure correct type
                  isMultipleSelect
                  isForm
                  hasSearch
                  selectedValues={assignedStaff}
                  onSelectedValues={(list) => {
                    const ids = list.map((item: any) =>
                      typeof item === "number" ? item : item.value,
                    );

                    setValue("assignedStaff", ids, { shouldValidate: true });
                  }}
                  textFieldProps={{
                    label: "Assigned Staff (select more than 1 staff)",
                    labelClassName: "!text-sm !font-medium !text-input-gray",
                    placeholder: "Select assigned staff",
                    inputClasses: "mt-1 !text-sm !h-10 !text-input-gray",
                    labelOnTop: true,
                    className: "!w-full",
                    isRounded: isMobile,
                  }}
                  dialogBodyClassName="!p-2 !overflow-hidden"
                />
              </Box>
            </Box>
            <Box className="flex flex-col gap-2">
              <CWTextArea
                requiredAsterisk
                control={control}
                name="description"
                label="Notes"
                placeholder="Enter brief description..."
                labelOnTop
                labelClassName="!text-sm !font-medium !text-input-gray"
                inputClasses="mt-1 !text-xs !px-3.5 !pt-2 !pb-4 !text-input-gray placeholder:!text-input-gra"
                className="w-full"
                // isRounded={isMobile}
              />
            </Box>
            </Box>
          )}
        </DataRenderer>
      </Box>

      {isMobile && (
        <div className="flex-shrink-0 py-6 bg-white border-t border-gray-100 px-5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 py-3 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onHandleSubmit}
              disabled={isCreatingClassroom || isUpdatingClassroom || isPending}
              className="flex-1 py-3 rounded-lg bg-brandColor-active text-white text-sm font-medium hover:opacity-90 disabled:opacity-70"
            >
              {saveLabel}
            </button>
          </div>
        </div>
      )}
    </Box>
  );
};
