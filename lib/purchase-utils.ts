import { prisma } from "@/lib/db";
import { Prisma, TransactionType } from "@prisma/client";

const PLAN_UNAVAILABLE_PATTERNS = [
  "not available",
  "out of stock",
  "temporarily unavailable",
  "currently unavailable",
  "invalid plan",
  "plan disabled",
  "route not found",
  "product unavailable",
  "product not found",
];

const PROVIDER_TECHNICAL_FAILURE_PATTERNS = [
  "active sim",
  "sim not active",
  "sim inactive",
  "sim issue",
  "route failed",
  "route unavailable",
  "provider unavailable",
  "vendor unavailable",
  "service unavailable",
  "gateway timeout",
  "timeout",
  "timed out",
  "network error",
  "could not dispense",
  "unable to dispense",
  "api response",
  "api error",
  "api request",
  "api c",
  "api a",
  "api b",
  "api d",
  "failed with",
  "status code",
  "status 4",
  "status 5",
  "axios",
  "econnaborted",
  "econnreset",
  "billstack",
  "alrahuz",
  "saiful",
  "smeplug",
  "amysub",
  "delivery error",
  "internal server",
  "server error",
  "bad gateway",
  "request failed",
  "syntaxerror",
  "unexpected token",
];

export const PLAN_UNAVAILABLE_MESSAGE = "plan not available now, choose other plans!";
export const DATA_INSUFFICIENT_FUNDS_MESSAGE = "Aahh! insufficient fund";
export const PROVIDER_TECHNICAL_FAILURE_MESSAGE = "unable to send data, try again later";
export const IDEMPOTENCY_WINDOW_MINUTES = 5;

export function normalizeProviderFailureMessage(message?: string | null) {
  const normalizedMessage = (message || "").toLowerCase();

  if (PLAN_UNAVAILABLE_PATTERNS.some((pattern) => normalizedMessage.includes(pattern))) {
    return PLAN_UNAVAILABLE_MESSAGE;
  }

  if (PROVIDER_TECHNICAL_FAILURE_PATTERNS.some((pattern) => normalizedMessage.includes(pattern))) {
    return PROVIDER_TECHNICAL_FAILURE_MESSAGE;
  }

  return message || "Purchase failed";
}

export function buildPurchaseLockKey(
  service: "data" | "airtime" | "cable" | "electricity" | "exam",
  userId: string,
  targetIdentifier: string,
  amount: number | string
): string {
  return `${service}:${userId}:${targetIdentifier}:${amount}`;
}

export async function acquirePurchaseLock(tx: any, lockKey: string): Promise<void> {
  try {
    if (typeof tx?.$executeRaw === "function") {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;
    }
  } catch (error) {
    // If not on PostgreSQL (e.g., SQLite in unit tests), continue under database transaction isolation
    console.warn(`[PURCHASE LOCK WARNING] Could not acquire advisory lock for key "${lockKey}":`, error);
  }
}

type DuplicateCheckParams = {
  userId: string;
  type: TransactionType;
  phone: string;
  planId?: string;
  amount: number;
  lookbackMinutes?: number;
};

export async function findRecentDuplicateTransaction(params: DuplicateCheckParams) {
  const { userId, type, phone, planId, amount, lookbackMinutes = IDEMPOTENCY_WINDOW_MINUTES } = params;
  const createdAt = new Date(Date.now() - lookbackMinutes * 60 * 1000);

  const where: Prisma.TransactionWhereInput = {
    userId,
    type,
    phone,
    amount,
    createdAt: { gte: createdAt },
    status: { in: ["PENDING", "SUCCESS"] },
    ...(planId ? { planId } : { planId: null }),
  };

  return prisma.transaction.findFirst({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      reference: true,
      status: true,
      amount: true,
      phone: true,
      createdAt: true,
      description: true,
    },
  });
}
