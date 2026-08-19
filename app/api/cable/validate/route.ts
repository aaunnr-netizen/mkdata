import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { validateIUC } from "@/lib/alrahuz";
import { getFriendlyMessage } from "@/lib/user-feedback";
import { enforceRateLimit } from "@/lib/security";

const validateSchema = z.object({
  smartCardNumber: z.string().min(5, "Enter smart card number").max(30),
  providerId: z.string().optional(),
  cablename: z.number().int().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const rateLimitError = enforceRateLimit(req, "publicApi", "/api/cable/validate");
    if (rateLimitError) return rateLimitError;

    const { smartCardNumber, providerId, cablename } = validateSchema.parse(await req.json());

    let numericCablename = cablename;

    if (!numericCablename && providerId) {
      const provider = await prisma.cableProvider.findUnique({
        where: { id: providerId },
        select: { cablename: true },
      });
      if (provider) {
        numericCablename = provider.cablename;
      }
    }

    if (!numericCablename) {
      return NextResponse.json(
        { success: false, error: "Please select a cable provider." },
        { status: 400 }
      );
    }

    const result = await validateIUC({
      smartCardNumber,
      cablename: numericCablename,
    });

    if (!result.success || !result.valid) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          error: getFriendlyMessage(result.message, "Could not verify smart card number. Please check and try again."),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        valid: true,
        customerName: result.customerName,
        message: result.message,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[CABLE VALIDATE ERROR]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: getFriendlyMessage(error.issues[0]?.message, "Invalid smart card details") },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Ahh, sorry, we could not verify that smart card right now." },
      { status: 500 }
    );
  }
}
