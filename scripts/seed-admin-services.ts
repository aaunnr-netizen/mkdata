import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const adminPhone = process.env.MK_ADMIN_PHONE || "09066120642";
const adminName = process.env.MK_ADMIN_NAME || "MK Admin";
const adminPin = process.env.MK_ADMIN_PIN;

const electricityProviders = [
  [1, "Ikeja Electric"],
  [2, "Eko Electric"],
  [3, "Abuja Electric"],
  [4, "Kano Electric"],
  [5, "Enugu Electric"],
  [6, "Port Harcourt Electric"],
  [7, "Ibadan Electric"],
  [8, "Kaduna Electric"],
  [9, "Jos Electric"],
  [10, "Benin Electric"],
  [11, "Yola Electric"],
] as const;

const cableProviders = [
  [1, "GOTV"],
  [2, "DSTV"],
  [3, "STARTIME"],
] as const;

const cablePlans = [
  [2, "GOtv Max", 8500],
  [6, "DStv Yanga", 6000],
  [7, "DStv Compact", 19000],
  [8, "DStv Compact Plus", 30000],
  [9, "DStv Premium", 44500],
  [11, "Classic - 7400 Naira - 1 Mont", 6000],
  [12, "Basic - 4000 Naira - 1 Month", 4000],
  [13, "Smart - 5100 Naira - 1 Month", 5100],
  [14, "Nova - 2100 Naira - 1 Month", 2100],
  [15, "Super - 9800 Naira - 1 Month", 9800],
  [16, "GOtv Jinja", 3900],
  [17, "GOtv Jolli", 5800],
  [19, "DStv-Confam", 11000],
  [20, "DStv-Padi", 4400],
  [23, "DStv -indian", 14900],
  [24, "DStv Premium French", 69000],
  [25, "DStv Premium Asia", 50500],
  [26, "DStv Confam + ExtraView", 17000],
  [27, "DStv Yanga + ExtraView", 12000],
  [28, "DStv Padi + ExtraView", 10400],
  [29, "DStv Compact + Extra View", 25000],
  [30, "DStv Premium + Extra View", 50500],
  [31, "DStv Compact Plus - Extra View", 36000],
  [33, "ExtraView Access", 6000],
  [34, "GOtv Smallie - Monthly", 1900],
  [35, "GOtv Smallie - Quarterly", 5100],
  [36, "GOtv Smallie - Yearly", 15000],
  [37, "Nova - 700 Naira - 1 Week", 700],
  [38, "Basic - 1400 Naira - 1 Week", 1400],
  [39, "Smart - 1700 Naira - 1 Week", 1700],
  [40, "Classic - 2000 Naira - 1 Week", 2000],
  [41, "Super - 3300 Naira - 1 Week", 3300],
  [47, "GOTv SUPA", 11400],
  [48, "Super - 9000 Naira - 1 Month", 9000],
  [49, "GOTv SUPA PLUS", 16800],
] as const;

function providerNameForPlan(planName: string) {
  if (/gotv/i.test(planName)) return "GOTV";
  if (/dstv|extra\s*view|extraview/i.test(planName)) return "DSTV";
  return "STARTIME";
}

async function recreateAdminUser() {
  if (!adminPin || !/^\d{6}$/.test(adminPin)) {
    throw new Error("MK_ADMIN_PIN must be set to the 6-digit admin PIN.");
  }

  await prisma.user.deleteMany({ where: { phone: adminPhone } });

  const pinHash = await bcrypt.hash(adminPin, 12);
  const user = await prisma.user.create({
    data: {
      fullName: adminName,
      phone: adminPhone,
      email: `admin-${adminPhone}@mkdata.local`,
      pinHash,
      role: UserRole.ADMIN,
      tier: "user",
      balance: 0,
      rewardBalance: 0,
      isActive: true,
      isBanned: false,
    },
    select: {
      id: true,
      phone: true,
      role: true,
      pinHash: true,
    },
  });

  const pinOk = await bcrypt.compare(adminPin, user.pinHash || "");
  if (!pinOk) {
    throw new Error("Admin PIN verification failed after creation.");
  }

  return { id: user.id, phone: user.phone, role: user.role, pinOk };
}

async function seedElectricityProviders() {
  for (const [discoName, name] of electricityProviders) {
    await prisma.electricityProvider.upsert({
      where: { discoName },
      update: {
        name,
        minAmount: 500,
        maxAmount: 50000,
        isActive: true,
      },
      create: {
        name,
        discoName,
        minAmount: 500,
        maxAmount: 50000,
        isActive: true,
      },
    });
  }
}

async function seedCableCatalog() {
  const providerIds = new Map<string, string>();

  for (const [cablename, name] of cableProviders) {
    const provider = await prisma.cableProvider.upsert({
      where: { cablename },
      update: { name, isActive: true },
      create: { cablename, name, isActive: true },
      select: { id: true, name: true },
    });
    providerIds.set(provider.name, provider.id);
  }

  for (const [cableplan, name, price] of cablePlans) {
    const providerName = providerNameForPlan(name);
    const providerId = providerIds.get(providerName);
    if (!providerId) {
      throw new Error(`Missing cable provider for ${name}`);
    }

    await prisma.cablePlan.upsert({
      where: {
        providerId_cableplan: {
          providerId,
          cableplan,
        },
      },
      update: {
        name,
        price,
        isActive: true,
      },
      create: {
        providerId,
        cableplan,
        name,
        price,
        isActive: true,
      },
    });
  }
}

async function main() {
  const admin = await recreateAdminUser();
  await seedElectricityProviders();
  await seedCableCatalog();

  const [adminCount, electricityCount, cableProviderCount, cablePlanCount] = await Promise.all([
    prisma.user.count({ where: { phone: adminPhone } }),
    prisma.electricityProvider.count({ where: { isActive: true } }),
    prisma.cableProvider.count({ where: { isActive: true } }),
    prisma.cablePlan.count({ where: { isActive: true } }),
  ]);

  console.log(
    JSON.stringify(
      {
        admin: {
          id: admin.id,
          phone: admin.phone,
          role: admin.role,
          pinVerified: admin.pinOk,
          countForPhone: adminCount,
        },
        electricityProviders: electricityCount,
        cableProviders: cableProviderCount,
        cablePlans: cablePlanCount,
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error("[seed-admin-services]", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
