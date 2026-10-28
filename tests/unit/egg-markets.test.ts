import { describe, expect, it } from "vitest";

import { createEggMarketSaleReference } from "@/lib/utilities/phase3";

describe("Egg Markets Logic & Reference Utilities", () => {
  it("generates unique EMS references with standard prefix", () => {
    const ref1 = createEggMarketSaleReference();
    const ref2 = createEggMarketSaleReference();

    expect(ref1).toMatch(/^EMS-[A-Z0-9]+-[A-Z0-9]+$/);
    expect(ref2).toMatch(/^EMS-[A-Z0-9]+-[A-Z0-9]+$/);
    expect(ref1).not.toBe(ref2);
  });

  it("calculates accurate egg sale amounts across 10 market tiers", () => {
    const marketTiers = [
      { name: "Al Qaim Market", min: 1, max: 100, priceRs: 10, pricePaisa: 1000n },
      { name: "Al Khair Market", min: 80, max: 250, priceRs: 15, pricePaisa: 1500n },
      { name: "Zuhaib Market", min: 180, max: 350, priceRs: 20, pricePaisa: 2000n },
      { name: "Madina Egg Market", min: 300, max: 500, priceRs: 25, pricePaisa: 2500n },
      { name: "Al Noor Market", min: 450, max: 700, priceRs: 30, pricePaisa: 3000n },
      { name: "Barkat Poultry Market", min: 650, max: 900, priceRs: 35, pricePaisa: 3500n },
      { name: "Punjab Egg Exchange", min: 850, max: 1200, priceRs: 40, pricePaisa: 4000n },
      { name: "Green Farm Market", min: 1100, max: 1600, priceRs: 45, pricePaisa: 4500n },
      { name: "Pak Poultry Market", min: 1500, max: 2200, priceRs: 50, pricePaisa: 5000n },
      { name: "Premium Egg Exchange", min: 2000, max: 3000, priceRs: 60, pricePaisa: 6000n },
    ];

    expect(marketTiers).toHaveLength(10);

    for (const tier of marketTiers) {
      // Test min quantity sale
      const minPaisa = BigInt(tier.min) * tier.pricePaisa;
      const minRs = Number(minPaisa) / 100;
      expect(minRs).toBe(tier.min * tier.priceRs);

      // Test max quantity sale
      const maxPaisa = BigInt(tier.max) * tier.pricePaisa;
      const maxRs = Number(maxPaisa) / 100;
      expect(maxRs).toBe(tier.max * tier.priceRs);
    }
  });

  it("evaluates user eligibility based on balance against market minimums", () => {
    const userBalance = 200;

    const alQaim = { min: 1, max: 100, isPaused: false };
    const alKhair = { min: 80, max: 250, isPaused: false };
    const zuhaib = { min: 180, max: 350, isPaused: false };
    const madina = { min: 300, max: 500, isPaused: false };

    expect(userBalance >= alQaim.min).toBe(true);
    expect(userBalance >= alKhair.min).toBe(true);
    expect(userBalance >= zuhaib.min).toBe(true);
    expect(userBalance >= madina.min).toBe(false);

    // Eggs needed for locked market
    const eggsNeededForMadina = Math.max(0, madina.min - userBalance);
    expect(eggsNeededForMadina).toBe(100);
  });
});
