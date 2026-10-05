import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const networkFilter = searchParams.get("network")?.toUpperCase();

    const where: any = { isActive: true };
    if (networkFilter && ["MTN", "AIRTEL", "GLO", "9MOBILE"].includes(networkFilter)) {
      where.network = networkFilter;
    }

    const plans = await prisma.plan.findMany({
      where,
      orderBy: [{ network: "asc" }, { externalPlanId: "asc" }],
      select: {
        id: true,
        name: true,
        network: true,
        sizeLabel: true,
        validity: true,
        dataType: true,
        externalPlanId: true,
        user_price: true,
        agent_price: true,
        price: true,
        updatedAt: true,
      },
    });

    const formatted = plans.map((p) => {
      const wholesalePrice = p.agent_price > 0 ? p.agent_price : p.price;
      const retailPrice = p.user_price > 0 ? p.user_price : p.price;
      return {
        id: p.id,
        plan_id: p.externalPlanId, // Numeric ID for developer integrations (e.g. 5, 82, 174)
        name: p.name,
        network: p.network,
        size: p.sizeLabel,
        validity: p.validity,
        type: p.dataType || "SME",
        price: wholesalePrice,
        retailPrice: retailPrice,
        updatedAt: p.updatedAt,
      };
    });

    // Group by network
    const grouped: Record<string, typeof formatted> = {
      MTN: [],
      AIRTEL: [],
      GLO: [],
      "9MOBILE": [],
    };

    for (const item of formatted) {
      if (grouped[item.network]) {
        grouped[item.network].push(item);
      } else {
        grouped[item.network] = [item];
      }
    }

    return NextResponse.json({
      success: true,
      total: formatted.length,
      timestamp: new Date().toISOString(),
      plans: formatted,
      byNetwork: grouped,
    });
  } catch (error: any) {
    console.error("[DEVELOPER PLANS FETCH ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch live plan list." },
      { status: 500 }
    );
  }
}
