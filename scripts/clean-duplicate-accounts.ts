import dotenv from "dotenv";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import ws from "ws";
import { neonConfig } from "@neondatabase/serverless";

dotenv.config();

neonConfig.webSocketConstructor = ws;

const databaseUrl = process.env.DATABASE_URL!;
const databaseSchema = new URL(databaseUrl).searchParams.get("schema") ?? "public";
const adapterOptions = { connectionString: databaseUrl };
const adapter = databaseUrl.includes(".neon.tech")
  ? new PrismaNeon(adapterOptions, { schema: databaseSchema })
  : new PrismaPg(adapterOptions, { schema: databaseSchema });

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("--- Starting cleanup of duplicate / legacy payment accounts ---");

  // 1. Find Official Easypaisa and Official Bank Transfer
  const officialEasypaisa = await prisma.paymentAccount.findFirst({
    where: {
      provider: "EASYPAISA",
      accountTitle: { contains: "Official" }
    }
  });

  const officialBank = await prisma.paymentAccount.findFirst({
    where: {
      provider: "BANK_TRANSFER",
      accountTitle: { contains: "Official" }
    }
  });

  console.log("Official Easypaisa ID:", officialEasypaisa?.id);
  console.log("Official Bank ID:", officialBank?.id);

  if (!officialEasypaisa || !officialBank) {
    throw new Error("Could not find official Easypaisa or Bank Transfer account");
  }

  // 2. Find legacy demo accounts
  const demoEasypaisa = await prisma.paymentAccount.findMany({
    where: {
      provider: "EASYPAISA",
      id: { not: officialEasypaisa.id }
    }
  });

  const demoBank = await prisma.paymentAccount.findMany({
    where: {
      provider: "BANK_TRANSFER",
      id: { not: officialBank.id }
    }
  });

  console.log(`Found ${demoEasypaisa.length} duplicate Easypaisa account(s) to remove`);
  console.log(`Found ${demoBank.length} duplicate Bank Transfer account(s) to remove`);

  // 3. Migrate any existing submissions from demo accounts to official accounts
  for (const acc of demoEasypaisa) {
    const updated = await prisma.paymentSubmission.updateMany({
      where: { paymentAccountId: acc.id },
      data: { paymentAccountId: officialEasypaisa.id }
    });
    console.log(`Re-pointed ${updated.count} submissions from ${acc.accountTitle} (${acc.id}) to Official Easypaisa`);

    await prisma.paymentAccount.delete({
      where: { id: acc.id }
    });
    console.log(`Deleted duplicate Easypaisa account ${acc.id}`);
  }

  for (const acc of demoBank) {
    const updated = await prisma.paymentSubmission.updateMany({
      where: { paymentAccountId: acc.id },
      data: { paymentAccountId: officialBank.id }
    });
    console.log(`Re-pointed ${updated.count} submissions from ${acc.accountTitle} (${acc.id}) to Official Bank`);

    await prisma.paymentAccount.delete({
      where: { id: acc.id }
    });
    console.log(`Deleted duplicate Bank Transfer account ${acc.id}`);
  }

  // 4. Verify final accounts in DB
  const remaining = await prisma.paymentAccount.findMany({
    orderBy: { displayOrder: "asc" }
  });

  console.log("\n--- Final Active Payment Accounts (${remaining.length}) ---");
  for (const r of remaining) {
    console.log(`[${r.provider}] ${r.accountTitle} | ${r.bankName || "No Bank"} | ${r.accountIdentifierProtected} | DisplayOrder: ${r.displayOrder}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
