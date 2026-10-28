import { Banknote, Clock } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminEggMarketsClient } from "@/components/admin/egg-markets/admin-egg-markets-client";
import { requireAdminPermission } from "@/lib/auth/session";
import { ADMIN_PERMISSIONS } from "@/server/policies/authorization";
import {
  getAdminEggMarkets,
  getAdminEggMarketSales,
} from "@/server/services/egg-market-service";

export const dynamic = "force-dynamic";

export default async function AdminEggMarketsPage() {
  await requireAdminPermission(ADMIN_PERMISSIONS.LEDGER_VIEW);

  const [markets, salesData] = await Promise.all([
    getAdminEggMarkets(),
    getAdminEggMarketSales({ limit: 150 }),
  ]);

  const pendingCount = (salesData.counts as any)?.PENDING_PAYMENT ?? 0;
  const processingCount = (salesData.counts as any)?.PROCESSING ?? 0;

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        icon={Banknote}
        eyebrow="Operations"
        title="Egg Markets & Payout Queue"
        description="Review user manual JazzCash / Easypaisa egg payout requests, copy recipient details, process payments, and configure egg buyback markets."
        actions={
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-center">
              <p className="text-lg font-black text-amber-400">
                {pendingCount + processingCount}
              </p>
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-amber-300">
                Active Payouts
              </p>
            </div>
            <div className="rounded-xl border border-line bg-[#0b1512] px-4 py-2 text-center">
              <p className="text-lg font-black text-content">
                {markets.filter((m) => m.isActive && !m.isPaused).length}
                <span className="text-sm font-bold text-muted"> / {markets.length}</span>
              </p>
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
                Live Markets
              </p>
            </div>
          </div>
        }
      />

      <AdminEggMarketsClient
        markets={markets.map((m) => ({
          id: m.id,
          code: m.code,
          name: m.name,
          description: m.description,
          minEggs: m.minEggs,
          maxEggs: m.maxEggs,
          pricePerEggPaisa: m.pricePerEggPaisa.toString(),
          icon: m.icon,
          imagePath: m.imagePath,
          imageAlt: m.imageAlt,
          isVerified: m.isVerified,
          isActive: m.isActive,
          isPaused: m.isPaused,
          displayOrder: m.displayOrder,
          dailyLimitEggs: m.dailyLimitEggs,
          totalCapacityEggs: m.totalCapacityEggs,
          totalEggsPurchased: m.totalEggsPurchased,
          _count: m._count,
        }))}
        sales={salesData.sales.map((s) => ({
          id: s.id,
          publicReference: s.publicReference,
          eggQuantity: s.eggQuantity,
          pricePerEggPaisaSnapshot: s.pricePerEggPaisaSnapshot.toString(),
          totalAmountPaisa: s.totalAmountPaisa.toString(),
          status: s.status,
          payoutMethod: s.payoutMethod,
          accountNumberMasked: s.accountNumberMasked,
          adminTransactionId: s.adminTransactionId,
          adminNotes: s.adminNotes,
          rejectionReason: s.rejectionReason,
          submittedAt: s.submittedAt,
          processingAt: s.processingAt,
          paidAt: s.paidAt,
          createdAt: s.createdAt,
          user: s.user,
          market: s.market,
          reviewedBy: s.reviewedBy,
        }))}
        statusCounts={salesData.counts}
        totalSalesCount={salesData.total}
      />
    </div>
  );
}

