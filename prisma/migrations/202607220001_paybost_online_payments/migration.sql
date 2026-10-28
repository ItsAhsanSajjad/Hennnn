-- Paybost / PayPak online payment support.
-- Idempotent: every statement guards with IF NOT EXISTS so an existing database
-- (including one repaired by hand on shared hosting) can gain the columns safely.

-- New payment method discriminator.
DO $$
BEGIN
  CREATE TYPE "PaymentMethod" AS ENUM ('MANUAL', 'PAYBOST');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

-- Online payments start in a PENDING state (created before the gateway confirms).
-- Kept out of the manual finance review queue, which only lists SUBMITTED/UNDER_REVIEW.
ALTER TYPE "PaymentSubmissionStatus" ADD VALUE IF NOT EXISTS 'PENDING';

-- Gateway columns on the shared payment record.
ALTER TABLE "PaymentSubmission"
  ADD COLUMN IF NOT EXISTS "method" "PaymentMethod" NOT NULL DEFAULT 'MANUAL';
ALTER TABLE "PaymentSubmission"
  ADD COLUMN IF NOT EXISTS "gatewayIdentifier" VARCHAR(32);
ALTER TABLE "PaymentSubmission"
  ADD COLUMN IF NOT EXISTS "gatewayTxnId" VARCHAR(160);
ALTER TABLE "PaymentSubmission"
  ADD COLUMN IF NOT EXISTS "gatewayStatus" VARCHAR(40);

-- Online payments have no manual bank account: make the FK optional.
ALTER TABLE "PaymentSubmission"
  ALTER COLUMN "paymentAccountId" DROP NOT NULL;

-- Unique gateway identifier so a webhook can find exactly one payment.
CREATE UNIQUE INDEX IF NOT EXISTS "PaymentSubmission_gatewayIdentifier_key"
  ON "PaymentSubmission" ("gatewayIdentifier");

CREATE INDEX IF NOT EXISTS "PaymentSubmission_method_status_idx"
  ON "PaymentSubmission" ("method", "status");
