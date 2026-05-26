/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { authServices } from "@/services/auth.service";
import { LoginRequest } from "@/services/auth.service";
import {
  setAccessToken,
  setCredentials,
  setKeepMeLoggedIn,
  setRefreshToken,
} from "@/redux/store/slices/authSlice";
import { useAppDispatch } from "@/redux/store/hooks";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { useFormValidator } from "@/utils/hooks/useFormValidator";
import { LoginFormValues, initialValue, validationSchema } from "../auth.constant";
import { DashboardRoutes } from "@/routes/dashboard.routes";
import { StaffRoutes } from "@/routes/staff.routes";
import { ParentRoutes } from "@/routes/parent.routes";
import { AuthRoutes } from "@/routes/auth.routes";
import { showToast } from "@/modules/shared/component/Toast";
import { encryptUrlParam } from "@/utils/urlEncryption";
import {
  clearAuthCookies,
  getKeepMeLoggedInPreference,
  getRefreshTokenFromCookie,
  setAuthTokenCookies,
  setSchoolCookie,
} from "@/utils/helper";
import { AUTH_RETURN_URL_STORAGE_KEY } from "@/utils/hooks/useAuthSession";
import { normalizeReturnUrl } from "@/utils/auth/returnUrl";

const APP_BASE_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || "";

type LoginRoleParam = "admin" | "staff" | "parent" | undefined;

export function useLogin(explicitRole?: LoginRoleParam) {
  const extractAuthTokens = (response: unknown) => {
    const root = response as Record<string, any> | undefined;
    const nestedData = root?.data as Record<string, any> | undefined;
    const accessToken = root?.accessToken ?? nestedData?.accessToken;
    const refreshToken = root?.refreshToken ?? nestedData?.refreshToken;
    return { accessToken, refreshToken };
  };

  const parseAuthErrorCode = (apiError: any): string => {
    const directCode =
      apiError?.response?.data?.code ??
      apiError?.response?.data?.errorCode ??
      apiError?.code;
    if (typeof directCode === "string" && directCode.trim()) return directCode.toUpperCase();
    const firstErrorCode = apiError?.response?.data?.errors?.[0]?.code;
    if (typeof firstErrorCode === "string" && firstErrorCode.trim()) {
      return firstErrorCode.toUpperCase();
    }
    return "";
  };

  const router = useRouter();
  const searchParams = useSearchParams();
  const emailRef = useRef<string>("");
  const appDispatch = useAppDispatch();

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
    keepMeLoggedIn: boolean,
  ) => {
    // Handle different response structures safely
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
      console.error("Invalid login response structure", response);
      return;
    }

    dispatch(setCredentials({ user, accessToken, refreshToken, keepMeLoggedIn }));
    const userRole = user?.role?.toLowerCase() || "";

    // Role-aware: read role array from response, take first school
    const effectiveRole = (userRole || explicitRole || "").toLowerCase();
    const roleArrayKey =
      effectiveRole === "admin"
        ? "admin"
        : effectiveRole === "staff"
          ? "staff"
          : effectiveRole === "parent"
            ? "parent"
            : null;
    const roleArray =
      roleArrayKey && Array.isArray((user as any)[roleArrayKey]) ? (user as any)[roleArrayKey] : [];
    const firstEntry = roleArray[0];
    const school =
      firstEntry &&
      firstEntry.school &&
      typeof firstEntry.school.id !== "undefined" &&
      typeof firstEntry.school.subDomain === "string"
        ? { id: Number(firstEntry.school.id), subDomain: String(firstEntry.school.subDomain) }
        : null;
    const cookieDomain =
      APP_BASE_DOMAIN && !APP_BASE_DOMAIN.includes("localhost") ? `.${APP_BASE_DOMAIN}` : undefined;

    // Always set auth cookies so guards (kiosk, admin layout, etc.) can read them
    if (school && cookieDomain) {
      setSchoolCookie(school, { domain: cookieDomain });
      setAuthTokenCookies(
        { accessToken, refreshToken },
        { domain: cookieDomain, persistent: keepMeLoggedIn },
      );
      const userRoleMaxAge = keepMeLoggedIn ? `; max-age=${24 * 60 * 60}` : "";
      document.cookie = `userRole=${userRole}; path=/; SameSite=Lax${userRoleMaxAge}; domain=${cookieDomain}`;
    } else {
      setAuthTokenCookies({ accessToken, refreshToken }, { persistent: keepMeLoggedIn });
      const userRoleMaxAge = keepMeLoggedIn ? `; max-age=${24 * 60 * 60}` : "";
      document.cookie = `userRole=${userRole}; path=/; SameSite=Lax${userRoleMaxAge}`;
    }

    // Parse returnUrl once for redirect decision
    const returnUrl =
      searchParams.get("returnUrl") ||
      (typeof window !== "undefined"
        ? window.sessionStorage.getItem(AUTH_RETURN_URL_STORAGE_KEY)
        : null);
    const decodedReturnUrl = normalizeReturnUrl(returnUrl);

    const protocol =
      typeof window !== "undefined" && window.location?.protocol === "https:" ? "https:" : "http:";
    const port =
      typeof window !== "undefined" &&
      window.location?.port &&
      window.location.port !== "80" &&
      window.location.port !== "443"
        ? `:${window.location.port}`
        : "";

    if (decodedReturnUrl) {
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(AUTH_RETURN_URL_STORAGE_KEY);
      }
      if (decodedReturnUrl.startsWith("/kiosk") && effectiveRole !== "admin") {
        console.error("Kiosk access denied: non-admin account attempted kiosk login", {
          explicitRole,
          userRole,
          decodedReturnUrl,
          email: user?.email,
        });
        clearAuthCookies();
        showToast({
          message: "Kiosk access denied",
          description: "Only admin accounts can sign in to kiosk. Please use an admin account.",
          severity: "error",
        });
        router.replace(`${AuthRoutes.login}?role=admin&returnUrl=${encodeURIComponent("/kiosk/check-in")}`);
        return;
      }
      showToast({
        message: "Login successful!",
        description: "You're now signed in.",
        severity: "success",
      });
      if (school) {
        const baseUrl = `${protocol}//${school.subDomain}.${APP_BASE_DOMAIN}${port}`;
        window.location.replace(`${baseUrl}${decodedReturnUrl}`);
        return;
      }
      if (effectiveRole === "admin" && !school) {
        router.push(AuthRoutes.createSchoolAccount);
        return;
      }
      router.push(decodedReturnUrl);
      return;
    }

    if (school) {
      showToast({
        message: "Login successful!",
        description: "You're now signed in.",
        severity: "success",
      });
      const dashboardPath =
        effectiveRole === "admin"
          ? DashboardRoutes.dashboard
          : effectiveRole === "staff"
            ? StaffRoutes.dashboard
            : effectiveRole === "parent"
              ? ParentRoutes.dashboard
              : "/dashboard";
      const baseUrl = `${protocol}//${school.subDomain}.${APP_BASE_DOMAIN}${port}`;
      window.location.replace(`${baseUrl}${dashboardPath}`);
      return;
    }

    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(AUTH_RETURN_URL_STORAGE_KEY);
    }

    if (effectiveRole === "admin") {
      showToast({
        message: "Login successful!",
        description: "You're now signed in.",
        severity: "success",
      });
      router.push(AuthRoutes.createSchoolAccount);
    } else if (effectiveRole === "staff") {
      showToast({
        message: "Login successful!",
        description: "You're now signed in.",
        severity: "success",
      });
      router.push(StaffRoutes.dashboard);
    } else if (effectiveRole === "parent") {
      showToast({
        message: "Login successful!",
        description: "You're now signed in.",
        severity: "success",
      });
      router.push(ParentRoutes.dashboard);
    } else {
      showToast({
        message: "Login successful!",
        description: "You're now signed in.",
        severity: "success",
      });
      router.push("/dashboard");
    }
  };

  const { mutateAsync: loginAsync, isPending } = useMutationService({
    service: authServices.login,
    options: {
      disableToast: true,
      errorTitle: "Login failed",
      isFormData: false,
      onError: (error: unknown) => {
        const apiError = error as any;
        const errorCode = parseAuthErrorCode(apiError);
        const errorsArray =
          apiError?.response?.data?.errors && Array.isArray(apiError.response.data.errors)
            ? apiError.response.data.errors
            : null;

        let errorMessage = "";

        if (errorsArray) {
          errorMessage = errorsArray
            .map((err: any) => `${err.msg}${err.path ? ` (${err.path})` : ""}`)
            .join("\n");
        } else {
          errorMessage =
            apiError?.response?.data?.message || apiError?.message || "Something went wrong.";
        }

        const isUnverifiedCode =
          errorCode === "EMAIL_UNVERIFIED" || errorCode === "VERIFY_EMAIL_REQUIRED";
        const isRoleNotAllowedCode =
          errorCode === "ROLE_NOT_ALLOWED" || errorCode === "ACCOUNT_ROLE_MISMATCH";

        if (isRoleNotAllowedCode) {
          showToast({
            message: "Role not allowed",
            description:
              "This account cannot sign in with the selected role. Please switch role and try again.",
            severity: "error",
          });
          return;
        }

        // Show default error toast
        showToast({
          message: "Login failed",
          description: errorMessage,
          severity: "error",
        });

        // Check if error is related to email verification
        const lowerErrorMessage = errorMessage.toLowerCase();
        if (
          isUnverifiedCode ||
          lowerErrorMessage.includes("please verify your email address before logging in") ||
          lowerErrorMessage.includes("verify your email")
        ) {
          // Route to verify email page with encrypted email as query parameter if available
          const email = emailRef.current;
          // Use window.location.replace for a hard redirect to prevent any navigation issues
          // This replaces the current history entry instead of adding a new one
          setTimeout(() => {
            if (email) {
              const encryptedEmail = encryptUrlParam(email);
              const emailParam = encodeURIComponent(encryptedEmail);
              window.location.replace(`${AuthRoutes.verifyEmail}?email=${emailParam}`);
            } else {
              window.location.replace(AuthRoutes.verifyEmail);
            }
          }, 150);
        }
      },
      onSuccess: (response, { dispatch }) => {
        const keepMeLoggedIn = getKeepMeLoggedInPreference();
        handleAuthSuccess(response, dispatch, keepMeLoggedIn);
      },
    },
  });

  const { mutateAsync: refreshAsync } = useMutationService({
    service: authServices.refreshToken,
    options: {
      isFormData: false,
      disableToast: true,
      onSuccess: (response, { dispatch }) => {
        const { accessToken, refreshToken } = extractAuthTokens(response);
        if (accessToken && refreshToken) {
          dispatch(
            setAccessToken({
              token: accessToken,
              _time_stamp: new Date().toISOString(),
            }),
          );
          dispatch(
            setRefreshToken({
              token: refreshToken,
              _time_stamp: new Date().toISOString(),
            }),
          );
          setAuthTokenCookies(
            { accessToken, refreshToken },
            { persistent: getKeepMeLoggedInPreference() },
          );
        }
        const root = response as Record<string, any> | undefined;
        const nestedData = root?.data as Record<string, any> | undefined;
        const user = root?.user ?? nestedData?.user;
        if (user) {
          handleAuthSuccess(response, dispatch, true);
        }
      },
    },
  });

  useEffect(() => {
    if (!getKeepMeLoggedInPreference()) return;
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
    // Store email in ref so onError handler can access it
    emailRef.current = formValues.email;
    const keepMeLoggedIn = Boolean(formValues.keepMeLoggedIn);
    const payload: LoginRequest & { role?: LoginRoleParam } = {
      email: formValues.email,
      password: formValues.password,
    };

    // Include role in payload when present so backend can use it for context.
    if (explicitRole) {
      payload.role = explicitRole;
    }

    // Persist preference before login request for success/error handlers and client interceptors.
    appDispatch(setKeepMeLoggedIn(keepMeLoggedIn));
    await loginAsync(payload);
  };

  const onInvalidSubmit = () => {
    console.error("Validation errors occurred");
  };

  return {
    control,
    handleSubmit: handleSubmit(onValidSubmit, onInvalidSubmit),
    isPending,
  };
}
