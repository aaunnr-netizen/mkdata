import { NextRequest, NextResponse } from "next/server";
import { enforceAdminMutationGuard, requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updatePlanSchema = z.object({
  providerId: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  cableplan: z.number().int().positive().optional(),
  price: z.number().int().min(50).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const originError = enforceAdminMutationGuard(req);
    if (originError) return originError;

    await requireAdmin(req);
    const { id } = await params;
    const data = updatePlanSchema.parse(await req.json());
    const plan = await prisma.cablePlan.update({ where: { id }, data, include: { provider: true } });
    return NextResponse.json({ success: true, data: plan }, { status: 200 });
  } catch (error: any) {
    console.error("[ADMIN CABLE PLAN UPDATE ERROR]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues[0].message }, { status: 400 });
    }
    if (error.code === "P2002") {
      return NextResponse.json({ success: false, error: "That cable plan ID already exists for this provider." }, { status: 400 });
    }
    if (error.code === "P2025") {
      return NextResponse.json({ success: false, error: "Cable plan not found" }, { status: 404 });
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
    await prisma.cablePlan.delete({ where: { id } });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("[ADMIN CABLE PLAN DELETE ERROR]", error);
    if (error.code === "P2025") {
      return NextResponse.json({ success: false, error: "Cable plan not found" }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: error.message?.includes("Unauthorized") ? "Unauthorized" : "Internal server error" }, { status: error.message?.includes("Unauthorized") ? 401 : 500 });
  }
}
