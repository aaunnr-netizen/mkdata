import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { z } from "zod";

const tokenSchema = z.object({
  token: z.string().min(10, "FCM token is too short or invalid"),
});

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = tokenSchema.parse(body);

    // Register or re-assign the token to the logged-in user
    const fcmToken = await prisma.userFcmToken.upsert({
      where: { token: parsed.token },
      create: {
        token: parsed.token,
        userId: sessionUser.userId,
      },
      update: {
        userId: sessionUser.userId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "FCM token registered successfully",
      data: { id: fcmToken.id },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues[0]?.message || "Invalid token payload" }, { status: 400 });
    }
    console.error("[FCM TOKEN REGISTRATION ERROR]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
