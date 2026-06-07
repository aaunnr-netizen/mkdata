import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  return NextResponse.json(
    { success: false, error: "Guest checkout is temporarily disabled. Please register or log in to purchase data plans." },
    { status: 403 }
  );
}
