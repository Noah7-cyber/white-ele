"use client";

import { Box, Typography } from "@mui/material";
import Image from "next/image";
import { Button } from "@/modules/shared/component/Button";
import LeftIcon from "@/modules/shared/assets/images/chevronBack.png";
import { ButtonIcon } from "@/modules/shared/component/ButtonIcon";
import { CWTextField } from "@/modules/shared/component/FormFields/CWTextField";
import { CWTextArea } from "@/modules/shared/component/FormFields/CWTextArea";
import useManageAssessment from "./hooks/useManageAssessment";
import { CWDropdown } from "@/modules/shared/component/FormFields/CWDropdown";
import DocumentUpload from "@/modules/shared/component/DocumentUpload/documentUpload";

export const ManageAssessmentPage = () => {
  const {
    assessmentId,
    control,
    formState: { isSubmitting },
    onHandleSubmit,
    router,
  } = useManageAssessment();

  return (
    <Box component="form" onSubmit={onHandleSubmit} className="h-full p-5 space-y-6">
      <Box className="flex items-center justify-between">
        <Box className="flex items-center gap-3">
          <ButtonIcon
            className="rounded-full !border !border-brandColor-active/20 !p-0"
            onClick={() => router.back()}
          >
            <Image src={LeftIcon || "/placeholder.svg"} alt="Back" />
          </ButtonIcon>
          <Box>
            <Typography className="!text-xl !font-semibold">
              {assessmentId ? "Edit Assessment" : "Add Assessment"}
            </Typography>
          </Box>
        </Box>
        <Button className="!rounded-lg" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </Box>

      <Box className="rounded-2xl border !border-border-table bg-white p-5 space-y-4">
        <Box className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CWTextField
            control={control}
            name="title"
            label="Assessment Title"
            placeholder="e.g. Midterm Literacy Check"
            requiredAsterisk
            labelOnTop
            labelClassName="!text-sm !font-medium !text-input-gray"
            inputClasses="mt-1 !text-xs !h-10 !text-input-gray placeholder:!text-input-gray"
            className="flex-1"
          />
          <CWDropdown
            name={`milestoneType`}
            control={control}
            options={[
              "Recognizes letters A-Z",
              "Reads simple words",
              "Writes own name",
              "Traces lines, shapes and patterns",
              "Matches pictures to objects",
            ]}
            isForm
            isMultipleSelect
            requiredAsterisk
            textFieldProps={{
              label: "Milestone (select more than 1)",
              labelClassName: "!text-sm !font-medium !text-input-gray",
              placeholder: "Select milestone type",
              inputClasses: "mt-1 !text-xs !h-10 !text-input-gray",
              labelOnTop: true,
              className: "!w-full",
            }}
            dialogBodyClassName="!p-0"
            maxDialogWidth={100}
          />
          <CWDropdown
            name={`scoreType`}
            control={control}
            options={[
              "Numerical score (0-100)",
              "Two-Level (Developing/Achieved)",
              "Five-Level Scale",
              "Checklist (Yes/No)",
            ]}
            isForm
            requiredAsterisk
            textFieldProps={{
              label: "Score Type",
              labelClassName: "!text-sm !font-medium !text-input-gray",
              placeholder: "Select score type",
              inputClasses: "mt-1 !text-xs !h-10 !text-input-gray",
              labelOnTop: true,
              className: "!w-full",
            }}
            dialogBodyClassName="!p-0"
            maxDialogWidth={100}
          />
          <CWTextField
            control={control}
            name="Date"
            label=" Date"
            placeholder="Select date"
            type="date"
            requiredAsterisk
            labelOnTop
            labelClassName="!text-sm !font-medium !text-input-gray"
            inputClasses="mt-1 !text-xs !h-10 !text-input-gray placeholder:!text-input-gray"
            className="flex-1"
          />
        </Box>

        <CWTextArea
          control={control}
          name={`description`}
          label="Description"
          placeholder="Enter brief description..."
          rows={4}
          labelOnTop
          labelClassName="!text-sm !font-medium !text-input-gray"
          inputClasses="mt-1 !text-xs !px-3.5 !pt-3 !pb-4 !text-input-gray !h-20"
          className="w-full"
        />
        <Typography className="!text-sm !font-medium !text-input-gray mb-2">Attachments</Typography>
        <DocumentUpload control={control} name={`attachments`} maxFiles={2} />
      </Box>

      {/* <Box className="flex justify-end gap-3">
        <Button variant="outlined" className="!rounded-lg" onClick={handleBack}>
          Cancel
        </Button>
        <Button className="!rounded-lg" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save & Close"}
        </Button>
      </Box> */}
    </Box>
  );
};

export default ManageAssessmentPage;
