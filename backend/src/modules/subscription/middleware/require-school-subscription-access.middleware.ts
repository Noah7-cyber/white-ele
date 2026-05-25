import { Request, Response, NextFunction } from "express";
import { schoolSubscriptionService } from "../services/school-subscription.service";

/**
 * Paths that must stay reachable for past_due schools (auth, sessions, subscription payment flows,
 * Paystack callback, static/geo data, integration webhooks).
 */
const ALLOWLIST_PREFIXES = [
  "/api/v1/auth",
  "/api/v1/sessions",
  "/api/v1/subscriptions",
  "/api/v1/countries",
  "/api/v1/states",
  "/api/v1/cities",
];

function isSubscriptionPaymentRecoveryPath(pathWithoutQuery: string): boolean {
  if (pathWithoutQuery.includes("/paystack/callback")) {
    return true;
  }
  if (pathWithoutQuery.includes("/renew-checkout")) {
    return true;
  }
  if (pathWithoutQuery.includes("/upgrade-checkout")) {
    return true;
  }
  if (pathWithoutQuery.includes("/upgrade-summary")) {
    return true;
  }
  if (pathWithoutQuery.includes("/subscriptions/confirm")) {
    return true;
  }
  return false;
}

function isAllowlistedPath(fullPath: string): boolean {
  if (fullPath.startsWith("/api/v1/notifications/whatsapp-webhook")) {
    return true;
  }
  if (isSubscriptionPaymentRecoveryPath(fullPath)) {
    return true;
  }
  for (const prefix of ALLOWLIST_PREFIXES) {
    if (fullPath === prefix || fullPath.startsWith(`${prefix}/`)) {
      return true;
    }
  }
  return false;
}

/**
 * Blocks most API routes when the tenant school has a past_due subscription,
 * so admins can still reach /subscriptions (pay renew-checkout) and /auth.
 */
export async function requireSchoolSubscriptionAccess(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const raw = req.originalUrl || req.url || "";
    const pathOnly = raw.split("?")[0] || "";

    if (isAllowlistedPath(pathOnly)) {
      next();
      return;
    }

    const authUser = (req as any).user as { schoolId?: number } | undefined;
    const schoolId = authUser?.schoolId;
    if (typeof schoolId !== "number" || Number.isNaN(schoolId)) {
      next();
      return;
    }

    const blocked = await schoolSubscriptionService.schoolHasPastDueSubscription(schoolId);
    if (blocked) {
      res.status(403).json({
        success: false,
        message:
          "This school's subscription is past due. Renew your subscription under billing to restore access.",
      });
      return;
    }

    next();
  } catch (error: any) {
    next(error);
  }
}
