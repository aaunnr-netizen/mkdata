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
  apiDPlanId?: number | null;
  apiDNetworkId?: number | null;
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

  if (plan.apiSource === "API_D") {
    return {
      planId: plan.apiDPlanId ?? plan.externalPlanId,
      networkId: plan.apiDNetworkId ?? plan.externalNetworkId,
    };
  }

  return {
    planId: plan.apiCPlanId ?? plan.externalPlanId,
    networkId: plan.apiCNetworkId ?? plan.externalNetworkId,
  };
}

export function getExternalIdsForSource(data: {
  apiSource: ApiSource | "API_A" | "API_B" | "API_C" | "API_D";
  apiAPlanId?: number | null;
  apiANetworkId?: number | null;
  apiBPlanId?: number | null;
  apiBNetworkId?: number | null;
  apiCPlanId?: number | null;
  apiCNetworkId?: number | null;
  apiDPlanId?: number | null;
  apiDNetworkId?: number | null;
}) {
  if (data.apiSource === "API_A") {
    return { externalPlanId: data.apiAPlanId, externalNetworkId: data.apiANetworkId };
  }
  if (data.apiSource === "API_B") {
    return { externalPlanId: data.apiBPlanId, externalNetworkId: data.apiBNetworkId };
  }
  if (data.apiSource === "API_C") {
    return { externalPlanId: data.apiCPlanId, externalNetworkId: data.apiCNetworkId };
  }
  return { externalPlanId: data.apiDPlanId, externalNetworkId: data.apiDNetworkId };
}
