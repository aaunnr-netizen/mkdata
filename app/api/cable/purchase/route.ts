import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { findRecentDuplicateTransaction, normalizeProviderFailureMessage } from "@/lib/purchase-utils";
import { enforceRateLimit, rejectCrossSiteMutation } from "@/lib/security";
import { purchaseCable } from "@/lib/alrahuz";

const purchaseSchema = z.object({
  buyerPhone: z.string().regex(/^0[0-9]{10}$/, "Invalid buyer phone"),
  planId: z.string().min(1, "Select cable plan"),
  smartCardNumber: z.string().min(5, "Enter smart card number").max(30, "Smart card number is too long"),
  pin: z.string().regex(/^\d{6}$/, "Invalid PIN"),
  confirmDuplicate: z.boolean().optional(),
});

const IDEMPOTENCY_WINDOW_MINUTES = 5;

async function acquirePurchaseLock(tx: any, lockKey: string) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;
}

export async function POST(req: NextRequest) {
  try {
    const originError = rejectCrossSiteMutation(req, { requireOrigin: true });
    if (originError) return originError;

    const rateLimitError = enforceRateLimit(req, "airtimePurchase", "/api/cable/purchase");
    if (rateLimitError) return rateLimitError;

    const { buyerPhone, planId, smartCardNumber, pin, confirmDuplicate = false } =
      purchaseSchema.parse(await req.json());

    const sessionUser = await getSessionUser(req);
    if (!sessionUser) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: sessionUser.userId } });
    if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    if (user.phone !== buyerPhone) return NextResponse.json({ success: false, error: "Session mismatch detected" }, { status: 403 });
    if (user.isBanned) return NextResponse.json({ success: false, error: "Account is banned" }, { status: 403 });
    if (!user.pinHash) return NextResponse.json({ success: false, error: "PIN not set" }, { status: 400 });

    const pinValid = await bcryptjs.compare(pin, user.pinHash);
    if (!pinValid) return NextResponse.json({ success: false, error: "Invalid PIN" }, { status: 401 });

    const plan = await prisma.cablePlan.findUnique({ where: { id: planId }, include: { provider: true } });
    if (!plan || !plan.isActive || !plan.provider.isActive) {
      return NextResponse.json({ success: false, error: "Cable plan is unavailable" }, { status: 404 });
    }

    const amount = plan.price;
    const amountInKobo = amount * 100;
    const duplicateTransaction = await findRecentDuplicateTransaction({
      userId: user.id,
      type: "CABLE_TV_PURCHASE",
      phone: smartCardNumber,
      amount,
    });

    if (duplicateTransaction && !confirmDuplicate) {
      return NextResponse.json(
        { success: false, error: "Duplicate transaction detected. Confirm to continue.", requiresConfirmation: true, duplicateTransaction },
        { status: 409 }
      );
    }

    const reference = `CABLE-${user.id}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const lockKey = `cable:${user.id}:${planId}:${smartCardNumber}:${amount}`;

    const txResult = await prisma.$transaction(async (tx) => {
      await acquirePurchaseLock(tx, lockKey);

      const existingDuplicate = await tx.transaction.findFirst({
        where: {
          userId: user.id,
          type: "CABLE_TV_PURCHASE",
          phone: smartCardNumber,
          amount,
          planId: null,
          createdAt: { gte: new Date(Date.now() - IDEMPOTENCY_WINDOW_MINUTES * 60 * 1000) },
          status: { in: ["PENDING", "SUCCESS"] },
        },
        orderBy: { createdAt: "desc" },
        select: { id: true, reference: true, status: true, amount: true, phone: true, createdAt: true, description: true },
      });

      if (existingDuplicate?.status === "PENDING") return { kind: "pending_duplicate" as const, duplicateTransaction: existingDuplicate };
      if (existingDuplicate && !confirmDuplicate) return { kind: "needs_confirmation" as const, duplicateTransaction: existingDuplicate };

      const latestUser = await tx.user.findUnique({ where: { id: user.id }, select: { balance: true } });
      if (!latestUser || latestUser.balance < amountInKobo) return { kind: "insufficient_funds" as const };

      await tx.user.update({ where: { id: user.id }, data: { balance: { decrement: amountInKobo } } });
      await tx.transaction.create({
        data: {
          userId: user.id,
          type: "CABLE_TV_PURCHASE",
          amount,
          status: "PENDING",
          reference,
          description: `${plan.provider.name} ${plan.name} -> ${smartCardNumber}`,
          phone: smartCardNumber,
          apiUsed: "API_C",
          balanceBefore: latestUser.balance,
          balanceAfter: latestUser.balance - amountInKobo,
        },
      });

      return { kind: "created" as const };
    });

    if (txResult.kind === "pending_duplicate") {
      return NextResponse.json({ success: false, error: "A similar cable purchase is already processing.", duplicateTransaction: txResult.duplicateTransaction }, { status: 409 });
    }
    if (txResult.kind === "needs_confirmation") {
      return NextResponse.json({ success: false, error: "Duplicate transaction detected. Confirm to continue.", requiresConfirmation: true, duplicateTransaction: txResult.duplicateTransaction }, { status: 409 });
    }
    if (txResult.kind === "insufficient_funds") {
      return NextResponse.json({ success: false, error: "Insufficient balance" }, { status: 400 });
    }

    const apiResult = await purchaseCable({
      cablename: plan.provider.cablename,
      cableplan: plan.cableplan,
      smartCardNumber,
      reference,
    });

    if (!apiResult.success) {
      const errorMessage = normalizeProviderFailureMessage(apiResult.message);
      await prisma.$transaction(async (tx) => {
        await tx.user.update({ where: { id: user.id }, data: { balance: { increment: amountInKobo } } });
        await tx.transaction.updateMany({
          where: { reference },
          data: { status: "FAILED", description: errorMessage, externalReference: apiResult.externalReference || undefined },
        });
      });
      return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
    }

    await prisma.transaction.updateMany({
      where: { reference },
      data: { status: "SUCCESS", description: apiResult.message, externalReference: apiResult.externalReference || undefined },
    });

    return NextResponse.json({ success: true, message: apiResult.message, reference }, { status: 200 });
  } catch (error) {
    console.error("[CABLE PURCHASE ERROR]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
