import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let network = searchParams.get("network");

    if (network) {
      const networkMap: Record<string, string> = {
        mtn: "MTN",
        airtel: "AIRTEL",
        glo: "GLO",
        "9mobile": "NINEMOBILE",
      };
      network = networkMap[network.toLowerCase()] || network.toUpperCase();
    }

    const plans = await prisma.plan.findMany({
      where: {
        isActive: true,
        ...(network ? { network: network as any } : {}),
      },
      orderBy: [{ user_price: "asc" }, { price: "asc" }],
    });

    const serializedPlans = plans.map((plan) => {
      const size = (plan.sizeLabel || "").trim();
      const rawName = (plan.name || "").trim();
      const type = (plan.dataType || "SME").trim();
      const displayName =
        size && !rawName.toUpperCase().includes(size.toUpperCase())
          ? `${size} ${rawName}`
          : rawName || size;

      return {
        ...plan,
        name: rawName,
        sizeLabel: size,
        price: plan.user_price > 0 ? plan.user_price : plan.price,
        size,
        type,
        displayName,
      };
    });

    return NextResponse.json(
      { success: true, data: serializedPlans, plans: serializedPlans },
      { status: 200 }
    );
  } catch (error) {
    console.error("[DATA PLANS ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
