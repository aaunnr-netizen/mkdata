import { syncAlrahuzCatalog } from "../lib/services-seed";
import { prisma } from "../lib/db";

async function main() {
  console.log("Seeding Alrahuz services into Neon database...");
  const result = await syncAlrahuzCatalog();
  console.log("Seeding completed successfully:", JSON.stringify(result, null, 2));

  const [electricityCount, cableProviderCount, cablePlanCount, examCount] = await Promise.all([
    prisma.electricityProvider.count({ where: { isActive: true } }),
    prisma.cableProvider.count({ where: { isActive: true } }),
    prisma.cablePlan.count({ where: { isActive: true } }),
    prisma.examProduct.count({ where: { isActive: true } }),
  ]);

  console.log("Active counts in Neon database:");
  console.log(`- Electricity Providers: ${electricityCount}`);
  console.log(`- Cable Providers: ${cableProviderCount}`);
  console.log(`- Cable Plans: ${cablePlanCount}`);
  console.log(`- Exam Products: ${examCount}`);
}

main()
  .catch((err) => {
    console.error("Seeding failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
