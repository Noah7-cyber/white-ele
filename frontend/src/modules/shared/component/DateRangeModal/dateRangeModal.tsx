/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Dialog, Box, Typography } from "@mui/material";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { StaticDatePicker } from "@mui/x-date-pickers/StaticDatePicker";
import dayjs, { type Dayjs } from "dayjs";
import { Button } from "@/modules/shared/component/Button";
import { useEffect, useState } from "react";

type Props = {
  open: boolean;
  title?: string;
  startDate: string;
  endDate: string;
  onClose: () => void;
  onApply: (startDate: string, endDate: string) => void;
};

export function DateRangeModal({
  open,
  title = "Select date range",
  startDate,
  endDate,
  onClose,
  onApply,
}: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [start, setStart] = useState<Dayjs | null>(startDate ? dayjs(startDate) : null);
  const [end, setEnd] = useState<Dayjs | null>(endDate ? dayjs(endDate) : null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setStart(startDate ? dayjs(startDate) : null);
    setEnd(endDate ? dayjs(endDate) : null);
    setError(null);
  }, [open, startDate, endDate]);

  const handleApply = () => {
    if (!start || !end) {
      setError("Please select both dates.");
      return;
    }
    if (start.isAfter(end)) {
      setError("Start date must be before or equal to end date.");
      return;
    }
    setError(null);
    onApply(start.format("YYYY-MM-DD"), end.format("YYYY-MM-DD"));
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth={isMobile}
      fullScreen={isMobile}
      slotProps={{
        paper: {
          className: isMobile
            ? "!rounded-none !w-full !max-w-none !m-0"
            : "!rounded-2xl !w-[820px] !max-w-[95vw]",
        },
      }}
    >
      <Box className={isMobile ? "p-4 flex flex-col gap-4 h-full" : "p-6 flex flex-col gap-4"}>
        <Box
          className={
            isMobile
              ? "flex items-center justify-between gap-2 sticky top-0 z-10 bg-white py-1"
              : "flex items-center justify-between"
          }
        >
          <Typography className="!text-base !font-semibold">{title}</Typography>
          <Box className="flex gap-2 shrink-0">
            <Button
              variant="outlined"
              className="!rounded-lg !px-4 md:!px-6 !bg-background-offwhite/50 !text-primary-dark !border !border-border-table"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button variant="contained" className="!rounded-lg" onClick={handleApply}>
              Apply
            </Button>
          </Box>
        </Box>

        {error && <Typography className="!text-sm !text-red-600">{error}</Typography>}

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Box className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-2">
            <Box className="flex flex-col gap-2">
              <Typography className="!text-sm !font-medium !mb-2">Start date</Typography>
              <Box className="border border-gray-200 rounded-xl p-2 sm:p-3">
                <StaticDatePicker
                  value={start}
                  onChange={(v) => setStart(v)}
                  slotProps={{
                    toolbar: { hidden: true },
                    actionBar: { actions: [] },
                  }}
                />
              </Box>
            </Box>
            <Box className="flex flex-col gap-2">
              <Typography className="!text-sm !font-medium !mb-2">End date</Typography>
              <Box className="border border-gray-200 rounded-xl p-2 sm:p-3">
                <StaticDatePicker
                  value={end}
                  onChange={(v) => setEnd(v)}
                  slotProps={{
                    toolbar: { hidden: true },
                    actionBar: { actions: [] },
                  }}
                />
              </Box>
            </Box>
          </Box>
        </LocalizationProvider>
      </Box>
    </Dialog>
  );
}
