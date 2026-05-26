 
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { authServices } from "@/services/auth.service";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { useFormValidator } from "@/utils/hooks/useFormValidator";
import { ResendEmailVerificationFormValues, initialValue, validationSchema } from "../auth.constant";
import { useEffect } from "react";
import { AuthRoutes } from "@/routes/auth.routes";

export function useResendEmailVerification() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const formInstance = useFormValidator<ResendEmailVerificationFormValues>({
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

  const { mutateAsync: resendEmailVerificationAsync, isPending } = useMutationService({
    service: authServices.resendEmailVerification,
    options: {
      successTitle: "Verification email sent!",
      successMessage: "Please check your email for the verification token.",
      errorTitle: "Failed to send verification email",
      isFormData: false,
      onSuccess: () => {
        router.push(AuthRoutes.verifyEmail);
      },
    },
  });

  const onValidSubmit = async (formValues: ResendEmailVerificationFormValues) => {
    await resendEmailVerificationAsync(formValues);
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

