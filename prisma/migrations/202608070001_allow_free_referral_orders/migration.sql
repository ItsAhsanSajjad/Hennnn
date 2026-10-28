-- Referral-reward orders grant the inviter free hens (unitPricePaisa = 0). The
-- original check required unitPricePaisa > 0, which rejected those free orders and
-- broke payment approval for referred customers. Relax only the price check to >= 0;
-- totalAmountPaisa still must equal quantity * unitPricePaisa (0 for a free order).
ALTER TABLE "PurchaseOrder" DROP CONSTRAINT IF EXISTS "PurchaseOrder_positive_values_check";
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_positive_values_check" CHECK (
    "quantity" > 0 AND
    "unitPricePaisa" >= 0 AND
    "totalAmountPaisa" = ("quantity"::bigint * "unitPricePaisa") AND
    "dailyEggUnitsSnapshot" > 0 AND
    "maximumEggUnitsSnapshot" > 0 AND
    "validityDaysSnapshot" > 0
);
