import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateDeveloper } from "@/lib/developer/auth";
import { checkIdempotency, saveIdempotencyRecord } from "@/lib/developer/idempotency";
import { executeAirtimePurchaseForDeveloper } from "@/lib/developer/vtu-service";
import { enforceRateLimit } from "@/lib/security";

export const maxDuration = 60;

const requestSchema = z.object({
  network: z.enum(["mtn", "glo", "airtel", "9mobile", "MTN", "GLO", "AIRTEL", "9MOBILE"], {
    message: "network must be one of: mtn, glo, airtel, 9mobile",
  }),
  amount: z.number().min(50, "Minimum airtime purchase is ₦50").max(50000, "Maximum airtime purchase is ₦50,000"),
  phone: z.string().regex(/^0[0-9]{10}$/, "phone must be an 11-digit Nigerian number starting with 0"),
  request_id: z.string().min(1).max(100).optional(),
});

export async function POST(req: NextRequest) {
  const rateLimitError = enforceRateLimit(req, "developerApi");
  if (rateLimitError) return rateLimitError;

  const auth = await authenticateDeveloper(req);
  if (!auth.success) {
    return auth.response;
  }

  const { developer } = auth;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON request body." },
      { status: 400 }
    );
  }

  const parseResult = requestSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Validation failed.",
        details: parseResult.error.format(),
      },
      { status: 400 }
    );
  }

  const { network, amount, phone, request_id } = parseResult.data;
  const idempotencyKey = req.headers.get("idempotency-key") || request_id;

  // 1. Check Idempotency cache
  if (idempotencyKey) {
    const cached = await checkIdempotency(developer.id, "/api/v1/airtime/purchase", idempotencyKey, body);
    if (cached.isCached) {
      return NextResponse.json(cached.responseBody, {
        status: cached.statusCode ?? 200,
        headers: { "X-Idempotent-Replay": "true" },
      });
    }
  }

  // 2. Execute Purchase Pipeline
  const result = await executeAirtimePurchaseForDeveloper({
    developer,
    network: network.toLowerCase(),
    amount,
    recipientPhone: phone,
    requestId: request_id,
  });

  // 3. Save Idempotency
  if (idempotencyKey) {
    await saveIdempotencyRecord(
      developer.id,
      "/api/v1/airtime/purchase",
      idempotencyKey,
      body,
      result.statusCode,
      result.body,
      result.body.reference
    );
  }

  return NextResponse.json(result.body, { status: result.statusCode });
}
