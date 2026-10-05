import { NextRequest, NextResponse } from "next/server";
import { clearAdminSessionCookie, clearUserSessionCookie } from "@/lib/auth";
import { rejectCrossSiteMutation } from "@/lib/security";

export async function POST(req: NextRequest) {
  const originError = rejectCrossSiteMutation(req, { requireOrigin: false });
  if (originError) return originError;

  const response = NextResponse.json({ success: true, message: "Logged out successfully" });
  clearUserSessionCookie(response);
  clearAdminSessionCookie(response);
  return response;
}
