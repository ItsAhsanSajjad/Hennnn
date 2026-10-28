import { describe, expect, it } from "vitest";

import { prisma } from "@/lib/database/prisma";
import { hashPassword } from "@/lib/security/passwords";
import { createPurchaseOrderForUser } from "@/server/services/purchases";
import { submitPaymentForOrder, reviewPaymentSubmission } from "@/server/services/payments";
import { runEggAccrual } from "@/server/services/egg-accrual";
import { getEggBalance } from "@/server/services/egg-ledger";

const png1x1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
  "base64",
);

async function createUser(
  username: string,
  phoneE164: string,
  role: "USER" | "FINANCE" | "ADMIN" = "USER",
) {
  return prisma.user.create({
    data: {
      username,
      usernameNormalized: username,
      phoneE164,
      passwordHash: await hashPassword("validpassword1"),
      role,
      referralCode: username.toUpperCase().slice(0, 10),
    },
  });
}

describe("Phase 2 purchase and egg accrual flow", () => {
  it("approves a manual payment and credits eggs once per production date", async () => {
    const [user, finance] = await Promise.all([
      createUser("phase2_user", "+923001111111"),
      createUser("phase2_fin", "+923001111112", "FINANCE"),
    ]);
    const plan = await prisma.henPlan.create({
      data: {
        code: "P2-TEST",
        name: "Phase 2 Test Plan",
        slug: "phase-2-test-plan",
        shortDescription: "Phase 2 database test plan.",
        fullDescription: "Phase 2 database test plan for manual payment approval and accrual.",
        pricePaisa: BigInt(100_000),
        dailyEggUnits: 2,
        maximumEggUnits: 6,
        validityDays: 3,
        status: "ACTIVE",
        isActive: true,
        termsVersion: "test",
      },
    });
    const account = await prisma.paymentAccount.create({
      data: {
        provider: "EASYPAISA",
        accountTitle: "Test Account",
        accountIdentifierProtected: "03**-***-0000",
        accountIdentifierLastFour: "0000",
        instructions: "Upload the test receipt after transfer.",
        isActive: true,
      },
    });

    const order = await createPurchaseOrderForUser({
      user,
      planId: plan.id,
      quantity: 1,
      idempotencyKey: "phase2-flow-order",
    });
    expect(order.totalAmountPaisa).toBe(BigInt(100_000));

    const submission = await submitPaymentForOrder({
      user,
      purchaseOrderId: order.id,
      paymentAccountId: account.id,
      transactionReference: "abc 123",
      proofFile: new File([png1x1], "receipt.png", {
        type: "image/png",
      }),
    });

    await reviewPaymentSubmission({
      actor: finance,
      paymentSubmissionId: submission.id,
      decision: "approve",
      reviewNotes: "Looks correct.",
    });

    const asset = await prisma.henAsset.findUnique({ where: { purchaseOrderId: order.id } });
    expect(asset?.status).toBe("ACTIVE");

    const firstRun = await runEggAccrual({ productionDate: new Date() });
    const secondRun = await runEggAccrual({ productionDate: new Date() });
    expect(firstRun.creditedAssets).toBe(1);
    expect(secondRun.creditedAssets).toBe(0);
    expect(await getEggBalance(user.id)).toBe(2);
  });
});
