/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { authServices } from "@/services/auth.service";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { useFormValidator } from "@/utils/hooks/useFormValidator";
import { ResendResetPasswordFormValues, initialValue, validationSchema } from "../auth.constant";
import { useEffect, useRef } from "react";
import { AuthRoutes } from "@/routes/auth.routes";
import { encryptUrlParam, decryptUrlParam } from "@/utils/urlEncryption";

export function useResendResetPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromUrlRef = useRef<string | null>(null);

  // Check if email is provided via URL params and decrypt it
  const encryptedEmailFromUrl = searchParams.get("email");
  const emailFromUrl = encryptedEmailFromUrl ? decryptUrlParam(encryptedEmailFromUrl) : null;
  const roleFromParams = searchParams.get("role");

  const formInstance = useFormValidator<ResendResetPasswordFormValues>({
    validationSchema,
    defaultValues: {
      ...initialValue,
      email: emailFromUrl || initialValue.email,
    },
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });

  const { control, handleSubmit, setValue } = formInstance;

  // Pre-fill email from URL params if available
  useEffect(() => {
    if (emailFromUrl) {
      emailFromUrlRef.current = emailFromUrl;
      setValue("email", emailFromUrl, { shouldValidate: true });
    }
  }, [emailFromUrl, setValue]);

  const { mutateAsync: resendResetPasswordAsync, isPending } = useMutationService({
    service: authServices.resendResetPassword,
    options: {
      successTitle: "Reset token sent!",
      successMessage: "Please check your email for the password reset token.",
      errorTitle: "Failed to send reset token",
      isFormData: false,
      onSuccess: (_, context) => {
        // Extract email from form values or fallback to URL param
        const email = (context as any)?.variables?.email ?? emailFromUrlRef.current ?? "";
        const role = roleFromParams;

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

  const onValidSubmit = async (formValues: ResendResetPasswordFormValues) => {
    // Ensure email is always included in payload, even if it came from URL
    const payload = {
      ...formValues,
      email: formValues.email || emailFromUrlRef.current || "",
    };
    await resendResetPasswordAsync(payload);
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

