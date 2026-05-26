/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Box, Typography } from "@mui/material";
import { ButtonIcon } from "@/modules/shared/component/ButtonIcon";
import { useRouter } from "next/navigation";
import LeftIcon from "@/modules/shared/assets/images/chevronBack.png";
import Image from "next/image";
import { CWTextField } from "@/modules/shared/component/FormFields/CWTextField";
import { CWDropdown } from "@/modules/shared/component/FormFields/CWDropdown";
import { Button } from "@/modules/shared/component/Button";
import useManageMilestone from "./hooks/useManageMilestone";
import { gradingTypeOptions } from "./milestone.constant";
import { DataRenderer } from "@/modules/shared/component/DataRenderer";
import { FC } from "react";

interface ManageMilestoneProps {
  milestone?: any;
  isEdit?: boolean;
}

export const ManageMilestone: FC<ManageMilestoneProps> = ({ milestone, isEdit }) => {
  const router = useRouter();
  const {
    control,
    milestoneId,
    curriculumOptions,
    subjectOptions,
    onHandleSubmit,
    handleSubmit,
    isSubmitting,
  } = useManageMilestone();

  return (
    <Box className="h-full p-5 space-y-6 flex flex-col">
      <Box className="flex items-center justify-between">
        <Box className="flex items-center gap-2">
          <ButtonIcon
            className="rounded-full !border !border-brandColor-active/20 !p-2 flex items-center justify-center"
            onClick={() => router.back()}
          >
            <Image src={LeftIcon || "/placeholder.svg"} alt="back" />
          </ButtonIcon>
          <Typography className="!text-xl !font-semibold !text-text-primary">
            {milestoneId ? "Edit Milestone" : "Add Milestone"}
          </Typography>
        </Box>
        <Box className="flex gap-2">
          <Button
            loading={isSubmitting}
            className="!rounded-lg !px-8 !bg-brandColor-active"
            onClick={handleSubmit(onHandleSubmit)}
          >
            {milestoneId ? "Save" : "Add"}
          </Button>
        </Box>
      </Box>

      <DataRenderer isLoading={false}>
        {() => (
          <Box className="bg-white rounded-2xl px-4 flex flex-col flex-1 overflow-y-scroll">
            <Box className="py-4 border-b border-border-lightGray flex flex-col">
              <Typography className="!font-bold !text-lg !text-primary-dark">
                Milestone Details
              </Typography>
              <Typography className="!font-normal !text-sm !text-text-gray">
                {milestoneId
                  ? "Update milestone information."
                  : "Basic information about the milestone."}
              </Typography>
            </Box>

            <Box className="border-b border-border-lightGray py-4 flex flex-col gap-4">
              <CWTextField
                control={control}
                name="milestoneName"
                requiredAsterisk
                label="Milestone Name*"
                placeholder="Enter milestone name"
                labelOnTop
                labelClassName="!text-sm !font-medium !text-input-gray"
                inputClasses="mt-1 !text-sm !h-10 !text-input-gray"
                className="w-full"
              />

              <Box className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CWDropdown
                  name="curriculum"
                  control={control}
                  options={curriculumOptions}
                  isForm
                  requiredAsterisk
                  textFieldProps={{
                    label: "Curriculum*",
                    labelClassName: "!text-sm !font-medium !text-input-gray",
                    placeholder: "Select curriculum",
                    inputClasses: "mt-1 !text-sm !h-10 !text-input-gray",
                    labelOnTop: true,
                    className: "!w-full",
                  }}
                  dialogBodyClassName="!p-0"
                  maxDialogWidth={100}
                />
                <CWDropdown
                  name="subject"
                  control={control}
                  options={subjectOptions}
                  isForm
                  requiredAsterisk
                  textFieldProps={{
                    label: "Subject*",
                    labelClassName: "!text-sm !font-medium !text-input-gray",
                    placeholder: "Select subject",
                    inputClasses: "mt-1 !text-sm !h-10 !text-input-gray",
                    labelOnTop: true,
                    className: "!w-full",
                  }}
                  dialogBodyClassName="!p-0"
                  maxDialogWidth={100}
                />
              </Box>

              <CWDropdown
                name="gradingType"
                control={control}
                options={gradingTypeOptions}
                isForm
                requiredAsterisk
                textFieldProps={{
                  label: "Grading Type*",
                  labelClassName: "!text-sm !font-medium !text-input-gray",
                  placeholder: "Select grading type",
                  inputClasses: "mt-1 !text-sm !h-10 !text-input-gray",
                  labelOnTop: true,
                  className: "!w-full",
                }}
                dialogBodyClassName="!p-0"
                maxDialogWidth={100}
              />

             
            </Box>
          </Box>
        )}
      </DataRenderer>
    </Box>
  );
};

export default ManageMilestone;
