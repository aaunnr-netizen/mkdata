import { NextRequest, NextResponse } from "next/server";
import { enforceAdminMutationGuard, requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const planSchema = z.object({
  providerId: z.string().min(1, "Provider is required"),
  name: z.string().min(1, "Plan name is required"),
  cableplan: z.number().int().positive("Cable plan ID is required"),
  price: z.number().int().min(50, "Minimum price is N50"),
  isActive: z.boolean().default(true),
});

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const plans = await prisma.cablePlan.findMany({
      orderBy: [{ provider: { name: "asc" } }, { price: "asc" }],
      include: { provider: true },
    });
    return NextResponse.json({ success: true, data: plans }, { status: 200 });
  } catch (error: any) {
    console.error("[ADMIN CABLE PLANS GET ERROR]", error);
    return NextResponse.json({ success: false, error: error.message?.includes("Unauthorized") ? "Unauthorized" : "Internal server error" }, { status: error.message?.includes("Unauthorized") ? 401 : 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const originError = enforceAdminMutationGuard(req);
    if (originError) return originError;

    await requireAdmin(req);
    const data = planSchema.parse(await req.json());
    const plan = await prisma.cablePlan.create({ data, include: { provider: true } });
    return NextResponse.json({ success: true, data: plan }, { status: 201 });
  } catch (error: any) {
    console.error("[ADMIN CABLE PLANS CREATE ERROR]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues[0].message }, { status: 400 });
    }
    if (error.code === "P2002") {
      return NextResponse.json({ success: false, error: "That cable plan ID already exists for this provider." }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message?.includes("Unauthorized") ? "Unauthorized" : "Internal server error" }, { status: error.message?.includes("Unauthorized") ? 401 : 500 });
  }
}
