import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { enforceAdminMutationGuard, requireAdmin } from "@/lib/adminAuth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const tierItemSchema = z
  .object({
    planId: z.string().min(1, "Plan ID is required"),
    user_price: z.number().min(1, "User price must be at least N1"),
    agent_price: z.number().min(1, "Agent price must be at least N1"),
    admin_price: z.number().min(0, "Admin cost price must be non-negative").default(0),
  })
  .refine((d) => d.agent_price <= d.user_price, {
    message: "Agent price cannot exceed user price",
    path: ["agent_price"],
  })
  .refine((d) => d.admin_price <= d.agent_price, {
    message: "Admin price cannot exceed agent price",
    path: ["admin_price"],
  });

const tierPayloadSchema = z.union([
  tierItemSchema,
  z.object({
    tiers: z.array(tierItemSchema).min(1, "At least one plan tier is required"),
  }),
]);

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const plans = await prisma.plan.findMany({
      orderBy: [{ network: "asc" }, { externalPlanId: "asc" }],
      select: {
        id: true,
        name: true,
        network: true,
        sizeLabel: true,
        validity: true,
        dataType: true,
        externalPlanId: true,
        apiSource: true,
        isActive: true,
        user_price: true,
        agent_price: true,
        admin_price: true,
        updatedAt: true,
      },
    });

    const data = plans.map((p) => ({
      id: p.id,
      name: p.name,
      network: p.network,
      sizeLabel: p.sizeLabel,
      validity: p.validity,
      dataType: p.dataType,
      externalPlanId: p.externalPlanId,
      apiSource: p.apiSource,
      isActive: p.isActive,
      user_price: p.user_price,
      agent_price: p.agent_price,
      admin_price: p.admin_price || 0,
      customerMargin: p.user_price - (p.admin_price || 0),
      agentMargin: p.agent_price - (p.admin_price || 0),
      updatedAt: p.updatedAt,
    }));

    return NextResponse.json({ success: true, count: data.length, plans: data }, { status: 200 });
  } catch (error: any) {
    console.error("[GET PRICING TIERS ERROR]", error);
    if (error?.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error?.message?.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const originError = enforceAdminMutationGuard(req);
    if (originError) return originError;

    await requireAdmin(req);

    const body = await req.json();
    const parsed = tierPayloadSchema.parse(body);

    const updates = "tiers" in parsed ? parsed.tiers : [parsed];
    const results = [];

    for (const item of updates) {
      const plan = await prisma.plan.update({
        where: { id: item.planId },
        data: {
          user_price: item.user_price,
          agent_price: item.agent_price,
          admin_price: item.admin_price,
          price: item.user_price,
        },
      });

      results.push({
        id: plan.id,
        name: plan.name,
        network: plan.network,
        sizeLabel: plan.sizeLabel,
        user_price: plan.user_price,
        agent_price: plan.agent_price,
        admin_price: plan.admin_price,
        customerMargin: plan.user_price - plan.admin_price,
        agentMargin: plan.agent_price - plan.admin_price,
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: `Successfully configured pricing tiers for ${results.length} plan(s)`,
        updated: results,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[PATCH PRICING TIERS ERROR]", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    if (error?.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error?.message?.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return PATCH(req);
}
