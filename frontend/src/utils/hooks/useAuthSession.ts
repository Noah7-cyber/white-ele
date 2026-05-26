/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAppDispatch, useAppSelector } from "@/redux/store/hooks";
import {
  logoutUser,
  setAccessToken,
  setLoggingOut,
  setRefreshToken,
} from "@/redux/store/slices/authSlice";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import { useMutationService } from "./useMutationService";
import { authServices } from "@/services/auth.service";
import { AuthRoutes } from "@/routes/auth.routes";
import { sessionEventEmitter } from "../eventEmitters";
import {
  clearAuthCookies,
  getKeepMeLoggedInPreference,
  redirectToAuthRoute,
  setAuthTokenCookies,
} from "../helper";
import { buildReturnUrlQuery } from "../auth/returnUrl";

export const AUTH_RETURN_URL_STORAGE_KEY = "auth:returnUrl";

const useAuthSession = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const { accessToken, refreshToken, keepMeLoggedIn } = useAppSelector(({ auth }) => ({
    accessToken: auth.accessToken,
    refreshToken: auth.refreshToken,
    keepMeLoggedIn: auth.keepMeLoggedIn,
  }));

  const pathname = usePathname();
  const isKioskAuthAttemptPage =
    pathname?.startsWith("/kiosk/parents/login") || pathname?.startsWith("/kiosk/check-in");
  const isAuthAttemptPage = [
    AuthRoutes.selectRole,
    AuthRoutes.role,
    AuthRoutes.login,
    AuthRoutes.forgotPassword,
    AuthRoutes.resetPassword,
    AuthRoutes.createNewPassword,
    AuthRoutes.verifyToken,
    AuthRoutes.verifyEmail,
  ].includes(pathname as AuthRoutes) || Boolean(isKioskAuthAttemptPage);

  const { mutateAsync: refreshAuthToken, isPending: isLoading } = useMutationService({
    service: {
      ...authServices.refreshToken,
    },
  });

  const getLoginTargetForCurrentPath = () => {
    const params = new URLSearchParams();
    if (isAuthAttemptPage) {
      return AuthRoutes.login;
    }
    const currentPathWithQuery =
      typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search ?? ""}`
        : pathname || "";
    if (currentPathWithQuery) {
      params.set("returnUrl", currentPathWithQuery);
    }
    if (currentPathWithQuery.startsWith("/admin")) {
      params.set("role", "admin");
    } else if (currentPathWithQuery.startsWith("/staff")) {
      params.set("role", "staff");
    } else if (currentPathWithQuery.startsWith("/parent")) {
      params.set("role", "parent");
    } else if (currentPathWithQuery.startsWith("/kiosk")) {
      params.set("role", "admin");
    }
    const query = params.toString();
    return `${AuthRoutes.login}${query ? `?${query}` : ""}`;
  };

  const logout = async (redirectToLogin = false) => {
    dispatch(logoutUser());
    clearAuthCookies();
    const isAuthPage = [
      AuthRoutes.login,
      AuthRoutes.forgotPassword,
      AuthRoutes.resetPassword,
      AuthRoutes.createNewPassword,
      AuthRoutes.selectRole,
      AuthRoutes.role,
      AuthRoutes.verifyToken,
      AuthRoutes.verifyEmail,
    ].some((r) => pathname?.startsWith(r));
    const currentPathWithQuery =
      typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search ?? ""}`
        : pathname || "";
    const returnUrlPath = !isAuthPage && currentPathWithQuery ? currentPathWithQuery : "";
    if (returnUrlPath && typeof window !== "undefined") {
      sessionStorage.setItem(AUTH_RETURN_URL_STORAGE_KEY, returnUrlPath);
    }
    const returnUrl = buildReturnUrlQuery(returnUrlPath);
    const redirectTarget = redirectToLogin
      ? getLoginTargetForCurrentPath()
      : `${AuthRoutes.selectRole}${returnUrl}`;
    if (redirectToAuthRoute(redirectTarget)) {
      setTimeout(() => dispatch(setLoggingOut(false)), 1000);
      return;
    }
    router.replace(redirectTarget);
    setTimeout(() => dispatch(setLoggingOut(false)), 1000);
  };

  // const handleLogout = () => {
  //   if (
  //     [
  //       AuthRoutes.login,
  //       AuthRoutes.forgotPassword,
  //       AuthRoutes.resetPassword,
  //       AuthRoutes.createNewPassword,
  //     ].includes(pathname as AuthRoutes)
  //   ) {
  //     return;
  //   } else {
  //     logout();
  //   }
  // };

  // useCallback ensures a stable reference so eventemitter3's removeListener can match it
  const handleRefresh = useCallback(async () => {
    if (isLoading) return;
    if (isAuthAttemptPage) return;
    if (!getKeepMeLoggedInPreference()) {
      await logout(true);
      return;
    }

    try {
      const refreshResponse: any = await refreshAuthToken({
        refreshToken: refreshToken?.token,
      });
      const refreshTokenResponse = refreshResponse?.data ?? refreshResponse;
      if (!refreshTokenResponse?.accessToken || !refreshTokenResponse?.refreshToken) {
        throw new Error("Invalid refresh token response");
      }

      dispatch(
        setAccessToken({
          token: refreshTokenResponse?.accessToken,
          _time_stamp: new Date().toISOString(),
        }),
      );
      dispatch(
        setRefreshToken({
          token: refreshTokenResponse?.refreshToken,
          _time_stamp: new Date().toISOString(),
        }),
      );
      setAuthTokenCookies({
        accessToken: refreshTokenResponse?.accessToken,
        refreshToken: refreshTokenResponse?.refreshToken,
      }, {
        persistent: getKeepMeLoggedInPreference(),
      });
    } catch {
      // Don't redirect when user is on login page (e.g. wrong password / invalid credentials)
      if (!isAuthAttemptPage) {
        await logout(!getKeepMeLoggedInPreference());
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, refreshToken, pathname, isAuthAttemptPage]);

  useEffect(() => {
    if (isLoading || isAuthAttemptPage) return;
    if (!keepMeLoggedIn) return;
    if (accessToken?.token) return;
    if (!refreshToken?.token) return;

    void handleRefresh();
  }, [
    accessToken?.token,
    keepMeLoggedIn,
    refreshToken?.token,
    isLoading,
    pathname,
    handleRefresh,
  ]);

  useEffect(() => {
    if (
      !refreshToken ||
      ![
        "/",
        AuthRoutes.selectRole,
        AuthRoutes.role,
        AuthRoutes.login,
        AuthRoutes.forgotPassword,
        AuthRoutes.resetPassword,
        AuthRoutes.createNewPassword,
      ].includes(pathname)
    ) {
      sessionEventEmitter.removeListener("unauthorized", handleRefresh);
      sessionEventEmitter.addListener("unauthorized", handleRefresh);

      return () => {
        sessionEventEmitter.removeListener("unauthorized", handleRefresh);
      };
    }
  }, [refreshToken, pathname, handleRefresh]);

  return {
    logout,
  };
};

export default useAuthSession;
