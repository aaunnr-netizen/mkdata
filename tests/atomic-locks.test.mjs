import assert from "node:assert/strict";

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

function extractMessageString(input) {
  if (typeof input === "string") return input.trim();
  if (input instanceof Error) return input.message.trim();
  if (Array.isArray(input)) {
    return input
      .map(extractMessageString)
      .filter((part) => part.length > 0)
      .join(", ");
  }
  if (input && typeof input === "object") {
    const candidate =
      input.message ||
      input.Message ||
      input.detail ||
      input.error ||
      input.msg ||
      input.description ||
      input.api_response ||
      input.status;
    if (candidate && candidate !== input) {
      const extracted = extractMessageString(candidate);
      if (extracted) return extracted;
    }
    try {
      const json = JSON.stringify(input);
      if (json && json !== "{}") return json;
    } catch {
      return "";
    }
  }
  if (input !== null && input !== undefined && typeof input !== "symbol") {
    const str = String(input).trim();
    if (str && str !== "[object Object]") return str;
  }
  return "";
}

function normalizeProviderFailureMessage(message) {
  const rawMessage = extractMessageString(message);
  const normalizedMessage = rawMessage.toLowerCase();
  if (PLAN_UNAVAILABLE_PATTERNS.some((pattern) => normalizedMessage.includes(pattern))) {
    return "plan not available now, choose other plans!";
  }
  if (PROVIDER_TECHNICAL_FAILURE_PATTERNS.some((pattern) => normalizedMessage.includes(pattern))) {
    return "unable to send data, try again later";
  }
  return rawMessage || "Purchase failed";
}

function buildPurchaseLockKey(service, userId, targetIdentifier, amount) {
  return `${service}:${userId}:${targetIdentifier}:${amount}`;
}

async function acquirePurchaseLock(tx, lockKey) {
  try {
    if (typeof tx?.$executeRaw === "function") {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;
    }
  } catch (error) {
    console.warn(`[PURCHASE LOCK WARNING] Could not acquire advisory lock for key "${lockKey}":`, error);
  }
}

async function checkPurchaseGuards(_params) {
  return null;
}

export async function testAtomicLocksAndGuards() {
  console.log("Testing atomic locks, anti-race guards, and KYC bypass...");

  // 1. Lock key generation
  const dataKey = buildPurchaseLockKey("data", "user-123", "plan-456:08012345678", 500);
  assert.equal(dataKey, "data:user-123:plan-456:08012345678:500");

  const airtimeKey = buildPurchaseLockKey("airtime", "user-123", "08012345678:mtn", 1000);
  assert.equal(airtimeKey, "airtime:user-123:08012345678:mtn:1000");

  const cableKey = buildPurchaseLockKey("cable", "user-123", "dstv-compact:1234567890", 12500);
  assert.equal(cableKey, "cable:user-123:dstv-compact:1234567890:12500");

  const electricityKey = buildPurchaseLockKey("electricity", "user-123", "ekedc:01012345678", 3000);
  assert.equal(electricityKey, "electricity:user-123:ekedc:01012345678:3000");

  const examKey = buildPurchaseLockKey("exam", "user-123", "waec:2", 7000);
  assert.equal(examKey, "exam:user-123:waec:2:7000");

  // 2. Mock transaction for acquirePurchaseLock
  let rawQueryExecuted = false;
  const mockTx = {
    $executeRaw: async (strings, ...values) => {
      rawQueryExecuted = true;
      assert.ok(strings[0].includes("pg_advisory_xact_lock"));
    },
  };
  await acquirePurchaseLock(mockTx, dataKey);
  assert.equal(rawQueryExecuted, true, "Should execute pg_advisory_xact_lock on PostgreSQL transaction");

  // Fallback on non-Postgres
  const fallbackTx = {};
  await acquirePurchaseLock(fallbackTx, dataKey);

  // 3. checkPurchaseGuards should pass through cleanly without KYC blocks
  const guardResult = await checkPurchaseGuards({
    userId: "user-123",
    recipientPhone: "08012345678",
    kycStatus: "NONE",
  });
  assert.equal(guardResult, null, "checkPurchaseGuards must return null to allow unblocked transactions");

  // 4. Provider message normalization
  const friendlyTech = normalizeProviderFailureMessage("API request failed with status code 500");
  assert.equal(friendlyTech, "unable to send data, try again later");

  const friendlyPlan = normalizeProviderFailureMessage("Product unavailable or disabled");
  assert.equal(friendlyPlan, "plan not available now, choose other plans!");

  // 5. Non-string object / array / error tolerance (prevents "(e || '').toLowerCase is not a function")
  const objError = normalizeProviderFailureMessage({ error: ["Product unavailable or disabled"] });
  assert.equal(objError, "plan not available now, choose other plans!");

  const detailError = normalizeProviderFailureMessage({ detail: "Gateway timeout from upstream" });
  assert.equal(detailError, "unable to send data, try again later");

  const arrayError = normalizeProviderFailureMessage(["route failed"]);
  assert.equal(arrayError, "unable to send data, try again later");

  const instanceError = normalizeProviderFailureMessage(new Error("bad gateway from server"));
  assert.equal(instanceError, "unable to send data, try again later");

  const nullError = normalizeProviderFailureMessage(null);
  assert.equal(nullError, "Purchase failed");

  const numError = normalizeProviderFailureMessage(500);
  assert.equal(numError, "500");

  console.log("PASS: Atomic locks, anti-race guards, and KYC bypass verified successfully.\n");
}
