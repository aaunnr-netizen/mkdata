import { NextRequest, NextResponse } from "next/server";
import { authenticateDeveloper } from "@/lib/developer/auth";
import { enforceRateLimit } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const rateLimitError = enforceRateLimit(req, "developerApi");
  if (rateLimitError) return rateLimitError;

  const auth = await authenticateDeveloper(req);
  if (!auth.success) {
    return auth.response;
  }

  const { developer } = auth;

  return NextResponse.json(
    {
      success: true,
      data: {
        userId: developer.id,
        fullName: developer.fullName,
        currency: "NGN",
        balance: developer.balance / 100, // Naira
        balanceKobo: developer.balance,
        pricingTier: "agent", // Wholesale agent rate guaranteed for API
      },
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
