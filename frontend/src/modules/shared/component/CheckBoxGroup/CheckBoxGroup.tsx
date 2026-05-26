/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { Controller, Control } from "react-hook-form";
import { Box, Checkbox, FormControlLabel, Typography, Grid } from "@mui/material";

interface CheckboxGroupProps {
  name: string;
  control: Control<any>; // form control from RHF
  options: string[];
  label?: string;
}

const CheckboxGroup: React.FC<CheckboxGroupProps> = ({ name, control, options, label }) => {
  return (
    <Controller
      name={name}
      control={control}
      defaultValue={[]}
      render={({ field, fieldState }) => {
        const { value, onChange } = field;
        const error = fieldState?.error?.message;

        const handleToggle = (option: string) => {
          if (value.includes(option)) {
            onChange(value.filter((v: string) => v !== option));
          } else {
            onChange([...value, option]);
          }
        };

        return (
          <Grid item xs={12} className="border-b border-border-lightGray py-4">
            <Box>
              {label && (
                <Typography className="!font-normal !text-sm !text-primary-dark">
                  {label}
                </Typography>
              )}
              {error && (
                <Typography className="!text-xs !text-red-600 mt-0.5">{error}</Typography>
              )}
              <Box className="flex flex-wrap gap-6 mt-2">
                {options.map((option) => (
                  <FormControlLabel
                    key={option}
                    control={
                      <Checkbox
                        checked={value.includes(option)}
                        onChange={() => handleToggle(option)}
                        sx={{
                          color: "#D0D5DD",
                          "&.Mui-checked": { color: "#008080" },
                        }}
                      />
                    }
                    label={<span className="text-sm text-[#344054]">{option}</span>}
                  />
                ))}
              </Box>
            </Box>
          </Grid>
        );
      }}
    />
  );
};

export default CheckboxGroup;
