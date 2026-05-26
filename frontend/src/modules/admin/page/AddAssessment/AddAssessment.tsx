"use client";
import { Button } from "@/modules/shared/component/Button";
import { Box, Typography } from "@mui/material";
import EditBlackIcon from "@/modules/shared/assets/svgs/editBlackIcon.svg";
import PublishIcon from "@/modules/shared/assets/svgs/publishWhiteIcon.svg";
import Image from "next/image";
import { ButtonIcon } from "@/modules/shared/component/ButtonIcon";
import { useRouter } from "next/navigation";
import LeftIcon from "@/modules/shared/assets/images/chevronBack.png";
import Dropzone from "react-dropzone";
import UploadState from "@/modules/shared/assets/images/file-upload.png";

import CalendarIcon from "@/modules/shared/assets/svgs/calendarLinear.svg";
import { CWTextField } from "@/modules/shared/component/FormFields/CWTextField";
import { Dropdown } from "@/modules/shared/component/Dropdown";
import { CWTextArea } from "@/modules/shared/component/FormFields/CWTextArea";
import useAddAssessment from "./hook/useAddAssessment";
import {
  academicYears,
  assessmentType,
  schoolTerms,
  subjects,
  teachers,
} from "./assessment.constant";

const AddAssessment: React.FC = () => {
  const router = useRouter();

  const { handleSubmit, handleSaveDraft, control } = useAddAssessment();
  return (
    <Box className="h-full p-5 pb-8 space-y-6 ">
      <Box className="w-full flex items-center justify-between">
        <Typography className="!font-bold !text-2xl !text-gray-900 flex items-center gap-2">
          {" "}
          <ButtonIcon
            className="rounded-full !border !border-brandColor-active/20 !p- flex items-center justify-center"
            onClick={() => router.back()}
          >
            <Image src={LeftIcon} alt="" />
          </ButtonIcon>
          <Typography className="!text-2xl !font-semibold !text-text-primary">
            Create Assessment
          </Typography>
        </Typography>
        <Box className="gap-2 flex">
          <Button
            className="!rounded-lg !px-4 !bg-transparent !text-sm !text-primary-dark !border !border-border-table"
            onClick={handleSaveDraft}
            startIcon={<EditBlackIcon />}
          >
            Save to Draft
          </Button>
          <Button
            className="!rounded-lg !px-4 !text-sm disabled:cursor-no-drop"
            onClick={handleSubmit}
            startIcon={<PublishIcon />}
          >
            Publish
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
              <Dropzone onDrop={(_files) => {}}>
                {({ getRootProps, getInputProps }) => (
                  <section className="border border-dashed border-border-input rounded-2xl py-8 px-4">
                    <Box {...getRootProps()} className="w-full">
                      <>
                        <input {...getInputProps()} />
                        <Box className="flex flex-col gap-y-3 items-center justify-center cursor-pointer">
                          <Image src={UploadState} alt="image-upload-img" className="w-12 h-12" />
                          <Box className="flex flex-col gap-y-0.5 items-center ">
                            <Typography className="!text-xs !text-grey500">
                              <span className="!font-semibold !text-primary-text">
                                Click to upload
                              </span>{" "}
                              or drag and drop
                            </Typography>
                            <Typography className="!text-[10px] !text-brandColor-inactive">
                              PDF, PNG, WORD or DOCX (max. 12MB)
                            </Typography>
                          </Box>
                        </Box>
                      </>
                    </Box>
                  </section>
                )}
              </Dropzone>
            </Box>
          </Box>
        </form>
      </Box>
    </Box>
  );
};

export default AddAssessment;
