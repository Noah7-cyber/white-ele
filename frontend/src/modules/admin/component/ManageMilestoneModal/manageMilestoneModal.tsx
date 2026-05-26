"use client";

import React, { useState } from "react";
import { Box, Typography, IconButton, CircularProgress } from "@mui/material";
import { showToast } from "@/modules/shared/component/Toast";
import { Button } from "@/modules/shared/component/Button";
import { CWTextField } from "@/modules/shared/component/FormFields/CWTextField";
import { CWDropdown } from "@/modules/shared/component/FormFields/CWDropdown";
import CloseIcon from "@/modules/shared/assets/svgs/closeIcon.svg";
import { Modal } from "@/modules/shared/component/modal/modal";

import { MilestoneRow } from "../../page/Learnings/learning.constants";
import { DashboardRoutes } from "@/routes/dashboard.routes";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import ManageCurriculumModal from "@/modules/admin/component/ManageCurriculumModal/manageCurriculumModal";
import useManageMilestone from "@/modules/admin/page/Learnings/ManageMilestone/hooks/useManageMilestone";
import * as Yup from "yup";
import { useFormValidator } from "@/utils/hooks/useFormValidator";
import { Controller } from "react-hook-form";
import { DatePicker } from "@/modules/shared/component/DatePicker";
import { useMediaQuery } from "@/utils/hooks/useMediaQuery";
import { MobileFormDrawer } from "@/modules/shared/component/MobileFormDrawer/MobileFormDrawer";
export interface AddEditMilestoneFormValues {
  milestoneName: string;
  curriculum: string;
  subject: string;
  // gradingType: string;
  startDate: string;
  endDate: string;
}

interface ManageMilestoneModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: AddEditMilestoneFormValues) => void;
  milestone?: MilestoneRow | null;
  isLoading?: boolean;
  isSubmitting?: boolean;
  baseReturnPath?: string;
}

const defaultValues: AddEditMilestoneFormValues = {
  milestoneName: "",
  curriculum: "",
  subject: "",
  // gradingType: "",
  startDate: "",
  endDate: "",
};

const validationSchema = Yup.object().shape({
  milestoneName: Yup.string().required("Milestone name is required"),
  curriculum: Yup.string().required("Curriculum is required"),
  subject: Yup.string().required("Subject is required"),
  // gradingType: Yup.string().required("Grading type is required"),
  startDate: Yup.string().required("Start date is required"),
  endDate: Yup.string().required("End date is required"),
}) as Yup.ObjectSchema<AddEditMilestoneFormValues>;

export default function ManageMilestoneModal({
  open,
  onClose,
  onSubmit,
  milestone,
  isSubmitting = false,
  baseReturnPath = "/admin/learning/milestones",
}: ManageMilestoneModalProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { control, handleSubmit, reset, watch, setValue } =
    useFormValidator<AddEditMilestoneFormValues>({
      defaultValues: defaultValues,
      validationSchema: validationSchema,
      reValidateMode: "onBlur",
      mode: "onChange",
    });
  const selectedCurriculumId = watch("curriculum");
  const { curriculumOptions, subjectOptions, refetchCurricula } = useManageMilestone({
    selectedCurriculumId: selectedCurriculumId || null,
  });
  const [manageCurriculumModalOpen, setManageCurriculumModalOpen] = useState(false);
  const isHydratingFormRef = React.useRef(false);

  React.useEffect(() => {
    if (open) {
      isHydratingFormRef.current = true;
      if (milestone?.raw) {
        const m = milestone.raw;
        const curriculumId =
          m.subject?.curriculumId ?? (m as { curriculumId?: number }).curriculumId;
        reset({
          milestoneName: milestone.milestoneName,
          curriculum: curriculumId ? String(curriculumId) : "",
          subject: m.subject?.id ? String(m.subject?.id) : "",
          // gradingType: m.gradingType ?? "",
          startDate: m.startDate ?? "",
          endDate: m.endDate ?? m.dueDate ?? "",
        });
      } else if (milestone) {
        reset({
          milestoneName: milestone.milestoneName,
          curriculum: "",
          subject: "",
          // gradingType: gradingValue,
          startDate: "",
          endDate: "",
        });
      } else {
        reset(defaultValues);
      }
      queueMicrotask(() => {
        isHydratingFormRef.current = false;
      });
    }
  }, [open, milestone, reset]);

  const returnTo = React.useMemo(() => {
    const base = baseReturnPath || pathname || "/admin/learning/milestones";
    const curriculumParam = selectedCurriculumId
      ? `&prefillCurriculumId=${encodeURIComponent(selectedCurriculumId)}`
      : "";
    return `${base}?openMilestoneModal=1${curriculumParam}`;
  }, [baseReturnPath, pathname, selectedCurriculumId]);

  const handleCurriculumAdded = React.useCallback(
    (curriculum: { id: string; name: string }) => {
      refetchCurricula?.();
      setValue("curriculum", curriculum.id);
      setValue("subject", "");
      setManageCurriculumModalOpen(false);
    },
    [refetchCurricula, setValue],
  );

  const prevCurriculumRef = React.useRef<string | undefined>(undefined);
  React.useEffect(() => {
    if (
      !isHydratingFormRef.current &&
      prevCurriculumRef.current !== undefined &&
      prevCurriculumRef.current !== selectedCurriculumId
    ) {
      setValue("subject", "");
    }
    prevCurriculumRef.current = selectedCurriculumId;
  }, [selectedCurriculumId, setValue]);

  const isMobile = useMediaQuery("(max-width:768px)");

  const formId = "manage-milestone-form";

  const formContent = (
    <form
      id={formId}
      onSubmit={handleSubmit((values) => {
        if (values.startDate && values.endDate && values.startDate > values.endDate) {
          showToast({
            message: "The start date cannot be after the end date.",
            severity: "error",
            duration: 3000,
          });
          return;
        }
        onSubmit(values);
      })}
    >
      <Box
        className={`flex flex-col gap-4 py-4 ${!isMobile ? "border-t border-border-light overflow-y-auto" : ""}`}
        sx={!isMobile ? { maxHeight: "380px" } : {}}
      >
        <CWTextField
          control={control}
          name="milestoneName"
          requiredAsterisk
          label="Milestone Name"
          placeholder="Enter milestone name"
          labelOnTop
          labelClassName="!text-sm !font-medium !text-input-gray"
          inputClasses="mt-1 !text-sm !h-11"
          className="w-full"
        />
        <Box className="flex items-center gap-2">
          <Box className="flex-1">
            <CWDropdown
              name="curriculum"
              control={control}
              options={curriculumOptions}
              isForm
              requiredAsterisk
              headerAction={
                <button
                  type="button"
                  onClick={() => setManageCurriculumModalOpen(true)}
                  className="text-xs cursor-pointer font-normal text-brandColor-active"
                >
                  + Add new curriculum
                </button>
              }
              textFieldProps={{
                label: "Curriculum",
                labelClassName: "!text-sm !font-medium !text-input-gray",
                placeholder: "Select curriculum",
                inputClasses: "mt-1 !text-sm !h-11",
                labelOnTop: true,
                className: "!w-full",
                isRounded: isMobile,
              }}
              dialogBodyClassName="!p-0"
              maxDialogWidth={100}
            />
          </Box>
        </Box>
        <Box className="flex items-center gap-2">
          <Box className="flex-1">
            <CWDropdown
              name="subject"
              control={control}
              options={subjectOptions}
              isForm
              headerAction={
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `${DashboardRoutes.learningAddSubject}?returnTo=${encodeURIComponent(returnTo)}${
                        selectedCurriculumId
                          ? `&curriculumId=${encodeURIComponent(selectedCurriculumId)}`
                          : ""
                      }`,
                    )
                  }
                  className="text-xs cursor-pointer font-normal text-brandColor-active"
                >
                  + Add new subject
                </button>
              }
              requiredAsterisk
              textFieldProps={{
                label: "Subject",
                labelClassName: "!text-sm !font-medium !text-input-gray",
                placeholder:
                  subjectOptions.length === 0 && selectedCurriculumId
                    ? "No subjects available"
                    : "Select subject",
                inputClasses: "mt-1 !text-sm !h-11",
                labelOnTop: true,
                className: "!w-full",
                isRounded: isMobile,
                disabled: !selectedCurriculumId || subjectOptions.length === 0,
              }}
              dialogBodyClassName="!p-0"
              maxDialogWidth={100}
            />
          </Box>
        </Box>

        <Box>
          <label className="bd-text-field-label !text-[15px] !font-medium !text-input-gray !mb-1">
            Milestone Period
            <span className="text-red-500 ml-0.5">*</span>
          </label>
          <Box className="grid md:grid-cols-2 gap-3 mt-1">
            <Controller
              name="startDate"
              control={control}
              render={({ field: { value, onChange }, fieldState: { error } }) => (
                <DatePicker
                  label="Start Date"
                  labelOnTop
                  labelClassName="!text-sm !font-medium !text-input-gray !mb-1"
                  fullWidth
                  value={value}
                  onChange={onChange}
                  errorText={error?.message}
                  isRounded={isMobile}
                />
              )}
            />
            <Controller
              name="endDate"
              control={control}
              render={({ field: { value, onChange }, fieldState: { error } }) => (
                <DatePicker
                  label="End Date"
                  labelOnTop
                  labelClassName="!text-sm !font-medium !text-input-gray !mb-1"
                  fullWidth
                  value={value}
                  onChange={onChange}
                  errorText={error?.message}
                  isRounded={isMobile}
                />
              )}
            />
          </Box>
        </Box>
      </Box>

      {!isMobile && (
        <Box className="flex justify-end gap-3 pt-4 border-t border-border-light">
          <Button
            variant="outlined"
            onClick={onClose}
            className="!rounded-lg !px-6 !bg-background-offwhite/50 !text-primary-dark !border !border-border-table"
          >
            Cancel
          </Button>
          <Button type="submit" className="!px-6 !py-2 !rounded-lg" disabled={isSubmitting}>
            {isSubmitting ? <CircularProgress size={20} className="!text-white" /> : "Save"}
          </Button>
        </Box>
      )}
    </form>
  );

  const mobileFooter = (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onClose}
        className="flex-1 py-3 rounded-lg md:rounded-full border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Cancel
      </button>
      <button
        type="submit"
        form={formId}
        disabled={isSubmitting}
        className="flex-1 py-3 rounded-lg md:rounded-full bg-brandColor-active text-white text-sm font-medium hover:opacity-90 flex items-center justify-center gap-2"
      >
        {isSubmitting && <CircularProgress size={16} className="!text-white" />}
        Save
      </button>
    </div>
  );

  if (isMobile) {
    return (
      <MobileFormDrawer
        open={open}
        onClose={onClose}
        title={milestone ? "Edit Milestone" : "Add Milestone"}
        footer={mobileFooter}
      >
        {formContent}
        <ManageCurriculumModal
          open={manageCurriculumModalOpen}
          onClose={() => setManageCurriculumModalOpen(false)}
          onCurriculumAdded={handleCurriculumAdded}
        />
      </MobileFormDrawer>
    );
  }

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      className="md:w-[600px] w-[90vw] !p-6 !rounded-md"
      width="600px"
    >
      <Box className="flex flex-col gap-3">
        <Box className="flex items-center justify-between">
          <Typography className="!text-lg !font-bold !text-text-primary">
            {milestone ? "Edit Milestone" : "Add Milestone"}
          </Typography>
          <IconButton onClick={onClose} size="small" className="!p-0">
            <CloseIcon />
          </IconButton>
        </Box>
        {formContent}
      </Box>
      <ManageCurriculumModal
        open={manageCurriculumModalOpen}
        onClose={() => setManageCurriculumModalOpen(false)}
        onCurriculumAdded={handleCurriculumAdded}
      />
    </Modal>
  );
}
