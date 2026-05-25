import type { Request } from "express";
import { Action, Resources } from "../../auth/constants/role-permissions";

export type RbacIntent = { resource: string; action: string };

type ExceptionRule = {
  method: string;
  pattern: RegExp;
  resource: string;
  action: string;
};

/** Path after `/api/v1` (leading slash, no query). */
const PUBLIC_PATH_EXACT = new Set([
  "/",
  "/auth/register",
  "/auth/login",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/verify-email",
  "/auth/resend-verification",
  "/auth/resend-password-reset",
  "/auth/verify-reset-token",
  "/auth/refresh",
  "/auth/verify-mfa",
  "/auth/health",
  // Public invitation endpoints (token-based, no auth required)
  "/invitation/validate",
  "/invitation/accept",
  // Public kiosk verification endpoints (PIN-based, no auth required)
  "/parents/kiosk-verify",
  "/staff/kiosk-verify",
  "/admins/kiosk-verify",
]);

export function isPublicApiPath(relativePath: string): boolean {
  const p = relativePath === "" ? "/" : relativePath.startsWith("/") ? relativePath : `/${relativePath}`;
  // Strip trailing slash for matching (so /invitation/accept/ also matches)
  const normalized = p.length > 1 && p.endsWith("/") ? p.slice(0, -1) : p;
  if (normalized === "/" || PUBLIC_PATH_EXACT.has(normalized)) return true;
  if (normalized.startsWith("/notifications/whatsapp-webhook")) return true;
  if (/^\/auth\/dev\/test-token\//.test(normalized)) return true;
  return false;
}

export function getApiV1RelativePath(req: Request): string {
  const raw = (req.originalUrl || req.url || "").split("?")[0] || "/";
  const marker = "/api/v1";
  const idx = raw.indexOf(marker);
  if (idx === -1) {
    return raw.startsWith("/") ? raw : `/${raw}`;
  }
  const rest = raw.slice(idx + marker.length);
  if (!rest || rest === "") return "/";
  return rest.startsWith("/") ? rest : `/${rest}`;
}

const KNOWN_RESOURCES = new Set<string>(Object.values(Resources) as string[]);

// Intentionally restricted to modules that currently use `requirePermission`.
// This avoids changing auth/authorization behavior for unrelated routes.
const PREFIX_RESOURCE: [string, string][] = [
  ["/announcements", Resources.ANNOUNCEMENT],
  ["/analytics", Resources.ANALYTICS],
  ["/assessments", Resources.ASSESSMENT],
  ["/classroom-activity", Resources.CLASSROOM_ACTIVITY],
  ["/classroom", Resources.CLASSROOM],
  ["/invitation", Resources.INVITATION],
  ["/parents", Resources.PARENT],
  ["/school", Resources.SCHOOL],
  ["/staff", Resources.STAFF],
  ["/students", Resources.STUDENT],
];

const EXCEPTIONS: ExceptionRule[] = [
  { method: "POST", pattern: /^\/classroom\/assign\/?$/, resource: "classroom", action: Action.UPDATE },
  { method: "POST", pattern: /^\/classroom\/assign-staff\/?$/, resource: "classroom", action: Action.UPDATE },
  { method: "PUT", pattern: /^\/classroom\/update-staff-assignment\/?$/, resource: "classroom", action: Action.UPDATE },
  { method: "PUT", pattern: /^\/classroom\/reassign-staff\/?$/, resource: "classroom", action: Action.UPDATE },
  { method: "POST", pattern: /^\/invitation\/cleanup\/?$/, resource: "invitation", action: Action.UPDATE },
  { method: "PATCH", pattern: /^\/staff\/\d+\/?$/, resource: "staff", action: Action.UPDATE },
];

function longestMatchingPrefix(path: string): [string, string] | null {
  let best: [string, string] | null = null;
  for (const [prefix, resource] of PREFIX_RESOURCE) {
    if (path === prefix || path.startsWith(`${prefix}/`)) {
      if (!best || prefix.length > best[0].length) {
        best = [prefix, resource];
      }
    }
  }
  return best;
}

function defaultActionFor(method: string, _path: string, _resource: string): string | null {
  const m = method.toUpperCase();
  if (m === "GET") {
    return Action.VIEW;
  }
  if (m === "POST") return Action.CREATE;
  if (m === "PUT" || m === "PATCH") return Action.UPDATE;
  if (m === "DELETE") return Action.DELETE;
  return null;
}

/**
 * Resolve required RBAC resource + action for this HTTP request.
 * Returns null when the path should not be gated by DB RBAC (unknown / auth / etc.).
 */
export function resolveRbacIntent(req: Request): RbacIntent | null {
  const path = getApiV1RelativePath(req);
  const method = (req.method || "GET").toUpperCase();

  for (const ex of EXCEPTIONS) {
    if (ex.method === method && ex.pattern.test(path)) {
      return { resource: ex.resource, action: ex.action };
    }
  }

  const match = longestMatchingPrefix(path);
  if (!match) return null;

  const [, resource] = match;
  if (resource === "auth") return null;
  if (!KNOWN_RESOURCES.has(resource)) return null;

  const action = defaultActionFor(method, path, resource);
  if (!action) return null;

  return { resource, action };
}
