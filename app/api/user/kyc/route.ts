import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { z } from "zod";

const kycSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  ninOrId: z.string().min(5, "NIN or ID number is required"),
  idType: z.string().optional(),
  additionalInfo: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { fullName, ninOrId, idType = "NIN", additionalInfo = "" } = kycSchema.parse(body);

    const kycDetailsString = JSON.stringify({
      fullName,
      ninOrId,
      idType,
      additionalInfo,
      submittedAt: new Date().toISOString(),
    });

    const updatedUser = await prisma.user.update({
      where: { id: sessionUser.userId },
      data: {
        kycStatus: "PENDING",
        kycDetails: kycDetailsString,
        kycSubmittedAt: new Date(),
      },
      select: {
        id: true,
        phone: true,
        fullName: true,
        kycStatus: true,
        kycSubmittedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "KYC details submitted successfully. Awaiting Admin review and approval.",
      data: updatedUser,
    });
  } catch (error) {
    console.error("[USER KYC SUBMIT ERROR]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionUser.userId },
      select: {
        id: true,
        kycStatus: true,
        kycDetails: true,
        kycSubmittedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        kycStatus: user.kycStatus || "NONE",
        kycDetails: user.kycDetails ? JSON.parse(user.kycDetails) : null,
        kycSubmittedAt: user.kycSubmittedAt,
      },
    });
  } catch (error) {
    console.error("[USER KYC GET ERROR]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
