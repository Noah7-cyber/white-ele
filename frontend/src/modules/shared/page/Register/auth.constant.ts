import * as Yup from "yup";
import {
  validatePassword,
  PASSWORD_RULES,
} from "@/utils/passwordValidation";

export interface RegisterFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  confirmPassword: string;
  role?: string;
  token?: string;
}

export const initialValue: RegisterFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  role: undefined,
};

export const validationSchema = Yup.object({
  firstName: Yup.string()
    .required("First name is required")
    .min(2, "First name must be at least 2 characters"),
  lastName: Yup.string()
    .required("Last name is required")
    .min(2, "Last name must be at least 2 characters"),
  email: Yup.string().email("Enter a valid email").required("Email is required"),
  phone: Yup.string(),
  password: Yup.string()
    .required("Password is required")
    .test("password-requirements", PASSWORD_RULES.description, function (value) {
      if (!value) return true;
      const error = validatePassword(value);
      return error ? this.createError({ message: error }) : true;
    }),
  confirmPassword: Yup.string()
    .required("Please confirm your password")
    .oneOf([Yup.ref("password")], "Passwords must match"),
  role: Yup.string(),
});

