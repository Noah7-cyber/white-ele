 
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { authServices } from "@/services/auth.service";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { useFormValidator } from "@/utils/hooks/useFormValidator";
import { ResetPasswordFormValues, initialValue, validationSchema } from "../auth.constant";
import { useEffect } from "react";
import { decryptUrlParam } from "@/utils/urlEncryption";

export function useResetPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const formInstance = useFormValidator<ResetPasswordFormValues>({
    validationSchema,
    defaultValues: initialValue,
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });

  const { control, handleSubmit, setValue } = formInstance;

  // Check if email and token are provided via URL params and decrypt them
  const encryptedEmailFromUrl = searchParams.get("email");
  const encryptedTokenFromUrl = searchParams.get("token");
  const emailFromUrl = encryptedEmailFromUrl ? decryptUrlParam(encryptedEmailFromUrl) : null;
  const tokenFromUrl = encryptedTokenFromUrl ? decryptUrlParam(encryptedTokenFromUrl) : null;
  const hasEmailAndTokenFromUrl = !!emailFromUrl && !!tokenFromUrl;

  // Pre-fill email and token from URL params if available
  useEffect(() => {
    if (emailFromUrl) {
      setValue("email", emailFromUrl);
    }
    if (tokenFromUrl) {
      setValue("token", tokenFromUrl);
    }
  }, [searchParams, setValue, emailFromUrl, tokenFromUrl]);

  const { mutateAsync: resetPasswordAsync, isPending } = useMutationService({
    service: authServices.finalizeResetPassword,
    options: {
      successTitle: "Password reset successful!",
      successMessage: "Your password has been reset. You can now login with your new password.",
      errorTitle: "Failed to reset password",
      isFormData: false,
      onSuccess: () => {
        router.push("/auth/staff/login");
      },
    },
  });

  const onValidSubmit = async (formValues: ResetPasswordFormValues) => {
    const { confirmPassword, ...payload } = formValues;
    await resetPasswordAsync(payload);
  };

  const onInvalidSubmit = () => {
    console.log("Validation errors occurred");
  };

  return {
    control,
    handleSubmit: handleSubmit(onValidSubmit, onInvalidSubmit),
    isPending,
    hasEmailAndTokenFromUrl,
  };
}

