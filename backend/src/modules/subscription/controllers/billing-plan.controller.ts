import { Response } from "express";
import { AuthenticatedRequest } from "../../auth";
import { billingPlanService } from "../services/billing-plan.service";
import { BillingPlanPeriod } from "../../shared/entities/EntityEnums";
import { flattenBillingPlanPayload, flattenBillingPlansPayload } from "../utils/plan-feature-response";

class BillingPlanController {
  async createBillingPlan(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { subscriptionPlanId, period, price } = req.body;

      const result = await billingPlanService.createBillingPlan({
        subscriptionPlanId: Number(subscriptionPlanId),
        period: period as BillingPlanPeriod,
        price: Number(price),
      });

      res.status(result.success ? 201 : 400).json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to create billing plan",
      });
    }
  }

  async getBillingPlans(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { subscriptionPlanId, period, pos, delta } = req.query;

      const result = await billingPlanService.getBillingPlans({
        ...(subscriptionPlanId && { subscriptionPlanId: Number(subscriptionPlanId) }),
        ...(period && { period: period as BillingPlanPeriod }),
        ...(typeof pos !== "undefined" && { pos: Number(pos) }),
        ...(typeof delta !== "undefined" && { delta: Number(delta) }),
      });

      res.status(200).json({
        ...result,
        billingPlans: flattenBillingPlansPayload((result as any).billingPlans),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to retrieve billing plans",
      });
    }
  }

  async getBillingPlanById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = Number(req.params["id"]);
      const result = await billingPlanService.getBillingPlanById(id);
      res.status(result.success ? 200 : 404).json({
        ...result,
        billingPlan: flattenBillingPlanPayload((result as any).billingPlan),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to retrieve billing plan",
      });
    }
  }

  async updateBillingPlan(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = Number(req.params["id"]);
      const { subscriptionPlanId, period, price } = req.body;

      const result = await billingPlanService.updateBillingPlan(id, {
        ...(typeof subscriptionPlanId !== "undefined" && { subscriptionPlanId: Number(subscriptionPlanId) }),
        ...(typeof period !== "undefined" && { period: period as BillingPlanPeriod }),
        ...(typeof price !== "undefined" && { price: Number(price) }),
      });

      res.status(result.success ? 200 : 400).json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to update billing plan",
      });
    }
  }

  async deleteBillingPlan(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = Number(req.params["id"]);
      const result = await billingPlanService.deleteBillingPlan(id);
      res.status(result.success ? 200 : 404).json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to delete billing plan",
      });
    }
  }
}

export const billingPlanController = new BillingPlanController();
