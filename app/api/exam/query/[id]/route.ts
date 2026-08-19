import { NextRequest, NextResponse } from "next/server";
import { queryExamPin } from "@/lib/alrahuz";
import { enforceRateLimit } from "@/lib/security";
import { getFriendlyMessage } from "@/lib/user-feedback";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimitError = enforceRateLimit(req, "publicApi", "/api/exam/query");
    if (rateLimitError) return rateLimitError;

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ success: false, error: "Missing exam PIN reference" }, { status: 400 });
    }

    const result = await queryExamPin(id);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: getFriendlyMessage(result.message, "Could not query exam PIN.") },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: result.message,
        pin: result.pin,
        data: result.raw,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[EXAM QUERY ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Ahh, sorry, we could not query that exam PIN right now." },
      { status: 500 }
    );
  }
}
