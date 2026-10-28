import { randomUUID } from "node:crypto";

import { prisma } from "@/lib/database/prisma";
import { addUtcDays, dateKey, toPktDate, toUtcDate } from "@/lib/utilities/phase2";
import { createAuditLog } from "@/server/services/audit";

export type EggAccrualRunResult = {
  productionDate: string;
  scanned: number;
  creditedAssets: number;
  skippedAssets: number;
  totalEggUnits: number;
  dryRun: boolean;
};

let lastAccrualCheckTimestamp = 0;
const ACCRUAL_CHECK_COOLDOWN_MS = 15_000;

/**
 * Automatically checks and credits all active hen assets for all eligible dates
 * up to current Pakistan Standard Time (PKT, UTC+5).
 * Idempotent, thread-safe, and self-healing.
 */
export async function ensureEggAccrualsCurrent(force = false): Promise<{
  datesRun: string[];
  totalEggUnits: number;
  creditedAssets: number;
}> {
  const now = Date.now();
  if (!force && now - lastAccrualCheckTimestamp < ACCRUAL_CHECK_COOLDOWN_MS) {
    return { datesRun: [], totalEggUnits: 0, creditedAssets: 0 };
  }
  lastAccrualCheckTimestamp = now;

  const currentPktDay = toPktDate(new Date());

  const activeAssets = await prisma.henAsset.findMany({
    where: {
      status: "ACTIVE",
      productionStartDate: { lte: currentPktDay },
    },
    select: {
      id: true,
      productionStartDate: true,
      productionEndDate: true,
      totalEggUnitsProduced: true,
      totalMaximumEggUnits: true,
      eggAccruals: {
        select: { productionDate: true },
      },
    },
  });

  const eligibleAssets = activeAssets.filter(
    (a) => a.totalEggUnitsProduced < a.totalMaximumEggUnits
  );

  if (eligibleAssets.length === 0) {
    return { datesRun: [], totalEggUnits: 0, creditedAssets: 0 };
  }

  const missingDatesSet = new Set<string>();
  for (const asset of eligibleAssets) {
    if (!asset.productionStartDate) continue;
    const start = toUtcDate(asset.productionStartDate);
    const endLimit =
      asset.productionEndDate && asset.productionEndDate < currentPktDay
        ? toUtcDate(asset.productionEndDate)
        : currentPktDay;
    const existingDateKeys = new Set(
      asset.eggAccruals.map((ea) => dateKey(toUtcDate(ea.productionDate)))
    );

    let cursor = new Date(start);
    while (cursor <= endLimit) {
      const key = dateKey(cursor);
      if (!existingDateKeys.has(key)) {
        missingDatesSet.add(key);
      }
      cursor = addUtcDays(cursor, 1);
    }
  }

  const sortedMissingDates = Array.from(missingDatesSet).sort();
  let totalEggUnits = 0;
  let creditedAssets = 0;

  for (const dateStr of sortedMissingDates) {
    const result = await runEggAccrual({ productionDate: dateStr, dryRun: false });
    totalEggUnits += result.totalEggUnits;
    creditedAssets += result.creditedAssets;
  }

  return {
    datesRun: sortedMissingDates,
    totalEggUnits,
    creditedAssets,
  };
}

export async function runEggAccrual({
  productionDate = toPktDate(new Date()),
  dryRun = false,
}: {
  productionDate?: Date | string;
  dryRun?: boolean;
} = {}): Promise<EggAccrualRunResult> {
  const day = toUtcDate(productionDate);
  const activeAssets = await prisma.henAsset.findMany({
    where: {
      status: "ACTIVE",
      productionStartDate: { lte: day },
      productionEndDate: { gte: day },
      eggAccruals: { none: { productionDate: day } },
    },
  });

  let creditedAssets = 0;
  let skippedAssets = 0;
  let totalEggUnits = 0;

  for (const asset of activeAssets) {
    const remaining = asset.totalMaximumEggUnits - asset.totalEggUnitsProduced;
    const dailyUnits = asset.quantity * asset.dailyEggUnitsPerHen;
    const eggUnits = Math.min(remaining, dailyUnits);
    if (eggUnits <= 0) {
      skippedAssets += 1;
      continue;
    }

    if (dryRun) {
      totalEggUnits += eggUnits;
      creditedAssets += 1;
      continue;
    }

    const idempotencyKey = `egg-accrual:${asset.id}:${dateKey(day)}`;
    const accrualId = randomUUID();
    const ledgerId = randomUUID();
    const creditedRows = await prisma.$queryRaw<{ eggUnits: number }[]>`
      WITH candidate AS (
        SELECT
          h.*,
          LEAST(
            h."totalMaximumEggUnits" - h."totalEggUnitsProduced",
            h."quantity" * h."dailyEggUnitsPerHen"
          )::int AS "creditEggUnits"
        FROM "HenAsset" h
        WHERE
          h."id" = ${asset.id}::uuid
          AND h."status" = 'ACTIVE'::"HenAssetStatus"
          AND h."productionStartDate" <= ${day}
          AND h."productionEndDate" >= ${day}
          AND h."totalEggUnitsProduced" < h."totalMaximumEggUnits"
          AND NOT EXISTS (
            SELECT 1 FROM "EggAccrual" ea
            WHERE ea."henAssetId" = h."id" AND ea."productionDate" = ${day}::date
          )
        FOR UPDATE
      ),
      inserted_accrual AS (
        INSERT INTO "EggAccrual" (
          "id",
          "henAssetId",
          "productionDate",
          "quantity",
          "eggUnits",
          "idempotencyKey",
          "createdAt"
        )
        SELECT
          ${accrualId}::uuid,
          c."id",
          ${day}::date,
          c."quantity",
          c."creditEggUnits",
          ${idempotencyKey},
          CURRENT_TIMESTAMP
        FROM candidate c
        WHERE c."creditEggUnits" > 0
        ON CONFLICT ("henAssetId", "productionDate") DO NOTHING
        RETURNING "id", "henAssetId", "eggUnits"
      ),
      inserted_ledger AS (
        INSERT INTO "EggLedgerEntry" (
          "id",
          "userId",
          "henAssetId",
          "eggAccrualId",
          "entryType",
          "eggUnits",
          "description",
          "sourceType",
          "sourceId",
          "idempotencyKey",
          "createdAt"
        )
        SELECT
          ${ledgerId}::uuid,
          c."userId",
          c."id",
          ia."id",
          'PRODUCTION_CREDIT'::"EggLedgerEntryType",
          ia."eggUnits",
          ${`Daily egg production for ${dateKey(day)}`},
          'EGG_ACCRUAL'::"EggLedgerSourceType",
          ia."id"::text,
          ${`ledger:${idempotencyKey}`},
          CURRENT_TIMESTAMP
        FROM inserted_accrual ia
        JOIN candidate c ON c."id" = ia."henAssetId"
        ON CONFLICT ("idempotencyKey") DO NOTHING
        RETURNING "eggUnits"
      ),
      updated_asset AS (
        UPDATE "HenAsset" h
        SET
          "totalEggUnitsProduced" = h."totalEggUnitsProduced" + ia."eggUnits",
          "status" = CASE
            WHEN h."totalEggUnitsProduced" + ia."eggUnits" >= h."totalMaximumEggUnits"
            THEN 'COMPLETED'::"HenAssetStatus"
            ELSE h."status"
          END,
          "completedAt" = CASE
            WHEN h."totalEggUnitsProduced" + ia."eggUnits" >= h."totalMaximumEggUnits"
            THEN CURRENT_TIMESTAMP
            ELSE h."completedAt"
          END,
          "updatedAt" = CURRENT_TIMESTAMP
        FROM inserted_accrual ia
        WHERE h."id" = ia."henAssetId"
        RETURNING ia."eggUnits"
      )
      SELECT COALESCE(SUM("eggUnits"), 0)::int AS "eggUnits" FROM updated_asset
    `;
    const credited = creditedRows[0]?.eggUnits ?? 0;
    if (credited > 0) {
      totalEggUnits += credited;
      creditedAssets += 1;
    } else {
      skippedAssets += 1;
    }
  }

  if (!dryRun) {
    await createAuditLog({
      actorUserId: null,
      action: "EGG_ACCRUAL_RUN",
      entityType: "EggAccrual",
      metadata: {
        productionDate: dateKey(day),
        scanned: activeAssets.length,
        creditedAssets,
        skippedAssets,
        totalEggUnits,
      },
    });
  }

  return {
    productionDate: dateKey(day),
    scanned: activeAssets.length,
    creditedAssets,
    skippedAssets,
    totalEggUnits,
    dryRun,
  };
}
