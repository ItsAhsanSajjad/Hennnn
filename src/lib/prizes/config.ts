export type PrizeCategory = "Electronics" | "Vehicles";

export type PrizeClaimStatus = "LOCKED" | "ELIGIBLE" | "PENDING" | "APPROVED" | "DELIVERED" | "REJECTED";

export interface PrizeMilestone {
  id: string;
  name: string;
  category: PrizeCategory;
  requiredInvestmentRs: number;
  requiredInvestmentPaisa: bigint;
  shortDescription: string;
  fullDescription: string;
  image: string;
  displayOrder: number;
  isActive: boolean;
  terms: string[];
  claimInstructions: string;
}

export const PRIZE_CATALOGUE: PrizeMilestone[] = [
  {
    id: "laptop-prize",
    name: "Laptop Prize",
    category: "Electronics",
    requiredInvestmentRs: 1_200_000,
    requiredInvestmentPaisa: 120_000_000n,
    shortDescription: "High-performance professional workstation laptop for enterprise agricultural & flock management.",
    fullDescription: "Equipped with high-speed multi-core processing, 16GB RAM, 512GB NVMe SSD, and high-resolution display for seamless remote farm ledger management.",
    image: "/assets/dashboard/prizes/prize-laptop.webp",
    displayOrder: 1,
    isActive: true,
    terms: [
      "Requires confirmed minimum verified investment of PKR 1,200,000 across active or completed hen plans.",
      "One laptop prize claim permitted per verified agricultural investor account.",
      "Fulfilment delivered directly to verified CNIC residential address or official partner pickup center in Pakistan.",
      "Physical unit comes with official 1-year manufacturer warranty.",
    ],
    claimInstructions: "Once your verified investment reaches PKR 1,200,000, click 'Claim Prize' to initiate fulfillment verification with our dispatch desk.",
  },
  {
    id: "motorcycle-reward",
    name: "Motorcycle Reward",
    category: "Vehicles",
    requiredInvestmentRs: 1_400_000,
    requiredInvestmentPaisa: 140_000_000n,
    shortDescription: "Durable, fuel-efficient 125cc utility motorcycle for smooth agricultural logistics & transport.",
    fullDescription: "Reliable 4-stroke 125cc commercial motorcycle equipped with front disc brakes, reinforced rear carrier, and low fuel consumption for daily farm operations.",
    image: "/assets/dashboard/prizes/prize-motorcycle.webp",
    displayOrder: 2,
    isActive: true,
    terms: [
      "Requires confirmed minimum verified investment of PKR 1,400,000 across active or completed hen plans.",
      "Vehicle delivered brand new with zero kilometers and factory invoice documentation.",
      "Excise registration and road tax are processed in the member's official registered name.",
      "Claim is subject to final verification of purchase order transaction receipts.",
    ],
    claimInstructions: "Upon unlocking the PKR 1,400,000 milestone, submit your claim. Our logistics coordinator will contact you to confirm registration paperwork.",
  },
  {
    id: "iphone-reward",
    name: "iPhone Reward",
    category: "Electronics",
    requiredInvestmentRs: 1_600_000,
    requiredInvestmentPaisa: 160_000_000n,
    shortDescription: "Flagship titanium smartphone with advanced camera and battery life for real-time mobile portal access.",
    fullDescription: "Latest flagship generation device with aerospace-grade titanium enclosure, Super Retina XDR OLED display, and PTA approval for all telecom networks in Pakistan.",
    image: "/assets/dashboard/prizes/prize-iphone.webp",
    displayOrder: 3,
    isActive: true,
    terms: [
      "Requires confirmed minimum verified investment of PKR 1,600,000 across active or completed hen plans.",
      "100% official PTA-approved handset in factory sealed box with official local warranty.",
      "Shipped via insured premium courier service with tracking and signature required.",
      "Claimable once per verified farming account.",
    ],
    claimInstructions: "When your verified investment reaches PKR 1,600,000, submit your claim to receive your sealed device via insured courier.",
  },
  {
    id: "family-car-reward",
    name: "Family Car Reward",
    category: "Vehicles",
    requiredInvestmentRs: 7_500_000,
    requiredInvestmentPaisa: 750_000_000n,
    shortDescription: "Spacious modern crossover SUV vehicle awarded to top-tier commercial farming partners.",
    fullDescription: "Brand new modern 5-passenger luxury crossover SUV featuring automated transmission, panoramic sunroof, digital cockpit, and advanced safety assistance.",
    image: "/assets/dashboard/prizes/prize-car.webp",
    displayOrder: 4,
    isActive: true,
    terms: [
      "Requires confirmed minimum verified investment of PKR 7,500,000 in approved hen flock custody plans.",
      "Awarded as a brand-new vehicle delivered at an authorized regional showroom in Pakistan.",
      "Includes comprehensive delivery orientation, factory documentation, and warranty booklet.",
      "Enterprise verification required prior to ceremonial key handover.",
    ],
    claimInstructions: "Upon reaching the PKR 7,500,000 tier, our executive partner desk will schedule an in-person handover at your nearest authorized dealership.",
  },
];

export function calculatePrizeProgress(verifiedInvestmentRs: number, requiredInvestmentRs: number) {
  if (requiredInvestmentRs <= 0) return 0;
  const rawProgress = (verifiedInvestmentRs / requiredInvestmentRs) * 100;
  return Math.min(100, Math.max(0, Math.round(rawProgress * 10) / 10));
}

export function getRemainingInvestmentRs(verifiedInvestmentRs: number, requiredInvestmentRs: number) {
  return Math.max(0, requiredInvestmentRs - verifiedInvestmentRs);
}
