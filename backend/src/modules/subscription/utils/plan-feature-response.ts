type FeatureLike = {
  id?: number;
  code?: string;
  name?: string;
  description?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

type PlanFeatureLike = {
  id?: number;
  planId?: number;
  featureId?: number;
  isEnabled?: boolean;
  limitValue?: number | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  feature?: FeatureLike | null;
};

type PlanLike = {
  features?: PlanFeatureLike[];
};

type BillingPlanLike = {
  subscriptionPlan?: PlanLike | null;
};

function flattenPlanFeature(featureRow: PlanFeatureLike): PlanFeatureLike & FeatureLike {
  const { feature, ...featureRowWithoutNestedFeature } = featureRow;
  const flattenedFeature = feature ?? {};
  return {
    ...featureRowWithoutNestedFeature,
    id: featureRow.id,
    planId: featureRow.planId,
    featureId: featureRow.featureId,
    isEnabled: featureRow.isEnabled,
    limitValue: featureRow.limitValue,
    createdAt: featureRow.createdAt,
    updatedAt: featureRow.updatedAt,
    code: flattenedFeature.code,
    name: flattenedFeature.name,
    description: flattenedFeature.description,
  };
}

export function flattenPlanFeatures(plan?: PlanLike | null): PlanLike | null | undefined {
  if (!plan) return plan;
  const features = Array.isArray(plan.features) ? plan.features.map(flattenPlanFeature) : plan.features;
  return {
    ...plan,
    features,
  };
}

export function flattenSubscriptionPlanPayload<T extends PlanLike>(plan?: T | null): T | null | undefined {
  const flattened = flattenPlanFeatures(plan);
  return flattened as T | null | undefined;
}

export function flattenSubscriptionPlansPayload<T extends PlanLike>(plans?: T[]): T[] | undefined {
  if (!Array.isArray(plans)) return plans;
  return plans.map((plan) => flattenSubscriptionPlanPayload(plan) as T);
}

export function flattenBillingPlansPayload<T extends BillingPlanLike>(billingPlans?: T[]): T[] | undefined {
  if (!Array.isArray(billingPlans)) return billingPlans;
  return billingPlans.map((billingPlan) => ({
    ...billingPlan,
    subscriptionPlan: flattenSubscriptionPlanPayload(billingPlan.subscriptionPlan),
  }));
}

export function flattenBillingPlanPayload<T extends BillingPlanLike>(billingPlan?: T | null): T | null | undefined {
  if (!billingPlan) return billingPlan;
  return {
    ...billingPlan,
    subscriptionPlan: flattenSubscriptionPlanPayload(billingPlan.subscriptionPlan),
  };
}
