/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { authServices } from "@/services/auth.service";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { useFormValidator } from "@/utils/hooks/useFormValidator";
import { VerifyTokenFormValues, initialValue, validationSchema } from "../auth.constant";
import { useEffect } from "react";
import { AuthRoutes } from "@/routes/auth.routes";
import { encryptUrlParam } from "@/utils/urlEncryption";

export function useVerifyToken() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const formInstance = useFormValidator<VerifyTokenFormValues>({
    validationSchema,
    defaultValues: initialValue,
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });

  const { control, handleSubmit, setValue } = formInstance;

  // Pre-fill email from URL params if available
  useEffect(() => {
    const email = searchParams.get("email");
    if (email) {
      setValue("email", email);
    }
  }, [searchParams, setValue]);

  const { mutateAsync: verifyTokenAsync, isPending } = useMutationService({
    service: authServices.verifyResetToken,
    options: {
      successTitle: "Token verified!",
      successMessage: "You can now reset your password.",
      errorTitle: "Invalid token",
      isFormData: false,
      onSuccess: (_, context) => {
        // Try to extract email and token from the correct context or fallback to empty string
        // 'context.variables' is used because variables are passed inside the 'context' object
        const email = (context as any)?.variables?.email ?? "";
        const token = (context as any)?.variables?.token ?? "";
        // Encrypt email and token before adding to URL
        const encryptedEmail = encryptUrlParam(email);
        const encryptedToken = encryptUrlParam(token);
        const emailParam = encodeURIComponent(encryptedEmail);
        const tokenParam = encodeURIComponent(encryptedToken);
        router.push(`${AuthRoutes.resetPassword}?email=${emailParam}&token=${tokenParam}`);
      },
    },
  });

  const onValidSubmit = async (formValues: VerifyTokenFormValues) => {
    await verifyTokenAsync(formValues);
  };

  const onInvalidSubmit = () => {
    console.log("Validation errors occurred");
  };

  return {
    control,
    handleSubmit: handleSubmit(onValidSubmit, onInvalidSubmit),
    isPending,
  };
}

