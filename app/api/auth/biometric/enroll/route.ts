import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { generateBiometricToken, getBiometricTokenExpiry, hashBiometricToken } from "@/lib/biometric-auth";
import { rejectCrossSiteMutation } from "@/lib/security";

export async function POST(req: NextRequest) {
  try {
    const originError = rejectCrossSiteMutation(req, { requireOrigin: true });
    if (originError) return originError;

    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionUser.userId },
      select: { id: true, phone: true, isBanned: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    if (user.isBanned) {
      return NextResponse.json({ success: false, error: "Account is banned" }, { status: 403 });
    }

    const token = generateBiometricToken();
    const tokenHash = hashBiometricToken(token);

    await prisma.$transaction([
      prisma.biometricCredential.updateMany({
        where: { userId: user.id, phone: user.phone, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
      prisma.biometricCredential.create({
        data: {
          userId: user.id,
          phone: user.phone,
          tokenHash,
          expiresAt: getBiometricTokenExpiry(),
        },
      }),
    ]);

    return NextResponse.json({ success: true, phone: user.phone, token }, { status: 200 });
  } catch (error) {
    console.error("[BIOMETRIC ENROLL ERROR]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
