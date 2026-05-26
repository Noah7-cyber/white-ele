/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import type React from "react";
import { useState } from "react";
import { Typography, Box, IconButton, Popover } from "@mui/material";
import type { Control } from "react-hook-form";

import { CWTextField } from "@/modules/shared/component/FormFields/CWTextField";
import { CWTextArea } from "@/modules/shared/component/FormFields/CWTextArea";
import { CWDropdown } from "@/modules/shared/component/FormFields/CWDropdown";
import DeleteIcon from "@/modules/shared/assets/svgs/trashIcon-red.svg";
import AddIcon from "@/modules/shared/assets/svgs/addBorder.svg";
import PersonAddIcon from "@/modules/shared/assets/svgs/addUser.svg";
import GroupIcon from "@/modules/shared/assets/svgs/userGroup.svg";

import { relationshipOptions, parentTitleOptions } from "../child.constant";
import ImageUpload from "@/modules/shared/component/ImageUpload/imageUpload";
import { SelectExistingParentModal } from "../components/SelectExistingParentModal";
import type { ParentProps } from "../child.constant";

export const ParentTab = ({
  control,
  parents,
  addParent,
  addParentFromExisting,
  appendParentFromExisting,
  removeParent,
  isEdit,
}: {
  control: Control<any>;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectedImage: string | null;
  parents: any[];
  addParent: () => void;
  addParentFromExisting?: (parents: ParentProps | ParentProps[]) => void;
  appendParentFromExisting?: (parents: ParentProps | ParentProps[]) => void;
  setParentFromExisting?: (index: number, parent: ParentProps) => void;
  removeParent: (index: number) => void;
  isEdit?: boolean;
}) => {
  const [addMenuAnchor, setAddMenuAnchor] = useState<HTMLElement | null>(null);
  const [selectExistingOpen, setSelectExistingOpen] = useState(false);

  const handleAddNewParent = () => {
    addParent();
    setAddMenuAnchor(null);

    setTimeout(() => {
      const parentListContainer = document.getElementById("parent-list-container");
      if (parentListContainer) {
        parentListContainer.scrollTo({
          top: parentListContainer.scrollHeight,
          behavior: "smooth",
        });
      }
    }, 300);
  };

  const handleOpenSelectExisting = () => {
    setAddMenuAnchor(null);
    setSelectExistingOpen(true);
  };

  const handleSelectExisting = (parents: ParentProps[]) => {
    // Use appendParentFromExisting to add alongside any in-progress parent entries;
    // fall back to addParentFromExisting if appendParentFromExisting is not provided.
    if (appendParentFromExisting) {
      appendParentFromExisting(parents);
    } else {
      addParentFromExisting?.(parents);
    }
    setSelectExistingOpen(false);
  };

  return (
    <Box className="flex flex-col !bg-white rounded-xl py-4 border-b !px-4 md:!px-5 border-border-lightGray">
      {/* HEADER */}
      <Box className="flex flex-col">
        <Box className={parents.length > 0 ? "flex flex-col md:flex-row md:items-center pb-4 w-full md:justify-between gap-2" : ""}>
          <Box className="flex flex-col">
            <Typography className="!font-bold !text-lg !text-primary-dark">
              Parents/Guardian Informations
            </Typography>
            <Typography className="!font-normal !text-sm !text-text-gray">
              Basic information about your child.
            </Typography>
          </Box>

          <button
            onClick={(e) => setAddMenuAnchor(e.currentTarget)}
            className="flex items-center cursor-pointer gap-1.5 px-4 py-2 text-brandColor-active hover:bg-brandColor-active/5 rounded-lg transition-colors self-start md:self-auto"
          >
            <AddIcon />
            <Typography className="!text-sm !font-medium">Add parent/guardian</Typography>
          </button>

          <Popover
            open={Boolean(addMenuAnchor)}
            anchorEl={addMenuAnchor}
            onClose={() => setAddMenuAnchor(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            slotProps={{
              root: {
                className: "!z-[80]",
                style: {
                  backgroundColor: "rgba(0,0,0,0.2)",
                  backdropFilter: "blur(0.2px)",
                },
              },
              paper: {
                className: "!bg-white !rounded-xl !mt-3 !shadow-lg !p-2 !py- !min-w-[220px]",
              },
            }}
            sx={{
              "& .MuiPopover-root, & .MuiPopover-container": {
                backgroundColor: "transparent",
              },
              "& .MuiBackdrop-root": {
                backgroundColor: "rgba(0,0,0,0.2)",
              },
            }}
            PaperProps={{
              style: {
                zIndex: 1000,
              },
            }}
          >
            <button
              type="button"
              onClick={handleAddNewParent}
              className="flex items-center gap-3 w-full cursor-pointer !px-3 !py-2 text-left text-sm text-primary-dark hover:bg-gray-100 transition-colors"
            >
              <PersonAddIcon className="!text-brandColor-active" />
              <span>Add new parent</span>
            </button>
            <button
              type="button"
              onClick={handleOpenSelectExisting}
              className="flex items-center gap-3 w-full cursor-pointer !px-3 !py-2 text-left text-sm text-primary-dark hover:bg-gray-100 transition-colors"
            >
              <GroupIcon className="!text-brandColor-active" />
              <span>Select existing</span>
            </button>
          </Popover>
        </Box>
      </Box>

      <SelectExistingParentModal
        isOpen={selectExistingOpen}
        onClose={() => setSelectExistingOpen(false)}
        onSelect={handleSelectExisting}
        initialSelectedIds={
          parents
            ?.filter((p: { id?: number }) => p?.id != null)
            ?.map((p: { id: number }) => Number(p.id)) ?? []
        }
      />

      {parents.length > 0 &&
        parents.map((parent, index) => (
          <Box
            key={index}
            className="flex flex-col border-t pt-4 pb-4 border-border-lightGray gap-4"
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

            {/* IMAGE UPLOAD */}
            {/* <Grid item xs={12}>
              <div className="border-b border-primary-border pb-4">
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    id={`profile-upload-${index}`}
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <label htmlFor={`profile-upload-${index}`} className="cursor-pointer">
                    <div className="w-[88px] h-[88px] rounded-xl border-2 border-[#E5E7EB] flex items-center justify-center bg-[#F9FAFB] hover:bg-[#F3F4F6] transition-colors">
                      {selectedImage ? (
                        <img
                          src={selectedImage}
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
                      htmlFor={`profile-upload-${index}`}
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
            </Grid> */}
            <ImageUpload
              name={`parents.${index}.photoUrl`}
              control={control}
              label="Profile Photo"
              id={`profile-upload-${index}`}
            />

            {/* PARENT FIELDS */}
            <Box className="flex flex-col gap-3">
              <Box className="flex flex-col md:flex-row gap-3">
                <CWDropdown
                  requiredAsterisk
                  control={control}
                  name={`parents.${index}.suffix`}
                  options={parentTitleOptions}
                  isForm
                  textFieldProps={{
                    label: "Title",
                    placeholder: "Select title",
                    labelOnTop: true,
                    labelClassName: "!text-sm !font-medium !text-input-gray",
                    inputClasses: "mt-1 !text-sm !h-10 !text-input-gray",
                    className: "w-full",
                  }}
                />

                <CWTextField
                  requiredAsterisk
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
                  requiredAsterisk
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
                  requiredAsterisk
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
                  }}
                />

                <CWTextField
                  requiredAsterisk
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
                  requiredAsterisk
                  control={control}
                  name={`parents.${index}.email`}
                  label="Email address"
                  type="email"
                  placeholder="Enter email address"
                  labelOnTop
                  disabled={isEdit}
                  labelClassName="!text-sm !font-medium !text-input-gray"
                  inputClasses="mt-1 !text-sm !h-10 !text-input-gray"
                  className="w-full"
                />
              </Box>

              <CWTextField
                requiredAsterisk
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
                inputClasses="mt-1 !text-xs !px-3.5 !py-3 !text-input-gray"
                className="w-full"
              />
            </Box>
          </Box>
        ))}
    </Box>
  );
};
