/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import * as Yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { Typography, Button, IconButton, MenuItem } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import dayjs, { Dayjs } from "dayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import CalendarIcon from "@/modules/shared/assets/svgs/calendarLinear.svg";
import ClockIcon from "@/modules/shared/assets/svgs/clock.svg";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { tourDynamicEndpoints } from "@/services/tour.service";
import { TextField } from "@/modules/shared/component/TextField";
import { useSearchParams } from "next/navigation";
import { useModalRoute } from "@/utils/hooks/useModalRoute";
import useLeadsAndRequests from "../../page/LeadsAndRequests/hooks/useLeadsAndRequests";

interface RescheduleTourModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onConfirm?: (date: string, time: string, slotId: number) => void;
  isConfirming?: boolean;
  initialDate?: string;
  initialTime?: string;
  tourEventId?: number;
}

interface FormValues {
  date: Dayjs | null;
  time: string;
}

const validationSchema = Yup.object().shape({
  date: Yup.mixed().required("Date is required"),
  time: Yup.string().required("Time is required"),
});

const RescheduleTourModal: React.FC<RescheduleTourModalProps> = ({
  isOpen: propIsOpen,
  onClose: propOnClose,
  onConfirm,
  isConfirming: propIsConfirming,
  initialDate: propInitialDate,
  initialTime: propInitialTime,
  tourEventId: propTourEventId,
}) => {
  const searchParams = useSearchParams();
  const { closeModal } = useModalRoute();
  const { rescheduleBookedTour, isRescheduling: isHookRescheduling } = useLeadsAndRequests();

  // Determine if we are in "route mode" or "prop mode"
  const isRouteMode = searchParams.get("modal") === "reschedule-tour";
  const isOpen = propIsOpen ?? isRouteMode;

  // Get params from URL in route mode
  const urlBookingId = searchParams.get("bookingId");
  const urlTourEventId = searchParams.get("tourEventId");
  const urlSlotId = searchParams.get("slotId");
  const urlInitialDate = searchParams.get("date");
  const urlInitialTime = searchParams.get("time");

  const tourEventId = propTourEventId ?? (urlTourEventId ? Number(urlTourEventId) : undefined);
  const initialDate = propInitialDate ?? urlInitialDate;
  const initialTime = propInitialTime ?? urlInitialTime;
  const isConfirming = propIsConfirming ?? isHookRescheduling;

  const [availableSlots, setAvailableSlots] = useState<any[]>([]);

  const handleClose = () => {
    if (propOnClose) {
      propOnClose();
    } else {
      closeModal();
    }
  };

  const { data: tourEventData, isLoading: isLoadingSlots } = useQueryService<any, any>({
    service: tourDynamicEndpoints.getAvailableTourEvents(tourEventId!),
    options: {
      enabled: !!tourEventId && isOpen,
    },
  });

  useEffect(() => {
    if (tourEventData) {
      const slots: any[] = [];
      const availability = tourEventData?.availability || tourEventData?.data?.availability;

      availability?.forEach((avail: any) => {
        avail?.slots?.forEach((slot: any) => {
          if (!slot.booked) {
            slots.push(slot);
          }
        });
      });
      setAvailableSlots(slots);
    }
  }, [tourEventData]);

  const availableDates = useMemo(() => {
    const dates = new Set<string>();
    availableSlots.forEach((slot) => {
      dates.add(slot.date);
    });
    return dates;
  }, [availableSlots]);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      date: null,
      time: "",
    },
  });

  const selectedDate = watch("date");

  const timesForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    const dateStr = selectedDate.format("YYYY-MM-DD");
    return availableSlots
      .filter((slot) => slot.date === dateStr)
      .map((slot) => slot.startTime)
      .sort();
  }, [selectedDate, availableSlots]);

  useEffect(() => {
    if (isOpen) {
      reset({
        date: initialDate ? dayjs(initialDate) : null,
        time: initialTime || "",
      });
    }
  }, [isOpen, initialDate, initialTime, reset]);

  // Clear time if it's no longer available for the newly selected date
  useEffect(() => {
    const currentTime = watch("time");
    if (currentTime && selectedDate && !timesForSelectedDate.includes(currentTime)) {
      setValue("time", "");
    }
  }, [selectedDate, timesForSelectedDate, watch, setValue]);

  const onSubmit = async (data: FormValues) => {
    if (data.date && data.time) {
      const formattedDate = data.date.format("YYYY-MM-DD");
      const selectedSlot = availableSlots.find(
        (slot) => slot.date === formattedDate && slot.startTime === data.time
      );

      if (selectedSlot) {
        if (onConfirm) {
          // In prop mode, we pass the new slot ID, but the parent (leadsAndRequests) 
          // currently ignores it and uses the stored original ID.
          onConfirm(formattedDate, data.time, selectedSlot?.availabilityId);
        } else if (urlBookingId && urlSlotId) {
          try {
            await rescheduleBookedTour(
              Number(urlBookingId),
              formattedDate,
              data.time,
              Number(urlSlotId)
            );
            // Dispatch custom event to notify calendar to refresh
            window.dispatchEvent(new CustomEvent("tourDeleted"));
            closeModal();
          } catch (error) {
            console.error("Reschedule failed", error);
          }
        }
      }
    }
  };

  const shouldDisableDate = (date: Dayjs) => {
    const dateStr = date.format("YYYY-MM-DD");
    return !availableDates.has(dateStr);
  };

  if (!isOpen) return null;

  const ModalContent = (
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-auto min-w-[35vw] relative overflow-hidden animate-in fade-in zoom-in duration-200">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <Typography className="!text-lg !font-semibold !text-gray-900">Reschedule Tour</Typography>
        <IconButton onClick={handleClose} size="small" className="text-gray-400 hover:text-gray-600 transition-colors">
          <CloseIcon fontSize="medium" />
        </IconButton>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-7">
        <div className="space-y-2">
          <Typography className="!text-sm !font-semibold !text-gray-700">Date</Typography>
          <Controller
            name="date"
            control={control}
            render={({ field }) => (
              <DatePicker
                {...field}
                format="DD/MM/YYYY"
                shouldDisableDate={shouldDisableDate}
                loading={isLoadingSlots}
                slots={{
                  openPickerIcon: () => <CalendarIcon className="w-7 h-7 mr-2 text-gray-400" />,
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    placeholder: "DD/MM/YYYY",
                    error: !!errors.date,
                    helperText: errors.date?.message,
                    sx: {
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "10px",
                        backgroundColor: "#F9FAFB",
                        height: "40px",
                        "& fieldset": { borderColor: "#EAECF0" },
                        "&:hover fieldset": { borderColor: "#D0D5DD" },
                        "&.Mui-focused fieldset": { borderColor: "#008080", borderWidth: "1px" },
                      },
                      "& .MuiInputBase-input": {
                        fontSize: "0.875rem",
                        color: "#1D2939",
                      },
                      "& .MuiFormHelperText-root": {
                        marginLeft: "0",
                        marginTop: "4px",
                      }
                    },
                  } as any,
                }}
              />
            )}
          />
        </div>

        <div className="space-y-2">
          <Typography className="!text-sm !font-semibold !text-gray-700">Time</Typography>
          <Controller
            name="time"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                select
                fullWidth
                placeholder="Select a time"
                disabled={!selectedDate || timesForSelectedDate.length === 0}
                startIcon={<ClockIcon className="w-7 h-7 mr-3 text-gray-400" />}
                errorText={errors.time?.message}
                isError={!!errors.time}
                inputClasses="!h-10"
                className="!bg-[#F9FAFB] !rounded-xl"
              >
                {timesForSelectedDate.length > 0 ? (
                  timesForSelectedDate.map((time) => (
                    <MenuItem key={time} value={time}>
                      {dayjs(`2000-01-01T${time}`).format("hh:mm A")}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled value="">
                    {selectedDate ? "No slots available" : "Select a date first"}
                  </MenuItem>
                )}
              </TextField>
            )}
          />
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-5">
          <Button
            onClick={handleClose}
            variant="outlined"
            className="!px-8 !py-3 !rounded-lg !border-[#D0D5DD] !text-[#344054] !capitalize !font-semibold !text-sm hover:!bg-gray-50 transition-all"
            sx={{ textTransform: "none", boxShadow: "none" }}
            disabled={isConfirming}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            className="!px-10 !py-3 !rounded-lg !bg-[#008080] hover:!bg-[#006666] !text-white !capitalize !font-semibold !text-sm !shadow-none hover:!shadow-md transition-all"
            sx={{ textTransform: "none" }}
            disabled={isConfirming || isLoadingSlots}
          >
            {isConfirming ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </div>
  );

  // If we are in route mode (ModalProvider), we don't need the overlay/fixed container
  // because the ModalProvider's Modal component handles it.
  if (isRouteMode) {
    return ModalContent;
  }

  // Otherwise (e.g. Leads page), we provide our own fixed overlay.
  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      {ModalContent}
    </div>
  );
};

export default RescheduleTourModal;
