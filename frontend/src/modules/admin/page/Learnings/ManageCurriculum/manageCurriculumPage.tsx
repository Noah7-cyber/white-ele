/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Box, Typography } from "@mui/material";
import { ButtonIcon } from "@/modules/shared/component/ButtonIcon";
import { useRouter } from "next/navigation";
import LeftIcon from "@/modules/shared/assets/images/chevronBack.png";
import Image from "next/image";
import { CWTextField } from "@/modules/shared/component/FormFields/CWTextField";
import { CWTextArea } from "@/modules/shared/component/FormFields/CWTextArea";
import { Button } from "@/modules/shared/component/Button";
import useManageCurriculumPage from "./hooks/useManageCurriculumPage";
import { DataRenderer } from "@/modules/shared/component/DataRenderer";
import { FC, useState } from "react";
import UploadIcon from "@/modules/shared/assets/svgs/upload.svg";

interface ManageCurriculumPageProps {
  curriculum?: any;
  isEdit?: boolean;
}

export const ManageCurriculumPage: FC<ManageCurriculumPageProps> = ({ curriculum, isEdit }) => {
  const router = useRouter();
  const {
    control,
    curriculumId,
    onHandleSubmit,
    handleSubmit,
    isSubmitting,
    setValue,
  } = useManageCurriculumPage();
  const [fileCount, setFileCount] = useState(0);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    setValue("attachments", files, { shouldValidate: true });
    setFileCount(files?.length ?? 0);
  };

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
            {curriculumId ? "Edit Curriculum" : "Create Curriculum"}
          </Typography>
        </Box>
        <Box className="flex gap-2">
          <Button
            loading={isSubmitting}
            className="!rounded-lg !px-8 !bg-brandColor-active"
            onClick={handleSubmit(onHandleSubmit)}
          >
            {curriculumId ? "Save" : "Save"}
          </Button>
        </Box>
      </Box>

      <DataRenderer isLoading={false}>
        {() => (
          <Box className="bg-white rounded-2xl px-4 flex flex-col flex-1 overflow-y-scroll">
            <Box className="py-4 border-b border-border-lightGray flex flex-col">
              <Typography className="!font-bold !text-lg !text-primary-dark">
                Curriculum Details
              </Typography>
              <Typography className="!font-normal !text-sm !text-text-gray">
                {curriculumId ? "Update curriculum information." : "Basic information about the curriculum."}
              </Typography>
            </Box>

            <Box className="border-b border-border-lightGray py-4 flex flex-col gap-4">
              <CWTextField
                control={control}
                name="curriculumName"
                requiredAsterisk
                label="Curriculum Name*"
                placeholder="Enter curriculum name"
                labelOnTop
                labelClassName="!text-sm !font-medium !text-input-gray"
                inputClasses="mt-1 !text-sm !h-10 !text-input-gray"
                className="w-full"
              />
              <CWTextArea
                control={control}
                name="description"
                label="Descriptions"
                placeholder="Brief description of the curriculum....."
                rows={4}
                labelOnTop
                labelClassName="!text-sm !font-medium !text-input-gray"
                inputClasses="mt-1 !text-sm !px-3.5 !pt-3 !pb-4 !text-input-gray"
                className="w-full"
              />
              <Box>
                <Typography className="!text-sm !font-medium !text-input-gray mb-2">
                  Attachments
                </Typography>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <Box className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Image src={UploadIcon} alt="Upload" width={40} height={40} className="mb-2" />
                    <Typography className="!text-sm !text-input-gray">
                      Click to upload or drag and drop
                    </Typography>
                    <Typography className="!text-xs !text-input-gray mt-1">
                      PDF, PNG, WORD or DOCX (max. 12MB)
                    </Typography>
                  </Box>
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    accept=".pdf,.png,.doc,.docx"
                    onChange={onFileChange}
                  />
                </label>
                {fileCount > 0 && (
                  <Typography className="!text-xs !text-input-gray mt-1">
                    {fileCount} file(s) selected
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
        )}
      </DataRenderer>
    </Box>
  );
};

export default ManageCurriculumPage;
