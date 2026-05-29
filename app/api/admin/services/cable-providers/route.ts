import { NextRequest, NextResponse } from "next/server";
import { enforceAdminMutationGuard, requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const providerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  cablename: z.number().int().positive("Cable provider ID is required"),
  isActive: z.boolean().default(true),
});

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const providers = await prisma.cableProvider.findMany({
      orderBy: { name: "asc" },
      include: { plans: { orderBy: { price: "asc" } } },
    });
    return NextResponse.json({ success: true, data: providers }, { status: 200 });
  } catch (error: any) {
    console.error("[ADMIN CABLE PROVIDERS GET ERROR]", error);
    return NextResponse.json({ success: false, error: error.message?.includes("Unauthorized") ? "Unauthorized" : "Internal server error" }, { status: error.message?.includes("Unauthorized") ? 401 : 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const originError = enforceAdminMutationGuard(req);
    if (originError) return originError;

    await requireAdmin(req);
    const data = providerSchema.parse(await req.json());
    const provider = await prisma.cableProvider.create({ data });
    return NextResponse.json({ success: true, data: provider }, { status: 201 });
  } catch (error: any) {
    console.error("[ADMIN CABLE PROVIDERS CREATE ERROR]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues[0].message }, { status: 400 });
    }
    if (error.code === "P2002") {
      return NextResponse.json({ success: false, error: "That cable provider ID already exists." }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message?.includes("Unauthorized") ? "Unauthorized" : "Internal server error" }, { status: error.message?.includes("Unauthorized") ? 401 : 500 });
  }
}
