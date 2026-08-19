import { NextRequest, NextResponse } from "next/server";
import { queryCableSub } from "@/lib/alrahuz";
import { enforceRateLimit } from "@/lib/security";
import { getFriendlyMessage } from "@/lib/user-feedback";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimitError = enforceRateLimit(req, "publicApi", "/api/cable/query");
    if (rateLimitError) return rateLimitError;

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ success: false, error: "Missing subscription ID" }, { status: 400 });
    }

    const result = await queryCableSub(id);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: getFriendlyMessage(result.message, "Could not query cable subscription.") },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: result.message, data: result.raw }, { status: 200 });
  } catch (error) {
    console.error("[CABLE QUERY ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Ahh, sorry, we could not query that cable subscription right now." },
      { status: 500 }
    );
  }
}
