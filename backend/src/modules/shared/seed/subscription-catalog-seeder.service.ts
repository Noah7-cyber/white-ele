import { AppDataSource } from "../../core/config/database";
import { BillingPlanPeriod } from "../entities/EntityEnums";
import { BillingPlan } from "../entities/BillingPlan";
import { SubscriptionFeature } from "../entities/SubscriptionFeature";
import { SubscriptionPlan } from "../entities/SubscriptionPlan";
import { SubscriptionPlanFeature } from "../entities/SubscriptionPlanFeature";
import { logger } from "../utils/logger";

type PlanKey = "organize" | "grow" | "scale";

/** NGN amounts in kobo (smallest unit). Scale monthly row is placeholder when plan is custom-priced. */
const PLAN_CATALOG: Array<{
  key: PlanKey;
  name: string;
  description: string;
  isCustom: boolean;
  /** Monthly price in kobo; Scale uses 0 as placeholder alongside isCustom. */
  monthlyPriceKobo: number;
}> = [
  { key: "organize", name: "organize", description: "Organize", isCustom: false, monthlyPriceKobo: 1_999_900 },
  { key: "grow", name: "grow", description: "Grow", isCustom: false, monthlyPriceKobo: 4_999_900 },
  { key: "scale", name: "scale", description: "Scale", isCustom: true, monthlyPriceKobo: 0 },
];

const FEATURE_CATALOG: Array<{ code: string; name: string; description?: string }> = [
  { code: "children_limit", name: "Children capacity", description: "Maximum children allowed on the plan (unlimited when not set)." },
  { code: "child_profiles_basic_reports", name: "Child profiles & basic reports" },
  { code: "attendance_daily_summary", name: "Attendance tracking & daily summary" },
  { code: "parent_alerts_guardian_management", name: "Parent alerts & guardian management" },
  { code: "basic_invoicing_parent_communication", name: "Basic invoicing & parent communication" },
  { code: "email_support", name: "Email support" },
  { code: "admissions_portal_tour_booking_waitlist", name: "Admissions portal, tour booking & waitlist" },
  { code: "whatsapp_reminders_automated_followups", name: "WhatsApp reminders & automated follow-ups" },
  { code: "fee_collection_online_payments_paystack", name: "Fee collection & online payments (Paystack)" },
  { code: "automated_payment_reminders_debt_tracking", name: "Automated payment reminders & debt tracking" },
  { code: "part_payments_receipts_auto_invoicing", name: "Part payments, receipts & auto-invoicing" },
  { code: "parent_portal_report_cards_messaging", name: "Parent portal, report cards & messaging" },
  { code: "photo_video_sharing", name: "Photo & video sharing" },
  { code: "staff_profiles_time_tracking_scheduling", name: "Staff profiles, time tracking & scheduling" },
  { code: "curriculum_lesson_plans_milestone_tracking", name: "Curriculum, lesson plans & milestone tracking" },
  { code: "teacher_notes_daily_report_cards", name: "Teacher notes & daily report cards" },
  { code: "reports_analytics_compliance_docs", name: "Reports, analytics & compliance docs" },
  { code: "real_time_income_tracking", name: "Real-time income tracking" },
  { code: "custom_branding_priority_support", name: "Custom branding & priority support" },
  { code: "multi_location_management", name: "Multi-location management" },
  { code: "api_access_custom_integrations", name: "API access & custom integrations" },
  { code: "dedicated_account_manager_phone_support", name: "Dedicated account manager & phone support" },
  { code: "sla_guarantee", name: "SLA guarantee" },
];

const TIER2_CODES = [
  "whatsapp_reminders_automated_followups",
  "fee_collection_online_payments_paystack",
  "automated_payment_reminders_debt_tracking",
  "part_payments_receipts_auto_invoicing",
  "parent_portal_report_cards_messaging",
  "photo_video_sharing",
  "staff_profiles_time_tracking_scheduling",
  "curriculum_lesson_plans_milestone_tracking",
] as const;

const TIER3_GROW_CODES = [
  "teacher_notes_daily_report_cards",
  "reports_analytics_compliance_docs",
  "real_time_income_tracking",
  "custom_branding_priority_support",
] as const;

const TIER3_SCALE_ONLY_CODES = [
  "multi_location_management",
  "api_access_custom_integrations",
  "dedicated_account_manager_phone_support",
  "sla_guarantee",
] as const;

function isEnabledForPlan(planKey: PlanKey, featureCode: string): boolean {
  if (featureCode === "children_limit") {
    return true;
  }

  const tier1Always = [
    "child_profiles_basic_reports",
    "attendance_daily_summary",
    "parent_alerts_guardian_management",
    "basic_invoicing_parent_communication",
    "email_support",
  ];
  if (tier1Always.includes(featureCode)) {
    return true;
  }

  if (featureCode === "admissions_portal_tour_booking_waitlist") {
    return planKey === "grow" || planKey === "scale";
  }

  if ((TIER2_CODES as readonly string[]).includes(featureCode)) {
    return planKey === "grow" || planKey === "scale";
  }

  if ((TIER3_GROW_CODES as readonly string[]).includes(featureCode)) {
    return planKey === "grow" || planKey === "scale";
  }

  if ((TIER3_SCALE_ONLY_CODES as readonly string[]).includes(featureCode)) {
    return planKey === "scale";
  }

  return false;
}

function limitValueForPlan(planKey: PlanKey, featureCode: string): number | null {
  if (featureCode !== "children_limit") {
    return null;
  }
  if (planKey === "organize") {
    return 30;
  }
  if (planKey === "grow") {
    return 150;
  }
  return null;
}

class SubscriptionCatalogSeederService {
  async syncCatalog(): Promise<void> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const featureRepo = queryRunner.manager.getRepository(SubscriptionFeature);
      const planRepo = queryRunner.manager.getRepository(SubscriptionPlan);
      const billingRepo = queryRunner.manager.getRepository(BillingPlan);
      const planFeatureRepo = queryRunner.manager.getRepository(SubscriptionPlanFeature);

      const featureByCode = new Map<string, SubscriptionFeature>();

      for (const def of FEATURE_CATALOG) {
        let row = await featureRepo.findOne({ where: { code: def.code } });
        if (!row) {
          row = featureRepo.create({
            code: def.code,
            name: def.name,
            description: def.description,
          });
        } else {
          row.name = def.name;
          row.description = def.description;
        }
        await featureRepo.save(row);
        featureByCode.set(def.code, row);
      }

      const planByKey = new Map<PlanKey, SubscriptionPlan>();

      for (const def of PLAN_CATALOG) {
        let row = await planRepo.findOne({ where: { name: def.name } });
        if (!row) {
          row = planRepo.create({
            name: def.name,
            description: def.description,
            currency: "NGN",
            isCustom: def.isCustom,
            isActive: true,
          });
        } else {
          row.description = def.description;
          row.currency = "NGN";
          row.isCustom = def.isCustom;
          row.isActive = true;
        }
        await planRepo.save(row);
        planByKey.set(def.key, row);
      }

      for (const def of PLAN_CATALOG) {
        const plan = planByKey.get(def.key)!;
        let billing = await billingRepo.findOne({
          where: {
            subscriptionPlanId: plan.id,
            period: BillingPlanPeriod.MONTHLY,
          },
        });
        if (!billing) {
          billing = billingRepo.create({
            subscriptionPlanId: plan.id,
            period: BillingPlanPeriod.MONTHLY,
            price: def.monthlyPriceKobo,
          });
        } else {
          billing.price = def.monthlyPriceKobo;
        }
        await billingRepo.save(billing);
      }

      for (const planDef of PLAN_CATALOG) {
        const plan = planByKey.get(planDef.key)!;
        for (const featureDef of FEATURE_CATALOG) {
          const feature = featureByCode.get(featureDef.code)!;
          const enabled = isEnabledForPlan(planDef.key, featureDef.code);
          const limitVal: number | null = enabled ? limitValueForPlan(planDef.key, featureDef.code) : null;

          let link = await planFeatureRepo.findOne({
            where: { planId: plan.id, featureId: feature.id },
          });
          if (!link) {
            link = planFeatureRepo.create({
              planId: plan.id,
              featureId: feature.id,
              isEnabled: enabled,
              limitValue: limitVal,
            });
          } else {
            link.isEnabled = enabled;
            link.limitValue = limitVal;
          }
          await planFeatureRepo.save(link);
        }
      }

      await queryRunner.commitTransaction();
      logger.info(
        `Subscription catalog synced: ${FEATURE_CATALOG.length} features, ${PLAN_CATALOG.length} plans, billing + plan-feature matrix.`,
      );
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}

export const subscriptionCatalogSeederService = new SubscriptionCatalogSeederService();
