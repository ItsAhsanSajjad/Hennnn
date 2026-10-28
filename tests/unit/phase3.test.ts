import { describe, expect, it } from "vitest";

import {
  calculateEggSaleAmountPaisa,
  createEggSaleIdempotencyHash,
  maskPayoutIdentifier,
  maskTeamIdentity,
  normalizeSettlementReference,
} from "@/lib/utilities/phase3";
import { assertEggSaleTransition } from "@/server/services/egg-sale-transitions";

describe("Phase 3 utilities", () => {
  it("calculates egg-sale money with exact integer paisa", () => {
    expect(calculateEggSaleAmountPaisa({ eggQuantity: 7, ratePaisaPerEgg: BigInt(2500) })).toBe(
      BigInt(17_500),
    );
  });

  it("rejects invalid egg-sale quantities and rates", () => {
    expect(() =>
      calculateEggSaleAmountPaisa({ eggQuantity: 0, ratePaisaPerEgg: BigInt(2500) }),
    ).toThrow("positive whole");
    expect(() =>
      calculateEggSaleAmountPaisa({ eggQuantity: 1, ratePaisaPerEgg: BigInt(0) }),
    ).toThrow("positive");
  });

  it("includes rate identity in sale idempotency hashes", () => {
    const first = createEggSaleIdempotencyHash({
      eggQuantity: 3,
      rateId: "rate-a",
      ratePaisaPerEgg: BigInt(100),
    });
    const second = createEggSaleIdempotencyHash({
      eggQuantity: 3,
      rateId: "rate-b",
      ratePaisaPerEgg: BigInt(100),
    });
    expect(first).not.toBe(second);
  });

  it("includes the selected payout method in sale idempotency hashes", () => {
    const first = createEggSaleIdempotencyHash({
      eggQuantity: 3,
      rateId: "rate-a",
      ratePaisaPerEgg: BigInt(100),
      payoutMethodId: "method-a",
    });
    const second = createEggSaleIdempotencyHash({
      eggQuantity: 3,
      rateId: "rate-a",
      ratePaisaPerEgg: BigInt(100),
      payoutMethodId: "method-b",
    });
    expect(first).not.toBe(second);
  });

  it("allows only the central egg-sale operational transitions", () => {
    expect(() =>
      assertEggSaleTransition({ from: "AWAITING_REVIEW", to: "UNDER_REVIEW" }),
    ).not.toThrow();
    expect(() =>
      assertEggSaleTransition({ from: "UNDER_REVIEW", to: "PAYMENT_PROCESSING" }),
    ).not.toThrow();
    expect(() => assertEggSaleTransition({ from: "PAYMENT_PROCESSING", to: "PAID" })).not.toThrow();
    expect(() => assertEggSaleTransition({ from: "PAID", to: "UNDER_REVIEW" })).toThrow(
      "Egg-sale request cannot move from PAID to UNDER_REVIEW.",
    );
  });

  it("masks payout identifiers for routine views", () => {
    const masked = maskPayoutIdentifier("0300 123 4567");
    expect(masked.lastFour).toBe("4567");
    expect(masked.maskedValue).toContain("4567");
    expect(masked.maskedValue).not.toContain("123");
  });

  it("normalizes settlement references", () => {
    expect(normalizeSettlementReference(" ref 123 ")).toBe("REF123");
  });

  it("masks team identity", () => {
    expect(maskTeamIdentity({ username: "demo_user", phoneE164: "+923001234567" })).toBe(
      "dem*** / ending 4567",
    );
  });
});
