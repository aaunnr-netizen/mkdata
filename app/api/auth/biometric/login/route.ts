import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { setUserSessionCookie, signToken } from "@/lib/auth";
import { hashBiometricToken } from "@/lib/biometric-auth";
import { getUserSelectCompat, normalizeUserCompat, withCompatibleUserFields } from "@/lib/user-compat";
import { enforceRateLimit, rejectCrossSiteMutation } from "@/lib/security";

const biometricLoginSchema = z.object({
  phone: z.string().regex(/^0[0-9]{10}$/, "Invalid phone number"),
  token: z.string().min(32, "Invalid biometric token"),
});

export async function POST(req: NextRequest) {
  try {
    const originError = rejectCrossSiteMutation(req, { requireOrigin: true });
    if (originError) return originError;

    const rateLimitError = enforceRateLimit(req, "login", "biometric-login");
    if (rateLimitError) return rateLimitError;

    const body = await req.json();
    const { phone, token } = biometricLoginSchema.parse(body);
    const tokenHash = hashBiometricToken(token);

    const credential = await prisma.biometricCredential.findFirst({
      where: {
        phone,
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!credential) {
      return NextResponse.json({ error: "Invalid biometric login" }, { status: 401 });
    }

    const compat = await getUserSelectCompat();
    const user = await prisma.user.findUnique({
      where: { id: credential.userId },
      select: {
        id: true,
        phone: true,
        fullName: true,
        role: true,
        tier: true,
        balance: true,
        email: true,
        isBanned: true,
        ...withCompatibleUserFields({}, compat),
      },
    });

    if (!user || user.phone !== phone) {
      return NextResponse.json({ error: "Invalid biometric login" }, { status: 401 });
    }

    if (user.isBanned) {
      return NextResponse.json({ error: "Account is banned" }, { status: 403 });
    }

    await prisma.biometricCredential.update({
      where: { id: credential.id },
      data: { lastUsedAt: new Date() },
    });

    const normalizedUser = normalizeUserCompat(user);
    const sessionToken = await signToken({
      userId: normalizedUser.id,
      email: normalizedUser.email || normalizedUser.phone,
      role: normalizedUser.role,
    });

    const response = NextResponse.json(
      {
        message: "Login successful",
        user: {
          id: user.id,
          phone: normalizedUser.phone,
          fullName: normalizedUser.fullName,
          email: normalizedUser.email,
          role: normalizedUser.role,
          tier: normalizedUser.tier || "user",
          balance: normalizedUser.balance,
          rewardBalance: normalizedUser.rewardBalance,
          agentRequestStatus: normalizedUser.agentRequestStatus,
        },
      },
      { status: 200 }
    );

    setUserSessionCookie(response, sessionToken);
    return response;
  } catch (error) {
    console.error("[BIOMETRIC LOGIN ERROR]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
