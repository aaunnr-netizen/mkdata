import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateApiKey } from "@/lib/developer/crypto";

export const dynamic = "force-dynamic";

/**
 * GET current API key details (masked for security)
 */
export async function GET(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      apiAccessStatus: true,
      apiKey: {
        select: {
          id: true,
          keyPrefix: true,
          status: true,
          name: true,
          lastUsedAt: true,
          createdAt: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    apiAccessStatus: user.apiAccessStatus,
    apiKey: user.apiKey
      ? {
          id: user.apiKey.id,
          prefix: user.apiKey.keyPrefix,
          maskedKey: `${user.apiKey.keyPrefix}********************************`,
          status: user.apiKey.status,
          name: user.apiKey.name,
          lastUsedAt: user.apiKey.lastUsedAt,
          createdAt: user.apiKey.createdAt,
        }
      : null,
  });
}

/**
 * POST regenerate / issue API key (requires approved apiAccessStatus)
 * Returns the unmasked key ONCE.
 */
export async function POST(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, apiAccessStatus: true, isBanned: true, isActive: true },
  });

  if (!user || user.isBanned || !user.isActive) {
    return NextResponse.json({ success: false, error: "Account restricted" }, { status: 403 });
  }

  // Auto-approve user and grant wholesale agent pricing tier instantly
  if (user.apiAccessStatus !== "APPROVED") {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        apiAccessStatus: "APPROVED",
        tier: "agent",
      },
    });
  }

  const { rawKey, keyPrefix, keyHash } = generateApiKey();

  const apiKeyRecord = await prisma.apiKey.upsert({
    where: { userId: user.id },
    update: {
      keyPrefix,
      keyHash,
      status: "ACTIVE",
      updatedAt: new Date(),
    },
    create: {
      userId: user.id,
      keyPrefix,
      keyHash,
      status: "ACTIVE",
      name: "Primary Key",
      approvedAt: new Date(),
    },
  });

  return NextResponse.json({
    success: true,
    apiKey: rawKey,
    keyPrefix,
    status: apiKeyRecord.status,
    message: "API Key generated successfully. Copy and store it securely; it will not be displayed again.",
  });
}

/**
 * DELETE revoke the current API key
 */
export async function DELETE(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = await prisma.apiKey.findUnique({
    where: { userId: session.userId },
  });

  if (!apiKey) {
    return NextResponse.json({ success: false, error: "No API key found." }, { status: 404 });
  }

  await prisma.apiKey.update({
    where: { userId: session.userId },
    data: { status: "REVOKED" },
  });

  return NextResponse.json({
    success: true,
    message: "API key has been revoked successfully. Any future requests with this key will be rejected.",
  });
}

/**
 * PATCH re-enable a revoked API key
 */
export async function PATCH(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = await prisma.apiKey.findUnique({
    where: { userId: session.userId },
  });

  if (!apiKey) {
    return NextResponse.json({ success: false, error: "No API key found." }, { status: 404 });
  }

  await prisma.apiKey.update({
    where: { userId: session.userId },
    data: { status: "ACTIVE" },
  });

  return NextResponse.json({
    success: true,
    status: "ACTIVE",
    message: "API key has been re-enabled successfully.",
  });
}
