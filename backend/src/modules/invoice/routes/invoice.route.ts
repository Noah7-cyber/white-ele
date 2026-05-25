import { Router } from "express";
import { InvoiceController } from "../controllers/invoice.controller";
import {
  createInvoiceValidation,
  payNowTokenValidation,
  paystackCallbackValidation,
  recordPaymentValidation,
} from "../validations/invoice.validation";
import { authenticate } from "../../auth/middleware/middleware";
import { handleValidationErrors } from "../../shared/middleware/validation";

const router = Router();
const invoiceController = new InvoiceController();

router.get(
  "/pay/:token",
  ...payNowTokenValidation,
  handleValidationErrors,
  invoiceController.initializePayNowCheckout.bind(invoiceController)
);

router.get(
  "/paystack/callback",
  ...paystackCallbackValidation,
  handleValidationErrors,
  invoiceController.handlePaystackCallback.bind(invoiceController)
);

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route POST /invoices
 * @desc Create a new invoice with items
 * @access Authenticated users
 */
router.post(
  "/",
  createInvoiceValidation,
  invoiceController.createInvoice.bind(invoiceController)
);

/**
 * @route GET /invoices
 * @desc Get all invoices with optional filters (scoped to user's school)
 * @access Authenticated users
 * @query {string} dueDate - Filter by due date (ISO 8601 format)
 * @query {string} issueDate - Filter by issue date (ISO 8601 format)
 * @query {string} status - Filter by status: overdue, paid, partially_paid, sent, overpaid
 * @query {string} search - Case-insensitive search (invoice number, status, student and parent names)
 */
router.get(
  "/",
  invoiceController.getAllInvoices.bind(invoiceController)
);

/**
 * @route POST /invoices/generate-number
 * @desc Generate the next invoice number (returns current and increments)
 * @access Authenticated users
 */
router.post(
  "/generate-number",
  invoiceController.generateInvoiceNumber.bind(invoiceController)
);

/**
 * @route GET /invoices/current-number
 * @desc Get the current invoice number without incrementing
 * @access Authenticated users
 */
router.get(
  "/current-number",
  invoiceController.getCurrentInvoiceNumber.bind(invoiceController)
);

/**
 * @route GET /invoices/:id
 * @desc Get a single invoice by ID (scoped to user's school)
 * @access Authenticated users
 */
router.get(
  "/:id",
  invoiceController.getInvoiceById.bind(invoiceController)
);

/**
 * @route GET /invoices/:id/pdf
 * @desc Download an invoice PDF by ID (scoped to user's school)
 * @access Authenticated users
 */
router.get(
  "/:id/pdf",
  invoiceController.downloadPdf.bind(invoiceController)
);

/**
 * @route POST /invoices/:id/payments
 * @desc Record a payment for an invoice
 * @access Authenticated users
 */
router.post(
  "/:id/payments",
  recordPaymentValidation,
  (req: any, res: any) => invoiceController.recordPayment(req, res)
);

/**
 * @route PUT /invoices/:id
 * @desc Update an invoice by ID (scoped to user's school)
 * @access Authenticated users
 */
router.put(
  "/:id",
  (req: any, res: any) => invoiceController.updateInvoice(req, res)
);

/**
 * @route DELETE /invoices/:id
 * @desc Delete an invoice by ID (scoped to user's school)
 * @access Authenticated users
 */
router.delete(
  "/:id",
  invoiceController.deleteInvoice.bind(invoiceController)
);


router.delete(
  "/:invoiceId/payments/:invoicePaymentId",
  invoiceController.removeInvoicePayment.bind(invoiceController)
);

export default router;

