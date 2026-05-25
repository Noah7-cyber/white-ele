import { EntityManager, Not, Repository } from "typeorm";
import { AppDataSource } from "../../core";
import { Subscription } from "../../shared/entities/Subscription";
import { SubscriptionPlan } from "../../shared/entities/SubscriptionPlan";
import { BillingPlan } from "../../shared/entities/BillingPlan";
import { SubscriptionHistory } from "../../shared/entities/SubscriptionHistory";
import { BillingPlanPeriod, SubscriptionStatus } from "../../shared/entities/EntityEnums";
import {
  paystackService,
  type PaystackTransactionVerifyData,
} from "../../shared/services/paystack.service";

export const SCHOOL_SUBSCRIPTION_ERROR = {
  ACTIVE_EXISTS: "ACTIVE_SUBSCRIPTION_EXISTS",
  NOT_CANCELED: "SUBSCRIPTION_NOT_CANCELED",
  REFERENCE_OWNED_ELSEWHERE: "PAYSTACK_REFERENCE_OWNED_ELSEWHERE",
} as const;

function metadataSchoolMatches(metadata: Record<string, unknown>, schoolId: number): boolean {
  const raw = metadata["schoolId"] ?? metadata["school_id"];
  if (raw === undefined || raw === null) {
    return true;
  }
  const n = Number(raw);
  return !Number.isNaN(n) && n === schoolId;
}

function metadataPositiveInt(metadata: Record<string, unknown>, ...keys: string[]): number | undefined {
  for (const key of keys) {
    const raw = metadata[key];
    if (raw === undefined || raw === null) {
      continue;
    }
    const n = Number(raw);
    if (!Number.isNaN(n) && Number.isInteger(n) && n > 0) {
      return n;
    }
  }
  return undefined;
}

function metadataIntentIsRenewal(metadata: Record<string, unknown>): boolean {
  const raw = metadata["intent"];
  return typeof raw === "string" && raw.toLowerCase() === "renewal";
}

function metadataIntentIsUpgrade(metadata: Record<string, unknown>): boolean {
  const raw = metadata["intent"];
  return typeof raw === "string" && raw.toLowerCase() === "upgrade";
}

export const SUBSCRIPTION_HISTORY_CHANGE_TYPE_UPGRADE = "upgrade";

const MS_PER_DAY = 86_400_000;

function nominalDaysForBillingPeriod(period: BillingPlanPeriod): number {
  switch (period) {
    case BillingPlanPeriod.MONTHLY:
      return 30;
    case BillingPlanPeriod.QUARTERLY:
      return 90;
    case BillingPlanPeriod.ANNUALLY:
    case BillingPlanPeriod.YEARLY:
      return 365;
    default:
      return 30;
  }
}

/** Whole calendar days remaining until renewal (ceiling); 0 if renewal is in the past or now. */
function remainingWholeDaysUntilRenewal(renewalDate: Date, from: Date): number {
  const diff = renewalDate.getTime() - from.getTime();
  if (diff <= 0) {
    return 0;
  }
  return Math.ceil(diff / MS_PER_DAY);
}

function addCalendarDays(from: Date, days: number): Date {
  const d = new Date(from.getTime());
  d.setDate(d.getDate() + days);
  return d;
}

function computeUpgradeProrationSnapshot(args: {
  renewalDate: Date;
  currentBilling: BillingPlan;
  newBilling: BillingPlan;
  now: Date;
}): {
  remainingDays: number;
  remainingValue: number;
  amountUsed: number;
  upgradeCost: number;
  extraDays: number;
  newPeriodDays: number;
  currentPeriodDays: number;
  newPlanPrice: number;
  newRenewalDate: Date;
  newDurationDays: number;
} {
  const { renewalDate, currentBilling, newBilling, now } = args;
  const currentPeriodDays = nominalDaysForBillingPeriod(currentBilling.period);
  const newPeriodDays = nominalDaysForBillingPeriod(newBilling.period);
  const currentPrice = currentBilling.price;
  const newPlanPrice = newBilling.price;
  const remainingDays = remainingWholeDaysUntilRenewal(renewalDate, now);
  const remainingValue =
    currentPeriodDays > 0 ? Math.round((remainingDays / currentPeriodDays) * currentPrice) : 0;
  const amountUsed = Math.max(0, currentPrice - remainingValue);
  const upgradeCost = Math.max(0, newPlanPrice - remainingValue);
  const extraDays =
    newPlanPrice > 0 ? Math.round((remainingValue / newPlanPrice) * newPeriodDays) : 0;
  const newDurationDays = newPeriodDays + extraDays;
  const newRenewalDate = addCalendarDays(new Date(now.getTime()), newDurationDays);
  return {
    remainingDays,
    remainingValue,
    amountUsed,
    upgradeCost,
    extraDays,
    newPeriodDays,
    currentPeriodDays,
    newPlanPrice,
    newRenewalDate,
    newDurationDays,
  };
}

function paymentDateFromVerify(verifyData: PaystackTransactionVerifyData): Date {
  const paid = verifyData.paidAt;
  if (typeof paid === "string" && paid.trim()) {
    const d = new Date(paid);
    if (!Number.isNaN(d.getTime())) {
      return d;
    }
  }
  return new Date();
}

/** Detect unique constraint failures (e.g. duplicate payment reference on subscription_history). */
function isDatabaseUniqueViolation(err: unknown): boolean {
  const e = err as { code?: string; driverError?: { code?: string }; errno?: number; message?: string };
  if (e?.code === "23505" || e?.driverError?.code === "23505") {
    return true;
  }
  if (e?.errno === 19 && String(e?.message || "").includes("UNIQUE")) {
    return true;
  }
  const m = String(e?.message || "");
  if (m.includes("duplicate key") || m.includes("UNIQUE constraint failed")) {
    return true;
  }
  return false;
}

function addBillingPeriod(start: Date, period: BillingPlanPeriod): Date {
  const d = new Date(start.getTime());
  switch (period) {
    case BillingPlanPeriod.MONTHLY:
      d.setMonth(d.getMonth() + 1);
      break;
    case BillingPlanPeriod.QUARTERLY:
      d.setMonth(d.getMonth() + 3);
      break;
    case BillingPlanPeriod.ANNUALLY:
    case BillingPlanPeriod.YEARLY:
      d.setFullYear(d.getFullYear() + 1);
      break;
    default:
      d.setMonth(d.getMonth() + 1);
  }
  return d;
}

export interface CreateSchoolSubscriptionInput {
  planId: number;
  billingPlanId: number;
  status?: SubscriptionStatus;
  startDate?: Date;
  providerSubscriptionId?: string;
  replaceActive?: boolean;
  /** Set when subscription is created after Paystack verify (idempotency key). */
  paystackReference?: string;
  /** Overrides history amountPaid when payment gateway amount is authoritative. */
  historyAmountPaid?: number;
}

export interface ConfirmSchoolSubscriptionWithPaystackInput {
  reference: string;
  /** Optional for POST /confirm when relying on Paystack metadata only. */
  planId?: number;
  billingPlanId?: number;
  status?: SubscriptionStatus;
  replaceActive?: boolean;
  startDate?: Date;
}

/** Options for authenticated confirm; callback omits assertSchoolId. */
export interface ProcessPaystackVerificationOptions {
  assertSchoolId?: number;
  /** When set, must match metadata planId for new subscriptions (legacy POST /confirm). */
  assertPlanId?: number;
  assertBillingPlanId?: number;
  status?: SubscriptionStatus;
  replaceActive?: boolean;
  startDate?: Date;
}

/**
 * Resolve the Paystack callback URL for subscription checkouts.
 * Precedence:
 *   1. PAYSTACK_SUBSCRIPTION_CALLBACK_URL — full URL override.
 *   2. API_BASE_URL — canonical backend base, joined with the callback path.
 *   3. API_PUBLIC_URL — legacy fallback, joined with the callback path.
 */
export function getSubscriptionPaystackCallbackUrl(): string | undefined {
  const direct = process.env["PAYSTACK_SUBSCRIPTION_CALLBACK_URL"]?.trim();
  if (direct) {
    return direct;
  }
  const backendBase = process.env["API_BASE_URL"]?.trim().replace(/\/$/, "");
  if (backendBase) {
    return `${backendBase}/api/v1/subscriptions/paystack/callback`;
  }
  const legacyBase = process.env["API_PUBLIC_URL"]?.trim().replace(/\/$/, "");
  if (legacyBase) {
    return `${legacyBase}/api/v1/subscriptions/paystack/callback`;
  }
  return undefined;
}

export interface InitializeSchoolSubscriptionCheckoutInput {
  planId: number;
  billingPlanId: number;
  email: string;
  /** @deprecated Ignored. The callback URL is derived on the server from API_BASE_URL. */
  callbackUrl?: string;
  status?: SubscriptionStatus;
  replaceActive?: boolean;
  startDate?: Date;
}

export interface RenewSchoolSubscriptionCheckoutInput {
  email: string;
  /** @deprecated Ignored. The callback URL is derived on the server from API_BASE_URL. */
  callbackUrl?: string;
}

export interface UpgradeSchoolSubscriptionCheckoutInput {
  newPlanId: number;
  newBillingPlanId?: number;
  email: string;
  /** @deprecated Ignored. The callback URL is derived on the server from API_BASE_URL. */
  callbackUrl?: string;
}

export interface UpdateSchoolSubscriptionInput {
  status?: SubscriptionStatus;
  isCancelled?: boolean;
  cancelledAt?: Date | null;
  endDate?: Date | null;
  providerSubscriptionId?: string | null;
  planId?: number;
  billingPlanId?: number;
}

class SchoolSubscriptionService {
  private get repository(): Repository<Subscription> {
    return AppDataSource.getRepository(Subscription);
  }

  private get historyRepository(): Repository<SubscriptionHistory> {
    return AppDataSource.getRepository(SubscriptionHistory);
  }

  /**
   * Billing-plan selection for upgrade/downgrade:
   * 1) requested newBillingPlanId (must belong to new plan), else
   * 2) same period as current billing, else
   * 3) lowest billing-plan id on the new plan.
   */
  private async resolveNewBillingPlanForUpgrade(
    newPlanId: number,
    currentPeriod: BillingPlanPeriod,
    requestedBillingPlanId?: number,
  ): Promise<{ billing?: BillingPlan; error?: string }> {
    const repo = AppDataSource.getRepository(BillingPlan);

    if (typeof requestedBillingPlanId === "number") {
      const requested = await repo.findOne({ where: { id: requestedBillingPlanId } });
      if (!requested) {
        return { error: "Requested billing plan not found" };
      }
      if (requested.subscriptionPlanId !== newPlanId) {
        return { error: "Requested billing plan does not belong to the selected new plan" };
      }
      return { billing: requested };
    }

    const preferred = await repo.findOne({
      where: { subscriptionPlanId: newPlanId, period: currentPeriod },
    });
    if (preferred) {
      return { billing: preferred };
    }
    const fallback = await repo.find({
      where: { subscriptionPlanId: newPlanId },
      order: { id: "ASC" },
      take: 1,
    });
    const billing = fallback[0];
    if (!billing) {
      return { error: "No billing plan is configured for the selected upgrade plan" };
    }
    return { billing };
  }

  /** True if the school has any subscription in past_due (used for API access gate). */
  async schoolHasPastDueSubscription(schoolId: number): Promise<boolean> {
    const row = await this.repository.findOne({
      where: { schoolId, status: SubscriptionStatus.PAST_DUE },
      select: ["id"],
    });
    return row !== null;
  }

  private async validatePlanAndBilling(
    manager: EntityManager,
    planId: number,
    billingPlanId: number,
  ): Promise<{ plan: SubscriptionPlan; billing: BillingPlan } | { error: string }> {
    const plan = await manager.findOne(SubscriptionPlan, { where: { id: planId } });
    if (!plan) {
      return { error: "Subscription plan not found" };
    }
    if (!plan.isActive) {
      return { error: "Subscription plan is not active" };
    }

    const billing = await manager.findOne(BillingPlan, { where: { id: billingPlanId } });
    if (!billing) {
      return { error: "Billing plan not found" };
    }
    if (billing.subscriptionPlanId !== planId) {
      return { error: "Billing plan does not belong to the selected subscription plan" };
    }

    return { plan, billing };
  }

  async listForSchool(
    schoolId: number,
    filters: { status?: SubscriptionStatus; pos?: number; delta?: number },
  ) {
    const { status, pos = 0, delta = 20 } = filters;

    const qb = this.repository
      .createQueryBuilder("sub")
      .leftJoinAndSelect("sub.plan", "plan")
      .leftJoinAndSelect("sub.billingPlan", "billingPlan")
      .where("sub.schoolId = :schoolId", { schoolId })
      .orderBy("sub.createdAt", "DESC")
      .skip(pos)
      .take(delta);

    if (status) {
      qb.andWhere("sub.status = :status", { status });
    }

    const [subscriptions, count] = await qb.getManyAndCount();

    return {
      success: true,
      message: "Subscriptions retrieved successfully",
      subscriptions,
      pagination: { pos, delta, count },
    };
  }

  async getByIdForSchool(schoolId: number, id: number) {
    const subscription = await this.repository.findOne({
      where: { id, schoolId },
      relations: ["plan", "billingPlan"],
    });

    if (!subscription) {
      return {
        success: false,
        message: "Subscription not found",
      };
    }

    return {
      success: true,
      message: "Subscription retrieved successfully",
      subscription,
    };
  }

  async initializeCheckoutForSchool(
    schoolId: number,
    input: InitializeSchoolSubscriptionCheckoutInput,
  ) {
    const validated = await this.validatePlanAndBilling(AppDataSource.manager, input.planId, input.billingPlanId);
    if ("error" in validated) {
      return { success: false, message: validated.error };
    }

    const { plan, billing } = validated;
    const reference = `sub_${schoolId}_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
    const init = await paystackService.initializeTransaction({
      email: input.email,
      amount: billing.price,
      reference,
      callbackUrl: getSubscriptionPaystackCallbackUrl(),
      metadata: {
        schoolId,
        planId: plan.id,
        billingPlanId: billing.id,
        status: input.status ?? SubscriptionStatus.ACTIVE,
        replaceActive: Boolean(input.replaceActive),
        startDate: input.startDate ? new Date(input.startDate).toISOString() : undefined,
      },
    });

    if (!init.success || !init.data) {
      return {
        success: false,
        message: init.message || "Failed to initialize Paystack checkout",
      };
    }

    return {
      success: true,
      message: "Checkout URL generated successfully",
      reference: init.data.reference,
      checkoutUrl: init.data.authorizationUrl,
      accessCode: init.data.accessCode,
      amount: billing.price,
      currency: plan.currency,
      planId: plan.id,
      billingPlanId: billing.id,
    };
  }

  async renewCheckoutForSchool(schoolId: number, subscriptionId: number, input: RenewSchoolSubscriptionCheckoutInput) {
    const subscription = await this.repository.findOne({
      where: { id: subscriptionId, schoolId },
      relations: ["plan", "billingPlan"],
    });

    if (!subscription) {
      return { success: false, message: "Subscription not found" };
    }

    if (
      subscription.status !== SubscriptionStatus.ACTIVE &&
      subscription.status !== SubscriptionStatus.PAST_DUE
    ) {
      return {
        success: false,
        message: "Renewal is only allowed for active or past_due subscriptions",
      };
    }

    const plan = subscription.plan;
    const billing = subscription.billingPlan;
    if (!plan || !plan.isActive || !billing) {
      return { success: false, message: "Subscription plan or billing plan is not available" };
    }

    const reference = `sub_ren_${schoolId}_${subscriptionId}_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
    const init = await paystackService.initializeTransaction({
      email: input.email,
      amount: billing.price,
      reference,
      callbackUrl: getSubscriptionPaystackCallbackUrl(),
      metadata: {
        intent: "renewal",
        subscriptionId,
        schoolId,
        planId: plan.id,
        billingPlanId: billing.id,
      },
    });

    if (!init.success || !init.data) {
      return {
        success: false,
        message: init.message || "Failed to initialize Paystack checkout",
      };
    }

    return {
      success: true,
      message: "Renewal checkout URL generated successfully",
      reference: init.data.reference,
      checkoutUrl: init.data.authorizationUrl,
      accessCode: init.data.accessCode,
      amount: billing.price,
      currency: plan.currency,
      planId: plan.id,
      billingPlanId: billing.id,
    };
  }

  async getUpgradeSummaryForSchool(
    schoolId: number,
    subscriptionId: number,
    input: { newPlanId: number; newBillingPlanId?: number },
  ) {
    const subscription = await this.repository.findOne({
      where: { id: subscriptionId, schoolId },
      relations: ["plan", "billingPlan"],
    });

    if (!subscription) {
      return { success: false as const, message: "Subscription not found" };
    }

    if (
      subscription.status !== SubscriptionStatus.ACTIVE &&
      subscription.status !== SubscriptionStatus.PAST_DUE
    ) {
      return {
        success: false as const,
        message: "Upgrade is only allowed for active or past_due subscriptions",
      };
    }

    const currentPlan = subscription.plan;
    const currentBilling = subscription.billingPlan;
    if (!currentPlan || !currentPlan.isActive || !currentBilling) {
      return {
        success: false as const,
        message: "Current subscription plan or billing plan is not available",
      };
    }

    if (input.newPlanId === subscription.planId) {
      return { success: false as const, message: "newPlanId must differ from the current plan" };
    }

    const newPlan = await AppDataSource.getRepository(SubscriptionPlan).findOne({
      where: { id: input.newPlanId },
    });
    if (!newPlan || !newPlan.isActive) {
      return { success: false as const, message: "New subscription plan not found or not active" };
    }

    const billingResolved = await this.resolveNewBillingPlanForUpgrade(
      input.newPlanId,
      currentBilling.period,
      input.newBillingPlanId,
    );
    if (!billingResolved.billing) {
      return {
        success: false as const,
        message:
          billingResolved.error || "No billing plan is configured for the selected upgrade plan",
      };
    }
    const newBilling = billingResolved.billing;

    const currentBlock = {
      planId: currentPlan.id,
      planName: currentPlan.name,
      billingPlanId: currentBilling.id,
      period: currentBilling.period,
      price: currentBilling.price,
      periodDays: nominalDaysForBillingPeriod(currentBilling.period),
      renewalDate: subscription.renewalDate,
    };

    const newBlock = {
      planId: newPlan.id,
      planName: newPlan.name,
      billingPlanId: newBilling.id,
      period: newBilling.period,
      price: newBilling.price,
      periodDays: nominalDaysForBillingPeriod(newBilling.period),
    };

    if (newBilling.price < currentBilling.price) {
      return {
        success: true as const,
        kind: "scheduledDowngrade" as const,
        message: "Downgrade will take effect at next renewal",
        currency: newPlan.currency,
        effectiveDate: subscription.renewalDate,
        current: currentBlock,
        new: newBlock,
      };
    }

    const snap = computeUpgradeProrationSnapshot({
      renewalDate: subscription.renewalDate,
      currentBilling,
      newBilling,
      now: new Date(),
    });

    return {
      success: true as const,
      kind: (snap.upgradeCost === 0 ? "freeUpgrade" : "upgrade") as "upgrade" | "freeUpgrade",
      message: "Upgrade summary computed",
      currency: newPlan.currency,
      current: currentBlock,
      new: newBlock,
      proration: {
        remainingDays: snap.remainingDays,
        remainingValue: snap.remainingValue,
        upgradeCost: snap.upgradeCost,
        extraDays: snap.extraDays,
        newDurationDays: snap.newDurationDays,
        newRenewalDate: snap.newRenewalDate,
      },
      explanation: {
        remainingValueFormula: "round(remainingDays / currentPeriodDays * currentPrice)",
        upgradeCostFormula: "max(0, newPlanPrice - remainingValue)",
        extraDaysFormula: "round(remainingValue / newPlanPrice * newPeriodDays)",
      },
    };
  }

  async upgradeCheckoutForSchool(
    schoolId: number,
    subscriptionId: number,
    input: UpgradeSchoolSubscriptionCheckoutInput,
  ) {
    const subscription = await this.repository.findOne({
      where: { id: subscriptionId, schoolId },
      relations: ["plan", "billingPlan"],
    });

    if (!subscription) {
      return { success: false, message: "Subscription not found" };
    }

    if (
      subscription.status !== SubscriptionStatus.ACTIVE &&
      subscription.status !== SubscriptionStatus.PAST_DUE
    ) {
      return {
        success: false,
        message: "Upgrade is only allowed for active or past_due subscriptions",
      };
    }

    const currentPlan = subscription.plan;
    const currentBilling = subscription.billingPlan;
    if (!currentPlan || !currentPlan.isActive || !currentBilling) {
      return { success: false, message: "Current subscription plan or billing plan is not available" };
    }

    if (input.newPlanId === subscription.planId) {
      return { success: false, message: "newPlanId must differ from the current plan" };
    }

    const newPlan = await AppDataSource.getRepository(SubscriptionPlan).findOne({
      where: { id: input.newPlanId },
    });
    if (!newPlan || !newPlan.isActive) {
      return { success: false, message: "New subscription plan not found or not active" };
    }

    const billingResolved = await this.resolveNewBillingPlanForUpgrade(
      input.newPlanId,
      currentBilling.period,
      input.newBillingPlanId,
    );
    if (!billingResolved.billing) {
      return {
        success: false,
        message: billingResolved.error || "No billing plan is configured for the selected upgrade plan",
      };
    }
    const newBilling = billingResolved.billing;

    if (newBilling.price < currentBilling.price) {
      subscription.pendingPlanId = input.newPlanId;
      subscription.pendingBillingPlanId = newBilling.id;
      await this.repository.save(subscription);
      return {
        success: true,
        scheduledDowngrade: true as const,
        message: "Downgrade will take effect at next renewal",
        effectiveDate: subscription.renewalDate,
        pendingPlanId: input.newPlanId,
        pendingBillingPlanId: newBilling.id,
      };
    }

    const now = new Date();
    const snap = computeUpgradeProrationSnapshot({
      renewalDate: subscription.renewalDate,
      currentBilling,
      newBilling,
      now,
    });

    if (snap.upgradeCost === 0) {
      const applied = await this.applyPlanUpgradeZeroCost(
        schoolId,
        subscriptionId,
        input.newPlanId,
        newBilling.id,
        now,
      );
      if (!applied.success) {
        return applied;
      }
      return {
        ...applied,
        immediateUpgrade: true as const,
        proration: {
          remainingDays: snap.remainingDays,
          remainingValue: snap.remainingValue,
          extraDays: snap.extraDays,
          newRenewalAfterPayment: snap.newRenewalDate,
        },
      };
    }

    const reference = `sub_upg_${schoolId}_${subscriptionId}_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
    const init = await paystackService.initializeTransaction({
      email: input.email,
      amount: snap.upgradeCost,
      reference,
      callbackUrl: getSubscriptionPaystackCallbackUrl(),
      metadata: {
        intent: "upgrade",
        subscriptionId,
        schoolId,
        oldPlanId: subscription.planId,
        newPlanId: input.newPlanId,
        billingPlanId: newBilling.id,
      },
    });

    if (!init.success || !init.data) {
      return {
        success: false,
        message: init.message || "Failed to initialize Paystack upgrade checkout",
      };
    }

    return {
      success: true,
      message: "Upgrade checkout URL generated successfully",
      reference: init.data.reference,
      checkoutUrl: init.data.authorizationUrl,
      accessCode: init.data.accessCode,
      amount: snap.upgradeCost,
      currency: newPlan.currency,
      newPlanId: input.newPlanId,
      billingPlanId: newBilling.id,
      proration: {
        remainingDays: snap.remainingDays,
        remainingValue: snap.remainingValue,
        extraDays: snap.extraDays,
        newRenewalAfterPayment: snap.newRenewalDate,
      },
    };
  }

  /**
   * Resolve the school's "current" subscription for upgrade purposes:
   * the most recently created row whose status is ACTIVE or PAST_DUE.
   */
  private async findCurrentUpgradableSubscriptionId(schoolId: number): Promise<number | null> {
    const row = await this.repository.findOne({
      where: [
        { schoolId, status: SubscriptionStatus.ACTIVE },
        { schoolId, status: SubscriptionStatus.PAST_DUE },
      ],
      order: { createdAt: "DESC" },
      select: ["id"],
    });
    return row?.id ?? null;
  }

  async getUpgradeSummaryForCurrent(
    schoolId: number,
    input: { newPlanId: number; newBillingPlanId?: number },
  ) {
    const id = await this.findCurrentUpgradableSubscriptionId(schoolId);
    if (id === null) {
      return {
        success: false as const,
        message: "No active or past_due subscription to upgrade",
      };
    }
    return this.getUpgradeSummaryForSchool(schoolId, id, input);
  }

  async upgradeCheckoutForCurrent(
    schoolId: number,
    input: UpgradeSchoolSubscriptionCheckoutInput,
  ) {
    const id = await this.findCurrentUpgradableSubscriptionId(schoolId);
    if (id === null) {
      return {
        success: false as const,
        message: "No active or past_due subscription to upgrade",
      };
    }
    return this.upgradeCheckoutForSchool(schoolId, id, input);
  }

  /**
   * Free prorated upgrade (no Paystack; initialize rejects amount 0).
   */
  private async applyPlanUpgradeZeroCost(
    schoolId: number,
    subscriptionId: number,
    newPlanId: number,
    newBillingPlanId: number,
    at: Date,
  ) {
    const subscription = await this.repository.findOne({
      where: { id: subscriptionId, schoolId },
      relations: ["plan", "billingPlan"],
    });

    if (!subscription) {
      return { success: false, message: "Subscription not found" };
    }

    if (
      subscription.status !== SubscriptionStatus.ACTIVE &&
      subscription.status !== SubscriptionStatus.PAST_DUE
    ) {
      return {
        success: false,
        message: "Upgrade is only allowed for active or past_due subscriptions",
      };
    }

    const currentBilling = subscription.billingPlan;
    const newBilling = await AppDataSource.getRepository(BillingPlan).findOne({
      where: { id: newBillingPlanId },
    });
    if (!currentBilling || !newBilling || newBilling.subscriptionPlanId !== newPlanId) {
      return { success: false, message: "Billing plan is not valid for this upgrade" };
    }

    if (newBilling.price < currentBilling.price) {
      return {
        success: false,
        message: "Downgrade must be scheduled at checkout; use upgrade-checkout to schedule for next renewal",
      };
    }

    const snap = computeUpgradeProrationSnapshot({
      renewalDate: subscription.renewalDate,
      currentBilling,
      newBilling,
      now: at,
    });

    if (snap.upgradeCost !== 0) {
      return {
        success: false,
        message: "This upgrade requires payment; upgrade cost is not zero",
      };
    }

    const newPlan = await AppDataSource.getRepository(SubscriptionPlan).findOne({
      where: { id: newPlanId },
    });
    if (!newPlan || !newPlan.isActive) {
      return { success: false, message: "New subscription plan not found or not active" };
    }

    return this.runPlanUpgradeTransaction({
      schoolId,
      subscriptionId,
      previousPlanId: subscription.planId,
      previousBillingPlanId: subscription.billingPlanId,
      newPlanId,
      newBillingPlanId,
      newRenewalDate: snap.newRenewalDate,
      newPlanPrice: snap.newPlanPrice,
      amountPaid: 0,
      amountUsedBeforeUpgrade: snap.amountUsed,
      reference: null,
      paymentDate: at,
      extraDays: snap.extraDays,
      paystackReferenceAfter: null,
    });
  }

  /**
   * Apply paid prorated upgrade after Paystack verify. Idempotency: SubscriptionHistory.reference.
   */
  async applyPlanUpgrade(schoolId: number, subscriptionId: number, verifyData: PaystackTransactionVerifyData) {
    const reference = typeof verifyData.reference === "string" ? verifyData.reference.trim() : "";
    if (!reference) {
      return { success: false, message: "reference is required" };
    }

    const existingHistory = await this.historyRepository.findOne({
      where: { reference },
      relations: ["subscription", "subscription.plan", "subscription.billingPlan"],
    });
    if (existingHistory?.subscription) {
      if (existingHistory.subscription.schoolId !== schoolId) {
        return {
          success: false,
          message: "This payment reference is already associated with another school",
          errorCode: SCHOOL_SUBSCRIPTION_ERROR.REFERENCE_OWNED_ELSEWHERE,
        };
      }
      return {
        success: true,
        message: "Upgrade payment already processed for this reference",
        subscription: existingHistory.subscription,
        idempotent: true as const,
      };
    }

    const meta = verifyData.metadata || {};
    const metaSchoolId = metadataPositiveInt(meta, "schoolId", "school_id");
    const metaSubId = metadataPositiveInt(meta, "subscriptionId", "subscription_id");
    const metaOldPlanId = metadataPositiveInt(meta, "oldPlanId", "old_plan_id");
    const metaNewPlanId = metadataPositiveInt(meta, "newPlanId", "new_plan_id");
    const metaBillingId = metadataPositiveInt(meta, "billingPlanId", "billing_plan_id");

    if (
      metaSchoolId === undefined ||
      metaSubId === undefined ||
      metaOldPlanId === undefined ||
      metaNewPlanId === undefined ||
      metaBillingId === undefined
    ) {
      return {
        success: false,
        message: "Upgrade transaction metadata is missing schoolId, subscriptionId, oldPlanId, newPlanId, or billingPlanId",
      };
    }

    if (metaSubId !== subscriptionId || metaSchoolId !== schoolId) {
      return { success: false, message: "Upgrade metadata does not match this subscription or school" };
    }

    const subscription = await this.repository.findOne({
      where: { id: subscriptionId, schoolId },
      relations: ["plan", "billingPlan"],
    });

    if (!subscription) {
      return { success: false, message: "Subscription not found" };
    }

    if (
      subscription.status !== SubscriptionStatus.ACTIVE &&
      subscription.status !== SubscriptionStatus.PAST_DUE
    ) {
      return {
        success: false,
        message: "Upgrade is only allowed for active or past_due subscriptions",
      };
    }

    if (subscription.planId !== metaOldPlanId) {
      return {
        success: false,
        message: "Subscription plan has changed since checkout; cannot apply this upgrade",
      };
    }

    const newBilling = await AppDataSource.getRepository(BillingPlan).findOne({
      where: { id: metaBillingId },
    });
    if (!newBilling || newBilling.subscriptionPlanId !== metaNewPlanId) {
      return {
        success: false,
        message: "Billing plan does not belong to the upgrade target plan",
      };
    }

    const newPlan = await AppDataSource.getRepository(SubscriptionPlan).findOne({
      where: { id: metaNewPlanId },
    });
    if (!newPlan || !newPlan.isActive) {
      return { success: false, message: "New subscription plan not found or not active" };
    }

    const currentBilling = subscription.billingPlan;
    if (!currentBilling) {
      return { success: false, message: "Current billing plan is not available" };
    }

    if (newBilling.price < currentBilling.price) {
      return {
        success: false,
        message: "Downgrade must be scheduled at checkout; use upgrade-checkout to schedule for next renewal",
      };
    }

    const paymentDate = paymentDateFromVerify(verifyData);
    const snap = computeUpgradeProrationSnapshot({
      renewalDate: subscription.renewalDate,
      currentBilling,
      newBilling,
      now: paymentDate,
    });

    if (verifyData.amount !== snap.upgradeCost) {
      return {
        success: false,
        message: `Paid amount does not match expected upgrade charge (expected ${snap.upgradeCost}, got ${verifyData.amount})`,
      };
    }

    const currencyExpected = (newPlan.currency || "NGN").toUpperCase();
    if (verifyData.currency.toUpperCase() !== currencyExpected) {
      return {
        success: false,
        message: `Currency mismatch (expected ${currencyExpected}, got ${verifyData.currency})`,
      };
    }

    const providerId =
      verifyData.transactionId !== undefined && !Number.isNaN(verifyData.transactionId)
        ? String(verifyData.transactionId)
        : undefined;

    return this.runPlanUpgradeTransaction({
      schoolId,
      subscriptionId,
      previousPlanId: subscription.planId,
      previousBillingPlanId: subscription.billingPlanId,
      newPlanId: metaNewPlanId,
      newBillingPlanId: metaBillingId,
      newRenewalDate: snap.newRenewalDate,
      newPlanPrice: snap.newPlanPrice,
      amountPaid: verifyData.amount,
      amountUsedBeforeUpgrade: snap.amountUsed,
      reference,
      paymentDate,
      extraDays: snap.extraDays,
      paystackReferenceAfter: reference,
      providerSubscriptionId: providerId,
    });
  }

  private async runPlanUpgradeTransaction(args: {
    schoolId: number;
    subscriptionId: number;
    previousPlanId: number;
    previousBillingPlanId: number;
    newPlanId: number;
    newBillingPlanId: number;
    newRenewalDate: Date;
    newPlanPrice: number;
    amountPaid: number;
    amountUsedBeforeUpgrade: number;
    reference: string | null;
    paymentDate: Date;
    extraDays: number;
    paystackReferenceAfter: string | null;
    providerSubscriptionId?: string;
  }) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const subRow = await queryRunner.manager.findOne(Subscription, {
        where: { id: args.subscriptionId, schoolId: args.schoolId },
      });

      if (!subRow) {
        await queryRunner.rollbackTransaction();
        return { success: false, message: "Subscription not found" };
      }

      const upgradedAt = args.paymentDate;

      subRow.status = SubscriptionStatus.CANCELED;
      subRow.endDate = upgradedAt;
      subRow.upgradedAt = upgradedAt;
      subRow.amountUsedBeforeUpgrade = args.amountUsedBeforeUpgrade;
      subRow.pendingPlanId = null;
      subRow.pendingBillingPlanId = null;
      await queryRunner.manager.save(Subscription, subRow);

      const newSub = queryRunner.manager.create(Subscription, {
        schoolId: args.schoolId,
        planId: args.newPlanId,
        billingPlanId: args.newBillingPlanId,
        status: SubscriptionStatus.ACTIVE,
        startDate: upgradedAt,
        renewalDate: args.newRenewalDate,
        amountAtSubscription: args.newPlanPrice,
        isCancelled: false,
        upgradeAmountPaid: args.amountPaid,
        subscriptionIdUpgradedFrom: args.subscriptionId,
        ...(args.paystackReferenceAfter
          ? { paystackReference: args.paystackReferenceAfter }
          : {}),
        ...(args.providerSubscriptionId !== undefined && {
          providerSubscriptionId: args.providerSubscriptionId,
        }),
      });
      const savedNew = await queryRunner.manager.save(Subscription, newSub);

      const historyRow = queryRunner.manager.create(SubscriptionHistory, {
        subscriptionId: savedNew.id,
        reference: args.reference,
        paymentDate: args.paymentDate,
        amountPaid: args.amountPaid,
        status: SubscriptionStatus.ACTIVE,
        schoolId: args.schoolId,
        previousPlanId: args.previousPlanId,
        previousBillingPlanId: args.previousBillingPlanId,
        changeType: SUBSCRIPTION_HISTORY_CHANGE_TYPE_UPGRADE,
        prorationExtraDays: args.extraDays,
      });

      try {
        await queryRunner.manager.save(SubscriptionHistory, historyRow);
      } catch (insertErr: unknown) {
        if (isDatabaseUniqueViolation(insertErr) && args.reference) {
          await queryRunner.rollbackTransaction();
          const afterRace = await this.historyRepository.findOne({
            where: { reference: args.reference },
            relations: ["subscription", "subscription.plan", "subscription.billingPlan"],
          });
          if (afterRace?.subscription?.schoolId === args.schoolId) {
            return {
              success: true,
              message: "Upgrade payment already processed for this reference",
              subscription: afterRace.subscription,
              idempotent: true as const,
            };
          }
          return {
            success: false,
            message: "This payment reference could not be applied",
          };
        }
        throw insertErr;
      }

      await queryRunner.commitTransaction();

      const full = await this.repository.findOne({
        where: { id: savedNew.id },
        relations: ["plan", "billingPlan"],
      });

      return {
        success: true,
        message: "Subscription upgraded successfully",
        subscription: full || savedNew,
      };
    } catch (error: any) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      return {
        success: false,
        message: error.message || "Failed to apply upgrade",
      };
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Apply a successful Paystack renewal payment: extend renewalDate from previous renewalDate, record history.
   * Idempotency: SubscriptionHistory.reference only. Transaction: insert history, then update subscription.
   */
  async applySuccessfulRenewal(schoolId: number, subscriptionId: number, verifyData: PaystackTransactionVerifyData) {
    const reference = typeof verifyData.reference === "string" ? verifyData.reference.trim() : "";
    if (!reference) {
      return { success: false, message: "reference is required" };
    }

    const existingHistory = await this.historyRepository.findOne({
      where: { reference },
      relations: ["subscription", "subscription.plan", "subscription.billingPlan"],
    });
    if (existingHistory?.subscription) {
      if (existingHistory.subscription.schoolId !== schoolId) {
        return {
          success: false,
          message: "This payment reference is already associated with another school",
          errorCode: SCHOOL_SUBSCRIPTION_ERROR.REFERENCE_OWNED_ELSEWHERE,
        };
      }
      return {
        success: true,
        message: "Renewal payment already processed for this reference",
        subscription: existingHistory.subscription,
        idempotent: true as const,
      };
    }

    const meta = verifyData.metadata || {};
    const metaSchoolId = metadataPositiveInt(meta, "schoolId", "school_id");
    const metaPlanId = metadataPositiveInt(meta, "planId", "plan_id");
    const metaBillingId = metadataPositiveInt(meta, "billingPlanId", "billing_plan_id");
    const metaSubId = metadataPositiveInt(meta, "subscriptionId", "subscription_id");

    if (metaSubId !== subscriptionId) {
      return { success: false, message: "Payment metadata subscriptionId does not match renewal target" };
    }
    if (metaSchoolId !== schoolId) {
      return {
        success: false,
        message: "Payment metadata schoolId must exactly match the subscription school",
      };
    }
    if (metaPlanId === undefined || metaBillingId === undefined) {
      return {
        success: false,
        message: "Renewal payment metadata must include planId and billingPlanId",
      };
    }

    const subscription = await this.repository.findOne({
      where: { id: subscriptionId, schoolId },
      relations: ["plan", "billingPlan"],
    });

    if (!subscription) {
      return { success: false, message: "Subscription not found" };
    }

    if (metaPlanId !== subscription.planId || metaBillingId !== subscription.billingPlanId) {
      return {
        success: false,
        message: "Payment metadata planId or billingPlanId does not match the subscription row",
      };
    }

    if (
      subscription.status !== SubscriptionStatus.ACTIVE &&
      subscription.status !== SubscriptionStatus.PAST_DUE
    ) {
      return {
        success: false,
        message: "Renewal is only allowed for active or past_due subscriptions",
      };
    }

    const plan = subscription.plan;
    const billing = subscription.billingPlan;
    if (!plan || !plan.isActive || !billing) {
      return { success: false, message: "Subscription plan or billing plan is not available" };
    }

    if (verifyData.amount !== billing.price) {
      return {
        success: false,
        message: `Paid amount does not match billing plan price (expected ${billing.price}, got ${verifyData.amount})`,
      };
    }

    const currencyExpected = (plan.currency || "NGN").toUpperCase();
    if (verifyData.currency.toUpperCase() !== currencyExpected) {
      return {
        success: false,
        message: `Currency mismatch (expected ${currencyExpected}, got ${verifyData.currency})`,
      };
    }

    const newRenewalDate = addBillingPeriod(subscription.renewalDate, billing.period);

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const subRow = await queryRunner.manager.findOne(Subscription, {
        where: { id: subscriptionId, schoolId },
      });

      if (!subRow) {
        await queryRunner.rollbackTransaction();
        return { success: false, message: "Subscription not found" };
      }

      const historyRow = queryRunner.manager.create(SubscriptionHistory, {
        subscriptionId: subRow.id,
        reference,
        paymentDate: paymentDateFromVerify(verifyData),
        amountPaid: verifyData.amount,
        status: SubscriptionStatus.ACTIVE,
        schoolId,
      });

      try {
        await queryRunner.manager.save(SubscriptionHistory, historyRow);
      } catch (insertErr: unknown) {
        if (isDatabaseUniqueViolation(insertErr)) {
          await queryRunner.rollbackTransaction();
          const afterRace = await this.historyRepository.findOne({
            where: { reference },
            relations: ["subscription", "subscription.plan", "subscription.billingPlan"],
          });
          if (afterRace?.subscription?.schoolId === schoolId) {
            return {
              success: true,
              message: "Renewal payment already processed for this reference",
              subscription: afterRace.subscription,
              idempotent: true as const,
            };
          }
          return {
            success: false,
            message: "This payment reference could not be applied",
          };
        }
        throw insertErr;
      }

      subRow.renewalDate = newRenewalDate;
      subRow.status = SubscriptionStatus.ACTIVE;
      subRow.amountAtSubscription = billing.price;
      if (verifyData.transactionId !== undefined && !Number.isNaN(verifyData.transactionId)) {
        subRow.providerSubscriptionId = String(verifyData.transactionId);
      }
      subRow.paystackReference = reference;

      const pendingPlanId = subRow.pendingPlanId;
      const pendingBillingPlanId = subRow.pendingBillingPlanId;
      if (
        typeof pendingPlanId === "number" &&
        pendingPlanId > 0 &&
        typeof pendingBillingPlanId === "number" &&
        pendingBillingPlanId > 0
      ) {
        const pendingBilling = await queryRunner.manager.findOne(BillingPlan, {
          where: { id: pendingBillingPlanId },
        });
        if (!pendingBilling || pendingBilling.subscriptionPlanId !== pendingPlanId) {
          await queryRunner.rollbackTransaction();
          return {
            success: false,
            message: "Scheduled downgrade billing plan is no longer valid; clear pending or choose a valid plan",
          };
        }
        subRow.planId = pendingPlanId;
        subRow.billingPlanId = pendingBillingPlanId;
        subRow.amountAtSubscription = pendingBilling.price;
        subRow.pendingPlanId = null;
        subRow.pendingBillingPlanId = null;
      }

      await queryRunner.manager.save(Subscription, subRow);

      await queryRunner.commitTransaction();

      const full = await this.repository.findOne({
        where: { id: subRow.id },
        relations: ["plan", "billingPlan"],
      });

      return {
        success: true,
        message: "Subscription renewed successfully",
        subscription: full || subRow,
      };
    } catch (error: any) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      return {
        success: false,
        message: error.message || "Failed to apply renewal",
      };
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Single Paystack completion path: verify once, history idempotency, renewal vs new subscription.
   * Used by GET /paystack/callback (no assertSchoolId) and POST /confirm (assertSchoolId from session).
   */
  async processPaystackVerification(referenceInput: string, options: ProcessPaystackVerificationOptions = {}) {
    const reference = typeof referenceInput === "string" ? referenceInput.trim() : "";
    if (!reference) {
      return { success: false, message: "reference is required" };
    }

    const verify = await paystackService.verifyTransaction(reference);
    if (!verify.success || !verify.data) {
      return {
        success: false,
        message: verify.message || "Paystack verification failed",
      };
    }

    if (verify.data.status !== "success") {
      return {
        success: false,
        message: `Payment was not successful (status: ${verify.data.status})`,
      };
    }

    const canonicalRef =
      typeof verify.data.reference === "string" && verify.data.reference.trim()
        ? verify.data.reference.trim()
        : reference;

    const historyHit = await this.historyRepository.findOne({
      where: { reference: canonicalRef },
      relations: ["subscription", "subscription.plan", "subscription.billingPlan"],
    });
    if (historyHit?.subscription) {
      if (
        typeof options.assertSchoolId === "number" &&
        historyHit.subscription.schoolId !== options.assertSchoolId
      ) {
        return {
          success: false,
          message: "This payment reference is already associated with another school",
          errorCode: SCHOOL_SUBSCRIPTION_ERROR.REFERENCE_OWNED_ELSEWHERE,
        };
      }
      return {
        success: true,
        message: "Payment already recorded for this reference",
        subscription: historyHit.subscription,
        idempotent: true as const,
      };
    }

    const meta = verify.data.metadata || {};

    if (typeof options.assertSchoolId === "number") {
      const metaSchoolAssert = metadataPositiveInt(meta, "schoolId", "school_id");
      if (metaSchoolAssert === undefined || metaSchoolAssert !== options.assertSchoolId) {
        return {
          success: false,
          message: "Payment metadata does not match the current school",
        };
      }
    }

    if (metadataIntentIsRenewal(meta)) {
      const schoolId = metadataPositiveInt(meta, "schoolId", "school_id");
      const subscriptionId = metadataPositiveInt(meta, "subscriptionId", "subscription_id");
      if (schoolId === undefined || subscriptionId === undefined) {
        return {
          success: false,
          message: "Renewal transaction metadata is missing schoolId or subscriptionId",
        };
      }
      if (typeof options.assertSchoolId === "number" && schoolId !== options.assertSchoolId) {
        return {
          success: false,
          message: "Payment metadata does not match the current school",
        };
      }
      return this.applySuccessfulRenewal(schoolId, subscriptionId, verify.data);
    }

    if (metadataIntentIsUpgrade(meta)) {
      const schoolId = metadataPositiveInt(meta, "schoolId", "school_id");
      const subscriptionId = metadataPositiveInt(meta, "subscriptionId", "subscription_id");
      if (schoolId === undefined || subscriptionId === undefined) {
        return {
          success: false,
          message: "Upgrade transaction metadata is missing schoolId or subscriptionId",
        };
      }
      if (typeof options.assertSchoolId === "number" && schoolId !== options.assertSchoolId) {
        return {
          success: false,
          message: "Payment metadata does not match the current school",
        };
      }
      return this.applyPlanUpgrade(schoolId, subscriptionId, verify.data);
    }

    const schoolId = metadataPositiveInt(meta, "schoolId", "school_id");
    let planId = metadataPositiveInt(meta, "planId", "plan_id");
    let billingPlanId = metadataPositiveInt(meta, "billingPlanId", "billing_plan_id");

    if (schoolId === undefined || planId === undefined || billingPlanId === undefined) {
      return {
        success: false,
        message:
          "Transaction metadata is missing schoolId, planId, or billingPlanId. Use checkout initialized via this API.",
      };
    }

    if (typeof options.assertPlanId === "number" && planId !== options.assertPlanId) {
      return {
        success: false,
        message: "Payment metadata planId does not match the request",
      };
    }
    if (typeof options.assertBillingPlanId === "number" && billingPlanId !== options.assertBillingPlanId) {
      return {
        success: false,
        message: "Payment metadata billingPlanId does not match the request",
      };
    }

    let statusFromMeta: SubscriptionStatus | undefined;
    const rawStatus = meta["status"];
    if (typeof rawStatus === "string" && Object.values(SubscriptionStatus).includes(rawStatus as SubscriptionStatus)) {
      statusFromMeta = rawStatus as SubscriptionStatus;
    }

    const replaceRaw = meta["replaceActive"] ?? meta["replace_active"];
    const replaceActiveFromMeta =
      replaceRaw === true || replaceRaw === "true" || replaceRaw === 1 || replaceRaw === "1"
        ? true
        : replaceRaw === false || replaceRaw === "false" || replaceRaw === 0 || replaceRaw === "0"
          ? false
          : undefined;

    const startRaw = meta["startDate"] ?? meta["start_date"];
    let startDateFromMeta: Date | undefined;
    if (typeof startRaw === "string" && startRaw.trim()) {
      const d = new Date(startRaw);
      if (!Number.isNaN(d.getTime())) {
        startDateFromMeta = d;
      }
    }

    const planRepo = AppDataSource.getRepository(SubscriptionPlan);
    const billingRepo = AppDataSource.getRepository(BillingPlan);
    const plan = await planRepo.findOne({ where: { id: planId } });
    const billing = await billingRepo.findOne({ where: { id: billingPlanId } });

    if (!plan || !plan.isActive) {
      return { success: false, message: "Subscription plan not found or not active" };
    }
    if (!billing || billing.subscriptionPlanId !== plan.id) {
      return {
        success: false,
        message: "Billing plan not found or does not belong to the selected subscription plan",
      };
    }

    if (verify.data.amount !== billing.price) {
      return {
        success: false,
        message: `Paid amount does not match billing plan price (expected ${billing.price}, got ${verify.data.amount})`,
      };
    }

    const currencyExpected = (plan.currency || "NGN").toUpperCase();
    if (verify.data.currency.toUpperCase() !== currencyExpected) {
      return {
        success: false,
        message: `Currency mismatch (expected ${currencyExpected}, got ${verify.data.currency})`,
      };
    }

    if (!metadataSchoolMatches(verify.data.metadata, schoolId)) {
      return {
        success: false,
        message: "Payment metadata does not match the current school",
      };
    }

    const providerId =
      verify.data.transactionId !== undefined && !Number.isNaN(verify.data.transactionId)
        ? String(verify.data.transactionId)
        : undefined;

    const statusAfterPayment = options.status ?? statusFromMeta ?? SubscriptionStatus.ACTIVE;
    const replaceActive = options.replaceActive ?? replaceActiveFromMeta;
    const startDate = options.startDate ?? startDateFromMeta;

    return this.createForSchool(schoolId, {
      planId,
      billingPlanId,
      status: statusAfterPayment,
      ...(startDate !== undefined && { startDate }),
      ...(replaceActive !== undefined && { replaceActive }),
      paystackReference: canonicalRef,
      providerSubscriptionId: providerId,
      historyAmountPaid: verify.data.amount,
    });
  }

  /** @deprecated Use processPaystackVerification; kept for call-site clarity. */
  async confirmFromPaystackCallbackQuery(referenceOrTrxref: string) {
    return this.processPaystackVerification(
      typeof referenceOrTrxref === "string" ? referenceOrTrxref.trim() : "",
    );
  }

  async confirmWithPaystackReference(schoolId: number, input: ConfirmSchoolSubscriptionWithPaystackInput) {
    const reference = typeof input.reference === "string" ? input.reference.trim() : "";
    if (!reference) {
      return { success: false, message: "reference is required" };
    }

    const hasPlan = typeof input.planId === "number";
    const hasBilling = typeof input.billingPlanId === "number";
    if (hasPlan !== hasBilling) {
      return {
        success: false,
        message: "planId and billingPlanId must both be supplied or both omitted",
      };
    }

    return this.processPaystackVerification(reference, {
      assertSchoolId: schoolId,
      ...(typeof input.planId === "number" && { assertPlanId: input.planId }),
      ...(typeof input.billingPlanId === "number" && { assertBillingPlanId: input.billingPlanId }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.replaceActive !== undefined && { replaceActive: input.replaceActive }),
      ...(input.startDate !== undefined && { startDate: input.startDate }),
    });
  }

  async createForSchool(schoolId: number, input: CreateSchoolSubscriptionInput) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const validated = await this.validatePlanAndBilling(
        queryRunner.manager,
        input.planId,
        input.billingPlanId,
      );
      if ("error" in validated) {
        await queryRunner.rollbackTransaction();
        return { success: false, message: validated.error };
      }

      const { plan, billing } = validated;
      const startDate = input.startDate ? new Date(input.startDate) : new Date();
      const status = input.status ?? SubscriptionStatus.TRIALING;
      const renewalDate = addBillingPeriod(startDate, billing.period);

      if (status === SubscriptionStatus.ACTIVE) {
        const existingActive = await queryRunner.manager.findOne(Subscription, {
          where: { schoolId, status: SubscriptionStatus.ACTIVE },
        });

        if (existingActive) {
          if (!input.replaceActive) {
            await queryRunner.rollbackTransaction();
            return {
              success: false,
              message:
                "School already has an active subscription. Set replaceActive to true to end it and create a new one.",
              errorCode: SCHOOL_SUBSCRIPTION_ERROR.ACTIVE_EXISTS,
            };
          }

          const now = new Date();
          existingActive.status = SubscriptionStatus.CANCELED;
          existingActive.isCancelled = true;
          existingActive.cancelledAt = now;
          existingActive.endDate = now;
          await queryRunner.manager.save(Subscription, existingActive);
        }
      }

      const row = queryRunner.manager.create(Subscription, {
        schoolId,
        planId: plan.id,
        billingPlanId: billing.id,
        status,
        startDate,
        renewalDate,
        amountAtSubscription: billing.price,
        isCancelled: false,
        providerSubscriptionId: input.providerSubscriptionId,
        paystackReference: input.paystackReference ?? null,
      });

      const saved = await queryRunner.manager.save(row);

      const history = queryRunner.manager.create(SubscriptionHistory, {
        subscriptionId: saved.id,
        ...(typeof input.paystackReference === "string" && input.paystackReference.trim()
          ? { reference: input.paystackReference.trim() }
          : {}),
        paymentDate: startDate,
        amountPaid: typeof input.historyAmountPaid === "number" ? input.historyAmountPaid : billing.price,
        status,
        schoolId,
      });
      try {
        await queryRunner.manager.save(SubscriptionHistory, history);
      } catch (historyErr: unknown) {
        if (isDatabaseUniqueViolation(historyErr)) {
          await queryRunner.rollbackTransaction();
          const ref = typeof input.paystackReference === "string" ? input.paystackReference.trim() : "";
          if (ref) {
            const h2 = await this.historyRepository.findOne({
              where: { reference: ref },
              relations: ["subscription", "subscription.plan", "subscription.billingPlan"],
            });
            if (h2?.subscription?.schoolId === schoolId) {
              return {
                success: true,
                message: "Subscription already recorded for this reference",
                subscription: h2.subscription,
                idempotent: true as const,
              };
            }
          }
        }
        throw historyErr;
      }

      await queryRunner.commitTransaction();

      const full = await this.repository.findOne({
        where: { id: saved.id },
        relations: ["plan", "billingPlan"],
      });

      return {
        success: true,
        message: "Subscription created successfully",
        subscription: full || saved,
      };
    } catch (error: any) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      return {
        success: false,
        message: error.message || "Failed to create subscription",
      };
    } finally {
      await queryRunner.release();
    }
  }

  async updateForSchool(schoolId: number, id: number, input: UpdateSchoolSubscriptionInput) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const subscription = await queryRunner.manager.findOne(Subscription, {
        where: { id, schoolId },
        relations: ["plan", "billingPlan"],
      });

      if (!subscription) {
        await queryRunner.rollbackTransaction();
        return { success: false, message: "Subscription not found" };
      }

      const prevPlanId = subscription.planId;
      const prevBillingId = subscription.billingPlanId;

      let nextPlanId = input.planId ?? subscription.planId;
      let nextBillingId = input.billingPlanId ?? subscription.billingPlanId;

      if (
        (input.planId !== undefined || input.billingPlanId !== undefined) &&
        (input.planId === undefined || input.billingPlanId === undefined)
      ) {
        await queryRunner.rollbackTransaction();
        return {
          success: false,
          message: "planId and billingPlanId must both be provided to change plan",
        };
      }

      if (nextPlanId !== subscription.planId || nextBillingId !== subscription.billingPlanId) {
        const validated = await this.validatePlanAndBilling(
          queryRunner.manager,
          nextPlanId,
          nextBillingId,
        );
        if ("error" in validated) {
          await queryRunner.rollbackTransaction();
          return { success: false, message: validated.error };
        }

        subscription.planId = validated.plan.id;
        subscription.billingPlanId = validated.billing.id;
        subscription.amountAtSubscription = validated.billing.price;
        subscription.renewalDate = addBillingPeriod(subscription.startDate, validated.billing.period);

        const history = queryRunner.manager.create(SubscriptionHistory, {
          subscriptionId: subscription.id,
          previousPlanId: prevPlanId,
          previousBillingPlanId: prevBillingId,
          paymentDate: new Date(),
          amountPaid: validated.billing.price,
          status: subscription.status,
          schoolId,
        });
        await queryRunner.manager.save(SubscriptionHistory, history);
      }

      const nextStatus = input.status ?? subscription.status;
      if (nextStatus === SubscriptionStatus.ACTIVE && subscription.status !== SubscriptionStatus.ACTIVE) {
        const other = await queryRunner.manager.findOne(Subscription, {
          where: {
            schoolId,
            status: SubscriptionStatus.ACTIVE,
            id: Not(subscription.id),
          },
        });
        if (other) {
          await queryRunner.rollbackTransaction();
          return {
            success: false,
            message: "Another active subscription exists for this school",
            errorCode: SCHOOL_SUBSCRIPTION_ERROR.ACTIVE_EXISTS,
          };
        }
      }

      if (input.status !== undefined) {
        subscription.status = input.status;
      }
      if (typeof input.isCancelled === "boolean") {
        subscription.isCancelled = input.isCancelled;
      }
      if (input.cancelledAt !== undefined) {
        subscription.cancelledAt = input.cancelledAt === null ? undefined : input.cancelledAt;
      }
      if (input.endDate !== undefined) {
        subscription.endDate = input.endDate === null ? undefined : input.endDate;
      }
      if (input.providerSubscriptionId !== undefined) {
        subscription.providerSubscriptionId =
          input.providerSubscriptionId === null ? undefined : input.providerSubscriptionId;
      }

      if (input.status === SubscriptionStatus.CANCELED || input.isCancelled === true) {
        subscription.status = SubscriptionStatus.CANCELED;
        subscription.isCancelled = true;
        if (!subscription.cancelledAt) {
          subscription.cancelledAt = new Date();
        }
        if (!subscription.endDate) {
          subscription.endDate = subscription.cancelledAt;
        }
      }

      await queryRunner.manager.save(Subscription, subscription);
      await queryRunner.commitTransaction();

      const full = await this.repository.findOne({
        where: { id: subscription.id },
        relations: ["plan", "billingPlan"],
      });

      return {
        success: true,
        message: "Subscription updated successfully",
        subscription: full || subscription,
      };
    } catch (error: any) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      return {
        success: false,
        message: error.message || "Failed to update subscription",
      };
    } finally {
      await queryRunner.release();
    }
  }

  async deleteForSchool(schoolId: number, id: number) {
    const subscription = await this.repository.findOne({
      where: { id, schoolId },
    });

    if (!subscription) {
      return { success: false, message: "Subscription not found" };
    }

    if (subscription.status !== SubscriptionStatus.CANCELED) {
      return {
        success: false,
        message: "Only canceled subscriptions can be deleted",
        errorCode: SCHOOL_SUBSCRIPTION_ERROR.NOT_CANCELED,
      };
    }

    await this.repository.remove(subscription);

    return {
      success: true,
      message: "Subscription deleted successfully",
    };
  }
}

export const schoolSubscriptionService = new SchoolSubscriptionService();
