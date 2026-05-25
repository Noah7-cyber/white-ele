import axios from "axios";

export interface BankVerificationRequest {
  accountNumber: string;
  bankCode: string;
}

export interface BankVerificationResult {
  success: boolean;
  accountName?: string;
  accountNumber?: string;
  bankCode?: string;
  error?: string;
}

/** Paystack verify transaction API: amounts are in the smallest currency unit (e.g. kobo for NGN). */
export interface PaystackTransactionVerifyData {
  amount: number;
  currency: string;
  status: string;
  reference: string;
  transactionId?: number;
  paidAt?: string;
  metadata: Record<string, unknown>;
}

export interface PaystackTransactionVerifyResult {
  success: boolean;
  message?: string;
  data?: PaystackTransactionVerifyData;
}

export interface PaystackInitializeTransactionInput {
  email: string;
  amount: number;
  reference: string;
  callbackUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface PaystackInitializeTransactionResult {
  success: boolean;
  message?: string;
  data?: {
    reference: string;
    accessCode: string;
    authorizationUrl: string;
  };
}

export class PaystackService {
  private configured: boolean = false;
  private paystackKey: string;
  private baseUrl: string;

  constructor() {
    this.paystackKey = process.env["PAYSTACK_SK"] || "";
    this.baseUrl = process.env["PAYSTACK_BASE_URL"] || "";
    if (!this.paystackKey || !this.baseUrl) {
      console.error("Paystack is not configured");
      throw new Error("Paystack is not configured");
    }
    this.initialize();
  }

  private initialize(): void {
    if (process.env["NODE_ENV"] === "test") {
      this.configured = true;
      return;
    }

    if (this.paystackKey) {
      this.configured = true;
      console.log("✅ Bank verification provider initialized: Paystack (FREE)");
    } else {
      console.warn("⚠️  PAYSTACK_SECRET_KEY not found. Bank verification will be disabled.");
      console.warn("💡 Get your Paystack key from: https://dashboard.paystack.com/#/settings/developers");
    }
  }

  async verifyAccount(request: BankVerificationRequest): Promise<BankVerificationResult> {
    try {
      if (process.env["NODE_ENV"] === "test") {
        console.log(`[TEST] Bank verification for: ${request.accountNumber}`);
        return {
          success: true,
          accountName: "TEST ACCOUNT NAME",
          accountNumber: request.accountNumber,
          bankCode: request.bankCode,
        };
      }

      if (!this.configured || !this.paystackKey) {
        console.error("Paystack is not configured");
        return {
          success: false,
          error: "Bank verification service not configured",
        };
      }

      const response = await axios.get(
        `${this.baseUrl}/bank/resolve?account_number=${request.accountNumber}&bank_code=${request.bankCode}`,
        {
          headers: {
            Authorization: `Bearer ${this.paystackKey}`,
            "Content-Type": "application/json",
          },
          timeout: 15000,
        }
      );

      if (response.data && response.data.status === true && response.data.data) {
        return {
          success: true,
          accountName: response.data.data.account_name,
          accountNumber: response.data.data.account_number || request.accountNumber,
          bankCode: request.bankCode,
        };
      } else {
        console.error("Bank verification failed:", response.data);
        return {
          success: false,
          error: response.data?.message || "Bank account not found",
        };
      }
    } catch (error: any) {
      console.error("Paystack error:", error);

      if (error.response) {
        if (error.response.status === 404) {
          return {
            success: false,
            error: "Bank account not found or invalid",
          };
        }
      }

      return {
        success: false,
        error: `Bank verification failed`,
      };
    }
  }

  async verifyMultipleAccounts(requests: BankVerificationRequest[]): Promise<BankVerificationResult[]> {
    try {
      const verificationPromises = requests.map((request) => this.verifyAccount(request));
      const results = await Promise.allSettled(verificationPromises);

      return results.map((result, index) => {
        if (result.status === "fulfilled") {
          return result.value;
        } else {
          const request = requests[index];
          console.error(`Verification failed for account ${request?.accountNumber}:`, result.reason);
          return {
            success: false,
            error: "Verification failed",
            accountNumber: request?.accountNumber || "",
            bankCode: request?.bankCode || "",
          };
        }
      });
    } catch (error) {
      console.error("Batch verification error:", error);
      return requests.map((request) => ({
        success: false,
        error: "Batch verification failed",
        accountNumber: request.accountNumber,
        bankCode: request.bankCode,
      }));
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      if (process.env["NODE_ENV"] === "test") {
        return true;
      }

      if (!this.configured) {
        console.error("Bank verification provider is not configured");
        return false;
      }

      console.log("✅ Paystack bank verification is configured and ready");
      return true;
    } catch (error) {
      console.error("Bank verification provider connection test failed:", error);
      return false;
    }
  }

  isConfigured(): boolean {
    return this.configured;
  }

  /**
   * Verifies if the provided secret key is valid by calling Paystack's API
   */
  async verifyKeys(secretKey: string): Promise<boolean> {
    try {
      const response = await axios.get(`https://api.paystack.co/transaction/totals`, {
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      });

      return response.status === 200 && response.data.status === true;
    } catch (error: any) {
      console.error("Paystack key verification failed", error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || "Invalid Paystack Secret Key";
      throw new Error(errorMessage);
    }
  }

  /**
   * Initializes a Paystack transaction and returns checkout details.
   */
  async initializeTransaction(
    input: PaystackInitializeTransactionInput,
  ): Promise<PaystackInitializeTransactionResult> {
    const email = typeof input.email === "string" ? input.email.trim() : "";
    const reference = typeof input.reference === "string" ? input.reference.trim() : "";

    if (!email) {
      return { success: false, message: "email is required for checkout initialization" };
    }
    if (!reference) {
      return { success: false, message: "reference is required for checkout initialization" };
    }
    if (!Number.isInteger(input.amount) || input.amount <= 0) {
      return { success: false, message: "amount must be a positive integer" };
    }

    if (process.env["NODE_ENV"] === "test") {
      return {
        success: true,
        data: {
          reference,
          accessCode: "test_access_code",
          authorizationUrl: `https://checkout.paystack.com/test/${encodeURIComponent(reference)}`,
        },
      };
    }

    if (!this.configured || !this.paystackKey) {
      return { success: false, message: "Paystack is not configured" };
    }

    try {
      const payload: Record<string, unknown> = {
        email,
        amount: input.amount,
        reference,
      };
      if (input.callbackUrl) payload["callback_url"] = input.callbackUrl;
      if (input.metadata) payload["metadata"] = input.metadata;

      const response = await axios.post(`${this.baseUrl}/transaction/initialize`, payload, {
        headers: {
          Authorization: `Bearer ${this.paystackKey}`,
          "Content-Type": "application/json",
        },
        timeout: 20000,
      });

      const data = response.data?.data;
      if (response.data?.status === true && data?.reference && data?.access_code && data?.authorization_url) {
        return {
          success: true,
          data: {
            reference: String(data.reference),
            accessCode: String(data.access_code),
            authorizationUrl: String(data.authorization_url),
          },
        };
      }

      return {
        success: false,
        message: response.data?.message || "Paystack initialize transaction failed",
      };
    } catch (error: any) {
      console.error("Paystack initialize transaction error:", error.response?.data || error.message);
      const msg =
        error.response?.data?.message || error.message || "Failed to initialize transaction with Paystack";
      return { success: false, message: msg };
    }
  }

  /**
   * Verifies a Paystack transaction by reference (client redirect / callback).
   * Uses PAYSTACK_SK. Phase 2: add webhooks for charge.success reconciliation.
   */
  async verifyTransaction(reference: string): Promise<PaystackTransactionVerifyResult> {
    const ref = typeof reference === "string" ? reference.trim() : "";
    if (!ref) {
      return { success: false, message: "Transaction reference is required" };
    }

    if (process.env["NODE_ENV"] === "test") {
      return {
        success: true,
        data: {
          amount: Number(process.env["PAYSTACK_VERIFY_TEST_AMOUNT"] || "1999900"),
          currency: "NGN",
          status: "success",
          reference: ref,
          metadata: {},
        },
      };
    }

    if (!this.configured || !this.paystackKey) {
      return { success: false, message: "Paystack is not configured" };
    }

    try {
      const response = await axios.get(
        `${this.baseUrl}/transaction/verify/${encodeURIComponent(ref)}`,
        {
          headers: {
            Authorization: `Bearer ${this.paystackKey}`,
            "Content-Type": "application/json",
          },
          timeout: 20000,
        },
      );

      if (response.data?.status === true && response.data?.data) {
        const d = response.data.data;
        const metadata =
          d.metadata && typeof d.metadata === "object" && !Array.isArray(d.metadata)
            ? (d.metadata as Record<string, unknown>)
            : {};
        return {
          success: true,
          data: {
            amount: Number(d.amount),
            currency: String(d.currency || ""),
            status: String(d.status || ""),
            reference: String(d.reference || ref),
            transactionId: typeof d.id === "number" ? d.id : d.id != null ? Number(d.id) : undefined,
            paidAt: typeof d.paid_at === "string" ? d.paid_at : undefined,
            metadata,
          },
        };
      }

      return {
        success: false,
        message: response.data?.message || "Paystack verification failed",
      };
    } catch (error: any) {
      console.error("Paystack transaction verify error:", error.response?.data || error.message);
      const msg =
        error.response?.data?.message || error.message || "Failed to verify transaction with Paystack";
      return { success: false, message: msg };
    }
  }
}

export const paystackService = new PaystackService();
