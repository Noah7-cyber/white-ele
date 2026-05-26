const SCHOOL_COOKIE_NAME = "school";
const SCHOOL_COOKIE_MAX_AGE_DAYS = 1;
const KEEP_ME_LOGGED_IN_COOKIE_NAME = "keepMeLoggedIn";

const APP_BASE_DOMAIN =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_APP_DOMAIN) || "";
const AUTH_APP_SUBDOMAIN =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_AUTH_APP_SUBDOMAIN)?.toString() || "app";

function deriveBaseDomainFromHostname(hostname: string): string {
  const parts = hostname.split(".").filter(Boolean);
  if (parts.length < 2) return hostname;
  return parts.slice(-2).join(".");
}

/**
 * Hostname for school sites: {subdomain}.{this} (e.g. myschool.whitepenguin.ng).
 * Uses NEXT_PUBLIC_APP_DOMAIN when set and not localhost; otherwise a dev default.
 */
export function getSchoolPortalBaseDomain(): string {
  const d = APP_BASE_DOMAIN.trim();
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host && host !== "localhost") {
      if (d && !d.includes("localhost") && host.endsWith(d)) return d;
      return deriveBaseDomainFromHostname(host);
    }
  }
  if (d && !d.includes("localhost")) return d;
  return "whitepenguin.co";
}

/** Full https origin for a school subdomain (no trailing slash). */
export function getSchoolPortalOrigin(subDomain: string): string {
  const sub = String(subDomain ?? "").trim();
  const base = getSchoolPortalBaseDomain();
  if (!sub) return `https://${base}`;
  return `https://${sub}.${base}`;
}

/** Full origin for the auth app (e.g. https://app.whitepenguin.ng or http://app.whitepenguin.ng:3000). */
export function getAuthOrigin(): string {
  if (typeof window === "undefined") return "";
  const base = getSchoolPortalBaseDomain();
  const authSubdomain = AUTH_APP_SUBDOMAIN || "app";
  const protocol = window.location.protocol;
  const port =
    window.location.port && window.location.port !== "80" && window.location.port !== "443"
      ? `:${window.location.port}`
      : "";
  if (base && !base.includes("localhost")) {
    return `${protocol}//${authSubdomain}.${base}${port}`;
  }
  return window.location.origin;
}

/** True if current host is the auth app (app.whitepenguin.ng or localhost). */
export function isOnAuthDomain(): boolean {
  if (typeof window === "undefined") return true;
  const host = window.location.hostname;
  if (host === "localhost") return true;
  const base = getSchoolPortalBaseDomain();
  if (!base || base.includes("localhost")) return true;
  const authSubdomain = AUTH_APP_SUBDOMAIN || "app";
  return host === `${authSubdomain}.${base}`;
}

/**
 * If we're on a school subdomain, redirect to the auth app origin + path (e.g. app.whitepenguin.ng/auth/select-role).
 * Returns true if a full redirect was done (caller should return). Otherwise returns false and caller can use router.
 */
export function redirectToAuthRoute(path: string): boolean {
  if (typeof window === "undefined") return false;
  if (isOnAuthDomain()) return false;
  const authOrigin = getAuthOrigin();
  if (authOrigin) {
    const pathWithoutOrigin = path.replace(/^https?:\/\/[^/]+/i, "");
    const [rawPath = "", rawQueryHash = ""] = pathWithoutOrigin.split(/(?=[?#])/);
    const normalizedPath = `/${rawPath.replace(/^\/+/, "")}`.replace(/\/{2,}/g, "/");
    const hasQueryOrHashInPath = Boolean(rawQueryHash);
    const currentQueryAndHash = `${window.location.search || ""}${window.location.hash || ""}`;
    const suffix = hasQueryOrHashInPath ? rawQueryHash : currentQueryAndHash;
    window.location.replace(`${authOrigin}${normalizedPath}${suffix}`);
    return true;
  }
  return false;
}

/**
 * When on the auth domain (app/localhost) with a school cookie, redirect to that school's subdomain + path.
 * Use from select-role so logged-in users go to school subdomain dashboard instead of app/staff/dashboard (which would bounce back).
 * Returns true if redirect was performed, false if caller should stay (e.g. show select-role UI).
 */
export function redirectToSchoolDashboard(dashboardPath: string): boolean {
  if (typeof window === "undefined") return false;
  if (!isOnAuthDomain()) return false;
  const base = (APP_BASE_DOMAIN || "").trim();
  if (!base || base.includes("localhost")) return false;
  const school = getSchoolFromCookie();
  if (!school?.subDomain) return false;
  const protocol = window.location.protocol;
  const port =
    window.location.port && window.location.port !== "80" && window.location.port !== "443"
      ? `:${window.location.port}`
      : "";
  const url = `${protocol}//${school.subDomain}.${base}${port}${dashboardPath.startsWith("/") ? dashboardPath : `/${dashboardPath}`}`;
  window.location.replace(url);
  return true;
}

/**
 * True when we're on a school subdomain and the school cookie's subDomain does not match the current host.
 * Use in layouts to redirect to auth/select-role when the user changed the subdomain (e.g. greenwood -> greenfield).
 */
export function isSubdomainMismatch(): boolean {
  if (typeof window === "undefined") return false;
  if (isOnAuthDomain()) return false;
  const hostname = window.location.hostname;
  const base = (APP_BASE_DOMAIN || "").trim();
  if (!base || base.includes("localhost")) return false;
  if (!hostname.endsWith(base)) return false;
  const currentSub = hostname.slice(0, -(base.length + 1)).toLowerCase();
  if (!currentSub || currentSub === AUTH_APP_SUBDOMAIN) return false;
  const school = getSchoolFromCookie();
  if (!school?.subDomain) return false;
  const cookieSub = school.subDomain.trim().toLowerCase();
  return cookieSub !== currentSub;
}

/**
 * After saving a new school subdomain: if the browser is on the previous school hostname
 * ({previousSubDomain}.{APP_BASE_DOMAIN}), redirect to the same path on the new host.
 * No-op on auth app, localhost, or when the host already matches the new subdomain.
 * Returns true if a full navigation was started.
 */
export function redirectToSchoolSubdomainIfChanged(
  previousSubDomain: string,
  nextSubDomain: string,
): boolean {
  if (typeof window === "undefined") return false;
  const next = String(nextSubDomain ?? "")
    .trim()
    .toLowerCase();
  const prev = String(previousSubDomain ?? "")
    .trim()
    .toLowerCase();
  if (!next || prev === next) return false;
  if (isOnAuthDomain()) return false;

  const base = (APP_BASE_DOMAIN || "").trim();
  if (!base || base.includes("localhost")) return false;

  const hostname = window.location.hostname;
  if (!hostname.endsWith(base)) return false;

  const currentSub = hostname.slice(0, -(base.length + 1)).toLowerCase();
  if (!currentSub || currentSub === AUTH_APP_SUBDOMAIN.toLowerCase()) return false;
  if (currentSub !== prev) return false;

  const protocol = window.location.protocol;
  const port =
    window.location.port && window.location.port !== "80" && window.location.port !== "443"
      ? `:${window.location.port}`
      : "";
  const path = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  window.location.replace(`${protocol}//${next}.${base}${port}${path}`);
  return true;
}

/** Clear auth cookies (call on logout). Use same domain as when set so subdomain cookies are cleared. */
export function clearAuthCookies(): void {
  if (typeof document === "undefined") return;
  const domain =
    APP_BASE_DOMAIN && !APP_BASE_DOMAIN.includes("localhost") ? `; domain=.${APP_BASE_DOMAIN}` : "";
  const expire = "; path=/; max-age=0";
  document.cookie = `accessToken=;${expire}${domain}`;
  document.cookie = `refreshToken=;${expire}${domain}`;
  document.cookie = `userRole=;${expire}${domain}`;
  document.cookie = `${SCHOOL_COOKIE_NAME}=;${expire}${domain}`;
  document.cookie = `${KEEP_ME_LOGGED_IN_COOKIE_NAME}=;${expire}${domain}`;
}

export interface SchoolFromCookie {
  id: number;
  subDomain: string;
}

export function getAccessTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.split("; ").find((row) => row.startsWith("accessToken="));
  if (!match) return null;
  return decodeURIComponent(match.split("=").slice(1).join("=").trim()) || null;
}

/** Read refreshToken from cookie. */
export function getRefreshTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.split("; ").find((row) => row.startsWith("refreshToken="));
  if (!match) return null;
  return decodeURIComponent(match.split("=").slice(1).join("=").trim()) || null;
}

/**
 * Write auth tokens to cookies on the client side.
 * Use after login / token refresh when the server has not set the cookies itself.
 */
export function setAuthTokenCookies(
  tokens: { accessToken?: string; refreshToken?: string },
  options?: { domain?: string; persistent?: boolean },
): void {
  if (typeof document === "undefined") return;
  const isSecure = process.env.NODE_ENV === "production";
  const domain =
    APP_BASE_DOMAIN && !APP_BASE_DOMAIN.includes("localhost") ? `; domain=.${APP_BASE_DOMAIN}` : "";
  const secure = isSecure ? "; Secure" : "";
  const extraDomain = options?.domain ? `; domain=${options.domain}` : domain;
  const accessTokenAge = options?.persistent ? "; max-age=86400" : "";
  const refreshTokenAge = options?.persistent ? `; max-age=${7 * 24 * 60 * 60}` : "";

  if (tokens.accessToken) {
    document.cookie = `accessToken=${encodeURIComponent(tokens.accessToken)}; path=/; SameSite=Lax${accessTokenAge}${extraDomain}${secure}`;
  }
  if (tokens.refreshToken) {
    document.cookie = `refreshToken=${encodeURIComponent(tokens.refreshToken)}; path=/; SameSite=Lax${refreshTokenAge}${extraDomain}${secure}`;
  }
}

export function getKeepMeLoggedInPreference(): boolean {
  if (typeof document === "undefined") return false;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${KEEP_ME_LOGGED_IN_COOKIE_NAME}=`));
  if (!match) return false;
  return decodeURIComponent(match.split("=").slice(1).join("=").trim()) === "true";
}

export function setKeepMeLoggedInPreference(value: boolean): void {
  if (typeof document === "undefined") return;
  const isSecure = process.env.NODE_ENV === "production";
  const domain =
    APP_BASE_DOMAIN && !APP_BASE_DOMAIN.includes("localhost") ? `; domain=.${APP_BASE_DOMAIN}` : "";
  const secure = isSecure ? "; Secure" : "";
  const maxAge = `; max-age=${7 * 24 * 60 * 60}`;
  document.cookie = `${KEEP_ME_LOGGED_IN_COOKIE_NAME}=${value}; path=/; SameSite=Lax${maxAge}${domain}${secure}`;
}

/** Read userRole from cookie. */
export function getUserRoleFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.split("; ").find((row) => row.startsWith("userRole="));
  if (!match) return null;
  return decodeURIComponent(match.split("=").slice(1).join("=").trim()) || null;
}

/** Set userRole cookie (e.g. after login or verify email) so dashboard routing works. */
export function setUserRoleCookie(role: string, options?: { domain?: string }) {
  if (typeof document === "undefined") return;
  const isSecure = process.env.NODE_ENV === "production";
  const secure = isSecure ? "; Secure" : "";
  const domain =
    options?.domain ??
    (APP_BASE_DOMAIN && !APP_BASE_DOMAIN.includes("localhost") ? `.${APP_BASE_DOMAIN}` : "");
  const domainPart = domain ? `; domain=${domain}` : "";
  document.cookie = `userRole=${encodeURIComponent(role)}; path=/; max-age=${24 * 60 * 60}; SameSite=Lax${domainPart}${secure}`;
}

export function getToken() {
  if (typeof window === "undefined") return null;
  return getAccessTokenFromCookie();
}

/**
 * Returns true if the current access token (JWT) is expired or will expire within the next bufferSeconds.
 * Used by the API client to only trigger refresh when the session has expired, not on every 401.
 * If the token is not a valid JWT or has no exp claim, returns false (do not attempt refresh).
 */
export function isAccessTokenExpired(bufferSeconds = 60): boolean {
  const token = getAccessTokenFromCookie();
  if (!token) return true;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;
    const payload = JSON.parse(atob(parts[1])) as { exp?: number };
    if (typeof payload.exp !== "number") return true;
    const nowSec = Math.floor(Date.now() / 1000);
    return nowSec >= payload.exp - bufferSeconds;
  } catch {
    return true;
  }
}

/**
 * Read the school object from the "school" cookie (set after login).
 * Cookie value is JSON: { id, subdomain }.
 * Used by the API client to send the "school" header on every request.
 */
export function getSchoolFromCookie(): SchoolFromCookie | null {
  if (typeof window === "undefined") return null;
  const match = document.cookie.split("; ").find((row) => row.startsWith(`${SCHOOL_COOKIE_NAME}=`));
  if (!match) return null;
  try {
    const value = match.split("=").slice(1).join("=").trim();
    const decoded = decodeURIComponent(value);
    const parsed = JSON.parse(decoded) as SchoolFromCookie;
    if (parsed && typeof parsed.id === "number" && typeof parsed.subDomain === "string") {
      return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Set the school cookie (call after login before redirect).
 * Use domain if redirecting to a subdomain so the cookie is sent there.
 */
export function setSchoolCookie(school: SchoolFromCookie, options?: { domain?: string }) {
  if (typeof document === "undefined") return;
  const value = encodeURIComponent(JSON.stringify(school));
  const maxAge = 60 * 60 * 24 * SCHOOL_COOKIE_MAX_AGE_DAYS;
  const isSecure = typeof window !== "undefined" && process.env.NODE_ENV === "production";
  let cookie = `${SCHOOL_COOKIE_NAME}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
  if (options?.domain) {
    cookie += `; domain=${options.domain}`;
  }
  if (isSecure) {
    cookie += "; Secure";
  }
  document.cookie = cookie;
}

export async function blobUrlToFile(blobUrl: string, filename: string, fileType: string) {
  try {
    // Fetch the blob data from the URL
    const response = await fetch(blobUrl);
    const blob = await response.blob();

    // Create a File object from the blob
    const file = new File([blob], filename, {
      type: fileType || blob.type,
      lastModified: new Date().getTime(),
    });

    return file;
  } catch (error) {
    console.error("Error converting blob URL to file:", error);
    throw error;
  }
}

export const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 16) return "Good Afternoon";
  return "Good Evening";
};

export function getRelativeTime(dateString: string | Date) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = Number(now) - Number(date);
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInWeeks = Math.floor(diffInDays / 7);
  const diffInMonths = Math.floor(diffInDays / 30);

  if (diffInSeconds < 60) {
    return "just now";
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} min${diffInMinutes > 1 ? "s" : ""} ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
  } else if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks > 1 ? "s" : ""} ago`;
  } else {
    return `${diffInMonths} month${diffInMonths > 1 ? "s" : ""} ago`;
  }
}

export const calculateAge = (dob: string | null | undefined) => {
  if (!dob) return "N/A";

  // Parse date string manually to avoid timezone issues
  // Handle ISO format: "2023-02-25" or "2023-02-25T00:00:00.000Z"
  const dateParts = dob.split("T")[0].split("-");
  if (dateParts.length !== 3) {
    console.warn("Invalid date format:", dob);
    return "N/A";
  }

  const birthYear = parseInt(dateParts[0], 10);
  const birthMonth = parseInt(dateParts[1], 10) - 1; // Month is 0-indexed in JS Date
  const birthDay = parseInt(dateParts[2], 10);

  // Validate parsed values
  if (isNaN(birthYear) || isNaN(birthMonth) || isNaN(birthDay)) {
    console.warn("Invalid date values:", dob);
    return "N/A";
  }

  // Create date objects using local time to avoid timezone issues
  const birth = new Date(birthYear, birthMonth, birthDay);
  const today = new Date();

  // Check if birth date is in the future
  if (birth > today) {
    console.warn("Date of birth is in the future:", dob);
    return "0 months";
  }

  // Calculate age
  let ageYears = today.getFullYear() - birth.getFullYear();
  let ageMonths = today.getMonth() - birth.getMonth();
  const dayDiff = today.getDate() - birth.getDate();

  // Adjust age if birthday hasn't occurred this year/month
  if (dayDiff < 0) {
    ageMonths--;
  }

  if (ageMonths < 0) {
    ageYears--;
    ageMonths += 12;
  }

  if (ageYears > 0) {
    return `${ageYears} ${ageYears === 1 ? "" : ""}`;
  } else {
    return `${Math.max(0, ageMonths)} ${Math.max(0, ageMonths) === 1 ? "month" : "months"}`;
  }
};

export type InvoiceStatus = "PAID" | "OVERDUE" | "PARTIALLY PAID" | "SENT";

export function getInvoiceStatus({
  total,
  balance,
  dueDate,
}: {
  total: number;
  balance: number;
  dueDate: string | Date;
}): InvoiceStatus {
  const now = new Date();
  const due = new Date(dueDate);

  // Fully paid
  if (balance <= 0) {
    return "PAID";
  }

  // Partially paid (some money paid, some left)
  if (balance < total) {
    return "PARTIALLY PAID";
  }

  // Not paid at all & overdue
  if (now > due) {
    return "OVERDUE";
  }

  // Not paid at all & not overdue
  return "SENT";
}

export function getAge(dateOfBirth: string) {
  const today = new Date();
  const dob = new Date(dateOfBirth);

  let age = today.getFullYear() - dob.getFullYear();

  const hasHadBirthdayThisYear =
    today.getMonth() > dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());

  if (!hasHadBirthdayThisYear) {
    age -= 1;
  }

  return age;
}
