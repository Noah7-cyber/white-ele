
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { authServices } from "@/services/auth.service";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { useFormValidator } from "@/utils/hooks/useFormValidator";
import { ResetPasswordFormValues, initialValue, validationSchema } from "../auth.constant";
import { useEffect } from "react";
import { decryptUrlParam } from "@/utils/urlEncryption";
import { AuthRoutes } from "@/routes/auth.routes";

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

  const encryptedEmailFromUrl = searchParams.get("email");
  const encryptedTokenFromUrl = searchParams.get("token");
  const emailFromUrl = encryptedEmailFromUrl ? decryptUrlParam(encryptedEmailFromUrl) : null;
  const tokenFromUrl = encryptedTokenFromUrl ? decryptUrlParam(encryptedTokenFromUrl) : null;
  const hasEmailAndTokenFromUrl = !!emailFromUrl && !!tokenFromUrl;

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
        const role = searchParams.get("role");
        if (role) {
          router.push(`${AuthRoutes.login}?role=${encodeURIComponent(role)}`);
        } else {
          router.push(AuthRoutes.login);
        }
      },
    },
  });

  const onValidSubmit = async (formValues: ResetPasswordFormValues) => {
    const { confirmPassword, ...payload } = formValues;

    const finalPayload = {
      ...payload,
      email: payload.email || emailFromUrl || "",
      token: payload.token || tokenFromUrl || "",
    };
    await resetPasswordAsync(finalPayload);
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
