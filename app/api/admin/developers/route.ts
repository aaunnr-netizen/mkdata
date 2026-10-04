import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";
import { generateApiKey } from "@/lib/developer/crypto";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query")?.trim() || "";

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { apiKey: { isNot: null } },
          { apiAccessStatus: { in: ["APPROVED", "PENDING"] } },
        ],
        ...(query
          ? {
              OR: [
                { fullName: { contains: query, mode: "insensitive" } },
                { phone: { contains: query } },
                { email: { contains: query, mode: "insensitive" } },
                { apiKey: { keyPrefix: { contains: query, mode: "insensitive" } } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        tier: true,
        balance: true,
        apiAccessStatus: true,
        joinedAt: true,
        apiKey: {
          select: {
            id: true,
            keyPrefix: true,
            status: true,
            name: true,
            lastUsedAt: true,
            approvedAt: true,
            createdAt: true,
          },
        },
        webhookEndpoint: {
          select: {
            id: true,
            url: true,
            isActive: true,
            failureCount: true,
            events: true,
            updatedAt: true,
          },
        },
        _count: {
          select: {
            transactions: true,
          },
        },
      },
      orderBy: {
        joinedAt: "desc",
      },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      data: users,
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return adminErrorResponse("Unauthorized", 401);
    }
    console.error("[ADMIN DEVELOPERS GET ERROR]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch developers" }, { status: 500 });
  }
}

const actionSchema = z.object({
  userId: z.string().min(1),
  action: z.enum(["revoke_key", "enable_key", "regenerate_key", "toggle_tier", "delete_key"]),
});

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);

    const body = await req.json();
    const { userId, action } = actionSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { apiKey: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    if (action === "revoke_key") {
      if (!user.apiKey) {
        return NextResponse.json({ success: false, error: "User has no API key" }, { status: 400 });
      }
      await prisma.apiKey.update({
        where: { userId },
        data: { status: "REVOKED" },
      });
      return NextResponse.json({ success: true, message: "API key revoked successfully." });
    }

    if (action === "enable_key") {
      if (!user.apiKey) {
        return NextResponse.json({ success: false, error: "User has no API key" }, { status: 400 });
      }
      await prisma.apiKey.update({
        where: { userId },
        data: { status: "ACTIVE" },
      });
      return NextResponse.json({ success: true, message: "API key activated successfully." });
    }

    if (action === "regenerate_key") {
      const { rawKey, keyPrefix, keyHash } = generateApiKey();

      await prisma.apiKey.upsert({
        where: { userId },
        update: {
          keyPrefix,
          keyHash,
          status: "ACTIVE",
          updatedAt: new Date(),
        },
        create: {
          userId,
          keyPrefix,
          keyHash,
          status: "ACTIVE",
          name: "Admin Generated Key",
          approvedAt: new Date(),
        },
      });

      // Ensure user has agent pricing tier
      await prisma.user.update({
        where: { id: userId },
        data: { apiAccessStatus: "APPROVED", tier: "agent" },
      });

      return NextResponse.json({
        success: true,
        message: "API key regenerated successfully.",
        newKey: rawKey,
        keyPrefix,
      });
    }

    if (action === "toggle_tier") {
      const newTier = user.tier === "agent" ? "user" : "agent";
      await prisma.user.update({
        where: { id: userId },
        data: { tier: newTier },
      });
      return NextResponse.json({
        success: true,
        message: `User tier changed to ${newTier.toUpperCase()}.`,
        newTier,
      });
    }

    if (action === "delete_key") {
      await prisma.apiKey.deleteMany({
        where: { userId },
      });
      return NextResponse.json({ success: true, message: "API key removed from developer." });
    }

    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return adminErrorResponse("Unauthorized", 401);
    }
    console.error("[ADMIN DEVELOPERS ACTION ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to execute developer action" },
      { status: 500 }
    );
  }
}
