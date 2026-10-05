import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateDeveloper } from "@/lib/developer/auth";
import { checkIdempotency, saveIdempotencyRecord } from "@/lib/developer/idempotency";
import { executeDataPurchaseForDeveloper } from "@/lib/developer/vtu-service";
import { enforceRateLimit } from "@/lib/security";

export const maxDuration = 60;

const requestSchema = z.object({
  plan_id: z.union([z.string(), z.number()]).transform((val) => String(val).trim()),
  network: z.string().optional(),
  number: z.string().optional(),
  phone: z.string().optional(),
  tx_id: z.string().min(1).max(100).optional(),
  request_id: z.string().min(1).max(100).optional(),
}).refine((data) => data.number || data.phone, {
  message: "Recipient phone number is required (pass 'number' or 'phone').",
  path: ["number"],
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

  const rawPhone = parseResult.data.number || parseResult.data.phone || "";
  let recipientPhone = rawPhone.replace(/\D/g, "");
  if (recipientPhone.startsWith("234") && recipientPhone.length === 13) {
    recipientPhone = "0" + recipientPhone.slice(3);
  } else if (recipientPhone.length === 10) {
    recipientPhone = "0" + recipientPhone;
  }

  if (!/^0[0-9]{10}$/.test(recipientPhone)) {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid recipient phone number. Must be an 11-digit Nigerian number (e.g. 08012345678).",
      },
      { status: 400 }
    );
  }

  const { plan_id, network } = parseResult.data;
  const tx_id = parseResult.data.tx_id || parseResult.data.request_id;
  const idempotencyKey = req.headers.get("idempotency-key") || tx_id;

  // 1. Check Idempotency cache
  if (idempotencyKey) {
    const cached = await checkIdempotency(developer.id, "/api/v1/data/purchase", idempotencyKey, body);
    if (cached.isCached) {
      return NextResponse.json(cached.responseBody, {
        status: cached.statusCode ?? 200,
        headers: { "X-Idempotent-Replay": "true" },
      });
    }
  }

  // 2. Execute Purchase Pipeline
  const result = await executeDataPurchaseForDeveloper({
    developer,
    planId: plan_id,
    recipientPhone,
    network,
    requestId: tx_id,
  });

  // 3. Save Idempotency
  if (idempotencyKey) {
    await saveIdempotencyRecord(
      developer.id,
      "/api/v1/data/purchase",
      idempotencyKey,
      body,
      result.statusCode,
      result.body,
      result.body.reference
    );
  }

  return NextResponse.json(result.body, { status: result.statusCode });
}
