"use client";

import { Box, IconButton, Typography } from "@mui/material";
import { Button } from "@/modules/shared/component/Button";
import Image from "next/image";
import AddIcon from "@/modules/shared/assets/svgs/addBorder.svg";
import DeleteIcon from "@/modules/shared/assets/svgs/trashIcon-red.svg";
import ChevronDownIcon from "@/modules/shared/assets/svgs/downIcon.svg";
import LeftIcon from "@/modules/shared/assets/images/chevronBack.png";
import { ButtonIcon } from "@/modules/shared/component/ButtonIcon";
import { CWTextField } from "@/modules/shared/component/FormFields/CWTextField";
import { CWTextArea } from "@/modules/shared/component/FormFields/CWTextArea";
import useManageMilestone from "./hooks/useManageMilestone";
import { CWDropdown } from "@/modules/shared/component/FormFields/CWDropdown";
import DocumentUpload from "@/modules/shared/component/DocumentUpload/documentUpload";

export const ManageMilestonePage = () => {
  const {
    milestoneId,
    control,
    fields,
    appendMilestone,
    removeMilestone,
    onHandleSubmit,
    router,
    collapsed,
    toggleCollapse,
    formState: { isSubmitting },
  } = useManageMilestone();

  return (
    <Box onSubmit={onHandleSubmit} className="h-full p-5 space-y-6">
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
              {milestoneId ? "Edit Milestones" : "Add Milestones"}
            </Typography>
          </Box>
        </Box>
        <Box className="flex gap-3">
          {!milestoneId && (
            <button
              onClick={() => appendMilestone()}
              className="flex items-center cursor-pointer gap-1.5 px-4 py-2 text-brandColor-active hover:bg-brandColor-active/5 rounded-lg transition-colors"
            >
              <AddIcon />
              <Typography className="!text-sm !font-medium">Add milestone</Typography>
            </button>
          )}
          <Button className="!rounded-lg" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </Box>
      </Box>

      <Box className="space-y-4 ">
        {fields.map((field, index) => (
          <Box
            key={field.id}
            className="rounded-2xl border !border-border-table bg-white p-4 space-y-4 relative"
          >
            <Box className="flex items-center justify-between">
              <Typography className="!text-base !font-semibold !text-primary-dark">
                Milestone {index + 1}
              </Typography>

              <Box className="flex items-center gap-2">
                {" "}
                {fields.length > 1 && (
                  <IconButton
                    size="small"
                    onClick={() => removeMilestone(index)}
                    className="text-red-500"
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
                <IconButton
                  size="large"
                  onClick={() => toggleCollapse(index)}
                  className="text-input-gray"
                >
                  <span className={`transition-transform ${collapsed[index] ? "rotate-180" : ""}`}>
                    <ChevronDownIcon />
                  </span>
                </IconButton>
              </Box>
            </Box>
            {!collapsed[index] && (
              <>
                <Box className="flex gap-4">
                  <CWTextField
                    control={control}
                    name={`milestones.${index}.title`}
                    requiredAsterisk
                    label="Milestone Title"
                    placeholder="Enter milestone title"
                    labelOnTop
                    labelClassName="!text-sm !font-medium !text-input-gray"
                    inputClasses="mt-1 !text-xs !h-10 !text-input-gray placeholder:!text-input-gray"
                    className="flex-1"
                  />

                  <CWDropdown
                    name={`milestones.${index}.type`}
                    control={control}
                    options={[]}
                    isForm
                    requiredAsterisk
                    textFieldProps={{
                      label: "Milestone Type",
                      labelClassName: "!text-sm !font-medium !text-input-gray",
                      placeholder: "Select milestone type",
                      inputClasses: "mt-1 !text-xs !h-10 !text-input-gray",
                      labelOnTop: true,
                      className: "!w-full",
                    }}
                    dialogBodyClassName="!p-0"
                    maxDialogWidth={100}
                  />
                </Box>
                <Box className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <CWTextField
                    control={control}
                    requiredAsterisk
                    name={`milestones.${index}.startDate`}
                    type="time"
                    label="Start Date"
                    labelOnTop
                    placeholder="--:-- --"
                    labelClassName="!text-sm !font-medium !text-input-gray"
                    inputClasses="mt-1 !text-xs !h-10 !text-input-gray placeholder:!text-input-gray"
                    className="flex-1 !text-sm !font-medium !text-input-gray"
                    // endIcon={<ClickIcon />}
                  />
                  <CWTextField
                    control={control}
                    requiredAsterisk
                    name={`milestones.${index}.endDate`}
                    type="time"
                    label="End Date"
                    labelOnTop
                    placeholder="--:-- --"
                    labelClassName="!text-sm !font-medium !text-input-gray"
                    inputClasses="mt-1 !text-xs !h-10 !text-input-gray placeholder:!text-input-gray"
                    className="flex-1 !text-sm !font-medium !text-input-gray"
                    // endIcon={<ClickIcon />}
                  />
                </Box>

                <CWTextArea
                  control={control}
                  name={`milestones.${index}.description`}
                  label="Description"
                  placeholder="Enter brief description..."
                  rows={4}
                  labelOnTop
                  labelClassName="!text-sm !font-medium !text-input-gray"
                  inputClasses="mt-1 !text-xs !px-3.5 !pt-3 !pb-4 !text-input-gray !h-20"
                  className="w-full"
                />
                <Typography className="!text-sm !font-medium !text-input-gray mb-2">
                  Attachments
                </Typography>
                <DocumentUpload control={control} name={`milestones.${index}.attachments`} />
              </>
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default ManageMilestonePage;
