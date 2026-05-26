import * as Yup from "yup";

export interface LoginFormValues {
  email: string;
  password: string;
  keepMeLoggedIn: boolean;
}

export const initialValue: LoginFormValues = {
  email: "",
  password: "",
  keepMeLoggedIn: false,
};

export const validationSchema = Yup.object({
  email: Yup.string().email("Enter a valid email").required("Email is required"),
  password: Yup.string().required("Enter password").min(8, "Minimum of 8 characters"),
});
