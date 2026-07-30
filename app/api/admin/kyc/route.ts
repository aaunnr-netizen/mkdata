import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { z } from "zod";

async function verifyAdminAccess(req: NextRequest) {
  const adminCookie = req.cookies.get("mkdata_admin_session")?.value;
  if (!adminCookie) {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser || sessionUser.role !== "ADMIN") {
      return false;
    }
  }
  return true;
}

const actionSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  action: z.enum(["APPROVE", "REJECT"]),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const isAdmin = await verifyAdminAccess(req);
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: "Unauthorized admin access" }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      where: {
        kycStatus: { in: ["PENDING", "APPROVED", "REJECTED"] },
      },
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        role: true,
        tier: true,
        kycStatus: true,
        kycDetails: true,
        kycSubmittedAt: true,
        joinedAt: true,
      },
      orderBy: { kycSubmittedAt: "desc" },
    });

    const formattedUsers = users.map((u) => {
      let parsedDetails = null;
      try {
        if (u.kycDetails) parsedDetails = JSON.parse(u.kycDetails);
      } catch {
        parsedDetails = { raw: u.kycDetails };
      }

      return {
        ...u,
        kycDetailsParsed: parsedDetails,
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedUsers,
    });
  } catch (error) {
    console.error("[ADMIN KYC GET ERROR]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const isAdmin = await verifyAdminAccess(req);
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: "Unauthorized admin access" }, { status: 401 });
    }

    const body = await req.json();
    const { userId, action } = actionSchema.parse(body);

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const newStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        kycStatus: newStatus,
      },
      select: {
        id: true,
        fullName: true,
        phone: true,
        kycStatus: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `User KYC marked as ${newStatus}. ${action === "APPROVE" ? "All purchase rate limit guards are now bypassed for this user." : ""}`,
      data: updatedUser,
    });
  } catch (error) {
    console.error("[ADMIN KYC POST ERROR]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
