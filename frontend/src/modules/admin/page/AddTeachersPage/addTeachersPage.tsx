"use client";

import { useState } from "react";

import { Box, Grid, Typography } from "@mui/material";
import LeftIcon from "@/modules/shared/assets/images/chevronBack.png";

import { Button } from "@/modules/shared/component/Button";
import { ButtonIcon } from "@/modules/shared/component/ButtonIcon";
import { CWTextField } from "@/modules/shared/component/FormFields/CWTextField";
import { Dropdown } from "@/modules/shared/component/Dropdown";
import useAddTeachersPage from "./hooks/useAddTeachersPage";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CWTextArea } from "@/modules/shared/component/FormFields/CWTextArea";
import User from "@/modules/shared/assets/svgs/userOutline.svg";
import { CWDropdown } from "@/modules/shared/component/FormFields/CWDropdown";

export default function AddTeachersPage() {
  const router = useRouter();
  // const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  const { control, QualificationOptions, handleSubmit } = useAddTeachersPage();
  return (
    <Box className="h-full p-5 space-y-6">
      <Box className="flex items-center justify-between">
        <Box className="flex items-center gap-2">
          <ButtonIcon
            className="rounded-full !border !border-brandColor-active/20 !p- flex items-center justify-center"
            onClick={() => router.back()}
          >
            <Image src={LeftIcon} alt="" />
          </ButtonIcon>
          <Typography className="!text-xxl !font-semibold">Add Teacher</Typography>
        </Box>
        <Button className="!rounded-lg !px-8" onClick={handleSubmit}>
          Save
        </Button>
      </Box>
      <Box className="bg-white rounded-2xl px-4 flex flex-col ">
        <Box className="py-4 border-b border-border-lightGray flex flex-col">
          <Typography className="!font-bold  !text-lg !text-primary-dark">
            General Information
          </Typography>
          <Typography className="!font-normal !text-sm !text-text-gray">
            Basic information about your staff.
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
              className="flex-1"
            />

            <CWTextField
              control={control}
              name="last_name"
              label="Last Name"
              placeholder="Enter last name"
              labelOnTop
              labelClassName="!text-sm !font-medium placeholder:!text-input-gray"
              inputClasses="mt-1 !text-sm !h-10 !text-input-gray"
              className="flex-1"
            />
          </Box>

          <Box className=" flex gap-3">
            <CWTextField
              control={control}
              name="phone_number"
              label="Phone Number"
              placeholder="Enter phone number"
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
              options={[]}
              isForm
              textFieldProps={{
                label: "Assigned Classroom(s)",
                labelClassName: "!text-sm !font-medium !text-input-gray",
                placeholder: "Select classroom",
                inputClasses: "mt-1 !text-sm !h-10 !text-input-gray",
                labelOnTop: true,
                className: "!flex !justify-center ",
              }}
            />
          </Box>
          <Box className=" flex gap-3">
            <Dropdown
              options={QualificationOptions}
              isForm
              textFieldProps={{
                label: "Qualification(s)",
                labelClassName: "!text-sm !font-medium !text-input-gray",
                placeholder: "Select classroom",
                inputClasses: "mt-1 !text-sm !h-10 !text-input-gray",
                labelOnTop: true,
                className: "!flex !justify-center ",
              }}
              dialogBodyClassName="!p-0"
            />
            <Dropdown
              options={[]}
              isForm
              textFieldProps={{
                label: "Role",
                labelClassName: "!text-sm !font-medium !text-input-gray",
                placeholder: "Select classroom",
                inputClasses: "mt-1 !text-sm !h-10 !text-input-gray",
                labelOnTop: true,
                className: "!flex !justify-center ",
              }}
            />
            <CWTextField
              control={control}
              name="startDate"
              label="Start Date"
              placeholder="dd/mm/yyyy"
              labelOnTop
              labelClassName="!text-sm !font-medium placeholder:!text-input-gray"
              inputClasses="mt-1 !text-sm !h-10 !text-input-gray"
              className="w-full"
              type="date"
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
        <Box className="py-4 space-y-4">
          <Typography className="!text-lg !font-bold !text-primary-dark">
            Emergency Contact
          </Typography>
          <Box className=" py-4 flex flex-col gap-3">
            <Box className=" flex gap-3">
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
            <Box className=" flex gap-3">
              <CWDropdown
                name="name"
                control={control}
                options={["1", "2", "3"]}
                isForm
                textFieldProps={{
                  label: "Assigned Classroom(s)",
                  labelClassName: "!text-sm !font-medium !text-input-gray",
                  placeholder: "Select classroom",
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
              <CWTextArea
                control={control}
                name="notes"
                label="Notes"
                placeholder="Enter brief description..."
                labelOnTop
                labelClassName="!text-sm !font-medium !text-input-gray"
                inputClasses="mt-1 !text-sm !text-input-gray placeholder:!text-input-gra"
                className="w-full"
              />
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
