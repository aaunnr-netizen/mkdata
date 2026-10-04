import { NextRequest, NextResponse } from "next/server";
import { authenticateDeveloper } from "@/lib/developer/auth";
import { prisma } from "@/lib/db";
import { enforceRateLimit } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  const rateLimitError = enforceRateLimit(req, "developerApi");
  if (rateLimitError) return rateLimitError;

  const auth = await authenticateDeveloper(req);
  if (!auth.success) {
    return auth.response;
  }

  const { developer } = auth;
  const { reference } = await params;

  if (!reference) {
    return NextResponse.json(
      { success: false, error: "Missing transaction reference parameter." },
      { status: 400 }
    );
  }

  const cleanRef = reference.trim();

  // Search by either MK DATA reference or developer's external requestId
  const transaction = await prisma.transaction.findFirst({
    where: {
      userId: developer.id,
      OR: [
        { reference: cleanRef },
        { externalReference: cleanRef },
      ],
    },
    include: {
      plan: {
        select: {
          name: true,
          sizeLabel: true,
          network: true,
        },
      },
    },
  });

  if (!transaction) {
    return NextResponse.json(
      {
        success: false,
        error: "Transaction not found.",
        code: "TRANSACTION_NOT_FOUND",
      },
      { status: 404 }
    );
  }

  return NextResponse.json(
    {
      success: true,
      data: {
        reference: transaction.reference,
        requestId: transaction.externalReference,
        type: transaction.type,
        status: transaction.status,
        amount: transaction.amount,
        phone: transaction.phone,
        description: transaction.description,
        network: transaction.plan?.network || null,
        plan: transaction.plan?.sizeLabel || null,
        createdAt: transaction.createdAt.toISOString(),
        updatedAt: transaction.updatedAt.toISOString(),
      },
    },
    { status: 200 }
  );
}
