import axios from "axios";
import crypto from "crypto";
import { AppDataSource } from "../../core/config/database";
import { Invoice } from "../../shared/entities/Invoice";
import { InvoiceActivity } from "../../shared/entities/InvoiceActivity";
import { InvoicePayment } from "../../shared/entities/InvoicePayment";
import { School } from "../../shared/entities/School";
import { ActivityLogPriority, BookingStatus, InvoiceActivityType, InvoiceSource, InvoiceStatus, PaymentMethod } from "../../shared/entities/EntityEnums";
import { CryptoService } from "../../shared/services/crypto.service";
import { TourBooking } from "../../shared/entities/TourBooking";
import { ActivityLog } from "../../shared/entities/ActivityLog";

type PayNowTokenPayload = {
  invoiceId: number;
  payerEmail?: string;
  exp: number;
};

type VerifyResult = {
  success: boolean;
  message: string;
  invoiceId?: number;
  paymentId?: number;
  alreadyProcessed?: boolean;
};

class InvoicePaymentGatewayService {
  private readonly paystackBaseUrl: string;
  private readonly payNowTokenSecret: string;

  constructor() {
    this.paystackBaseUrl = (process.env["PAYSTACK_BASE_URL"] || "https://api.paystack.co").replace(/\/$/, "");
    this.payNowTokenSecret = process.env["PAYSTACK_PAYMENT_TOKEN_SECRET"] || process.env["JWT_SECRET"] || "dev-pay-token-secret";
  }

  private getBackendBaseUrl(): string {
    const raw =
      process.env["PAYSTACK_CALLBACK_BASE_URL"] ||
      process.env["BACKEND_URL"] ||
      process.env["API_BASE_URL"] ||
      "http://localhost:3000";
    const normalized = raw.trim().replace(/\/$/, "");
    if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
      return normalized;
    }
    return `https://${normalized}`;
  }

  private toBase64Url(value: string): string {
    return Buffer.from(value, "utf8")
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");
  }

  private fromBase64Url(value: string): string {
    const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = `${base64}${"=".repeat((4 - (base64.length % 4)) % 4)}`;
    return Buffer.from(padded, "base64").toString("utf8");
  }

  private signPayload(payloadBase64: string): string {
    return crypto.createHmac("sha256", this.payNowTokenSecret).update(payloadBase64).digest("hex");
  }

  private createReference(invoiceId: number): string {
    const suffix = crypto.randomBytes(6).toString("hex");
    return `inv_${invoiceId}_${Date.now()}_${suffix}`;
  }

  private parseInvoiceIdFromReference(reference: string): number | null {
    const parts = reference.split("_");
    if (parts.length < 4 || parts[0] !== "inv") return null;
    const id = Number(parts[1]);
    return Number.isInteger(id) && id > 0 ? id : null;
  }

  private hasPaystackSecretConfig(school?: School | null): boolean {
    return Boolean(school?.PaystackSecretKey && school.PaystackSecretIv && school.PaystackSecretTag);
  }

  private decryptSchoolSecretKey(school: School): string {
    if (!school.PaystackSecretKey || !school.PaystackSecretIv || !school.PaystackSecretTag) {
      throw new Error("School Paystack secret key is not configured");
    }
    const cryptoService = new CryptoService();
    return cryptoService.decrypt(school.PaystackSecretKey, school.PaystackSecretIv, school.PaystackSecretTag);
  }

  private calculateInvoiceStatus(total: number, amountPaid: number, dueDate: Date | string): InvoiceStatus {
    const balance = total - amountPaid;
    const due = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (balance <= 0) {
      return balance < 0 ? InvoiceStatus.OVERPAID : InvoiceStatus.PAID;
    }
    if (amountPaid > 0) {
      return InvoiceStatus.PARTIALLY_PAID;
    }
    if (due < today) {
      return InvoiceStatus.OVERDUE;
    }
    return InvoiceStatus.SENT;
  }

  createPayNowToken(invoiceId: number, payerEmail?: string, expiresInMinutes: number = 60 * 24): string {
    const payload: PayNowTokenPayload = {
      invoiceId,
      ...(payerEmail ? { payerEmail } : {}),
      exp: Date.now() + expiresInMinutes * 60 * 1000,
    };
    const payloadBase64 = this.toBase64Url(JSON.stringify(payload));
    const signature = this.signPayload(payloadBase64);
    return `${payloadBase64}.${signature}`;
  }

  verifyPayNowToken(token: string): PayNowTokenPayload {
    const [payloadBase64, signature] = token.split(".");
    if (!payloadBase64 || !signature) {
      throw new Error("Invalid payment token format");
    }
    const expectedSignature = this.signPayload(payloadBase64);
    if (expectedSignature !== signature) {
      throw new Error("Invalid payment token signature");
    }
    const parsed = JSON.parse(this.fromBase64Url(payloadBase64)) as PayNowTokenPayload;
    if (!parsed.invoiceId || !parsed.exp) {
      throw new Error("Invalid payment token payload");
    }
    if (Date.now() > parsed.exp) {
      throw new Error("Payment token has expired");
    }
    return parsed;
  }

  async buildPayNowUrlIfAvailable(invoiceId: number, payerEmail?: string): Promise<string | undefined> {
    const invoice = await AppDataSource.getRepository(Invoice).findOne({
      where: { id: invoiceId },
      relations: ["school"],
    });
    if (!invoice || !invoice.school || !this.hasPaystackSecretConfig(invoice.school)) {
      return undefined;
    }
    const token = this.createPayNowToken(invoiceId, payerEmail);
    return `${this.getBackendBaseUrl()}/api/v1/invoices/pay/${encodeURIComponent(token)}`;
  }

  async initializeCheckoutFromToken(token: string): Promise<{ authorizationUrl: string }> {
    const payload = this.verifyPayNowToken(token);
    const invoice = await AppDataSource.getRepository(Invoice).findOne({
      where: { id: payload.invoiceId },
      relations: ["school"],
    });
    if (!invoice || !invoice.school) {
      throw new Error("Invoice not found");
    }
    if (!this.hasPaystackSecretConfig(invoice.school)) {
      throw new Error("Paystack is not configured for this school");
    }

    const balance = Number(invoice.balance);
    if (!(balance > 0)) {
      throw new Error("Invoice has no outstanding balance");
    }

    const schoolSecret = this.decryptSchoolSecretKey(invoice.school);
    const amountKobo = Math.round(balance * 100);
    const payerEmail = payload.payerEmail || invoice.school.email;
    if (!payerEmail) {
      throw new Error("Missing payer email for checkout");
    }

    const reference = this.createReference(invoice.id);
    const callbackUrl = `${this.getBackendBaseUrl()}/api/v1/invoices/paystack/callback`;
    const response = await axios.post(
      `${this.paystackBaseUrl}/transaction/initialize`,
      {
        email: payerEmail,
        amount: amountKobo,
        reference,
        callback_url: callbackUrl,
        metadata: {
          invoiceId: invoice.id,
          schoolId: invoice.schoolId,
          expectedAmountKobo: amountKobo,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${schoolSecret}`,
          "Content-Type": "application/json",
        },
        timeout: 20000,
      },
    );

    if (!response.data?.status || !response.data?.data?.authorization_url) {
      throw new Error(response.data?.message || "Failed to initialize Paystack checkout");
    }

    return { authorizationUrl: String(response.data.data.authorization_url) };
  }

  async verifyAndRecordPayment(reference: string): Promise<VerifyResult> {
    const invoiceId = this.parseInvoiceIdFromReference(reference);
    if (!invoiceId) {
      return { success: false, message: "Invalid payment reference" };
    }

    const existingPayment = await AppDataSource.getRepository(InvoicePayment).findOne({
      where: { paystackReference: reference },
    });
    if (existingPayment) {
      return {
        success: true,
        message: "Payment already processed",
        invoiceId: existingPayment.invoiceId,
        paymentId: existingPayment.id,
        alreadyProcessed: true,
      };
    }

    const invoice = await AppDataSource.getRepository(Invoice).findOne({
      where: { id: invoiceId },
      relations: ["school"],
    });
    if (!invoice || !invoice.school) {
      return { success: false, message: "Invoice not found" };
    }
    if (!this.hasPaystackSecretConfig(invoice.school)) {
      return { success: false, message: "Paystack is not configured for this school" };
    }

    const schoolSecret = this.decryptSchoolSecretKey(invoice.school);
    const verifyResponse = await axios.get(`${this.paystackBaseUrl}/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: {
        Authorization: `Bearer ${schoolSecret}`,
      },
      timeout: 20000,
    });

    const verified = verifyResponse.data?.data;
    if (!verifyResponse.data?.status || !verified || verified.status !== "success") {
      return { success: false, message: verifyResponse.data?.message || "Payment verification failed" };
    }

    const metadata = verified.metadata || {};
    if (Number(metadata.invoiceId) !== invoice.id) {
      return { success: false, message: "Payment metadata does not match invoice" };
    }

    const amountPaid = Number(verified.amount || 0) / 100;
    if (!(amountPaid > 0)) {
      return { success: false, message: "Verified payment amount is invalid" };
    }

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const lockedInvoice = await queryRunner.manager.findOne(Invoice, {
        where: { id: invoice.id, schoolId: invoice.schoolId },
        lock: { mode: "pessimistic_write" },
      });

      if (!lockedInvoice) {
        throw new Error("Invoice not found during payment processing");
      }

      const duplicate = await queryRunner.manager.findOne(InvoicePayment, {
        where: { paystackReference: reference },
      });
      if (duplicate) {
        await queryRunner.commitTransaction();
        return {
          success: true,
          message: "Payment already processed",
          invoiceId: duplicate.invoiceId,
          paymentId: duplicate.id,
          alreadyProcessed: true,
        };
      }

      const payment = queryRunner.manager.create(InvoicePayment, {
        invoiceId: lockedInvoice.id,
        amountPaid,
        paymentMethod: PaymentMethod.CARD,
        paymentDate: verified.paid_at ? new Date(verified.paid_at) : new Date(),
        notes: "Paid via Paystack checkout",
        purpose: `Paystack payment reference ${reference}`,
        paystackReference: reference,
        paymentGateway: "paystack",
      });
      const savedPayment = await queryRunner.manager.save(payment);

      const oldAmountPaid = Number(lockedInvoice.amountPaid);
      const newAmountPaid = oldAmountPaid + amountPaid;
      const total = Number(lockedInvoice.total);
      const newBalance = total - newAmountPaid;
      const newStatus = this.calculateInvoiceStatus(total, newAmountPaid, lockedInvoice.dueDate);

      await queryRunner.manager.update(
        Invoice,
        { id: lockedInvoice.id },
        {
          amountPaid: newAmountPaid,
          balance: newBalance,
          status: newStatus,
          paymentMethod: PaymentMethod.CARD,
        },
      );

      if (lockedInvoice.source === InvoiceSource.ADMISSION && lockedInvoice.tourBookingId) {
        await queryRunner.manager.update(
          TourBooking,
          { id: lockedInvoice.tourBookingId },
          {
            status: BookingStatus.ACCEPTED,
            accepted: true,
          },
        );
      }

      const isAdmission = lockedInvoice.source === InvoiceSource.ADMISSION;
      const activityLog = queryRunner.manager.create(ActivityLog, {
        resource: isAdmission ? "admission" : "invoice",
        action: "payment_made",
        title: isAdmission ? "Admission invoice paid via Paystack" : "Invoice paid via Paystack",
        priority: ActivityLogPriority.HIGH,
        description: JSON.stringify({
          invoiceId: lockedInvoice.id,
          invoiceSource: lockedInvoice.source,
          tourBookingId: lockedInvoice.tourBookingId,
          paystackReference: reference,
          amountPaid,
          schoolId: lockedInvoice.schoolId,
        }),
      });
      await queryRunner.manager.save(activityLog);

      const activity = queryRunner.manager.create(InvoiceActivity, {
        invoiceId: lockedInvoice.id,
        activityType: InvoiceActivityType.PAYMENT_MADE,
        title: "Payment recorded via Paystack",
        description: `Payment of ${amountPaid} recorded from Paystack checkout. New balance: ${newBalance}`,
        oldValues: { amountPaid: oldAmountPaid, status: lockedInvoice.status },
        newValues: { amountPaid: newAmountPaid, status: newStatus, paystackReference: reference },
      });
      await queryRunner.manager.save(activity);

      await queryRunner.commitTransaction();

      return {
        success: true,
        message: "Payment processed successfully",
        invoiceId: lockedInvoice.id,
        paymentId: savedPayment.id,
      };
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      return { success: false, message: error.message || "Failed to process payment callback" };
    } finally {
      await queryRunner.release();
    }
  }
}

export const invoicePaymentGatewayService = new InvoicePaymentGatewayService();

//just a comment 
