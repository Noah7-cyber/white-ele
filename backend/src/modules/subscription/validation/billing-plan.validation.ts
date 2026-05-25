import { body, param, query, ValidationChain } from "express-validator";

const billingPlanPeriods = ["monthly", "quarterly", "annually", "yearly"];

export const validateCreateBillingPlan: ValidationChain[] = [
  body("subscriptionPlanId")
    .notEmpty()
    .withMessage("subscriptionPlanId is required")
    .isInt({ min: 1 })
    .withMessage("subscriptionPlanId must be a positive integer")
    .toInt(),
  body("period")
    .notEmpty()
    .withMessage("period is required")
    .isIn(billingPlanPeriods)
    .withMessage("period must be one of monthly, quarterly, annually, yearly"),
  body("price")
    .notEmpty()
    .withMessage("price is required")
    .isInt({ min: 0 })
    .withMessage("price must be a non-negative integer")
    .toInt(),
];

export const validateGetBillingPlans: ValidationChain[] = [
  query("subscriptionPlanId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("subscriptionPlanId must be a positive integer")
    .toInt(),
  query("period")
    .optional()
    .isIn(billingPlanPeriods)
    .withMessage("period must be one of monthly, quarterly, annually, yearly"),
  query("pos")
    .optional()
    .isInt({ min: 0 })
    .withMessage("pos must be a non-negative integer")
    .toInt(),
  query("delta")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("delta must be between 1 and 100")
    .toInt(),
];

export const validateBillingPlanId: ValidationChain[] = [
  param("id")
    .notEmpty()
    .withMessage("id is required")
    .isInt({ min: 1 })
    .withMessage("id must be a positive integer")
    .toInt(),
];

export const validateUpdateBillingPlan: ValidationChain[] = [
  ...validateBillingPlanId,
  body("subscriptionPlanId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("subscriptionPlanId must be a positive integer")
    .toInt(),
  body("period")
    .optional()
    .isIn(billingPlanPeriods)
    .withMessage("period must be one of monthly, quarterly, annually, yearly"),
  body("price")
    .optional()
    .isInt({ min: 0 })
    .withMessage("price must be a non-negative integer")
    .toInt(),
];
