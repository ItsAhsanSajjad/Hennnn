ALTER TABLE "PurchaseOrder"
ADD COLUMN IF NOT EXISTS "idempotencyRequestHash" VARCHAR(128);

UPDATE "PurchaseOrder"
SET "idempotencyRequestHash" = 'legacy:' || "id"
WHERE "idempotencyKey" IS NOT NULL AND "idempotencyRequestHash" IS NULL;

ALTER TABLE "PurchaseOrder"
ADD CONSTRAINT "PurchaseOrder_idempotency_hash_pair_check" CHECK (
  ("idempotencyKey" IS NULL AND "idempotencyRequestHash" IS NULL) OR
  ("idempotencyKey" IS NOT NULL AND "idempotencyRequestHash" IS NOT NULL)
);
