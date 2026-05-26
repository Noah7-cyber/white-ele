"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { showToast } from "@/modules/shared/component/Toast";
import { ScheduleTourRequest, TourQuestion } from "@/services/tour.service";
import { TimeSlot } from "../helpers";
import { useScheduleTour } from "./useScheduleTour";

/** Questions that are not name or email (those are required and mapped to names/email). */
function getExtraQuestions(tourQuestions: TourQuestion[]): TourQuestion[] {
  return (tourQuestions ?? []).filter(
    (q) => q.inputType !== "name" && q.inputType !== "email"
  );
}

/** Stable, backend-friendly key for additionalResponses. Uniquified when labels normalize to the same slug. */
function getQuestionKey(label: string | null | undefined, index: number, slugsSeen: Set<string>): string {
  // Fallback for null/undefined/empty labels
  const normalizedLabel = typeof label === "string" ? label : "";
  const slug = normalizedLabel
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
  const base = slug || `question_${index}`;
  let key = base;
  let c = 2;
  while (slugsSeen.has(key)) {
    key = `${base}_${c}`;
    c++;
  }
  slugsSeen.add(key);
  return key;
}

function convertTo24HourFormat(time12h: string): string {
  const [time, modifier] = time12h.split(" ");
  const [h, minutes] = time.split(":");
  let hours = h;
  if (hours === "12") hours = "00";
  if (modifier === "PM") hours = String(parseInt(hours, 10) + 12);
  return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}:00`;
}

export interface BookingFormData {
  parentName: string;
  email: string;
  source: string;
  extraQuestions?: Record<string, string>;
}

export const SOURCE_OPTIONS = [
  "School Website",
  "Blog Post/Article",
  "Google Search",
  "WhatsApp",
  "Referral (Parent)",
  "Referral (Staff)",
  "Flyer/Billboard",
  "Other",
];

export interface UseBookingFormParams {
  tourId?: number;
  selectedDate: string;
  selectedSlot: TimeSlot;
  tourQuestions?: TourQuestion[];
  onBookingConfirmed: (formData: ScheduleTourRequest) => void;
}

export interface ExtraKeyWithQuestion {
  key: string;
  question: TourQuestion;
}

export function useBookingForm({
  tourId,
  selectedDate,
  selectedSlot,
  tourQuestions = [],
  onBookingConfirmed,
}: UseBookingFormParams) {
  const extraQuestionsList = useMemo(
    () => getExtraQuestions(tourQuestions),
    [tourQuestions]
  );

  const extraKeysWithQuestion = useMemo<ExtraKeyWithQuestion[]>(() => {
    const slugsSeen = new Set<string>();
    return extraQuestionsList.map((q, i) => ({
      key: getQuestionKey(q.label, i, slugsSeen),
      question: q,
    }));
  }, [extraQuestionsList]);

  const defaultExtraQuestions = useMemo(
    () =>
      extraKeysWithQuestion.reduce<Record<string, string>>((acc, { key }) => {
        acc[key] = "";
        return acc;
      }, {}),
    [extraKeysWithQuestion]
  );

  const {
    control,
    setValue,
    handleSubmit: formHandleSubmit,
    reset,
    getValues,
  } = useForm<BookingFormData>({
    defaultValues: {
      parentName: "",
      email: "",
      source: "",
      extraQuestions: defaultExtraQuestions,
    },
  });

  const extraKeysSerialized = extraKeysWithQuestion.map((x) => x.key).join(",");
  useEffect(() => {
    if (extraKeysWithQuestion.length === 0) return;
    const current = getValues("extraQuestions") ?? {};
    const defaults = extraKeysWithQuestion.reduce<Record<string, string>>(
      (acc, { key }) => ({ ...acc, [key]: "" }),
      {}
    );
    const next = { ...current, ...defaults };
    if (Object.keys(next).length !== Object.keys(current).length) {
      reset(
        { ...getValues(), extraQuestions: next },
        { keepDefaultValues: false }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when extra question keys change
  }, [extraKeysSerialized, reset]);

  const { scheduleTour, isSchedulingTour } = useScheduleTour();

  const handleSubmit = async (data: BookingFormData) => {
    if (!data.parentName || !data.email || !data.source) {
      showToast({
        message: "Please fill all required fields",
        severity: "error",
        duration: 3000,
      });
      return;
    }
    if (!tourId) {
      showToast({
        message:
          "Tour ID is missing. This form is only available for published tours.",
        severity: "error",
        duration: 3000,
      });
      return;
    }

    const requestData: ScheduleTourRequest = {
      tourEventId: tourId,
      email: data.email,
      referralSource: data.source,
      date: selectedDate,
      startTime: convertTo24HourFormat(selectedSlot.time),
      names: [data.parentName.trim()],
      availabilityId: selectedSlot.availabilityId,
    };

    if (extraQuestionsList.length > 0 && data.extraQuestions) {
      requestData.additionalResponses = { ...data.extraQuestions };
    }

    const success = await scheduleTour(requestData);
    if (success) {
      onBookingConfirmed(requestData);
    }
  };

  return {
    control,
    setValue,
    formHandleSubmit,
    handleSubmit,
    extraKeysWithQuestion,
    isSchedulingTour,
  };
}
