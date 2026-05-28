import crypto from "crypto";

export const BIOMETRIC_TOKEN_TTL_DAYS = 180;

export function generateBiometricToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export function hashBiometricToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function getBiometricTokenExpiry() {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + BIOMETRIC_TOKEN_TTL_DAYS);
  return expiresAt;
}
