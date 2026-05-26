/* eslint-disable @typescript-eslint/no-explicit-any */
import { CWTextArea } from "@/modules/shared/component/FormFields/CWTextArea";
import { CWTextField } from "@/modules/shared/component/FormFields/CWTextField";
import { Typography, Grid, Box, FormControlLabel, Checkbox } from "@mui/material";
import UserIcon from "@/modules/shared/assets/svgs/userOutline.svg";
import React from "react";
// import { Dropdown } from "react-chat-elements";
import { Dropdown } from "@/modules/shared/component/Dropdown";
import { classroomOptions, relationshipOptions } from "../child.constant";
import { Control } from "react-hook-form";
import { CWDropdown } from "@/modules/shared/component/FormFields/CWDropdown";

export default function ProfileTab({
  control,
  handleImageUpload,
  selectedImage,
  mobileSection,
}: {
  control: Control<any>;
  handleImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  selectedImage: string | null;
  /** When set, only the specified section renders (mobile flow). Undefined = show all (desktop). */
  mobileSection?: "general" | "medical" | "emergency";
}) {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  const showGeneral = !mobileSection || mobileSection === "general";
  const showMedical = !mobileSection || mobileSection === "medical";
  const showEmergency = !mobileSection || mobileSection === "emergency";

  return (
    <Box className="flex flex-col !bg-white !px-4 md:!px-5 rounded-xl">
      {showGeneral && (<>
      <Box className="py-4 border-b border-border-lightGray flex flex-col">
        <Typography className="!font-bold !text-lg !text-primary-dark">
          General Information
        </Typography>
        <Typography className="!font-normal !text-sm !text-text-gray">
          Basic information about your child.
        </Typography>
      </Box>
      <Grid item xs={12}>
        <div className=" border-b py-4 border-primary-border pb-4">
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
                  <UserIcon className="" />
                )}
              </div>
            </label>
            <div className="flex flex-col gap-2">
              <label
                htmlFor="profile-upload"
                className="flex items-center !max-w-[120px] justify-center gap-2  py-1.5 border border-[#D0D5DD] rounded-lg text-sm !font-normal text-primary-dark bg-white hover:bg-[#F9FAFB] cursor-pointer transition-colors"
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

      <Box className="border-b border-border-lightGray py-4 flex flex-col gap-3">
        <Box className="flex flex-col md:flex-row gap-3 w-full">
          <CWTextField
            control={control}
            name="firstName"
            label="First name"
            placeholder="Enter first name"
            labelOnTop
            labelClassName="!text-sm !font-medium !text-input-gray"
            inputClasses="mt-1 !text-sm !h-10 !text-input-gray"
            className="flex-1"
          />
          <CWTextField
            control={control}
            name="lastName"
            label="Last name"
            placeholder="Enter last name"
            labelOnTop
            labelClassName="!text-sm !font-medium !text-input-gray"
            inputClasses="mt-1 !text-sm !h-10 !text-input-gray"
            className="flex-1"
          />
          <CWTextField
            control={control}
            name="middleName"
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
            control={control}
            name="dateOfBirth"
            label="Date of birth"
            placeholder="dd/mm/yyyy"
            type="date"
            labelOnTop
            labelClassName="!text-sm !font-medium !text-input-gray"
            inputClasses="mt-1 !text-sm !h-10 !text-input-gray"
            className="flex-1"
          />
          <CWTextField
            control={control}
            name="dateOfEnrolment"
            label="Date of enrolment"
            placeholder="dd/mm/yyyy"
            type="date"
            labelOnTop
            labelClassName="!text-sm !font-medium !text-input-gray"
            inputClasses="mt-1 !text-sm !h-10 !text-input-gray"
            className="flex-1"
          />
          <Dropdown
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

        <Box className="">
          <CWTextField
            control={control}
            name="address"
            label=" Address"
            placeholder="Enter full address"
            labelOnTop
            labelClassName="!text-sm !font-medium !text-input-gray"
            inputClasses="mt-1 !text-sm !h-10 !text-input-gray"
            className="w-full"
          />
        </Box>
      </Box>

      <Grid item xs={12} className="border-b border-border-lightGray py-4">
        <Box>
          <Typography className="!font-normal  !text-sm !text-primary-dark">Schedule</Typography>
          <Box className="flex flex-wrap gap-6">
            {days.map((day) => (
              <FormControlLabel
                key={day}
                control={
                  <Checkbox
                    sx={{
                      color: "#D0D5DD",
                      "&.Mui-checked": {
                        color: "#008080",
                      },
                    }}
                  />
                }
                label={<span className="text-sm text-[#344054]">{day}</span>}
              />
            ))}
          </Box>
        </Box>
      </Grid>
      </>)}

      {showMedical && (
      <Box className="py-4 space-y-4 border-b border-border-lightGray">
        <Typography className="!text-lg !font-bold !text-primary-dark">
          Medical Information
        </Typography>
        <Box className="py-4 flex flex-col gap-3">
          <Box className="flex flex-col md:flex-row gap-3">
            <CWTextArea
              control={control}
              name="allergies"
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
              name="medications"
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
              name="foodPreferences"
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
              name="dietRestrictions"
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
            control={control}
            name="notes"
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

      {showEmergency && (
      <Box className="py-4 space-y-4">
        <Typography className="!text-lg !font-bold !text-primary-dark">
          Emergency Contact
        </Typography>
        <Box className=" py-4 flex flex-col gap-3">
          <Box className="flex flex-col md:flex-row gap-3">
            <Box className="md:flex-shrink-0 md:max-w-[140px]">
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
                dialogBodyClassName="!p-0"
                maxDialogWidth={100}
              />
            </Box>
            <CWTextField
              control={control}
              name="first_name"
              label="First Name"
              placeholder="Enter full name"
              labelOnTop
              labelClassName="!text-sm !font-medium !text-input-gray"
              inputClasses="mt-1 !text-sm !h-10 !text-input-gray placeholder:!text-input-gray"
              className="w-full"
            />
            <CWTextField
              control={control}
              name="last_name"
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
              name="relationship"
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
              name="phone_number"
              label="Phone Number"
              placeholder="Enter Phone number"
              labelOnTop
              labelClassName="!text-sm !font-medium !text-input-gray"
              inputClasses="mt-1 !text-sm !h-10 !text-input-gray"
              className="w-full"
            />
            <CWTextField
              control={control}
              name="email"
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
              control={control}
              name="address"
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
