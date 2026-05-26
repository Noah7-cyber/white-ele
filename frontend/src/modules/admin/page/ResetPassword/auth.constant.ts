import * as Yup from "yup";
import {
  validatePassword,
  PASSWORD_RULES,
} from "@/utils/passwordValidation";

export interface ResetPasswordFormValues {
  email: string;
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export const initialValue: ResetPasswordFormValues = {
  email: "",
  token: "",
  newPassword: "",
  confirmPassword: "",
};

export const validationSchema = Yup.object({
  email: Yup.string().email("Enter a valid email").required("Email is required"),
  token: Yup.string().required("Token is required"),
  newPassword: Yup.string()
    .required("Password is required")
    .test("password-requirements", PASSWORD_RULES.description, function (value) {
      if (!value) return true;
      const error = validatePassword(value);
      return error ? this.createError({ message: error }) : true;
    }),
  confirmPassword: Yup.string()
    .required("Please confirm your password")
    .oneOf([Yup.ref("newPassword")], "Passwords must match"),
});

