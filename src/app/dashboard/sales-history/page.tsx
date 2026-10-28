import { prisma } from "@/lib/database/prisma";
import { requireUser } from "@/lib/auth/session";
import { SalesHistoryClient, SaleRecord } from "@/components/history/sales-history-client";

export const dynamic = "force-dynamic";

export default async function SalesHistoryPage() {
  const user = await requireUser();

  const [marketSales, legacySales] = await Promise.all([
    prisma.eggMarketSale.findMany({
      where: { userId: user.id },
      include: {
        market: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.eggSaleRequest.findMany({
      where: { userId: user.id },
      include: {
        rate: true,
        payoutMethod: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const records: SaleRecord[] = [
    ...marketSales.map((sale) => {
      const pricePerEggRs = Number(sale.pricePerEggPaisaSnapshot) / 100;
      const totalAmountRs = Math.round(Number(sale.totalAmountPaisa) / 100);

      let status: SaleRecord["status"] = "PENDING_PAYMENT";
      if (sale.status === "PAID" || sale.status === "COMPLETED") status = "PAID";
      else if (sale.status === "PROCESSING") status = "PROCESSING";
      else if (sale.status === "REJECTED") status = "REJECTED";
      else if (sale.status === "CANCELLED") status = "CANCELLED";
      else status = "PENDING_PAYMENT";

      return {
        id: sale.id,
        publicReference: sale.publicReference,
        marketName: sale.market.name,
        eggQuantity: sale.eggQuantity,
        ratePerEggRs: pricePerEggRs,
        totalAmountRs: totalAmountRs,
        payoutMethod: (sale.payoutMethod === "EASYPAISA" ? "EASYPAISA" : "JAZZCASH") as "JAZZCASH" | "EASYPAISA",
        accountNumberMasked: sale.accountNumberMasked || "0300****000",
        accountHolderNameProtected: sale.accountHolderNameProtected,
        status,
        submittedAt: (sale.submittedAt || sale.createdAt).toISOString(),
        paidAt: sale.paidAt ? sale.paidAt.toISOString() : null,
        processingAt: sale.processingAt ? sale.processingAt.toISOString() : null,
        rejectedAt: sale.rejectedAt ? sale.rejectedAt.toISOString() : null,
        cancelledAt: sale.cancelledAt ? sale.cancelledAt.toISOString() : null,
        adminTransactionId: sale.adminTransactionId,
        adminNotes: sale.adminNotes,
        rejectionReason: sale.rejectionReason,
      };
    }),
    ...legacySales.map((sale) => {
      const pricePerEggRs = Number(sale.ratePaisaPerEggSnapshot) / 100;
      const totalAmountRs = Math.round(Number(sale.totalAmountPaisa) / 100);

      let status: SaleRecord["status"] = "PENDING_PAYMENT";
      if (sale.status === "PAID") status = "PAID";
      else if (sale.status === "PAYMENT_PROCESSING" || sale.status === "APPROVED") status = "PROCESSING";
      else if (sale.status === "REJECTED") status = "REJECTED";
      else if (sale.status === "CANCELLED") status = "CANCELLED";
      else status = "PENDING_PAYMENT";

      return {
        id: sale.id,
        publicReference: sale.publicReference,
        marketName: sale.rate.name || "Egg Marketplace",
        eggQuantity: sale.eggQuantity,
        ratePerEggRs: pricePerEggRs,
        totalAmountRs: totalAmountRs,
        payoutMethod: (sale.payoutProviderSnapshot === "EASYPAISA" ? "EASYPAISA" : "JAZZCASH") as "JAZZCASH" | "EASYPAISA",
        accountNumberMasked: sale.payoutIdentifierMaskedSnapshot || "0300****000",
        accountHolderNameProtected: sale.payoutAccountTitleSnapshot,
        status,
        submittedAt: (sale.submittedAt || sale.createdAt).toISOString(),
        paidAt: sale.paidAt ? sale.paidAt.toISOString() : null,
        processingAt: sale.paymentProcessingAt ? sale.paymentProcessingAt.toISOString() : null,
        rejectedAt: sale.rejectedAt ? sale.rejectedAt.toISOString() : null,
        cancelledAt: sale.cancelledAt ? sale.cancelledAt.toISOString() : null,
        adminTransactionId: null,
        adminNotes: sale.internalReviewNotes,
        rejectionReason: sale.userVisibleReason || sale.rejectionCategory || null,
      };
    }),
  ].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

  const totalSoldEggs = records
    .filter((s) => s.status === "PAID")
    .reduce((sum, s) => sum + s.eggQuantity, 0);

  const totalPaidRs = records
    .filter((s) => s.status === "PAID")
    .reduce((sum, s) => sum + s.totalAmountRs, 0);

  const pendingPayoutRs = records
    .filter((s) => s.status === "PENDING_PAYMENT" || s.status === "PROCESSING")
    .reduce((sum, s) => sum + s.totalAmountRs, 0);

  const completedSalesCount = records.filter((s) => s.status === "PAID").length;

  return (
    <SalesHistoryClient
      records={records}
      totalSoldEggs={totalSoldEggs}
      totalPaidRs={totalPaidRs}
      pendingPayoutRs={pendingPayoutRs}
      completedSalesCount={completedSalesCount}
    />
  );
}
