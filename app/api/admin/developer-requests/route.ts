import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";
import { generateApiKey } from "@/lib/developer/crypto";
import { z } from "zod";

export const dynamic = "force-dynamic";

const actionSchema = z.object({
  userId: z.string().min(1, "userId is required"),
  action: z.enum(["APPROVE", "REJECT"]),
  rejectionReason: z.string().optional(),
});

/**
 * GET list of developer API requests (filtered by status)
 */
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
  } catch {
    return adminErrorResponse("Unauthorized", 401);
  }

  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get("status") || "PENDING";

  const users = await prisma.user.findMany({
    where: {
      ...(statusFilter === "ALL" ? {} : { apiAccessStatus: statusFilter }),
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      fullName: true,
      phone: true,
      email: true,
      role: true,
      tier: true,
      balance: true,
      apiAccessStatus: true,
      joinedAt: true,
      apiKey: {
        select: {
          id: true,
          keyPrefix: true,
          status: true,
          requestReason: true,
          approvedAt: true,
          lastUsedAt: true,
          createdAt: true,
        },
      },
    },
  });

  return NextResponse.json({
    success: true,
    count: users.length,
    users: users.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      phone: u.phone,
      email: u.email,
      role: u.role,
      tier: u.tier,
      balance: u.balance / 100, // Naira
      apiAccessStatus: u.apiAccessStatus,
      requestReason: u.apiKey?.requestReason || null,
      keyPrefix: u.apiKey?.keyPrefix || null,
      keyStatus: u.apiKey?.status || null,
      approvedAt: u.apiKey?.approvedAt || null,
      lastUsedAt: u.apiKey?.lastUsedAt || null,
    })),
  });
}

/**
 * POST approve or reject developer API access
 */
export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
  } catch {
    return adminErrorResponse("Unauthorized", 401);
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return adminErrorResponse("Invalid JSON payload", 400);
  }

  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return adminErrorResponse(parsed.error.issues[0]?.message || "Validation failed", 400);
  }

  const { userId, action, rejectionReason } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { apiKey: true },
  });

  if (!user) {
    return adminErrorResponse("User not found", 404);
  }

  if (action === "REJECT") {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { apiAccessStatus: "REJECTED" },
      });

      if (user.apiKey) {
        await tx.apiKey.update({
          where: { id: user.apiKey.id },
          data: {
            status: "REJECTED",
            requestReason: rejectionReason || user.apiKey.requestReason,
          },
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: "Developer API request rejected successfully.",
    });
  }

  // APPROVE: Generate live API key
  const { rawKey, keyPrefix, keyHash } = generateApiKey();

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { apiAccessStatus: "APPROVED" },
    });

    await tx.apiKey.upsert({
      where: { userId },
      update: {
        keyPrefix,
        keyHash,
        status: "ACTIVE",
        approvedAt: new Date(),
        updatedAt: new Date(),
      },
      create: {
        userId,
        name: "Primary Key",
        keyPrefix,
        keyHash,
        status: "ACTIVE",
        approvedAt: new Date(),
      },
    });
  });

  return NextResponse.json({
    success: true,
    message: "Developer API access approved successfully. Live API key generated.",
    apiKey: rawKey,
    keyPrefix,
  });
}
