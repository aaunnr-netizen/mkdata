import { NextRequest, NextResponse } from "next/server";
import { authenticateDeveloper } from "@/lib/developer/auth";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { signWebhookPayload } from "@/lib/developer/crypto";
import { enforceRateLimit } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const rateLimitError = enforceRateLimit(req, "developerApi");
  if (rateLimitError) return rateLimitError;

  let developerId: string | null = null;
  const auth = await authenticateDeveloper(req);
  if (auth.success) {
    developerId = auth.developer.id;
  } else {
    const session = await getSessionUser(req);
    if (session) {
      developerId = session.userId;
    }
  }

  if (!developerId) {
    return NextResponse.json({ success: false, error: "Unauthorized. Provide API key or log in." }, { status: 401 });
  }

  const endpoint = await prisma.developerWebhookEndpoint.findUnique({
    where: { userId: developerId },
  });

  if (!endpoint || !endpoint.url) {
    return NextResponse.json(
      {
        success: false,
        error: "No webhook endpoint registered for your account. Configure one in your dashboard settings.",
        code: "WEBHOOK_ENDPOINT_NOT_CONFIGURED",
      },
      { status: 400 }
    );
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const testPayload = {
    id: `evt_test_${Date.now()}`,
    event: "test.ping",
    created_at: new Date().toISOString(),
    data: {
      message: "Hello from MK DATA Developer Webhook Pipeline! Signature verification successful.",
      developer_id: developerId,
      timestamp,
    },
  };

  const payloadString = JSON.stringify(testPayload);
  const signatureHeader = signWebhookPayload(endpoint.secret, timestamp, payloadString);

  const startTime = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7000);

  try {
    const res = await fetch(endpoint.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "MKData-Webhook-Test/1.0",
        "X-MK-Signature": signatureHeader,
        "X-MK-Event": "test.ping",
      },
      body: payloadString,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;
    const responseText = await res.text().catch(() => "");

    const isSuccess = res.status >= 200 && res.status < 300;

    await prisma.developerWebhookDelivery.create({
      data: {
        endpointId: endpoint.id,
        userId: developerId,
        event: "test.ping",
        payload: testPayload as any,
        status: isSuccess ? "SUCCESS" : "FAILED",
        responseCode: res.status,
        responseBody: responseText.slice(0, 500),
        attempts: 1,
      },
    });

    return NextResponse.json(
      {
        success: isSuccess,
        statusCode: res.status,
        latencyMs,
        targetUrl: endpoint.url,
        signatureHeader,
        responseSnippet: responseText.slice(0, 200),
      },
      { status: 200 }
    );
  } catch (err: any) {
    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;
    const isTimeout = err.name === "AbortError";

    await prisma.developerWebhookDelivery.create({
      data: {
        endpointId: endpoint.id,
        userId: developerId,
        event: "test.ping",
        payload: testPayload as any,
        status: "FAILED",
        responseCode: isTimeout ? 504 : 500,
        responseBody: isTimeout ? "Delivery timed out after 7s" : err.message,
        attempts: 1,
      },
    });

    return NextResponse.json(
      {
        success: false,
        error: isTimeout ? "Delivery timed out after 7 seconds." : err.message,
        latencyMs,
        targetUrl: endpoint.url,
      },
      { status: 502 }
    );
  }
}
