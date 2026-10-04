import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateWebhookSecret } from "@/lib/developer/crypto";
import { z } from "zod";

export const dynamic = "force-dynamic";

const webhookSchema = z.object({
  url: z.string().url("A valid HTTPS or HTTP URL is required."),
  events: z
    .array(z.string())
    .min(1, "Subscribe to at least one event.")
    .default(["data.success", "data.failed", "airtime.success", "airtime.failed"]),
  regenerateSecret: z.boolean().optional(),
});

/**
 * GET current webhook configuration
 */
export async function GET(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const endpoint = await prisma.developerWebhookEndpoint.findUnique({
    where: { userId: session.userId },
  });

  if (!endpoint) {
    return NextResponse.json({
      success: true,
      endpoint: null,
    });
  }

  return NextResponse.json({
    success: true,
    endpoint: {
      id: endpoint.id,
      url: endpoint.url,
      secret: endpoint.secret,
      isActive: endpoint.isActive,
      events: endpoint.events,
      failureCount: endpoint.failureCount,
      updatedAt: endpoint.updatedAt,
    },
  });
}

/**
 * POST configure / update webhook endpoint
 */
export async function POST(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = webhookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message || "Validation error" },
      { status: 400 }
    );
  }

  const { url, events, regenerateSecret } = parsed.data;

  const existing = await prisma.developerWebhookEndpoint.findUnique({
    where: { userId: session.userId },
  });

  const secret =
    !existing || regenerateSecret ? generateWebhookSecret() : existing.secret;

  const endpoint = await prisma.developerWebhookEndpoint.upsert({
    where: { userId: session.userId },
    update: {
      url,
      events,
      isActive: true,
      failureCount: 0,
      ...(regenerateSecret ? { secret } : {}),
      updatedAt: new Date(),
    },
    create: {
      userId: session.userId,
      url,
      secret,
      events,
      isActive: true,
      failureCount: 0,
    },
  });

  return NextResponse.json({
    success: true,
    endpoint: {
      id: endpoint.id,
      url: endpoint.url,
      secret: endpoint.secret,
      isActive: endpoint.isActive,
      events: endpoint.events,
    },
    message: "Webhook endpoint saved successfully.",
  });
}

/**
 * DELETE disable / remove webhook endpoint
 */
export async function DELETE(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  await prisma.developerWebhookEndpoint.deleteMany({
    where: { userId: session.userId },
  });

  return NextResponse.json({
    success: true,
    message: "Webhook endpoint deleted successfully.",
  });
}
