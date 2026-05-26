import * as Yup from "yup";

export interface VerifyTokenFormValues {
  email: string;
  token: string;
}

export const initialValue: VerifyTokenFormValues = {
  email: "",
  token: "",
};

export const validationSchema = Yup.object({
  email: Yup.string().email("Enter a valid email").required("Email is required"),
  token: Yup.string().required("Token is required").min(6, "Token must be at least 6 characters"),
});

