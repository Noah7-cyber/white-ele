/* eslint-disable @typescript-eslint/no-explicit-any */
import { data } from "@/constants";
import { subscriptionServices } from "@/services/subscription.service";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { useState } from "react";

export function usePlans() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const { data: { billingPlans = [] } = {} as any, isLoading } = useQueryService({
    service: {
      ...subscriptionServices.getAllPlans,
      data: {
        ...(billingCycle ? { billingPlan: billingCycle } : {}),
      },
    },
  });

  const {
    data: { subscriptions = [] } = {} as any,
    isLoading: isLoadingSubscription,
    refetch: refetchSubscription,
  } = useQueryService({
    service: subscriptionServices.getSubscriptions,
  });

  const {
    data: { subscriptions: currentSubscriptions = [] } = {} as any,
    refetch: refetchCurrentSubscription,
  } = useQueryService({
    service: {
      ...subscriptionServices.getSubscriptions,
      data: {
        status: 'active'
      },
    },
  });

  const activeSubscription = currentSubscriptions?.[0] || {}

  return {
    billingPlans,
    isLoading,
    billingCycle,
    setBillingCycle,
    subscriptions,
    isLoadingSubscription,
    activeSubscription,
    refetchSubscription,
    refetchCurrentSubscription
  };
}
