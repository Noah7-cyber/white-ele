/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { authServices } from "@/services/auth.service";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { useFormValidator } from "@/utils/hooks/useFormValidator";
import { VerifyEmailFormValues, initialValue, validationSchema } from "../auth.constant";
import { useEffect, useRef, useState } from "react";
import { AuthRoutes } from "@/routes/auth.routes";
import { decryptUrlParam } from "@/utils/urlEncryption";
import { setCredentials } from "@/redux/store/slices/authSlice";
import { DashboardRoutes } from "@/routes/dashboard.routes";
import { StaffRoutes } from "@/routes/staff.routes";
import { setAuthTokenCookies, setUserRoleCookie } from "@/utils/helper";

export function useVerifyEmail() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromUrlRef = useRef<string | null>(null);
  const [emailFromUrl, setEmailFromUrl] = useState<string | null>(null);

  const emailParam = searchParams.get("email");

  const formInstance = useFormValidator<VerifyEmailFormValues>({
    validationSchema,
    defaultValues: {
      ...initialValue,
      email: emailFromUrl || initialValue.email,
    },
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });

  const { control, handleSubmit, setValue, getValues } = formInstance;

  // Pre-fill email from URL params if available (decrypt if encrypted)
  useEffect(() => {
    if (emailParam) {
      let email = emailParam;
      // Try to decrypt - if it fails, treat as plain text
      try {
        const decrypted = decryptUrlParam(emailParam);
        if (decrypted) {
          email = decrypted;
        }
      } catch {
        email = emailParam;
      }

      emailFromUrlRef.current = email;
      setEmailFromUrl(email);
      setValue("email", email, { shouldValidate: true });
    }
  }, [emailParam, setValue]);

  const { mutateAsync: verifyEmailAsync, isPending } = useMutationService({
    service: authServices.verifyEmail,
    options: {
      successTitle: "Email verified!",
      successMessage: "Your email has been verified successfully.",
      errorTitle: "Verification failed",
      isFormData: false,
      onSuccess: (response: any, { dispatch }) => {

        const user = (response && (response.user ?? response.data?.user)) || null;
        const accessToken =
          (response && (response.accessToken ?? response.data?.accessToken)) || null;
        const refreshToken =
          (response && (response.refreshToken ?? response.data?.refreshToken)) || null;

        // Get email from form or URL params
        const email = emailFromUrlRef.current || getValues("email") || "";
        // Role from API response (so correct dashboard is used; parent has no school subdomain)
        const userRole = (user?.role ?? "").toString().toLowerCase();

        // Store credentials in cookies and Redux before routing
        if (user && accessToken && refreshToken) {
          dispatch(setCredentials({ user, accessToken, refreshToken }));
          setAuthTokenCookies({ accessToken, refreshToken });
          // Save role in cookie so layout/dashboard routing can determine which dashboard to show
          if (userRole) {
            const cookieDomain =
              typeof window !== "undefined" &&
              process.env.NEXT_PUBLIC_APP_DOMAIN &&
              !String(process.env.NEXT_PUBLIC_APP_DOMAIN).includes("localhost")
                ? `.${process.env.NEXT_PUBLIC_APP_DOMAIN}`
                : undefined;
            setUserRoleCookie(userRole, cookieDomain ? { domain: cookieDomain } : undefined);
          }
        }

        // Check if admin has a school assigned
        const roleArray = user && Array.isArray((user as any).admin) ? (user as any).admin : [];
        const firstEntry = roleArray[0];
        const school =
          firstEntry &&
          firstEntry.school &&
          typeof firstEntry.school.id !== "undefined" &&
          typeof firstEntry.school.subDomain === "string"
            ? { id: Number(firstEntry.school.id), subDomain: String(firstEntry.school.subDomain) }
            : null;

        // Route to appropriate dashboard (or create school for admin / show get-started for parent)
        if (userRole === "admin") {
          const roleParam = searchParams.get("role");
          if (!school || roleParam?.toLowerCase() === "admin") {
            router.push(email ? `${AuthRoutes.createSchoolAccount}?email=${encodeURIComponent(email)}` : AuthRoutes.createSchoolAccount);
          } else {
            router.push(DashboardRoutes.dashboard);
          }
        } else if (userRole === "staff") {
          router.push(StaffRoutes.dashboard);
        } else if (userRole === "parent") {
          router.push(AuthRoutes.parentGetStarted);
        } else {
          router.push(AuthRoutes.parentGetStarted);
        }
      },
    },
  });

  const onValidSubmit = async (formValues: VerifyEmailFormValues) => {
    // Ensure email is always included in payload, even if field is hidden
    const payload: VerifyEmailFormValues = {
      ...formValues,
      email: formValues.email || emailFromUrlRef.current || "",
    };
    await verifyEmailAsync(payload);
  };

  const onInvalidSubmit = () => {
    console.log("Validation errors occurred");
  };

  return {
    control,
    getValues,
    handleSubmit: handleSubmit(onValidSubmit, onInvalidSubmit),
    isPending,
    email: emailFromUrl || "",
    hasEmailFromUrl: !!emailFromUrl,
    router,
  };
}
