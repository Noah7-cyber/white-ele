import { body, param, query, ValidationChain } from "express-validator";
const billingPlanPeriods = ["monthly", "quarterly", "annually", "yearly"];

export const validateCreateSubscriptionPlan: ValidationChain[] = [
  body("name")
    .notEmpty()
    .withMessage("name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("name must be between 2 and 100 characters"),
  body("description")
    .notEmpty()
    .withMessage("description is required")
    .isLength({ min: 2, max: 255 })
    .withMessage("description must be between 2 and 255 characters"),
  body("currency")
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage("currency must be a 3-letter code"),
  body("isCustom")
    .optional()
    .isBoolean()
    .withMessage("isCustom must be boolean")
    .toBoolean(),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be boolean")
    .toBoolean(),
  body("billingPlans")
    .notEmpty()
    .withMessage("billingPlans is required")
    .isArray({ min: 1 })
    .withMessage("billingPlans must be a non-empty array"),
  body("billingPlans.*.period")
    .isIn(billingPlanPeriods)
    .withMessage("billingPlans period must be one of monthly, quarterly, annually, yearly"),
  body("billingPlans.*.price")
    .isInt({ min: 0 })
    .withMessage("billingPlans price must be a non-negative integer")
    .toInt(),
  body("planFeatures")
    .notEmpty()
    .withMessage("planFeatures is required")
    .isArray({ min: 1 })
    .withMessage("planFeatures must be a non-empty array"),
  body("planFeatures.*.code")
    .if(body("planFeatures").isArray({ min: 1 }))
    .notEmpty()
    .withMessage("planFeatures code is required")
    .isString()
    .isLength({ min: 1, max: 120 })
    .withMessage("planFeatures code must be 1–120 characters"),
  body("planFeatures.*.isEnabled")
    .if(body("planFeatures").isArray({ min: 1 }))
    .isBoolean()
    .withMessage("planFeatures isEnabled must be boolean")
    .toBoolean(),
  body("planFeatures.*.limitValue")
    .if(body("planFeatures").isArray({ min: 1 }))
    .optional({ values: "null" })
    .custom((value) => {
      if (value === undefined || value === null) {
        return true;
      }
      return Number.isInteger(value) && value >= 0;
    })
    .withMessage("planFeatures limitValue must be null or a non-negative integer"),
];

export const validateGetSubscriptionPlans: ValidationChain[] = [
  query("isCustom")
    .optional()
    .isBoolean()
    .withMessage("isCustom must be boolean")
    .toBoolean(),
  query("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be boolean")
    .toBoolean(),
  query("billingPeriod")
    .optional()
    .isIn(billingPlanPeriods)
    .withMessage(`billingPeriod must be one of: ${billingPlanPeriods.join(", ")}`),
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

export const validateSubscriptionPlanId: ValidationChain[] = [
  param("id")
    .notEmpty()
    .withMessage("id is required")
    .isInt({ min: 1 })
    .withMessage("id must be a positive integer")
    .toInt(),
];

export const validateUpdateSubscriptionPlan: ValidationChain[] = [
  ...validateSubscriptionPlanId,
  body("name")
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage("name must be between 2 and 100 characters"),
  body("description")
    .optional()
    .isLength({ min: 2, max: 255 })
    .withMessage("description must be between 2 and 255 characters"),
  body("currency")
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage("currency must be a 3-letter code"),
  body("isCustom")
    .optional()
    .isBoolean()
    .withMessage("isCustom must be boolean")
    .toBoolean(),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be boolean")
    .toBoolean(),
];
