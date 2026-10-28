import { prisma } from "@/lib/database/prisma";
import { requireUser } from "@/lib/auth/session";
import { WithdrawalsClient, WithdrawalRecordData } from "@/components/withdrawals/withdrawals-client";

export const dynamic = "force-dynamic";

export default async function WithdrawalsPage() {
  const user = await requireUser();

  const [eggSales, eggBalanceRow] = await Promise.all([
    prisma.eggSaleRequest.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        payoutMethod: true,
        payouts: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    }),
    prisma.eggLedgerEntry.aggregate({
      where: { userId: user.id },
      _sum: { eggUnits: true },
    }),
  ]);

  const eggBalance = Math.max(0, Number(eggBalanceRow._sum.eggUnits ?? 0));

  const totalPaidPaisa = eggSales
    .filter((s) => s.status === "APPROVED" || s.status === "PAID")
    .reduce((acc, curr) => acc + BigInt(curr.totalAmountPaisa), 0n);

  const pendingWithdrawalsPaisa = eggSales
    .filter((s) =>
      ["AWAITING_REVIEW", "UNDER_REVIEW", "PAYMENT_PROCESSING", "SUBMITTED"].includes(s.status)
    )
    .reduce((acc, curr) => acc + BigInt(curr.totalAmountPaisa), 0n);

  const rejectedWithdrawalsPaisa = eggSales
    .filter((s) => ["REJECTED", "CANCELLED"].includes(s.status))
    .reduce((acc, curr) => acc + BigInt(curr.totalAmountPaisa), 0n);

  const records: WithdrawalRecordData[] = eggSales.map((s) => {
    const latestPayout = s.payouts[0];
    let mappedStatus: "CONFIRMED" | "PENDING" | "REJECTED" | "CANCELLED" = "PENDING";
    if (s.status === "APPROVED" || s.status === "PAID") mappedStatus = "CONFIRMED";
    else if (s.status === "REJECTED") mappedStatus = "REJECTED";
    else if (s.status === "CANCELLED") mappedStatus = "CANCELLED";

    return {
      id: s.id,
      publicReference: s.publicReference,
      eggQuantity: s.eggQuantity,
      totalAmountRs: Number(s.totalAmountPaisa / 100n),
      ratePaisaPerEgg: Number(s.ratePaisaPerEggSnapshot),
      payoutProvider: s.payoutProviderSnapshot || s.payoutMethod?.provider || null,
      payoutAccountTitle: s.payoutAccountTitleSnapshot || s.payoutMethod?.accountTitle || null,
      payoutIdentifierMasked: s.payoutIdentifierMaskedSnapshot || s.payoutMethod?.accountIdentifierLastFour || null,
      status: mappedStatus,
      rawStatus: s.status,
      submittedAt: s.submittedAt.toISOString(),
      settlementReference: latestPayout?.settlementReference || null,
      adminNotes: s.userVisibleReason || s.internalReviewNotes || null,
    };
  });

  return (
    <WithdrawalsClient
      totalPaidRs={Number(totalPaidPaisa / 100n)}
      totalPendingRs={Number(pendingWithdrawalsPaisa / 100n)}
      totalRejectedRs={Number(rejectedWithdrawalsPaisa / 100n)}
      totalRequestsCount={eggSales.length}
      eggBalance={eggBalance}
      records={records}
    />
  );
}
