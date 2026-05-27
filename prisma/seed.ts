import { PrismaClient, ApiSource, NetworkType, RewardType, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const samplePlans = [
  { name: "MTN 500MB Daily", network: NetworkType.MTN, sizeLabel: "500MB", validity: "Daily", price: 180, agentPrice: 165, externalPlanId: 1001, externalNetworkId: 1 },
  { name: "MTN 1GB Weekly", network: NetworkType.MTN, sizeLabel: "1GB", validity: "7 Days", price: 350, agentPrice: 330, externalPlanId: 1002, externalNetworkId: 1 },
  { name: "MTN 2GB Monthly", network: NetworkType.MTN, sizeLabel: "2GB", validity: "30 Days", price: 700, agentPrice: 660, externalPlanId: 1003, externalNetworkId: 1 },

  { name: "Glo 500MB Daily", network: NetworkType.GLO, sizeLabel: "500MB", validity: "Daily", price: 170, agentPrice: 155, externalPlanId: 2001, externalNetworkId: 2 },
  { name: "Glo 1GB Weekly", network: NetworkType.GLO, sizeLabel: "1GB", validity: "7 Days", price: 330, agentPrice: 310, externalPlanId: 2002, externalNetworkId: 2 },
  { name: "Glo 2GB Monthly", network: NetworkType.GLO, sizeLabel: "2GB", validity: "30 Days", price: 660, agentPrice: 625, externalPlanId: 2003, externalNetworkId: 2 },

  { name: "Airtel 500MB Daily", network: NetworkType.AIRTEL, sizeLabel: "500MB", validity: "Daily", price: 190, agentPrice: 175, externalPlanId: 3001, externalNetworkId: 4 },
  { name: "Airtel 1GB Weekly", network: NetworkType.AIRTEL, sizeLabel: "1GB", validity: "7 Days", price: 360, agentPrice: 340, externalPlanId: 3002, externalNetworkId: 4 },
  { name: "Airtel 2GB Monthly", network: NetworkType.AIRTEL, sizeLabel: "2GB", validity: "30 Days", price: 720, agentPrice: 680, externalPlanId: 3003, externalNetworkId: 4 },

  { name: "9mobile 500MB Daily", network: NetworkType.NINEMOBILE, sizeLabel: "500MB", validity: "Daily", price: 185, agentPrice: 170, externalPlanId: 4001, externalNetworkId: 3 },
  { name: "9mobile 1GB Weekly", network: NetworkType.NINEMOBILE, sizeLabel: "1GB", validity: "7 Days", price: 345, agentPrice: 325, externalPlanId: 4002, externalNetworkId: 3 },
  { name: "9mobile 2GB Monthly", network: NetworkType.NINEMOBILE, sizeLabel: "2GB", validity: "30 Days", price: 690, agentPrice: 650, externalPlanId: 4003, externalNetworkId: 3 },
];

async function seedPlans() {
  for (const plan of samplePlans) {
    await prisma.plan.upsert({
      where: {
        apiSource_externalPlanId_externalNetworkId: {
          apiSource: ApiSource.API_A,
          externalPlanId: plan.externalPlanId,
          externalNetworkId: plan.externalNetworkId,
        },
      },
      update: {
        name: plan.name,
        network: plan.network,
        sizeLabel: plan.sizeLabel,
        validity: plan.validity,
        price: plan.price,
        user_price: plan.price,
        agent_price: plan.agentPrice,
        isActive: true,
      },
      create: {
        name: plan.name,
        network: plan.network,
        sizeLabel: plan.sizeLabel,
        validity: plan.validity,
        price: plan.price,
        user_price: plan.price,
        agent_price: plan.agentPrice,
        apiSource: ApiSource.API_A,
        externalPlanId: plan.externalPlanId,
        externalNetworkId: plan.externalNetworkId,
        isActive: true,
      },
    });
  }
}

async function seedRewards() {
  const rewards = [
    {
      type: RewardType.SIGNUP_BONUS,
      title: "Welcome Bonus",
      description: "N100 credited on account creation",
      amount: 100,
    },
    {
      type: RewardType.FIRST_DEPOSIT_2K,
      title: "First Big Deposit",
      description: "N200 credited on first deposit of N2,000 or more",
      amount: 200,
    },
    {
      type: RewardType.DEPOSIT_10K_UPGRADE,
      title: "High Roller",
      description: "N300 credited plus auto-upgrade to AGENT on deposit of N10,000 or more",
      amount: 300,
    },
  ];

  for (const reward of rewards) {
    await prisma.reward.upsert({
      where: { type: reward.type },
      update: {
        title: reward.title,
        description: reward.description,
        amount: reward.amount,
        isActive: true,
      },
      create: {
        ...reward,
        isActive: true,
      },
    });
  }
}

async function seedAdmin() {
  const adminExists = await prisma.user.findFirst({
    where: { role: UserRole.ADMIN },
    select: { id: true },
  });

  if (adminExists) return;

  const pinHash = await bcrypt.hash("000000", 12);
  await prisma.user.create({
    data: {
      fullName: "MK Data Admin",
      phone: "09066120642",
      email: `admin-${Date.now()}@mkdata.local`,
      pinHash,
      role: UserRole.ADMIN,
      balance: 0,
    },
  });
}

async function main() {
  console.log("Starting MK Data database seed...");
  await seedPlans();
  await seedRewards();
  await seedAdmin();
  console.log(`Seeded ${samplePlans.length} sample plans across MTN, Glo, Airtel, and 9mobile.`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
