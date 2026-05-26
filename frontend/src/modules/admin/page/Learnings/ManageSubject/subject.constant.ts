import * as Yup from "yup";

/** Matches the availability slot shape used by the Availability component */
export interface SubjectScheduleEntry {
  day: string;
  startHour: number | null;
  startMinute: number | null;
  startMeridiem: string;
  endHour: number | null;
  endMinute: number | null;
  endMeridiem: string;
}

export interface SubjectFormValues {
  subjectName: string;
  assignedTeacher: string;
  class: string | number;
  curriculum: string;
  minimumAge: string;
  maximumAge: string;
  duration: string;
  skills: string[];
  ageRange: {
    minimumAge: string;
    maximumAge: string;
  };
  description: string;
  schedule: SubjectScheduleEntry[];
}

export const initialValue: SubjectFormValues = {
  subjectName: "",
  assignedTeacher: "",
  class: "",
  curriculum: "",
  minimumAge: "",
  maximumAge: "",
  duration: "",
  skills: [],
  description: "",
  ageRange: {
    minimumAge: "",
    maximumAge: "",
  },
  schedule: [],
};

export const validationSchema = Yup.object().shape({
  subjectName: Yup.string().required("Subject name is required"),
  assignedTeacher: Yup.string().required("Assigned teacher is required"),
  class: Yup.mixed()
    .required("Class is required")
    .test("valid-class", "Class is required", (value) => {
      if (Array.isArray(value)) return value.length > 0;
      return value !== "" && value != null;
    }),
  curriculum: Yup.string().required("Curriculum is required"),
  minimumAge: Yup.string().required("Minimum age is required"),
  maximumAge: Yup.string()
    .required("Maximum age is required")
    .test("greater-than-min", "Maximum age must be greater than minimum age", function (value) {
      const { minimumAge } = this.parent;
      if (!value || !minimumAge) return true;
      const max = Number(value);
      const min = Number(minimumAge);
      if (isNaN(max) || isNaN(min)) return true;
      return max > min;
    }),
  duration: Yup.string().required("Duration is required"),
  skills: Yup.array().min(1, "Select at least one skill").required("Skills are required"),
  description: Yup.string(),
  schedule: Yup.array()
    .min(1, "At least one schedule slot is required")
    .of(
      Yup.object().shape({
        day: Yup.string().required("Day is required"),
        startHour: Yup.number().required("Start hour is required"),
        startMinute: Yup.number().required("Start minute is required"),
        startMeridiem: Yup.string().required("Start meridiem is required"),
        endHour: Yup.number().required("End hour is required"),
        endMinute: Yup.number().required("End minute is required"),
        endMeridiem: Yup.string().required("End meridiem is required"),
      }),
    ),
});

export const DAY_OPTIONS = [
  { label: "Monday", value: "Monday" },
  { label: "Tuesday", value: "Tuesday" },
  { label: "Wednesday", value: "Wednesday" },
  { label: "Thursday", value: "Thursday" },
  { label: "Friday", value: "Friday" },
  { label: "Saturday", value: "Saturday" },
];

export const PERIOD_OPTIONS = [
  { label: "AM", value: "AM" },
  { label: "PM", value: "PM" },
];
