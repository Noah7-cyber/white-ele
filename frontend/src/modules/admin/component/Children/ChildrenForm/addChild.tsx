"use client";

import React, { useState } from "react";
import { Checkbox, FormControlLabel, Grid, MenuItem, Typography, Box } from "@mui/material";
import { TextField } from "@/modules/shared/component/TextField";
import { User } from "lucide-react";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const classrooms = [
  "Toddlers (Age 2-3)",
  "Pre K (Age 4-5)",
  "Grade 1 (Age 6-7)",
  "Grade 2 (Age 8-9)",
  "Grade 3 (Age 10-11)",
];

const ChildForm: React.FC = () => {
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

  return (
    <form className="bg-white rounded-xl border border-t-0 border-[#E5E7EB] p-5 space-y-8">
      {/* General Information */}
      <div>
        <div className="flex items-center justify-between border-b border-primary-border !rounded-xl pb-4">
          <Box className="  flex flex-col">
            <Typography className="!font-bold  !text-lg !text-primary-dark">
              General Information
            </Typography>
            <Typography className="!font-normal !text-sm !text-text-gray">
              Basic information about your child.
            </Typography>
          </Box>
          <div className="text-right">
            <p className="text-sm text-[#667085]">
              ID number: <span className="text-primary-text-dark font-bold">STU-EJ2024</span>
            </p>
          </div>
        </div>

        <Grid container spacing={3}>
          {/* Upload Section */}
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
                      // eslint-disable-next-line @next/next/no-img-element
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

          <Grid item xs={12} sm={4}>
            <TextField labelOnTop label="First name" placeholder="Enter first name" />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField labelOnTop label="Last name" placeholder="Enter last name" />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField labelOnTop label="Middle name" placeholder="Enter middle name" />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              labelOnTop
              label="Date of birth"
              type="date"
              placeholder="dd/mm/yyyy"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              labelOnTop
              label="Date of enrolment"
              type="date"
              placeholder="dd/mm/yyyy"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField select labelOnTop label="Classroom" placeholder="Select classroom">
              {classrooms.map((room) => (
                <MenuItem key={room} value={room}>
                  {room}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField labelOnTop label="Address" placeholder="Enter full address" />
          </Grid>

          {/* Schedule Section */}
          <Grid item xs={12}>
            <div>
              <label className="block text-sm font-medium text-[#344054] mb-3">Schedule</label>
              <div className="flex flex-wrap gap-6">
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
              </div>
            </div>
          </Grid>
        </Grid>
      </div>

      {/* Medical Information */}
      <div>
        <h3 className="text-lg font-semibold text-[#101828] mb-6">Medical Information</h3>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              labelOnTop
              multiline
              rows={3}
              label="Allergies"
              placeholder="Enter brief description..."
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              labelOnTop
              multiline
              rows={3}
              label="Medications"
              placeholder="Enter brief description..."
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              labelOnTop
              multiline
              rows={3}
              label="Food preferences"
              placeholder="Enter brief description..."
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              labelOnTop
              multiline
              rows={3}
              label="Diet Restrictions"
              placeholder="Enter brief description..."
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              labelOnTop
              multiline
              rows={3}
              label="Notes"
              placeholder="Enter brief description..."
            />
          </Grid>
        </Grid>
      </div>

      {/* Emergency Contact */}
      <div>
        <h3 className="text-lg font-semibold text-[#101828] mb-6">Emergency Contact</h3>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={3}>
            <TextField select labelOnTop label="Title" placeholder="Select title">
              {["Miss", "Mrs", "Mr"].map((title) => (
                <MenuItem key={title} value={title}>
                  {title}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField labelOnTop label="First name" placeholder="Enter first name" />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField labelOnTop label="Last name" placeholder="Enter last name" />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField labelOnTop label="Relationship" placeholder="Select relationship" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField labelOnTop label="Phone number" placeholder="Enter phone number" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField labelOnTop label="Email address" placeholder="Enter email address" />
          </Grid>
          <Grid item xs={12}>
            <TextField labelOnTop label="Address" placeholder="Enter full address" />
          </Grid>
        </Grid>
      </div>
    </form>
  );
};

export default ChildForm;
