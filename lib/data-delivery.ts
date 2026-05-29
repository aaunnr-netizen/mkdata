import { prisma } from "@/lib/db";
import * as smeplug from "@/lib/smeplug";
import * as saiful from "@/lib/saiful";
import * as alrahuz from "@/lib/alrahuz";
import { normalizeProviderFailureMessage } from "@/lib/purchase-utils";
import { getDataPlanProviderIds } from "@/lib/data-plan-provider-ids";
import { Transaction } from "@prisma/client";

/**
 * Delivers data to guest after successful Flutterwave payment
 * Called from webhook after payment confirmation
 */
export async function deliverGuestData(transaction: Transaction) {
  try {
    // Fetch plan details
    const plan = await prisma.plan.findUnique({
      where: { id: transaction.planId || "" },
    });

    if (!plan) {
      console.error("[DATA DELIVER] Plan not found:", transaction.planId);
      return {
        success: false,
        message: "Plan not found",
      };
    }

    let result;
    const providerIds = getDataPlanProviderIds(plan);

    // Call appropriate API based on plan's API source
    if (plan.apiSource === "API_A") {
      result = await smeplug.purchaseData({
        externalNetworkId: providerIds.networkId,
        externalPlanId: providerIds.planId,
        phone: transaction.phone,
        reference: transaction.reference,
      });
    } else if (plan.apiSource === "API_B") {
      result = await saiful.purchaseData({
        plan: providerIds.planId,
        mobileNumber: transaction.phone,
        network: plan.network,
        networkId: providerIds.networkId,
        reference: transaction.reference,
      });
    } else {
      result = await alrahuz.purchaseData({
        network: providerIds.networkId,
        plan: providerIds.planId,
        mobileNumber: transaction.phone,
        reference: transaction.reference,
      });
    }

    // Update transaction with result
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: result.success ? "SUCCESS" : "FAILED",
        externalReference: result.externalReference || undefined,
        description: result.success ? result.message : normalizeProviderFailureMessage(result.message),
      },
    });

    return {
      success: result.success,
      message: result.success ? result.message : normalizeProviderFailureMessage(result.message),
      externalReference: result.externalReference,
    };
  } catch (error: any) {
    console.error("[DATA DELIVER ERROR]", error);

    // Update transaction as failed
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: "FAILED",
        description: `Delivery error: ${error.message}`,
      },
    });

    return {
      success: false,
      message: `Delivery error: ${error.message}`,
    };
  }
}
