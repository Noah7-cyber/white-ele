"use client";

import React from "react";
import { Box, Typography, Divider, Button, Grid } from "@mui/material";
import { Controller } from "react-hook-form";
import useResetKioskPin from "./hooks/useResetKioskPin";
import { TextField } from "@/modules/shared/component/TextField";

const limitPinInput = (v: string) => v.replace(/\D/g, "").slice(0, 4);

export default function ResetKioskPin() {
  const { control, handleSubmit, isResettingPin, reset } = useResetKioskPin();

  return (
    <Box className="w-full">
      <Box className="bg-white p-4 rounded-xl border border-[#EAECF0]">
        <Box className="mb-4">
          <Typography className="!text-md !mb-1 !font-bold !text-[#101828]">Reset Kiosk PIN</Typography>
          <Typography className="!text-xs !text-[#667085]">
            Enter a new 4-digit PIN for kiosk clock-in/clock-out.
          </Typography>
        </Box>
        
        <Divider className="!mb-6" />

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Controller
                name="newPin"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(limitPinInput(e.target.value))}
                    label="New PIN"
                    placeholder="Enter 4-digit PIN"
                    type="password"
                    labelOnTop
                    inputMode="numeric"
                    inputProps={{ maxLength: 4 }}
                    errorText={error?.message}
                    isError={!!error}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="confirmPin"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(limitPinInput(e.target.value))}
                    label="Confirm PIN"
                    placeholder="Confirm 4-digit PIN"
                    type="password"
                    labelOnTop
                    inputMode="numeric"
                    inputProps={{ maxLength: 4 }}
                    errorText={error?.message}
                    isError={!!error}
                  />
                )}
              />
            </Grid>
          </Grid>

          <Box className="flex justify-end gap-3 mt-8">
            <Button
              variant="outlined"
              onClick={() => reset()}
              className="!border-[#D0D5DD] !text-[#344054] !rounded-lg !px-6 !py-2.5 !capitalize !font-medium !text-sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isResettingPin}
              className="!bg-[#008080] !text-white !rounded-lg !px-6 !py-2.5 !capitalize !font-medium !text-sm hover:!bg-[#006666] !min-w-[120px]"
            >
              {isResettingPin ? "Saving..." : "Save PIN"}
            </Button>
          </Box>
        </form>
      </Box>
    </Box>
  );
}