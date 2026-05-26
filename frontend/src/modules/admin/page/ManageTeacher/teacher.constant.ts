import * as Yup from "yup";

export interface TeacherProps {
  suffix: string;
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  phone: string;
  qualification: string;
  dateOfBirth: string;
  postalCode: string;
  city: string;
  state: string;
  role: string;
  address: string;
  assignedClasses: string[] | number[];
  startDate: string | Date | null;
  emergencyContact: EmergencyContactProps;
  selectedImage: string | null;
  imageUrl?: string | File;
}

export interface EmergencyContactProps {
  suffix: string;
  firstName: string;
  lastName: string;
  contactName: string;
  relationship: string;
  email: string;
  phone: string;
  address: string;
  notes?: string;
}

export const initialValue: TeacherProps = {
  suffix: "",
  firstName: "",
  middleName: "",
  lastName: "",
  email: "",
  phone: "",
  qualification: "",
  dateOfBirth: "",
  postalCode: "",
  city: "",
  state: "",
  role: "",
  address: "",
  selectedImage: null,
  startDate: null,
  imageUrl: "",
  assignedClasses: [],
  emergencyContact: {
    suffix: "",
    address: "",
    firstName: "",
    lastName: "",
    contactName: "",
    email: "",
    phone: "",
    relationship: "",
    notes: "",
  },
};

export const validationSchema = Yup.object().shape({
  suffix: Yup.string(),
  firstName: Yup.string().required("First name is required"),
  lastName: Yup.string().required("Last name is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  phone: Yup.string().required("Phone number is required"),
  qualification: Yup.string().required("Qualification is required"),
  address: Yup.string().required("Address is required"),
  startDate: Yup.string().required("Start date is required"),
  emergencyContact: Yup.object().shape({
    suffix: Yup.string().required("Suffix is required"),
    firstName: Yup.string().required("First name is required"),
    lastName: Yup.string().required("Last name is required"),
    relationship: Yup.string().required("Relationship is required"),
    email: Yup.string().email().required("Email is required"),
    phone: Yup.string().required("Phone number is required"),
    address: Yup.string().required("Address is required"),
  }),
});

export const QualificationOptions = [
  "NCE (Nigeria Certificate in Education)",
  "B.Ed (Bachelor of Education)",
  "B.Sc (Ed) - Bachelor of Science in Education",
  "B.A (Ed) - Bachelor of Arts in Education)",
  "M.Ed (Master of Education)",
  "PGDE (Postgraduate Diploma in Education)",
  "PhD (Doctor of Philosophy in Education)",
  "B.Sc (Bachelor of Science)",
  "B.A (Bachelor of Arts)",
  "Special Education Certificate",
  "Child Psychology Diploma",
  "B.Mus (Bachelor of Music)",
  "B.Fine Arts / B.A (Fine Arts)",
  "Others",
];

export const RoleOptions = [
  {
    name: "Lead Teacher",
    value: "lead_teacher",
  },
  {
    name: "Assistant Teacher",
    value: "assistant_teacher",
  },
  {
    name: "Principal",
    value: "principal",
  },
  {
    name: "Assistant Principal",
    value: "assistant_principal",
  },
];

export const TitleOptions = ["Mr", "Mrs", "Ms", "Dr", "Prof"];

export const RelationshipOptions = ["mother", "father", "guardian", "sibling", "other"];

export const classRoomOption = [
  { name: "Grade 1", value: 1 },
  { name: "Grade 2", value: 2 },
  { name: "Grade 3", value: 3 },
];
