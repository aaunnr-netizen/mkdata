import { NextRequest, NextResponse } from "next/server";
import { enforceAdminMutationGuard, requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateExamSchema = z.object({
  examName: z.string().min(1).transform((value) => value.trim().toUpperCase()).optional(),
  displayName: z.string().min(1).optional(),
  price: z.number().int().min(50).optional(),
  maxQuantity: z.number().int().min(1).max(5).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const originError = enforceAdminMutationGuard(req);
    if (originError) return originError;

    await requireAdmin(req);
    const { id } = await params;
    const data = updateExamSchema.parse(await req.json());
    const product = await prisma.examProduct.update({ where: { id }, data });
    return NextResponse.json({ success: true, data: product }, { status: 200 });
  } catch (error: any) {
    console.error("[ADMIN EXAM UPDATE ERROR]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues[0].message }, { status: 400 });
    }
    if (error.code === "P2002") {
      return NextResponse.json({ success: false, error: "That exam API name already exists." }, { status: 400 });
    }
    if (error.code === "P2025") {
      return NextResponse.json({ success: false, error: "Exam product not found" }, { status: 404 });
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
    await prisma.examProduct.delete({ where: { id } });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("[ADMIN EXAM DELETE ERROR]", error);
    if (error.code === "P2025") {
      return NextResponse.json({ success: false, error: "Exam product not found" }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: error.message?.includes("Unauthorized") ? "Unauthorized" : "Internal server error" }, { status: error.message?.includes("Unauthorized") ? 401 : 500 });
  }
}
