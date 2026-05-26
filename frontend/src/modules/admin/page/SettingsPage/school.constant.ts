import * as Yup from "yup";

export interface SchoolValues {
  name: string;
  description: string;
  attachments: File[];
}

export type TimezoneOption = {
  label: string;
  name: string;
  value: string;
};

export const schoolInitialValues: SchoolValues = {
  name: "",
  description: "",
  attachments: [],
};

export const schoolTypeOptions = [
  { name: "Pre-School/Child Care", value: "pre_school/child_care" },
  { name: "After School", value: "after_school" },
  { name: "Home Based Care", value: "home_based_care" },
  { name: "Camps", value: "camps" },
];

export const schoolValidationSchema = Yup.object({
  name: Yup.string().required("Subject name is required"),
  description: Yup.string().required("Description is required"),
  attachments: Yup.array().max(5, "Maximum 5 attachments allowed").of(Yup.mixed<File>()),
});

export const MAX_ATTACHMENT_SIZE = 3 * 1024 * 1024; // 3MB in bytes
export const MAX_ATTACHMENTS = 5;
export const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export interface SchoolProps {
  brandColor?: string;
  schoolName?: string;
  schoolMotto?: string;
  schoolType?: string;
  schoolLogoUrl?: string;
  maximumEnrolment?: number;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  email?: string;
  phoneNumber?: string;
  x?: string;
  facebook?: string;
  tiktok?: string;
  instagram?: string;
  description?: string;
  studentResumptionTime?: string;
  staffResumptionTime?: string;
  schoolClosingTime?: string;
  staffClosingTime?: string;
  timezone?: string;
  timezoneManuallySet?: boolean;
  subDomain?: string;
}

export const initialValue: SchoolProps = {
  schoolName: "",
  schoolMotto: "",
  schoolType: "",
  schoolLogoUrl: "",
  address: "",
  country: "NG",
  city: "",
  state: "",
  email: "",
  phoneNumber: "",
  x: "",
  facebook: "",
  tiktok: "",
  instagram: "",
  description: "",
  studentResumptionTime: "",
  staffResumptionTime: "",
  schoolClosingTime: "",
  staffClosingTime: "",
  timezone: "",
  timezoneManuallySet: false,
  subDomain: "",
};

export const validationSchema = Yup.object({
  // lesson_title: Yup.string().required("Lesson title is required"),
  schoolName: Yup.string().required("School name is required"),
  // schoolMotto: Yup.string().required("School motto is required"),
  // schoolType: Yup.string().required("School type is required"),
  // schoolLogoUrl: Yup.mixed<File | string>()
  //   .required("School logo is required")
  //   .test("is-valid-image", "School logo is required", (value) => {
  //     if (!value) return false;
  //     if (value instanceof File) return true;
  //     if (typeof value === "string" && value.trim() !== "") return true;
  //     return false;
  //   }),
  // address: Yup.string().required("Address is required"),
  // country: Yup.string().required("Country is required"),
  // email: Yup.string().required("Email is required"),
  // phoneNumber: Yup.string().required("Phone number is required"),
  // timezone: Yup.string().required("Timezone is required"),
  // studentResumptionTime: Yup.string().required("Student resumption time is required"),
  // staffResumptionTime: Yup.string().required("Staff resumption time is required"),
  // schoolClosingTime: Yup.string().required("School closing time is required"),
  // staffClosingTime: Yup.string().required("Staff closing time is required"),
});
