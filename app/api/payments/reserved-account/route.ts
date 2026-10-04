import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { enforceRateLimit, rejectCrossSiteMutation } from "@/lib/security";
import { BillstackBank, createBillstackBankAccount, listUserBankAccounts, provisionSignupBillstackAccount } from "@/lib/billstack-account";

const requestSchema = z.object({
  bank: z.enum(["9PSB", "SAFEHAVEN", "PROVIDUS", "BANKLY", "PALMPAY"]).optional(),
  email: z.string().email().optional(),
  force: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const accounts = await listUserBankAccounts(sessionUser.userId);
    const primary = accounts.find((item) => item.isPrimary) || accounts[0];

    if (primary) {
      return NextResponse.json({
        success: true,
        data: {
          accountNumber: primary.accountNumber,
          bankName: primary.bankName,
          bankCode: primary.bankCode,
          merchantReference: primary.merchantReference,
          createdAt: primary.createdAt,
        },
      });
    }

    // Check legacy virtual_accounts table in database
    const legacyAccount = await prisma.virtualAccount.findUnique({
      where: { userId: sessionUser.userId },
    });

    if (legacyAccount) {
      return NextResponse.json({
        success: true,
        data: {
          accountNumber: legacyAccount.accountNumber,
          bankName: legacyAccount.bankName,
          bankCode: "LEGACY",
          merchantReference: legacyAccount.orderRef,
          createdAt: legacyAccount.createdAt,
        },
      });
    }

    // Auto-provision on the fly so the user has an immediate funding account
    const user = await prisma.user.findUnique({
      where: { id: sessionUser.userId },
      select: { id: true, fullName: true, phone: true, email: true },
    });

    if (user) {
      const provisioned = await provisionSignupBillstackAccount({
        userId: user.id,
        fullName: user.fullName,
        phone: user.phone,
        email: user.email,
      });

      if (provisioned.success && provisioned.account) {
        return NextResponse.json({
          success: true,
          data: {
            accountNumber: provisioned.account.accountNumber,
            bankName: provisioned.account.bankName,
            bankCode: provisioned.account.bankCode,
            merchantReference: provisioned.account.merchantReference,
            createdAt: provisioned.account.createdAt,
          },
        });
      }
    }

    return NextResponse.json({ success: false, error: "Reserved account not found" }, { status: 404 });
  } catch (error) {
    console.error("[BILLSTACK RESERVED ACCOUNT GET ERROR]", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const originError = rejectCrossSiteMutation(req, { requireOrigin: true });
    if (originError) return originError;

    const rateLimitError = enforceRateLimit(req, "webhook", "billstack-reserved-account");
    if (rateLimitError) return rateLimitError;

    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionUser.userId },
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = requestSchema.parse(body);
    const bank = (parsed.bank || "PALMPAY") as BillstackBank;
    const email = parsed.email || user.email || undefined;

    const result = await createBillstackBankAccount({
      userId: user.id,
      fullName: user.fullName,
      phone: user.phone,
      email,
      bank,
      makePrimary: true,
    });

    if (!result.created && !parsed.force) {
      return NextResponse.json({
        success: true,
        message: "Reserved account already exists for this bank",
        data: result.account,
      });
    }

    if (!result.created && parsed.force) {
      return NextResponse.json(
        { success: false, error: "Force recreate is not supported for existing bank account. Choose another bank." },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Reserved account created successfully",
      data: result.account,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Could not create reserved account right now";
    const statusCode =
      typeof error === "object" &&
      error !== null &&
      "statusCode" in error &&
      typeof (error as { statusCode?: unknown }).statusCode === "number"
        ? (error as { statusCode: number }).statusCode
        : 500;

    console.error("[BILLSTACK RESERVED ACCOUNT POST ERROR]", {
      message,
      name: error instanceof Error ? error.name : "UnknownError",
      statusCode,
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues[0]?.message || "Invalid payload" }, { status: 400 });
    }

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: statusCode }
    );
  }
}

