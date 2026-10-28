import { Egg, History, Sprout } from "lucide-react";

import { AdminMetricCard } from "@/components/admin/admin-metric-card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { RunAccrualButton } from "@/components/admin/run-accrual-button";
import { EmptyState } from "@/components/shared/empty-state";
import { requireAdminPermission } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";
import { formatDateTime } from "@/lib/utilities/format";
import { addUtcDays, toPktDate } from "@/lib/utilities/phase2";
import { ADMIN_PERMISSIONS } from "@/server/policies/authorization";
import { ensureEggAccrualsCurrent } from "@/server/services/egg-accrual";

export const dynamic = "force-dynamic";

export default async function AdminEggProductionPage() {
  await requireAdminPermission(ADMIN_PERMISSIONS.EGG_PRODUCTION_VIEW);
  await ensureEggAccrualsCurrent();

  const today = toPktDate(new Date());
  const tomorrow = addUtcDays(today, 1);
  const [todaySummary, recentAccruals, activeHens] = await Promise.all([
    prisma.eggAccrual.aggregate({
      where: { productionDate: { gte: today, lt: tomorrow } },
      _count: { _all: true },
      _sum: { eggUnits: true },
    }),
    prisma.eggAccrual.findMany({
      include: { henAsset: { include: { user: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.henAsset.count({ where: { status: "ACTIVE" } }),
  ]);

  return (
    <div className="grid gap-7">
      <AdminPageHeader
        icon={Egg}
        eyebrow="Production operations"
        title="Egg production"
        description="Daily accrual records are generated against active hen assets. Each entry is unique per asset and production date, with the resulting ledger entries retained separately."
      />

      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl border border-mist bg-surface shadow-xs">
        <div>
          <h3 className="font-extrabold text-forest text-base">On-Demand Egg Accrual Trigger</h3>
          <p className="text-xs text-charcoal/70 mt-0.5">
            Manually trigger or catch up daily egg production for all eligible active hen assets.
          </p>
        </div>
        <RunAccrualButton />
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <AdminMetricCard
          icon={Egg}
          label="Eggs credited today"
          value={todaySummary._sum.eggUnits ?? 0}
          detail="Recorded production credits for current PKT day"
        />
        <AdminMetricCard
          icon={History}
          label="Accruals today"
          value={todaySummary._count._all}
          detail="Unique asset/date production records"
          tone="blue"
        />
        <AdminMetricCard
          icon={Sprout}
          label="Active hen assets"
          value={activeHens}
          detail="Assets eligible for their production window"
          tone="amber"
        />
      </section>
      <section className="overflow-hidden rounded-lg border border-mist bg-surface shadow-sm">
        <div className="border-b border-mist px-5 py-4">
          <h2 className="font-extrabold text-forest">Recent accrual records</h2>
          <p className="mt-1 text-xs text-charcoal/60">
            The newest 100 records are shown. Corrections must use an audited ledger adjustment;
            accrual history is not edited here.
          </p>
        </div>
        {recentAccruals.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-ivory text-xs font-bold uppercase tracking-normal text-charcoal/60">
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Production date</th>
                  <th className="px-4 py-3">Hen quantity</th>
                  <th className="px-4 py-3">Eggs credited</th>
                  <th className="px-4 py-3">Recorded</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mist">
                {recentAccruals.map((accrual) => (
                  <tr key={accrual.id} className="hover:bg-surface-2">
                    <td className="px-4 py-3 font-bold text-forest">
                      {accrual.henAsset.user.username}
                    </td>
                    <td className="px-4 py-3 text-charcoal/70">
                      {formatDateTime(accrual.productionDate)}
                    </td>
                    <td className="px-4 py-3 text-charcoal/70">{accrual.quantity}</td>
                    <td className="px-4 py-3 font-bold text-charcoal">{accrual.eggUnits}</td>
                    <td className="px-4 py-3 text-charcoal/65">
                      {formatDateTime(accrual.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6">
            <EmptyState
              icon={Egg}
              title="No production accruals yet"
              message="The first successful accrual run will create immutable records here."
            />
          </div>
        )}
      </section>
    </div>
  );
}
