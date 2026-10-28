import { describe, expect, it } from "vitest";

import { prisma } from "@/lib/database/prisma";
import { hashPassword } from "@/lib/security/passwords";
import { getEggBalance } from "@/server/services/egg-ledger";
import { submitEggSaleRequest } from "@/server/services/egg-sale-service";
import { claimEggSaleForReview, reviewEggSaleRequest } from "@/server/services/sale-review-service";
import {
  confirmManualSettlement,
  recordManualSettlement,
} from "@/server/services/settlement-service";
import { encryptPayoutIdentifier } from "@/server/services/payout-identifier-crypto";

let phoneCounter = 4400000;

async function user(username: string, role: "USER" | "FINANCE" = "USER") {
  phoneCounter += 1;
  const unique = phoneCounter;
  return prisma.user.create({
    data: {
      username,
      usernameNormalized: username,
      phoneE164: `+92330${unique}`,
      passwordHash: await hashPassword("validpassword1"),
      role,
      referralCode: `${username
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 10)}${unique}`,
    },
  });
}

async function setupSaleUser(username: string, eggs = 10) {
  const buyer = await user(username);
  const plan = await prisma.henPlan.create({
    data: {
      code: `${username}`.toUpperCase().slice(0, 40),
      name: `${username} plan`,
      slug: `${username}-plan`,
      shortDescription: "Concurrency test plan.",
      fullDescription: "Concurrency test plan.",
      pricePaisa: BigInt(100_000),
      dailyEggUnits: 2,
      maximumEggUnits: 20,
      validityDays: 10,
      status: "ACTIVE",
      isActive: true,
      termsVersion: "phase3-concurrency",
    },
  });
  const order = await prisma.purchaseOrder.create({
    data: {
      orderReference: `ORD-${username}`.toUpperCase(),
      userId: buyer.id,
      henPlanId: plan.id,
      status: "APPROVED",
      quantity: 1,
      unitPricePaisa: plan.pricePaisa,
      totalAmountPaisa: plan.pricePaisa,
      planNameSnapshot: plan.name,
      planCodeSnapshot: plan.code,
      dailyEggUnitsSnapshot: 2,
      maximumEggUnitsSnapshot: 20,
      validityDaysSnapshot: 10,
      termsVersionSnapshot: "phase3-concurrency",
      paymentDueAt: new Date(Date.now() + 86_400_000),
      approvedAt: new Date(),
    },
  });
  await prisma.henAsset.create({
    data: {
      userId: buyer.id,
      purchaseOrderId: order.id,
      henPlanId: plan.id,
      status: "ACTIVE",
      quantity: 1,
      activatedAt: new Date(),
      productionStartDate: new Date(),
      productionEndDate: new Date(Date.now() + 86_400_000),
      dailyEggUnitsPerHen: 2,
      maximumEggUnitsPerHen: 20,
      totalMaximumEggUnits: 20,
    },
  });
  await prisma.payoutMethod.create({
    data: {
      userId: buyer.id,
      provider: "EASYPAISA",
      accountTitle: "Concurrency Wallet",
      accountIdentifierProtected: encryptPayoutIdentifier("0300000000"),
      accountIdentifierLastFour: "0000",
      isDefault: true,
    },
  });
  await prisma.eggSaleRate.create({
    data: {
      code: "DEMO-EGG-SALE",
      name: "Concurrency rate",
      ratePaisaPerEgg: BigInt(2500),
      effectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
      isActive: true,
    },
  });
  await prisma.eggLedgerEntry.create({
    data: {
      userId: buyer.id,
      entryType: "ADMIN_CREDIT",
      eggUnits: eggs,
      description: "Concurrency test credit",
      sourceType: "ADMIN_ADJUSTMENT",
      sourceId: "test",
      idempotencyKey: `concurrency-credit:${buyer.id}`,
    },
  });
  return buyer;
}

describe("Phase 3 concurrency controls", () => {
  it("prevents concurrent sale overspend", async () => {
    const buyer = await setupSaleUser("phase3_race_overspend", 10);

    const results = await Promise.allSettled([
      submitEggSaleRequest({ user: buyer, eggQuantity: 8, idempotencyKey: "race-overspend-a" }),
      submitEggSaleRequest({ user: buyer, eggQuantity: 8, idempotencyKey: "race-overspend-b" }),
    ]);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(await getEggBalance(buyer.id)).toBe(2);
    expect(await prisma.eggSaleRequest.count({ where: { userId: buyer.id } })).toBe(1);
  });

  it("allows two concurrent 5 egg requests against 10 eggs", async () => {
    const buyer = await setupSaleUser("phase3_race_exact", 10);

    const results = await Promise.allSettled([
      submitEggSaleRequest({ user: buyer, eggQuantity: 5, idempotencyKey: "race-exact-a" }),
      submitEggSaleRequest({ user: buyer, eggQuantity: 5, idempotencyKey: "race-exact-b" }),
    ]);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(2);
    expect(await getEggBalance(buyer.id)).toBe(0);
    expect(await prisma.eggSaleRequest.count({ where: { userId: buyer.id } })).toBe(2);
  });

  it("deduplicates concurrent submissions with the same idempotency key", async () => {
    const buyer = await setupSaleUser("phase3_race_idempotency", 10);

    const results = await Promise.allSettled(
      Array.from({ length: 4 }, () =>
        submitEggSaleRequest({
          user: buyer,
          eggQuantity: 4,
          idempotencyKey: "race-same-key",
        }),
      ),
    );

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(4);
    expect(await getEggBalance(buyer.id)).toBe(6);
    expect(await prisma.eggSaleRequest.count({ where: { userId: buyer.id } })).toBe(1);
  });

  it("keeps rejection release idempotent under a race", async () => {
    const [buyer, finance] = await Promise.all([
      setupSaleUser("phase3_race_release", 10),
      user("phase3_race_fin", "FINANCE"),
    ]);
    const sale = await submitEggSaleRequest({
      user: buyer,
      eggQuantity: 4,
      idempotencyKey: "race-release-sale",
    });

    await claimEggSaleForReview({ actor: finance, publicReference: sale.publicReference });

    await Promise.allSettled([
      reviewEggSaleRequest({
        actor: finance,
        publicReference: sale.publicReference,
        decision: "reject",
        rejectionCategory: "DUPLICATE_REQUEST",
        userVisibleReason: "Rejected during race.",
      }),
      reviewEggSaleRequest({
        actor: finance,
        publicReference: sale.publicReference,
        decision: "reject",
        rejectionCategory: "DUPLICATE_REQUEST",
        userVisibleReason: "Rejected during race.",
      }),
    ]);

    expect(await getEggBalance(buyer.id)).toBe(10);
    expect(
      await prisma.eggLedgerEntry.count({
        where: { sourceType: "EGG_SALE", sourceId: sale.id, entryType: "SALE_RELEASE" },
      }),
    ).toBe(1);
  });

  it("allows only one concurrent settlement finalization", async () => {
    const [buyer, finance] = await Promise.all([
      setupSaleUser("phase3_settlement", 10),
      user("phase3_settle_fin", "FINANCE"),
    ]);
    const sale = await submitEggSaleRequest({
      user: buyer,
      eggQuantity: 4,
      idempotencyKey: "race-settlement-sale",
    });
    await claimEggSaleForReview({ actor: finance, publicReference: sale.publicReference });
    await reviewEggSaleRequest({
      actor: finance,
      publicReference: sale.publicReference,
      decision: "approve",
    });
    const payout = await recordManualSettlement({
      actor: finance,
      publicReference: sale.publicReference,
      settlementReference: "RACE-SETTLEMENT-1",
    });

    const results = await Promise.allSettled([
      confirmManualSettlement({ actor: finance, payoutId: payout.id }),
      confirmManualSettlement({ actor: finance, payoutId: payout.id }),
    ]);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(2);
    expect(await getEggBalance(buyer.id)).toBe(6);
    expect(
      await prisma.eggLedgerEntry.count({
        where: { sourceType: "EGG_SALE", sourceId: sale.id, entryType: "SALE_FINALIZED" },
      }),
    ).toBe(1);
    expect(
      await prisma.notification.count({
        where: { userId: buyer.id, title: "Egg-sale payment completed" },
      }),
    ).toBe(1);
  });
});
