import { InnerPageHeader } from "@/components/layout/inner-page-header";
import { EggMarketsClient } from "@/components/egg-markets/egg-markets-client";
import { requireUser } from "@/lib/auth/session";
import {
  getEggMarkets,
  getEggMarketStats,
  getUserActiveEggPayouts,
  getUserEggMarketSales,
} from "@/server/services/egg-market-service";
import { ensureEggAccrualsCurrent } from "@/server/services/egg-accrual";

export const dynamic = "force-dynamic";

export default async function SellEggsPage() {
  const user = await requireUser();
  await ensureEggAccrualsCurrent();

  const [markets, stats, activePayouts, recentSales] = await Promise.all([
    getEggMarkets(user.id),
    getEggMarketStats(user.id),
    getUserActiveEggPayouts(user.id),
    getUserEggMarketSales(user.id, 10),
  ]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300 pb-12">
      {/* 1. Shared Inner Top Bar */}
      <InnerPageHeader
        title="Sell Eggs"
        subtitle="Trade your daily collected eggs across 10 official wholesale markets for manual JazzCash or Easypaisa cash payouts."
        actionLabel="Egg Ledger"
        actionHref="/dashboard/egg-ledger"
        actionIcon="egg"
      />

      {/* 2. Main Egg Markets Client */}
      <EggMarketsClient
        markets={markets}
        stats={stats}
        activePayouts={activePayouts.map((p) => ({
          id: p.id,
          publicReference: p.publicReference,
          eggQuantity: p.eggQuantity,
          totalAmountPaisa: p.totalAmountPaisa.toString(),
          status: p.status,
          payoutMethod: p.payoutMethod as any,
          accountNumberMasked: p.accountNumberMasked,
          adminTransactionId: p.adminTransactionId,
          rejectionReason: p.rejectionReason,
          createdAt: p.createdAt,
          submittedAt: p.submittedAt,
          processingAt: p.processingAt,
          paidAt: p.paidAt,
          market: {
            id: p.market.id,
            name: p.market.name,
            code: p.market.code,
            icon: p.market.icon,
            imagePath: p.market.imagePath,
          },
        }))}
        recentSales={recentSales.map((sale) => ({
          id: sale.id,
          publicReference: sale.publicReference,
          eggQuantity: sale.eggQuantity,
          totalAmountPaisa: sale.totalAmountPaisa.toString(),
          pricePerEggPaisaSnapshot: sale.pricePerEggPaisaSnapshot.toString(),
          status: sale.status,
          payoutMethod: sale.payoutMethod,
          accountNumberMasked: sale.accountNumberMasked,
          adminTransactionId: sale.adminTransactionId,
          createdAt: sale.createdAt,
          market: {
            id: sale.market.id,
            name: sale.market.name,
            code: sale.market.code,
            icon: sale.market.icon,
            imagePath: sale.market.imagePath,
          },
        }))}
      />
    </div>
  );
}

