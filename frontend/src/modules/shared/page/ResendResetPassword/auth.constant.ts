import * as Yup from "yup";

export interface ResendResetPasswordFormValues {
  email: string;
}

export const initialValue: ResendResetPasswordFormValues = {
  email: "",
};

export const validationSchema = Yup.object({
  email: Yup.string().email("Enter a valid email").required("Email is required"),
});

