import crypto from "crypto";

export interface GeneratedApiKey {
  rawKey: string;
  keyPrefix: string;
  keyHash: string;
}

/**
 * Generates a cryptographically strong live API key for developers.
 * Format: "mk" + 40-character hex string (e.g., mk8a9f...42b0)
 */
export function generateApiKey(): GeneratedApiKey {
  // 20 random bytes -> 40 hex chars
  const randomHex = crypto.randomBytes(20).toString("hex");
  const rawKey = `mk${randomHex}`;
  const keyPrefix = rawKey.slice(0, 10);
  const keyHash = hashApiKey(rawKey);

  return {
    rawKey,
    keyPrefix,
    keyHash,
  };
}

/**
 * Computes SHA-256 hash of API key.
 * Used for fast indexed B-Tree lookups in PostgreSQL (taking < 0.02ms CPU).
 */
export function hashApiKey(rawKey: string): string {
  return crypto.createHash("sha256").update(rawKey.trim()).digest("hex");
}

/**
 * Generates a high-entropy secret for signing developer webhooks.
 * Format: "whsec_" + 48 hex characters
 */
export function generateWebhookSecret(): string {
  return `whsec_${crypto.randomBytes(24).toString("hex")}`;
}

/**
 * Computes HMAC-SHA256 signature for outgoing developer webhooks.
 * Header format: "t={timestamp},v1={hex_digest}"
 */
export function signWebhookPayload(
  secret: string,
  timestamp: number,
  payloadString: string
): string {
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${payloadString}`)
    .digest("hex");

  return `t=${timestamp},v1=${signature}`;
}

/**
 * Verifies developer webhook signature with constant-time equality check.
 * Tolerance: 5 minutes (300 seconds) against replay attacks.
 */
export function verifyWebhookSignature(
  secret: string,
  signatureHeader: string,
  payloadString: string,
  toleranceSeconds: number = 300
): boolean {
  try {
    const parts = signatureHeader.split(",");
    let timestampStr = "";
    let signatureHex = "";

    for (const part of parts) {
      const [key, value] = part.split("=");
      if (key === "t") timestampStr = value;
      if (key === "v1") signatureHex = value;
    }

    if (!timestampStr || !signatureHex) return false;

    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp)) return false;

    const currentEpoch = Math.floor(Date.now() / 1000);
    if (Math.abs(currentEpoch - timestamp) > toleranceSeconds) {
      return false; // Replay window exceeded
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${timestamp}.${payloadString}`)
      .digest("hex");

    const expectedBuf = Buffer.from(expectedSignature, "utf8");
    const actualBuf = Buffer.from(signatureHex, "utf8");

    if (expectedBuf.length !== actualBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, actualBuf);
  } catch {
    return false;
  }
}

/**
 * Computes a deterministic SHA-256 hash of a JSON-serializable request body.
 */
export function hashPayload(payload: any): string {
  const serialized = typeof payload === "string" ? payload : JSON.stringify(payload ?? {});
  return crypto.createHash("sha256").update(serialized).digest("hex");
}

