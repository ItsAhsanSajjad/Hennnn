export type RewardStatus = "LOCKED" | "UNLOCKED" | "PENDING" | "COLLECTED" | "REJECTED";

export interface VIPRewardTier {
  id: string;
  levelCode: string; // e.g. "VIP-01"
  levelNumber: number; // e.g. 1
  levelBadge: string; // e.g. "LEVEL 01"
  requiredLevel1InvestmentRs: number;
  goldenEggReward: number;
  description: string;
}

export const VIP_REWARD_TIERS: VIPRewardTier[] = [
  {
    id: "vip-01",
    levelCode: "VIP-01",
    levelNumber: 1,
    levelBadge: "LEVEL 01",
    requiredLevel1InvestmentRs: 100_000,
    goldenEggReward: 1_500,
    description: "Complete the Level 1 team investment target to unlock this farm reward.",
  },
  {
    id: "vip-02",
    levelCode: "VIP-02",
    levelNumber: 2,
    levelBadge: "LEVEL 02",
    requiredLevel1InvestmentRs: 400_000,
    goldenEggReward: 9_000,
    description: "Expand your Level 1 agricultural network to 400k verified investment.",
  },
  {
    id: "vip-03",
    levelCode: "VIP-03",
    levelNumber: 3,
    levelBadge: "LEVEL 03",
    requiredLevel1InvestmentRs: 800_000,
    goldenEggReward: 16_000,
    description: "Achieve 800k in direct downline hen activations for major egg bonuses.",
  },
  {
    id: "vip-04",
    levelCode: "VIP-04",
    levelNumber: 4,
    levelBadge: "LEVEL 04",
    requiredLevel1InvestmentRs: 2_000_000,
    goldenEggReward: 40_000,
    description: "Lead your direct farming cooperative past 2M verified investment.",
  },
  {
    id: "vip-05",
    levelCode: "VIP-05",
    levelNumber: 5,
    levelBadge: "LEVEL 05",
    requiredLevel1InvestmentRs: 5_000_000,
    goldenEggReward: 120_000,
    description: "Top-tier conglomerate milestone for elite Level 1 agricultural leaders.",
  },
];

export function calculateRewardProgress(
  currentInvestmentRs: number,
  requiredInvestmentRs: number
): number {
  if (requiredInvestmentRs <= 0) return 100;
  const rawProgress = (currentInvestmentRs / requiredInvestmentRs) * 100;
  return Math.min(100, Math.max(0, Math.round(rawProgress * 10) / 10));
}

export function getRemainingRewardInvestmentRs(
  currentInvestmentRs: number,
  requiredInvestmentRs: number
): number {
  return Math.max(0, requiredInvestmentRs - currentInvestmentRs);
}
