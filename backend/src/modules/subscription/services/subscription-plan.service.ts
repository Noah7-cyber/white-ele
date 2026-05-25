import { In, Repository } from "typeorm";
import { AppDataSource } from "../../core";
import { SubscriptionPlan } from "../../shared/entities/SubscriptionPlan";
import { BillingPlan } from "../../shared/entities/BillingPlan";
import { SubscriptionFeature } from "../../shared/entities/SubscriptionFeature";
import { SubscriptionPlanFeature } from "../../shared/entities/SubscriptionPlanFeature";
import { BillingPlanPeriod } from "../../shared/entities/EntityEnums";

export interface CreateSubscriptionPlanPlanFeatureInput {
  code: string;
  isEnabled: boolean;
  limitValue?: number | null;
}

export interface CreateSubscriptionPlanData {
  name: string;
  description: string;
  currency?: string;
  isCustom?: boolean;
  isActive?: boolean;
  billingPlans: Array<{
    period: BillingPlanPeriod;
    price: number;
  }>;
  planFeatures: CreateSubscriptionPlanPlanFeatureInput[];
}

export interface UpdateSubscriptionPlanData {
  name?: string;
  description?: string;
  currency?: string;
  isCustom?: boolean;
  isActive?: boolean;
}

class SubscriptionPlanService {
  private get subscriptionPlanRepository(): Repository<SubscriptionPlan> {
    return AppDataSource.getRepository(SubscriptionPlan);
  }

  async createSubscriptionPlan(data: CreateSubscriptionPlanData) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existing = await queryRunner.manager.findOne(SubscriptionPlan, {
        where: { name: data.name },
      });

      if (existing) {
        await queryRunner.rollbackTransaction();
        return {
          success: false,
          message: "Subscription plan with this name already exists",
        };
      }

      if (!Array.isArray(data.billingPlans) || data.billingPlans.length === 0) {
        await queryRunner.rollbackTransaction();
        return {
          success: false,
          message: "billingPlans is required and must be a non-empty array",
        };
      }

      if (!Array.isArray(data.planFeatures) || data.planFeatures.length === 0) {
        await queryRunner.rollbackTransaction();
        return {
          success: false,
          message: "planFeatures is required and must be a non-empty array",
        };
      }

      const subscriptionPlan = queryRunner.manager.create(SubscriptionPlan, {
        name: data.name,
        description: data.description,
        currency: data.currency || "NGN",
        isCustom: typeof data.isCustom === "boolean" ? data.isCustom : false,
        isActive: typeof data.isActive === "boolean" ? data.isActive : true,
      });

      const savedPlan = await queryRunner.manager.save(subscriptionPlan);

      const seenPeriods = new Set<string>();
      for (const item of data.billingPlans) {
        if (seenPeriods.has(item.period)) {
          await queryRunner.rollbackTransaction();
          return {
            success: false,
            message: `Duplicate billing plan period provided: ${item.period}`,
          };
        }
        seenPeriods.add(item.period);
      }

      const billingPlanEntities = data.billingPlans.map((item) =>
        queryRunner.manager.create(BillingPlan, {
          subscriptionPlanId: savedPlan.id,
          period: item.period,
          price: item.price,
        }),
      );
      await queryRunner.manager.save(BillingPlan, billingPlanEntities);

      const seenCodes = new Set<string>();
      for (const item of data.planFeatures) {
        if (seenCodes.has(item.code)) {
          await queryRunner.rollbackTransaction();
          return {
            success: false,
            message: `Duplicate planFeatures code provided: ${item.code}`,
          };
        }
        seenCodes.add(item.code);
      }

      const codes = data.planFeatures.map((p) => p.code);
      const catalogRows = await queryRunner.manager.find(SubscriptionFeature, {
        where: { code: In(codes) },
      });
      const byCode = new Map(catalogRows.map((f) => [f.code, f]));
      const missing = codes.filter((c) => !byCode.has(c));
      if (missing.length > 0) {
        await queryRunner.rollbackTransaction();
        return {
          success: false,
          message: `Unknown feature code(s): ${missing.join(", ")}`,
        };
      }

      const planFeatureRows = data.planFeatures.map((item) =>
        queryRunner.manager.create(SubscriptionPlanFeature, {
          planId: savedPlan.id,
          featureId: byCode.get(item.code)!.id,
          isEnabled: item.isEnabled,
          limitValue:
            item.limitValue === undefined || item.limitValue === null ? null : item.limitValue,
        }),
      );
      await queryRunner.manager.save(SubscriptionPlanFeature, planFeatureRows);

      const fullPlan = await queryRunner.manager.findOne(SubscriptionPlan, {
        where: { id: savedPlan.id },
        relations: ["billingPlans", "features", "features.feature"],
      });

      await queryRunner.commitTransaction();

      return {
        success: true,
        message: "Subscription plan created successfully",
        subscriptionPlan: fullPlan || savedPlan,
      };
    } catch (error: any) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      return {
        success: false,
        message: error.message || "Failed to create subscription plan",
      };
    } finally {
      await queryRunner.release();
    }
  }

  async getSubscriptionPlans(filters: {
    isActive?: boolean;
    isCustom?: boolean;
    billingPeriod?: BillingPlanPeriod;
    pos?: number;
    delta?: number;
  }) {
    const { isActive, isCustom, billingPeriod, pos = 0, delta = 20 } = filters;

    const query = this.subscriptionPlanRepository
      .createQueryBuilder("subscriptionPlan")
      .distinct(true)
      .leftJoinAndSelect("subscriptionPlan.billingPlans", "billingPlans")
      .leftJoinAndSelect("subscriptionPlan.features", "planFeatures")
      .leftJoinAndSelect("planFeatures.feature", "feature")
      .orderBy("subscriptionPlan.createdAt", "DESC")
      .skip(pos)
      .take(delta);

    if (typeof isActive === "boolean") {
      query.andWhere("subscriptionPlan.isActive = :isActive", { isActive });
    }

    if (typeof isCustom === "boolean") {
      query.andWhere("subscriptionPlan.isCustom = :isCustom", { isCustom });
    }

    if (typeof billingPeriod !== "undefined") {
      // Filter to plans that have at least one billing plan for the requested period
      query.innerJoin("subscriptionPlan.billingPlans", "billingPlan");
      query.andWhere("billingPlan.period = :billingPeriod", { billingPeriod });
    }

    const [subscriptionPlans, count] = await query.getManyAndCount();

    return {
      success: true,
      message: "Subscription plans retrieved successfully",
      subscriptionPlans,
      pagination: {
        pos,
        delta,
        count,
      },
    };
  }

  async getSubscriptionPlanById(id: number) {
    const subscriptionPlan = await this.subscriptionPlanRepository.findOne({
      where: { id },
      relations: ["billingPlans", "features", "features.feature"],
    });

    if (!subscriptionPlan) {
      return {
        success: false,
        message: "Subscription plan not found",
      };
    }

    return {
      success: true,
      message: "Subscription plan retrieved successfully",
      subscriptionPlan,
    };
  }

  async updateSubscriptionPlan(id: number, data: UpdateSubscriptionPlanData) {
    const subscriptionPlan = await this.subscriptionPlanRepository.findOne({
      where: { id },
    });

    if (!subscriptionPlan) {
      return {
        success: false,
        message: "Subscription plan not found",
      };
    }

    if (data.name && data.name !== subscriptionPlan.name) {
      const existing = await this.subscriptionPlanRepository.findOne({
        where: { name: data.name },
      });

      if (existing && existing.id !== id) {
        return {
          success: false,
          message: "Subscription plan with this name already exists",
        };
      }
    }

    if (typeof data.name === "string") subscriptionPlan.name = data.name;
    if (typeof data.description === "string") subscriptionPlan.description = data.description;
    if (typeof data.currency === "string") subscriptionPlan.currency = data.currency;
    if (typeof data.isCustom === "boolean") subscriptionPlan.isCustom = data.isCustom;
    if (typeof data.isActive === "boolean") subscriptionPlan.isActive = data.isActive;

    const updated = await this.subscriptionPlanRepository.save(subscriptionPlan);

    return {
      success: true,
      message: "Subscription plan updated successfully",
      subscriptionPlan: updated,
    };
  }

  async deleteSubscriptionPlan(id: number) {
    const subscriptionPlan = await this.subscriptionPlanRepository.findOne({
      where: { id },
    });

    if (!subscriptionPlan) {
      return {
        success: false,
        message: "Subscription plan not found",
      };
    }

    await this.subscriptionPlanRepository.remove(subscriptionPlan);

    return {
      success: true,
      message: "Subscription plan deleted successfully",
    };
  }
}

export const subscriptionPlanService = new SubscriptionPlanService();
