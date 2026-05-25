import { body, param, query } from "express-validator";
import { BillingPeriod, PaymentMethod } from "../../shared/entities/EntityEnums";

export const createInvoiceValidation = [
  // schoolId should NOT be in payload - it comes from authenticated user
  body("schoolId")
    .custom((value) => {
      if (value !== undefined) {
        throw new Error("schoolId should not be provided in payload. It is automatically set from the authenticated user's school.");
      }
      return true;
    }),
  // invoiceNumber - optional (will be generated if not provided)
  body("invoiceNumber")
    .optional()
    .isString()
    .withMessage("Invoice number must be a string")
    .isLength({ max: 255 })
    .withMessage("Invoice number must not exceed 255 characters"),

  // classroomId
  body("classroomId")
    .notEmpty()
    .withMessage("Classroom ID is required")
    .isInt()
    .withMessage("Classroom ID must be an integer"),

  // studentId - optional (can be used with studentsIds)
  body("studentId")
    .optional()
    .isInt()
    .withMessage("Student ID must be an integer"),

  // studentsIds - optional array (can be used with studentId)
  body("studentsIds")
    .optional()
    .isArray()
    .withMessage("Students IDs must be an array")
    .custom((value) => {
      if (Array.isArray(value) && value.length === 0) {
        throw new Error("Students IDs array cannot be empty");
      }
      return true;
    }),

  body("studentsIds.*")
    .optional()
    .isInt()
    .withMessage("Each student ID must be an integer"),

  // Custom validation: at least one of studentId or studentsIds must be provided
  body().custom((value) => {
    const hasStudentId = value.studentId !== undefined && value.studentId !== null;
    const hasStudentsIds = Array.isArray(value.studentsIds) && value.studentsIds.length > 0;
    
    if (!hasStudentId && !hasStudentsIds) {
      throw new Error("Either studentId or studentsIds must be provided");
    }
    return true;
  }),

  // notes - optional
  body("notes")
    .optional()
    .isString()
    .withMessage("Notes must be a string"),

  // billingPeriod - optional
  body("billingPeriod")
    .optional()
    .isIn(Object.values(BillingPeriod))
    .withMessage(`Billing period must be one of: ${Object.values(BillingPeriod).join(", ")}`),

  body("paymentMethod")
    .optional()
    .isIn(Object.values(PaymentMethod))
    .withMessage(`Payment method must be one of: ${Object.values(PaymentMethod).join(", ")}`),

  // issueDate
  body("issueDate")
    .notEmpty()
    .withMessage("Issue date is required")
    .isISO8601()
    .withMessage("Issue date must be a valid date (ISO 8601 format)"),

  // dueDate
  body("dueDate")
    .notEmpty()
    .withMessage("Due date is required")
    .isISO8601()
    .withMessage("Due date must be a valid date (ISO 8601 format)"),

  // amountPaid
  body("amountPaid")
    .notEmpty()
    .withMessage("Amount paid is required")
    .isNumeric()
    .withMessage("Amount paid must be a number")
    .custom((value) => {
      if (value < 0) {
        throw new Error("Amount paid cannot be negative");
      }
      return true;
    }),

  body("discount")
    .optional()
    .isNumeric()
    .withMessage("Discount must be a number")
    .custom((value) => {
      if (value < 0) {
        throw new Error("Discount cannot be negative");
      }
      return true;
    }),

  // subtotal, balance, and total are computed in the backend (not accepted from payload)

  // items array
  body("items")
    .notEmpty()
    .withMessage("Items array is required")
    .isArray({ min: 1 })
    .withMessage("Items must be an array with at least one item"),

  // Item validation
  body("items.*.description")
    .notEmpty()
    .withMessage("Item description is required")
    .isString()
    .withMessage("Item description must be a string")
    .isLength({ max: 255 })
    .withMessage("Item description must not exceed 255 characters"),

  body("items.*.quantity")
    .notEmpty()
    .withMessage("Item quantity is required")
    .isInt({ min: 1 })
    .withMessage("Item quantity must be a positive integer"),

  body("items.*.rate")
    .notEmpty()
    .withMessage("Item rate is required")
    .isNumeric()
    .withMessage("Item rate must be a number")
    .custom((value) => {
      if (value < 0) {
        throw new Error("Item rate cannot be negative");
      }
      return true;
    }),

  body("items.*.amount")
    .optional()
    .isNumeric()
    .withMessage("Item amount must be a number")
    .custom((value) => {
      if (value < 0) {
        throw new Error("Item amount cannot be negative");
      }
      return true;
    }),

  body("items.*.tax")
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage("Item tax must be an integer between 0 and 100 (representing percentage)"),

  body("items.*.vat")
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage("Item vat must be an integer between 0 and 100 (representing percentage)"),

  body("bankAccountId")
    .optional()
    .isInt()
    .withMessage("Bank account ID must be an integer"),

  // additionalEmails - optional array of email strings
  body("additionalEmails")
    .optional()
    .isArray()
    .withMessage("Additional emails must be an array"),

  body("additionalEmails.*")
    .optional()
    .isEmail()
    .withMessage("Each additional email must be a valid email address"),

  // Optional email customization (same shape as send-offer; body is HTML-safe plain text wrapped in <p> like send-offer)
  body("email")
    .optional()
    .isObject()
    .withMessage("email must be an object"),

  body("email.subject")
    .optional()
    .isString()
    .withMessage("email.subject must be a string")
    .isLength({ max: 500 })
    .withMessage("email.subject must not exceed 500 characters")
    .trim(),

  body("email.body")
    .optional()
    .isString()
    .withMessage("email.body must be a string")
    .isLength({ max: 50000 })
    .withMessage("email.body must not exceed 50000 characters"),

  body("email.message")
    .optional()
    .isString()
    .withMessage("email.message must be a string")
    .isLength({ max: 50000 })
    .withMessage("email.message must not exceed 50000 characters"),

  body().custom((value) => {
    const e = value?.email;
    if (!e || typeof e !== "object") return true;
    const hasBody = e.body !== undefined && e.body !== null && String(e.body).trim() !== "";
    const hasMessage = e.message !== undefined && e.message !== null && String(e.message).trim() !== "";
    if (hasBody && hasMessage) {
      throw new Error("Provide only one of email.body or email.message");
    }
    return true;
  }),
];


export const recordPaymentValidation = [
  param("id")
    .notEmpty()
    .withMessage("Invoice ID is required")
    .isInt()
    .withMessage("Invoice ID must be an integer"),

  body("amountPaid")
    .notEmpty()
    .withMessage("Amount paid is required")
    .isNumeric()
    .withMessage("Amount paid must be a number")
    .custom((value) => {
      if (value < 0) {
        throw new Error("Amount paid cannot be negative");
      }
      return true;
    }),

  body("paymentMethod")
    .notEmpty()
    .withMessage("Payment method is required")
    .isIn(Object.values(PaymentMethod))
    .withMessage(`Payment method must be one of: ${Object.values(PaymentMethod).join(", ")}`),

  body("paymentDate")
    .notEmpty()
    .withMessage("Payment date is required")
    .isISO8601()
    .withMessage("Payment date must be a valid date (ISO 8601 format)"),
];

export const payNowTokenValidation = [
  param("token")
    .notEmpty()
    .withMessage("Payment token is required")
    .isString()
    .withMessage("Payment token must be a string")
    .isLength({ min: 10, max: 2000 })
    .withMessage("Payment token format is invalid"),
];

export const paystackCallbackValidation = [
  query("reference")
    .notEmpty()
    .withMessage("Paystack reference is required")
    .isString()
    .withMessage("Paystack reference must be a string")
    .isLength({ min: 6, max: 255 })
    .withMessage("Paystack reference format is invalid"),
];
