import { prisma } from "../src/lib/database/prisma";

const INITIAL_EGG_MARKETS = [
  {
    code: "AL-QAIM-MARKET",
    name: "Al Qaim Market",
    description: "Fast liquidity market for daily egg harvests and starter flocks.",
    minEggs: 1,
    maxEggs: 100,
    pricePerEggPaisa: 1000n, // PKR 10
    icon: "Egg",
    imagePath: "/images/egg-markets/al-qaim.webp",
    imageAlt: "Al Qaim Market 3D illustration with fresh eggs and market stall",
    isVerified: true,
    isActive: true,
    isPaused: false,
    displayOrder: 1,
  },
  {
    code: "AL-KHAIR-MARKET",
    name: "Al Khair Market",
    description: "Trusted commercial exchange for growing layer operations.",
    minEggs: 80,
    maxEggs: 250,
    pricePerEggPaisa: 1500n, // PKR 15
    icon: "Store",
    imagePath: "/images/egg-markets/al-khair.webp",
    imageAlt: "Al Khair Market 3D illustration with commercial poultry crates",
    isVerified: true,
    isActive: true,
    isPaused: false,
    displayOrder: 2,
  },
  {
    code: "ZUHAIB-MARKET",
    name: "Zuhaib Market",
    description: "High-volume wholesale vendor with guaranteed immediate settlements.",
    minEggs: 180,
    maxEggs: 350,
    pricePerEggPaisa: 2000n, // PKR 20
    icon: "Building2",
    imagePath: "/images/egg-markets/zuhaib.webp",
    imageAlt: "Zuhaib Market 3D illustration with wholesale market building",
    isVerified: true,
    isActive: true,
    isPaused: false,
    displayOrder: 3,
  },
  {
    code: "MADINA-EGG-MARKET",
    name: "Madina Egg Market",
    description: "Premier city trade hub offering premium rates for standard crates.",
    minEggs: 300,
    maxEggs: 500,
    pricePerEggPaisa: 2500n, // PKR 25
    icon: "Landmark",
    imagePath: "/images/egg-markets/madina.webp",
    imageAlt: "Madina Egg Market 3D illustration with modern trading hub",
    isVerified: true,
    isActive: true,
    isPaused: false,
    displayOrder: 4,
  },
  {
    code: "AL-NOOR-MARKET",
    name: "Al Noor Market",
    description: "Institutional buyers network for established poultry producers.",
    minEggs: 450,
    maxEggs: 700,
    pricePerEggPaisa: 3000n, // PKR 30
    icon: "Scale",
    imagePath: "/images/egg-markets/al-noor.webp",
    imageAlt: "Al Noor Market 3D illustration with institutional trading center",
    isVerified: true,
    isActive: true,
    isPaused: false,
    displayOrder: 5,
  },
  {
    code: "BARKAT-POULTRY-MARKET",
    name: "Barkat Poultry Market",
    description: "Commercial distribution partner for high-output daily operations.",
    minEggs: 650,
    maxEggs: 900,
    pricePerEggPaisa: 3500n, // PKR 35
    icon: "Truck",
    imagePath: "/images/egg-markets/barkat.webp",
    imageAlt: "Barkat Poultry Market 3D illustration with distribution logistics",
    isVerified: true,
    isActive: true,
    isPaused: false,
    displayOrder: 6,
  },
  {
    code: "PUNJAB-EGG-EXCHANGE",
    name: "Punjab Egg Exchange",
    description: "Regional commodities trading platform for commercial flocks.",
    minEggs: 850,
    maxEggs: 1200,
    pricePerEggPaisa: 4000n, // PKR 40
    icon: "TrendingUp",
    imagePath: "/images/egg-markets/punjab-exchange.webp",
    imageAlt: "Punjab Egg Exchange 3D illustration with commodities terminal",
    isVerified: true,
    isActive: true,
    isPaused: false,
    displayOrder: 7,
  },
  {
    code: "GREEN-FARM-MARKET",
    name: "Green Farm Market",
    description: "Eco-certified organic egg buyers offering superior grade pricing.",
    minEggs: 1100,
    maxEggs: 1600,
    pricePerEggPaisa: 4500n, // PKR 45
    icon: "Sprout",
    imagePath: "/images/egg-markets/green-farm.webp",
    imageAlt: "Green Farm Market 3D illustration with eco-friendly farm landscape",
    isVerified: true,
    isActive: true,
    isPaused: false,
    displayOrder: 8,
  },
  {
    code: "PAK-POULTRY-MARKET",
    name: "Pak Poultry Market",
    description: "National poultry syndicate with top-tier industrial capacity.",
    minEggs: 1500,
    maxEggs: 2200,
    pricePerEggPaisa: 5000n, // PKR 50
    icon: "ShieldCheck",
    imagePath: "/images/egg-markets/pak-poultry.webp",
    imageAlt: "Pak Poultry Market 3D illustration with industrial enterprise complex",
    isVerified: true,
    isActive: true,
    isPaused: false,
    displayOrder: 9,
  },
  {
    code: "PREMIUM-EGG-EXCHANGE",
    name: "Premium Egg Exchange",
    description: "Exclusive VIP tier exchange for maximum value large-scale harvests.",
    minEggs: 2000,
    maxEggs: 3000,
    pricePerEggPaisa: 6000n, // PKR 60
    icon: "Crown",
    imagePath: "/images/egg-markets/premium-exchange.webp",
    imageAlt: "Premium Egg Exchange 3D illustration with luxury golden egg vault",
    isVerified: true,
    isActive: true,
    isPaused: false,
    displayOrder: 10,
  },
];

async function main() {
  console.log("Seeding Egg Markets...");
  const admin = await prisma.user.findFirst({
    where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
  });

  for (const market of INITIAL_EGG_MARKETS) {
    const result = await prisma.eggMarket.upsert({
      where: { code: market.code },
      update: {
        name: market.name,
        description: market.description,
        minEggs: market.minEggs,
        maxEggs: market.maxEggs,
        pricePerEggPaisa: market.pricePerEggPaisa,
        icon: market.icon,
        imagePath: market.imagePath,
        imageAlt: market.imageAlt,
        isVerified: market.isVerified,
        isActive: market.isActive,
        isPaused: market.isPaused,
        displayOrder: market.displayOrder,
        updatedByUserId: admin?.id,
      },
      create: {
        code: market.code,
        name: market.name,
        description: market.description,
        minEggs: market.minEggs,
        maxEggs: market.maxEggs,
        pricePerEggPaisa: market.pricePerEggPaisa,
        icon: market.icon,
        imagePath: market.imagePath,
        imageAlt: market.imageAlt,
        isVerified: market.isVerified,
        isActive: market.isActive,
        isPaused: market.isPaused,
        displayOrder: market.displayOrder,
        createdByUserId: admin?.id,
      },
    });
    console.log(`✓ Upserted: ${result.name} (PKR ${Number(result.pricePerEggPaisa) / 100}/egg)`);
  }

  console.log("Successfully seeded all 10 Egg Markets!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
