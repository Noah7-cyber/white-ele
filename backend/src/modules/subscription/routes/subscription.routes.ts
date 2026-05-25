import { Router } from "express";
import { authenticate, requireAdmin } from "../../auth";
import { handleValidationErrors } from "../../shared/middleware/validation";
import { billingPlanController } from "../controllers/billing-plan.controller";
import { subscriptionPlanController } from "../controllers/subscription-plan.controller";
import { schoolSubscriptionController } from "../controllers/school-subscription.controller";
import {
  validateBillingPlanId,
  validateCreateBillingPlan,
  validateGetBillingPlans,
  validateUpdateBillingPlan,
} from "../validation/billing-plan.validation";
import {
  validateCreateSubscriptionPlan,
  validateGetSubscriptionPlans,
  validateSubscriptionPlanId,
  validateUpdateSubscriptionPlan,
} from "../validation/subscription-plan.validation";
import {
  validateConfirmSchoolSubscription,
  validateCreateSchoolSubscription,
  validateInitializeSchoolSubscriptionCheckout,
  validatePaystackSubscriptionCallback,
  validateRenewSchoolSubscriptionCheckout,
  validateUpgradeCurrentSchoolSubscriptionCheckout,
  validateUpgradeCurrentSchoolSubscriptionSummary,
  validateUpgradeSchoolSubscriptionCheckout,
  validateUpgradeSchoolSubscriptionSummary,
  validateListSchoolSubscriptions,
  validateSchoolSubscriptionId,
  validateUpdateSchoolSubscription,
} from "../validation/school-subscription.validation";

const router = Router();

const requireSchoolAdmin = (req: any, res: any, next: any) => requireAdmin(req, res, next);

router.post(
  "/plans",
  authenticate,
  validateCreateSubscriptionPlan,
  handleValidationErrors,
  (req: any, res: any) => subscriptionPlanController.createSubscriptionPlan(req, res),
);

router.get(
  "/plans",
  authenticate,
  validateGetSubscriptionPlans,
  handleValidationErrors,
  (req: any, res: any) => subscriptionPlanController.getSubscriptionPlans(req, res),
);

router.get(
  "/plans/:id",
  authenticate,
  validateSubscriptionPlanId,
  handleValidationErrors,
  (req: any, res: any) => subscriptionPlanController.getSubscriptionPlanById(req, res),
);

router.put(
  "/plans/:id",
  authenticate,
  validateUpdateSubscriptionPlan,
  handleValidationErrors,
  (req: any, res: any) => subscriptionPlanController.updateSubscriptionPlan(req, res),
);

router.delete(
  "/plans/:id",
  authenticate,
  validateSubscriptionPlanId,
  handleValidationErrors,
  (req: any, res: any) => subscriptionPlanController.deleteSubscriptionPlan(req, res),
);

router.post(
  "/billing-plans",
  authenticate,
  validateCreateBillingPlan,
  handleValidationErrors,
  (req: any, res: any) => billingPlanController.createBillingPlan(req, res),
);

router.get(
  "/billing-plans",
  authenticate,
  validateGetBillingPlans,
  handleValidationErrors,
  (req: any, res: any) => billingPlanController.getBillingPlans(req, res),
);

router.get(
  "/billing-plans/:id",
  authenticate,
  validateBillingPlanId,
  handleValidationErrors,
  (req: any, res: any) => billingPlanController.getBillingPlanById(req, res),
);

router.put(
  "/billing-plans/:id",
  authenticate,
  validateUpdateBillingPlan,
  handleValidationErrors,
  (req: any, res: any) => billingPlanController.updateBillingPlan(req, res),
);

router.delete(
  "/billing-plans/:id",
  authenticate,
  validateBillingPlanId,
  handleValidationErrors,
  (req: any, res: any) => billingPlanController.deleteBillingPlan(req, res),
);

router.get(
  "/",
  authenticate,
  requireSchoolAdmin,
  validateListSchoolSubscriptions,
  handleValidationErrors,
  (req: any, res: any) => schoolSubscriptionController.list(req, res),
);

router.post(
  "/",
  authenticate,
  requireSchoolAdmin,
  validateCreateSchoolSubscription,
  handleValidationErrors,
  (req: any, res: any) => schoolSubscriptionController.create(req, res),
);

router.post(
  "/initialize-checkout",
  authenticate,
  requireSchoolAdmin,
  validateInitializeSchoolSubscriptionCheckout,
  handleValidationErrors,
  (req: any, res: any) => schoolSubscriptionController.initializeCheckout(req, res),
);

router.post(
  "/:id/renew-checkout",
  authenticate,
  requireSchoolAdmin,
  validateRenewSchoolSubscriptionCheckout,
  handleValidationErrors,
  (req: any, res: any) => schoolSubscriptionController.renewCheckout(req, res),
);

router.get(
  "/upgrade-summary",
  authenticate,
  requireSchoolAdmin,
  validateUpgradeCurrentSchoolSubscriptionSummary,
  handleValidationErrors,
  (req: any, res: any) => schoolSubscriptionController.upgradeSummaryCurrent(req, res),
);

router.post(
  "/upgrade-checkout",
  authenticate,
  requireSchoolAdmin,
  validateUpgradeCurrentSchoolSubscriptionCheckout,
  handleValidationErrors,
  (req: any, res: any) => schoolSubscriptionController.upgradeCheckoutCurrent(req, res),
);

router.get(
  "/:id/upgrade-summary",
  authenticate,
  requireSchoolAdmin,
  validateUpgradeSchoolSubscriptionSummary,
  handleValidationErrors,
  (req: any, res: any) => schoolSubscriptionController.upgradeSummary(req, res),
);

router.post(
  "/:id/upgrade-checkout",
  authenticate,
  requireSchoolAdmin,
  validateUpgradeSchoolSubscriptionCheckout,
  handleValidationErrors,
  (req: any, res: any) => schoolSubscriptionController.upgradeCheckout(req, res),
);

// Paystack: completion is GET /paystack/callback (browser redirect). POST /confirm is optional (e.g. admin/debug).
router.post(
  "/confirm",
  authenticate,
  requireSchoolAdmin,
  validateConfirmSchoolSubscription,
  handleValidationErrors,
  (req: any, res: any) => schoolSubscriptionController.confirmWithPaystack(req, res),
);

router.get(
  "/paystack/callback",
  validatePaystackSubscriptionCallback,
  handleValidationErrors,
  (req: any, res: any) => schoolSubscriptionController.paystackCallback(req, res),
);

router.get(
  "/:id",
  authenticate,
  requireSchoolAdmin,
  validateSchoolSubscriptionId,
  handleValidationErrors,
  (req: any, res: any) => schoolSubscriptionController.getById(req, res),
);

router.put(
  "/:id",
  authenticate,
  requireSchoolAdmin,
  validateUpdateSchoolSubscription,
  handleValidationErrors,
  (req: any, res: any) => schoolSubscriptionController.update(req, res),
);

router.delete(
  "/:id",
  authenticate,
  requireSchoolAdmin,
  validateSchoolSubscriptionId,
  handleValidationErrors,
  (req: any, res: any) => schoolSubscriptionController.remove(req, res),
);

export { router as subscriptionRoutes };
export default router;
