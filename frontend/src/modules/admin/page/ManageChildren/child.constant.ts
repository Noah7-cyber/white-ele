import * as Yup from "yup";

export interface ParentProps {
  id?: number;
  suffix?: string;
  title?: string;
  firstName: string;
  lastName: string;
  relationship: string;
  phone: string;
  email: string;
  address: string;
  photoUrl: File | null | string;
  notes?: string;
}

export interface DocumentsProps {
  docName: string;
  documentUrl: string;
}
export interface EmergencyContactProps {
  suffix?: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  relationship: string;
  phone: string;
  email: string;
  address: string;
  notes?: string;
}
export type GenderValue = "male" | "female" | "other";

export interface GeneralInfoProps {
  title?: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  dateOfBirth: string;
  enrolmentDate: string;
  photoUrl: string;
  gender?: GenderValue | "";
  address: string;
  notes?: string;
}
export interface MedicalInfoProps {
  allergies: string;
  medications: string;
  foodPreferences: string;
  dietRestriction: string;
  notes?: string;
}

export interface ChildProps {
  generalInfo: GeneralInfoProps;
  schedule: string[];
  notes?: string;
  medicalInfo: MedicalInfoProps;
  emergencyInfo: EmergencyContactProps;
  parents: ParentProps[];
  classrooms: number;
  documents?: (File | { docName: string; documentUrl: string })[];
}

export const classroomOptions = [
  "Toddlers (Age 2-3)",
  "Pre K (Age 4-5)",
  "Grade 1 (Age 6-7)",
  "Grade 2 (Age 8-9)",
  "Grade 3 (Age 10-11)",
];

export const dayOptions = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
export const parentTitleOptions = ["Ms", "Mrs", "Mr", "Dr"];
export const genderOptions = [
  { name: "Male", value: "male" },
  { name: "Female", value: "female" },
  { name: "Other", value: "other" },
];

export const relationshipOptions = [
  {
    name: "Father",
    value: "father",
  },
  {
    name: "Mother",
    value: "mother",
  },
  {
    name: "Sibling",
    value: "sibling",
  },
  {
    name: "Guardian",
    value: "guardian",
  },
  {
    name: "Other",
    value: "other",
  },
];

export const initialChildValues: ChildProps = {
  generalInfo: {
    firstName: "",
    lastName: "",
    middleName: "",
    dateOfBirth: "",
    enrolmentDate: "",
    photoUrl: "",
    gender: "",
    address: "",
  },
  schedule: [],
  classrooms: 0,
  medicalInfo: {
    allergies: "",
    medications: "",
    foodPreferences: "",
    dietRestriction: "",
    notes: "",
  },
  notes: "",
  emergencyInfo: {
    suffix: "",
    firstName: "",
    lastName: "",
    middleName: "",
    address: "",
    phone: "",
    relationship: "",
    email: "",
    notes: "",
  },
  parents: [
    {
      title: "",
      firstName: "",
      lastName: "",
      relationship: "",
      phone: "",
      email: "",
      address: "",
      photoUrl: null,
    },
  ],
  documents: [],
};

export const childValidationSchema = Yup.object().shape({
  schedule: Yup.array()
    .of(Yup.string())
    .min(1, "Select at least one schedule day"),
  generalInfo: Yup.object().shape({
    firstName: Yup.string().required("First name is required"),
    middleName: Yup.string().nullable().optional(),
    lastName: Yup.string().required("Last name is required"),
    dateOfBirth: Yup.string().required("Date of birth is required"),
    enrolmentDate: Yup.string().required("Date of enrolment is required"),
    gender: Yup.string().required("Gender is required"),
    // classroom: Yup.string().required("Classroom is required"),
    address: Yup.string().required("Address is required"),
  }),
  medicalInfo: Yup.object().shape({
    allergies: Yup.string(),
    medications: Yup.string(),
    foodPreferences: Yup.string(),
    dietRestriction: Yup.string(),
    notes: Yup.string(),
  }),
  emergencyInfo: Yup.object().shape({
    firstName: Yup.string().required("Emergency first name is required"),
    lastName: Yup.string().required("Emergency last name is required"),
    address: Yup.string().required("Address is required"),
    email: Yup.string().email("Invalid email").required("Emergency email is required"),
    phone: Yup.string().required("Emergency phone is required"),
  }),
  parents: Yup.array().of(
    Yup.object().shape({
      firstName: Yup.string().required("Parent's first name is required"),
      lastName: Yup.string().required("Parent's last name is required"),
      // relationship: Yup.string().required("Parent's relationship is required"),
      phone: Yup.string().required("Parent's phone is required"),
      email: Yup.string().email("Invalid email").required("Parent's email is required"),
      address: Yup.string().required("Parent's address is required"),
      notes: Yup.string(),
    }),
  ),
});
