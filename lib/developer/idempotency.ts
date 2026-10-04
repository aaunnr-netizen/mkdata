import { prisma } from "../db";
import { hashPayload } from "./crypto";

export interface IdempotencyCheckResult {
  isCached: boolean;
  statusCode?: number;
  responseBody?: any;
}

export { hashPayload };

/**
 * Checks if a developer request has already been executed within 24 hours.
 */
export async function checkIdempotency(
  userId: string,
  endpoint: string,
  idempotencyKey: string,
  requestPayload: any
): Promise<IdempotencyCheckResult> {
  if (!idempotencyKey || typeof idempotencyKey !== "string") {
    return { isCached: false };
  }

  const cleanKey = idempotencyKey.trim().slice(0, 100);
  const payloadHash = hashPayload(requestPayload);

  try {
    const existing = await prisma.apiIdempotencyKey.findUnique({
      where: {
        userId_endpoint_key: {
          userId,
          endpoint,
          key: cleanKey,
        },
      },
    });

    if (!existing) {
      return { isCached: false };
    }

    // Check expiration
    if (new Date() > existing.expiresAt) {
      return { isCached: false };
    }

    // Payload mismatch detection (same key used with differing payload)
    if (existing.requestHash !== payloadHash) {
      return {
        isCached: true,
        statusCode: 422,
        responseBody: {
          success: false,
          error: "Idempotency conflict: A request with this key was already made with different parameters.",
          code: "IDEMPOTENCY_PAYLOAD_MISMATCH",
        },
      };
    }

    return {
      isCached: true,
      statusCode: existing.responseStatus,
      responseBody: existing.responseBody,
    };
  } catch (err) {
    console.error("[DEV IDEMPOTENCY CHECK ERROR]", err);
    return { isCached: false };
  }
}

/**
 * Caches the response of a successful or terminal API operation for 24 hours.
 */
export async function saveIdempotencyRecord(
  userId: string,
  endpoint: string,
  idempotencyKey: string,
  requestPayload: any,
  responseStatus: number,
  responseBody: any,
  transactionReference?: string
): Promise<void> {
  if (!idempotencyKey || typeof idempotencyKey !== "string") {
    return;
  }

  const cleanKey = idempotencyKey.trim().slice(0, 100);
  const payloadHash = hashPayload(requestPayload);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  try {
    await prisma.apiIdempotencyKey.upsert({
      where: {
        userId_endpoint_key: {
          userId,
          endpoint,
          key: cleanKey,
        },
      },
      update: {
        responseStatus,
        responseBody,
        transactionReference,
        expiresAt,
      },
      create: {
        userId,
        endpoint,
        key: cleanKey,
        requestHash: payloadHash,
        responseStatus,
        responseBody,
        transactionReference,
        expiresAt,
      },
    });
  } catch (err) {
    console.error("[DEV IDEMPOTENCY SAVE ERROR]", err);
  }
}
