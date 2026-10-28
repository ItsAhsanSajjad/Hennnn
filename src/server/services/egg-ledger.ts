import type { Prisma, PrismaClient, User } from "@prisma/client";
import { randomUUID } from "node:crypto";

import { prisma } from "@/lib/database/prisma";
import { canAdjustLedger } from "@/server/policies/authorization";
import { createAuditLog } from "@/server/services/audit";

type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

export async function getEggBalance(userId: string, tx: PrismaExecutor = prisma) {
  const rows = await tx.$queryRaw<{ balance: number | bigint | null }[]>`
    SELECT COALESCE(SUM("eggUnits"), 0) AS balance
    FROM "EggLedgerEntry"
    WHERE "userId" = ${userId}::uuid
  `;
  return Number(rows[0]?.balance ?? 0);
}

export async function getAvailableEggBalance(userId: string, tx: PrismaExecutor = prisma) {
  return getEggBalance(userId, tx);
}

export async function getUserEggCenterSummary(userId: string, now = new Date()) {
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const nextDay = new Date(dayStart);
  nextDay.setDate(nextDay.getDate() + 1);

  const [
    availableEggs,
    todayProduction,
    totalProduction,
    reserved,
    settled,
    activeRate,
    recentActivity,
  ] = await Promise.all([
    getAvailableEggBalance(userId),
    prisma.eggLedgerEntry.aggregate({
      where: {
        userId,
        entryType: "PRODUCTION_CREDIT",
        createdAt: { gte: dayStart, lt: nextDay },
      },
      _sum: { eggUnits: true },
    }),
    prisma.eggLedgerEntry.aggregate({
      where: { userId, entryType: "PRODUCTION_CREDIT" },
      _sum: { eggUnits: true },
    }),
    prisma.eggSaleRequest.aggregate({
      where: { userId, status: { in: ["AWAITING_REVIEW", "UNDER_REVIEW", "PAYMENT_PROCESSING"] } },
      _sum: { eggQuantity: true },
    }),
    prisma.eggSaleRequest.aggregate({
      where: { userId, status: "PAID" },
      _sum: { eggQuantity: true },
    }),
    prisma.eggSaleRate.findFirst({
      where: {
        code: "DEMO-EGG-SALE",
        isActive: true,
        archivedAt: null,
        effectiveFrom: { lte: now },
        OR: [{ effectiveUntil: null }, { effectiveUntil: { gt: now } }],
      },
      orderBy: { effectiveFrom: "desc" },
      select: { ratePaisaPerEgg: true },
    }),
    prisma.eggLedgerEntry.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, entryType: true, eggUnits: true, description: true, createdAt: true },
    }),
  ]);

  const usableEggs = Math.max(availableEggs, 0);
  const ratePaisaPerEgg = activeRate?.ratePaisaPerEgg ?? null;

  return {
    availableEggs: usableEggs,
    eggsProducedToday: Number(todayProduction._sum.eggUnits ?? 0),
    totalEggsGenerated: Number(totalProduction._sum.eggUnits ?? 0),
    eggsReservedForSale: Number(reserved._sum.eggQuantity ?? 0),
    eggsAlreadySold: Number(settled._sum.eggQuantity ?? 0),
    eggsSettled: Number(settled._sum.eggQuantity ?? 0),
    ratePaisaPerEgg,
    estimatedAvailableValuePaisa:
      ratePaisaPerEgg === null ? null : BigInt(usableEggs) * ratePaisaPerEgg,
    recentActivity,
  };
}

export async function getSystemEggBalance() {
  const rows = await prisma.$queryRaw<{ balance: number | bigint | null }[]>`
    SELECT COALESCE(SUM("eggUnits"), 0) AS balance
    FROM "EggLedgerEntry"
  `;
  return Number(rows[0]?.balance ?? 0);
}

export async function createLedgerAdjustment({
  actor,
  userId,
  eggUnits,
  description,
}: {
  actor: Pick<User, "id" | "role">;
  userId: string;
  eggUnits: number;
  description: string;
}) {
  if (!canAdjustLedger(actor.role)) {
    throw new Error("You are not allowed to adjust the egg ledger.");
  }

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))`;
    const rows = await tx.$queryRaw<{ balance: number | bigint | null }[]>`
      SELECT COALESCE(SUM("eggUnits"), 0) AS balance
      FROM "EggLedgerEntry"
      WHERE "userId" = ${userId}::uuid
    `;
    const balance = Number(rows[0]?.balance ?? 0);
    if (balance + eggUnits < 0) {
      throw new Error("Adjustment would make the user's egg balance negative.");
    }

    const entry = await tx.eggLedgerEntry.create({
      data: {
        userId,
        entryType: eggUnits > 0 ? "ADMIN_CREDIT" : "ADMIN_DEBIT",
        eggUnits,
        description,
        sourceType: "ADMIN_ADJUSTMENT",
        sourceId: actor.id,
        idempotencyKey: `admin-adjustment:${actor.id}:${userId}:${randomUUID()}`,
      },
    });
    await createAuditLog(
      {
        actorUserId: actor.id,
        action: "EGG_LEDGER_ADJUSTED",
        entityType: "EggLedgerEntry",
        entityId: entry.id,
        metadata: { userId, eggUnits },
      },
      tx,
    );
    return entry;
  });
}
