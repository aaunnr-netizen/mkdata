import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function checkPurchaseGuards({
  userId,
  recipientPhone,
  kycStatus,
}: {
  userId: string;
  recipientPhone: string;
  kycStatus?: string | null;
}) {
  // If user is KYC APPROVED, bypass ALL guards ("if user get approved, there is no gyards whatsoever.")
  if (kycStatus === "APPROVED") {
    return null;
  }

  // If user is locked (kycStatus === "PENDING" or "REQUIRED" or "REJECTED")
  if (kycStatus === "PENDING" || kycStatus === "REQUIRED") {
    return NextResponse.json(
      {
        success: false,
        error: "App locked. Admin KYC review and approval is required.",
        requiresKyc: true,
        kycStatus: kycStatus || "PENDING",
      },
      { status: 403 }
    );
  }

  const now = new Date();
  const ONE_MINUTE_AGO = new Date(now.getTime() - 60 * 1000);
  const TWO_MINUTES_AGO = new Date(now.getTime() - 2 * 60 * 1000);

  // Guard 1: 1 purchase per number per minute (60s)
  const recentPhoneTx = await prisma.transaction.findFirst({
    where: {
      phone: recipientPhone,
      createdAt: { gte: ONE_MINUTE_AGO },
      status: { in: ["PENDING", "SUCCESS"] },
    },
  });

  if (recentPhoneTx) {
    return NextResponse.json(
      {
        success: false,
        error: "Rate limit: Only 1 purchase per phone number per minute allowed.",
      },
      { status: 429 }
    );
  }

  // Guard 2: 3 general purchases in 2 minutes (120s) -> Lock app and require Admin KYC
  const recentUserTxCount = await prisma.transaction.count({
    where: {
      userId,
      createdAt: { gte: TWO_MINUTES_AGO },
      status: { in: ["PENDING", "SUCCESS"] },
    },
  });

  if (recentUserTxCount >= 2) {
    // Exceeding threshold -> Lock user app state requiring Admin KYC
    await prisma.user.update({
      where: { id: userId },
      data: {
        kycStatus: "PENDING",
        kycSubmittedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        success: false,
        error: "Security Lock: 3 purchases detected in 2 minutes. Your app is locked and requires Admin KYC approval.",
        requiresKyc: true,
        kycStatus: "PENDING",
      },
      { status: 403 }
    );
  }

  return null;
}
