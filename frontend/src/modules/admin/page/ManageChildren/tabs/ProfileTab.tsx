/* eslint-disable @typescript-eslint/no-explicit-any */
import { CWTextArea } from "@/modules/shared/component/FormFields/CWTextArea";
import { CWTextField } from "@/modules/shared/component/FormFields/CWTextField";
import { Typography, Box } from "@mui/material";
import React from "react";
import { relationshipOptions, parentTitleOptions, genderOptions } from "../child.constant";
import { Control } from "react-hook-form";
import { CWDropdown } from "@/modules/shared/component/FormFields/CWDropdown";
import CheckboxGroup from "@/modules/shared/component/CheckBoxGroup/CheckBoxGroup";
import ImageUpload from "@/modules/shared/component/ImageUpload/imageUpload";

export default function ProfileTab({
  control,
  classroomOptions,
  studentId,
  mobileSection,
}: {
  control: Control<any>;
  classroomOptions: { name: string; value: string | number }[];
  isClassroomsLoading: boolean;
  handleImageUpload?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  selectedImage?: string | null;
  studentId?: string | number;
  /** When set, only the specified section renders (mobile flow). Undefined = show all (desktop). */
  mobileSection?: "general" | "medical" | "emergency";
}) {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const showGeneral = !mobileSection || mobileSection === "general";
  const showMedical = !mobileSection || mobileSection === "medical";
  const showEmergency = !mobileSection || mobileSection === "emergency";

  return (
    <Box className="flex flex-col !bg-white !px-4 md:!px-5 rounded-xl">
      {/* ─── GENERAL INFORMATION ─────────────────────────────────── */}
      {showGeneral && (
        <>
          <Box className="flex flex-col md:flex-row md:justify-between md:items-center border-b border-border-lightGray gap-2">
            <Box className="py-4 flex flex-col">
              <Typography className="!font-bold !text-lg !text-primary-dark">
                General Information
              </Typography>
              <Typography className="!font-normal !text-sm !text-text-gray">
                Basic information about your child.
              </Typography>
            </Box>
            {studentId && (
              <Box className="flex gap-1 items-center pb-4 md:pb-0">
                <Typography className="!text-sm md:!text-lg !text-text-tertiary/70 !font-normal">
                  ID Number:
                </Typography>
                <Typography className="!text-sm md:!text-lg !text-primary-dark !font-bold">
                  {studentId}
                </Typography>
              </Box>
            )}
          </Box>
          <ImageUpload name="generalInfo.photoUrl" control={control} label="Profile Photo" />

          <Box className="border-b border-border-lightGray py-4 flex flex-col gap-3">
            <Box className="flex flex-col md:flex-row gap-3 w-full">
              <CWTextField
                requiredAsterisk
                control={control}
                name="generalInfo.firstName"
                label="First name"
                placeholder="Enter first name"
                labelOnTop
                labelClassName="!text-sm !font-medium !text-input-gray"
                inputClasses="mt-1 !text-sm !h-10 !text-input-gray"
                className="flex-1"
              />
              <CWTextField
                requiredAsterisk
                control={control}
                name="generalInfo.lastName"
                label="Last name"
                placeholder="Enter last name"
                labelOnTop
                labelClassName="!text-sm !font-medium !text-input-gray"
                inputClasses="mt-1 !text-sm !h-10 !text-input-gray"
                className="flex-1"
              />
              <CWTextField
                control={control}
                name="generalInfo.middleName"
                label="Middle name"
                placeholder="Enter middle name"
                labelOnTop
                labelClassName="!text-sm !font-medium !text-input-gray"
                inputClasses="mt-1 !text-sm !h-10 !text-input-gray"
                className="flex-1"
              />
            </Box>

            <Box className="flex flex-col md:flex-row gap-3 w-full">
              <CWTextField
                requiredAsterisk
                control={control}
                name="generalInfo.dateOfBirth"
                label="Date of birth"
                placeholder="dd/mm/yyyy"
                type="date"
                labelOnTop
                labelClassName="!text-sm !font-medium !text-input-gray"
                inputClasses="mt-1 !text-sm !h-10 !text-input-gray"
                className="flex-1"
              />
              <CWTextField
                requiredAsterisk
                control={control}
                name="generalInfo.enrolmentDate"
                label="Date of enrolment"
                placeholder="dd/mm/yyyy"
                type="date"
                labelOnTop
                labelClassName="!text-sm !font-medium !text-input-gray"
                inputClasses="mt-1 !text-sm !h-10 !text-input-gray"
                className="flex-1"
              />
              <CWDropdown
                control={control}
                name="classrooms"
                options={classroomOptions}
                isForm
                textFieldProps={{
                  label: "Classroom",
                  labelClassName: "!text-sm !font-medium !text-input-gray",
                  placeholder: "Select classroom",
                  inputClasses: "mt-1 !text-sm !h-10 !text-input-gray",
                  labelOnTop: true,
                  className: "!flex !justify-center ",
                }}
              />
            </Box>

            <Box className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
              <Box className="col-span-1">
                <CWDropdown
                  control={control}
                  name="generalInfo.gender"
                  options={genderOptions}
                  isForm
                  requiredAsterisk
                  textFieldProps={{
                    label: "Gender",
                    labelClassName: "!text-sm !font-medium !text-input-gray",
                    placeholder: "Select gender",
                    inputClasses: "mt-1 !text-sm !h-10 !text-input-gray",
                    labelOnTop: true,
                    className: "min-w-[140px]",
                  }}
                />
              </Box>
              <Box className="md:col-span-2">
                <CWTextField
                  requiredAsterisk
                  control={control}
                  name="generalInfo.address"
                  label="Address"
                  placeholder="Enter full address"
                  labelOnTop
                  labelClassName="!text-sm !font-medium !text-input-gray"
                  inputClasses="mt-1 !text-sm !h-10 !text-input-gray"
                  className="w-full"
                />
              </Box>
            </Box>
          </Box>

          <CheckboxGroup name="schedule" control={control} options={days} label="Schedule*" />
        </>
      )}

      {/* ─── MEDICAL INFORMATION ─────────────────────────────────── */}
      {showMedical && (
        <Box className="py-4 space-y-4 border-b border-border-lightGray">
          <Typography className="!text-lg !font-bold !text-primary-dark">
            Medical Information
          </Typography>
          <Box className="py-4 flex flex-col gap-3">
            <Box className="flex flex-col md:flex-row gap-3">
              <CWTextArea
                control={control}
                name="medicalInfo.allergies"
                label="Allergies"
                placeholder="Enter brief description..."
                rows={3}
                labelOnTop
                labelClassName="!text-sm !font-medium !text-input-gray"
                inputClasses="mt-1 !text-xs !px-3.5 !pt-2 !pb-4 !text-input-gray placeholder:!text-input-gra"
                className="w-full"
              />
              <CWTextArea
                control={control}
                name="medicalInfo.medications"
                label="Medications"
                placeholder="Enter brief description..."
                rows={3}
                labelOnTop
                labelClassName="!text-sm !font-medium !text-input-gray"
                inputClasses="mt-1 !text-xs !px-3.5 !pt-2 !pb-4 !text-input-gray placeholder:!text-input-gra"
                className="w-full"
              />
            </Box>
            <Box className="flex flex-col md:flex-row gap-3">
              <CWTextArea
                control={control}
                name="medicalInfo.foodPreferences"
                label="Food preferences"
                placeholder="Enter brief description..."
                rows={3}
                labelOnTop
                labelClassName="!text-sm !font-medium !text-input-gray"
                inputClasses="mt-1 !text-xs !px-3.5 !pt-2 !pb-4 !text-input-gray placeholder:!text-input-gra"
                className="w-full"
              />
              <CWTextArea
                control={control}
                name="medicalInfo.dietRestriction"
                label="Diet Restrictions"
                placeholder="Enter brief description..."
                rows={3}
                labelOnTop
                labelClassName="!text-sm !font-medium !text-input-gray"
                inputClasses="mt-1 !text-xs !px-3.5 !pt-2 !pb-4 !text-input-gray placeholder:!text-input-gra"
                className="w-full"
              />
            </Box>
            <CWTextArea
              requiredAsterisk
              control={control}
              name="medicalInfo.notes"
              label="Notes"
              placeholder="Enter brief description..."
              rows={3}
              labelOnTop
              labelClassName="!text-sm !font-medium !text-input-gray"
              inputClasses="mt-1 !text-xs !px-3.5 !pt-2 !pb-4 !text-input-gray placeholder:!text-input-gra"
              className="w-full"
            />
          </Box>
        </Box>
      )}

      {/* ─── EMERGENCY CONTACT ───────────────────────────────────── */}
      {showEmergency && (
        <Box className="py-4 space-y-4">
          <Typography className="!text-lg !font-bold !text-primary-dark">
            Emergency Contact
          </Typography>
          <Box className=" py-4 flex flex-col gap-3">
            <Box className="flex flex-col md:flex-row gap-3">
              <Box className="md:flex-shrink-0 md:max-w-[140px]">
                <CWDropdown
                  name="emergencyInfo.suffix"
                  control={control}
                  options={parentTitleOptions}
                  isForm
                  requiredAsterisk
                  textFieldProps={{
                    label: "Title",
                    labelClassName: "!text-sm !font-medium !text-input-gray",
                    placeholder: "Select title",
                    inputClasses: "mt-1 !text-sm !h-10 !text-input-gray",
                    labelOnTop: true,
                    className: "!w-full",
                  }}
                  dialogBodyClassName="!p-0"
                  maxDialogWidth={100}
                />
              </Box>
              <CWTextField
                requiredAsterisk
                control={control}
                name="emergencyInfo.firstName"
                label="First Name"
                placeholder="Enter full name"
                labelOnTop
                labelClassName="!text-sm !font-medium !text-input-gray"
                inputClasses="mt-1 !text-sm !h-10 !text-input-gray placeholder:!text-input-gray"
                className="w-full"
              />
              <CWTextField
                requiredAsterisk
                control={control}
                name="emergencyInfo.lastName"
                label="Last Name"
                placeholder="Enter last name"
                labelOnTop
                labelClassName="!text-sm !font-medium placeholder:!text-input-gray"
                inputClasses="mt-1 !text-sm !h-10 !text-input-gray"
                className="w-full"
              />
            </Box>
            <Box className="flex flex-col md:flex-row gap-3">
              <CWDropdown
                control={control}
                name="emergencyInfo.relationship"
                options={relationshipOptions}
                isForm
                requiredAsterisk
                textFieldProps={{
                  label: "Relationship",
                  labelClassName: "!text-sm !font-medium !text-input-gray",
                  placeholder: "Select relationship",
                  inputClasses: "mt-1 !text-sm !h-10 !text-input-gray",
                  labelOnTop: true,
                  className: "!flex !justify-center ",
                }}
                maxDialogWidth={80}
              />
              <CWTextField
                requiredAsterisk
                control={control}
                name="emergencyInfo.phone"
                label="Phone Number"
                placeholder="Enter Phone number"
                labelOnTop
                labelClassName="!text-sm !font-medium !text-input-gray"
                inputClasses="mt-1 !text-sm !h-10 !text-input-gray"
                className="w-full"
              />
              <CWTextField
                requiredAsterisk
                control={control}
                name="emergencyInfo.email"
                label="Email Address"
                type="email"
                placeholder="Enter Email Address"
                labelOnTop
                labelClassName="!text-sm !font-medium !text-input-gray"
                inputClasses="mt-1 !text-sm !h-10 !text-input-gray"
                className="w-full"
              />
            </Box>

            <Box className="flex flex-col gap-4">
              <CWTextField
                requiredAsterisk
                control={control}
                name="emergencyInfo.address"
                label=" Address"
                placeholder="Enter full address"
                labelOnTop
                labelClassName="!text-sm !font-medium !text-input-gray"
                inputClasses="mt-1 !text-sm !text-input-gray placeholder:!text-input-gray"
                className="w-full"
              />
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}
