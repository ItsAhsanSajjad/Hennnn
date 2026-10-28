import { prisma } from "@/lib/database/prisma";
import { requireUser } from "@/lib/auth/session";
import { PayoutHistoryClient, PayoutRecord } from "@/components/history/payout-history-client";

export const dynamic = "force-dynamic";

export default async function PayoutsPage() {
  const user = await requireUser();

  const [marketSales, legacyPayouts] = await Promise.all([
    prisma.eggMarketSale.findMany({
      where: {
        userId: user.id,
        status: { in: ["PENDING_PAYMENT", "PROCESSING", "PAID", "COMPLETED", "REJECTED", "CANCELLED"] },
      },
      include: {
        market: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.payout.findMany({
      where: { userId: user.id },
      include: {
        eggSaleRequest: true,
        payoutMethod: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const records: PayoutRecord[] = [
    ...marketSales.map((sale) => {
      const amountRs = Math.round(Number(sale.totalAmountPaisa) / 100);

      let status: PayoutRecord["status"] = "PENDING_PAYMENT";
      if (sale.status === "PAID" || sale.status === "COMPLETED") status = "PAID";
      else if (sale.status === "PROCESSING") status = "PROCESSING";
      else if (sale.status === "REJECTED") status = "REJECTED";
      else if (sale.status === "CANCELLED") status = "CANCELLED";
      else status = "PENDING_PAYMENT";

      return {
        id: sale.id,
        payoutReference: `PAY-${sale.publicReference}`,
        saleReference: sale.publicReference,
        marketName: sale.market.name,
        amountRs,
        paymentMethod: (sale.payoutMethod === "EASYPAISA" ? "EASYPAISA" : "JAZZCASH") as "JAZZCASH" | "EASYPAISA",
        accountNumberMasked: sale.accountNumberMasked || "0300****000",
        accountTitleProtected: sale.accountHolderNameProtected,
        adminTransactionId: sale.adminTransactionId,
        status,
        submittedAt: (sale.submittedAt || sale.createdAt).toISOString(),
        processingAt: sale.processingAt ? sale.processingAt.toISOString() : null,
        paidAt: sale.paidAt ? sale.paidAt.toISOString() : null,
        rejectedAt: sale.rejectedAt ? sale.rejectedAt.toISOString() : null,
        rejectionReason: sale.rejectionReason,
        adminNotes: sale.adminNotes,
      };
    }),
    ...legacyPayouts.map((p) => {
      const amountRs = Math.round(Number(p.amountPaisa) / 100);

      let status: PayoutRecord["status"] = "PENDING_PAYMENT";
      if (p.status === "CONFIRMED") status = "PAID";
      else if (p.status === "FAILED") status = "REJECTED";
      else if (p.status === "CANCELLED") status = "CANCELLED";
      else status = "PROCESSING";

      let paymentMethod: PayoutRecord["paymentMethod"] = "JAZZCASH";
      if (p.payoutProviderSnapshot === "EASYPAISA") paymentMethod = "EASYPAISA";
      else if (p.payoutProviderSnapshot === "BANK_TRANSFER") paymentMethod = "BANK_TRANSFER";

      return {
        id: p.id,
        payoutReference: p.settlementReference || `PAY-${p.id.slice(0, 8).toUpperCase()}`,
        saleReference: p.eggSaleRequest?.publicReference || `SALE-${p.eggSaleRequestId.slice(0, 8).toUpperCase()}`,
        marketName: "Egg Marketplace",
        amountRs,
        paymentMethod,
        accountNumberMasked: p.payoutIdentifierMaskedSnapshot || "0300****000",
        accountTitleProtected: p.payoutMethod?.accountTitle,
        adminTransactionId: p.settlementReferenceNormalized || null,
        status,
        submittedAt: (p.recordedAt || p.createdAt).toISOString(),
        processingAt: null,
        paidAt: p.confirmedAt ? p.confirmedAt.toISOString() : null,
        rejectedAt: p.failedAt ? p.failedAt.toISOString() : null,
        rejectionReason: p.notes,
        adminNotes: p.notes,
      };
    }),
  ].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

  const totalDisbursedRs = records
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + p.amountRs, 0);

  const inFlightPayoutRs = records
    .filter((p) => p.status === "PENDING_PAYMENT" || p.status === "PROCESSING")
    .reduce((sum, p) => sum + p.amountRs, 0);

  const confirmedCount = records.filter((p) => p.status === "PAID").length;

  return (
    <PayoutHistoryClient
      records={records}
      totalDisbursedRs={totalDisbursedRs}
      inFlightPayoutRs={inFlightPayoutRs}
      totalRequestsCount={records.length}
      confirmedCount={confirmedCount}
    />
  );
}
