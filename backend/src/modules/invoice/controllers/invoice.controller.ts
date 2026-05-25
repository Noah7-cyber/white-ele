import { Request, Response } from "express";
import { invoiceService } from "../services/invoice.service";
import { invoicePaymentGatewayService } from "../services/invoice-payment-gateway.service";
import { requireSchoolId } from "../../shared/utils/tenant-context";
import { AuthenticatedRequest } from "../../auth/middleware/middleware";
import { InvoiceStatus, PaymentMethod } from "../../shared/entities/EntityEnums";

export class InvoiceController {
  async initializePayNowCheckout(req: Request, res: Response) {
    try {
      const token = String(req.params["token"] || "");
      const result = await invoicePaymentGatewayService.initializeCheckoutFromToken(token);
      return res.redirect(302, result.authorizationUrl);
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to initialize Paystack checkout",
      });
    }
  }

  async handlePaystackCallback(req: Request, res: Response) {
    try {
      const reference = String(req.query["reference"] || "");
      const result = await invoicePaymentGatewayService.verifyAndRecordPayment(reference);
      const homePage = process.env["FRONTEND_URL"];
      if (homePage) {
        const url = new URL(homePage);
        url.searchParams.set("payment", result.success ? "success" : "failed");
        if (reference) url.searchParams.set("reference", reference);
        if (result.invoiceId) url.searchParams.set("invoiceId", String(result.invoiceId));
        if (result.paymentId) url.searchParams.set("paymentId", String(result.paymentId));
        if (!result.success && result.message) url.searchParams.set("message", result.message);
        return res.redirect(302, url.toString());
      }

      if (!result.success) {
        return res.status(400).json(result);
      }
      return res.status(200).json(result);
    } catch (error: any) {
      const homePage = process.env["FRONTEND_URL"];
      if (homePage) {
        const url = new URL(homePage);
        url.searchParams.set("payment", "failed");
        const reference = String(req.query["reference"] || "");
        if (reference) url.searchParams.set("reference", reference);
        url.searchParams.set("message", error.message || "Failed to process Paystack callback");
        return res.redirect(302, url.toString());
      }

      return res.status(500).json({ success: false, message: error.message || "Failed to process Paystack callback" });
    }
  }

  /**
   * @route POST /invoices
   * @desc Create a new invoice with items
   * @access Authenticated users
   */
  async createInvoice(req: Request, res: Response) {
    try {
      // Check if summary query parameter is present
      const summaryParam = req.query["summary"];
      const isSummary = summaryParam === "true" || (typeof summaryParam === "string" && summaryParam.toLowerCase() === "true");

      // Get schoolId from authenticated user - never trust payload
      const schoolId = requireSchoolId(req);

      const {
        invoiceNumber,
        classroomId,
        studentId,
        studentsIds,
        notes,
        issueDate,
        dueDate,
        amountPaid,
        discount,
        billingPeriod,
        paymentMethod,
        items,
        additionalEmails,
        bankAccountId,
        email: emailBlock,
        subject,
        message,
        messageHtml,
      } = req.body;

      // Normalize item VAT aliases from clients (vat -> tax)
      const normalizedItems = Array.isArray(items)
        ? items.map((item: any) => ({
          ...item,
          ...(item?.tax === undefined && item?.vat !== undefined ? { tax: item.vat } : {}),
        }))
        : items;

      let normalizedEmail: { subject?: string; body?: string } | undefined;
      if (emailBlock && typeof emailBlock === "object") {
        const rawBody =
          emailBlock.body !== undefined && emailBlock.body !== null
            ? emailBlock.body
            : emailBlock.message !== undefined && emailBlock.message !== null
              ? emailBlock.message
              : undefined;
        normalizedEmail = {
          ...(emailBlock.subject !== undefined && emailBlock.subject !== null ? { subject: String(emailBlock.subject) } : {}),
          ...(rawBody !== undefined ? { body: String(rawBody) } : {}),
        };
        if (Object.keys(normalizedEmail).length === 0) {
          normalizedEmail = undefined;
        }
      } else {
        // Backward-compatible shape from some clients: subject/message/messageHtml at root level
        const fallbackBody = messageHtml ?? message;
        normalizedEmail = {
          ...(subject !== undefined && subject !== null ? { subject: String(subject) } : {}),
          ...(fallbackBody !== undefined && fallbackBody !== null ? { body: String(fallbackBody) } : {}),
        };
        if (Object.keys(normalizedEmail).length === 0) {
          normalizedEmail = undefined;
        }
      }

      // subtotal, balance, total, and tax are calculated in the backend, not accepted from payload

      // Explicitly ignore schoolId from payload for security (multi-tenancy)

      // Merge studentId into studentsIds array if provided
      // First, deduplicate studentsIds array itself
      let finalStudentsIds: number[] = [];
      if (Array.isArray(studentsIds) && studentsIds.length > 0) {
        // Remove duplicates from studentsIds array
        finalStudentsIds = [...new Set(studentsIds.map((id) => (typeof id === "string" ? parseInt(id, 10) : id)))];
      }
      if (studentId !== undefined && studentId !== null) {
        // Add studentId to the array if not already present
        const studentIdNum = typeof studentId === "string" ? parseInt(studentId, 10) : studentId;
        if (!finalStudentsIds.includes(studentIdNum)) {
          finalStudentsIds.push(studentIdNum);
        }
      }

      // Validate that we have at least one student ID
      if (finalStudentsIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Either studentId or studentsIds must be provided and not empty",
        });
      }

      // If summary=true, return summary for the first student only (for preview)
      if (isSummary) {
        const summary = await invoiceService.generateInvoiceSummary({
          invoiceNumber,
          classroomId,
          studentId: finalStudentsIds[0]!, // Safe: validated above that array is not empty
          notes,
          issueDate,
          dueDate,
          amountPaid,
          discount: discount ? parseFloat(discount) : undefined,
          billingPeriod,
          paymentMethod,
          items: normalizedItems,
        });

        return res.status(200).json({
          success: true,
          message: "Invoice summary generated successfully",
          data: summary,
        });
      }

      // Normal flow: create and save invoices to database for all students
      const createdInvoices = [];

      for (let i = 0; i < finalStudentsIds.length; i++) {
        const currentStudentId = finalStudentsIds[i]!; // Safe: we're iterating over validated array

        // Use provided invoiceNumber only for the first invoice (index 0)
        // Generate invoice numbers for all remaining invoices
        let currentInvoiceNumber: string;
        if (i === 0 && invoiceNumber) {
          // First invoice: use the provided invoice number from frontend
          currentInvoiceNumber = invoiceNumber;
        } else {
          // Subsequent invoices (or first if no number provided): generate on server
          currentInvoiceNumber = await invoiceService.generateInvoiceNumber();
        }

        const invoice = await invoiceService.createInvoice({
          invoiceNumber: currentInvoiceNumber,
          classroomId,
          studentId: currentStudentId,
          notes,
          issueDate,
          dueDate,
          amountPaid,
          discount: discount ? parseFloat(discount) : undefined,
          billingPeriod,
          paymentMethod,
          items: normalizedItems,
          schoolId,
          additionalEmails,
          bankAccountId:
            bankAccountId !== undefined && bankAccountId !== null && String(bankAccountId).trim() !== ""
              ? Number(bankAccountId)
              : undefined,
          email: normalizedEmail,
        });

        createdInvoices.push(invoice);
      }

      return res.status(201).json({
        success: true,
        message: `Invoice${createdInvoices.length > 1 ? "s" : ""} created successfully`,
        data: createdInvoices.length === 1 ? createdInvoices[0] : createdInvoices,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to create invoice",
      });
    }
  }

  /**
   * @route GET /invoices
   * @desc Get all invoices with optional filters (scoped to user's school)
   * @access Authenticated users
   */
  async getAllInvoices(req: Request, res: Response) {
    try {
      // Get schoolId from authenticated user - never trust query params
      const schoolId = requireSchoolId(req);

      // Extract query parameters
      const { dueDate, issueDate, status, studentId, parentId, search: searchQuery, pos: posQuery, delta: deltaQuery } = req.query;

      // Validate status if provided
      if (status && !["overdue", "paid", "partially_paid", "sent", "overpaid"].includes(status as string)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status. Must be one of: overdue, paid, partially_paid, sent, overpaid",
        });
      }

      // Validate studentId if provided
      let parsedStudentId: number | undefined;
      if (studentId) {
        parsedStudentId = parseInt(studentId as string, 10);
        if (isNaN(parsedStudentId)) {
          return res.status(400).json({
            success: false,
            message: "Invalid studentId. Must be a valid number",
          });
        }
      }

      // Validate parentId if provided
      let parsedParentId: number | undefined;
      if (parentId) {
        parsedParentId = parseInt(parentId as string, 10);
        if (isNaN(parsedParentId)) {
          return res.status(400).json({
            success: false,
            message: "Invalid parentId. Must be a valid number",
          });
        }
      }

      // Parse pagination parameters
      const pos = posQuery ? parseInt(posQuery as string, 10) : 0;
      const delta = deltaQuery ? parseInt(deltaQuery as string, 10) : 10;

      // Validate pagination parameters
      if (isNaN(pos) || pos < 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid pos. Must be a non-negative integer",
        });
      }

      if (isNaN(delta) || delta < 1) {
        return res.status(400).json({
          success: false,
          message: "Invalid delta. Must be at least 1",
        });
      }

      const filters = {
        schoolId,
        ...(dueDate && { dueDate: dueDate as string }),
        ...(issueDate && { issueDate: issueDate as string }),
        ...(status && { status: status as InvoiceStatus }),
        ...(parsedStudentId && { studentId: parsedStudentId }),
        ...(parsedParentId && { parentId: parsedParentId }),
        ...(typeof searchQuery === "string" && searchQuery.trim() && { search: searchQuery.trim() }),
        pos,
        delta,
      };

      const result = await invoiceService.getAllInvoices(filters);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message,
        });
      }

      return res.status(200).json({
        success: true,
        message: result.message,
        data: result.invoices || [],
        ...(result.pagination && { pagination: result.pagination }),
        ...(result.metadata && { metadata: result.metadata }),
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to get invoices",
      });
    }
  }

  /**
   * @route GET /invoices/:id
   * @desc Get a single invoice by ID (scoped to user's school)
   * @access Authenticated users
   */
  async getInvoiceById(req: Request, res: Response) {
    try {
      const invoiceId = parseInt(req.params["id"] as string, 10);

      if (isNaN(invoiceId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid invoice ID",
        });
      }

      // Get schoolId from authenticated user - never trust params
      const schoolId = requireSchoolId(req);

      const result = await invoiceService.getInvoiceById(invoiceId, schoolId);

      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: result.message,
        });
      }

      return res.status(200).json({
        success: true,
        message: result.message,
        data: result.invoice,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to get invoice",
      });
    }
  }

  /**
   * @route GET /invoices/:id/pdf
   * @desc Download invoice PDF
   * @access Authenticated users
   */
  async downloadPdf(req: Request, res: Response) {
    try {
      const invoiceId = parseInt(req.params["id"] as string, 10);

      if (isNaN(invoiceId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid invoice ID",
        });
      }

      // Get schoolId from authenticated user
      const schoolId = requireSchoolId(req);

      const result = await invoiceService.downloadInvoicePdf(invoiceId, schoolId);

      if (!result.success || !result.pdfBuffer) {
        return res.status(404).json({
          success: false,
          message: result.message,
        });
      }

      // Generate a user-friendly filename if not provided
      const filename = result.filename || `invoice_${invoiceId}.pdf`;

      // Set headers for file download
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

      // Send the buffer
      return res.status(200).send(result.pdfBuffer);
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to download invoice PDF",
      });
    }
  }

  /**
   * @route POST /invoices/generate-number
   * @desc Generate the next invoice number
   * @access Authenticated users
   */
  async generateInvoiceNumber(_req: Request, res: Response) {
    try {
      const invoiceNumber = await invoiceService.generateInvoiceNumber();

      return res.status(200).json({
        success: true,
        message: "Invoice number generated successfully",
        data: {
          invoiceNumber,
        },
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to generate invoice number",
      });
    }
  }

  /**
   * @route GET /invoices/current-number
   * @desc Get the current invoice number without incrementing
   * @access Authenticated users
   */
  async getCurrentInvoiceNumber(_req: Request, res: Response) {
    try {
      const invoiceNumber = await invoiceService.getCurrentInvoiceNumber();

      return res.status(200).json({
        success: true,
        message: "Current invoice number retrieved successfully",
        data: {
          invoiceNumber,
        },
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to get current invoice number",
      });
    }
  }

  /**
   * @route PUT /invoices/:id
   * @desc Update an invoice by ID (scoped to user's school)
   * @access Authenticated users
   */
  async updateInvoice(req: AuthenticatedRequest, res: Response) {
    try {
      const invoiceId = parseInt(req.params["id"] as string, 10);

      if (isNaN(invoiceId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid invoice ID",
        });
      }

      // Get schoolId from authenticated user - never trust params
      const schoolId = requireSchoolId(req);

      // Get userId from authenticated user
      const userId = req.user?.id;

      const { notes, issueDate, dueDate, amountPaid, billingPeriod, paymentMethod, items, classroomId, studentId } = req.body;

      const updateData: any = {};

      if (notes !== undefined) updateData.notes = notes;
      if (issueDate !== undefined) updateData.issueDate = issueDate;
      if (dueDate !== undefined) updateData.dueDate = dueDate;
      if (amountPaid !== undefined) updateData.amountPaid = parseFloat(amountPaid);
      if (billingPeriod !== undefined) updateData.billingPeriod = billingPeriod;
      if (paymentMethod !== undefined) {
        if (!Object.values(PaymentMethod).includes(paymentMethod)) {
          return res.status(400).json({
            success: false,
            message: `Invalid paymentMethod. Must be one of: ${Object.values(PaymentMethod).join(", ")}`,
          });
        }
        updateData.paymentMethod = paymentMethod;
      }
      if (items !== undefined) updateData.items = items;
      if (classroomId !== undefined) updateData.classroomId = parseInt(classroomId, 10);
      if (studentId !== undefined) updateData.studentId = parseInt(studentId, 10);

      // Validate that at least one field is being updated
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          message: "No fields provided for update",
        });
      }

      const result = await invoiceService.updateInvoice(invoiceId, schoolId, updateData, userId);

      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: result.message,
        });
      }

      return res.status(200).json({
        success: true,
        message: result.message,
        data: result.invoice,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to update invoice",
      });
    }
  }

  /**
   * @route POST /invoices/:id/payments
   * @desc Record a payment for an invoice
   * @access Authenticated users
   */
  async recordPayment(req: AuthenticatedRequest, res: Response) {
    try {
      const invoiceId = parseInt(req.params["id"] as string, 10);

      if (isNaN(invoiceId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid invoice ID",
        });
      }

      // Get schoolId from authenticated user
      const schoolId = requireSchoolId(req);

      // Get userId from authenticated user
      const userId = req.user?.id;

      const { amountPaid, paymentMethod, paymentDate } = req.body;

      const paymentData = {
        amountPaid: amountPaid ? parseFloat(amountPaid) : undefined,
        paymentMethod,
        paymentDate,
      };

      const result = await invoiceService.recordInvoicePayment(invoiceId, schoolId, paymentData, userId);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message,
        });
      }

      return res.status(201).json({
        success: true,
        message: result.message,
        data: {
          invoice: result.invoice,
          payment: result.payment,
        },
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to record payment",
      });
    }
  }

  /**
   * @route DELETE /invoices/:id
   * @desc Delete an invoice by ID (scoped to user's school)
   * @access Authenticated users
   */
  async deleteInvoice(req: Request, res: Response) {
    try {
      const invoiceId = parseInt(req.params["id"] as string, 10);

      if (isNaN(invoiceId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid invoice ID",
        });
      }

      // Get schoolId from authenticated user - never trust params
      const schoolId = requireSchoolId(req);

      const result = await invoiceService.deleteInvoice(invoiceId, schoolId);

      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: result.message,
        });
      }

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to delete invoice",
      });
    }
  }

  async removeInvoicePayment(req: Request, res: Response) {
    try {
      const invoiceId = parseInt(req.params["invoiceId"] as string, 10);
      const invoicePaymentId = parseInt(req.params["invoicePaymentId"] as string, 10);

      if (isNaN(invoiceId) || isNaN(invoicePaymentId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid invoice ID or invoice payment ID",
        });
      }

      // Get schoolId from authenticated user - never trust params
      const schoolId = requireSchoolId(req);

      const result = await invoiceService.removeInvoicePayment(invoiceId, invoicePaymentId, schoolId);

      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: result.message,
        });
      }

      return res.status(200).json({
        success: true,
        message: result.message,
        data: {
          invoice: result.invoice,
        },
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to remove invoice payment",
      });
    }
  }
}
