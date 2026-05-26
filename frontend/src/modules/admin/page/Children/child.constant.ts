import * as Yup from "yup";

export interface ParentProps {
  title: string;
  firstName: string;
  lastName: string;
  relationship: string;
  phone: string;
  email: string;
  address: string;
}

export interface ChildProps {
  // Profile
  firstName: string;
  lastName: string;
  middleName: string;
  dateOfBirth: string;
  dateOfEnrolment: string;
  classroom: string;
  address: string;
  schedule: string[];
  // Medical
  allergies: string;
  medications: string;
  foodPreferences: string;
  dietRestrictions: string;
  notes: string;
  // Parents - Changed from single parent to array of parents
  parents: ParentProps[];
}

export const classroomOptions = [
  "Toddlers (Age 2-3)",
  "Pre K (Age 4-5)",
  "Grade 1 (Age 6-7)",
  "Grade 2 (Age 8-9)",
  "Grade 3 (Age 10-11)",
];

export const dayOptions = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export const parentTitleOptions = ["Miss", "Mrs", "Mr"];

export const relationshipOptions = ["Mother", "Father", "Guardian", "Sibling", "Relative", "Other"];

export const initialChildValues: ChildProps = {
  firstName: "",
  lastName: "",
  middleName: "",
  dateOfBirth: "",
  dateOfEnrolment: "",
  classroom: "",
  address: "",
  schedule: [],
  allergies: "",
  medications: "",
  foodPreferences: "",
  dietRestrictions: "",
  notes: "",
  parents: [
    {
      title: "",
      firstName: "",
      lastName: "",
      relationship: "",
      phone: "",
      email: "",
      address: "",
    },
  ],
};

export const childValidationSchema = Yup.object().shape({
  firstName: Yup.string().required("First name is required"),
  lastName: Yup.string().required("Last name is required"),
  dateOfBirth: Yup.string().required("Date of birth is required"),
  dateOfEnrolment: Yup.string().required("Date of enrolment is required"),
  classroom: Yup.string().required("Classroom is required"),
  address: Yup.string().required("Address is required"),
  parents: Yup.array().of(
    Yup.object().shape({
      firstName: Yup.string().required("Parent first name is required"),
      lastName: Yup.string().required("Parent last name is required"),
      phone: Yup.string().required("Parent phone is required"),
      email: Yup.string().email("Invalid email").required("Parent email is required"),
      address: Yup.string().required("Parent address is required"),
    }),
  ),
});
