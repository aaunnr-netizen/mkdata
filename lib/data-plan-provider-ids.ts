import type { ApiSource } from "@prisma/client";

type DataPlanProviderIds = {
  apiSource: ApiSource;
  externalPlanId: number;
  externalNetworkId: number;
  apiAPlanId?: number | null;
  apiANetworkId?: number | null;
  apiBPlanId?: number | null;
  apiBNetworkId?: number | null;
  apiCPlanId?: number | null;
  apiCNetworkId?: number | null;
};

export function getDataPlanProviderIds(plan: DataPlanProviderIds) {
  if (plan.apiSource === "API_A") {
    return {
      planId: plan.apiAPlanId ?? plan.externalPlanId,
      networkId: plan.apiANetworkId ?? plan.externalNetworkId,
    };
  }

  if (plan.apiSource === "API_B") {
    return {
      planId: plan.apiBPlanId ?? plan.externalPlanId,
      networkId: plan.apiBNetworkId ?? plan.externalNetworkId,
    };
  }

  return {
    planId: plan.apiCPlanId ?? plan.externalPlanId,
    networkId: plan.apiCNetworkId ?? plan.externalNetworkId,
  };
}

export function getExternalIdsForSource(data: {
  apiSource: ApiSource | "API_A" | "API_B" | "API_C";
  apiAPlanId?: number | null;
  apiANetworkId?: number | null;
  apiBPlanId?: number | null;
  apiBNetworkId?: number | null;
  apiCPlanId?: number | null;
  apiCNetworkId?: number | null;
}) {
  if (data.apiSource === "API_A") {
    return { externalPlanId: data.apiAPlanId, externalNetworkId: data.apiANetworkId };
  }
  if (data.apiSource === "API_B") {
    return { externalPlanId: data.apiBPlanId, externalNetworkId: data.apiBNetworkId };
  }
  return { externalPlanId: data.apiCPlanId, externalNetworkId: data.apiCNetworkId };
}
