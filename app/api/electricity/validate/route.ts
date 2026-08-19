import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { validateMeter } from "@/lib/alrahuz";
import { getFriendlyMessage } from "@/lib/user-feedback";
import { enforceRateLimit } from "@/lib/security";

const validateSchema = z.object({
  meterNumber: z.string().min(5, "Enter meter number").max(30),
  providerId: z.string().optional(),
  discoName: z.number().int().optional(),
  meterType: z.union([z.literal("prepaid"), z.literal("postpaid"), z.literal(1), z.literal(2)]).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const rateLimitError = enforceRateLimit(req, "publicApi", "/api/electricity/validate");
    if (rateLimitError) return rateLimitError;

    const { meterNumber, providerId, discoName, meterType = "prepaid" } = validateSchema.parse(await req.json());

    let numericDiscoName = discoName;

    if (!numericDiscoName && providerId) {
      const provider = await prisma.electricityProvider.findUnique({
        where: { id: providerId },
        select: { discoName: true },
      });
      if (provider) {
        numericDiscoName = provider.discoName;
      }
    }

    if (!numericDiscoName) {
      return NextResponse.json(
        { success: false, error: "Please select an electricity provider." },
        { status: 400 }
      );
    }

    const result = await validateMeter({
      meterNumber,
      disconame: numericDiscoName,
      meterType,
    });

    if (!result.success || !result.valid) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          error: getFriendlyMessage(result.message, "Could not verify meter number. Please check and try again."),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        valid: true,
        customerName: result.customerName,
        address: result.address,
        message: result.message,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[ELECTRICITY VALIDATE ERROR]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: getFriendlyMessage(error.issues[0]?.message, "Invalid meter details") },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Ahh, sorry, we could not verify that meter number right now." },
      { status: 500 }
    );
  }
}
