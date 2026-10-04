import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const requestSchema = z.object({
  reason: z.string().min(5, "Please explain your use case or platform (at least 5 characters)."),
  platformName: z.string().min(2, "Platform/App name is required.").optional(),
});

export const dynamic = "force-dynamic";

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
          requestReason: true,
          approvedAt: true,
          createdAt: true,
          lastUsedAt: true,
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
    keyDetails: user.apiKey,
  });
}

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

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message || "Validation error" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, apiAccessStatus: true, isBanned: true, isActive: true },
  });

  if (!user || user.isBanned || !user.isActive) {
    return NextResponse.json({ success: false, error: "Account restricted" }, { status: 403 });
  }

  if (user.apiAccessStatus === "APPROVED") {
    return NextResponse.json(
      { success: false, error: "API access is already approved for your account." },
      { status: 400 }
    );
  }

  const fullReason = parsed.data.platformName
    ? `Platform: ${parsed.data.platformName} | Use Case: ${parsed.data.reason}`
    : parsed.data.reason;

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: { apiAccessStatus: "PENDING" },
    });

    // Check if an apiKey record already exists
    const existingKey = await tx.apiKey.findUnique({
      where: { userId: user.id },
    });

    if (existingKey) {
      await tx.apiKey.update({
        where: { userId: user.id },
        data: {
          status: "PENDING",
          requestReason: fullReason,
        },
      });
    }
  });

  return NextResponse.json({
    success: true,
    message: "API access request submitted successfully. Administrator approval is pending.",
    status: "PENDING",
  });
}
