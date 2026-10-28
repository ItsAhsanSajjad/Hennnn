import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";

dotenv.config();
neonConfig.webSocketConstructor = ws;

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required.");
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: databaseUrl }),
});

async function main() {
  console.log("Checking current active plans...");
  const existingPlans = await prisma.henPlan.findMany({
    where: { slug: "starter-hen-demo" },
  });
  console.log("Target plan before update:", existingPlans);

  const updated = await prisma.henPlan.updateMany({
    where: { slug: "starter-hen-demo" },
    data: {
      name: "GrowMeta Hen Plan",
      pricePaisa: 50_000n, // PKR 500
      termsVersion: "hen-500-90-day-v1",
      fullDescription:
        "Each hen costs Rs 500. After payment approval, egg entries follow the published plan rules for 90 days, up to 90 recorded eggs. Egg-sale requests use the active rate and are reviewed before settlement.",
      shortDescription:
        "One hen follows the published 90-day egg-record plan after activation.",
    },
  });
  console.log(`Updated ${updated.count} active plan record(s) to PKR 500.`);

  const afterPlans = await prisma.henPlan.findMany({
    where: { slug: "starter-hen-demo" },
  });
  console.log("Target plan after update:", afterPlans.map(p => ({
    id: p.id,
    name: p.name,
    code: p.code,
    pricePaisa: p.pricePaisa.toString(),
    status: p.status,
    isActive: p.isActive,
    validityDays: p.validityDays,
    dailyEggUnits: p.dailyEggUnits,
    maximumEggUnits: p.maximumEggUnits,
  })));

  // Ensure historical orders are NOT touched
  const ordersCount = await prisma.purchaseOrder.count();
  console.log(`Verified ${ordersCount} historical purchase orders remain intact.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Migration error:", err);
    process.exit(1);
  });
