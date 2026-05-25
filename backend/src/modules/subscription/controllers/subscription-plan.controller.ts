import { BillingPlanPeriod } from "../../shared/entities/EntityEnums";
import { Response } from "express";
import { AuthenticatedRequest } from "../../auth";
import { subscriptionPlanService } from "../services/subscription-plan.service";
import { AppDataSource } from "../../core";
import { Subscription } from "../../shared/entities";
import { SubscriptionStatus } from "../../shared/entities/EntityEnums";
import { flattenSubscriptionPlanPayload, flattenSubscriptionPlansPayload } from "../utils/plan-feature-response";

class SubscriptionPlanController {
  async createSubscriptionPlan(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { name, description, currency, isCustom, isActive, billingPlans, planFeatures } = req.body;

      const result = await subscriptionPlanService.createSubscriptionPlan({
        name: String(name),
        description: String(description),
        ...(typeof currency !== "undefined" && { currency: String(currency) }),
        ...(typeof isCustom !== "undefined" && { isCustom: Boolean(isCustom) }),
        ...(typeof isActive !== "undefined" && { isActive: Boolean(isActive) }),
        billingPlans: (billingPlans as any[]).map((item: any) => ({
          period: item.period as BillingPlanPeriod,
          price: Number(item.price),
        })),
        planFeatures: (planFeatures as any[]).map((item: any) => ({
          code: String(item.code),
          isEnabled: Boolean(item.isEnabled),
          limitValue: typeof item.limitValue === "undefined" ? undefined : item.limitValue === null ? null : Number(item.limitValue),
        })),
      });

      res.status(result.success ? 201 : 400).json({
        ...result,
        subscriptionPlan: flattenSubscriptionPlanPayload((result as any).subscriptionPlan),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to create subscription plan",
      });
    }
  }

  async getSubscriptionPlans(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { isActive, isCustom, billingPeriod, pos, delta } = req.query;
      const billingPeriodValue = typeof billingPeriod !== "undefined" ? String(billingPeriod) : undefined;
      const parsedBillingPeriod =
        billingPeriodValue && (Object.values(BillingPlanPeriod) as string[]).includes(billingPeriodValue)
          ? (billingPeriodValue as BillingPlanPeriod)
          : undefined;

      const result = await subscriptionPlanService.getSubscriptionPlans({
        ...(typeof isActive !== "undefined" && { isActive: String(isActive) === "true" }),
        ...(typeof isCustom !== "undefined" && { isCustom: String(isCustom) === "true" }),
        ...(typeof parsedBillingPeriod !== "undefined" && { billingPeriod: parsedBillingPeriod }),
        ...(typeof pos !== "undefined" && { pos: Number(pos) }),
        ...(typeof delta !== "undefined" && { delta: Number(delta) }),
      });

      const schoolId =
        typeof (req as any)?.user?.schoolId === "number" && !Number.isNaN((req as any).user.schoolId)
          ? Number((req as any).user.schoolId)
          : undefined;

      const currentSubscription = schoolId
        ? await AppDataSource.getRepository(Subscription).findOne({
            where: { schoolId, status: SubscriptionStatus.ACTIVE },
            relations: ["plan", "billingPlan"],
          })
        : null;

      res.status(200).json({
        ...result,
        subscriptionPlans: flattenSubscriptionPlansPayload((result as any).subscriptionPlans),
        metadata: {
          ...(result as any).metadata,
          currentSubscription: currentSubscription
            ? {
                id: currentSubscription.id,
                planId: currentSubscription.planId,
                billingPlanId: currentSubscription.billingPlanId,
                status: currentSubscription.status,
                startDate: currentSubscription.startDate,
                renewalDate: currentSubscription.renewalDate,
              }
            : null,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to retrieve subscription plans",
      });
    }
  }

  async getSubscriptionPlanById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = Number(req.params["id"]);
      const result = await subscriptionPlanService.getSubscriptionPlanById(id);
      res.status(result.success ? 200 : 404).json({
        ...result,
        subscriptionPlan: flattenSubscriptionPlanPayload((result as any).subscriptionPlan),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to retrieve subscription plan",
      });
    }
  }

  async updateSubscriptionPlan(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = Number(req.params["id"]);
      const { name, description, currency, isCustom, isActive } = req.body;

      const result = await subscriptionPlanService.updateSubscriptionPlan(id, {
        ...(typeof name !== "undefined" && { name: String(name) }),
        ...(typeof description !== "undefined" && { description: String(description) }),
        ...(typeof currency !== "undefined" && { currency: String(currency) }),
        ...(typeof isCustom !== "undefined" && { isCustom: Boolean(isCustom) }),
        ...(typeof isActive !== "undefined" && { isActive: Boolean(isActive) }),
      });

      res.status(result.success ? 200 : 400).json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to update subscription plan",
      });
    }
  }

  async deleteSubscriptionPlan(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = Number(req.params["id"]);
      const result = await subscriptionPlanService.deleteSubscriptionPlan(id);
      res.status(result.success ? 200 : 404).json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to delete subscription plan",
      });
    }
  }
}

export const subscriptionPlanController = new SubscriptionPlanController();
