import { prisma } from "@/lib/database/prisma";
import { requireUser } from "@/lib/auth/session";
import { DepositsClient, DepositRecordData } from "@/components/deposits/deposits-client";

export const dynamic = "force-dynamic";

export default async function DepositsPage() {
  const user = await requireUser();

  const orders = await prisma.purchaseOrder.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      paymentSubmissions: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          paymentAccount: true,
          proofs: { take: 1 },
        },
      },
    },
  });

  const approvedDepositsPaisa = orders
    .filter((o) => o.status === "APPROVED")
    .reduce((acc, curr) => acc + BigInt(curr.totalAmountPaisa), 0n);

  const pendingDepositsPaisa = orders
    .filter((o) => ["PAYMENT_SUBMITTED", "UNDER_REVIEW", "AWAITING_PAYMENT"].includes(o.status))
    .reduce((acc, curr) => acc + BigInt(curr.totalAmountPaisa), 0n);

  const rejectedDepositsPaisa = orders
    .filter((o) => ["REJECTED", "CANCELLED", "EXPIRED"].includes(o.status))
    .reduce((acc, curr) => acc + BigInt(curr.totalAmountPaisa), 0n);

  const records: DepositRecordData[] = orders.map((o) => {
    const latestSubmission = o.paymentSubmissions[0];
    let mappedStatus: "APPROVED" | "PENDING" | "REJECTED" | "CANCELLED" = "PENDING";
    if (o.status === "APPROVED") mappedStatus = "APPROVED";
    else if (o.status === "REJECTED") mappedStatus = "REJECTED";
    else if (o.status === "CANCELLED" || o.status === "EXPIRED") mappedStatus = "CANCELLED";

    const isPaybost = o.orderReference.startsWith("PB-") || latestSubmission?.method === "PAYBOST";

    return {
      id: o.id,
      orderReference: o.orderReference,
      planName: o.planNameSnapshot,
      quantity: o.quantity,
      totalAmountRs: Number(o.totalAmountPaisa / 100n),
      paymentMethod: isPaybost ? "PAYBOST" : "MANUAL",
      status: mappedStatus,
      rawStatus: o.status,
      createdAt: o.createdAt.toISOString(),
      paymentProviderName: latestSubmission?.paymentAccount?.accountTitle || null,
      transactionReference: latestSubmission?.transactionReference || null,
      proofImageUrl: latestSubmission?.proofs[0]?.safeFileName || null,
      adminReviewNotes: latestSubmission?.reviewNotes || null,
    };
  });

  return (
    <DepositsClient
      totalApprovedRs={Number(approvedDepositsPaisa / 100n)}
      totalPendingRs={Number(pendingDepositsPaisa / 100n)}
      totalRejectedRs={Number(rejectedDepositsPaisa / 100n)}
      totalRecordsCount={orders.length}
      records={records}
    />
  );
}
