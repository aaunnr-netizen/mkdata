import { NextRequest, NextResponse } from "next/server";
import { enforceAdminMutationGuard, requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateProviderSchema = z.object({
  name: z.string().min(1).optional(),
  cablename: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const originError = enforceAdminMutationGuard(req);
    if (originError) return originError;

    await requireAdmin(req);
    const { id } = await params;
    const data = updateProviderSchema.parse(await req.json());
    const provider = await prisma.cableProvider.update({ where: { id }, data });
    return NextResponse.json({ success: true, data: provider }, { status: 200 });
  } catch (error: any) {
    console.error("[ADMIN CABLE PROVIDER UPDATE ERROR]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues[0].message }, { status: 400 });
    }
    if (error.code === "P2002") {
      return NextResponse.json({ success: false, error: "That cable provider ID already exists." }, { status: 400 });
    }
    if (error.code === "P2025") {
      return NextResponse.json({ success: false, error: "Cable provider not found" }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: error.message?.includes("Unauthorized") ? "Unauthorized" : "Internal server error" }, { status: error.message?.includes("Unauthorized") ? 401 : 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const originError = enforceAdminMutationGuard(req);
    if (originError) return originError;

    await requireAdmin(req);
    const { id } = await params;
    await prisma.cableProvider.delete({ where: { id } });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("[ADMIN CABLE PROVIDER DELETE ERROR]", error);
    if (error.code === "P2025") {
      return NextResponse.json({ success: false, error: "Cable provider not found" }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: error.message?.includes("Unauthorized") ? "Unauthorized" : "Internal server error" }, { status: error.message?.includes("Unauthorized") ? 401 : 500 });
  }
}
