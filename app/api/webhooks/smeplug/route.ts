import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkAndAwardRewards } from "@/lib/rewards";
import { sendPushNotification } from "@/lib/firebase";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    let body: any;

    try {
      body = JSON.parse(rawBody);
    } catch {
      console.error("[SMEPLUG WEBHOOK] Failed to parse JSON body:", rawBody);
      return NextResponse.json({ status: false, message: "Invalid JSON" }, { status: 400 });
    }

    console.log("[SMEPLUG WEBHOOK RECEIVED]", JSON.stringify(body, null, 2));

    const txData = body.transaction || body.data || body;
    const rawStatus = (txData.status || "").toString().toLowerCase().trim();
    const customerReference = (txData.customer_reference || txData.customerReference || "").toString().trim();
    const externalReference = (txData.reference || txData.external_reference || "").toString().trim();
    const memo = txData.memo || txData.response || txData.msg || txData.message || "SMEPlug update";

    if (!customerReference && !externalReference) {
      console.warn("[SMEPLUG WEBHOOK] Missing reference in payload");
      return NextResponse.json({ status: false, message: "Missing reference" }, { status: 400 });
    }

    // Find the corresponding local transaction
    const transaction = await prisma.transaction.findFirst({
      where: {
        OR: [
          ...(customerReference ? [{ reference: customerReference }] : []),
          ...(externalReference ? [{ externalReference }] : []),
        ],
      },
      include: {
        user: true,
      },
    });

    if (!transaction) {
      console.warn("[SMEPLUG WEBHOOK] No matching transaction found for:", {
        customerReference,
        externalReference,
      });
      return NextResponse.json(
        { status: true, message: "Transaction not found on mkdata" },
        { status: 200 }
      );
    }

    const isSuccess = rawStatus === "success" || rawStatus === "successful" || rawStatus === "true" || rawStatus === "delivered";
    const isFailed = rawStatus === "failed" || rawStatus === "fail" || rawStatus === "rejected" || rawStatus === "reversed";

    // 1. If SMEPlug reports SUCCESS:
    if (isSuccess) {
      if (transaction.status === "SUCCESS") {
        return NextResponse.json({ status: true, message: "Already completed" }, { status: 200 });
      }

      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: "SUCCESS",
          externalReference: externalReference || transaction.externalReference,
          description: memo || transaction.description,
        },
      });

      if (transaction.userId) {
        await checkAndAwardRewards(transaction.userId);
        sendPushNotification(
          transaction.userId,
          "Data Delivery Confirmed 📱",
          `Your data purchase (${transaction.description}) has been delivered successfully.`
        ).catch((err) => console.error("[FCM WEBHOOK NOTIF ERROR]", err));
      }

      console.log("[SMEPLUG WEBHOOK] Transaction marked SUCCESS:", transaction.reference);
      return NextResponse.json({ status: true, message: "Transaction marked SUCCESS" }, { status: 200 });
    }

    // 2. If SMEPlug reports FAILED:
    if (isFailed) {
      if (transaction.status === "FAILED") {
        return NextResponse.json({ status: true, message: "Already failed" }, { status: 200 });
      }

      // Only refund if it was in PENDING state (prevent double-refunding)
      if (transaction.status === "PENDING" && transaction.userId && transaction.user) {
        const refundKobo = transaction.amount * 100;

        await prisma.$transaction(async (tx) => {
          await tx.user.update({
            where: { id: transaction.userId! },
            data: {
              balance: { increment: refundKobo },
            },
          });

          await tx.transaction.update({
            where: { id: transaction.id },
            data: {
              status: "FAILED",
              description: `Failed: ${memo}`,
              externalReference: externalReference || transaction.externalReference,
            },
          });
        });

        sendPushNotification(
          transaction.userId,
          "Data Purchase Failed (Refunded)",
          `Your data purchase failed and ₦${transaction.amount.toLocaleString()} has been refunded back to your wallet.`
        ).catch((err) => console.error("[FCM WEBHOOK NOTIF ERROR]", err));

        console.log("[SMEPLUG WEBHOOK] Transaction marked FAILED and user refunded:", transaction.reference);
        return NextResponse.json({ status: true, message: "Transaction failed and user refunded" }, { status: 200 });
      }

      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: "FAILED",
          description: `Failed: ${memo}`,
        },
      });

      return NextResponse.json({ status: true, message: "Transaction marked FAILED" }, { status: 200 });
    }

    // Indeterminate / unknown status update
    return NextResponse.json({ status: true, message: "Webhook acknowledged" }, { status: 200 });
  } catch (error: any) {
    console.error("[SMEPLUG WEBHOOK ERROR]", error);
    return NextResponse.json(
      { status: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
