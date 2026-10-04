import { NextRequest, NextResponse } from "next/server";
import { authenticateDeveloper } from "@/lib/developer/auth";
import { prisma } from "@/lib/db";
import { NetworkType } from "@prisma/client";
import { enforceRateLimit } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const rateLimitError = enforceRateLimit(req, "developerApi");
  if (rateLimitError) return rateLimitError;

  const auth = await authenticateDeveloper(req);
  if (!auth.success) {
    return auth.response;
  }

  const { searchParams } = new URL(req.url);
  const networkParam = searchParams.get("network")?.toUpperCase();
  const typeParam = searchParams.get("type")?.toUpperCase();

  const where: any = {
    isActive: true,
  };

  if (networkParam && Object.values(NetworkType).includes(networkParam as NetworkType)) {
    where.network = networkParam as NetworkType;
  }

  if (typeParam) {
    where.dataType = typeParam;
  }

  const plans = await prisma.plan.findMany({
    where,
    orderBy: [{ network: "asc" }, { agent_price: "asc" }],
    select: {
      id: true,
      name: true,
      network: true,
      sizeLabel: true,
      validity: true,
      dataType: true,
      agent_price: true,
      price: true,
    },
  });

  const formattedPlans = plans.map((p) => ({
    plan_id: p.id,
    name: p.name,
    network: p.network,
    size: p.sizeLabel,
    validity: p.validity,
    type: p.dataType,
    price: p.agent_price > 0 ? p.agent_price : p.price, // Wholesale agent pricing
  }));

  return NextResponse.json(
    {
      success: true,
      count: formattedPlans.length,
      data: formattedPlans,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
      },
    }
  );
}
