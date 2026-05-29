import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const providers = await prisma.cableProvider.findMany({
      where: {
        isActive: true,
        plans: { some: { isActive: true } },
      },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        plans: {
          where: { isActive: true },
          orderBy: { price: "asc" },
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: providers }, { status: 200 });
  } catch (error) {
    console.error("[CABLE PRODUCTS ERROR]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
