import { NextRequest, NextResponse } from "next/server";
import { enforceAdminMutationGuard, requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const electricitySchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    discoName: z.number().int().positive("Disco ID is required"),
    minAmount: z.number().int().min(100).default(500),
    maxAmount: z.number().int().min(100).default(50000),
    isActive: z.boolean().default(true),
  })
  .refine((data) => data.maxAmount >= data.minAmount, {
    message: "Maximum amount cannot be below minimum amount",
    path: ["maxAmount"],
  });

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const providers = await prisma.electricityProvider.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ success: true, data: providers }, { status: 200 });
  } catch (error: any) {
    console.error("[ADMIN ELECTRICITY GET ERROR]", error);
    return NextResponse.json({ success: false, error: error.message?.includes("Unauthorized") ? "Unauthorized" : "Internal server error" }, { status: error.message?.includes("Unauthorized") ? 401 : 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const originError = enforceAdminMutationGuard(req);
    if (originError) return originError;

    await requireAdmin(req);
    const data = electricitySchema.parse(await req.json());
    const provider = await prisma.electricityProvider.create({ data });
    return NextResponse.json({ success: true, data: provider }, { status: 201 });
  } catch (error: any) {
    console.error("[ADMIN ELECTRICITY CREATE ERROR]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues[0].message }, { status: 400 });
    }
    if (error.code === "P2002") {
      return NextResponse.json({ success: false, error: "That disco ID already exists." }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message?.includes("Unauthorized") ? "Unauthorized" : "Internal server error" }, { status: error.message?.includes("Unauthorized") ? 401 : 500 });
  }
}
