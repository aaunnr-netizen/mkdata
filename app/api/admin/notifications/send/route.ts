import { NextRequest, NextResponse } from "next/server";
import { enforceAdminMutationGuard, requireAdmin } from "@/lib/adminAuth";
import { sendPushNotificationToAll } from "@/lib/firebase";
import { z } from "zod";

const sendSchema = z.object({
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Notification body is required"),
});

export async function POST(req: NextRequest) {
  try {
    const originError = enforceAdminMutationGuard(req);
    if (originError) return originError;

    await requireAdmin(req);

    const json = await req.json();
    const { title, body } = sendSchema.parse(json);

    const result = await sendPushNotificationToAll(title, body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: "Failed to send notification via Firebase" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully broadcasted notification to ${result.sentCount} devices.`,
      sentCount: result.sentCount,
    });
  } catch (error) {
    console.error("[ADMIN SEND NOTIFICATIONS ERROR]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues[0].message }, { status: 400 });
    }
    // Check if requireAdmin thrown error (could be unauthorized)
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
