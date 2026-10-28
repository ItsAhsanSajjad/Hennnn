import { Sprout } from "lucide-react";

import { AdminMetricCard } from "@/components/admin/admin-metric-card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { SuspendHenForm } from "@/components/phase2/suspend-hen-form";
import { StatusBadge } from "@/components/shared/status-badge";
import { requireAdminPermission } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";
import { formatDateTime } from "@/lib/utilities/format";
import { ADMIN_PERMISSIONS, canSuspendHenAssets } from "@/server/policies/authorization";

export const dynamic = "force-dynamic";

export default async function AdminHensPage() {
  const actor = await requireAdminPermission(ADMIN_PERMISSIONS.HENS_VIEW);
  const [hens, activeCount, suspendedCount] = await Promise.all([
    prisma.henAsset.findMany({
      include: { user: true, purchaseOrder: true, henPlan: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.henAsset.count({ where: { status: "ACTIVE" } }),
    prisma.henAsset.count({ where: { status: "SUSPENDED" } }),
  ]);
  const canSuspend = canSuspendHenAssets(actor.role);

  return (
    <div className="grid gap-7">
      <AdminPageHeader
        icon={Sprout}
        eyebrow="Asset operations"
        title="Hen assets"
        description="Track activated assets, production limits, and recorded lifecycle status. Suspension remains a controlled, audited operations action."
      />
      <section className="grid gap-4 sm:grid-cols-3" aria-label="Hen asset summary">
        <AdminMetricCard
          icon={Sprout}
          label="Active assets"
          value={activeCount}
          detail="Assets currently in their production window"
        />
        <AdminMetricCard
          icon={Sprout}
          label="Suspended assets"
          value={suspendedCount}
          detail="Assets restricted by an operations decision"
          tone="rose"
        />
        <AdminMetricCard
          icon={Sprout}
          label="Listed assets"
          value={hens.length}
          detail="Most recent 100 assets shown below"
          tone="amber"
        />
      </section>
      <section className="overflow-hidden rounded-lg border border-mist bg-surface shadow-sm">
        <div className="border-b border-mist px-5 py-4">
          <h2 className="font-extrabold text-forest">Asset register</h2>
          <p className="mt-1 text-xs text-charcoal/60">
            Production counts are ledger-backed and show the current recorded total.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] text-left text-sm">
            <thead className="bg-ivory text-xs font-bold uppercase tracking-normal text-charcoal/60">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Order and plan</th>
                <th className="px-4 py-3">Quantity</th>
                <th className="px-4 py-3">Produced</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Production window</th>
                <th className="px-4 py-3">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mist">
              {hens.map((hen) => (
                <tr key={hen.id} className="align-top transition-colors hover:bg-surface-2">
                  <td className="px-4 py-3 font-bold text-forest">{hen.user.username}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-charcoal">
                      {hen.purchaseOrder.orderReference}
                    </p>
                    <p className="mt-1 text-xs text-charcoal/60">{hen.henPlan.name}</p>
                  </td>
                  <td className="px-4 py-3 text-charcoal/70">{hen.quantity}</td>
                  <td className="px-4 py-3 text-charcoal/70">
                    {hen.totalEggUnitsProduced} / {hen.totalMaximumEggUnits}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      tone={
                        hen.status === "ACTIVE"
                          ? "success"
                          : hen.status === "SUSPENDED"
                            ? "danger"
                            : "pending"
                      }
                    >
                      {hen.status}
                    </StatusBadge>
                  </td>
                  <td className="px-4 py-3 text-charcoal/65">
                    <p>{formatDateTime(hen.productionStartDate)}</p>
                    <p className="mt-1 text-xs text-charcoal/50">
                      to {formatDateTime(hen.productionEndDate)}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    {canSuspend && hen.status === "ACTIVE" ? (
                      <SuspendHenForm henAssetId={hen.id} />
                    ) : (
                      <span className="text-xs text-charcoal/50">No action available</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
