/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { Controller, Control } from "react-hook-form";
import UserIcon from "@/modules/shared/assets/svgs/userOutline.svg";
import { Grid } from "@mui/material";

interface ImageUploadProps {
  name: string;
  control: Control<any>;
  label?: string;
   id?: string;
}
const ImageUpload: React.FC<ImageUploadProps> = ({ name, control, label, id = "profile-upload" }) => {
  const [preview, setPreview] = useState<string | null>(null);

  return (
    <Controller
      name={name}
      control={control}
      defaultValue={null}
      render={({ field: { value, onChange }, fieldState: { error } }) => {
        // Sync preview with Controller value
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useEffect(() => {
          if (!value) {
            setPreview(null);
            return;
          }
          if (value instanceof File) {
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result as string);
            reader.readAsDataURL(value);
          } else if (typeof value === "string") {
            setPreview(value);
          }
        }, [value]);

        const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const file = e.target.files?.[0];
          if (!file) return;
          onChange(file); // update react-hook-form value
        };

        return (
          <Grid item xs={12}>
            <div className="border-b py-4 border-primary-border">
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  id={id}
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <label  htmlFor={id} className="cursor-pointer">
                  <div className="w-[88px] h-[88px] rounded-xl border-2 border-[#E5E7EB] flex items-center justify-center bg-[#F9FAFB] hover:bg-[#F3F4F6] transition-colors relative">
                    {preview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={preview}
                        alt="Profile"
                        className="w-full h-full rounded-xl object-cover"
                      />
                    ) : (
                      <UserIcon />
                    )}
                    {preview && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onChange(""); // Set to empty string
                          setPreview(null);
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
                    htmlFor={id}
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
                    {preview ? "Replace" : "Upload"}
                  </label>
                  <p className="text-sm text-primary-dark">Max 10 MB files are allowed</p>
                  {error && <p className="text-sm text-red-500 mt-1">{error.message}</p>}
                </div>
              </div>
            </div>
          </Grid>
        );
      }}
    />
  );
};
export default ImageUpload;
