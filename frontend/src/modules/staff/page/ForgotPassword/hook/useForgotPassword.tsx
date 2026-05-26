 
"use client";

import { useRouter } from "next/navigation";
import { authServices } from "@/services/auth.service";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { useFormValidator } from "@/utils/hooks/useFormValidator";
import { ForgotPasswordFormValues, initialValue, validationSchema } from "../auth.constant";

export function useForgotPassword() {
  const router = useRouter();

  const formInstance = useFormValidator<ForgotPasswordFormValues>({
    validationSchema,
    defaultValues: initialValue,
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });

  const { control, handleSubmit } = formInstance;

  const { mutateAsync: forgotPasswordAsync, isPending } = useMutationService({
    service: authServices.initResetPassword,
    options: {
      successTitle: "Reset link sent!",
      successMessage: "Please check your email for password reset instructions.",
      errorTitle: "Failed to send reset link",
      isFormData: false,
      onSuccess: () => {
        router.push("/auth/staff/verify-token");
      },
    },
  });

  const onValidSubmit = async (formValues: ForgotPasswordFormValues) => {
    await forgotPasswordAsync(formValues);
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

