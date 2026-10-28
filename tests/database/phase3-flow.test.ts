import { describe, expect, it } from "vitest";

import { prisma } from "@/lib/database/prisma";
import { hashPassword } from "@/lib/security/passwords";
import { getEggBalance } from "@/server/services/egg-ledger";
import { submitEggSaleRequest, cancelEggSaleRequest } from "@/server/services/egg-sale-service";
import { claimEggSaleForReview, reviewEggSaleRequest } from "@/server/services/sale-review-service";
import {
  confirmManualSettlement,
  recordManualSettlement,
} from "@/server/services/settlement-service";
import { createPurchaseOrderForUser } from "@/server/services/purchases";
import { reviewPaymentSubmission, submitPaymentForOrder } from "@/server/services/payments";
import { decryptPayoutIdentifier, encryptPayoutIdentifier } from "@/server/services/payout-identifier-crypto";

const png1x1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
  "base64",
);

let phoneCounter = 3300000;

async function user(username: string, role: "USER" | "FINANCE" | "ADMIN" = "USER") {
  phoneCounter += 1;
  const unique = phoneCounter;
  return prisma.user.create({
    data: {
      username,
      usernameNormalized: username,
      phoneE164: `+92320${unique}`,
      passwordHash: await hashPassword("validpassword1"),
      role,
      referralCode: `${username
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 10)}${unique}`,
    },
  });
}

async function phase3Plan(slug: string) {
  return prisma.henPlan.create({
    data: {
      code: slug.toUpperCase().replace(/-/g, "_").slice(0, 40),
      name: `Plan ${slug}`,
      slug,
      shortDescription: "Phase 3 test plan.",
      fullDescription: "Phase 3 test plan for sale eligibility and referral rewards.",
      pricePaisa: BigInt(100_000),
      dailyEggUnits: 2,
      maximumEggUnits: 20,
      validityDays: 10,
      status: "ACTIVE",
      isActive: true,
      termsVersion: "phase3-test",
    },
  });
}

async function saleRate() {
  return prisma.eggSaleRate.create({
    data: {
      code: "DEMO-EGG-SALE",
      name: "Phase 3 test rate",
      ratePaisaPerEgg: BigInt(2500),
      effectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
      isActive: true,
    },
  });
}

async function payoutMethod(userId: string) {
  return prisma.payoutMethod.create({
    data: {
      userId,
      provider: "EASYPAISA",
      accountTitle: "Test Wallet",
      accountIdentifierProtected: encryptPayoutIdentifier("0300000000"),
      accountIdentifierLastFour: "0000",
      isDefault: true,
    },
  });
}

async function makeSaleEligible(username: string) {
  const [buyer, plan] = await Promise.all([user(username), phase3Plan(`${username}-plan`)]);
  const order = await prisma.purchaseOrder.create({
    data: {
      orderReference: `P3-${username}`.toUpperCase(),
      userId: buyer.id,
      henPlanId: plan.id,
      status: "APPROVED",
      quantity: 1,
      unitPricePaisa: plan.pricePaisa,
      totalAmountPaisa: plan.pricePaisa,
      planNameSnapshot: plan.name,
      planCodeSnapshot: plan.code,
      dailyEggUnitsSnapshot: plan.dailyEggUnits,
      maximumEggUnitsSnapshot: plan.maximumEggUnits,
      validityDaysSnapshot: plan.validityDays,
      termsVersionSnapshot: plan.termsVersion,
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
  await payoutMethod(buyer.id);
  await prisma.eggLedgerEntry.create({
    data: {
      userId: buyer.id,
      entryType: "ADMIN_CREDIT",
      eggUnits: 20,
      description: "Phase 3 test credit",
      sourceType: "ADMIN_ADJUSTMENT",
      sourceId: "test",
      idempotencyKey: `phase3-credit:${buyer.id}`,
    },
  });
  return buyer;
}

describe("Phase 3 egg sales, settlements, and referrals", () => {
  it("submits a sale, reserves eggs, and returns the same request on retry", async () => {
    await saleRate();
    const buyer = await makeSaleEligible("phase3_sale_user");

    const first = await submitEggSaleRequest({
      user: buyer,
      eggQuantity: 7,
      idempotencyKey: "phase3-sale-same-key",
    });
    const second = await submitEggSaleRequest({
      user: buyer,
      eggQuantity: 7,
      idempotencyKey: "phase3-sale-same-key",
    });

    expect(first.id).toBe(second.id);
    expect(await getEggBalance(buyer.id)).toBe(13);
    expect(
      await prisma.eggLedgerEntry.count({
        where: { sourceType: "EGG_SALE", sourceId: first.id, entryType: "SALE_RESERVATION" },
      }),
    ).toBe(1);
    expect(first.status).toBe("AWAITING_REVIEW");
    expect(first.payoutIdentifierMaskedSnapshot).toBe("**** 0000");
    expect(decryptPayoutIdentifier(first.payoutIdentifierProtectedSnapshot)).toBe("0300000000");
    await expect(
      submitEggSaleRequest({
        user: buyer,
        eggQuantity: 8,
        idempotencyKey: "phase3-sale-same-key",
      }),
    ).rejects.toThrow("Idempotency key");
  });

  it("blocks sale submission without eligibility or sufficient eggs", async () => {
    await saleRate();
    const noHen = await user("phase3_no_hen");
    await payoutMethod(noHen.id);
    await expect(
      submitEggSaleRequest({ user: noHen, eggQuantity: 1, idempotencyKey: "no-hen-sale-key" }),
    ).rejects.toThrow("approved non-refunded hen");

    const buyer = await makeSaleEligible("phase3_low_balance");
    await expect(
      submitEggSaleRequest({ user: buyer, eggQuantity: 30, idempotencyKey: "low-balance-key" }),
    ).rejects.toThrow("not sufficient");
    await expect(
      submitEggSaleRequest({ user: buyer, eggQuantity: 0.5, idempotencyKey: "fractional-key" }),
    ).rejects.toThrow("positive whole");
  });

  it("rejects another user's payout method and keeps request snapshots immutable", async () => {
    await saleRate();
    const [buyer, other] = await Promise.all([
      makeSaleEligible("phase3_snapshot_user"),
      makeSaleEligible("phase3_other_payout_user"),
    ]);
    const otherMethod = await prisma.payoutMethod.findFirstOrThrow({ where: { userId: other.id } });
    await expect(
      submitEggSaleRequest({
        user: buyer,
        eggQuantity: 2,
        payoutMethodId: otherMethod.id,
        idempotencyKey: "foreign-payout-key",
      }),
    ).rejects.toThrow("Add a payout method");

    const sale = await submitEggSaleRequest({
      user: buyer,
      eggQuantity: 2,
      idempotencyKey: "snapshot-sale-key",
    });
    const buyerMethod = await prisma.payoutMethod.findFirstOrThrow({ where: { userId: buyer.id } });
    await prisma.payoutMethod.update({
      where: { id: buyerMethod.id },
      data: {
        accountTitle: "Changed wallet",
        accountIdentifierProtected: encryptPayoutIdentifier("0300009999"),
      },
    });
    const persisted = await prisma.eggSaleRequest.findUniqueOrThrow({ where: { id: sale.id } });
    expect(persisted.payoutAccountTitleSnapshot).toBe("Test Wallet");
    expect(persisted.payoutIdentifierMaskedSnapshot).toBe("**** 0000");
    expect(decryptPayoutIdentifier(persisted.payoutIdentifierProtectedSnapshot)).toBe("0300000000");
  });

  it("cancels submitted sales and releases eggs exactly once", async () => {
    await saleRate();
    const buyer = await makeSaleEligible("phase3_cancel_user");
    const sale = await submitEggSaleRequest({
      user: buyer,
      eggQuantity: 6,
      idempotencyKey: "phase3-cancel-key",
    });

    await cancelEggSaleRequest({ user: buyer, publicReference: sale.publicReference });
    await cancelEggSaleRequest({ user: buyer, publicReference: sale.publicReference });

    expect(await getEggBalance(buyer.id)).toBe(20);
    expect(
      await prisma.eggLedgerEntry.count({
        where: { sourceType: "EGG_SALE", sourceId: sale.id, entryType: "SALE_RELEASE" },
      }),
    ).toBe(1);
  });

  it("approves, records settlement, and marks paid without a second egg debit", async () => {
    await saleRate();
    const [buyer, finance] = await Promise.all([
      makeSaleEligible("phase3_paid_user"),
      user("phase3_finance", "FINANCE"),
    ]);
    const sale = await submitEggSaleRequest({
      user: buyer,
      eggQuantity: 5,
      idempotencyKey: "phase3-paid-key",
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
      settlementReference: "SETTLE-123",
    });
    await confirmManualSettlement({ actor: finance, payoutId: payout.id });

    expect(await getEggBalance(buyer.id)).toBe(15);
    expect((await prisma.eggSaleRequest.findUnique({ where: { id: sale.id } }))?.status).toBe(
      "PAID",
    );
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

  it("rejects sale requests and releases reserved eggs", async () => {
    await saleRate();
    const [buyer, finance] = await Promise.all([
      makeSaleEligible("phase3_reject_user"),
      user("phase3_finance_reject", "FINANCE"),
    ]);
    const sale = await submitEggSaleRequest({
      user: buyer,
      eggQuantity: 4,
      idempotencyKey: "phase3-reject-key",
    });

    await claimEggSaleForReview({ actor: finance, publicReference: sale.publicReference });
    await reviewEggSaleRequest({
      actor: finance,
      publicReference: sale.publicReference,
      decision: "reject",
      rejectionCategory: "INVALID_PAYMENT_ACCOUNT",
      userVisibleReason: "Demo review rejected.",
    });

    expect(await getEggBalance(buyer.id)).toBe(20);
    expect((await prisma.eggSaleRequest.findUnique({ where: { id: sale.id } }))?.status).toBe(
      "REJECTED",
    );
  });

  it("credits exactly one direct referral reward after approved purchase", async () => {
    const [inviter, invitee, finance] = await Promise.all([
      user("phase3_inviter"),
      user("phase3_invitee"),
      user("phase3_reward_fin", "FINANCE"),
    ]);
    await prisma.referralRule.create({
      data: {
        code: "DIRECT-L1-DEMO",
        name: "Direct test reward",
        rewardEggUnits: 5,
        isActive: true,
        effectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
      },
    });
    await prisma.referralRelationship.create({
      data: { inviterId: inviter.id, inviteeId: invitee.id, sourceCode: inviter.referralCode },
    });
    const plan = await phase3Plan("phase3-referral-plan");
    const account = await prisma.paymentAccount.create({
      data: {
        provider: "EASYPAISA",
        accountTitle: "Reward Account",
        accountIdentifierProtected: "03**-***-0000",
        accountIdentifierLastFour: "0000",
        instructions: "Demo payment instructions.",
        isActive: true,
      },
    });
    const order = await createPurchaseOrderForUser({
      user: invitee,
      planId: plan.id,
      quantity: 1,
      idempotencyKey: "phase3-referral-order",
    });
    const submission = await submitPaymentForOrder({
      user: invitee,
      purchaseOrderId: order.id,
      paymentAccountId: account.id,
      transactionReference: "REF-REWARD-1",
      proofFile: new File([png1x1], "receipt.png", { type: "image/png" }),
    });

    await reviewPaymentSubmission({
      actor: finance,
      paymentSubmissionId: submission.id,
      decision: "approve",
    });

    expect(await prisma.referralReward.count({ where: { inviterUserId: inviter.id } })).toBe(1);
    expect(await getEggBalance(inviter.id)).toBe(5);
  });
});
