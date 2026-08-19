import { prisma } from "@/lib/db";
import {
  ALRAHUZ_ELECTRICITY_PROVIDERS,
  ALRAHUZ_CABLE_PROVIDERS,
  ALRAHUZ_CABLE_PLANS,
  ALRAHUZ_EXAM_PRODUCTS,
} from "./services-catalog-data.mjs";

export {
  ALRAHUZ_ELECTRICITY_PROVIDERS,
  ALRAHUZ_CABLE_PROVIDERS,
  ALRAHUZ_CABLE_PLANS,
  ALRAHUZ_EXAM_PRODUCTS,
};

export async function syncAlrahuzCatalog(dbClient = prisma) {
  const results = {
    electricityCount: 0,
    cableProviderCount: 0,
    cablePlanCount: 0,
    examCount: 0,
  };

  // 1. Sync Electricity Providers
  for (const item of ALRAHUZ_ELECTRICITY_PROVIDERS) {
    await dbClient.electricityProvider.upsert({
      where: { discoName: item.discoName },
      update: {
        name: item.name,
        minAmount: item.minAmount,
        maxAmount: item.maxAmount,
        isActive: true,
      },
      create: {
        name: item.name,
        discoName: item.discoName,
        minAmount: item.minAmount,
        maxAmount: item.maxAmount,
        isActive: true,
      },
    });
    results.electricityCount++;
  }

  // 2. Sync Cable Providers
  const providerMap = new Map<string, string>();
  for (const item of ALRAHUZ_CABLE_PROVIDERS) {
    const provider = await dbClient.cableProvider.upsert({
      where: { cablename: item.cablename },
      update: {
        name: item.name,
        isActive: true,
      },
      create: {
        cablename: item.cablename,
        name: item.name,
        isActive: true,
      },
      select: { id: true, name: true },
    });
    providerMap.set(provider.name, provider.id);
    results.cableProviderCount++;
  }

  // 3. Sync Cable Plans
  for (const item of ALRAHUZ_CABLE_PLANS) {
    const providerId = providerMap.get(item.providerName);
    if (!providerId) continue;

    await dbClient.cablePlan.upsert({
      where: {
        providerId_cableplan: {
          providerId,
          cableplan: item.cableplan,
        },
      },
      update: {
        name: item.name,
        price: item.price,
        isActive: true,
      },
      create: {
        providerId,
        cableplan: item.cableplan,
        name: item.name,
        price: item.price,
        isActive: true,
      },
    });
    results.cablePlanCount++;
  }

  // 4. Sync Exam Products
  for (const item of ALRAHUZ_EXAM_PRODUCTS) {
    await dbClient.examProduct.upsert({
      where: { examName: item.examName },
      update: {
        displayName: item.displayName,
        price: item.price,
        maxQuantity: item.maxQuantity,
        isActive: true,
      },
      create: {
        examName: item.examName,
        displayName: item.displayName,
        price: item.price,
        maxQuantity: item.maxQuantity,
        isActive: true,
      },
    });
    results.examCount++;
  }

  return results;
}
