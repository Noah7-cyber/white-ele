"use client";

import { redirectToAuthRoute, isOnAuthDomain, isSubdomainMismatch } from "@/utils/helper";

export type AppRole = "admin" | "staff" | "parent";

type GuardDecision =
  | { type: "allow" }
  | { type: "redirect"; target: string; crossDomain?: boolean };

export const QR_ROLE_BLOCKED_TOAST_KEY = "qr:role-blocked-toast";

const roleHomePath: Record<AppRole, string> = {
  admin: "/admin/dashboard",
  staff: "/staff/dashboard",
  parent: "/parent",
};

const roleAuthPath: Record<AppRole, string> = {
  admin: "/auth/select-role",
  staff: "/auth/login",
  parent: "/auth/login",
};

function getCurrentPathWithQuery(): string {
  if (typeof window === "undefined") return "";
  return `${window.location.pathname}${window.location.search ?? ""}`;
}

function buildRoleAuthTarget(requiredRole: AppRole): string {
  const authRoute = roleAuthPath[requiredRole];
  const currentPathWithQuery = getCurrentPathWithQuery();

  if (requiredRole === "parent" || requiredRole === "staff") {
    const params = new URLSearchParams();
    params.set("role", requiredRole);
    if (currentPathWithQuery) {
      params.set("returnUrl", currentPathWithQuery);
    }
    return `${authRoute}?${params.toString()}`;
  }

  if (!currentPathWithQuery) return authRoute;
  return `${authRoute}?returnUrl=${encodeURIComponent(currentPathWithQuery)}`;
}

export function getEffectiveRole(): AppRole | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.split("; ").find((row) => row.startsWith("userRole="));
  if (!match) return null;
  const value = decodeURIComponent(match.split("=").slice(1).join("=").trim()).toLowerCase();
  if (value === "admin" || value === "staff" || value === "parent") return value;
  return null;
}

export function hasAccessToken(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split("; ").some((row) => row.startsWith("accessToken="));
}

export function hasRefreshToken(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split("; ").some((row) => row.startsWith("refreshToken="));
}

export function shouldAttemptSessionRestore(): boolean {
  if (typeof document === "undefined") return false;
  const keepMeLoggedIn = document.cookie
    .split("; ")
    .find((row) => row.startsWith("keepMeLoggedIn="));
  const shouldKeepSession =
    keepMeLoggedIn &&
    decodeURIComponent(keepMeLoggedIn.split("=").slice(1).join("=").trim()) === "true";
  return Boolean(shouldKeepSession && hasRefreshToken());
}

export function evaluateRoleAccess(requiredRole: AppRole): GuardDecision {
  const authRoute = buildRoleAuthTarget(requiredRole);
  const token = hasAccessToken();
  const userRole = getEffectiveRole();

  if (isOnAuthDomain()) {
    return { type: "redirect", target: authRoute };
  }

  if (isSubdomainMismatch()) {
    return { type: "redirect", target: authRoute, crossDomain: true };
  }

  if (!token || !userRole) {
    if (shouldAttemptSessionRestore()) {
      return { type: "allow" };
    }
    return { type: "redirect", target: authRoute, crossDomain: true };
  }

  if (userRole !== requiredRole) {
    return { type: "redirect", target: roleHomePath[userRole] };
  }

  return { type: "allow" };
}

export function runRoleGuard(requiredRole: AppRole, routerReplace: (path: string) => void): boolean {
  const decision = evaluateRoleAccess(requiredRole);
  if (decision.type === "allow") return true;

  if (typeof window !== "undefined") {
    const isParentQrEntryAttempt =
      requiredRole === "parent" &&
      window.location.pathname === "/parent/children" &&
      new URLSearchParams(window.location.search).get("openAttendanceModal") === "1";

    const userRole = getEffectiveRole();
    const isRoleMismatchRedirect =
      Boolean(userRole) && decision.target === roleHomePath[userRole as AppRole];

    if (isParentQrEntryAttempt && isRoleMismatchRedirect) {
      window.sessionStorage.setItem(QR_ROLE_BLOCKED_TOAST_KEY, "1");
    }
  }

  if (decision.crossDomain && redirectToAuthRoute(decision.target)) {
    return false;
  }

  routerReplace(decision.target);
  return false;
}
