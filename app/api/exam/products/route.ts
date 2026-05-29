import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const products = await prisma.examProduct.findMany({
      where: { isActive: true },
      orderBy: { displayName: "asc" },
      select: {
        id: true,
        examName: true,
        displayName: true,
        price: true,
        maxQuantity: true,
      },
    });

    return NextResponse.json({ success: true, data: products }, { status: 200 });
  } catch (error) {
    console.error("[EXAM PRODUCTS ERROR]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
