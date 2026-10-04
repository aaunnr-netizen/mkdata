import assert from "node:assert/strict";
import crypto from "crypto";
import {
  generateApiKey,
  hashApiKey,
  generateWebhookSecret,
  signWebhookPayload,
  verifyWebhookSignature,
  hashPayload,
} from "../lib/developer/crypto.ts";
import { checkRateLimit, cleanupOldEntries } from "../lib/rateLimiter.ts";

export async function testDeveloperApiFoundation() {
  console.log("Testing Developer API Foundation: Crypto, Webhooks, Idempotency & Rate Limiting...");

  // 1. Test API Key Generation Format and Hashing
  const { rawKey, keyPrefix, keyHash } = generateApiKey();

  assert.ok(rawKey.startsWith("mk"), "API key must start with 'mk' prefix");
  assert.equal(rawKey.length, 42, "API key should be 'mk' followed by 40 hex characters");
  assert.equal(keyPrefix, rawKey.slice(0, 10), "Prefix must match first 10 characters");
  assert.equal(keyHash.length, 64, "Key hash must be 64 hex characters (SHA-256)");

  // Hash determinism
  const computedHash = hashApiKey(rawKey);
  assert.equal(computedHash, keyHash, "hashApiKey must match keyHash deterministically");

  // Different keys generate different hashes
  const secondKey = generateApiKey();
  assert.notEqual(secondKey.rawKey, rawKey, "Subsequent keys must be unique");
  assert.notEqual(secondKey.keyHash, keyHash, "Subsequent key hashes must be unique");

  // 2. Test Webhook Secrets and HMAC-SHA256 Signing
  const secret = generateWebhookSecret();
  assert.ok(secret.startsWith("whsec_"), "Webhook secret must start with whsec_ prefix");

  const timestamp = Math.floor(Date.now() / 1000);
  const testPayload = JSON.stringify({
    event: "data.success",
    data: { reference: "MKD-123456", amount: 250, phone: "08012345678" },
  });

  const signatureHeader = signWebhookPayload(secret, timestamp, testPayload);
  assert.ok(signatureHeader.startsWith(`t=${timestamp},v1=`), "Signature header must follow t=...,v1= format");

  // Verification succeeds with correct payload and secret
  const isValid = verifyWebhookSignature(secret, signatureHeader, testPayload, 300);
  assert.equal(isValid, true, "Signature verification must succeed for valid payload and secret");

  // Verification fails for tampered payload
  const tamperedPayload = JSON.stringify({
    event: "data.success",
    data: { reference: "MKD-123456", amount: 999999, phone: "08012345678" },
  });
  const isTamperedValid = verifyWebhookSignature(secret, signatureHeader, tamperedPayload, 300);
  assert.equal(isTamperedValid, false, "Signature verification must fail when payload is tampered");

  // Verification fails for wrong secret
  const wrongSecret = generateWebhookSecret();
  const isWrongSecretValid = verifyWebhookSignature(wrongSecret, signatureHeader, testPayload, 300);
  assert.equal(isWrongSecretValid, false, "Signature verification must fail for wrong secret");

  // Verification fails for expired timestamp (> tolerance)
  const expiredTimestamp = timestamp - 400; // 400s ago (tolerance is 300s)
  const expiredSigHeader = signWebhookPayload(secret, expiredTimestamp, testPayload);
  const isExpiredValid = verifyWebhookSignature(secret, expiredSigHeader, testPayload, 300);
  assert.equal(isExpiredValid, false, "Signature verification must reject replays exceeding tolerance window");

  // 3. Test Idempotency Request Payload Hashing
  const reqA = { plan_id: "plan-1", phone: "08012345678", request_id: "req_001" };
  const reqACopy = { plan_id: "plan-1", phone: "08012345678", request_id: "req_001" };
  const reqB = { plan_id: "plan-2", phone: "08012345678", request_id: "req_001" };

  const hashA = hashPayload(reqA);
  const hashACopy = hashPayload(reqACopy);
  const hashB = hashPayload(reqB);

  assert.equal(hashA, hashACopy, "Identical request payloads must have identical hashes");
  assert.notEqual(hashA, hashB, "Differing request payloads must have differing hashes");

  // 4. Test In-Memory Rate Limiter (Zero-Interval Serverless Optimization)
  const testKey = `test-ip-${Date.now()}:test-endpoint`;
  const maxAttempts = 3;
  const windowMs = 500;

  assert.equal(checkRateLimit(testKey, maxAttempts, windowMs), true, "1st request within limit allowed");
  assert.equal(checkRateLimit(testKey, maxAttempts, windowMs), true, "2nd request within limit allowed");
  assert.equal(checkRateLimit(testKey, maxAttempts, windowMs), true, "3rd request within limit allowed");
  assert.equal(checkRateLimit(testKey, maxAttempts, windowMs), false, "4th request exceeds rate limit");

  // Manual cleanup function runs cleanly without persistent intervals
  cleanupOldEntries();

  console.log("PASS: Developer API Foundation tests verified successfully.");
}
