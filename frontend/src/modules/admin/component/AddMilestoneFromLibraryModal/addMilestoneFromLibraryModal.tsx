/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Box, Typography, IconButton, CircularProgress } from "@mui/material";
import { showToast } from "@/modules/shared/component/Toast";

import { Button } from "@/modules/shared/component/Button";
import { CWDropdown } from "@/modules/shared/component/FormFields/CWDropdown";
import CloseIcon from "@/modules/shared/assets/svgs/closeIcon.svg";
import { Modal } from "@/modules/shared/component/modal/modal";
import * as Yup from "yup";
import ManageCurriculumModal from "@/modules/admin/component/ManageCurriculumModal/manageCurriculumModal";
import useManageMilestone from "@/modules/admin/page/Learnings/ManageMilestone/hooks/useManageMilestone";
import { classroomServices } from "@/services/classroom.service";
import { useInfiniteQueryService } from "@/utils/hooks/useInfiniteQueryService";
import { teacherServices } from "@/services/teacher.service";
import { DropdownOption } from "@/modules/shared/component/Dropdown";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { subjectDynamicEndpoints, type GetSubjectByIdResponse } from "@/services/subject.service";
import { useFormValidator } from "@/utils/hooks/useFormValidator";
import { useUser } from "@/utils/hooks/useUser";
import { Controller } from "react-hook-form";
import { DatePicker } from "@/modules/shared/component/DatePicker";
import { useMediaQuery } from "@/utils/hooks/useMediaQuery";
import { MobileFormDrawer } from "@/modules/shared/component/MobileFormDrawer/MobileFormDrawer";

export interface AddMilestoneFromLibraryFormValues {
  curriculum: string;
  subject: string;
  startDate: string;
  endDate: string;
  milestoneIds: string[];
  classroom: string;
  staff: string;
}

interface AddMilestoneFromLibraryModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: AddMilestoneFromLibraryFormValues) => void;
  isLoading?: boolean;
}

const defaultValues: AddMilestoneFromLibraryFormValues = {
  curriculum: "",
  subject: "",
  startDate: "",
  endDate: "",
  milestoneIds: [],
  classroom: "",
  staff: "",
};

const validationSchema = Yup.object().shape({
  curriculum: Yup.string().required("Curriculum is required"),
  subject: Yup.string().required("Subject is required"),
  startDate: Yup.string().required("Start date is required"),
  endDate: Yup.string().required("End date is required"),
  milestoneIds: Yup.array()
    .of(Yup.string().required())
    .min(1, "Milestone IDs are required")
    .required("Milestone IDs are required"),
  classroom: Yup.string().required("Classroom is required"),
  staff: Yup.string().required("Staff is required"),
}) as Yup.ObjectSchema<AddMilestoneFromLibraryFormValues>;

export default function AddMilestoneFromLibraryModal({
  open,
  onClose,
  onSubmit,
  isLoading,
}: AddMilestoneFromLibraryModalProps) {
  const { control, handleSubmit, reset, watch, setValue } =
    useFormValidator<AddMilestoneFromLibraryFormValues>({
      validationSchema: validationSchema,
      reValidateMode: "onBlur",
      defaultValues,
    });
  const [staffOptions, setStaffOptions] = useState<DropdownOption<string>[]>([]);
  const [classroomOptions, setClassroomOptions] = useState<DropdownOption<number>[]>([]);
  const selectedCurriculumId = watch("curriculum");
  const selectedSubjectId = watch("subject");
  const { curriculumOptions, subjectOptions, refetchCurricula } = useManageMilestone({
    selectedCurriculumId: selectedCurriculumId || null,
  });
  const [manageCurriculumModalOpen, setManageCurriculumModalOpen] = useState(false);

  // Old milestone fetch by subjectId param is intentionally disabled.
  // const { data: subjectMilestonesData } = useQueryService<
  //   { subjectId?: number; isSystem?: boolean; delta?: number },
  //   GetAllMilestonesResponse
  // >({
  //   service: {
  //     ...milestoneServices.getAllMilestones,
  //     data: {
  //       subjectId: Number(selectedSubjectId),
  //       isSystem: true,
  //       delta: 100,
  //     },
  //   },
  //   options: { enabled: !!selectedSubjectId },
  // });
  const { data: selectedSubjectData } = useQueryService<object, GetSubjectByIdResponse>({
    service: subjectDynamicEndpoints.getSubjectById(Number(selectedSubjectId || 0)),
    options: { enabled: !!selectedSubjectId },
  });

  // Milestone options based on selected subject
  const milestoneOptions = useMemo(() => {
    const milestones = selectedSubjectData?.data?.milestones ?? [];
    if (!Array.isArray(milestones)) return [];
    return milestones.map((m: any) => ({
      name: m.title ?? m.name ?? "",
      value: String(m.id),
    }));
  }, [selectedSubjectData]);

  const { role, staffId } = useUser();
  const isStaff = role === "staff";

  // Fetch staff using the teacher service
  const { data: staffData } = useInfiniteQueryService<any, any>({
    service: {
      ...teacherServices.getAllTeachers,
      data: isStaff ? { staffId, delta: 50 } : { delta: 50 },
    },
  });

  const { data: classroomData } = useInfiniteQueryService<any, any>({
    service: {
      ...classroomServices.getAllClassrooms,
      data: isStaff ? { staffId, delta: 50, status: "active" } : { delta: 50, status: "active" },
    },
  });

  useEffect(() => {
    const classrooms =
      classroomData?.pages?.flatMap((page: any) => page?.classrooms ?? page?.data ?? []) ?? [];
    if (classrooms.length > 0) {
      const mapped = classrooms.reduce((acc: DropdownOption<number>[], c: any) => {
        if (!acc.some((existing) => existing.value === c.id)) {
          acc.push({
            name: c.classroomName,
            value: c.id,
          });
        }
        return acc;
      }, []);
      setClassroomOptions(mapped);
    }
  }, [classroomData?.pages]);

  // Map staff data
  useEffect(() => {
    const staffList =
      staffData?.pages?.flatMap((page: any) => page?.staff ?? page?.data ?? page?.teachers ?? []) ??
      [];
    if (Array.isArray(staffList) && staffList.length > 0) {
      const mapped = staffList.reduce((acc: DropdownOption<string>[], s: any) => {
        if (!acc.some((existing) => existing.value === String(s.id))) {
          const firstName = s.user?.firstName ?? s.firstName ?? "";
          const lastName = s.user?.lastName ?? s.lastName ?? "";
          const displayName = `${firstName} ${lastName}`.trim() || s.name || "Staff";
          acc.push({
            name: displayName,
            value: String(s.id),
          });
        }
        return acc;
      }, []);
      setStaffOptions(mapped);
    }
  }, [staffData?.pages]);

  React.useEffect(() => {
    if (open) {
      reset(defaultValues);
      if (isStaff && staffId) {
        setValue("staff", String(staffId));
      }
    }
  }, [open, reset, isStaff, staffId, setValue]);

  const handleCurriculumAdded = React.useCallback(
    (curriculum: { id: string; name: string }) => {
      refetchCurricula?.();
      setValue("curriculum", curriculum.id);
      setValue("subject", "");
      setManageCurriculumModalOpen(false);
    },
    [refetchCurricula, setValue],
  );

  // Reset subject when curriculum changes
  const prevCurriculumRef = React.useRef<string | undefined>(undefined);
  React.useEffect(() => {
    if (
      prevCurriculumRef.current !== undefined &&
      prevCurriculumRef.current !== selectedCurriculumId
    ) {
      setValue("subject", "");
    }
    prevCurriculumRef.current = selectedCurriculumId;
  }, [selectedCurriculumId, setValue]);

  React.useEffect(() => {
    setValue("milestoneIds", []);
  }, [selectedSubjectId, setValue]);

  const isMobile = useMediaQuery("(max-width:768px)");

  const formId = "add-milestone-from-library-form";

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
      className="max-md:h- flex flex-col justify-between"
    >
      <Box
        className={`flex flex-col gap-4 py-4 ${!isMobile ? "border-t border-border-light overflow-y-auto" : ""}`}
        sx={!isMobile ? { maxHeight: "380px" } : {}}
      >
        <CWDropdown
          name="curriculum"
          control={control}
          options={curriculumOptions}
          isForm
          requiredAsterisk
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
        <CWDropdown
          name="subject"
          control={control}
          options={subjectOptions}
          isForm
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

        <Box>
          <label className="bd-text-field-label !text-sm !font-medium !text-input-gray !mb-1">
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

        <CWDropdown
          name="milestoneIds"
          control={control}
          options={milestoneOptions}
          isForm
          requiredAsterisk
          isMultipleSelect
          textFieldProps={{
            label: "Milestone",
            labelClassName: "!text-sm !font-medium !text-input-gray",
            placeholder:
              !selectedSubjectId || milestoneOptions.length === 0
                ? "No milestones available"
                : "Select milestones",
            inputClasses: "mt-1 !text-sm !h-11",
            labelOnTop: true,
            className: "!w-full",
            isRounded: isMobile,
            disabled: !selectedSubjectId || milestoneOptions.length === 0,
          }}
          dialogBodyClassName="!p-0"
          maxDialogWidth={100}
        />
        <Box className="grid md:grid-cols-2 gap-4">
          <CWDropdown
            control={control}
            name="classroom"
            options={classroomOptions}
            requiredAsterisk
            isForm
            textFieldProps={{
              label: "Classroom",
              labelClassName: "!text-sm !font-medium !text-input-gray",
              placeholder: "Select classroom",
              inputClasses: "mt-1 !text-sm !h-11",
              labelOnTop: true,
              className: "!w-full",
              isRounded: isMobile,
            }}
            dialogBodyClassName="!p-0 !max-h-[180px]"
            maxDialogWidth={100}
          />
          <CWDropdown
            control={control}
            name="staff"
            options={staffOptions}
            requiredAsterisk
            isForm
            textFieldProps={{
              label: "Staff",
              labelClassName: "!text-sm !font-medium !text-input-gray",
              placeholder: "Select staff",
              inputClasses: "mt-1 !text-sm !h-11",
              labelOnTop: true,
              className: "!w-full",
              disabled: isStaff,
              isRounded: isMobile,
            }}
            dialogBodyClassName="!p-0 !max-h-[180px]"
            maxDialogWidth={100}
          />
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
          <Button type="submit" className="!px-6 !py-2 !rounded-lg" disabled={isLoading}>
            {isLoading ? <CircularProgress size={20} className="!text-white" /> : "Save"}
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
        disabled={isLoading}
        className="flex-1 py-3 rounded-lg md:rounded-full bg-brandColor-active text-white text-sm font-medium hover:opacity-90 flex items-center justify-center gap-2"
      >
        {isLoading && <CircularProgress size={16} className="!text-white" />}
        Save
      </button>
    </div>
  );

  if (isMobile) {
    return (
      <MobileFormDrawer
        open={open}
        onClose={onClose}
        title="Add Milestone from Library"
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
            Add Milestone from Library
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
