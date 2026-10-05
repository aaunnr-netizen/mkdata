import crypto from "crypto";
import { prisma } from "../db";
import { purchaseData as purchaseFromSmeplug } from "../smeplug";
import { purchaseData as purchaseFromSaiful } from "../saiful";
import { purchaseData as purchaseFromAlrahuz, purchaseAirtime } from "../alrahuz";
import { purchaseData as purchaseFromAmysub } from "../amysub";
import { getDataPlanProviderIds } from "../data-plan-provider-ids";
import {
  acquirePurchaseLock,
  buildPurchaseLockKey,
  normalizeProviderFailureMessage,
  DATA_INSUFFICIENT_FUNDS_MESSAGE,
} from "../purchase-utils";
import { AuthenticatedDeveloper } from "./auth";
import { dispatchDeveloperWebhook } from "./webhooks";

const NETWORK_AIRTIME_MAP: Record<string, number> = {
  mtn: 1,
  glo: 2,
  "9mobile": 3,
  airtel: 4,
};

export interface DataPurchaseParams {
  developer: AuthenticatedDeveloper;
  planId: string;
  recipientPhone: string;
  network?: string;
  requestId?: string;
}

export interface AirtimePurchaseParams {
  developer: AuthenticatedDeveloper;
  network: string;
  amount: number; // in Naira
  recipientPhone: string;
  requestId?: string;
}

export interface VtuExecutionResult {
  statusCode: number;
  body: {
    success: boolean;
    status: "SUCCESS" | "PROCESSING" | "FAILED";
    reference: string;
    requestId?: string;
    message?: string;
    error?: string;
    amount?: number;
    phone?: string;
    network?: string;
    plan?: string;
    balance?: number; // In Naira
  };
}

/**
 * Executes a live data purchase for an integrated developer.
 * Uses agent wholesale pricing, atomic locking, and timeout reconciliation.
 */
export async function executeDataPurchaseForDeveloper(
  params: DataPurchaseParams
): Promise<VtuExecutionResult> {
  const { developer, planId, recipientPhone, requestId } = params;

  // 1. Fetch Plan details - supports numeric externalPlanId (e.g. 5, 82, 174) or cuid string id
  let plan = null;
  const numericId = parseInt(planId, 10);
  if (!isNaN(numericId) && String(numericId) === String(planId).trim()) {
    const whereClause: any = { externalPlanId: numericId, isActive: true };
    if (params.network) {
      const netStr = String(params.network).trim().toUpperCase();
      if (netStr === "1" || netStr === "MTN") whereClause.network = "MTN";
      else if (netStr === "2" || netStr === "GLO") whereClause.network = "GLO";
      else if (netStr === "3" || netStr === "AIRTEL") whereClause.network = "AIRTEL";
      else if (netStr === "4" || netStr === "9MOBILE" || netStr === "NINEMOBILE") whereClause.network = "NINEMOBILE";
      else whereClause.network = netStr;
    }
    plan = await prisma.plan.findFirst({
      where: whereClause,
      orderBy: { updatedAt: "desc" },
    });
  }
  if (!plan) {
    plan = await prisma.plan.findUnique({
      where: { id: planId },
    });
  }

  if (!plan || !plan.isActive) {
    return {
      statusCode: 404,
      body: {
        success: false,
        status: "FAILED",
        reference: "",
        requestId,
        error: "Data plan not found or currently disabled.",
      },
    };
  }

  // Developer API always receives wholesale agent_price
  const priceInNaira = plan.agent_price > 0 ? plan.agent_price : plan.price;
  const priceInKobo = priceInNaira * 100;

  if (developer.balance < priceInKobo) {
    return {
      statusCode: 400,
      body: {
        success: false,
        status: "FAILED",
        reference: "",
        requestId,
        error: DATA_INSUFFICIENT_FUNDS_MESSAGE,
      },
    };
  }

  const reference = `MKD-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
  const lockKey = buildPurchaseLockKey("data", developer.id, `${planId}:${recipientPhone}`, priceInNaira);

  // 2. Lock & Debit Wallet
  let latestBalanceKobo = developer.balance;
  try {
    const lockResult = await prisma.$transaction(async (tx) => {
      await acquirePurchaseLock(tx, lockKey);

      const userRecord = await tx.user.findUnique({
        where: { id: developer.id },
        select: { balance: true, isBanned: true, isActive: true },
      });

      if (!userRecord || userRecord.isBanned || !userRecord.isActive) {
        return { error: "Account restricted" };
      }

      if (userRecord.balance < priceInKobo) {
        return { error: DATA_INSUFFICIENT_FUNDS_MESSAGE };
      }

      latestBalanceKobo = userRecord.balance - priceInKobo;

      await tx.user.update({
        where: { id: developer.id },
        data: { balance: { decrement: priceInKobo } },
      });

      await tx.transaction.create({
        data: {
          userId: developer.id,
          type: "DATA_PURCHASE",
          amount: priceInNaira,
          status: "PENDING",
          reference,
          externalReference: requestId || null,
          description: `API: ${plan.name} (${plan.sizeLabel}) -> ${recipientPhone}`,
          phone: recipientPhone,
          planId: plan.id,
          apiUsed: plan.apiSource,
          balanceBefore: userRecord.balance,
          balanceAfter: latestBalanceKobo,
        },
      });

      return { success: true };
    });

    if ("error" in lockResult && lockResult.error) {
      return {
        statusCode: 400,
        body: {
          success: false,
          status: "FAILED",
          reference: "",
          requestId,
          error: lockResult.error,
        },
      };
    }
  } catch (err: any) {
    console.error("[DEV DATA PURCHASE DEBIT ERROR]", err);
    return {
      statusCode: 500,
      body: {
        success: false,
        status: "FAILED",
        reference: "",
        requestId,
        error: "Failed to initiate transaction. Please try again.",
      },
    };
  }

  // 3. Dispatch to Telecom Provider
  try {
    const providerIds = getDataPlanProviderIds(plan);
    const apiResult =
      plan.apiSource === "API_A"
        ? await purchaseFromSmeplug({
            externalNetworkId: providerIds.networkId,
            externalPlanId: providerIds.planId,
            phone: recipientPhone,
            reference,
          })
        : plan.apiSource === "API_B"
        ? await purchaseFromSaiful({
            plan: providerIds.planId,
            mobileNumber: recipientPhone,
            network: plan.network,
            networkId: providerIds.networkId,
            reference,
          })
        : plan.apiSource === "API_D"
        ? await purchaseFromAmysub({
            plan: providerIds.planId,
            mobileNumber: recipientPhone,
            networkId: providerIds.networkId,
            reference,
          })
        : await purchaseFromAlrahuz({
            network: providerIds.networkId,
            plan: providerIds.planId,
            mobileNumber: recipientPhone,
            reference,
          });

    // Indeterminate timeout or upstream network issue
    if (!apiResult.success && "isTimeout" in apiResult && (apiResult as any).isTimeout) {
      await prisma.transaction.updateMany({
        where: { reference },
        data: {
          status: "PENDING",
          description: `API Processing with network (${plan.sizeLabel} -> ${recipientPhone})`,
        },
      });

      return {
        statusCode: 202,
        body: {
          success: true,
          status: "PROCESSING",
          reference,
          requestId,
          message: "Transaction accepted and processing with network operator.",
          amount: priceInNaira,
          phone: recipientPhone,
          network: plan.network,
          plan: plan.sizeLabel,
          balance: latestBalanceKobo / 100,
        },
      };
    }

    // Definite failure -> instant rollback
    if (!apiResult.success) {
      const errorMessage = normalizeProviderFailureMessage(apiResult.message);

      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: developer.id },
          data: { balance: { increment: priceInKobo } },
        });

        await tx.transaction.updateMany({
          where: { reference },
          data: {
            status: "FAILED",
            description: errorMessage,
            externalReference: apiResult.externalReference || requestId || undefined,
          },
        });
      });

      dispatchDeveloperWebhook(developer.id, "data.failed", {
        reference,
        requestId,
        status: "FAILED",
        phone: recipientPhone,
        network: plan.network,
        amount: priceInNaira,
        error: errorMessage,
      });

      return {
        statusCode: 400,
        body: {
          success: false,
          status: "FAILED",
          reference,
          requestId,
          error: errorMessage,
        },
      };
    }

    // Success
    await prisma.transaction.updateMany({
      where: { reference },
      data: {
        status: "SUCCESS",
        externalReference: apiResult.externalReference || requestId || undefined,
        description: apiResult.message || `Delivered ${plan.sizeLabel} data to ${recipientPhone}`,
      },
    });

    dispatchDeveloperWebhook(developer.id, "data.success", {
      reference,
      requestId,
      status: "SUCCESS",
      phone: recipientPhone,
      network: plan.network,
      plan: plan.sizeLabel,
      amount: priceInNaira,
      externalReference: apiResult.externalReference,
    });

    return {
      statusCode: 200,
      body: {
        success: true,
        status: "SUCCESS",
        reference,
        requestId,
        message: apiResult.message || "Data delivered successfully.",
        amount: priceInNaira,
        phone: recipientPhone,
        network: plan.network,
        plan: plan.sizeLabel,
        balance: latestBalanceKobo / 100,
      },
    };
  } catch (error: any) {
    console.error("[DEV DATA PURCHASE PROVIDER ERROR]", error);

    const isTimeout =
      error.code === "ECONNABORTED" ||
      error.message?.includes("timeout") ||
      error.name === "AbortError";

    if (isTimeout) {
      return {
        statusCode: 202,
        body: {
          success: true,
          status: "PROCESSING",
          reference,
          requestId,
          message: "Transaction accepted and processing with network operator.",
          amount: priceInNaira,
          phone: recipientPhone,
          network: plan.network,
          plan: plan.sizeLabel,
          balance: latestBalanceKobo / 100,
        },
      };
    }

    // Rollback on fatal exception
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: developer.id },
        data: { balance: { increment: priceInKobo } },
      });

      await tx.transaction.updateMany({
        where: { reference },
        data: {
          status: "FAILED",
          description: "Internal provider communication error.",
        },
      });
    });

    return {
      statusCode: 502,
      body: {
        success: false,
        status: "FAILED",
        reference,
        requestId,
        error: "Unable to reach telecom provider. Wallet refunded.",
      },
    };
  }
}

/**
 * Executes a live airtime purchase for an integrated developer.
 */
export async function executeAirtimePurchaseForDeveloper(
  params: AirtimePurchaseParams
): Promise<VtuExecutionResult> {
  const { developer, network, amount, recipientPhone, requestId } = params;

  const normalizedNetwork = network.toLowerCase().trim();
  const networkId = NETWORK_AIRTIME_MAP[normalizedNetwork];

  if (!networkId) {
    return {
      statusCode: 400,
      body: {
        success: false,
        status: "FAILED",
        reference: "",
        requestId,
        error: "Invalid network specified. Allowed: mtn, glo, airtel, 9mobile.",
      },
    };
  }

  if (amount < 50 || amount > 50000) {
    return {
      statusCode: 400,
      body: {
        success: false,
        status: "FAILED",
        reference: "",
        requestId,
        error: "Amount must be between ₦50 and ₦50,000.",
      },
    };
  }

  const priceInKobo = amount * 100;
  if (developer.balance < priceInKobo) {
    return {
      statusCode: 400,
      body: {
        success: false,
        status: "FAILED",
        reference: "",
        requestId,
        error: DATA_INSUFFICIENT_FUNDS_MESSAGE,
      },
    };
  }

  const reference = `MKA-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
  const lockKey = buildPurchaseLockKey("airtime", developer.id, `${normalizedNetwork}:${recipientPhone}`, amount);

  let latestBalanceKobo = developer.balance;
  try {
    const lockResult = await prisma.$transaction(async (tx) => {
      await acquirePurchaseLock(tx, lockKey);

      const userRecord = await tx.user.findUnique({
        where: { id: developer.id },
        select: { balance: true, isBanned: true, isActive: true },
      });

      if (!userRecord || userRecord.isBanned || !userRecord.isActive) {
        return { error: "Account restricted" };
      }

      if (userRecord.balance < priceInKobo) {
        return { error: DATA_INSUFFICIENT_FUNDS_MESSAGE };
      }

      latestBalanceKobo = userRecord.balance - priceInKobo;

      await tx.user.update({
        where: { id: developer.id },
        data: { balance: { decrement: priceInKobo } },
      });

      await tx.transaction.create({
        data: {
          userId: developer.id,
          type: "AIRTIME_PURCHASE",
          amount,
          status: "PENDING",
          reference,
          externalReference: requestId || null,
          description: `API Airtime: ${normalizedNetwork.toUpperCase()} ₦${amount} -> ${recipientPhone}`,
          phone: recipientPhone,
          balanceBefore: userRecord.balance,
          balanceAfter: latestBalanceKobo,
        },
      });

      return { success: true };
    });

    if ("error" in lockResult && lockResult.error) {
      return {
        statusCode: 400,
        body: {
          success: false,
          status: "FAILED",
          reference: "",
          requestId,
          error: lockResult.error,
        },
      };
    }
  } catch (err: any) {
    console.error("[DEV AIRTIME PURCHASE DEBIT ERROR]", err);
    return {
      statusCode: 500,
      body: {
        success: false,
        status: "FAILED",
        reference: "",
        requestId,
        error: "Failed to initiate airtime transaction.",
      },
    };
  }

  try {
    const apiResult = await purchaseAirtime({
      network: networkId,
      amount,
      mobileNumber: recipientPhone,
      reference,
    });

    if (!apiResult.success && "isTimeout" in apiResult && (apiResult as any).isTimeout) {
      return {
        statusCode: 202,
        body: {
          success: true,
          status: "PROCESSING",
          reference,
          requestId,
          message: "Airtime purchase is processing with network operator.",
          amount,
          phone: recipientPhone,
          network: normalizedNetwork.toUpperCase(),
          balance: latestBalanceKobo / 100,
        },
      };
    }

    if (!apiResult.success) {
      const errorMessage = normalizeProviderFailureMessage(apiResult.message);

      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: developer.id },
          data: { balance: { increment: priceInKobo } },
        });

        await tx.transaction.updateMany({
          where: { reference },
          data: {
            status: "FAILED",
            description: errorMessage,
            externalReference: apiResult.externalReference || requestId || undefined,
          },
        });
      });

      dispatchDeveloperWebhook(developer.id, "airtime.failed", {
        reference,
        requestId,
        status: "FAILED",
        phone: recipientPhone,
        network: normalizedNetwork.toUpperCase(),
        amount,
        error: errorMessage,
      });

      return {
        statusCode: 400,
        body: {
          success: false,
          status: "FAILED",
          reference,
          requestId,
          error: errorMessage,
        },
      };
    }

    await prisma.transaction.updateMany({
      where: { reference },
      data: {
        status: "SUCCESS",
        externalReference: apiResult.externalReference || requestId || undefined,
        description: apiResult.message || `Delivered ₦${amount} airtime to ${recipientPhone}`,
      },
    });

    dispatchDeveloperWebhook(developer.id, "airtime.success", {
      reference,
      requestId,
      status: "SUCCESS",
      phone: recipientPhone,
      network: normalizedNetwork.toUpperCase(),
      amount,
      externalReference: apiResult.externalReference,
    });

    return {
      statusCode: 200,
      body: {
        success: true,
        status: "SUCCESS",
        reference,
        requestId,
        message: apiResult.message || "Airtime top-up successful.",
        amount,
        phone: recipientPhone,
        network: normalizedNetwork.toUpperCase(),
        balance: latestBalanceKobo / 100,
      },
    };
  } catch (error: any) {
    console.error("[DEV AIRTIME PURCHASE ERROR]", error);

    const isTimeout =
      error.code === "ECONNABORTED" ||
      error.message?.includes("timeout") ||
      error.name === "AbortError";

    if (isTimeout) {
      return {
        statusCode: 202,
        body: {
          success: true,
          status: "PROCESSING",
          reference,
          requestId,
          message: "Airtime purchase is processing with network operator.",
          amount,
          phone: recipientPhone,
          network: normalizedNetwork.toUpperCase(),
          balance: latestBalanceKobo / 100,
        },
      };
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: developer.id },
        data: { balance: { increment: priceInKobo } },
      });

      await tx.transaction.updateMany({
        where: { reference },
        data: {
          status: "FAILED",
          description: "Internal airtime communication error.",
        },
      });
    });

    return {
      statusCode: 502,
      body: {
        success: false,
        status: "FAILED",
        reference,
        requestId,
        error: "Unable to reach telecom provider. Wallet refunded.",
      },
    };
  }
}
