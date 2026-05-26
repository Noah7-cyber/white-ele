import * as Yup from "yup";

export interface TeacherProps {
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  qualifications: string;
  role: string;
  address: string;
  notes: string;
}

export const initialValue = {
  title: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  qualifications: "",
  address: "",
  notes: "",
};

export const validationSchema = Yup.object().shape({
  firstName: Yup.string().required("First name is required"),
  lastName: Yup.string().required("Last name is required"),
  email: Yup.string().required("Email is required"),
  phone: Yup.string().required("Phone number is required"),
  qualifications: Yup.string().required("Qualification is required"),
  address: Yup.string().required("Address is required"),
  notes: Yup.string(),
});
