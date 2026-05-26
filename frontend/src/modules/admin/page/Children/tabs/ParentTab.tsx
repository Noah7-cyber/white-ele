"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import type React from "react";
import { CWTextField } from "@/modules/shared/component/FormFields/CWTextField";
import { Typography, Box, Grid, IconButton } from "@mui/material";
import type { Control } from "react-hook-form";
import { CWTextArea } from "@/modules/shared/component/FormFields/CWTextArea";
import User from "@/modules/shared/assets/svgs/userOutline.svg";
import DeleteIcon from "@/modules/shared/assets/svgs/trashIcon-red.svg";
import AddIcon from "@/modules/shared/assets/svgs/addBorder.svg";
import { CWDropdown } from "@/modules/shared/component/FormFields/CWDropdown";
import { relationshipOptions } from "../child.constant";
export const ParentTab = ({
  control,
  handleImageUpload,
  selectedImage,
  parents,
  addParent,
  removeParent,
}: {
  control: Control<any>;
  handleImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  selectedImage: string | null;
  parents: any[];
  addParent: () => void;
  removeParent: (index: number) => void;
}) => {
  return (
    <Box className="flex flex-col !bg-white rounded-xl py-4 border-b !px-4 md:!px-5 border-border-lightGray">
      {/* Header */}
      <Box className="flex flex-col">
        <Box
          className={parents.length > 0 ? "flex flex-col md:flex-row md:items-center pb-4 w-full md:justify-between gap-2" : ""}
        >
          <Box className="flex flex-col">
            <Typography className="!font-bold  !text-lg !text-primary-dark">
              Parents/Guardian Informations
            </Typography>
            <Typography className="!font-normal !text-sm !text-text-gray">
              Basic information about your child.
            </Typography>
          </Box>
          <button
            onClick={addParent}
            className="flex items-center cursor-pointer gap-1.5 px-4 py-2 text-brandColor-active hover:bg-brandColor-active/5 rounded-lg transition-colors self-start md:self-auto"
          >
            <AddIcon />
            <Typography className="!text-sm !font-medium">Add new parent/guardian</Typography>
          </button>
        </Box>
      </Box>

      {/* Parent Forms */}
      {parents && parents.length > 0 && (
        <>
          {parents.map((parent, index) => (
            <Box
              key={index}
              className="flex flex-col border-t pt-4 pb-4 border-border-lightGray  gap-4"
            >
              {parents.length > 1 && (
                <Box className="flex items-center justify-between">
                  <Typography className="!font-semibold !text-base !text-primary-dark">
                    Parent {index + 1}
                  </Typography>

                  <IconButton
                    onClick={() => removeParent(index)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              )}
              <Grid item xs={12}>
                <div className=" border-b  border-primary-border pb-4">
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
                            src={selectedImage}
                            alt="Profile"
                            className="w-full h-full rounded-xl object-cover"
                          />
                        ) : (
                          <User className="" />
                        )}
                      </div>
                    </label>
                    <div className="flex flex-col gap-2">
                      <label
                        htmlFor="profile-upload"
                        className="flex items-center !max-w-[120px] justify-center gap-2  py-1.5 border border-[#D0D5DD] rounded-lg text-sm font-medium text-primary-dark bg-white hover:bg-[#F9FAFB] cursor-pointer transition-colors"
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
              {/* Parent Form Fields */}
              <Box className="flex flex-col gap-3">
                <Box className="flex flex-col md:flex-row gap-3">
                  <CWTextField
                    control={control}
                    name={`parents.${index}.title`}
                    label="Title"
                    placeholder="Select title"
                    labelOnTop
                    labelClassName="!text-sm !font-medium !text-input-gray"
                    inputClasses="mt-1 !text-sm !h-10 !text-input-gray"
                    className="w-full"
                  />
                  <CWTextField
                    control={control}
                    name={`parents.${index}.firstName`}
                    label="First name"
                    placeholder="Enter first name"
                    labelOnTop
                    labelClassName="!text-sm !font-medium !text-input-gray"
                    inputClasses="mt-1 !text-sm !h-10 !text-input-gray"
                    className="w-full"
                  />
                  <CWTextField
                    control={control}
                    name={`parents.${index}.lastName`}
                    label="Last name"
                    placeholder="Enter last name"
                    labelOnTop
                    labelClassName="!text-sm !font-medium !text-input-gray"
                    inputClasses="mt-1 !text-sm !h-10 !text-input-gray"
                    className="w-full"
                  />
                </Box>

                <Box className="flex flex-col md:flex-row gap-3">
                  <CWDropdown
                    control={control}
                    name={`parents.${index}.relationship`}
                    options={relationshipOptions}
                    isForm
                    textFieldProps={{
                      label: "Relationship",
                      labelClassName: "!text-sm !font-medium !text-input-gray",
                      placeholder: "Select relationship",
                      inputClasses: "mt-1 !text-sm !h-10 !text-input-gray",
                      labelOnTop: true,
                      className: "!flex !justify-center ",
                    }}
                  />
                  <CWTextField
                    control={control}
                    name={`parents.${index}.phone`}
                    label="Phone number"
                    placeholder="Enter phone number"
                    labelOnTop
                    labelClassName="!text-sm !font-medium !text-input-gray"
                    inputClasses="mt-1 !text-sm !h-10 !text-input-gray"
                    className="w-full"
                  />
                  <CWTextField
                    control={control}
                    name={`parents.${index}.email`}
                    label="Email address"
                    type="email"
                    placeholder="Enter email address"
                    labelOnTop
                    labelClassName="!text-sm !font-medium !text-input-gray"
                    inputClasses="mt-1 !text-sm !h-10 !text-input-gray"
                    className="w-full"
                  />
                </Box>

                <CWTextField
                  control={control}
                  name={`parents.${index}.address`}
                  label="Address"
                  placeholder="Enter full address"
                  labelOnTop
                  labelClassName="!text-sm !font-medium !text-input-gray"
                  inputClasses="mt-1 !text-sm !h-10 !text-input-gray"
                  className="w-full"
                />

                <CWTextArea
                  control={control}
                  name={`parents.${index}.notes`}
                  label="Notes"
                  placeholder="Enter brief description..."
                  labelOnTop
                  labelClassName="!text-sm !font-medium !text-input-gray"
                  inputClasses="mt-1 !text-xs !px-3.5 !py-3 !text-input-gray placeholder:!text-input-gra"
                  className="w-full"
                />
              </Box>
            </Box>
          ))}
        </>
      )}
    </Box>
  );
};
