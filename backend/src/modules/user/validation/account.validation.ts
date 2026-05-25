import { body, param } from "express-validator";

export const updateUserSettingsValidation = [
  body("mfaEnabled").optional().isBoolean().withMessage("mfaEnabled must be a boolean"),

  body("enableEmailNotification").optional().isBoolean().withMessage("enableEmailNotification must be a boolean"),

  body("enableSmsNotification").optional().isBoolean().withMessage("enableSmsNotification must be a boolean"),

  body("enableInAppNotification").optional().isBoolean().withMessage("enableInAppNotification must be a boolean"),
];

export const createBankAccountValidation = [
  body("bankName").notEmpty().withMessage("Bank name is required").isLength({ max: 255 }).withMessage("Bank name is too long").trim(),

  body("bankCode").notEmpty().withMessage("Bank code is required").isLength({ max: 50 }).withMessage("Bank code is too long").trim(),

  body("accountNumber")
    .notEmpty()
    .withMessage("Account number is required")
    .isLength({ max: 50 })
    .withMessage("Account number is too long")
    .trim(),

  body("accountName")
    .notEmpty()
    .withMessage("Account name is required")
    .isLength({ max: 255 })
    .withMessage("Account name is too long")
    .trim(),

  body("swiftCode").optional().isLength({ max: 20 }).withMessage("SWIFT code is too long").trim(),

  body("sortCode").optional().isLength({ max: 20 }).withMessage("Sort code is too long").trim(),

  body("iban").optional().isLength({ max: 50 }).withMessage("IBAN is too long").trim(),

  body("currency").optional().isLength({ min: 3, max: 3 }).withMessage("Currency must be a 3-letter code").trim(),

  body("isDefault").optional().isBoolean().withMessage("isDefault must be a boolean"),
];

export const updateBankAccountValidation = [
  param("accountId").notEmpty().withMessage("Account ID is required").isInt().withMessage("Account ID must be a number"),

  body("bankName").optional().isLength({ max: 255 }).withMessage("Bank name is too long").trim(),

  body("bankCode").optional().isLength({ max: 50 }).withMessage("Bank code is too long").trim(),

  body("accountNumber").optional().isLength({ max: 50 }).withMessage("Account number is too long").trim(),

  body("accountName").optional().isLength({ max: 255 }).withMessage("Account name is too long").trim(),

  body("swiftCode").optional().isLength({ max: 20 }).withMessage("SWIFT code is too long").trim(),

  body("sortCode").optional().isLength({ max: 20 }).withMessage("Sort code is too long").trim(),

  body("iban").optional().isLength({ max: 50 }).withMessage("IBAN is too long").trim(),

  body("currency").optional().isLength({ min: 3, max: 3 }).withMessage("Currency must be a 3-letter code").trim(),

  body("isDefault").optional().isBoolean().withMessage("isDefault must be a boolean"),
];

export const bankAccountIdValidation = [
  param("accountId").notEmpty().withMessage("Account ID is required").isInt().withMessage("Account ID must be a number"),
];

export const verifyBankAccountValidation = [
  body("bankCode")
    .notEmpty()
    .withMessage("Bank code is required")
    .isString()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Bank code is too long"),

  body("bankName")
    .notEmpty()
    .withMessage("Bank name is required")
    .isString()
    .trim()
    .isLength({ max: 255 })
    .withMessage("Bank name is too long"),

  body("accountNumber")
    .notEmpty()
    .withMessage("Account number is required")
    .isString()
    .trim()
    .isLength({ min: 10, max: 10 })
    .withMessage("Account number must be exactly 10 digits")
    .matches(/^[0-9]+$/)
    .withMessage("Account number must contain only digits"),
];

export const acceptPaystackKeysValidation = [
  body("publicKey")
    .notEmpty()
    .withMessage("Paystack public key is required")
    .isString()
    .trim()
    .isLength({ max: 255 })
    .withMessage("Paystack public key is too long"),

  body("secretKey")
    .notEmpty()
    .withMessage("Paystack secret key is required")
    .isString()
    .trim()
    .isLength({ max: 255 })
    .withMessage("Paystack secret key is too long"),
];