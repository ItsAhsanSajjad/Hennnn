import { describe, expect, it } from "vitest";

import { prisma } from "@/lib/database/prisma";
import { hashPassword } from "@/lib/security/passwords";
import { createLedgerAdjustment, getEggBalance } from "@/server/services/egg-ledger";
import { createPurchaseOrderForUser } from "@/server/services/purchases";
import { reviewPaymentSubmission, submitPaymentForOrder } from "@/server/services/payments";
import { runEggAccrual } from "@/server/services/egg-accrual";

const png1x1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
  "base64",
);

let phoneCounter = 2000000;

async function user(username: string, role: "USER" | "FINANCE" | "ADMIN" = "USER") {
  phoneCounter += 1;
  return prisma.user.create({
    data: {
      username,
      usernameNormalized: username,
      phoneE164: `+92310${phoneCounter}`,
      passwordHash: await hashPassword("validpassword1"),
      role,
      referralCode: username
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 12),
    },
  });
}

async function plan(slug: string, overrides = {}) {
  return prisma.henPlan.create({
    data: {
      code: slug.toUpperCase().replace(/-/g, "_").slice(0, 40),
      name: `Plan ${slug}`,
      slug,
      shortDescription: "Audited Phase 2 test plan.",
      fullDescription: "Audited Phase 2 test plan with server-side pricing snapshots.",
      pricePaisa: BigInt(250_000),
      dailyEggUnits: 4,
      maximumEggUnits: 10,
      validityDays: 4,
      minimumQuantity: 1,
      maximumQuantity: 2,
      status: "ACTIVE",
      isActive: true,
      termsVersion: "audit-test",
      ...overrides,
    },
  });
}

async function account() {
  return prisma.paymentAccount.create({
    data: {
      provider: "EASYPAISA",
      accountTitle: "Audit Fake Account",
      accountIdentifierProtected: "DEMO-****-0000",
      accountIdentifierLastFour: "0000",
      instructions: "Demo payment instructions only.",
      isActive: true,
    },
  });
}

function proof(name = "receipt.png", bytes = png1x1, type = "image/png") {
  return new File([bytes], name, { type });
}

async function submittedPayment() {
  const [buyer, finance] = await Promise.all([user("audit_buyer"), user("audit_fin", "FINANCE")]);
  const p = await plan("audit-plan");
  const a = await account();
  const order = await createPurchaseOrderForUser({
    user: buyer,
    planId: p.id,
    quantity: 1,
    idempotencyKey: "audit-order-key",
  });
  const submission = await submitPaymentForOrder({
    user: buyer,
    purchaseOrderId: order.id,
    paymentAccountId: a.id,
    transactionReference: "AUD-123",
    proofFile: proof(),
  });
  return { buyer, finance, order, submission };
}

describe("Phase 2 audit regressions", () => {
  it("prices orders from the server and preserves idempotency request hashes", async () => {
    const buyer = await user("order_buyer");
    const p = await plan("server-price-plan", { pricePaisa: BigInt(999_00) });

    const first = await createPurchaseOrderForUser({
      user: buyer,
      planId: p.id,
      quantity: 2,
      idempotencyKey: "same-order-key",
    });
    const second = await createPurchaseOrderForUser({
      user: buyer,
      planId: p.id,
      quantity: 2,
      idempotencyKey: "same-order-key",
    });

    expect(first.id).toBe(second.id);
    expect(first.unitPricePaisa).toBe(BigInt(999_00));
    expect(first.totalAmountPaisa).toBe(BigInt(199_800));

    await expect(
      createPurchaseOrderForUser({
        user: buyer,
        planId: p.id,
        quantity: 1,
        idempotencyKey: "same-order-key",
      }),
    ).rejects.toThrow("Idempotency key was already used");
  });

  it("prevents concurrent duplicate order creation for one idempotency key", async () => {
    const buyer = await user("concurrent_order_buyer");
    const p = await plan("concurrent-order-plan");

    const results = await Promise.allSettled(
      Array.from({ length: 5 }, () =>
        createPurchaseOrderForUser({
          user: buyer,
          planId: p.id,
          quantity: 1,
          idempotencyKey: "concurrent-order-key",
        }),
      ),
    );

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(5);
    expect(await prisma.purchaseOrder.count({ where: { userId: buyer.id } })).toBe(1);
  });

  it("rejects inactive plans and invalid quantities", async () => {
    const buyer = await user("invalid_order_buyer");
    const inactive = await plan("inactive-plan", { status: "INACTIVE", isActive: false });
    await expect(
      createPurchaseOrderForUser({
        user: buyer,
        planId: inactive.id,
        quantity: 1,
        idempotencyKey: "inactive-key",
      }),
    ).rejects.toThrow("not available");

    const p = await plan("quantity-plan");
    await expect(
      createPurchaseOrderForUser({
        user: buyer,
        planId: p.id,
        quantity: 3,
        idempotencyKey: "bad-quantity-key",
      }),
    ).rejects.toThrow("outside the plan limits");
  });

  it("rejects corrupt proof bytes and duplicate proof hashes", async () => {
    const buyer = await user("proof_buyer");
    const p = await plan("proof-plan");
    const a = await account();
    const order = await createPurchaseOrderForUser({
      user: buyer,
      planId: p.id,
      quantity: 1,
      idempotencyKey: "proof-order",
    });

    await expect(
      submitPaymentForOrder({
        user: buyer,
        purchaseOrderId: order.id,
        paymentAccountId: a.id,
        transactionReference: "BADPROOF",
        proofFile: proof("receipt.png", Buffer.from("not an image")),
      }),
    ).rejects.toThrow("Payment proof bytes are not a supported image.");

    await submitPaymentForOrder({
      user: buyer,
      purchaseOrderId: order.id,
      paymentAccountId: a.id,
      transactionReference: "GOODPROOF",
      proofFile: proof(),
    });

    const otherOrder = await createPurchaseOrderForUser({
      user: buyer,
      planId: p.id,
      quantity: 1,
      idempotencyKey: "proof-order-2",
    });
    await expect(
      submitPaymentForOrder({
        user: buyer,
        purchaseOrderId: otherOrder.id,
        paymentAccountId: a.id,
        transactionReference: "GOODPROOF2",
        proofFile: proof("same-bytes.png"),
      }),
    ).rejects.toThrow();
  });

  it("enforces payment ownership and duplicate transaction references", async () => {
    const [buyer, other] = await Promise.all([user("payment_owner"), user("payment_other")]);
    const p = await plan("payment-owner-plan");
    const a = await account();
    const order = await createPurchaseOrderForUser({
      user: buyer,
      planId: p.id,
      quantity: 1,
      idempotencyKey: "payment-owner-key",
    });

    await expect(
      submitPaymentForOrder({
        user: other,
        purchaseOrderId: order.id,
        paymentAccountId: a.id,
        transactionReference: "NOPE",
        proofFile: proof(),
      }),
    ).rejects.toThrow("not ready");

    await submitPaymentForOrder({
      user: buyer,
      purchaseOrderId: order.id,
      paymentAccountId: a.id,
      transactionReference: " ref 123 ",
      proofFile: proof(),
    });

    const otherOrder = await createPurchaseOrderForUser({
      user: buyer,
      planId: p.id,
      quantity: 1,
      idempotencyKey: "payment-owner-key-2",
    });
    await expect(
      submitPaymentForOrder({
        user: buyer,
        purchaseOrderId: otherOrder.id,
        paymentAccountId: a.id,
        transactionReference: "REF123",
        proofFile: proof("different-name.png", Buffer.concat([png1x1, Buffer.from([1])])),
      }),
    ).rejects.toThrow();
  });

  it("accepts a payment proof without a customer transaction reference", async () => {
    const buyer = await user("payment_no_reference");
    const p = await plan("payment-no-reference-plan");
    const a = await account();
    const order = await createPurchaseOrderForUser({
      user: buyer,
      planId: p.id,
      quantity: 1,
      idempotencyKey: "payment-no-reference-order",
    });

    const submission = await submitPaymentForOrder({
      user: buyer,
      purchaseOrderId: order.id,
      paymentAccountId: a.id,
      proofFile: proof(),
    });

    expect(submission.transactionReference).toMatch(/^PAYMENT-PROOF-[A-F0-9]{24}$/);
    expect(submission.orderReference).toBe(order.orderReference);
    await expect(
      prisma.purchaseOrder.findUniqueOrThrow({ where: { id: order.id } }),
    ).resolves.toMatchObject({ status: "PAYMENT_SUBMITTED" });
  });

  it("makes approval idempotent under concurrency and creates one hen", async () => {
    const { finance, order, submission } = await submittedPayment();
    const results = await Promise.allSettled([
      reviewPaymentSubmission({
        actor: finance,
        paymentSubmissionId: submission.id,
        decision: "approve",
      }),
      reviewPaymentSubmission({
        actor: finance,
        paymentSubmissionId: submission.id,
        decision: "approve",
      }),
    ]);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(2);
    expect(await prisma.henAsset.count({ where: { purchaseOrderId: order.id } })).toBe(1);
    expect(
      (await prisma.paymentSubmission.findUnique({ where: { id: submission.id } }))?.status,
    ).toBe("APPROVED");
  });

  it("requires rejection reason and never activates a hen on rejection", async () => {
    const { finance, order, submission } = await submittedPayment();
    await expect(
      reviewPaymentSubmission({
        actor: finance,
        paymentSubmissionId: submission.id,
        decision: "reject",
      }),
    ).rejects.toThrow("rejection reason");

    await reviewPaymentSubmission({
      actor: finance,
      paymentSubmissionId: submission.id,
      decision: "reject",
      rejectionReason: "Receipt is unreadable.",
    });
    expect(await prisma.henAsset.count({ where: { purchaseOrderId: order.id } })).toBe(0);
  });

  it("prevents duplicate and concurrent accrual credits", async () => {
    const { finance, buyer, submission } = await submittedPayment();
    await reviewPaymentSubmission({
      actor: finance,
      paymentSubmissionId: submission.id,
      decision: "approve",
    });

    const results = await Promise.allSettled([
      runEggAccrual({ productionDate: new Date() }),
      runEggAccrual({ productionDate: new Date() }),
      runEggAccrual({ productionDate: new Date() }),
    ]);

    expect(results.every((result) => result.status === "fulfilled")).toBe(true);
    expect(await prisma.eggAccrual.count()).toBe(1);
    expect(await getEggBalance(buyer.id)).toBe(4);
  });

  it("prevents concurrent admin debits from making a negative balance", async () => {
    const [admin, target] = await Promise.all([
      user("ledger_admin", "ADMIN"),
      user("ledger_target"),
    ]);
    await createLedgerAdjustment({
      actor: admin,
      userId: target.id,
      eggUnits: 10,
      description: "Initial audit credit",
    });

    const results = await Promise.allSettled([
      createLedgerAdjustment({
        actor: admin,
        userId: target.id,
        eggUnits: -8,
        description: "Concurrent audit debit A",
      }),
      createLedgerAdjustment({
        actor: admin,
        userId: target.id,
        eggUnits: -8,
        description: "Concurrent audit debit B",
      }),
    ]);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(await getEggBalance(target.id)).toBe(2);
  });
});
