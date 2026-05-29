import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const providers = await prisma.electricityProvider.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        minAmount: true,
        maxAmount: true,
      },
    });

    return NextResponse.json({ success: true, data: providers }, { status: 200 });
  } catch (error) {
    console.error("[ELECTRICITY PROVIDERS ERROR]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
