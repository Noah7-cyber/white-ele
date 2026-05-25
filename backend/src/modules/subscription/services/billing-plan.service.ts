import { Repository } from "typeorm";
import { AppDataSource } from "../../core";
import { BillingPlan } from "../../shared/entities/BillingPlan";
import { SubscriptionPlan } from "../../shared/entities/SubscriptionPlan";
import { BillingPlanPeriod } from "../../shared/entities/EntityEnums";

export interface CreateBillingPlanData {
  subscriptionPlanId: number;
  period: BillingPlanPeriod;
  price: number;
}

export interface UpdateBillingPlanData {
  subscriptionPlanId?: number;
  period?: BillingPlanPeriod;
  price?: number;
}

class BillingPlanService {
  private get billingPlanRepository(): Repository<BillingPlan> {
    return AppDataSource.getRepository(BillingPlan);
  }

  private get subscriptionPlanRepository(): Repository<SubscriptionPlan> {
    return AppDataSource.getRepository(SubscriptionPlan);
  }

  async createBillingPlan(data: CreateBillingPlanData) {
    const plan = await this.subscriptionPlanRepository.findOne({
      where: { id: data.subscriptionPlanId },
    });

    if (!plan) {
      return {
        success: false,
        message: "Subscription plan not found",
      };
    }

    const existing = await this.billingPlanRepository.findOne({
      where: {
        subscriptionPlanId: data.subscriptionPlanId,
        period: data.period,
      },
    });

    if (existing) {
      return {
        success: false,
        message: "Billing plan with this period already exists for the subscription plan",
      };
    }

    const billingPlan = this.billingPlanRepository.create({
      subscriptionPlanId: data.subscriptionPlanId,
      period: data.period,
      price: data.price,
    });

    const saved = await this.billingPlanRepository.save(billingPlan);

    return {
      success: true,
      message: "Billing plan created successfully",
      billingPlan: saved,
    };
  }

  async getBillingPlans(filters: {
    subscriptionPlanId?: number;
    period?: BillingPlanPeriod;
    pos?: number;
    delta?: number;
  }) {
    const {
      subscriptionPlanId,
      period,
      pos = 0,
      delta = 20,
    } = filters;

    const query = this.billingPlanRepository
      .createQueryBuilder("billingPlan")
      .leftJoinAndSelect("billingPlan.subscriptionPlan", "subscriptionPlan")
      .leftJoinAndSelect("subscriptionPlan.features", "planFeatures")
      .leftJoinAndSelect("planFeatures.feature", "feature")
      .orderBy("billingPlan.createdAt", "DESC")
      .skip(pos)
      .take(delta);

    if (subscriptionPlanId) {
      query.andWhere("billingPlan.subscriptionPlanId = :subscriptionPlanId", {
        subscriptionPlanId,
      });
    }

    if (period) {
      query.andWhere("billingPlan.period = :period", { period });
    }

    const [billingPlans, count] = await query.getManyAndCount();

    return {
      success: true,
      message: "Billing plans retrieved successfully",
      billingPlans,
      pagination: {
        pos,
        delta,
        count,
      },
    };
  }

  async getBillingPlanById(id: number) {
    const billingPlan = await this.billingPlanRepository.findOne({
      where: { id },
      relations: ["subscriptionPlan", "subscriptionPlan.features", "subscriptionPlan.features.feature"],
    });

    if (!billingPlan) {
      return {
        success: false,
        message: "Billing plan not found",
      };
    }

    return {
      success: true,
      message: "Billing plan retrieved successfully",
      billingPlan,
    };
  }

  async updateBillingPlan(id: number, data: UpdateBillingPlanData) {
    const billingPlan = await this.billingPlanRepository.findOne({
      where: { id },
    });

    if (!billingPlan) {
      return {
        success: false,
        message: "Billing plan not found",
      };
    }

    const nextSubscriptionPlanId = data.subscriptionPlanId ?? billingPlan.subscriptionPlanId;
    const nextPeriod = data.period ?? billingPlan.period;

    if (data.subscriptionPlanId) {
      const plan = await this.subscriptionPlanRepository.findOne({
        where: { id: data.subscriptionPlanId },
      });

      if (!plan) {
        return {
          success: false,
          message: "Subscription plan not found",
        };
      }
    }

    const duplicate = await this.billingPlanRepository.findOne({
      where: {
        subscriptionPlanId: nextSubscriptionPlanId,
        period: nextPeriod,
      },
    });

    if (duplicate && duplicate.id !== id) {
      return {
        success: false,
        message: "Billing plan with this period already exists for the subscription plan",
      };
    }

    billingPlan.subscriptionPlanId = nextSubscriptionPlanId;
    billingPlan.period = nextPeriod;
    if (typeof data.price === "number") {
      billingPlan.price = data.price;
    }

    const updated = await this.billingPlanRepository.save(billingPlan);

    return {
      success: true,
      message: "Billing plan updated successfully",
      billingPlan: updated,
    };
  }

  async deleteBillingPlan(id: number) {
    const billingPlan = await this.billingPlanRepository.findOne({
      where: { id },
    });

    if (!billingPlan) {
      return {
        success: false,
        message: "Billing plan not found",
      };
    }

    await this.billingPlanRepository.remove(billingPlan);

    return {
      success: true,
      message: "Billing plan deleted successfully",
    };
  }
}

export const billingPlanService = new BillingPlanService();
