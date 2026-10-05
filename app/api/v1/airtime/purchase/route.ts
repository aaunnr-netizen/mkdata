import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateDeveloper } from "@/lib/developer/auth";
import { checkIdempotency, saveIdempotencyRecord } from "@/lib/developer/idempotency";
import { executeAirtimePurchaseForDeveloper } from "@/lib/developer/vtu-service";
import { enforceRateLimit } from "@/lib/security";

export const maxDuration = 60;

function normalizeAirtimeNetwork(network: string | number): "mtn" | "glo" | "airtel" | "9mobile" {
  const val = String(network).trim().toLowerCase();
  if (val === "1" || val === "mtn") return "mtn";
  if (val === "2" || val === "glo") return "glo";
  if (val === "3" || val === "airtel") return "airtel";
  if (val === "4" || val === "9mobile" || val === "ninemobile") return "9mobile";
  return val as any;
}

const requestSchema = z.object({
  network: z.union([z.number(), z.string()]).refine((val) => {
    const s = String(val).trim().toLowerCase();
    return ["1", "2", "3", "4", "mtn", "glo", "airtel", "9mobile", "ninemobile"].includes(s);
  }, { message: "network must be 1 (MTN), 2 (GLO), 3 (AIRTEL), or 4 (9MOBILE)" }),
  amount: z.number().min(50, "Minimum airtime purchase is ₦50").max(50000, "Maximum airtime purchase is ₦50,000"),
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

  const normalizedNet = normalizeAirtimeNetwork(parseResult.data.network);
  const tx_id = parseResult.data.tx_id || parseResult.data.request_id;
  const idempotencyKey = req.headers.get("idempotency-key") || tx_id;

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
    network: normalizedNet,
    amount: parseResult.data.amount,
    recipientPhone,
    requestId: tx_id,
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
