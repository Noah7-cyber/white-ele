/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { authServices } from "@/services/auth.service";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { useFormValidator } from "@/utils/hooks/useFormValidator";
import { VerifyTokenFormValues, initialValue, validationSchema } from "../auth.constant";
import { useEffect, useRef } from "react";
import { AuthRoutes } from "@/routes/auth.routes";
import { encryptUrlParam, decryptUrlParam } from "@/utils/urlEncryption";

export function useVerifyToken() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromUrlRef = useRef<string | null>(null);
  const tokenFromUrlRef = useRef<string | null>(null);
  const hasAutoSubmittedRef = useRef(false);

  const encryptedEmailFromUrl = searchParams.get("email");
  const encryptedTokenFromUrl = searchParams.get("token");
  const emailFromUrl = (() => {
    if (!encryptedEmailFromUrl) return null;
    try {
      return decryptUrlParam(encryptedEmailFromUrl) || encryptedEmailFromUrl;
    } catch {
      return encryptedEmailFromUrl;
    }
  })();
  const tokenFromUrl = (() => {
    if (!encryptedTokenFromUrl) return null;
    try {
      return decryptUrlParam(encryptedTokenFromUrl) || encryptedTokenFromUrl;
    } catch {
      return encryptedTokenFromUrl;
    }
  })();
  const hasEmailFromUrl = !!emailFromUrl;
  const roleFromUrl = searchParams.get("role");

  const formInstance = useFormValidator<VerifyTokenFormValues>({
    validationSchema,
    defaultValues: {
      ...initialValue,
      email: emailFromUrl || initialValue.email,
    },
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });

  const { control, handleSubmit, setValue } = formInstance;


  useEffect(() => {
    if (emailFromUrl) {
      emailFromUrlRef.current = emailFromUrl;
      setValue("email", emailFromUrl, { shouldValidate: true });
    }
  }, [emailFromUrl, setValue]);

  useEffect(() => {
    if (tokenFromUrl) {
      tokenFromUrlRef.current = tokenFromUrl;
      setValue("token", tokenFromUrl, { shouldValidate: true });
    }
  }, [tokenFromUrl, setValue]);

  const { mutateAsync: verifyTokenAsync, isPending } = useMutationService({
    service: authServices.verifyResetToken,
    options: {
      successTitle: "Token verified!",
      successMessage: "You can now reset your password.",
      errorTitle: "Invalid token",
      isFormData: false,
      onSuccess: (_, context) => {
        const email = (context as any)?.variables?.email ?? emailFromUrlRef.current ?? "";
        const token = (context as any)?.variables?.token ?? "";

        const encryptedEmail = encryptUrlParam(email);
        const encryptedToken = encryptUrlParam(token);
        const emailParam = encodeURIComponent(encryptedEmail);
        const tokenParam = encodeURIComponent(encryptedToken);
        const roleQuery = roleFromUrl ? `&role=${encodeURIComponent(roleFromUrl)}` : "";
        router.push(`${AuthRoutes.resetPassword}?email=${emailParam}&token=${tokenParam}${roleQuery}`);
      },
    },
  });

  const onValidSubmit = async (formValues: VerifyTokenFormValues) => {
    const payload: VerifyTokenFormValues = {
      ...formValues,
      email: formValues.email || emailFromUrlRef.current || "",
    };
    await verifyTokenAsync(payload);
  };

  const onInvalidSubmit = () => {
    console.log("Validation errors occurred");
  };

  const submitVerification = handleSubmit(onValidSubmit, onInvalidSubmit);

  useEffect(() => {
    if (!emailFromUrl || !tokenFromUrl || hasAutoSubmittedRef.current) return;
    const timer = window.setTimeout(() => {
      hasAutoSubmittedRef.current = true;
      void submitVerification();
    }, 21500);

    return () => window.clearTimeout(timer);
  }, [emailFromUrl, tokenFromUrl, submitVerification]);

  return {
    control,
    router,
    handleSubmit: submitVerification,
    isPending,
    hasEmailFromUrl,
  };
}
