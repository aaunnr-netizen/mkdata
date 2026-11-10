import { extractMessageString } from "./purchase-utils";

const TECHNICAL_PATTERNS = [
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
  "status:",
  "axios",
  "econn",
  "timeout",
  "timed out",
  "econnaborted",
  "econnreset",
  "billstack",
  "alrahuz",
  "saiful",
  "smeplug",
  "amysub",
  "delivery error",
  "internal server error",
  "server error",
  "bad gateway",
  "gateway timeout",
  "prisma",
  "syntaxerror",
  "unexpected token",
  "json parse",
  "request failed",
  "unhandled",
  "nullpointer",
  "exception",
  "undefined",
];

export function getFriendlyMessage(input?: unknown, fallback = "Something went wrong. Please try again in a moment.") {
  const message = extractMessageString(input);
  const normalized = message.toLowerCase();

  const cleanFallback = fallback.startsWith("Ahh, sorry")
    ? fallback
    : `Ahh, sorry, ${fallback.charAt(0).toLowerCase()}${fallback.slice(1)}`;

  if (!message) return cleanFallback;

  // Credential & Auth Errors
  if (normalized.includes("invalid credentials") || normalized.includes("user not found") || normalized.includes("account not found")) {
    return "Ahh, sorry, that phone number or PIN does not look right. Please check and try again.";
  }
  if (normalized.includes("session mismatch") || normalized.includes("unauthorized") || normalized.includes("invalid session")) {
    return "Ahh, sorry, your session has expired. Please sign in again.";
  }

  // PIN Errors
  if (
    normalized.includes("invalid pin") ||
    normalized.includes("incorrect pin") ||
    normalized.includes("current pin is incorrect") ||
    normalized.includes("pin is incorrect")
  ) {
    return "Ahh, sorry, that PIN does not look right. Please check it and try again.";
  }
  if (normalized.includes("pin not set")) {
    return "Ahh, sorry, your transaction PIN is not ready yet. Please contact support if this continues.";
  }
  if (normalized.includes("pin entries do not match") || normalized.includes("pin mismatch")) {
    return "Ahh, sorry, those PIN entries do not match yet.";
  }
  if (normalized.includes("pin must be 6 digits") || normalized.includes("6-digit pin")) {
    return "Ahh, sorry, your PIN must be 6 digits.";
  }

  // Balance & Wallet
  if (normalized.includes("insufficient")) {
    return "Ahh, sorry, your wallet balance is too low for this request right now.";
  }

  // Account Restrictions
  if (normalized.includes("account is banned") || normalized.includes("account suspended") || normalized.includes("deactivated")) {
    return "Ahh, sorry, this account cannot complete transactions right now. Please contact support.";
  }

  // KYC
  if (normalized.includes("kyc") || normalized.includes("app locked")) {
    return "Ahh, sorry, your account verification is required before continuing.";
  }

  // Plan Availability
  if (
    normalized.includes("plan not available") ||
    normalized.includes("out of stock") ||
    normalized.includes("product unavailable") ||
    normalized.includes("product not found") ||
    normalized.includes("plan disabled")
  ) {
    return "Ahh, sorry, that plan is not available right now. Please choose another one.";
  }

  // Duplicate Transactions
  if (normalized.includes("duplicate transaction") || normalized.includes("already processing") || normalized.includes("similar request")) {
    return "Ahh, sorry, a similar request was noticed. Please confirm before continuing.";
  }

  // Rate Limiting
  if (normalized.includes("rate limit") || normalized.includes("too many requests")) {
    return "Ahh, sorry, please wait a moment before trying again.";
  }

  // Technical Provider & API Errors
  if (TECHNICAL_PATTERNS.some((pattern) => normalized.includes(pattern))) {
    return "Ahh, sorry, we could not complete that right now. Please try again in a moment.";
  }

  // General Purchase Failures
  if (normalized.includes("purchase failed") || normalized.includes("unable to")) {
    return "Ahh, sorry, we could not complete that right now. Please try again in a moment.";
  }

  // Connection & Network
  if (normalized.includes("network") || normalized.includes("connection")) {
    return "Ahh, sorry, the connection is unstable right now. Please try again shortly.";
  }

  return message.startsWith("Ahh, sorry")
    ? message
    : `Ahh, sorry, ${message.charAt(0).toLowerCase()}${message.slice(1)}`;
}

