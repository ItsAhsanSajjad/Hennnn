import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";

dotenv.config();
neonConfig.webSocketConstructor = ws;

const databaseUrl = process.env.DATABASE_URL;
const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: databaseUrl }),
});

async function run() {
  console.log("=== GrowMeta Egg Pricing & Order Calculation Verification ===");

  // 1. Check active plan
  const plan = await prisma.henPlan.findFirst({
    where: { slug: "starter-hen-demo", status: "ACTIVE", isActive: true },
  });
  console.log("\n[1] Active Plan Details:");
  console.log(`- Name: ${plan.name}`);
  console.log(`- Code: ${plan.code}`);
  console.log(`- Price Paisa: ${plan.pricePaisa} (${Number(plan.pricePaisa) / 100} PKR)`);
  console.log(`- Terms Version: ${plan.termsVersion}`);
  console.log(`- Validity: ${plan.validityDays} days`);
  console.log(`- Daily Eggs: ${plan.dailyEggUnits}`);
  console.log(`- Maximum Eggs: ${plan.maximumEggUnits}`);

  if (plan.pricePaisa !== 50_000n) {
    throw new Error(`Expected pricePaisa to be 50000n, found ${plan.pricePaisa}`);
  }
  console.log("✓ Active plan is authoritative PKR 500.");

  // 2. Quantity calculation tests
  console.log("\n[2] Quantity Math Verification (PKR 500 per hen, 0 discounts):");
  const testQuantities = [1, 3, 5, 10, 20];
  const expectedTotals = [
    { qty: 1, paisa: 50_000n, rs: 500 },
    { qty: 3, paisa: 150_000n, rs: 1500 },
    { qty: 5, paisa: 250_000n, rs: 2500 },
    { qty: 10, paisa: 500_000n, rs: 5000 },
    { qty: 20, paisa: 1_000_000n, rs: 10000 },
  ];

  for (const exp of expectedTotals) {
    const totalPaisa = plan.pricePaisa * BigInt(exp.qty);
    const totalRs = Number(totalPaisa) / 100;
    console.log(
      `  - Quantity: ${exp.qty} hen(s) -> Total Paisa: ${totalPaisa} | Total PKR: ${totalRs} (Expected: PKR ${exp.rs})`,
    );
    if (totalPaisa !== exp.paisa || totalRs !== exp.rs) {
      throw new Error(`Calculation mismatch for qty ${exp.qty}`);
    }
  }
  console.log("✓ All quantity tier calculations match exact linear math (Qty × PKR 500).");

  // 3. Historical orders check
  console.log("\n[3] Historical Orders Integrity Check:");
  const historicalOrders = await prisma.purchaseOrder.findMany({
    where: {
      termsVersionSnapshot: "hen-750-90-day-v1",
    },
    take: 5,
  });
  console.log(`Found historical orders under 'hen-750-90-day-v1': ${historicalOrders.length} sample(s)`);
  for (const ord of historicalOrders) {
    console.log(
      `  - Order #${ord.orderReference}: Qty ${ord.quantity}, UnitPrice: ${ord.unitPricePaisa} paisa (${Number(ord.unitPricePaisa)/100} PKR), Total: ${ord.totalAmountPaisa} paisa (${Number(ord.totalAmountPaisa)/100} PKR)`,
    );
    if (ord.unitPricePaisa === 50_000n) {
      throw new Error(`Historical order #${ord.orderReference} was improperly repriced!`);
    }
  }
  console.log("✓ Historical orders strictly retain their original price snapshot and terms.");

  console.log("\n✓ All pricing and verification checks passed!");
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
