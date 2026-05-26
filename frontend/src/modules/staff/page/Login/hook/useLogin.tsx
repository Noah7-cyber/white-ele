/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { authServices } from "@/services/auth.service";
import { LoginRequest } from "@/services/auth.service";
import { setCredentials } from "@/redux/store/slices/authSlice";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { useFormValidator } from "@/utils/hooks/useFormValidator";
import { LoginFormValues, initialValue, validationSchema } from "../auth.constant";
import { StaffRoutes } from "@/routes/staff.routes";
import { getRefreshTokenFromCookie } from "@/utils/helper";

export function useLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleFromParams = searchParams.get("role");
  const normalizedRole =
    roleFromParams === "admin" || roleFromParams === "staff" || roleFromParams === "parent"
      ? roleFromParams
      : "staff";

  const formInstance = useFormValidator<LoginFormValues>({
    validationSchema,
    defaultValues: initialValue,
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });

  const { control, handleSubmit } = formInstance;

  const handleAuthSuccess = (
    response: unknown,
    dispatch: (action: any) => void,
  ) => {
    const user =
      response && typeof response === "object" && "user" in response
        ? (response as any).user
        : response &&
            typeof response === "object" &&
            "data" in response &&
            (response as any).data &&
            "user" in (response as any).data
          ? (response as any).data.user
          : undefined;

    const accessToken =
      response && typeof response === "object" && "accessToken" in response
        ? (response as any).accessToken
        : response &&
            typeof response === "object" &&
            "data" in response &&
            (response as any).data &&
            "accessToken" in (response as any).data
          ? (response as any).data.accessToken
          : undefined;

    const refreshToken =
      response && typeof response === "object" && "refreshToken" in response
        ? (response as any).refreshToken
        : response &&
            typeof response === "object" &&
            "data" in response &&
            (response as any).data &&
            "refreshToken" in (response as any).data
          ? (response as any).data.refreshToken
          : undefined;

    if (!user || !accessToken || !refreshToken) {
      return;
    }

    dispatch(setCredentials({ user, accessToken, refreshToken }));
    const userRole = user?.role?.toLowerCase() || "";
    document.cookie = `accessToken=${accessToken}; path=/; max-age=${24 * 60 * 60}; SameSite=Lax; Secure`;
    document.cookie = `refreshToken=${refreshToken}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax; Secure`;
    document.cookie = `userRole=${userRole}; path=/; max-age=${24 * 60 * 60}; SameSite=Lax; Secure`;
    router.push(StaffRoutes.dashboard);
  };

  const { mutateAsync: loginAsync, isPending } = useMutationService<LoginRequest>({
    service: authServices.login,
    options: {
      successTitle: "Login successful!",
      successMessage: "You're now signed in.",
      errorTitle: "Login failed",
      isFormData: false,
      onSuccess: (response, { dispatch }) => {
        handleAuthSuccess(response, dispatch);
      },
    },
  });

  const { mutateAsync: refreshAsync } = useMutationService({
    service: authServices.refreshToken,
    options: {
      isFormData: false,
      disableToast: true,
      onSuccess: (response, { dispatch }) => {
        handleAuthSuccess(response, dispatch);
      },
    },
  });

  useEffect(() => {
    const refreshToken = getRefreshTokenFromCookie();
    if (!refreshToken) return;

    const tryRestoreSession = async () => {
      try {
        await refreshAsync({ refreshToken });
      } catch {
        // Ignore refresh errors on login page and allow manual login.
      }
    };

    void tryRestoreSession();
  }, [refreshAsync]);

  const onValidSubmit = async (formValues: LoginFormValues) => {
    const payload: LoginRequest = {
      email: formValues.email,
      password: formValues.password,
      role: normalizedRole,
    };
    await loginAsync(payload);
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
