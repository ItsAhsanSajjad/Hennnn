import { PrismaPg } from "@prisma/adapter-pg";
import {
  PrismaClient,
  type EggLedgerEntryType,
  type EggLedgerSourceType,
  type UserRole,
} from "@prisma/client";

import { brand } from "../src/config/brand";
import { hashPassword } from "../src/lib/security/passwords";
import { maskPayoutIdentifier } from "../src/lib/utilities/phase3";
import { normalizePakistaniPhone, normalizeUsername } from "../src/lib/validation/auth";
import { encryptPayoutIdentifier } from "../src/server/services/payout-identifier-crypto";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://pakhen:pakhen_dev_password@localhost:5432/pakhen_dev?schema=public";
const databaseSchema = new URL(databaseUrl).searchParams.get("schema") ?? "public";
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }, { schema: databaseSchema }),
});

type SeedUser = {
  username: string;
  phone: string;
  password: string;
  role: UserRole;
  referralCode: string;
};

function readSeedUser(prefix: "ADMIN" | "USER" | "FINANCE", fallback: SeedUser): SeedUser {
  return {
    username: process.env[`SEED_${prefix}_USERNAME`] || fallback.username,
    phone: process.env[`SEED_${prefix}_PHONE`] || fallback.phone,
    password: process.env[`SEED_${prefix}_PASSWORD`] || fallback.password,
    role: fallback.role,
    referralCode: fallback.referralCode,
  };
}

async function upsertPaymentAccount({
  provider,
  accountTitle,
  accountIdentifierProtected,
  accountIdentifierLastFour,
  bankName,
  iban,
  isVerified,
  instructions,
  isActive,
  displayOrder,
  actorId,
}: {
  provider: "EASYPAISA" | "JAZZCASH" | "BANK_TRANSFER" | "OTHER";
  accountTitle: string;
  accountIdentifierProtected: string;
  accountIdentifierLastFour: string;
  bankName?: string | null;
  iban?: string | null;
  isVerified?: boolean;
  instructions: string;
  isActive: boolean;
  displayOrder: number;
  actorId: string;
}) {
  const existing = await prisma.paymentAccount.findFirst({ where: { provider, accountTitle } });
  const data = {
    provider,
    accountTitle,
    accountIdentifierProtected,
    accountIdentifierLastFour,
    bankName: bankName ?? null,
    iban: iban ?? null,
    isVerified: isVerified ?? true,
    instructions,
    isActive,
    displayOrder,
    updatedByUserId: actorId,
  };

  if (existing) {
    return prisma.paymentAccount.update({ where: { id: existing.id }, data });
  }

  return prisma.paymentAccount.create({
    data: {
      ...data,
      createdByUserId: actorId,
    },
  });
}

async function upsertUser(seed: SeedUser) {
  const phone = normalizePakistaniPhone(seed.phone);
  if (!phone.ok) throw new Error(`Invalid seed phone for ${seed.username}`);

  return prisma.user.upsert({
    where: { usernameNormalized: normalizeUsername(seed.username) },
    update: {
      phoneE164: phone.phoneE164,
      passwordHash: await hashPassword(seed.password),
      role: seed.role,
      status: "ACTIVE",
    },
    create: {
      username: seed.username,
      usernameNormalized: normalizeUsername(seed.username),
      phoneE164: phone.phoneE164,
      passwordHash: await hashPassword(seed.password),
      role: seed.role,
      status: "ACTIVE",
      referralCode: seed.referralCode,
    },
  });
}

async function upsertEggSaleRate({
  code,
  name,
  ratePaisaPerEgg,
  isActive,
  actorId,
  notes,
}: {
  code: string;
  name: string;
  ratePaisaPerEgg: bigint;
  isActive: boolean;
  actorId: string;
  notes: string;
}) {
  const existing = await prisma.eggSaleRate.findFirst({ where: { code, archivedAt: null } });
  const data = {
    name,
    ratePaisaPerEgg,
    effectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
    effectiveUntil: null,
    isActive,
    notes,
    updatedByUserId: actorId,
  };

  if (existing) {
    return prisma.eggSaleRate.update({ where: { id: existing.id }, data });
  }

  return prisma.eggSaleRate.create({
    data: {
      code,
      ...data,
      createdByUserId: actorId,
    },
  });
}

async function upsertReferralRule(actorId: string) {
  return prisma.referralRule.upsert({
    where: { code: "DIRECT-L1-DEMO" },
    update: {
      name: "Direct Level 1 demo reward",
      rewardEggUnits: 5,
      isActive: true,
      effectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
      effectiveUntil: null,
      notes: "Registration alone does not qualify. Only direct approved purchases qualify.",
      updatedByUserId: actorId,
    },
    create: {
      code: "DIRECT-L1-DEMO",
      name: "Direct Level 1 demo reward",
      rewardEggUnits: 5,
      isActive: true,
      effectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
      notes: "Registration alone does not qualify. Only direct approved purchases qualify.",
      createdByUserId: actorId,
      updatedByUserId: actorId,
    },
  });
}

async function upsertPayoutMethod(userId: string) {
  const accountIdentifier = "0300000000";
  const masked = maskPayoutIdentifier(accountIdentifier);
  const existing = await prisma.payoutMethod.findFirst({
    where: { userId, provider: "EASYPAISA", accountIdentifierLastFour: "0000" },
  });
  const data = {
    provider: "EASYPAISA" as const,
    accountTitle: "Demo User Wallet",
    accountIdentifierProtected: encryptPayoutIdentifier(accountIdentifier),
    accountIdentifierLastFour: masked.lastFour,
    status: "ACTIVE" as const,
    isDefault: true,
  };
  if (existing) {
    return prisma.payoutMethod.update({ where: { id: existing.id }, data });
  }
  return prisma.payoutMethod.create({ data: { userId, ...data } });
}

async function upsertApprovedDemoPurchase({
  userId,
  planId,
  orderReference,
}: {
  userId: string;
  planId: string;
  orderReference: string;
}) {
  const order = await prisma.purchaseOrder.upsert({
    where: { orderReference },
    update: {
      henPlanId: planId,
      status: "APPROVED",
      unitPricePaisa: BigInt(75_000),
      totalAmountPaisa: BigInt(75_000),
      planNameSnapshot: "Brown Hen",
      planCodeSnapshot: "PAKHEN-BROWN-HEN-90",
      dailyEggUnitsSnapshot: 1,
      maximumEggUnitsSnapshot: 90,
      validityDaysSnapshot: 90,
      termsVersionSnapshot: "hen-750-90-day-v1",
      approvedAt: new Date("2026-07-01T00:00:00.000Z"),
    },
    create: {
      orderReference,
      userId,
      henPlanId: planId,
      status: "APPROVED",
      quantity: 1,
      unitPricePaisa: BigInt(75_000),
      totalAmountPaisa: BigInt(75_000),
      planNameSnapshot: "Brown Hen",
      planCodeSnapshot: "PAKHEN-BROWN-HEN-90",
      dailyEggUnitsSnapshot: 1,
      maximumEggUnitsSnapshot: 90,
      validityDaysSnapshot: 90,
      termsVersionSnapshot: "hen-750-90-day-v1",
      paymentDueAt: new Date("2026-07-02T00:00:00.000Z"),
      approvedAt: new Date("2026-07-01T00:00:00.000Z"),
    },
  });

  await prisma.henAsset.upsert({
    where: { purchaseOrderId: order.id },
    update: {
      henPlanId: planId,
      status: "ACTIVE",
      productionEndDate: new Date("2026-09-28T00:00:00.000Z"),
      dailyEggUnitsPerHen: 1,
      maximumEggUnitsPerHen: 90,
      totalMaximumEggUnits: 90,
    },
    create: {
      userId,
      purchaseOrderId: order.id,
      henPlanId: planId,
      status: "ACTIVE",
      quantity: 1,
      activatedAt: new Date("2026-07-01T00:00:00.000Z"),
      productionStartDate: new Date("2026-07-01T00:00:00.000Z"),
      productionEndDate: new Date("2026-09-28T00:00:00.000Z"),
      dailyEggUnitsPerHen: 1,
      maximumEggUnitsPerHen: 90,
      totalMaximumEggUnits: 90,
      totalEggUnitsProduced: 20,
    },
  });

  return order;
}

async function createLedgerEntryIfMissing({
  userId,
  eggUnits,
  entryType,
  description,
  sourceType,
  sourceId,
  idempotencyKey,
}: {
  userId: string;
  eggUnits: number;
  entryType: EggLedgerEntryType;
  description: string;
  sourceType: EggLedgerSourceType;
  sourceId: string;
  idempotencyKey: string;
}) {
  const existing = await prisma.eggLedgerEntry.findUnique({ where: { idempotencyKey } });
  if (existing) return existing;
  return prisma.eggLedgerEntry.create({
    data: {
      userId,
      eggUnits,
      entryType,
      description,
      sourceType,
      sourceId,
      idempotencyKey,
    },
  });
}

async function main() {
  if (process.env.NODE_ENV === "production" || process.env.PRODUCT_MODE === "PRODUCTION") {
    throw new Error("The development seed script must not run in production.");
  }

  const adminSeed = readSeedUser("ADMIN", {
    username: "superadmin",
    phone: "03000000011",
    password: "ChangeMeAdmin123!",
    role: "SUPER_ADMIN",
    referralCode: "PAKHENSEEDADM",
  });
  const userSeed = readSeedUser("USER", {
    username: "demo_user",
    phone: "03000000002",
    password: "ChangeMeUser123!",
    role: "USER",
    referralCode: "PAKHENUSR",
  });
  const financeSeed = readSeedUser("FINANCE", {
    username: "finance_user",
    phone: "03000000005",
    password: "ChangeMeFinance123!",
    role: "FINANCE",
    referralCode: "PAKHENFIN",
  });

  const admin = await upsertUser(adminSeed);
  const demoUser = await upsertUser(userSeed);
  const finance = await upsertUser(financeSeed);
  const inviter = await upsertUser({
    username: "seed_inviter",
    phone: "03000000003",
    password: "ChangeMeInvite123!",
    role: "USER",
    referralCode: "INVITERPK",
  });
  const invited = await upsertUser({
    username: "seed_invited",
    phone: "03000000004",
    password: "ChangeMeInvitee123!",
    role: "USER",
    referralCode: "INVITEDPK",
  });

  await prisma.referralRelationship.upsert({
    where: { inviteeId: invited.id },
    update: {
      inviterId: inviter.id,
      sourceCode: inviter.referralCode,
    },
    create: {
      inviterId: inviter.id,
      inviteeId: invited.id,
      sourceCode: inviter.referralCode,
    },
  });

  for (const user of [admin, demoUser, finance, inviter, invited]) {
    await prisma.legalAcceptance.createMany({
      data: [
        {
          userId: user.id,
          documentType: "TERMS",
          documentVersion: brand.legal.termsVersion,
        },
        {
          userId: user.id,
          documentType: "PRIVACY",
          documentVersion: brand.legal.privacyVersion,
        },
      ],
      skipDuplicates: true,
    });
  }

  await prisma.appSetting.upsert({
    where: { key: "product_mode" },
    update: { value: { mode: "DEMO" }, isPublic: true, updatedByUserId: admin.id },
    create: {
      key: "product_mode",
      value: { mode: "DEMO" },
      isPublic: true,
      updatedByUserId: admin.id,
    },
  });

  await prisma.appSetting.upsert({
    where: { key: "public_content" },
    update: {
      value: {
        operatorName: "Business operator details pending verification",
        supportHours: "Support schedule is shown through official contact channels.",
        verificationTimeframe: "Payment proof review timing is shown before you submit an order.",
        eggSalePaymentTimeframe:
          "Approved egg-sale payment timing is shown before you submit a sale request.",
        heroLabel: "Poultry records and egg sales",
        heroHeadline: "Buy Your Hen. Track Every Egg.",
        heroDescription:
          "Choose a poultry plan, submit payment details and receive access after verification. Your hens, egg records, sale requests and payment updates stay organized in one account.",
      },
      isPublic: true,
      updatedByUserId: admin.id,
    },
    create: {
      key: "public_content",
      value: {
        operatorName: "Business operator details pending verification",
        supportHours: "Support schedule is shown through official contact channels.",
        verificationTimeframe: "Payment proof review timing is shown before you submit an order.",
        eggSalePaymentTimeframe:
          "Approved egg-sale payment timing is shown before you submit a sale request.",
        heroLabel: "Poultry records and egg sales",
        heroHeadline: "Buy Your Hen. Track Every Egg.",
        heroDescription:
          "Choose a poultry plan, submit payment details and receive access after verification. Your hens, egg records, sale requests and payment updates stay organized in one account.",
      },
      isPublic: true,
      updatedByUserId: admin.id,
    },
  });

  await prisma.appSetting.upsert({
    where: { key: "referral_purchase_benefit" },
    update: {
      value: {
        isActive: true,
        qualifyingHenQuantity: 1,
        inviterHenRewardPercent: 20,
        inviteeDiscountPaisaPerHen: 10_000,
        notes:
          "Direct referral campaign. A referred customer gets a per-hen discount; the inviter earns a percentage of the referred customer's hens after a qualifying approved purchase.",
      },
      isPublic: false,
      updatedByUserId: admin.id,
    },
    create: {
      key: "referral_purchase_benefit",
      value: {
        isActive: true,
        qualifyingHenQuantity: 1,
        inviterHenRewardPercent: 20,
        inviteeDiscountPaisaPerHen: 10_000,
        notes:
          "Direct referral campaign. A referred customer gets a per-hen discount; the inviter earns a percentage of the referred customer's hens after a qualifying approved purchase.",
      },
      isPublic: false,
      updatedByUserId: admin.id,
    },
  });

  await prisma.appSetting.upsert({
    where: { key: "phase_boundary" },
    update: {
      value: {
        enabledDemoOnly: ["egg_sales", "manual_settlements", "direct_level_1_referral_rewards"],
        disabled: ["external_payout_apis", "live_referral_commissions", "public_financial_launch"],
      },
      isPublic: true,
      updatedByUserId: admin.id,
    },
    create: {
      key: "phase_boundary",
      value: {
        enabledDemoOnly: ["egg_sales", "manual_settlements", "direct_level_1_referral_rewards"],
        disabled: ["external_payout_apis", "live_referral_commissions", "public_financial_launch"],
      },
      isPublic: true,
      updatedByUserId: admin.id,
    },
  });

  const starterPlan = await prisma.henPlan.upsert({
    where: { slug: "starter-hen-demo" },
    update: {
      code: "PAKHEN-BROWN-HEN-125",
      name: "GrowMeta Hen Plan",
      shortDescription:
        "One hen follows the published 125-day egg-record plan after activation.",
      fullDescription:
        "Each hen costs Rs 500. After payment approval, egg entries follow the published plan rules for 125 days, up to 125 recorded eggs. Egg-sale requests use the active rate and are reviewed before settlement.",
      pricePaisa: BigInt(50_000),
      dailyEggUnits: 1,
      maximumEggUnits: 125,
      validityDays: 125,
      minimumQuantity: 1,
      maximumQuantity: 10_000,
      status: "ACTIVE",
      isActive: true,
      isFeatured: true,
      termsVersion: "hen-500-125-day-v1",
      updatedByUserId: admin.id,
    },
    create: {
      code: "PAKHEN-BROWN-HEN-125",
      name: "GrowMeta Hen Plan",
      slug: "starter-hen-demo",
      shortDescription:
        "One hen follows the published 125-day egg-record plan after activation.",
      fullDescription:
        "Each hen costs Rs 500. After payment approval, egg entries follow the published plan rules for 125 days, up to 125 recorded eggs. Egg-sale requests use the active rate and are reviewed before settlement.",
      pricePaisa: BigInt(50_000),
      dailyEggUnits: 1,
      maximumEggUnits: 125,
      validityDays: 125,
      minimumQuantity: 1,
      maximumQuantity: 10_000,
      status: "ACTIVE",
      isActive: true,
      isFeatured: true,
      displayOrder: 10,
      termsVersion: "hen-500-125-day-v1",
      createdByUserId: admin.id,
      updatedByUserId: admin.id,
    },
  });

  await prisma.henPlan.upsert({
    where: { slug: "growth-hen-draft" },
    update: {
      updatedByUserId: admin.id,
    },
    create: {
      code: "DEMO-HEN-GROWTH",
      name: "Growth Hen Draft",
      slug: "growth-hen-draft",
      shortDescription: "Inactive draft plan kept for admin catalogue validation.",
      fullDescription:
        "This inactive demo plan verifies that draft plans remain hidden from the user catalogue until explicitly published.",
      pricePaisa: BigInt(1_200_000),
      dailyEggUnits: 5,
      maximumEggUnits: 150,
      validityDays: 30,
      minimumQuantity: 1,
      maximumQuantity: 3,
      status: "INACTIVE",
      isActive: false,
      isFeatured: false,
      displayOrder: 20,
      termsVersion: "phase-2-demo",
      createdByUserId: admin.id,
      updatedByUserId: admin.id,
    },
  });

  // Remove legacy demo payment accounts
  await prisma.paymentAccount.deleteMany({
    where: {
      accountTitle: {
        in: ["GrowMeta Egg Demo Easypaisa", "GrowMeta Egg Demo Bank", "GrowMeta Egg Demo JazzCash"],
      },
    },
  });

  await upsertPaymentAccount({
    provider: "EASYPAISA",
    accountTitle: "GrowMeta Egg Official Easypaisa",
    accountIdentifierProtected: "03**-***-0000",
    accountIdentifierLastFour: "0000",
    bankName: "Easypaisa / Telenor Microfinance Bank",
    isVerified: true,
    instructions:
      "Send the exact order amount to this official account and upload a clear screenshot of the receipt.",
    isActive: true,
    displayOrder: 10,
    actorId: admin.id,
  });

  await upsertPaymentAccount({
    provider: "JAZZCASH",
    accountTitle: "GrowMeta Egg Official JazzCash",
    accountIdentifierProtected: "03**-***-0000",
    accountIdentifierLastFour: "0000",
    bankName: "JazzCash / Mobilink Microfinance Bank",
    isVerified: true,
    instructions:
      "Send the exact deposit amount via JazzCash App or *786# to this official account and upload a clear screenshot of the receipt.",
    isActive: true,
    displayOrder: 15,
    actorId: admin.id,
  });

  await upsertPaymentAccount({
    provider: "BANK_TRANSFER",
    accountTitle: "GrowMeta Egg Official Settlement Account",
    accountIdentifierProtected: "PK00-DEMO-****-0000",
    accountIdentifierLastFour: "0000",
    bankName: "Meezan Bank Limited",
    iban: "PK00MEZN0000000000000000",
    isVerified: true,
    instructions:
      "Use your Order Reference in the transfer description/purpose and upload a clear receipt image for finance review.",
    isActive: true,
    displayOrder: 20,
    actorId: admin.id,
  });

  const activeRate = await upsertEggSaleRate({
    code: "DEMO-EGG-SALE",
    name: "GrowMeta Egg purchase rate",
    ratePaisaPerEgg: BigInt(2_000),
    isActive: true,
    actorId: admin.id,
    notes: "Rs 20 per egg. Subject to review and configured product rules.",
  });
  await upsertEggSaleRate({
    code: "DEMO-EGG-SALE-INACTIVE",
    name: "Inactive historical demo rate",
    ratePaisaPerEgg: BigInt(2_000),
    isActive: false,
    actorId: admin.id,
    notes: "Inactive seed rate for admin validation.",
  });
  const referralRule = await upsertReferralRule(admin.id);
  const payoutMethod = await upsertPayoutMethod(demoUser.id);
  const eggSalePayoutSnapshot = {
    payoutProviderSnapshot: payoutMethod.provider,
    payoutAccountTitleSnapshot: payoutMethod.accountTitle,
    payoutIdentifierMaskedSnapshot: `**** ${payoutMethod.accountIdentifierLastFour}`,
    payoutIdentifierProtectedSnapshot: payoutMethod.accountIdentifierProtected,
  };
  const payoutRecordSnapshot = {
    payoutProviderSnapshot: payoutMethod.provider,
    payoutIdentifierMaskedSnapshot: `**** ${payoutMethod.accountIdentifierLastFour}`,
    payoutIdentifierProtectedSnapshot: payoutMethod.accountIdentifierProtected,
  };
  await upsertApprovedDemoPurchase({
    userId: demoUser.id,
    planId: starterPlan.id,
    orderReference: "PKH-SEED-P3-ELIGIBLE",
  });
  await createLedgerEntryIfMissing({
    userId: demoUser.id,
    eggUnits: 100,
    entryType: "ADMIN_CREDIT",
    description: "Seed demo egg balance for Phase 3 sale testing",
    sourceType: "ADMIN_ADJUSTMENT",
    sourceId: admin.id,
    idempotencyKey: `seed-phase3-credit:${demoUser.id}`,
  });

  const submittedSale = await prisma.eggSaleRequest.upsert({
    where: { publicReference: "EGG-SEED-SUBMITTED" },
    update: {
      status: "AWAITING_REVIEW",
      payoutMethodId: payoutMethod.id,
      rateId: activeRate.id,
      ratePaisaPerEggSnapshot: activeRate.ratePaisaPerEgg,
      totalAmountPaisa: BigInt(10) * activeRate.ratePaisaPerEgg,
      ...eggSalePayoutSnapshot,
    },
    create: {
      publicReference: "EGG-SEED-SUBMITTED",
      userId: demoUser.id,
      payoutMethodId: payoutMethod.id,
      status: "AWAITING_REVIEW",
      eggQuantity: 10,
      rateId: activeRate.id,
      rateCodeSnapshot: activeRate.code,
      ratePaisaPerEggSnapshot: activeRate.ratePaisaPerEgg,
      totalAmountPaisa: BigInt(10) * activeRate.ratePaisaPerEgg,
      ...eggSalePayoutSnapshot,
      idempotencyKey: "seed-submitted-sale",
      idempotencyRequestHash: "seed-submitted-sale",
    },
  });
  await createLedgerEntryIfMissing({
    userId: demoUser.id,
    eggUnits: -submittedSale.eggQuantity,
    entryType: "SALE_RESERVATION",
    description: "Seed submitted sale reservation",
    sourceType: "EGG_SALE",
    sourceId: submittedSale.id,
    idempotencyKey: `sale-reservation:${submittedSale.id}`,
  });

  const approvedSale = await prisma.eggSaleRequest.upsert({
    where: { publicReference: "EGG-SEED-APPROVED" },
    update: {
      status: "PAYMENT_PROCESSING",
      payoutMethodId: payoutMethod.id,
      rateId: activeRate.id,
      approvedAt: new Date("2026-07-03T00:00:00.000Z"),
      paymentProcessingAt: new Date("2026-07-03T00:00:00.000Z"),
      ...eggSalePayoutSnapshot,
    },
    create: {
      publicReference: "EGG-SEED-APPROVED",
      userId: demoUser.id,
      payoutMethodId: payoutMethod.id,
      status: "PAYMENT_PROCESSING",
      eggQuantity: 8,
      rateId: activeRate.id,
      rateCodeSnapshot: activeRate.code,
      ratePaisaPerEggSnapshot: activeRate.ratePaisaPerEgg,
      totalAmountPaisa: BigInt(8) * activeRate.ratePaisaPerEgg,
      submittedAt: new Date("2026-07-02T00:00:00.000Z"),
      reviewedAt: new Date("2026-07-03T00:00:00.000Z"),
      reviewedByUserId: finance.id,
      approvedAt: new Date("2026-07-03T00:00:00.000Z"),
      paymentProcessingAt: new Date("2026-07-03T00:00:00.000Z"),
      ...eggSalePayoutSnapshot,
      idempotencyKey: "seed-approved-sale",
      idempotencyRequestHash: "seed-approved-sale",
    },
  });
  await createLedgerEntryIfMissing({
    userId: demoUser.id,
    eggUnits: -approvedSale.eggQuantity,
    entryType: "SALE_RESERVATION",
    description: "Seed approved sale reservation",
    sourceType: "EGG_SALE",
    sourceId: approvedSale.id,
    idempotencyKey: `sale-reservation:${approvedSale.id}`,
  });

  const paidSale = await prisma.eggSaleRequest.upsert({
    where: { publicReference: "EGG-SEED-PAID" },
    update: {
      status: "PAID",
      paidAt: new Date("2026-07-04T00:00:00.000Z"),
      payoutMethodId: payoutMethod.id,
      ...eggSalePayoutSnapshot,
    },
    create: {
      publicReference: "EGG-SEED-PAID",
      userId: demoUser.id,
      payoutMethodId: payoutMethod.id,
      status: "PAID",
      eggQuantity: 5,
      rateId: activeRate.id,
      rateCodeSnapshot: activeRate.code,
      ratePaisaPerEggSnapshot: activeRate.ratePaisaPerEgg,
      totalAmountPaisa: BigInt(5) * activeRate.ratePaisaPerEgg,
      submittedAt: new Date("2026-07-02T00:00:00.000Z"),
      reviewedAt: new Date("2026-07-03T00:00:00.000Z"),
      reviewedByUserId: finance.id,
      approvedAt: new Date("2026-07-03T00:00:00.000Z"),
      paidAt: new Date("2026-07-04T00:00:00.000Z"),
      paymentProcessingAt: new Date("2026-07-03T00:00:00.000Z"),
      ...eggSalePayoutSnapshot,
      idempotencyKey: "seed-paid-sale",
      idempotencyRequestHash: "seed-paid-sale",
    },
  });
  await createLedgerEntryIfMissing({
    userId: demoUser.id,
    eggUnits: -paidSale.eggQuantity,
    entryType: "SALE_RESERVATION",
    description: "Seed paid sale reservation",
    sourceType: "EGG_SALE",
    sourceId: paidSale.id,
    idempotencyKey: `sale-reservation:${paidSale.id}`,
  });
  await createLedgerEntryIfMissing({
    userId: demoUser.id,
    eggUnits: 0,
    entryType: "SALE_FINALIZED",
    description: "Seed paid sale finalization",
    sourceType: "EGG_SALE",
    sourceId: paidSale.id,
    idempotencyKey: `sale-finalized:${paidSale.id}`,
  });
  await prisma.payout.upsert({
    where: { eggSaleRequestId: paidSale.id },
    update: {
      status: "CONFIRMED",
      amountPaisa: paidSale.totalAmountPaisa,
      payoutMethodId: payoutMethod.id,
      ...payoutRecordSnapshot,
      confirmedByUserId: finance.id,
      confirmedAt: new Date("2026-07-04T00:00:00.000Z"),
    },
    create: {
      userId: demoUser.id,
      eggSaleRequestId: paidSale.id,
      payoutMethodId: payoutMethod.id,
      amountPaisa: paidSale.totalAmountPaisa,
      status: "CONFIRMED",
      settlementReference: "SETTLEMENT-SEED-PAID",
      settlementReferenceNormalized: "SETTLEMENT-SEED-PAID",
      ...payoutRecordSnapshot,
      createdByUserId: finance.id,
      confirmedByUserId: finance.id,
      recordedAt: new Date("2026-07-04T00:00:00.000Z"),
      confirmedAt: new Date("2026-07-04T00:00:00.000Z"),
    },
  });

  const invitedOrder = await upsertApprovedDemoPurchase({
    userId: invited.id,
    planId: starterPlan.id,
    orderReference: "PKH-SEED-P3-REFERRED",
  });
  const relationship = await prisma.referralRelationship.findUniqueOrThrow({
    where: { inviteeId: invited.id },
  });
  const referralReward = await prisma.referralReward.upsert({
    where: {
      relationshipId_qualifyingPurchaseOrderId: {
        relationshipId: relationship.id,
        qualifyingPurchaseOrderId: invitedOrder.id,
      },
    },
    update: { status: "CREDITED", rewardEggUnits: referralRule.rewardEggUnits },
    create: {
      inviterUserId: inviter.id,
      inviteeUserId: invited.id,
      relationshipId: relationship.id,
      ruleId: referralRule.id,
      qualifyingPurchaseOrderId: invitedOrder.id,
      rewardEggUnits: referralRule.rewardEggUnits,
      status: "CREDITED",
      idempotencyKey: `referral-reward:${relationship.id}:${invitedOrder.id}`,
      creditedAt: new Date("2026-07-05T00:00:00.000Z"),
    },
  });
  const rewardLedger = await createLedgerEntryIfMissing({
    userId: inviter.id,
    eggUnits: referralRule.rewardEggUnits,
    entryType: "REFERRAL_CREDIT",
    description: "Seed direct referral reward",
    sourceType: "REFERRAL_REWARD",
    sourceId: referralReward.id,
    idempotencyKey: `ledger:referral-reward:${relationship.id}:${invitedOrder.id}`,
  });
  await prisma.referralReward.update({
    where: { id: referralReward.id },
    data: { ledgerEntryId: rewardLedger.id, status: "CREDITED" },
  });

  await prisma.appSetting.upsert({
    where: { key: "phase_2_status" },
    update: {
      value: { status: "implemented", productMode: "DEMO" },
      isPublic: true,
      updatedByUserId: admin.id,
    },
    create: {
      key: "phase_2_status",
      value: { status: "implemented", productMode: "DEMO" },
      isPublic: true,
      updatedByUserId: admin.id,
    },
  });

  const INITIAL_EGG_MARKETS = [
    {
      code: "AL-QAIM-MARKET",
      name: "Al Qaim Market",
      description: "Fast liquidity market for daily egg harvests and starter flocks.",
      minEggs: 1,
      maxEggs: 100,
      pricePerEggPaisa: 1000n,
      icon: "Egg",
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
      pricePerEggPaisa: 1500n,
      icon: "Store",
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
      pricePerEggPaisa: 2000n,
      icon: "Building2",
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
      pricePerEggPaisa: 2500n,
      icon: "Landmark",
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
      pricePerEggPaisa: 3000n,
      icon: "Scale",
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
      pricePerEggPaisa: 3500n,
      icon: "Truck",
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
      pricePerEggPaisa: 4000n,
      icon: "TrendingUp",
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
      pricePerEggPaisa: 4500n,
      icon: "Sprout",
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
      pricePerEggPaisa: 5000n,
      icon: "ShieldCheck",
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
      pricePerEggPaisa: 6000n,
      icon: "Crown",
      isVerified: true,
      isActive: true,
      isPaused: false,
      displayOrder: 10,
    },
  ];

  for (const market of INITIAL_EGG_MARKETS) {
    await prisma.eggMarket.upsert({
      where: { code: market.code },
      update: {
        name: market.name,
        description: market.description,
        minEggs: market.minEggs,
        maxEggs: market.maxEggs,
        pricePerEggPaisa: market.pricePerEggPaisa,
        icon: market.icon,
        isVerified: market.isVerified,
        isActive: market.isActive,
        isPaused: market.isPaused,
        displayOrder: market.displayOrder,
        updatedByUserId: admin.id,
      },
      create: {
        code: market.code,
        name: market.name,
        description: market.description,
        minEggs: market.minEggs,
        maxEggs: market.maxEggs,
        pricePerEggPaisa: market.pricePerEggPaisa,
        icon: market.icon,
        isVerified: market.isVerified,
        isActive: market.isActive,
        isPaused: market.isPaused,
        displayOrder: market.displayOrder,
        createdByUserId: admin.id,
      },
    });
  }

  await prisma.appSetting.upsert({
    where: { key: "phase_3_status" },
    update: {
      value: {
        status: "implemented",
        productMode: "DEMO",
        dockerStatus: "NOT RUN",
      },
      isPublic: true,
      updatedByUserId: admin.id,
    },
    create: {
      key: "phase_3_status",
      value: {
        status: "implemented",
        productMode: "DEMO",
        dockerStatus: "NOT RUN",
      },
      isPublic: true,
      updatedByUserId: admin.id,
    },
  });

  console.log("Development seed complete.");
  console.log(`Admin username: ${admin.username}`);
  console.log(`Demo user username: ${demoUser.username}`);
  console.log(`Finance username: ${finance.username}`);
  console.log("Passwords are read from SEED_* environment variables or .env.example defaults.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
