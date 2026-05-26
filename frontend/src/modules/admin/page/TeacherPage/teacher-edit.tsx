"use client";

import type React from "react";
import { Box, Typography, IconButton, Grid } from "@mui/material";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/modules/shared/component/Button";
import LeftIcon from "@/modules/shared/assets/images/chevronBack.png";
import Image from "next/image";
import { CWTextField } from "@/modules/shared/component/FormFields/CWTextField";
import { Dropdown } from "@/modules/shared/component/Dropdown";
import { CWTextArea } from "@/modules/shared/component/FormFields/CWTextArea";
import { useTeacherEdit } from "./hooks/useTeacherEdit";
import User from "@/modules/shared/assets/svgs/userOutline.svg";
import { CWDropdown } from "@/modules/shared/component/FormFields/CWDropdown";

export const TeacherEdit: React.FC = () => {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const { control, teacher, QualificationOptions, selectedImage, handleImageUpload, handleSubmit } =
    useTeacherEdit(id as string);

  if (!teacher) {
    return <div className="p-5">Teacher not found</div>;
  }

  return (
    <Box className="h-full p-5 space-y-6">
      <Box className="flex items-center justify-between">
        <Box className="flex items-center gap-2">
          <IconButton
            className="rounded-full !border !border-brandColor-active/20 !p- flex items-center justify-center"
            onClick={() => router.back()}
          >
            <Image src={LeftIcon || "/placeholder.svg"} alt="back" width={20} height={20} />
          </IconButton>
          <Typography className="!text-xl !font-semibold">Edit Teacher</Typography>
        </Box>
        <Button className="!rounded-lg !px-8" onClick={handleSubmit}>
          Save
        </Button>
      </Box>

      <Box className="bg-white rounded-2xl px-4 flex flex-col">
        <Box className="py-4 border-b border-border-lightGray flex flex-col">
          <Typography className="!font-bold !text-lg !text-primary-dark">
            General Information
          </Typography>
          <Typography className="!font-normal !text-sm !text-text-gray">
            Update teacher information.
          </Typography>
        </Box>

        {/* Profile Image Upload */}
        <Grid item xs={12}>
          <div className="border-b py-4 border-primary-border pb-4">
            <div className="flex items-center gap-4">
              <input
                type="file"
                id="profile-upload"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              <label htmlFor="profile-upload" className="cursor-pointer">
                <div className="w-[88px] h-[88px] rounded-xl border-2 border-[#E5E7EB] flex items-center justify-center bg-[#F9FAFB] hover:bg-[#F3F4F6] transition-colors">
                  {selectedImage ? (
                    <img
                      src={selectedImage || "/placeholder.svg"}
                      alt="Profile"
                      className="w-full h-full rounded-xl object-cover"
                    />
                  ) : (
                    <User />
                  )}
                </div>
              </label>
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="profile-upload"
                  className="flex items-center !max-w-[120px] justify-center gap-2 py-1.5 border border-[#D0D5DD] rounded-lg text-sm font-medium text-primary-dark bg-white hover:bg-[#F9FAFB] cursor-pointer transition-colors"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  {selectedImage ? "Replace" : "Upload"}
                </label>
                <p className="text-sm text-primary-dark">Max 10 MB files are allowed</p>
              </div>
            </div>
          </div>
        </Grid>

        <Box className="border-b border-border-lightGray py-4 flex flex-col gap-3">
          <Box className="flex gap-3 w-full">
            <Box className="flex-shrink-0 max-w-[140px]">
              <CWDropdown
                name="name"
                control={control}
                options={["Miss", "Mrs", "Mr"]}
                isForm
                textFieldProps={{
                  label: "Title",
                  labelClassName: "!text-sm !font-medium !text-input-gray",
                  placeholder: "Select title",
                  inputClasses: "mt-1 !text-sm !h-10 !text-input-gray",
                  labelOnTop: true,
                  className: "!w-full",
                }}
              />
            </Box>
            <CWTextField
              control={control}
              name="firstName"
              label="First Name"
              placeholder="Enter first name"
              labelOnTop
              labelClassName="!text-sm !font-medium !text-input-gray"
              inputClasses="mt-1 !text-sm !h-10 !text-input-gray"
              className="flex-1"
            />
            <CWTextField
              control={control}
              name="lastName"
              label="Last Name"
              placeholder="Enter last name"
              labelOnTop
              labelClassName="!text-sm !font-medium !text-input-gray"
              inputClasses="mt-1 !text-sm !h-10 !text-input-gray"
              className="flex-1"
            />
          </Box>

          <Box className="flex gap-3">
            <CWTextField
              control={control}
              name="phone"
              label="Phone Number"
              placeholder="Enter phone number"
              inputMode="numeric"
              onChange={(e) => {
                e.target.value = e.target.value.replace(/\D/g, "");
              }}
              labelOnTop
              labelClassName="!text-sm !font-medium !text-input-gray"
              inputClasses="mt-1 !text-sm !h-10 !text-input-gray"
              className="w-full"
            />
            <CWTextField
              control={control}
              name="email"
              label="Email Address"
              placeholder="Enter email address"
              labelOnTop
              labelClassName="!text-sm !font-medium !text-input-gray"
              inputClasses="mt-1 !text-sm !h-10 !text-input-gray"
              className="w-full"
            />
            <Dropdown
              options={["Grade 1", "Grade 2", "Grade 3"]}
              isForm
              textFieldProps={{
                label: "Assigned Classroom",
                labelClassName: "!text-sm !font-medium !text-input-gray",
                placeholder: "Select classroom",
                inputClasses: "mt-1 !text-sm !h-10 !text-input-gray",
                labelOnTop: true,
              }}
            />
          </Box>

          <Box className="flex gap-3">
            <Dropdown
              options={QualificationOptions}
              isForm
              textFieldProps={{
                label: "Qualification(s)",
                labelClassName: "!text-sm !font-medium !text-input-gray",
                placeholder: "Select qualification",
                inputClasses: "mt-1 !text-sm !h-10 !text-input-gray",
                labelOnTop: true,
              }}
            />
            <Dropdown
              options={["Lead Teacher", "Assistant Teacher"]}
              isForm
              textFieldProps={{
                label: "Role",
                labelClassName: "!text-sm !font-medium !text-input-gray",
                placeholder: "Select role",
                inputClasses: "mt-1 !text-sm !h-10 !text-input-gray",
                labelOnTop: true,
              }}
            />
            <CWTextField
              control={control}
              name="startDate"
              label="Start Date"
              placeholder="dd/mm/yyyy"
              labelOnTop
              labelClassName="!text-sm !font-medium !text-input-gray"
              inputClasses="mt-1 !text-sm !h-10 !text-input-gray"
              className="w-full"
              type="date"
            />
          </Box>

          <Box>
            <CWTextField
              control={control}
              name="address"
              label="Address"
              placeholder="Enter full address"
              labelOnTop
              labelClassName="!text-sm !font-medium !text-input-gray"
              inputClasses="mt-1 !text-sm !h-10 !text-input-gray"
              className="w-full"
            />
          </Box>
        </Box>

        {/* Emergency Contact Section */}
        <Box className="py-4 space-y-4">
          <Typography className="!text-lg !font-bold !text-primary-dark">
            Emergency Contact
          </Typography>
          <Box className="py-4 flex flex-col gap-3">
            <Box className="flex gap-3">
              <Box className="flex-shrink-0 max-w-[140px]">
                <Dropdown
                  options={["Miss", "Mrs", "Mr"]}
                  isForm
                  textFieldProps={{
                    label: "Title",
                    labelClassName: "!text-sm !font-medium !text-input-gray",
                    placeholder: "Select title",
                    inputClasses: "mt-1 !text-sm !h-10 !text-input-gray",
                    labelOnTop: true,
                  }}
                />
              </Box>
              <CWTextField
                control={control}
                name="emergencyFirstName"
                label="First Name"
                placeholder="Enter first name"
                labelOnTop
                labelClassName="!text-sm !font-medium !text-input-gray"
                inputClasses="mt-1 !text-sm !h-10 !text-input-gray"
                className="w-full"
              />
              <CWTextField
                control={control}
                name="emergencyLastName"
                label="Last Name"
                placeholder="Enter last name"
                labelOnTop
                labelClassName="!text-sm !font-medium !text-input-gray"
                inputClasses="mt-1 !text-sm !h-10 !text-input-gray"
                className="w-full"
              />
            </Box>

            <Box className="flex gap-3">
              <CWDropdown
                name="name"
                control={control}
                options={["Mother", "Father", "Guardian", "Sibling", "Other"]}
                isForm
                textFieldProps={{
                  label: "Relationship",
                  labelClassName: "!text-sm !font-medium !text-input-gray",
                  placeholder: "Select relationship",
                  inputClasses: "mt-1 !text-sm !h-10 !text-input-gray",
                  labelOnTop: true,
                }}
              />
              <CWTextField
                control={control}
                name="emergencyPhone"
                label="Phone Number"
                placeholder="Enter phone number"
                inputMode="numeric"
                onChange={(e) => {
                  e.target.value = e.target.value.replace(/\D/g, "");
                }}
                labelOnTop
                labelClassName="!text-sm !font-medium !text-input-gray"
                inputClasses="mt-1 !text-sm !h-10 !text-input-gray"
                className="w-full"
              />
              <CWTextField
                control={control}
                name="emergencyEmail"
                label="Email Address"
                type="email"
                placeholder="Enter email address"
                labelOnTop
                labelClassName="!text-sm !font-medium !text-input-gray"
                inputClasses="mt-1 !text-sm !h-10 !text-input-gray"
                className="w-full"
              />
            </Box>

            <Box className="flex flex-col gap-4">
              <CWTextField
                control={control}
                name="emergencyAddress"
                label="Address"
                placeholder="Enter full address"
                labelOnTop
                labelClassName="!text-sm !font-medium !text-input-gray"
                inputClasses="mt-1 !text-sm !text-input-gray"
                className="w-full"
              />
              <CWTextArea
                control={control}
                name="notes"
                label="Notes"
                placeholder="Enter brief description..."
                labelOnTop
                labelClassName="!text-sm !font-medium !text-input-gray"
                inputClasses="mt-1 !text-xs !text-input-gray"
                className="w-full"
              />
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default TeacherEdit;
