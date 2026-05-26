/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiMethods } from "@/utils/client";

// ========================
// Classroom ROOT
// ========================
const subscriptionRoot = "/api/v1/subscriptions";



// ========================
// CONFIG: Endpoints & Methods
// ========================
const subscriptionEndpoints = {
    getAllPlans: { path: `${subscriptionRoot}/billing-plans`, method: ApiMethods.GET },
    subscribePlan: { path: `${subscriptionRoot}/initialize-checkout`, method: ApiMethods.POST },
    getSubscriptions: { path: `${subscriptionRoot}`, method: ApiMethods.GET },
    planUpgrade: {
        path: `${subscriptionRoot}/upgrade-checkout`,
        method: ApiMethods.POST,
    },
};

// Dynamic endpoints (require ClassroomId)
export const subscriptionDynamicEndpoints = {
    renewPlan: (planId: string | number) => ({
        path: `${subscriptionRoot}/${planId}/renew-checkout`,
        method: ApiMethods.POST,
    }),
    upgradeSummary: (subscriptionId: string | number) => ({
        path: `${subscriptionRoot}/${subscriptionId}/upgrade-summary`,
        method: ApiMethods.GET,
    }),
};

// ========================
// SERVICE GENERATOR
// ========================
type ServiceInterface = {
    path: string;
    method: ApiMethods;
};

function generateServices<T extends Record<string, { path: string; method: ApiMethods }>>(
    endpoints: T,
) {
    const services: Record<keyof T, ServiceInterface> = {} as any;
    for (const key in endpoints) {
        services[key] = {
            path: endpoints[key].path,
            method: endpoints[key].method,
        };
    }
    return services;
}

// ========================
// EXPORTS
// ========================
export const subscriptionServices = generateServices(subscriptionEndpoints);
