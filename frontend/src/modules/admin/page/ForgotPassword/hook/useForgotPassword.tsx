/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { authServices } from "@/services/auth.service";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { useFormValidator } from "@/utils/hooks/useFormValidator";
import { ForgotPasswordFormValues, initialValue, validationSchema } from "../auth.constant";
import { AuthRoutes } from "@/routes/auth.routes";
import { encryptUrlParam } from "@/utils/urlEncryption";

export function useForgotPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();

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
      onSuccess: (_, context) => {
        // Extract email from the form values that were submitted
        const email = (context as any)?.variables?.email ?? "";
        const role = searchParams.get("role");

        const roleQuery = role ? `&role=${encodeURIComponent(role)}` : "";
        if (email) {
          // Encrypt email and pass it as a query parameter
          const encryptedEmail = encryptUrlParam(email);
          const emailParam = encodeURIComponent(encryptedEmail);
          router.push(`${AuthRoutes.verifyToken}?email=${emailParam}${roleQuery}`);
        } else {
          router.push(
            role ? `${AuthRoutes.verifyToken}?role=${encodeURIComponent(role)}` : AuthRoutes.verifyToken,
          );
        }
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
