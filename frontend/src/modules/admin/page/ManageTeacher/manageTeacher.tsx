/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { Box, Typography, Grid, CircularProgress } from "@mui/material";
import { ButtonIcon } from "@/modules/shared/component/ButtonIcon";
import { useRouter } from "next/navigation";
import LeftIcon from "@/modules/shared/assets/images/chevronBack.png";
import Image from "next/image";
import { CWTextField } from "@/modules/shared/component/FormFields/CWTextField";
import { Button } from "@/modules/shared/component/Button";
import { CWTextArea } from "@/modules/shared/component/FormFields/CWTextArea";
import useManageTeacher from "./hooks/useManageTeacher";
import User from "@/modules/shared/assets/svgs/userOutline.svg";
import {
  QualificationOptions,
  RoleOptions,
  TitleOptions,
  RelationshipOptions,
  classRoomOption,
} from "./teacher.constant";

import { CWDropdown } from "@/modules/shared/component/FormFields/CWDropdown";
import { FC, useState } from "react";
import { capitalizeFirstLetter } from "@/utils/helpers";
import { DataRenderer } from "@/modules/shared/component/DataRenderer";
import { Controller } from "react-hook-form";
import { useMediaQuery } from "@/utils/hooks/useMediaQuery";
import ScrollableTabBar from "@/layout/Shared/ScrollableTabBar";

interface ManageTeacherModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onCompleteCreation?: () => void;
  isEdit?: boolean;
  teacher?: any;
}

type MobileTab = "general" | "emergency";

export const ManageTeacher: FC<ManageTeacherModalProps> = ({ teacher, isEdit }) => {
  const router = useRouter();
  const isMobile = useMediaQuery("(max-width: 767px)");
  const [mobileTab, setMobileTab] = useState<MobileTab>("general");
  const {
    control,
    teacherId,
    isCreatingTeacher,
    isUpdatingTeacher,
    isLoading,
    isImagePending,
    onUploadImage,
    onHandleSubmit,
    handleSubmit,
    watch,
    setValue,
    classroomOptions,
    formState,
  } = useManageTeacher({ isEdit });

  const selectedImage = watch("selectedImage");

  return (
    <Box className="h-full p-4 md:p-5 space-y-4 md:space-y-6 flex flex-col">
      <Box className="flex items-center justify-between">
        <Box className="flex items-center gap-2">
          <ButtonIcon
            className="rounded-full !border !border-brandColor-active/20 !p- flex items-center justify-center"
            onClick={() => router.back()}
          >
            <Image src={LeftIcon || "/placeholder.svg"} alt="back" />
          </ButtonIcon>
          <Typography className="!text-lg md:!text-xl !font-semibold !text-text-primary">
            {teacherId ? "Edit Teacher" : "Add Teacher"}
          </Typography>
        </Box>
        <Box className="hidden md:flex gap-2">
          <Button
            loading={isCreatingTeacher || isUpdatingTeacher}
            className="!rounded-lg !px-8"
            onClick={handleSubmit(onHandleSubmit)}
          >
            {teacherId ? "Save" : "Save"}
          </Button>
        </Box>
      </Box>

      {/* Mobile Tabs */}
      {isMobile && (
        <ScrollableTabBar className="border-b border-border-lightGray">
          {([
            { id: "general" as MobileTab, label: "General Information" },
            { id: "emergency" as MobileTab, label: "Emergency Contact" },
          ]).map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`shrink-0 whitespace-nowrap pb-2 px-3 cursor-pointer text-sm ${
                mobileTab === tab.id
                  ? "!text-brandColor-active border-b !border-brandColor-active !font-medium"
                  : "text-gray-500"
              }`}
              onClick={() => setMobileTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </ScrollableTabBar>
      )}

      <DataRenderer isLoading={isLoading}>
        {() => (
          <Box className="bg-white rounded-2xl px-4 flex flex-col flex-1 overflow-y-scroll">
            {formState?.errors && Object.keys(formState.errors).length > 0 && (
              <Box className="py-3 px-4 mb-2 rounded-lg bg-red-50 border border-red-200">
                <Typography className="text-sm! text-red-700!">
                  Please fix the errors below before saving. Check required fields and formats.
                </Typography>
              </Box>
            )}

            {/* General Information Section */}
            {(!isMobile || mobileTab === "general") && (
              <>
                <Box className="py-4 border-b border-border-lightGray flex flex-col">
                  <Typography className="!font-bold !text-lg !text-primary-dark">
                    General Information
                  </Typography>
                  <Typography className="!font-normal !text-sm !text-text-gray">
                    {teacherId ? "Update teacher information." : "Basic information about your staff."}
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
                        onChange={onUploadImage}
                      />
                      <label htmlFor="profile-upload" className="cursor-pointer">
                        <div className="w-[88px] relative h-[88px] rounded-xl border-2 border-[#E5E7EB] flex items-center justify-center bg-[#F9FAFB] hover:bg-[#F3F4F6] transition-colors">
                          {selectedImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={selectedImage || "/placeholder.svg"}
                              alt="Profile"
                              className="w-full h-full rounded-xl object-cover"
                            />
                          ) : (
                            <User />
                          )}
                          {isImagePending && (
                            <Box className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                              <CircularProgress />
                            </Box>
                          )}
                          {selectedImage && !isImagePending && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setValue("selectedImage", "");
                              }}
                              className="absolute -top-2.5 -right-2.5 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full !cursor-pointer flex items-center justify-center transition-colors z-10"
                              aria-label="Remove image"
                            >
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="white"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            </button>
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
                            strokeLinecap="round"
                            strokeLinejoin="round"
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

                {/* Main Information Section */}
                <Box className="border-b border-border-lightGray py-4 flex flex-col gap-3">
                  <Box className="flex flex-col md:flex-row gap-3 w-full">
                    <Box className="flex-shrink-0 md:max-w-[140px]">
                      <CWDropdown
                        name="suffix"
                        control={control}
                        options={TitleOptions}
                        isForm
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
                      control={control}
                      name="firstName"
                      label="First Name*"
                      placeholder="Enter first name"
                      labelOnTop
                      labelClassName="!text-sm !font-medium !text-input-gray"
                      inputClasses="mt-1 !text-sm !h-10 !text-input-gray placeholder:!text-input-gray"
                      className="flex-1"
                    />
                    <CWTextField
                      control={control}
                      name="lastName"
                      label="Last Name*"
                      placeholder="Enter last name"
                      labelOnTop
                      labelClassName="!text-sm !font-medium !text-input-gray"
                      inputClasses="mt-1 !text-sm !h-10 !text-input-gray"
                      className="flex-1"
                    />
                  </Box>

                  <Box className="flex flex-col md:flex-row gap-3">
                    <CWTextField
                      control={control}
                      name="phone"
                      label="Phone Number*"
                      placeholder="Enter phone number"
                      labelOnTop
                      labelClassName="!text-sm !font-medium !text-input-gray"
                      inputClasses="mt-1 !text-sm !h-10 !text-input-gray"
                      className="w-full"
                    />
                    <CWTextField
                      control={control}
                      name="email"
                      label="Email Address*"
                      placeholder="Enter email address"
                      labelOnTop
                      labelClassName="!text-sm !font-medium !text-input-gray"
                      inputClasses="mt-1 !text-sm !h-10 !text-input-gray"
                      className="w-full"
                    />
                    <Controller
                      name="assignedClasses"
                      control={control}
                      defaultValue={[]}
                      render={({ field: { value } }) => {
                        const arrayValue = Array.isArray(value) ? value : [];

                        return (
                          <CWDropdown
                            key={`assigned-classes-${classroomOptions.length}`}
                            name="assignedClasses"
                            control={control}
                            options={classroomOptions}
                            isMultipleSelect
                            hasSearch
                            isForm
                            selectedValues={arrayValue}
                            onSelectedValues={(vals: any[]) => {
                              const fullOptions =
                                vals.length > 0
                                  ? vals.map((val: any) => {
                                      const option = classroomOptions.find((opt) => opt.value === val);
                                      return option || { label: val, name: val, value: val };
                                    })
                                  : [];
                              setValue("assignedClasses", fullOptions as any, {
                                shouldValidate: true,
                                shouldDirty: true,
                              });
                            }}
                            textFieldProps={{
                              label: "Assigned Classroom(s)",
                              labelClassName: "!text-sm !font-medium !text-input-gray",
                              placeholder: "Select classroom",
                              inputClasses: "mt-1 !text-sm !h-10 !text-input-gray",
                              labelOnTop: true,
                              className: "!flex !justify-center",
                            }}
                          />
                        );
                      }}
                    />
                  </Box>

                  <Box className="flex flex-col md:flex-row gap-3">
                    <CWDropdown
                      control={control}
                      name="qualification"
                      options={QualificationOptions}
                      isForm
                      textFieldProps={{
                        label: "Qualification(s)*",
                        labelClassName: "!text-sm !font-medium !text-input-gray",
                        placeholder: "Select qualification",
                        inputClasses: "mt-1 !text-sm !h-10 !text-input-gray",
                        labelOnTop: true,
                      }}
                    />
                    <CWDropdown
                      control={control}
                      name="role"
                      options={RoleOptions}
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

                {/* Mobile: Next button */}
                {isMobile && (
                  <Box className="py-4">
                    <Button
                      className="!rounded-lg w-full"
                      onClick={() => setMobileTab("emergency")}
                    >
                      Next
                    </Button>
                  </Box>
                )}
              </>
            )}

            {/* Emergency Contact Section */}
            {(!isMobile || mobileTab === "emergency") && (
              <Box className="py-4 space-y-4">
                <Typography className="!text-lg !font-bold !text-primary-dark">
                  Emergency Contact
                </Typography>
                <Box className="py-4 flex flex-col gap-3">
                  <Box className="flex flex-col md:flex-row gap-3">
                    <Box className="flex-shrink-0 md:max-w-[140px]">
                      <CWDropdown
                        name="emergencyContact.suffix"
                        control={control}
                        options={TitleOptions}
                        isForm
                        textFieldProps={{
                          label: "Title",
                          labelClassName: "!text-sm !font-medium !text-input-gray",
                          placeholder: "Select title",
                          inputClasses: "mt-1 !text-sm !h-10 !text-input-gray",
                          labelOnTop: true,
                        }}
                        dialogBodyClassName="!p-0"
                        maxDialogWidth={100}
                      />
                    </Box>
                    <CWTextField
                      control={control}
                      name="emergencyContact.firstName"
                      label="First Name"
                      placeholder="Enter first name"
                      labelOnTop
                      labelClassName="!text-sm !font-medium !text-input-gray"
                      inputClasses="mt-1 !text-sm !h-10 !text-input-gray"
                      className="w-full"
                    />
                    <CWTextField
                      control={control}
                      name="emergencyContact.lastName"
                      label="Last Name"
                      placeholder="Enter last name"
                      labelOnTop
                      labelClassName="!text-sm !font-medium !text-input-gray"
                      inputClasses="mt-1 !text-sm !h-10 !text-input-gray"
                      className="w-full"
                    />
                  </Box>

                  <Box className="flex flex-col md:flex-row gap-3">
                    <CWDropdown
                      name="emergencyContact.relationship"
                      control={control}
                      options={RelationshipOptions?.map((item: string) => ({
                        name: capitalizeFirstLetter(item),
                        value: item,
                      }))}
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
                      name="emergencyContact.phone"
                      label="Phone Number"
                      placeholder="Enter phone number"
                      labelOnTop
                      labelClassName="!text-sm !font-medium !text-input-gray"
                      inputClasses="mt-1 !text-sm !h-10 !text-input-gray"
                      className="w-full"
                    />
                    <CWTextField
                      control={control}
                      name="emergencyContact.email"
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
                      name="emergencyContact.address"
                      label="Address"
                      placeholder="Enter full address"
                      labelOnTop
                      labelClassName="!text-sm !font-medium !text-input-gray"
                      inputClasses="mt-1 !text-sm !text-input-gray"
                      className="w-full"
                    />
                    <CWTextArea
                      control={control}
                      name="emergencyContact.notes"
                      label="Notes"
                      placeholder="Enter brief description..."
                      labelOnTop
                      labelClassName="!text-xs !font-medium !text-input-gray"
                      inputClasses="mt-1 !text-xs !px-3.5 !py-3 !text-input-gray placeholder:!text-input-gra"
                      className="w-full"
                    />
                  </Box>
                </Box>

                {/* Mobile: Save button */}
                {isMobile && (
                  <Box className="pt-2">
                    <Button
                      loading={isCreatingTeacher || isUpdatingTeacher}
                      className="!rounded-lg w-full"
                      onClick={handleSubmit(onHandleSubmit)}
                    >
                      Save
                    </Button>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        )}
      </DataRenderer>
    </Box>
  );
};

export default ManageTeacher;
