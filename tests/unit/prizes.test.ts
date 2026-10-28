import { describe, it, expect } from "vitest";
import {
  PRIZE_CATALOGUE,
  calculatePrizeProgress,
  getRemainingInvestmentRs,
} from "@/lib/prizes/config";

describe("Prize Catalogue Configuration & Calculations", () => {
  it("contains the exact 4 authoritative prize milestones", () => {
    expect(PRIZE_CATALOGUE).toHaveLength(4);

    const laptop = PRIZE_CATALOGUE.find((p) => p.id === "laptop-prize");
    expect(laptop).toBeDefined();
    expect(laptop?.category).toBe("Electronics");
    expect(laptop?.requiredInvestmentRs).toBe(1_200_000);
    expect(laptop?.requiredInvestmentPaisa).toBe(120_000_000n);

    const motorcycle = PRIZE_CATALOGUE.find((p) => p.id === "motorcycle-reward");
    expect(motorcycle).toBeDefined();
    expect(motorcycle?.category).toBe("Vehicles");
    expect(motorcycle?.requiredInvestmentRs).toBe(1_400_000);
    expect(motorcycle?.requiredInvestmentPaisa).toBe(140_000_000n);

    const iphone = PRIZE_CATALOGUE.find((p) => p.id === "iphone-reward");
    expect(iphone).toBeDefined();
    expect(iphone?.category).toBe("Electronics");
    expect(iphone?.requiredInvestmentRs).toBe(1_600_000);
    expect(iphone?.requiredInvestmentPaisa).toBe(160_000_000n);

    const car = PRIZE_CATALOGUE.find((p) => p.id === "family-car-reward");
    expect(car).toBeDefined();
    expect(car?.category).toBe("Vehicles");
    expect(car?.requiredInvestmentRs).toBe(7_500_000);
    expect(car?.requiredInvestmentPaisa).toBe(750_000_000n);
  });

  it("calculates progress percentages accurately", () => {
    expect(calculatePrizeProgress(0, 1_200_000)).toBe(0);
    expect(calculatePrizeProgress(600_000, 1_200_000)).toBe(50);
    expect(calculatePrizeProgress(1_200_000, 1_200_000)).toBe(100);
    expect(calculatePrizeProgress(2_000_000, 1_200_000)).toBe(100);
    expect(calculatePrizeProgress(300_000, 1_200_000)).toBe(25);
  });

  it("calculates remaining investment correctly", () => {
    expect(getRemainingInvestmentRs(0, 1_200_000)).toBe(1_200_000);
    expect(getRemainingInvestmentRs(500_000, 1_200_000)).toBe(700_000);
    expect(getRemainingInvestmentRs(1_200_000, 1_200_000)).toBe(0);
    expect(getRemainingInvestmentRs(2_000_000, 1_200_000)).toBe(0);
  });
});
