/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect, useRef } from "react";
import { useWatch } from "react-hook-form";
import { useMediaQuery } from "@/utils/hooks/useMediaQuery";
import { Dropdown } from "@/modules/shared/component/Dropdown";
import { TextField } from "@/modules/shared/component/TextField";
import DeleteIcon from "@/modules/shared/assets/svgs/red-thrash.svg";
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
} from "../tour.constants";

interface AvailabilityProps {
  control: any;
  setValue: any;
  formState?: any;
}

interface AvailabilitySlot {
  day?: string | null;
  startHour?: number | null;
  startMinute?: number | null;
  startMeridiem?: string | null;
  endHour?: number | null;
  endMinute?: number | null;
  endMeridiem?: string | null;
}

function hasPopulatedAvailability(availability: AvailabilitySlot[]): boolean {
  return availability.some(
    (slot) =>
      slot.startHour != null ||
      slot.startMinute != null ||
      slot.endHour != null ||
      slot.endMinute != null ||
      slot.startMeridiem != null ||
      slot.endMeridiem != null,
  );
}

function getPresetDays(preset: string): string[] {
  if (preset === "Weekends") return weekendsOnly;
  if (preset === "Everyday") return weekdays;
  return weekdaysOnly; // "Week Days (Default)"
}

function buildDaysFromPreset(preset: string, maxDays: number = 1): DaySchedule[] {
  return getPresetDays(preset).slice(0, maxDays).map((day) => ({
    id: Math.random().toString(36).substr(2, 9),
    day,
    slots: [defaultSlot()],
  }));
}

function normalizeMeridiem(value: string | null | undefined): "AM" | "PM" {
  return String(value ?? "")
    .trim()
    .toUpperCase() === "PM"
    ? "PM"
    : "AM";
}

function normalizeDay(day: string | null | undefined): string {
  const safeDay = String(day ?? "").trim().toLowerCase();
  const match = weekdays.find((weekday) => weekday.toLowerCase() === safeDay);
  return match ?? "Select Day";
}

function buildDaysFromAvailability(availability: AvailabilitySlot[]): DaySchedule[] {
  return availability.map((slot) => ({
    id: Math.random().toString(36).substr(2, 9),
    day: normalizeDay(slot.day),
    slots: [
      {
        id: Math.random().toString(36).substr(2, 9),
        startHour: slot.startHour ?? null,
        startMinute: slot.startMinute ?? null,
        startMeridiem: normalizeMeridiem(slot.startMeridiem),
        endHour: slot.endHour ?? null,
        endMinute: slot.endMinute ?? null,
        endMeridiem: normalizeMeridiem(slot.endMeridiem),
      },
    ],
  }));
}

function getPresetFromDays(days: string[]): string {
  const normalized = days
    .map((day) => normalizeDay(day))
    .filter((day) => day !== "Select Day")
    .sort();
  const weekdaysSorted = [...weekdaysOnly].sort();
  const weekendsSorted = [...weekendsOnly].sort();
  const everydaySorted = [...weekdays].sort();

  if (
    normalized.length === weekdaysSorted.length &&
    normalized.every((day, idx) => day === weekdaysSorted[idx])
  ) {
    return "Week Days (Default)";
  }

  if (
    normalized.length === weekendsSorted.length &&
    normalized.every((day, idx) => day === weekendsSorted[idx])
  ) {
    return "Weekends";
  }

  if (
    normalized.length === everydaySorted.length &&
    normalized.every((day, idx) => day === everydaySorted[idx])
  ) {
    return "Everyday";
  }

  return "Week Days (Default)";
}

function copyTimeValues(target: TimeSlot, source?: TimeSlot): TimeSlot {
  if (!source) return target;
  return {
    ...target,
    startHour: source.startHour ?? null,
    startMinute: source.startMinute ?? null,
    startMeridiem: normalizeMeridiem(source.startMeridiem),
    endHour: source.endHour ?? null,
    endMinute: source.endMinute ?? null,
    endMeridiem: normalizeMeridiem(source.endMeridiem),
  };
}

function cloneSlotTimes(source?: TimeSlot): TimeSlot {
  if (!source) return defaultSlot();
  return {
    id: Math.random().toString(36).substr(2, 9),
    startHour: source.startHour ?? 8,
    startMinute: source.startMinute ?? 0,
    startMeridiem: normalizeMeridiem(source.startMeridiem),
    endHour: source.endHour ?? 5,
    endMinute: source.endMinute ?? 0,
    endMeridiem: normalizeMeridiem(source.endMeridiem ?? "PM"),
  };
}

const Availability = ({ control, setValue, formState }: AvailabilityProps) => {
  const isMobile = useMediaQuery("(max-width:768px)");
  // Get validation errors for availability
  const availabilityErrors = formState?.errors?.availability;
  const [preset, setPreset] = useState<string>("Week Days (Default)");
  const [days, setDays] = useState<DaySchedule[]>(() => buildDaysFromPreset("Week Days (Default)", 1));
  const formAvailability = useWatch({ control, name: "availability" });
  const hasHydratedFromForm = useRef(false);

  const presetOptions = ["Week Days (Default)", "Everyday", "Weekends"];

  const presetDayList = getPresetDays(preset);

  const getDayOptionsForRow = (dayIdx: number): string[] => {
    return presetDayList.filter(
      (day) =>
        day === days[dayIdx].day ||
        !days.some((d, j) => j !== dayIdx && d.day === day && d.day !== "Select Day"),
    );
  };

  const handlePresetChange = (v: string) => {
    const selectedPresetDays = getPresetDays(v);
    const maxDaysToBuild = isMobile ? selectedPresetDays.length : 1;
    setPreset(v);
    setDays((prev) => {
      const firstExistingSlot = prev[0]?.slots?.[0];
      const rebuilt = buildDaysFromPreset(v, maxDaysToBuild);
      if (!rebuilt[0]?.slots?.[0]) return rebuilt;
      rebuilt.forEach((day) => {
        if (day.slots[0]) {
          day.slots[0] = copyTimeValues(day.slots[0], firstExistingSlot);
        }
      });
      return rebuilt;
    });
  };

  const canAddDay = days.length < presetDayList.length;

  const removeSlot = (dayIndex: number, slotId: string) => {
    setDays((prev) => {
      return prev.map((day, index) => {
        if (index === dayIndex) {
          const newSlots = day.slots.filter((slot) => slot.id !== slotId);
          return {
            ...day,
            slots: newSlots.length > 0 ? newSlots : [defaultSlot()],
          };
        }
        return day;
      });
    });
  };

  const addDay = () => {
    const lastSlot = days[days.length - 1]?.slots?.[0];
    const newDay: DaySchedule = {
      id: Math.random().toString(36).substr(2, 9),
      day: "Select Day",
      slots: [cloneSlotTimes(lastSlot)],
    };
    setDays((prev) => [...prev, newDay]);
  };

  const removeDay = (dayIndex: number) => {
    setDays((prev) => prev.filter((_, index) => index !== dayIndex));
  };

  const [focusedTimeField, setFocusedTimeField] = useState<string | null>(null);
  const [timeEditValue, setTimeEditValue] = useState("");

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
    if (slotValue == null) return;
    if (field === "startHour" || field === "endHour") {
      const clamped = validateHour(String(slotValue));
      if (clamped !== slotValue) updateSlot(dayIndex, slotId, field, clamped);
      return;
    }
    const clamped = validateMinute(String(slotValue));
    if (clamped !== slotValue) updateSlot(dayIndex, slotId, field, clamped);
  };

  const updateSlot = (
    dayIndex: number,
    slotId: string,
    field: keyof TimeSlot,
    value: string | number | null,
  ) => {
    setDays((prev) => {
      return prev.map((day, index) => {
        if (index === dayIndex) {
          const newSlots = day.slots.map((slot) => {
            if (slot.id === slotId) {
              return { ...slot, [field]: value };
            }
            return slot;
          });
          return { ...day, slots: newSlots };
        }
        return day;
      });
    });
  };

  useEffect(() => {
    if (hasHydratedFromForm.current) return;
    if (!Array.isArray(formAvailability) || formAvailability.length === 0) return;
    if (!hasPopulatedAvailability(formAvailability)) return;

    const hydratedDays = buildDaysFromAvailability(formAvailability);
    if (hydratedDays.length > 0) {
      setDays(hydratedDays);
      setPreset(getPresetFromDays(hydratedDays.map((day) => day.day)));
    }
    hasHydratedFromForm.current = true;
  }, [formAvailability]);

  // Sync availability data to form whenever days change
  useEffect(() => {
    const rawAvailability = days.flatMap((day) =>
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

    // Only include slots that have all required fields filled
    const filteredAvailability = rawAvailability.filter(
      (slot) =>
        slot.day &&
        slot.startHour !== null &&
        slot.startHour !== undefined &&
        slot.startMinute !== null &&
        slot.startMinute !== undefined &&
        slot.startMeridiem &&
        slot.endHour !== null &&
        slot.endHour !== undefined &&
        slot.endMinute !== null &&
        slot.endMinute !== undefined &&
        slot.endMeridiem,
    );
    setValue("availability", filteredAvailability, { shouldValidate: true });
  }, [days, setValue]);

  return (
    <div className={`${isMobile ? "px-4 py-4 pb-8" : "px-6 py-5"}`}>
      <div className={`bg-white space-y-4 ${isMobile ? "py-4" : "py-6"}`}>
        {/* Display availability validation errors */}
        {availabilityErrors && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-red-600 text-sm font-medium">
              {typeof availabilityErrors.message === "string"
                ? availabilityErrors.message
                : "Please fill in all required availability fields"}
            </p>
            {Array.isArray(availabilityErrors) && availabilityErrors.length > 0 && (
              <ul className="mt-2 list-disc list-inside text-red-600 text-xs">
                {availabilityErrors.map((error: any, index: number) => {
                  if (error && typeof error === "object") {
                    const errorMessages = Object.values(error).filter(
                      (msg: any) => msg && typeof msg === "object" && msg.message
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

        <div>
          <Dropdown
            options={presetOptions}
            isForm
            requiredAsterisk
            value={preset}
            onChangeValue={(v) => handlePresetChange(v as string)}
            textFieldProps={{
              label: "Availability",
              labelOnTop: true,
              labelClassName: "!text-sm !font-semibold !text-input-gray",
              placeholder: "Week Days (Default)",
              inputClasses: "mt-1 !text-sm !h-10 !text-input-gray",
              className: "!w-full",
            }}
            dialogBodyClassName="!p-2 !overflow-hidden"
          />
        </div>
        {isMobile && (
          <div className="rounded-xl bg-[#F8FBFB] border border-[#E6F7F6] p-3">
            <p className="text-xs text-[#0B4A4A] font-medium">Tip</p>
            <p className="text-xs text-[#667085] mt-1">
              Add available days and set clear start/end times for each day.
            </p>
          </div>
        )}
        <div className="w-full border-t border-[#E9E9E9] mt-6"></div>

        <div className="space-y-3">
          {days.map((d, dayIdx) => {
            const isLastDay = dayIdx === days.length - 1;
            return (
              <div
                key={d.id}
                className={`pb-4 border-b border-gray-200 last:border-b-0 ${
                  isMobile ? "space-y-3 rounded-xl border border-[#E6F7F6] p-3.5 bg-[#FCFEFE]" : "flex items-start gap-4"
                }`}
              >
                <div className={`${isMobile ? "w-full" : "w-36"} flex gap-2 items-center`}>
                  <div className={isMobile ? "w-full" : "flex-1"}>
                    {isMobile && (
                      <p className="text-xs font-semibold text-[#0B4A4A] mb-2">Day {dayIdx + 1}</p>
                    )}
                    <Dropdown
                      options={getDayOptionsForRow(dayIdx)}
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
                        inputClasses: " !text-sm !h-10 !text-input-gray",
                        className: "!w-full",
                      }}
                      dialogBodyClassName="!p-2 !overflow-hidden"
                    />
                  </div>
                </div>

                {/* Slots for this Day */}
                <div className="flex-1">
                  <div className="space-y-2">
                    {d.slots.map((slot, slotIdx) => {
                      const isLastSlot = slotIdx === d.slots.length - 1;
                      return (
                        <div key={slot.id} className={`${isMobile ? "space-y-2" : "flex items-center gap-2"}`}>
                          <div
                            className={`flex items-center gap-2 min-w-0 sm:flex-wrap ${
                              isMobile ? "rounded-lg bg-white border border-[#E7ECEF] p-2.5" : ""
                            }`}
                          >
                            {/* {isMobile && (
                              <span className="text-xs text-[#667085] w-full mb-1 font-medium">From</span>
                            )} */}
                            <TextField
                              label=""
                              placeholder="09"
                              type="text"
                              inputMode="numeric"
                              labelOnTop={false}
                              inputClasses="!text-sm !h-10 font-semibold! text-black! !text-center"
                              className="w-14 md:w-17"
                              value={getTimeDisplayValue(dayIdx, slot.id, "startHour", slot.startHour)}
                              onFocus={() => handleTimeFocus(dayIdx, slot.id, "startHour", slot.startHour)}
                              onChange={(e) => handleHourChange(e, dayIdx, slot.id, "startHour")}
                              onBlur={() => handleTimeBlur(dayIdx, slot.id, "startHour", slot.startHour)}
                            />

                            <span className="text-gray-400">:</span>

                            <TextField
                              label=""
                              placeholder="30"
                              type="text"
                              inputMode="numeric"
                              labelOnTop={false}
                              inputClasses="!text-sm !h-10 font-semibold! text-black! !text-center"
                              className="w-14 md:w-17"
                              value={getTimeDisplayValue(dayIdx, slot.id, "startMinute", slot.startMinute)}
                              onFocus={() => handleTimeFocus(dayIdx, slot.id, "startMinute", slot.startMinute)}
                              onChange={(e) => handleMinuteChange(e, dayIdx, slot.id, "startMinute")}
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

                          {isMobile ? (
                            <div className="text-gray-400 text-center">—</div>
                          ) : (
                            <span className="text-gray-400 mx-1 md:mx-2">—</span>
                          )}
                          <div
                            className={`flex items-center gap-2 min-w-0 sm:flex-wrap ${
                              isMobile ? "rounded-lg bg-white border border-[#E7ECEF] p-2.5" : ""
                            }`}
                          >
                            {/* {isMobile && (
                              <span className="text-xs text-[#667085] w-full mb-1 font-medium">To</span>
                            )} */}
                            <TextField
                              label=""
                              placeholder="09"
                              type="text"
                              inputMode="numeric"
                              labelOnTop={false}
                              inputClasses="!text-sm !h-10 !text-center font-semibold! text-black!"
                              className="w-14 md:w-17"
                              value={getTimeDisplayValue(dayIdx, slot.id, "endHour", slot.endHour)}
                              onFocus={() => handleTimeFocus(dayIdx, slot.id, "endHour", slot.endHour)}
                              onChange={(e) => handleHourChange(e, dayIdx, slot.id, "endHour")}
                              onBlur={() => handleTimeBlur(dayIdx, slot.id, "endHour", slot.endHour)}
                            />

                            <span className="text-gray-400">:</span>

                            <TextField
                              label=""
                              placeholder="30"
                              type="text"
                              inputMode="numeric"
                              labelOnTop={false}
                              inputClasses="!text-sm !h-10 !text-center font-semibold! text-black!"
                              className="w-14 md:w-17"
                              value={getTimeDisplayValue(dayIdx, slot.id, "endMinute", slot.endMinute)}
                              onFocus={() => handleTimeFocus(dayIdx, slot.id, "endMinute", slot.endMinute)}
                              onChange={(e) => handleMinuteChange(e, dayIdx, slot.id, "endMinute")}
                              onBlur={() => handleTimeBlur(dayIdx, slot.id, "endMinute", slot.endMinute)}
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

                          {slotIdx > 0 && !isLastDay && !isMobile ? (
                            <button
                              type="button"
                              onClick={() => removeSlot(dayIdx, slot.id)}
                              className="ml-2 text-lg cursor-pointer hover:opacity-70"
                              aria-label="remove-slot"
                            >
                              <DeleteIcon />
                            </button>
                          ) : null}

                          {isLastSlot && !isLastDay ? (
                            <button
                              type="button"
                              onClick={() => removeDay(dayIdx)}
                              className={`${
                                isMobile
                                  ? "w-full mt-1 border border-red-100 bg-red-50 text-[#B42318] text-xs py-2 rounded-lg"
                                  : "ml-2"
                              } text-lg cursor-pointer hover:opacity-70`}
                              aria-label="remove-day"
                            >
                              {isMobile ? "Remove this day" : <DeleteIcon />}
                            </button>
                          ) : null}

                          {isLastSlot && isLastDay && canAddDay && !isMobile ? (
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
        {isMobile && canAddDay && (
          <button
            type="button"
            onClick={addDay}
            className="w-full mt-2 border border-dashed border-[#00808066] bg-[#F2FAFA] text-[#006666] text-sm py-2.5 rounded-lg font-semibold"
            aria-label="add-another-day"
          >
            + Add another day
          </button>
        )}
      </div>
    </div>
  );
};

export default Availability;
