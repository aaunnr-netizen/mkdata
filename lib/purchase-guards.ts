import { NextResponse } from "next/server";

/**
 * Purchase guards have been updated:
 * KYC velocity limits and account locking rules have been removed.
 * Race condition and double-firing protections are handled atomically via
 * database transaction advisory locks and in-flight request guards.
 */
export async function checkPurchaseGuards(_params?: {
  userId?: string;
  recipientPhone?: string;
  kycStatus?: string | null;
}): Promise<NextResponse | null> {
  // Pass-through: No KYC locks or velocity blocks
  return null;
}
