import { body, param, query, ValidationChain } from "express-validator";
import { SubscriptionStatus } from "../../shared/entities/EntityEnums";

const subscriptionStatuses = Object.values(SubscriptionStatus);

export const validateListSchoolSubscriptions: ValidationChain[] = [
  query("status")
    .optional()
    .isIn(subscriptionStatuses)
    .withMessage(`status must be one of: ${subscriptionStatuses.join(", ")}`),
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

export const validateCreateSchoolSubscription: ValidationChain[] = [
  body("planId")
    .notEmpty()
    .withMessage("planId is required")
    .isInt({ min: 1 })
    .withMessage("planId must be a positive integer")
    .toInt(),
  body("billingPlanId")
    .notEmpty()
    .withMessage("billingPlanId is required")
    .isInt({ min: 1 })
    .withMessage("billingPlanId must be a positive integer")
    .toInt(),
  body("status")
    .optional()
    .isIn(subscriptionStatuses)
    .withMessage(`status must be one of: ${subscriptionStatuses.join(", ")}`),
  body("startDate")
    .optional()
    .isISO8601()
    .withMessage("startDate must be a valid ISO 8601 date"),
  body("providerSubscriptionId")
    .optional()
    .isString()
    .isLength({ max: 255 })
    .withMessage("providerSubscriptionId must be at most 255 characters"),
  body("replaceActive")
    .optional()
    .isBoolean()
    .withMessage("replaceActive must be boolean")
    .toBoolean(),
];

export const validateInitializeSchoolSubscriptionCheckout: ValidationChain[] = [
  body("planId")
    .notEmpty()
    .withMessage("planId is required")
    .isInt({ min: 1 })
    .withMessage("planId must be a positive integer")
    .toInt(),
  body("billingPlanId")
    .notEmpty()
    .withMessage("billingPlanId is required")
    .isInt({ min: 1 })
    .withMessage("billingPlanId must be a positive integer")
    .toInt(),
  body("email")
    .optional()
    .isEmail()
    .withMessage("email must be a valid email address"),
  body("callbackUrl")
    .optional()
    .isURL({ require_tld: false, protocols: ["http", "https"] })
    .withMessage("callbackUrl must be a valid http(s) URL"),
  body("status")
    .optional()
    .isIn(subscriptionStatuses)
    .withMessage(`status must be one of: ${subscriptionStatuses.join(", ")}`),
  body("startDate")
    .optional()
    .isISO8601()
    .withMessage("startDate must be a valid ISO 8601 date"),
  body("replaceActive")
    .optional()
    .isBoolean()
    .withMessage("replaceActive must be boolean")
    .toBoolean(),
];

/** Paystack appends `reference` and/or `trxref` on browser redirect to callback_url. */
export const validatePaystackSubscriptionCallback: ValidationChain[] = [
  query("reference").custom((value, { req }) => {
    const r = typeof value === "string" ? value.trim() : "";
    const trx = req.query?.["trxref"];
    const t = typeof trx === "string" ? trx.trim() : "";
    const ref = r || t;
    if (ref.length < 2 || ref.length > 255) {
      throw new Error("Provide reference or trxref as a query parameter (from Paystack redirect)");
    }
    return true;
  }),
];

export const validateConfirmSchoolSubscription: ValidationChain[] = [
  body("reference")
    .notEmpty()
    .withMessage("reference is required")
    .isString()
    .isLength({ min: 2, max: 255 })
    .withMessage("reference must be 2–255 characters"),
  body("planId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("planId must be a positive integer")
    .toInt(),
  body("billingPlanId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("billingPlanId must be a positive integer")
    .toInt(),
  body().custom((_value, { req }) => {
    const p = req.body?.["planId"];
    const b = req.body?.["billingPlanId"];
    const hasP = p !== undefined && p !== null && p !== "";
    const hasB = b !== undefined && b !== null && b !== "";
    if (hasP !== hasB) {
      throw new Error("planId and billingPlanId must both be supplied or both omitted");
    }
    return true;
  }),
  body("status")
    .optional()
    .isIn(subscriptionStatuses)
    .withMessage(`status must be one of: ${subscriptionStatuses.join(", ")}`),
  body("startDate")
    .optional()
    .isISO8601()
    .withMessage("startDate must be a valid ISO 8601 date"),
  body("replaceActive")
    .optional()
    .isBoolean()
    .withMessage("replaceActive must be boolean")
    .toBoolean(),
];

export const validateSchoolSubscriptionId: ValidationChain[] = [
  param("id")
    .notEmpty()
    .withMessage("id is required")
    .isInt({ min: 1 })
    .withMessage("id must be a positive integer")
    .toInt(),
];

export const validateRenewSchoolSubscriptionCheckout: ValidationChain[] = [
  ...validateSchoolSubscriptionId,
  body("email")
    .optional()
    .isEmail()
    .withMessage("email must be a valid email address"),
  body("callbackUrl")
    .optional()
    .isURL({ require_tld: false, protocols: ["http", "https"] })
    .withMessage("callbackUrl must be a valid http(s) URL"),
];

export const validateUpgradeSchoolSubscriptionSummary: ValidationChain[] = [
  ...validateSchoolSubscriptionId,
  query("newPlanId")
    .notEmpty()
    .withMessage("newPlanId is required")
    .isInt({ min: 1 })
    .withMessage("newPlanId must be a positive integer")
    .toInt(),
  query("newBillingPlanId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("newBillingPlanId must be a positive integer")
    .toInt(),
];

export const validateUpgradeSchoolSubscriptionCheckout: ValidationChain[] = [
  ...validateSchoolSubscriptionId,
  body("newPlanId")
    .notEmpty()
    .withMessage("newPlanId is required")
    .isInt({ min: 1 })
    .withMessage("newPlanId must be a positive integer")
    .toInt(),
  body("newBillingPlanId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("newBillingPlanId must be a positive integer")
    .toInt(),
  body("email")
    .optional()
    .isEmail()
    .withMessage("email must be a valid email address"),
  body("callbackUrl")
    .optional()
    .isURL({ require_tld: false, protocols: ["http", "https"] })
    .withMessage("callbackUrl must be a valid http(s) URL"),
];

export const validateUpgradeCurrentSchoolSubscriptionSummary: ValidationChain[] = [
  query("newPlanId")
    .notEmpty()
    .withMessage("newPlanId is required")
    .isInt({ min: 1 })
    .withMessage("newPlanId must be a positive integer")
    .toInt(),
  query("newBillingPlanId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("newBillingPlanId must be a positive integer")
    .toInt(),
];

export const validateUpgradeCurrentSchoolSubscriptionCheckout: ValidationChain[] = [
  body("newPlanId")
    .notEmpty()
    .withMessage("newPlanId is required")
    .isInt({ min: 1 })
    .withMessage("newPlanId must be a positive integer")
    .toInt(),
  body("newBillingPlanId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("newBillingPlanId must be a positive integer")
    .toInt(),
  body("email")
    .optional()
    .isEmail()
    .withMessage("email must be a valid email address"),
];

export const validateUpdateSchoolSubscription: ValidationChain[] = [
  ...validateSchoolSubscriptionId,
  body("status")
    .optional()
    .isIn(subscriptionStatuses)
    .withMessage(`status must be one of: ${subscriptionStatuses.join(", ")}`),
  body("isCancelled")
    .optional()
    .isBoolean()
    .withMessage("isCancelled must be boolean")
    .toBoolean(),
  body("cancelledAt")
    .optional({ values: "null" })
    .isISO8601()
    .withMessage("cancelledAt must be a valid ISO 8601 date"),
  body("endDate")
    .optional({ values: "null" })
    .isISO8601()
    .withMessage("endDate must be a valid ISO 8601 date"),
  body("providerSubscriptionId")
    .optional({ values: "null" })
    .isString()
    .isLength({ max: 255 })
    .withMessage("providerSubscriptionId must be at most 255 characters"),
  body("planId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("planId must be a positive integer")
    .toInt(),
  body("billingPlanId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("billingPlanId must be a positive integer")
    .toInt(),
];
