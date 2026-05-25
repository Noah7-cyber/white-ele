import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../auth";
import {
  schoolSubscriptionService,
  SCHOOL_SUBSCRIPTION_ERROR,
} from "../services/school-subscription.service";
import { SubscriptionStatus } from "../../shared/entities/EntityEnums";

/**
 * Optional GET /paystack/callback?redirect=<encoded_url> after success.
 * URL must start with one of SUBSCRIPTION_PAYSTACK_ALLOWED_REDIRECT_PREFIXES (comma-separated).
 */
function subscriptionPaystackRedirectAllowed(target: string): boolean {
  const raw = process.env["SUBSCRIPTION_PAYSTACK_ALLOWED_REDIRECT_PREFIXES"]?.trim();
  if (!raw) {
    return false;
  }
  const prefixes = raw
    .split(",")
    .map((s) => s.trim().replace(/\/$/, ""))
    .filter(Boolean);
  if (prefixes.length === 0) {
    return false;
  }
  let decoded: string;
  try {
    decoded = decodeURIComponent(target);
  } catch {
    return false;
  }
  let url: URL;
  try {
    url = new URL(decoded);
  } catch {
    return false;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return false;
  }
  const normalized = url.toString().replace(/\/$/, "");
  return prefixes.some((prefix) => normalized.startsWith(prefix));
}

function appendPaystackCallbackRedirectParams(base: string, reference: string): string {
  const u = new URL(base);
  u.searchParams.set("reference", reference);
  u.searchParams.set("success", "true");
  return u.toString();
}

function requireSchoolId(req: AuthenticatedRequest, res: Response): number | null {
  const schoolId = req.user?.schoolId;
  if (typeof schoolId !== "number" || Number.isNaN(schoolId)) {
    res.status(403).json({
      success: false,
      message:
        "School context is required. Use tenant context (e.g. X-School-Id header or subdomain) so your account is scoped to one school.",
    });
    return null;
  }
  return schoolId;
}

class SchoolSubscriptionController {
  async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const schoolId = requireSchoolId(req, res);
      if (schoolId === null) {
        return;
      }

      const { status, pos, delta } = req.query;
      const result = await schoolSubscriptionService.listForSchool(schoolId, {
        ...(typeof status === "string" && Object.values(SubscriptionStatus).includes(status as SubscriptionStatus)
          ? { status: status as SubscriptionStatus }
          : {}),
        ...(typeof pos !== "undefined" && { pos: Number(pos) }),
        ...(typeof delta !== "undefined" && { delta: Number(delta) }),
      });

      res.status(200).json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to list subscriptions",
      });
    }
  }

  async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const schoolId = requireSchoolId(req, res);
      if (schoolId === null) {
        return;
      }

      const { planId, billingPlanId, status, startDate, providerSubscriptionId, replaceActive } = req.body;

      const result = await schoolSubscriptionService.createForSchool(schoolId, {
        planId: Number(planId),
        billingPlanId: Number(billingPlanId),
        ...(typeof status === "string" && { status: status as SubscriptionStatus }),
        ...(typeof startDate === "string" && { startDate: new Date(startDate) }),
        ...(typeof providerSubscriptionId === "string" && { providerSubscriptionId }),
        ...(typeof replaceActive !== "undefined" && { replaceActive: Boolean(replaceActive) }),
      });

      if (!result.success) {
        const code = (result as { errorCode?: string }).errorCode;
        const statusCode =
          code === SCHOOL_SUBSCRIPTION_ERROR.ACTIVE_EXISTS
            ? 409
            : 400;
        res.status(statusCode).json(result);
        return;
      }

      res.status(201).json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to create subscription",
      });
    }
  }

  async initializeCheckout(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const schoolId = requireSchoolId(req, res);
      if (schoolId === null) {
        return;
      }

      const { planId, billingPlanId, email, status, startDate, replaceActive } = req.body;

      const result = await schoolSubscriptionService.initializeCheckoutForSchool(schoolId, {
        planId: Number(planId),
        billingPlanId: Number(billingPlanId),
        email: typeof email === "string" ? email : String(req.user?.email || ""),
        ...(typeof status === "string" && { status: status as SubscriptionStatus }),
        ...(typeof startDate === "string" && { startDate: new Date(startDate) }),
        ...(typeof replaceActive !== "undefined" && { replaceActive: Boolean(replaceActive) }),
      });

      if (!result.success) {
        if (result.message === "Paystack is not configured") {
          res.status(503).json(result);
          return;
        }
        res.status(400).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to initialize checkout",
      });
    }
  }

  async renewCheckout(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const schoolId = requireSchoolId(req, res);
      if (schoolId === null) {
        return;
      }

      const subscriptionId = Number(req.params["id"]);
      const { email } = req.body;

      const result = await schoolSubscriptionService.renewCheckoutForSchool(schoolId, subscriptionId, {
        email: typeof email === "string" ? email : String(req.user?.email || ""),
      });

      if (!result.success) {
        if (result.message === "Paystack is not configured") {
          res.status(503).json(result);
          return;
        }
        if (result.message === "Subscription not found") {
          res.status(404).json(result);
          return;
        }
        res.status(400).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to initialize renewal checkout",
      });
    }
  }

  async upgradeSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const schoolId = requireSchoolId(req, res);
      if (schoolId === null) {
        return;
      }

      const subscriptionId = Number(req.params["id"]);
      const newPlanId = Number(req.query["newPlanId"]);
      const rawBilling = req.query["newBillingPlanId"];
      const newBillingPlanId =
        rawBilling !== undefined && rawBilling !== null && rawBilling !== ""
          ? Number(rawBilling)
          : undefined;

      const result = await schoolSubscriptionService.getUpgradeSummaryForSchool(
        schoolId,
        subscriptionId,
        {
          newPlanId,
          ...(typeof newBillingPlanId === "number" &&
            !Number.isNaN(newBillingPlanId) && { newBillingPlanId }),
        },
      );

      if (!result.success) {
        if (result.message === "Subscription not found") {
          res.status(404).json(result);
          return;
        }
        res.status(400).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to compute upgrade summary",
      });
    }
  }

  async upgradeCheckout(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const schoolId = requireSchoolId(req, res);
      if (schoolId === null) {
        return;
      }

      const subscriptionId = Number(req.params["id"]);
      const { newPlanId, newBillingPlanId, email } = req.body;

      const result = await schoolSubscriptionService.upgradeCheckoutForSchool(schoolId, subscriptionId, {
        newPlanId: Number(newPlanId),
        ...(typeof newBillingPlanId === "number" && { newBillingPlanId }),
        email: typeof email === "string" ? email : String(req.user?.email || ""),
      });

      if (!result.success) {
        if (result.message === "Paystack is not configured") {
          res.status(503).json(result);
          return;
        }
        if (result.message === "Subscription not found") {
          res.status(404).json(result);
          return;
        }
        res.status(400).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to initialize upgrade checkout",
      });
    }
  }

  async upgradeSummaryCurrent(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const schoolId = requireSchoolId(req, res);
      if (schoolId === null) {
        return;
      }

      const newPlanId = Number(req.query["newPlanId"]);
      const rawBilling = req.query["newBillingPlanId"];
      const newBillingPlanId =
        rawBilling !== undefined && rawBilling !== null && rawBilling !== ""
          ? Number(rawBilling)
          : undefined;

      const result = await schoolSubscriptionService.getUpgradeSummaryForCurrent(schoolId, {
        newPlanId,
        ...(typeof newBillingPlanId === "number" &&
          !Number.isNaN(newBillingPlanId) && { newBillingPlanId }),
      });

      if (!result.success) {
        if (result.message === "No active or past_due subscription to upgrade") {
          res.status(404).json(result);
          return;
        }
        res.status(400).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to compute upgrade summary",
      });
    }
  }

  async upgradeCheckoutCurrent(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const schoolId = requireSchoolId(req, res);
      if (schoolId === null) {
        return;
      }

      const { newPlanId, newBillingPlanId, email } = req.body;

      const result = await schoolSubscriptionService.upgradeCheckoutForCurrent(schoolId, {
        newPlanId: Number(newPlanId),
        ...(typeof newBillingPlanId === "number" && { newBillingPlanId }),
        email: typeof email === "string" ? email : String(req.user?.email || ""),
      });

      if (!result.success) {
        if (result.message === "Paystack is not configured") {
          res.status(503).json(result);
          return;
        }
        if (result.message === "No active or past_due subscription to upgrade") {
          res.status(404).json(result);
          return;
        }
        res.status(400).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to initialize upgrade checkout",
      });
    }
  }

  async paystackCallback(req: Request, res: Response): Promise<void> {
    try {
      const rawRef = req.query["reference"];
      const rawTrx = req.query["trxref"];
      const reference =
        typeof rawRef === "string" && rawRef.trim()
          ? rawRef.trim()
          : typeof rawTrx === "string" && rawTrx.trim()
            ? rawTrx.trim()
            : "";

      const result = await schoolSubscriptionService.processPaystackVerification(reference);

      if (!result.success) {
        console.warn(
          `[subscription/paystack/callback] failed reference=${reference} message=${result.message}`,
        );
        const code = (result as { errorCode?: string }).errorCode;
        if (code === SCHOOL_SUBSCRIPTION_ERROR.REFERENCE_OWNED_ELSEWHERE) {
          res.status(403).json(result);
          return;
        }
        if (code === SCHOOL_SUBSCRIPTION_ERROR.ACTIVE_EXISTS) {
          res.status(409).json(result);
          return;
        }
        if (result.message === "Paystack is not configured") {
          res.status(503).json(result);
          return;
        }
        res.status(400).json(result);
        return;
      }

      const rawRedirect = req.query["redirect"];
      const redirectParam =
        typeof rawRedirect === "string" && rawRedirect.trim() ? rawRedirect.trim() : "";
      if (redirectParam && subscriptionPaystackRedirectAllowed(redirectParam)) {
        res.redirect(302, appendPaystackCallbackRedirectParams(redirectParam, reference));
        return;
      }

      const idempotent = (result as { idempotent?: boolean }).idempotent === true;
      res.status(idempotent ? 200 : 201).json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to process Paystack callback",
      });
    }
  }

  async confirmWithPaystack(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const schoolId = requireSchoolId(req, res);
      if (schoolId === null) {
        return;
      }

      const { reference, planId, billingPlanId, status, startDate, replaceActive } = req.body;

      const result = await schoolSubscriptionService.confirmWithPaystackReference(schoolId, {
        reference: String(reference),
        ...(typeof planId === "number" && { planId }),
        ...(typeof billingPlanId === "number" && { billingPlanId }),
        ...(typeof status === "string" && { status: status as SubscriptionStatus }),
        ...(typeof startDate === "string" && { startDate: new Date(startDate) }),
        ...(typeof replaceActive !== "undefined" && { replaceActive: Boolean(replaceActive) }),
      });

      if (!result.success) {
        const code = (result as { errorCode?: string }).errorCode;
        if (code === SCHOOL_SUBSCRIPTION_ERROR.REFERENCE_OWNED_ELSEWHERE) {
          res.status(403).json(result);
          return;
        }
        if (code === SCHOOL_SUBSCRIPTION_ERROR.ACTIVE_EXISTS) {
          res.status(409).json(result);
          return;
        }
        if (result.message === "Paystack is not configured") {
          res.status(503).json(result);
          return;
        }
        res.status(400).json(result);
        return;
      }

      const idempotent = (result as { idempotent?: boolean }).idempotent === true;
      res.status(idempotent ? 200 : 201).json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to confirm subscription",
      });
    }
  }

  async getById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const schoolId = requireSchoolId(req, res);
      if (schoolId === null) {
        return;
      }

      const id = Number(req.params["id"]);
      const result = await schoolSubscriptionService.getByIdForSchool(schoolId, id);
      res.status(result.success ? 200 : 404).json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to retrieve subscription",
      });
    }
  }

  async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const schoolId = requireSchoolId(req, res);
      if (schoolId === null) {
        return;
      }

      const id = Number(req.params["id"]);
      const { status, isCancelled, cancelledAt, endDate, providerSubscriptionId, planId, billingPlanId } =
        req.body;

      const result = await schoolSubscriptionService.updateForSchool(schoolId, id, {
        ...(typeof status === "string" && { status: status as SubscriptionStatus }),
        ...(typeof isCancelled !== "undefined" && { isCancelled: Boolean(isCancelled) }),
        ...(typeof cancelledAt !== "undefined" && {
          cancelledAt: cancelledAt === null ? null : new Date(cancelledAt),
        }),
        ...(typeof endDate !== "undefined" && {
          endDate: endDate === null ? null : new Date(endDate),
        }),
        ...(typeof providerSubscriptionId !== "undefined" && {
          providerSubscriptionId:
            providerSubscriptionId === null ? null : String(providerSubscriptionId),
        }),
        ...(typeof planId !== "undefined" && { planId: Number(planId) }),
        ...(typeof billingPlanId !== "undefined" && { billingPlanId: Number(billingPlanId) }),
      });

      if (!result.success) {
        if (result.message === "Subscription not found") {
          res.status(404).json(result);
          return;
        }
        if ((result as { errorCode?: string }).errorCode === SCHOOL_SUBSCRIPTION_ERROR.ACTIVE_EXISTS) {
          res.status(409).json(result);
          return;
        }
        res.status(400).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to update subscription",
      });
    }
  }

  async remove(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const schoolId = requireSchoolId(req, res);
      if (schoolId === null) {
        return;
      }

      const id = Number(req.params["id"]);
      const result = await schoolSubscriptionService.deleteForSchool(schoolId, id);

      if (!result.success) {
        const code = (result as { errorCode?: string }).errorCode;
        if (result.message === "Subscription not found") {
          res.status(404).json(result);
          return;
        }
        if (code === SCHOOL_SUBSCRIPTION_ERROR.NOT_CANCELED) {
          res.status(400).json(result);
          return;
        }
        res.status(400).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to delete subscription",
      });
    }
  }
}

export const schoolSubscriptionController = new SchoolSubscriptionController();
