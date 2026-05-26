import * as Yup from "yup";

export interface ResendEmailVerificationFormValues {
  email: string;
}

export const initialValue: ResendEmailVerificationFormValues = {
  email: "",
};

export const validationSchema = Yup.object({
  email: Yup.string().email("Enter a valid email").required("Email is required"),
});

