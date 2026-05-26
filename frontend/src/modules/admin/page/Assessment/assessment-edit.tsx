"use client";

import { Button } from "@/modules/shared/component/Button";
import { ButtonIcon } from "@/modules/shared/component/ButtonIcon";
import { Dropdown } from "@/modules/shared/component/Dropdown";
import { CWTextField } from "@/modules/shared/component/FormFields/CWTextField";
import { Box, IconButton, Typography } from "@mui/material";
import Image from "next/image";
import { useRouter } from "next/navigation";
import LeftIcon from "@/modules/shared/assets/images/chevronBack.png";

import { CWTextArea } from "@/modules/shared/component/FormFields/CWTextArea";
import CalendarIcon from "@/modules/shared/assets/svgs/calendarLinear.svg";
import useAddAssessment from "../AddAssessment/hook/useAddAssessment";

import UploadIcon from "@/modules/shared/assets/svgs/upload-icon.svg";

import {
  academicYears,
  assessmentType,
  schoolTerms,
  subjects,
  teachers,
} from "../AddAssessment/assessment.constant";
import CloseIcon from "@/modules/shared/assets/svgs/close-icon.svg";
import { showToast } from "@/modules/shared/component/Toast";

interface AssessmentEditProps {
  id?: string;
}

const AssessmentEdit: React.FC<AssessmentEditProps> = ({ id }) => {
  const router = useRouter();
  const { control } = useAddAssessment();
  const attachments = [
    { id: 1, title: "Personal Note", format: "PDF", size: "12MB" },
    { id: 2, title: "Personal Note", format: "PDF", size: "12MB" },
    { id: 3, title: "Personal Note", format: "PDF", size: "12MB" },
  ];
  return (
    <Box className="h-full p-5 pb-8 space-y-6 " data-assessment-id={id}>
      <Box className="w-full flex items-center justify-between">
        <Typography className="!font-bold !text-2xl !text-gray-900 flex items-center gap-2">
          {" "}
          <ButtonIcon
            className="rounded-full !border !border-brandColor-active/20 !p- flex items-center justify-center"
            onClick={() => router.back()}
          >
            <Image src={LeftIcon} alt="" />
          </ButtonIcon>
          <Typography className="!text-xl !font-semibold !text-text-primary">
            Edit Assessment
          </Typography>
        </Typography>
        <Box
          className="gap-2 flex"
          onClick={() =>
            showToast({
              message: "Assessment Saved",
              description: "The assessment has been successfully edited.",
              severity: "success",
              duration: 3000,
            })
          }
        >
          <Button className="!rounded-lg !px-8 !py-2  !text-sm disabled:cursor-no-drop">
            Save
          </Button>
        </Box>
      </Box>
      <Box>
        <form className="bg-white rounded-xl p-8 space-y-8 mt-7">
          <Box>
            <Box className="flex flex-col gap-3">
              <Box className="flex gap-3 w-full">
                <CWTextField
                  control={control}
                  name="title"
                  label="Assessment Title"
                  placeholder="Enter assessment title"
                  labelOnTop
                  labelClassName="!text-sm !font-medium !text-input-gray"
                  inputClasses="mt-1 !text-xs !h-10 !text-input-gray placeholder:!text-input-gray"
                  className="flex-1"
                />

                <Dropdown
                  options={subjects}
                  isForm
                  isMultipleSelect
                  textFieldProps={{
                    label: "Class (select more than 1)",
                    labelClassName: "!text-sm !font-medium !text-input-gray",
                    placeholder: "Select lesson subject",
                    inputClasses: "mt-1 !text-xs !h-10 !text-input-gray",
                    labelOnTop: true,
                    className: "!w-full",
                  }}
                  dialogBodyClassName="!p-0"
                  maxDialogWidth={100}
                />
              </Box>

              <Box className="flex w-full gap-3">
                <Dropdown
                  options={subjects}
                  title="subject"
                  isForm
                  textFieldProps={{
                    label: "Subject",
                    labelClassName: "!text-sm !font-medium !text-input-gray",
                    placeholder: "Select subject",
                    inputClasses: "mt-1 !text-xs !h-10 !text-input-gray",
                    labelOnTop: true,
                    className: "!w-full",
                  }}
                  dialogBodyClassName="!p-0"
                  maxDialogWidth={100}
                />
                <Dropdown
                  options={assessmentType}
                  isForm
                  textFieldProps={{
                    label: "Assessment Type",
                    labelClassName: "!text-sm !font-medium !text-input-gray",
                    placeholder: "Select assessment type",
                    inputClasses: "mt-1 !text-xs !h-10 !text-input-gray",
                    labelOnTop: true,
                    className: "!w-full",
                  }}
                  dialogBodyClassName="!p-0"
                  maxDialogWidth={100}
                />

                <CWTextField
                  control={control}
                  name="totalScore"
                  label="Total Score"
                  placeholder="Enter total score"
                  labelOnTop
                  labelClassName="!text-sm !font-medium !text-input-gray"
                  inputClasses="mt-1 !text-xs !h-10 !text-input-gray placeholder:!text-input-gray"
                  className="flex-1"
                />
              </Box>
              <Box className="flex w-full gap-3">
                <Dropdown
                  options={academicYears}
                  isForm
                  textFieldProps={{
                    label: "Academic Year",
                    labelClassName: "!text-sm !font-medium !text-input-gray",
                    placeholder: "Select academic year",
                    inputClasses: "mt-1 !text-xs !h-10 !text-input-gray",
                    labelOnTop: true,
                    className: "!w-full",
                  }}
                  dialogBodyClassName="!p-0"
                  maxDialogWidth={100}
                />
                <Dropdown
                  options={schoolTerms}
                  isForm
                  textFieldProps={{
                    label: "Term",
                    labelClassName: "!text-sm !font-medium !text-input-gray",
                    placeholder: "Select term",
                    inputClasses: "mt-1 !text-xs !h-10 !text-input-gray",
                    labelOnTop: true,
                    className: "!w-full",
                  }}
                  dialogBodyClassName="!p-0"
                  maxDialogWidth={100}
                />
                <Dropdown
                  options={teachers}
                  isForm
                  textFieldProps={{
                    label: "Assigned Teacher",
                    labelClassName: "!text-sm !font-medium !text-input-gray",
                    placeholder: "Select teacher",
                    inputClasses: "mt-1 !text-xs !h-10 !text-input-gray",
                    labelOnTop: true,
                    className: "!w-full",
                  }}
                  dialogBodyClassName="!p-0"
                  maxDialogWidth={100}
                />
              </Box>
            </Box>

            <Box className="flex w-full gap-3 my-3">
              <CWTextField
                control={control}
                name="dateAssigned"
                label="Date Assigned"
                placeholder="dd/mm/yyyy"
                labelOnTop
                slots={{ openPickerIcon: CalendarIcon }}
                labelClassName="!text-sm !font-medium placeholder:!text-input-gray"
                inputClasses="mt-1 !text-xs !h-10 !text-input-gray"
                className="w-full"
                type="date"
              />
              <CWTextField
                control={control}
                name="dueDate"
                label="Due Date"
                placeholder="dd/mm/yyyy"
                labelOnTop
                slots={{ openPickerIcon: CalendarIcon }}
                labelClassName="!text-sm !font-medium placeholder:!text-input-gray"
                inputClasses="mt-1 !text-xs !h-10 !text-input-gray placeholder:!text-input-gray"
                className="w-full"
                type="date"
              />
            </Box>
            <Box className="flex w-full gap-3 mb-3">
              <CWTextArea
                control={control}
                name="description"
                label="Description"
                placeholder="Enter brief description..."
                labelOnTop
                labelClassName="!text-sm !font-medium !text-input-gray"
                inputClasses="mt-1 !text-xs !px-3.5 !py-3 !text-input-gray placeholder:!text-input-gra"
                className="w-full"
              />
            </Box>
            <Box className="flex flex-col gap-2">
              <Typography className="!text-sm !font-medium !text-input-gray ">
                {" "}
                Attachments
              </Typography>
              <Box className="grid grid-cols-2 gap-3 w-full">
                {attachments.map((att) => (
                  <Box
                    key={att.id}
                    className="flex justify-between items-center w-full border border-[#D0D5DD] rounded-lg py-5 px-6 text-sm outline-none resize-none"
                  >
                    <Box className="flex gap-4 items-center">
                      <Button className="!bg-[#1570EF] !border !border-[#2E90FA] !py-2 !px-2.5 !rounded-lg  !min-w-[44px]">
                        <UploadIcon />
                      </Button>
                      <Box>
                        <Typography className="!text-sm font-medium">{att.title}</Typography>
                        <Typography className="!text-sm text-[#0250504D] flex gap-2">
                          <span>File Format: {att.format}</span>
                          <span>File Size: {att.size}</span>
                        </Typography>
                      </Box>
                    </Box>
                    <IconButton className="!bg-transparent !border !border-[#D0D5DD] !rounded-lg !w-[32px] !h-[32px]">
                      <CloseIcon />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </form>
      </Box>
    </Box>
  );
};

export default AssessmentEdit;
