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
  token: Yup.string()
    .required("Code is required")
    .length(6, "Code must be 6 digits")
    .matches(/^\d{6}$/, "Only numbers are allowed"),
});

