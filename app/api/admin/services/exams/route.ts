import { NextRequest, NextResponse } from "next/server";
import { enforceAdminMutationGuard, requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const examSchema = z.object({
  examName: z.string().min(1, "Exam API name is required").transform((value) => value.trim().toUpperCase()),
  displayName: z.string().min(1, "Display name is required"),
  price: z.number().int().min(50, "Minimum price is N50"),
  maxQuantity: z.number().int().min(1).max(5).default(5),
  isActive: z.boolean().default(true),
});

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const products = await prisma.examProduct.findMany({
      orderBy: { displayName: "asc" },
    });
    return NextResponse.json({ success: true, data: products }, { status: 200 });
  } catch (error: any) {
    console.error("[ADMIN EXAMS GET ERROR]", error);
    return NextResponse.json({ success: false, error: error.message?.includes("Unauthorized") ? "Unauthorized" : "Internal server error" }, { status: error.message?.includes("Unauthorized") ? 401 : 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const originError = enforceAdminMutationGuard(req);
    if (originError) return originError;

    await requireAdmin(req);
    const data = examSchema.parse(await req.json());
    const product = await prisma.examProduct.create({ data });
    return NextResponse.json({ success: true, data: product }, { status: 201 });
  } catch (error: any) {
    console.error("[ADMIN EXAMS CREATE ERROR]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues[0].message }, { status: 400 });
    }
    if (error.code === "P2002") {
      return NextResponse.json({ success: false, error: "That exam API name already exists." }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message?.includes("Unauthorized") ? "Unauthorized" : "Internal server error" }, { status: error.message?.includes("Unauthorized") ? 401 : 500 });
  }
}
