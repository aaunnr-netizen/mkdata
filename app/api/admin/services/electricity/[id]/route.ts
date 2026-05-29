import { NextRequest, NextResponse } from "next/server";
import { enforceAdminMutationGuard, requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateElectricitySchema = z
  .object({
    name: z.string().min(1).optional(),
    discoName: z.number().int().positive().optional(),
    minAmount: z.number().int().min(100).optional(),
    maxAmount: z.number().int().min(100).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => data.minAmount === undefined || data.maxAmount === undefined || data.maxAmount >= data.minAmount, {
    message: "Maximum amount cannot be below minimum amount",
    path: ["maxAmount"],
  });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const originError = enforceAdminMutationGuard(req);
    if (originError) return originError;

    await requireAdmin(req);
    const { id } = await params;
    const data = updateElectricitySchema.parse(await req.json());
    const current = await prisma.electricityProvider.findUnique({ where: { id } });

    if (!current) {
      return NextResponse.json({ success: false, error: "Electricity provider not found" }, { status: 404 });
    }

    const minAmount = data.minAmount ?? current.minAmount;
    const maxAmount = data.maxAmount ?? current.maxAmount;
    if (maxAmount < minAmount) {
      return NextResponse.json({ success: false, error: "Maximum amount cannot be below minimum amount" }, { status: 400 });
    }

    const provider = await prisma.electricityProvider.update({ where: { id }, data });
    return NextResponse.json({ success: true, data: provider }, { status: 200 });
  } catch (error: any) {
    console.error("[ADMIN ELECTRICITY UPDATE ERROR]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues[0].message }, { status: 400 });
    }
    if (error.code === "P2002") {
      return NextResponse.json({ success: false, error: "That disco ID already exists." }, { status: 400 });
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
    await prisma.electricityProvider.delete({ where: { id } });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("[ADMIN ELECTRICITY DELETE ERROR]", error);
    return NextResponse.json({ success: false, error: error.message?.includes("Unauthorized") ? "Unauthorized" : "Internal server error" }, { status: error.message?.includes("Unauthorized") ? 401 : 500 });
  }
}
