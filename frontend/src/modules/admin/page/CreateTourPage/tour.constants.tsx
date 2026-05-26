import * as Yup from "yup";
export const durationOptions = [
  { name: "5 minutes", value: 5 },
  { name: "10 minutes", value: 10 },
  { name: "15 minutes", value: 15 },
  { name: "20 minutes", value: 20 },
  { name: "30 minutes", value: 30 },
  { name: "45 minutes", value: 45 },
  { name: "60 minutes", value: 60 },
];
export const locationOptions = [
  { name: "Stella Maris Academy (Default)", value: "Stella Maris Academy" },
];

export const unitOptions = ["Minutes", "Hours", "Days"];
export const intervalOptions = [
  { name: "5 minutes", value: 5 },
  { name: "10 minutes", value: 10 },
  { name: "15 minutes", value: 15 },
  { name: "20 minutes", value: 20 },
  { name: "30 minutes", value: 30 },
  { name: "45 minutes", value: 45 },
  { name: "60 minutes", value: 60 },
];
export const resetOptions = [
  { name: "5 minutes", value: 5 },
  { name: "10 minutes", value: 10 },
  { name: "15 minutes", value: 15 },
  { name: "20 minutes", value: 20 },
  { name: "30 minutes", value: 30 },
  { name: "45 minutes", value: 45 },
  { name: "60 minutes", value: 60 },
];
export const navItems = [
  { id: "basic", label: "Basic" },
  { id: "availability", label: "Availablity" },
  { id: "notification", label: "Notifications" },
  { id: "question", label: "Questions" },
];


export const weekdays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/** Monday–Friday only (Week Days preset) */
export const weekdaysOnly = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
];

/** Saturday and Sunday only (Weekends preset) */
export const weekendsOnly = ["Saturday", "Sunday"];

export const meridiemOptions = ["AM", "PM"];

export type TimeSlot = {
  id: string;
  startHour: number | null;
  startMinute: number | null;
  startMeridiem: string;
  endHour: number | null;
  endMinute: number | null;
  endMeridiem: string;
};

export type DaySchedule = {
  id: string;
  day: string;
  slots: TimeSlot[];
};

export const defaultSlot = (): TimeSlot => ({
  id: Math.random().toString(36).substr(2, 9),
  startHour: 8,
  startMinute: 0,
  startMeridiem: "AM",
  endHour: 5,
  endMinute: 0,
  endMeridiem: "PM",
});

// Helper function to validate and clamp hour values (1-12)
export const validateHour = (value: string): number | null => {
  if (!value || value === "") return null;
  const num = parseInt(value, 10);
  if (isNaN(num)) return null;
  // Clamp to valid range
  if (num < 1) return 1;
  if (num > 12) return 12;
  return num;
};

// Helper function to validate and clamp minute values (0-59)
export const validateMinute = (value: string): number | null => {
  if (!value || value === "") return null;
  const num = parseInt(value, 10);
  if (isNaN(num)) return null;
  // Clamp to valid range
  if (num < 0) return 0;
  if (num > 59) return 59;
  return num;
};

/**
 * Parse raw hour input for seamless time editing.
 * - Empty -> null
 * - "0" alone -> null (clearing)
 * - When >2 digits, uses last 2 (overwrite behavior)
 * - Values above 12 clamp to 12 (e.g. 13, 99 -> 12)
 */
export const parseHourInput = (raw: string): number | null => {
  let digits = raw.replace(/\D/g, "");
  if (digits === "") return null;
  if (digits === "0") return null;
  if (digits.length > 2) digits = digits.slice(-2);
  return validateHour(digits);
};

/**
 * Parse raw minute input for seamless time editing.
 * - When >2 digits, uses last 2 (overwrite: "00" + "9" -> "09")
 * - Values above 60 clamp to 60 (e.g. 70, 99 -> 60)
 */
export const parseMinuteInput = (raw: string): number | null => {
  let digits = raw.replace(/\D/g, "");
  if (digits === "") return null;
  if (digits.length > 2) digits = digits.slice(-2);
  return validateMinute(digits);
};
// ---- Basic Info ----
interface BasicInfo {
  title: string;
  description: string;
  url: string;
  duration: number;
  location: string;
}

// ---- Availability ----
interface Availability {
  day: string;
  startHour: number | null;
  startMinute: number | null;
  startMeridiem: string | null;
  endHour: number | null;
  endMinute: number | null;
  endMeridiem: string | null;
}

// ---- Notification ----
interface Notification {
  beforeTour: number;
  afterTour: number;
  minimumNotice: number;
  minimumNoticeUnit: string;
  timeSlotInterval: number;
  limitTotalTourDuration: boolean;
  limitNumberOfUpcomingTours: boolean;
  confirmation: boolean;
}

// ---- Questions ----
export interface Question {
  inputType: string;
  label: string;
  placeHolder: string;
  include?: string;
  exclude?: string;
  maxChar?: number;
  minChar?: number,
  isRequired: boolean;
}

// ---- Booking options (Settings toggles below questions) ----
export interface BookingOptions {
  requiresConfirmation: boolean;
  disableCancelling: boolean;
  disableRescheduling: boolean;
}

// ---- Create Tour Request ----
export interface AllTourFormData {
  basicInfo: BasicInfo;
  availability: Availability[];
  notification: Notification;
  questions: Question[];
  bookingOptions: BookingOptions;
}

export const initialValues: AllTourFormData = {
  basicInfo: {
    title: "",
    description: "",
    url: "",
    duration: 0,
    location: "",
  },
  availability: [
    {
      day: "Monday",
      startHour: null,
      startMinute: null,
      startMeridiem: null,
      endHour: null,
      endMinute: null,
      endMeridiem: null,
    },
  ],
  notification: {
    beforeTour: 0,
    afterTour: 0,
    minimumNotice: 0,
    minimumNoticeUnit: "Hours",
    timeSlotInterval: 0,
    limitTotalTourDuration: true,
    limitNumberOfUpcomingTours: true,
    confirmation: true,
  },
  questions: [],
  bookingOptions: {
    requiresConfirmation: false,
    disableCancelling: false,
    disableRescheduling: false,
  },
};


export interface QuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Question) => void
}

export const validationSchema = Yup.object().shape({
  basicInfo: Yup.object().shape({
    title: Yup.string().required("Title is required"),
    description: Yup.string().required("Description is required"),
    url: Yup.string()
      .matches(/^[a-z0-9-]+$/, "Only alphanumeric characters and hyphens are allowed")
      .required("Url is required"),
    duration: Yup.number()
      .transform((value) => (value === 0 ? undefined : value))
      .required("Duration is required"),
    location: Yup.string().required("Location is required"),
  }),
  availability: Yup.array()
    .min(1, "At least one availability slot is required")
    .of(
      Yup.object().shape({
        day: Yup.string().required("Day is required"),
        startHour: Yup.number().required("Start Hour is required"),
        startMinute: Yup.number().required("Start Minute is required"),
        startMeridiem: Yup.string().required("Start Meridiem is required"),
        endHour: Yup.number().required("End Hour is required"),
        endMinute: Yup.number().required("End Minute is required"),
        endMeridiem: Yup.string().required("End Meridiem is required"),
      }),
    ),
  notification: Yup.object().shape({
    beforeTour: Yup.number(),
    afterTour: Yup.number(),
    minimumNotice: Yup.number().required("Minimum Notice is required"),
    minimumNoticeUnit: Yup.string().required("Minimum Notice Unit is required"),
    timeSlotInterval: Yup.number(),
    limitTotalTourDuration: Yup.boolean(),
    limitNumberOfUpcomingTours: Yup.boolean(),
    confirmation: Yup.boolean(),
  }),
  bookingOptions: Yup.object().shape({
    requiresConfirmation: Yup.boolean(),
    disableCancelling: Yup.boolean(),
    disableRescheduling: Yup.boolean(),
  }),
});
