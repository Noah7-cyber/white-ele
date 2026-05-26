import * as Yup from "yup";

export interface ForgotPasswordFormValues {
  email: string;
}

export const initialValue: ForgotPasswordFormValues = {
  email: "",
};

export const validationSchema = Yup.object({
  email: Yup.string().email("Enter a valid email").required("Email is required"),
});

