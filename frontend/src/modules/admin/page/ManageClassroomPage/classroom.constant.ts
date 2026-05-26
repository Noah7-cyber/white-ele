import * as Yup from "yup";

export interface ClassroomProps {
  classroomName: string;
  minimumAge: string;
  maximumAge: string;
  maximumCapacity: string;
  tuitionFee: number | string;
  assignedStaff: number[];
  description: string;
}

export const initialValue: ClassroomProps = {
  classroomName: "",
  minimumAge: "",
  maximumAge: "",
  maximumCapacity: "",
  tuitionFee: 0,
  assignedStaff: [],
  description: "",
};

export const validationSchema = Yup.object().shape({
  classroomName: Yup.string().required("Class name is required"),
  minimumAge: Yup.string().required("Min age is required"),
  maximumAge: Yup.string().required("Max age is required"),
  maximumCapacity: Yup.string().required("Maximum capacity is required"),
  tuitionFee: Yup.number().optional(),
  description: Yup.string().required("Notes is required"),
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
    name: "Subject Teacher",
    value: "subject_teacher",
  },
  {
    name: "Support Staff",
    value: "support_staff",
  },
];

export const TitleOptions = ["Mr", "Mrs", "Ms", "Dr", "Prof"];

export const RelationshipOptions = [
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
