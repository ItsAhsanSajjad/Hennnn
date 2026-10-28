-- Preserve append-only settlement evidence for paid legacy requests that were
-- created before SALE_FINALIZED existed. The reservation remains the debit.
INSERT INTO "EggLedgerEntry" (
  "id",
  "userId",
  "entryType",
  "eggUnits",
  "description",
  "sourceType",
  "sourceId",
  "idempotencyKey",
  "createdAt"
)
SELECT
  md5(sale."id"::text || ':sale-finalized')::uuid,
  sale."userId",
  'SALE_FINALIZED',
  0,
  'Egg-sale settled ' || sale."publicReference",
  'EGG_SALE',
  sale."id"::text,
  'sale-finalized:' || sale."id"::text,
  COALESCE(sale."paidAt", sale."updatedAt")
FROM "EggSaleRequest" AS sale
WHERE sale."status" = 'PAID'
  AND NOT EXISTS (
    SELECT 1
    FROM "EggLedgerEntry" AS ledger
    WHERE ledger."sourceType" = 'EGG_SALE'
      AND ledger."sourceId" = sale."id"::text
      AND ledger."entryType" = 'SALE_FINALIZED'
  );
