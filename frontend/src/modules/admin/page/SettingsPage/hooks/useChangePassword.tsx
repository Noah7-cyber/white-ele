/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useFormValidator } from "@/utils/hooks/useFormValidator";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { authServices } from "@/services/auth.service";
import * as Yup from "yup";
import { showToast } from "@/modules/shared/component/Toast";
import useAuthSession from "@/utils/hooks/useAuthSession";
import { validatePassword, PASSWORD_RULES } from "@/utils/passwordValidation";

export interface ChangePasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const initialValues: ChangePasswordFormValues = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export const validationSchema = Yup.object({
  currentPassword: Yup.string().required("Current password is required"),
  newPassword: Yup.string()
    .required("New password is required")
    .test("password-requirements", PASSWORD_RULES.description, function (value) {
      if (!value) return true;
      const error = validatePassword(value);
      return error ? this.createError({ message: error }) : true;
    }),
  confirmPassword: Yup.string()
    .required("Please confirm your password")
    .oneOf([Yup.ref("newPassword")], "Passwords must match"),
});

const useChangePassword = () => {
  const { logout } = useAuthSession();
  
  const formInstance = useFormValidator<ChangePasswordFormValues>({
    validationSchema,
    defaultValues: initialValues,
  });

  const { control, handleSubmit, reset } = formInstance;

  const { mutateAsync: changePasswordAsync, isPending: isChangingPassword } = useMutationService<
    { currentPassword: string; newPassword: string },
    any
  >({
    service: authServices.changePassword,
    options: {
      successTitle: "Password Changed Successfully",
      successMessage: "Your password has been updated successfully.",
      errorTitle: "Failed to Change Password",
    },
  });

  const onSubmit = async (values: ChangePasswordFormValues) => {
    try {
      // Validate passwords match (additional check)
      if (values.newPassword !== values.confirmPassword) {
        showToast({
          message: "Error",
          description: "New password and confirm password do not match.",
          severity: "error",
          duration: 3000,
        });
        return;
      }

      // Validate password requirements (additional check)
      const passwordError = validatePassword(values.newPassword);
      if (passwordError) {
        showToast({
          message: "Error",
          description: passwordError,
          severity: "error",
          duration: 3000,
        });
        return;
      }

      // Submit to API
      await changePasswordAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });

      // Reset form
      reset();

      // Show success message
      showToast({
        message: "Password Changed Successfully",
        description: "Your password has been updated. Please log in again with your new password.",
        severity: "success",
        duration: 3000,
      });

      // Logout user and redirect to login page
      // Small delay to ensure toast is visible
      setTimeout(async () => {
        await logout();
      }, 500);
    } catch (error) {
      console.error("Error changing password:", error);
      // Error is already handled by useMutationService
    }
  };

  return {
    control,
    handleSubmit: handleSubmit(onSubmit),
    isChangingPassword,
    reset,
  };
};

export default useChangePassword;

