/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Dropdown } from "@/modules/shared/component/Dropdown";
import { TextField } from "@/modules/shared/component/TextField";
import DeleteIcon from "@/modules/shared/assets/svgs/red-thrash.svg";
import { useMediaQuery } from "@/utils/hooks/useMediaQuery";
import { Modal } from "@/modules/shared/component/modal/modal";
import { Box, Typography, IconButton } from "@mui/material";
import CloseIcon from "@/modules/shared/assets/svgs/closeIcon.svg";
import {
  DaySchedule,
  defaultSlot,
  meridiemOptions,
  TimeSlot,
  weekdays,
  weekdaysOnly,
  weekendsOnly,
  parseHourInput,
  parseMinuteInput,
  validateHour,
  validateMinute,
} from "@/modules/admin/page/CreateTourPage/tour.constants";

interface SubjectScheduleSlot {
  day: string;
  startHour?: number | null;
  startMinute?: number | null;
  startMeridiem?: string | null;
  endHour?: number | null;
  endMinute?: number | null;
  endMeridiem?: string | null;
}

interface SubjectScheduleProps {
  setValue: any;
  formState?: any;
  /** When editing: pre-filled schedule; syncs into component once when set */
  initialSchedule?: SubjectScheduleSlot[];
  selectedDuration?: string;
}

/** Compute duration in minutes from start to end (12h format). Handles overnight (end before start = next day). */
function normalizeMeridiem(value: string | null | undefined): "AM" | "PM" {
  return String(value ?? "")
    .trim()
    .toUpperCase() === "PM"
    ? "PM"
    : "AM";
}

function toMinutesFrom12h(hour: number, minute: number, meridiem: string): number {
  const safeMeridiem = normalizeMeridiem(meridiem);
  let hour24 = hour % 12;
  if (safeMeridiem === "PM") hour24 += 12;
  return hour24 * 60 + minute;
}

function minutesBetween12h(
  startHour: number,
  startMin: number,
  startMeridiem: string,
  endHour: number,
  endMin: number,
  endMeridiem: string,
): number {
  const startMins = toMinutesFrom12h(startHour, startMin, startMeridiem);
  let endMins = toMinutesFrom12h(endHour, endMin, endMeridiem);
  if (endMins <= startMins) endMins += 24 * 60; // next day
  return endMins - startMins;
}

function to24Hour(hour: number, meridiem: string): number {
  const normalized = normalizeMeridiem(meridiem);
  if (normalized === "AM") return hour === 12 ? 0 : hour;
  return hour === 12 ? 12 : hour + 12;
}

function formatTimeForInput(hour: number | null, minute: number | null, meridiem: string | null): string {
  if (hour == null || minute == null || !meridiem) return "";
  const hour24 = to24Hour(hour, meridiem);
  return `${String(hour24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function parseTimeInput(value: string): { hour: number; minute: number; meridiem: "AM" | "PM" } | null {
  if (!value || !value.includes(":")) return null;
  const [hourRaw, minuteRaw] = value.split(":");
  const hour24 = Number(hourRaw);
  const minute = Number(minuteRaw);
  if (!Number.isFinite(hour24) || !Number.isFinite(minute) || hour24 < 0 || hour24 > 23) return null;

  const meridiem: "AM" | "PM" = hour24 >= 12 ? "PM" : "AM";
  const hour12Raw = hour24 % 12;
  const hour = hour12Raw === 0 ? 12 : hour12Raw;

  return { hour, minute, meridiem };
}

function getPresetDays(preset: string): string[] {
  if (preset === "Weekends") return weekendsOnly;
  if (preset === "Everyday") return weekdays;
  return weekdaysOnly;
}

function buildDaysFromPreset(preset: string, maxDays: number = 1): DaySchedule[] {
  const dayList = getPresetDays(preset);
  const daysToShow = dayList.slice(0, maxDays);
  return daysToShow.map((day) => ({
    id: Math.random().toString(36).substr(2, 9),
    day,
    slots: [defaultSlot()],
  }));
}

function buildDaysFromSchedule(slots: SubjectScheduleSlot[]): DaySchedule[] {
  return slots.map((s) => ({
    id: Math.random().toString(36).substr(2, 9),
    day: s.day || "Select Day",
    slots: [
      {
        id: Math.random().toString(36).substr(2, 9),
        startHour: s.startHour ?? null,
        startMinute: s.startMinute ?? null,
        startMeridiem: s.startMeridiem ?? "AM",
        endHour: s.endHour ?? null,
        endMinute: s.endMinute ?? null,
        endMeridiem: s.endMeridiem ?? "AM",
      },
    ],
  }));
}

/** Subject schedule: same UI as Create Tour availability but preset "Everyday" and only one day visible by default. */
const SubjectSchedule = ({
  setValue,
  formState,
  initialSchedule,
  selectedDuration,
}: SubjectScheduleProps) => {
  const isMobile = useMediaQuery("(max-width:768px)");
  const scheduleErrors = formState?.errors?.schedule;
  const [preset] = useState<string>("Everyday");
  const [days, setDays] = useState<DaySchedule[]>(() =>
    initialSchedule?.length
      ? buildDaysFromSchedule(initialSchedule)
      : buildDaysFromPreset("Everyday", 1),
  );

  const presetDayList = getPresetDays(preset);
  const hasAppliedInitial = useRef(false);

  useEffect(() => {
    if (initialSchedule?.length && !hasAppliedInitial.current) {
      hasAppliedInitial.current = true;
      setDays(buildDaysFromSchedule(initialSchedule));
    }
  }, [initialSchedule]);

  const getDayOptionsForRow = (dayIdx: number): string[] => {
    return presetDayList.filter(
      (day) =>
        day === days[dayIdx]?.day ||
        !days.some((d, j) => j !== dayIdx && d.day === day && d.day !== "Select Day"),
    );
  };

  const canAddDay = days.length < presetDayList.length;
  const selectedDurationMinutes = Number(selectedDuration);

  const applyDurationToSlot = useCallback(
    (slot: TimeSlot): TimeSlot => {
      if (!Number.isFinite(selectedDurationMinutes) || selectedDurationMinutes <= 0) return slot;
      if (
        slot.startHour == null ||
        slot.startMinute == null ||
        !slot.startMeridiem ||
        !meridiemOptions.includes(normalizeMeridiem(slot.startMeridiem))
      ) {
        return slot;
      }

      const totalStartMinutes = toMinutesFrom12h(
        slot.startHour,
        slot.startMinute,
        slot.startMeridiem,
      );
      const totalEndMinutes = (totalStartMinutes + selectedDurationMinutes) % (24 * 60);
      const end24 = Math.floor(totalEndMinutes / 60);
      const endMinute = totalEndMinutes % 60;
      const endMeridiem = end24 >= 12 ? "PM" : "AM";
      const endHourRaw = end24 % 12;
      const endHour = endHourRaw === 0 ? 12 : endHourRaw;

      return {
        ...slot,
        endHour,
        endMinute,
        endMeridiem,
      };
    },
    [selectedDurationMinutes],
  );

  const removeSlot = (dayIndex: number, slotId: string) => {
    setDays((prev) =>
      prev.map((day, index) => {
        if (index === dayIndex) {
          const newSlots = day.slots.filter((slot) => slot.id !== slotId);
          return {
            ...day,
            slots: newSlots.length > 0 ? newSlots : [defaultSlot()],
          };
        }
        return day;
      }),
    );
  };

  const addDay = () => {
    const newDay: DaySchedule = {
      id: Math.random().toString(36).substr(2, 9),
      day: "Select Day",
      slots: [defaultSlot()],
    };
    setDays((prev) => [...prev, newDay]);
  };

  const removeDay = (dayIndex: number) => {
    setDays((prev) => prev.filter((_, index) => index !== dayIndex));
  };

  // Focus-based editing: while focused, show raw string (no padding); on blur, parse and pad
  const [focusedTimeField, setFocusedTimeField] = useState<string | null>(null);
  const [timeEditValue, setTimeEditValue] = useState("");
  const [dayPickerIndex, setDayPickerIndex] = useState<number | null>(null);

  const timeFieldKey = (dayIdx: number, slotId: string, field: string) =>
    `${dayIdx}-${slotId}-${field}`;

  const getTimeDisplayValue = (
    dayIdx: number,
    slotId: string,
    field: "startHour" | "endHour" | "startMinute" | "endMinute",
    slotValue: number | null,
  ) => {
    const key = timeFieldKey(dayIdx, slotId, field);
    if (focusedTimeField === key) return timeEditValue;
    return slotValue != null ? slotValue.toString().padStart(2, "0") : "";
  };

  const handleTimeFocus = (
    dayIdx: number,
    slotId: string,
    field: "startHour" | "endHour" | "startMinute" | "endMinute",
    slotValue: number | null,
  ) => {
    const key = timeFieldKey(dayIdx, slotId, field);
    setFocusedTimeField(key);
    setTimeEditValue(slotValue != null ? String(slotValue) : "");
  };

  const handleHourChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    dayIndex: number,
    slotId: string,
    field: "startHour" | "endHour",
  ) => {
    const raw = e.target.value.replace(/\D/g, "");
    setTimeEditValue(raw);
    const parsed = parseHourInput(raw);
    updateSlot(dayIndex, slotId, field, parsed);
  };

  const handleMinuteChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    dayIndex: number,
    slotId: string,
    field: "startMinute" | "endMinute",
  ) => {
    const raw = e.target.value.replace(/\D/g, "");
    setTimeEditValue(raw);
    const parsed = parseMinuteInput(raw);
    updateSlot(dayIndex, slotId, field, parsed);
  };

  const handleTimeBlur = (
    dayIndex: number,
    slotId: string,
    field: "startHour" | "endHour" | "startMinute" | "endMinute",
    slotValue: number | null,
  ) => {
    setFocusedTimeField(null);
    if (field === "startHour" || field === "endHour") {
      if (slotValue != null) {
        const clamped = validateHour(String(slotValue));
        if (clamped !== slotValue) updateSlot(dayIndex, slotId, field, clamped);
      }
    } else {
      if (slotValue != null) {
        const clamped = validateMinute(String(slotValue));
        if (clamped !== slotValue) updateSlot(dayIndex, slotId, field, clamped);
      }
    }
  };

  const updateSlot = (
    dayIndex: number,
    slotId: string,
    field: keyof TimeSlot,
    value: string | number | null,
  ) => {
    setDays((prev) =>
      prev.map((day, index) => {
        if (index === dayIndex) {
          const newSlots = day.slots.map((slot) => {
            if (slot.id !== slotId) return slot;
            const updatedSlot = { ...slot, [field]: value };
            if (
              field === "startHour" ||
              field === "startMinute" ||
              field === "startMeridiem" ||
              field === "endHour" ||
              field === "endMinute" ||
              field === "endMeridiem"
            ) {
              return applyDurationToSlot(updatedSlot);
            }
            return updatedSlot;
          });
          return { ...day, slots: newSlots };
        }
        return day;
      }),
    );
  };

  const handleMobileTimeChange = (
    dayIndex: number,
    slotId: string,
    type: "start" | "end",
    value: string,
  ) => {
    const parsed = parseTimeInput(value);
    if (!parsed) return;

    if (type === "start") {
      updateSlot(dayIndex, slotId, "startHour", parsed.hour);
      updateSlot(dayIndex, slotId, "startMinute", parsed.minute);
      updateSlot(dayIndex, slotId, "startMeridiem", parsed.meridiem);
      return;
    }

    updateSlot(dayIndex, slotId, "endHour", parsed.hour);
    updateSlot(dayIndex, slotId, "endMinute", parsed.minute);
    updateSlot(dayIndex, slotId, "endMeridiem", parsed.meridiem);
  };

  useEffect(() => {
    if (!Number.isFinite(selectedDurationMinutes) || selectedDurationMinutes <= 0) return;
    setDays((prev) =>
      prev.map((day) => ({
        ...day,
        slots: day.slots.map((slot) => applyDurationToSlot(slot)),
      })),
    );
  }, [selectedDurationMinutes, applyDurationToSlot]);

  useEffect(() => {
    const raw = days.flatMap((day) =>
      day.slots.map((slot) => ({
        day: day.day,
        startHour: slot.startHour,
        startMinute: slot.startMinute,
        startMeridiem: slot.startMeridiem,
        endHour: slot.endHour,
        endMinute: slot.endMinute,
        endMeridiem: slot.endMeridiem,
      })),
    );
    const filtered = raw.filter(
      (slot) =>
        slot.day &&
        slot.startHour != null &&
        slot.startMinute != null &&
        slot.startMeridiem &&
        slot.endHour != null &&
        slot.endMinute != null &&
        slot.endMeridiem,
    );
    setValue("schedule", filtered, { shouldValidate: true, shouldDirty: false });
    const first = filtered[0];
    if (first) {
      const mins = minutesBetween12h(
        first.startHour!,
        first.startMinute!,
        first.startMeridiem!,
        first.endHour!,
        first.endMinute!,
        first.endMeridiem!,
      );
      setValue("duration", String(mins), { shouldValidate: true, shouldDirty: false });
    }
  }, [days, setValue]);

  return (
    <div className="px-0 py-2">
      <div className="bg-white space-y-4">
        {scheduleErrors && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-red-600 text-sm font-medium">
              {typeof scheduleErrors.message === "string"
                ? scheduleErrors.message
                : "Please fill in all required schedule fields"}
            </p>
            {Array.isArray(scheduleErrors) && scheduleErrors.length > 0 && (
              <ul className="mt-2 list-disc list-inside text-red-600 text-xs">
                {scheduleErrors.map((error: any, index: number) => {
                  if (error && typeof error === "object") {
                    const errorMessages = Object.values(error).filter(
                      (msg: any) => msg && typeof msg === "object" && msg.message,
                    );
                    return errorMessages.map((msg: any, msgIndex: number) => (
                      <li key={`${index}-${msgIndex}`}>{msg.message}</li>
                    ));
                  }
                  return null;
                })}
              </ul>
            )}
          </div>
        )}

        {/* <div>
          <Dropdown
            options={presetOptions}
            isForm
            value={preset}
            onChangeValue={(v) => handlePresetChange(v as string)}
            textFieldProps={{
              label: "Schedule",
              labelOnTop: true,
              labelClassName: "!text-sm !font-semibold !text-input-gray",
              placeholder: "Everyday",
              inputClasses: "mt-1 !text-sm !h-10 !text-input-gray",
              className: "!w-full",
            }}
            dialogBodyClassName="!p-2 !overflow-hidden"
          />
        </div> */}
        {/* <div className="w-full border-t border-[#E9E9E9] mt-4" /> */}

        <div className="space-y-3">
          {days.map((d, dayIdx) => {
            const isLastDay = dayIdx === days.length - 1;
            const dayOptions = getDayOptionsForRow(dayIdx);
            return (
              <div
                key={d.id}
                className={`pb-4 border-b border-gray-200 last:border-b-0 ${isMobile ? "space-y-3" : "flex items-start gap-4"}`}
              >
                <div className={`${isMobile ? "flex items-center justify-between" : "w-45 flex gap-2 items-center"}`}>
                  <div className={isMobile ? "" : "flex-1"}>
                    {isMobile ? (
                      <button
                        type="button"
                        onClick={() => setDayPickerIndex(dayIdx)}
                        className="h-10 px-3 rounded-lg border border-border-input text-sm text-input-gray bg-white min-w-[130px] text-left"
                      >
                        {d.day}
                      </button>
                    ) : (
                      <Dropdown
                        options={dayOptions}
                        isForm
                        value={d.day}
                        onChangeValue={(v) =>
                          setDays((prev) =>
                            prev.map((p, i) => (i === dayIdx ? { ...p, day: v as string } : p)),
                          )
                        }
                        textFieldProps={{
                          label: "",
                          labelOnTop: false,
                          placeholder: d.day,
                          inputClasses: "mt-1 !text-sm !h-10 !text-input-gray",
                          className: "!w-full",
                        }}
                        dialogBodyClassName="!p-2 !overflow-hidden"
                      />
                    )}
                  </div>
                  {isMobile && !isLastDay ? (
                    <button
                      type="button"
                      onClick={() => removeDay(dayIdx)}
                      className="text-lg cursor-pointer hover:opacity-70"
                      aria-label="remove-day"
                    >
                      <DeleteIcon />
                    </button>
                  ) : null}
                </div>

                <div className="flex-1">
                  <div className="space-y-2">
                    {d.slots.map((slot, slotIdx) => {
                      const isLastSlot = slotIdx === d.slots.length - 1;
                      return (
                        <div key={slot.id} className="flex flex-col md:flex-row items-center gap-2">
                          {isMobile ? (
                            <div className="w-full grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2">
                              <TextField
                                label=""
                                type="time"
                                labelOnTop={false}
                                inputClasses="!text-sm !h-10 !text-input-gray"
                                className="w-full"
                                value={formatTimeForInput(
                                  slot.startHour ?? null,
                                  slot.startMinute ?? null,
                                  slot.startMeridiem ?? "AM",
                                )}
                                onChange={(e) =>
                                  handleMobileTimeChange(dayIdx, slot.id, "start", e.target.value)
                                }
                              />
                              <span className="text-gray-400 text-sm">-</span>
                              <TextField
                                label=""
                                type="time"
                                labelOnTop={false}
                                inputClasses="!text-sm !h-10 !text-input-gray"
                                className="w-full"
                                value={formatTimeForInput(
                                  slot.endHour ?? null,
                                  slot.endMinute ?? null,
                                  slot.endMeridiem ?? "AM",
                                )}
                                onChange={(e) =>
                                  handleMobileTimeChange(dayIdx, slot.id, "end", e.target.value)
                                }
                              />
                              {isLastSlot && isLastDay ? (
                                canAddDay ? (
                                  <button
                                    type="button"
                                    onClick={addDay}
                                    className="w-7 h-7 flex items-center justify-center text-xl text-[#008080] hover:text-[#006666] font-semibold"
                                    aria-label="add-day"
                                  >
                                    +
                                  </button>
                                ) : days.length > 1 ? (
                                  <button
                                    type="button"
                                    onClick={() => removeDay(dayIdx)}
                                    className="text-lg cursor-pointer hover:opacity-70"
                                    aria-label="remove-day"
                                  >
                                    <DeleteIcon />
                                  </button>
                                ) : null
                              ) : null}
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-2">
                                <TextField
                                  label=""
                                  placeholder="09"
                                  type="text"
                                  inputMode="numeric"
                                  labelOnTop={false}
                                  inputClasses="!text-sm !h-10 font-semibold! text-black! !text-center"
                                  className="w-17"
                                  value={getTimeDisplayValue(
                                    dayIdx,
                                    slot.id,
                                    "startHour",
                                    slot.startHour,
                                  )}
                                  onFocus={() =>
                                    handleTimeFocus(dayIdx, slot.id, "startHour", slot.startHour)
                                  }
                                  onChange={(e) => handleHourChange(e, dayIdx, slot.id, "startHour")}
                                  onBlur={() =>
                                    handleTimeBlur(dayIdx, slot.id, "startHour", slot.startHour)
                                  }
                                />
                                <span className="text-gray-400">:</span>
                                <TextField
                                  label=""
                                  placeholder="30"
                                  type="text"
                                  inputMode="numeric"
                                  labelOnTop={false}
                                  inputClasses="!text-sm !h-10 font-semibold! text-black! !text-center"
                                  className="w-17"
                                  value={getTimeDisplayValue(
                                    dayIdx,
                                    slot.id,
                                    "startMinute",
                                    slot.startMinute,
                                  )}
                                  onFocus={() =>
                                    handleTimeFocus(dayIdx, slot.id, "startMinute", slot.startMinute)
                                  }
                                  onChange={(e) =>
                                    handleMinuteChange(e, dayIdx, slot.id, "startMinute")
                                  }
                                  onBlur={() =>
                                    handleTimeBlur(dayIdx, slot.id, "startMinute", slot.startMinute)
                                  }
                                />
                                <div className="w-20">
                                  <Dropdown
                                    options={meridiemOptions.map((o) => ({ name: o, value: o }))}
                                    isForm
                                    value={slot.startMeridiem ?? "AM"}
                                    onChangeValue={(value) =>
                                      updateSlot(dayIdx, slot.id, "startMeridiem", value as string)
                                    }
                                    textFieldProps={{
                                      label: "",
                                      labelOnTop: false,
                                      placeholder: "AM",
                                      inputClasses: "!text-sm !h-10 font-semibold! text-black!",
                                      className: "!w-20",
                                    }}
                                    dialogBodyClassName="!p-2 !overflow-hidden"
                                  />
                                </div>
                              </div>

                              <span className="text-gray-400 mx-2">—</span>
                              <div className="flex items-center gap-2">
                                <TextField
                                  label=""
                                  placeholder="09"
                                  type="text"
                                  inputMode="numeric"
                                  labelOnTop={false}
                                  inputClasses="!text-sm !h-10 !text-center font-semibold! text-black!"
                                  className="w-17"
                                  value={getTimeDisplayValue(dayIdx, slot.id, "endHour", slot.endHour)}
                                  onFocus={() =>
                                    handleTimeFocus(dayIdx, slot.id, "endHour", slot.endHour)
                                  }
                                  onChange={(e) => handleHourChange(e, dayIdx, slot.id, "endHour")}
                                  onBlur={() =>
                                    handleTimeBlur(dayIdx, slot.id, "endHour", slot.endHour)
                                  }
                                />
                                <span className="text-gray-400">:</span>
                                <TextField
                                  label=""
                                  placeholder="30"
                                  type="text"
                                  inputMode="numeric"
                                  labelOnTop={false}
                                  inputClasses="!text-sm !h-10 !text-center font-semibold! text-black!"
                                  className="w-17"
                                  value={getTimeDisplayValue(
                                    dayIdx,
                                    slot.id,
                                    "endMinute",
                                    slot.endMinute,
                                  )}
                                  onFocus={() =>
                                    handleTimeFocus(dayIdx, slot.id, "endMinute", slot.endMinute)
                                  }
                                  onChange={(e) => handleMinuteChange(e, dayIdx, slot.id, "endMinute")}
                                  onBlur={() =>
                                    handleTimeBlur(dayIdx, slot.id, "endMinute", slot.endMinute)
                                  }
                                />
                                <div className="w-20">
                                  <Dropdown
                                    options={meridiemOptions.map((o) => ({ name: o, value: o }))}
                                    isForm
                                    value={slot.endMeridiem ?? "AM"}
                                    onChangeValue={(value) =>
                                      updateSlot(dayIdx, slot.id, "endMeridiem", value as string)
                                    }
                                    textFieldProps={{
                                      label: "",
                                      labelOnTop: false,
                                      placeholder: "AM",
                                      inputClasses:
                                        "!text-sm !h-10 font-semibold! text-black! !text-input-gray",
                                      className: "!w-20",
                                    }}
                                    dialogBodyClassName="!p-2 !overflow-hidden"
                                  />
                                </div>
                              </div>
                            </>
                          )}
                          {!isMobile && slotIdx > 0 && !isLastDay ? (
                            <button
                              type="button"
                              onClick={() => removeSlot(dayIdx, slot.id)}
                              className="ml-2 text-lg cursor-pointer hover:opacity-70"
                              aria-label="remove-slot"
                            >
                              <DeleteIcon />
                            </button>
                          ) : null}
                          {!isMobile && isLastSlot && !isLastDay ? (
                            <button
                              type="button"
                              onClick={() => removeDay(dayIdx)}
                              className="ml-2 text-lg cursor-pointer hover:opacity-70"
                              aria-label="remove-day"
                            >
                              <DeleteIcon />
                            </button>
                          ) : null}
                          {!isMobile && isLastSlot && isLastDay && canAddDay ? (
                            <button
                              type="button"
                              onClick={addDay}
                              className="ml-2 w-6 h-6 flex items-center justify-center text-xl text-[#008080] hover:text-[#006666] font-semibold"
                              aria-label="add-day"
                            >
                              +
                            </button>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Modal
        isOpen={isMobile && dayPickerIndex !== null}
        onClose={() => setDayPickerIndex(null)}
        className="w-[90vw] max-w-[360px] !p-0 !rounded-xl overflow-hidden"
        width="360px"
      >
        <Box className="p-4 border-b border-border-light flex items-center justify-between">
          <Typography className="!text-base !font-semibold !text-text-primary">Select Day</Typography>
          <IconButton onClick={() => setDayPickerIndex(null)} size="small" className="!p-0">
            <CloseIcon />
          </IconButton>
        </Box>
        <Box className="p-3 space-y-2">
          {(dayPickerIndex !== null ? getDayOptionsForRow(dayPickerIndex) : []).map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => {
                if (dayPickerIndex === null) return;
                setDays((prev) =>
                  prev.map((p, i) => (i === dayPickerIndex ? { ...p, day } : p)),
                );
                setDayPickerIndex(null);
              }}
              className="w-full px-3 py-2 rounded-lg border border-border-input text-left text-sm text-input-gray hover:bg-dashboard-bg"
            >
              {day}
            </button>
          ))}
        </Box>
      </Modal>
    </div>
  );
};

export default SubjectSchedule;
