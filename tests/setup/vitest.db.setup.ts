import { afterAll, beforeEach } from "vitest";

import { prisma } from "@/lib/database/prisma";

const required = process.env.DATABASE_URL;

if (!required) {
  throw new Error("DATABASE_URL is required for database integration tests.");
}

const cleanupOrder = [
  () => prisma.referralReward.deleteMany(),
  () => prisma.payout.deleteMany(),
  () => prisma.eggSaleRequest.deleteMany(),
  () => prisma.payoutMethod.deleteMany(),
  () => prisma.eggLedgerEntry.deleteMany(),
  () => prisma.referralRule.deleteMany(),
  () => prisma.eggSaleRate.deleteMany(),
  () => prisma.eggAccrual.deleteMany(),
  () => prisma.henAsset.deleteMany(),
  () => prisma.paymentProof.deleteMany(),
  () => prisma.paymentSubmission.deleteMany(),
  () => prisma.purchaseOrder.deleteMany(),
  () => prisma.paymentAccount.deleteMany(),
  () => prisma.henPlan.deleteMany(),
  () => prisma.idempotencyRecord.deleteMany(),
  () => prisma.appSetting.deleteMany(),
  () => prisma.notification.deleteMany(),
  () => prisma.passwordResetToken.deleteMany(),
  () => prisma.auditLog.deleteMany(),
  () => prisma.legalAcceptance.deleteMany(),
  () => prisma.referralRelationship.deleteMany(),
  () => prisma.session.deleteMany(),
  () => prisma.user.deleteMany(),
] as const;

beforeEach(async () => {
  for (const cleanup of cleanupOrder) {
    await cleanup();
  }
  await prisma.$disconnect();
});

afterAll(async () => {
  await prisma.$disconnect();
});
