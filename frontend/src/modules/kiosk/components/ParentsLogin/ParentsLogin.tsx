/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Box, Typography } from "@mui/material";
import { CWTextField } from "@/modules/shared/component/FormFields/CWTextField";
import { Button } from "@/modules/shared/component/Button";
import SchoolLogo from "@/modules/shared/assets/svgs/schoolLogo.svg";
import LogoutIcon from "@/modules/shared/assets/svgs/logout.svg";
import useKioskVerify from "@/modules/kiosk/hooks/useKioskVerify";
import { showToast } from "@/modules/shared/component/Toast";
import useTeachersKiosk from "../TeachersKiosk/hooks/useTeachersKiosk";
import ForgotPINModal from "@/modules/kiosk/components/ForgotPINModal/ForgotPINModal";
import { useFormValidator } from "@/utils/hooks/useFormValidator";
import * as Yup from "yup";
import { decodeKioskParentCredentials } from "@/utils/kioskQrPayload";
import { SchoolLogoLoading } from "@/components/Loading/SchoolLogoLoading";
import { AuthRoutes } from "@/routes/auth.routes";
import { getToken, getUserRoleFromCookie, redirectToAuthRoute } from "@/utils/helper";

const loginSchema = Yup.object({
  email: Yup.string().trim().email("Enter a valid email address").required("Email is required"),
  kioskPin: Yup.string()
    .required("Kiosk PIN is required")
    .length(4, "Kiosk PIN must be exactly 4 digits")
    .matches(/^\d{4}$/, "Kiosk PIN must contain only numbers"),
});

type ParentsLoginFormValues = Yup.InferType<typeof loginSchema>;

const loginDefaultValues: ParentsLoginFormValues = {
  email: "",
  kioskPin: "",
};

const ParentsLogin = () => {
  const [isForgotPINOpen, setIsForgotPINOpen] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isNavigatingAfterLogin, setIsNavigatingAfterLogin] = useState(false);
  const { schoolName, schoolLogoUrl, schoolError, teachersError } = useTeachersKiosk();
  const router = useRouter();
  const searchParams = useSearchParams();
  const autoLoginToken = searchParams.get("q")?.trim() || "";
  const autoLoginEmail = searchParams.get("email")?.trim() || "";
  const autoLoginPin = searchParams.get("kioskPin")?.trim() || "";
  const shouldAutoLogin = Boolean(autoLoginToken || (autoLoginEmail && autoLoginPin));
  const [isAutoLoggingIn, setIsAutoLoggingIn] = useState(shouldAutoLogin);
  const hasAttemptedAutoLoginRef = React.useRef(false);
  const isAutoLoginFlowRef = React.useRef(false);
  const { control, handleSubmit, setValue } = useFormValidator<ParentsLoginFormValues>({
    validationSchema: loginSchema,
    defaultValues: loginDefaultValues,
  });
  const { verify, isVerifying } = useKioskVerify({ target: "parent" });
  const redirectToAdminLogin = React.useCallback(() => {
    if (typeof window === "undefined") return;
    setIsRedirecting(true);
    const returnUrl = `${window.location.pathname}${window.location.search ?? ""}`;
    const target = `${AuthRoutes.login}?role=admin&returnUrl=${encodeURIComponent(returnUrl)}`;
    if (redirectToAuthRoute(target)) return;
    router.replace(target);
  }, [router]);

  React.useEffect(() => {
    const token = getToken();
    const role = getUserRoleFromCookie()?.toLowerCase();
    if (!token || role !== "admin") {
      redirectToAdminLogin();
      return;
    }
    setIsAuthChecking(false);
  }, [redirectToAdminLogin]);

  const onSubmit = React.useCallback((data: ParentsLoginFormValues) => {
    (async () => {
      try {
        await verify({ id: data.email.trim(), pin: data.kioskPin });
        setIsNavigatingAfterLogin(true);
        showToast({
          message: "Login Successful",
          description: "Your kiosk PIN have been successfully verified",
          severity: "success",
        });
        router.push("/kiosk/parents/dashboard");
      } catch (err: any) {
        const status = err?.status ?? err?.response?.status;
        if (status === 401) {
          redirectToAdminLogin();
          return;
        }
        setIsNavigatingAfterLogin(false);
        if (isAutoLoginFlowRef.current) {
          setIsAutoLoggingIn(false);
        }
        showToast({
          message: "Invalid PIN",
          description: err?.response?.data?.message || "Invalid credentials. Please try again.",
          severity: "error",
        });
      }
    })();
  }, [redirectToAdminLogin, router, verify]);

  React.useEffect(() => {
    const getStatus = (error: unknown): number | undefined => {
      const apiError = error as
        | {
            status?: number;
            statusCode?: number;
            response?: { status?: number; data?: { statusCode?: number } };
            payload?: { status?: number; statusCode?: number };
          }
        | undefined;
      return (
        apiError?.status ??
        apiError?.statusCode ??
        apiError?.response?.status ??
        apiError?.response?.data?.statusCode ??
        apiError?.payload?.status ??
        apiError?.payload?.statusCode
      );
    };
    const schoolStatus = getStatus(schoolError);
    const staffStatus = getStatus(teachersError);
    if (schoolStatus === 401 || staffStatus === 401) {
      redirectToAdminLogin();
    }
  }, [redirectToAdminLogin, schoolError, teachersError]);

  const handleSignOut = () => {
    router.push("/kiosk");
  };

  React.useEffect(() => {
    if (hasAttemptedAutoLoginRef.current) return;
    const tokenPayload = autoLoginToken ? decodeKioskParentCredentials(autoLoginToken) : null;
    const emailFromQuery = tokenPayload?.email || autoLoginEmail;
    const pinFromQuery = tokenPayload?.kioskPin || autoLoginPin;
    if (!emailFromQuery || !pinFromQuery) return;

    setValue("email", emailFromQuery, { shouldDirty: true, shouldValidate: true });
    setValue("kioskPin", pinFromQuery, { shouldDirty: true, shouldValidate: true });
    hasAttemptedAutoLoginRef.current = true;
    isAutoLoginFlowRef.current = true;
    setIsAutoLoggingIn(true);
    void handleSubmit(onSubmit)();
  }, [autoLoginEmail, autoLoginPin, autoLoginToken, handleSubmit, onSubmit, setValue]);

  if (isAuthChecking || isRedirecting || isAutoLoggingIn || isNavigatingAfterLogin) {
    return <SchoolLogoLoading />;
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-dashboard-bg px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-screen-2xl flex-col items-center">
      {/* Header: logo and school name only; logout moved to bottom */}
      <div className="mb-4 flex w-full max-w-full shrink-0 items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center shrink-0">
            {schoolLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- dynamic API URL; add domain to next.config images if using next/image
              <img src={schoolLogoUrl} alt="School Logo" className="w-full h-full object-contain" />
            ) : (
              <SchoolLogo className="w-full h-full" />
            )}
          </div>
          <h1 className="md:text-lg text-base text-[#008080] font-medium truncate">{schoolName}</h1>
        </div>
      </div>

      <div className="flex min-h-0 w-full max-w-[560px] flex-1 flex-col items-center justify-center">
        {/* Login Card */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            width: "100%",
            maxWidth: "500px",
          }}
        >
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex w-full flex-col gap-6 rounded-xl bg-white p-6 shadow-lg sm:p-8 md:p-10"
          >
            {/* Welcome Message */}
            <Box className="text-center space-y-1">
              <Typography variant="h5" className="font-semibold!">
                Welcome back!
              </Typography>
              <Typography variant="body2" className="text-gray-500! !font-medium">
                Login to access the system.
              </Typography>
            </Box>

            {/* Email Input */}
            <CWTextField
              control={control}
              name="email"
              label="Email"
              placeholder="Enter your email"
              labelOnTop
              fullWidth
              labelClassName="!text-sm !font-medium !text-gray-700"
              inputClasses="mt-1 !text-sm !h-10 !text-gray-700 placeholder:!text-gray-400"
              className="flex-1"
            />

            {/* Kiosk Pin Input */}
            <CWTextField
              control={control}
              name="kioskPin"
              label="Kiosk Pin"
              type="password"
              placeholder="Enter your pin"
              labelOnTop
              fullWidth
              labelClassName="!text-sm !font-medium !text-gray-700"
              inputClasses="mt-1 !text-sm !h-10 !text-gray-700 placeholder:!text-gray-400"
              className="flex-1"
            />

            {/* Login Button */}
            <Button
              className="text-white! rounded-full! bg-[#008080]! hover:bg-[#006666]!"
              fullWidth
              type="submit"
              sx={{
                height: "48px",
                py: 1.2,
                textTransform: "none",
              }}
              disabled={isVerifying}
            >
              {isVerifying ? "Verifying..." : "Login"}
            </Button>

            {/* Forgot PIN Link */}
            <Box className="flex justify-center">
              <button
                type="button"
                onClick={() => setIsForgotPINOpen(true)}
                className="text-xs! text-gray-500! hover:text-gray-700! transition-colors cursor-pointer"
              >
                Forgot PIN?
              </button>
            </Box>
          </form>
        </Box>
      </div>

      <ForgotPINModal
        isOpen={isForgotPINOpen}
        onClose={() => setIsForgotPINOpen(false)}
        type="parent"
      />

      {/* Footer: logout at bottom + powered by */}
      <div className="mt-auto flex w-full max-w-[560px] shrink-0 flex-col items-center gap-4 pb-4 pt-6">
        <button
          onClick={handleSignOut}
          className="flex items-center cursor-pointer gap-1.5 text-[#FC1824] font-medium text-sm"
        >
          <LogoutIcon />
          <span>Sign Out</span>
        </button>
        <p className="text-gray-400 text-xs">
          Powered by <span className="text-[#008080] font-semibold">WhitePenguin</span>
        </p>
      </div>
      </div>
    </div>
  );
};

export default ParentsLogin;
