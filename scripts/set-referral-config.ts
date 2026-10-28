/**
 * One-off: update the referral_purchase_benefit AppSetting on the live (Neon) DB.
 * The Prisma CLI cannot reach Neon over TCP, so this connects with the same Neon
 * WebSocket adapter the app uses at runtime.
 *
 * Run from the project root:  npx tsx scripts/set-referral-config.ts
 */
import "dotenv/config";

import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const value = {
  isActive: true,
  qualifyingHenQuantity: 1,
  inviterHenRewardPercent: 20,
  inviteeDiscountPaisaPerHen: 10_000,
  notes:
    "Direct referral campaign. A referred customer gets a per-hen discount; the inviter earns a percentage of the referred customer's hens after a qualifying approved purchase.",
};

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required (check .env).");

  const adapter = new PrismaNeon({ connectionString: databaseUrl }, { schema: "public" });
  const prisma = new PrismaClient({ adapter });
  try {
    const existing = await prisma.appSetting.findUnique({
      where: { key: "referral_purchase_benefit" },
      select: { key: true },
    });
    if (existing) {
      await prisma.appSetting.update({
        where: { key: "referral_purchase_benefit" },
        data: { value, isPublic: false },
      });
    } else {
      const admin = await prisma.user.findFirst({
        where: { role: "SUPER_ADMIN" },
        select: { id: true },
      });
      await prisma.appSetting.create({
        data: {
          key: "referral_purchase_benefit",
          value,
          isPublic: false,
          updatedByUserId: admin?.id ?? null,
        },
      });
    }
    const stored = await prisma.appSetting.findUnique({
      where: { key: "referral_purchase_benefit" },
      select: { value: true },
    });
    console.log("referral_purchase_benefit is now:", JSON.stringify(stored?.value));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
