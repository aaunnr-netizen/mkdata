import { NextRequest, NextResponse } from "next/server";
import { enforceAdminMutationGuard, requireAdmin } from "@/lib/adminAuth";
import { syncAlrahuzCatalog } from "@/lib/services-seed";

export async function POST(req: NextRequest) {
  try {
    const originError = enforceAdminMutationGuard(req);
    if (originError) return originError;

    await requireAdmin(req);
    const summary = await syncAlrahuzCatalog();

    return NextResponse.json(
      {
        success: true,
        message: "Alrahuz services catalog synchronized successfully",
        data: summary,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[ADMIN SERVICES SYNC ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message?.includes("Unauthorized")
          ? "Unauthorized"
          : error.message || "Internal server error",
      },
      { status: error.message?.includes("Unauthorized") ? 401 : 500 }
    );
  }
}
