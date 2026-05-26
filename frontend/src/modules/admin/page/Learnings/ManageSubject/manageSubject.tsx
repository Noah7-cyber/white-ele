/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Box, Typography } from "@mui/material";
import { ButtonIcon } from "@/modules/shared/component/ButtonIcon";
import { useRouter } from "next/navigation";
import LeftIcon from "@/modules/shared/assets/images/chevronBack.png";
import Image from "next/image";
import { CWTextField } from "@/modules/shared/component/FormFields/CWTextField";
import { CWTextArea } from "@/modules/shared/component/FormFields/CWTextArea";
import { CWDropdown } from "@/modules/shared/component/FormFields/CWDropdown";
import { Button } from "@/modules/shared/component/Button";
import useManageSubject from "./hooks/useManageSubject";
import { DataRenderer } from "@/modules/shared/component/DataRenderer";
import ManageCurriculumModal from "@/modules/admin/component/ManageCurriculumModal/manageCurriculumModal";
import SubjectSchedule from "./components/SubjectSchedule";
import { FC, useEffect, useMemo, useState } from "react";
import { ageOptions } from "@/modules/admin/page/ClassroomPage/classroomOptions";
import { useMediaQuery } from "@/utils/hooks/useMediaQuery";
import { MobileFormDrawer } from "@/modules/shared/component/MobileFormDrawer/MobileFormDrawer";

interface ManageSubjectProps {
  subject?: any;
  isEdit?: boolean;
}

export const ManageSubject: FC<ManageSubjectProps> = () => {
  const router = useRouter();
  const {
    control,
    setValue,
    watch,
    formState,
    subjectId,
    curriculumOptions,
    skillsOptions,
    onHandleSubmit,
    onInvalidSubmit,
    handleSubmit,
    isSubmitting,
    manageCurriculumModalOpen,
    openManageCurriculumModal,
    closeManageCurriculumModal,
    onCurriculumAdded,
    staffOptions,
    initialSchedule,
    isSubjectLoading,
    classroomOptions,
    fetchMoreClassrooms,
    hasMoreRooms,
    isStaff,
  } = useManageSubject();

  const watchedMin = watch("minimumAge");
  const watchedMax = watch("maximumAge");
  const watchedDuration = watch("duration");
  const isMobile = useMediaQuery("(max-width:768px)");

  const [minAge, setMinAge] = useState<number>(0);
  const [maxAge, setMaxAge] = useState<number>(0);

  useEffect(() => {
    const min = watchedMin != null && watchedMin !== "" ? Number(watchedMin) : 0;
    const max = watchedMax != null && watchedMax !== "" ? Number(watchedMax) : 0;
    setMinAge(Number.isFinite(min) ? min : 0);
    setMaxAge(Number.isFinite(max) ? max : 0);
  }, [watchedMin, watchedMax]);

  // keep max >= min (same behavior as manage classroom)
  useEffect(() => {
    if (!minAge) return;
    if (maxAge && maxAge >= minAge) return;
    setValue("maximumAge", String(minAge), { shouldValidate: true, shouldDirty: true });
    setMaxAge(minAge);
  }, [minAge, maxAge, setValue]);

  const maxAgeOptions = useMemo(
    () => ageOptions.filter((age) => parseInt(age, 10) >= (Number(minAge) ?? 0)),
    [minAge],
  );
  const durationOptions = useMemo(
    () =>
      [10, 15, 20, 25, 30, 45, 60].map((minutes) => ({
        name: `${minutes} mins`,
        value: String(minutes),
      })),
    [],
  );

  const formId = "manage-subject-form";
  const formContent = (
    <form id={formId} onSubmit={handleSubmit(onHandleSubmit, onInvalidSubmit)}>
      <DataRenderer isLoading={isSubjectLoading}>
        {() => (
          <Box className="bg-white rounded-2xl md:px-4 flex flex-col flex-1 overflow-y-scroll">
            <Box className="border-b border-border-lightGray py-4 flex flex-col gap-4">
              <Box className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CWTextField
                  control={control}
                  name="subjectName"
                  requiredAsterisk
                  label="Subject Name"
                  placeholder="Enter subject name"
                  labelOnTop
                  labelClassName="!text-sm !font-medium !text-input-gray"
                  inputClasses="mt-1 !text-sm !h-10 !text-input-gray"
                  className="w-full"
                  isRounded={isMobile}
                />
                <CWDropdown
                  name="assignedTeacher"
                  control={control}
                  options={staffOptions}
                  isForm
                  requiredAsterisk
                  textFieldProps={{
                    label: "Assigned Teacher",
                    labelClassName: "!text-sm !font-medium !text-input-gray",
                    placeholder: "Select teacher",
                    inputClasses: "mt-1 !text-sm !h-10 !text-input-gray",
                    labelOnTop: true,
                    className: "!w-full",
                    disabled: isStaff,
                    isRounded: isMobile,
                  }}
                  dialogBodyClassName="!p-0"
                  maxDialogWidth={100}
                />
              </Box>

              <Box className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CWDropdown
                  name="class"
                  control={control}
                  options={classroomOptions}
                  isForm
                  requiredAsterisk
                  textFieldProps={{
                    label: "Class",
                    labelClassName: "!text-sm !font-medium !text-input-gray",
                    placeholder: "Select class",
                    inputClasses: "mt-1 !text-sm !h-10 !text-input-gray",
                    labelOnTop: true,
                    className: "!w-full",
                    isRounded: isMobile,
                  }}
                  dialogBodyClassName="!p-0"
                  maxDialogWidth={100}
                  hasMore={hasMoreRooms}
                  onLoadMore={fetchMoreClassrooms}
                />
                <Box className="flex items-end gap-2">
                  <Box className="flex-1">
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
                        inputClasses: "mt-1 !text-sm !h-10 !text-input-gray",
                        labelOnTop: true,
                        className: "!w-full",
                        isRounded: isMobile,
                      }}
                      dialogBodyClassName="!p-0"
                      maxDialogWidth={100}
                      headerAction={
                        <button
                          type="button"
                          onClick={openManageCurriculumModal}
                          className="text-xs  cursor-pointer font-normal text-brandColor-active"
                        >
                          + Add new curriculum
                        </button>
                      }
                    />
                  </Box>
                </Box>
              </Box>

              <Box className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    isRounded: isMobile,
                  }}
                />
                <CWDropdown
                  requiredAsterisk
                  name="maximumAge"
                  control={control}
                  options={maxAgeOptions}
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
                    isRounded: isMobile,
                  }}
                />
              </Box>
              <Box className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CWDropdown
                  name="duration"
                  control={control}
                  options={durationOptions}
                  isForm
                  requiredAsterisk
                  textFieldProps={{
                    label: "Duration",
                    labelClassName: "!text-sm !font-medium !text-input-gray",
                    placeholder: "Select duration",
                    inputClasses: "mt-1 !text-sm !h-10 !text-input-gray",
                    labelOnTop: true,
                    className: "!w-full",
                    isRounded: isMobile,
                  }}
                  dialogBodyClassName="!p-0"
                  maxDialogWidth={100}
                />
                <CWDropdown
                  name="skills"
                  control={control}
                  options={skillsOptions}
                  isForm
                  isMultipleSelect
                  requiredAsterisk
                  textFieldProps={{
                    label: "Skills",
                    labelClassName: "!text-sm !font-medium !text-input-gray",
                    placeholder: "Select skills",
                    inputClasses: "mt-1 !text-sm !h-10 !text-input-gray",
                    labelOnTop: true,
                    className: "!w-full",
                    isRounded: isMobile,
                  }}
                  dialogBodyClassName="!p-0"
                  maxDialogWidth={100}
                />
              </Box>

              <CWTextArea
                control={control}
                name="description"
                label="Description"
                placeholder="Brief description of the subject....."
                rows={4}
                labelOnTop
                labelClassName="!text-sm !font-medium !text-input-gray"
                inputClasses="mt-1 !text-xs !px-3.5 !pt-3 !pb-4 !text-input-gray"
                className="w-full"
                // isRounded={isMobile}
              />
            </Box>

            <Box className="py-4 space-y-4">
              <Typography className="!text-base !font-semibold !text-primary-dark">
                Subject Schedule
              </Typography>
              <SubjectSchedule
                key={subjectId || "add"}
                setValue={setValue}
                formState={formState}
                initialSchedule={initialSchedule}
                selectedDuration={watchedDuration}
              />
            </Box>
          </Box>
        )}
      </DataRenderer>
    </form>
  );

  const mobileFooter = (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => router.back()}
        className="flex-1 py-3 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Cancel
      </button>
      <button
        type="submit"
        form={formId}
        className="flex-1 py-3 rounded-lg bg-brandColor-active text-white text-sm font-medium hover:opacity-90 disabled:opacity-70"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Saving..." : subjectId ? "Save" : "Add"}
      </button>
    </div>
  );

  if (isMobile) {
    return (
      <MobileFormDrawer
        open
        onClose={() => router.back()}
        title={subjectId ? "Edit Subject" : "Add Subject"}
        footer={mobileFooter}
      >
        <Box className="py-4">{formContent}</Box>
      </MobileFormDrawer>
    );
  }

  return (
    <Box className="h-full p-5 space-y-6 flex flex-col">
      <Box
        className={`flex items-center justify-between ${isMobile ? "py-4 border-b border-border-input px-5" : ""}`}
      >
        <Box className="flex items-center gap-2">
          <ButtonIcon
            className="rounded-full !border !border-brandColor-active/20 !p-2 flex items-center justify-center"
            onClick={() => router.back()}
          >
            <Image src={LeftIcon || "/placeholder.svg"} alt="back" />
          </ButtonIcon>
          <Typography className="!text-xl !font-semibold !text-text-primary">
            {subjectId ? "Edit Subject" : "Add Subject"}
          </Typography>
        </Box>
        <Box className={`flex gap-2 ${isMobile ? "hidden" : ""}`}>
          <Button
            loading={isSubmitting}
            className="!rounded-lg !px-8 !bg-brandColor-active"
            onClick={handleSubmit(onHandleSubmit, onInvalidSubmit)}
          >
            {subjectId ? "Save" : "Add"}
          </Button>
        </Box>
      </Box>

      <Box>{formContent}</Box>

      <ManageCurriculumModal
        open={manageCurriculumModalOpen}
        onClose={closeManageCurriculumModal}
        onCurriculumAdded={onCurriculumAdded}
        onSubmit={() => {}}
        isLoading={isSubmitting}
      />
    </Box>
  );
};

export default ManageSubject;
