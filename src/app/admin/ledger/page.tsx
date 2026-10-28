import { Egg, History } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { LedgerAdjustmentForm } from "@/components/phase2/ledger-adjustment-form";
import { requireAdminPermission } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";
import { formatDateTime } from "@/lib/utilities/format";
import { ADMIN_PERMISSIONS, canAdjustLedger } from "@/server/policies/authorization";

export const dynamic = "force-dynamic";

export default async function AdminLedgerPage() {
  const actor = await requireAdminPermission(ADMIN_PERMISSIONS.LEDGER_VIEW);
  const canAdjust = canAdjustLedger(actor.role);
  const [users, entries] = await Promise.all([
    canAdjust
      ? prisma.user.findMany({
          where: { deletedAt: null, status: "ACTIVE" },
          orderBy: { username: "asc" },
          select: { id: true, username: true },
          take: 200,
        })
      : Promise.resolve([]),
    prisma.eggLedgerEntry.findMany({
      include: { user: true, henAsset: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  return (
    <div className="grid gap-7">
      <AdminPageHeader
        icon={Egg}
        eyebrow="Ledger control"
        title="Egg ledger"
        description="Read the most recent credit, debit, sale, referral, and production entries. Adjustments are restricted to operations administrators and are retained in the audit trail."
      />
      <div className={canAdjust ? "grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]" : "grid gap-6"}>
        {canAdjust ? (
          <aside className="h-fit">
            <LedgerAdjustmentForm users={users} />
          </aside>
        ) : null}
        <section className="overflow-hidden rounded-lg border border-mist bg-surface shadow-sm">
          <div className="flex items-center gap-3 border-b border-mist px-5 py-4">
            <History aria-hidden="true" className="text-leaf" size={20} />
            <div>
              <h2 className="font-extrabold text-forest">Recent ledger entries</h2>
              <p className="mt-1 text-xs text-charcoal/60">
                Showing the most recent 100 recorded entries.
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-ivory text-xs font-bold uppercase tracking-normal text-charcoal/60">
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Entry</th>
                  <th className="px-4 py-3">Egg units</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Recorded</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mist">
                {entries.map((entry) => (
                  <tr key={entry.id} className="transition-colors hover:bg-surface-2">
                    <td className="px-4 py-3 font-bold text-forest">{entry.user.username}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-charcoal">{entry.description}</p>
                      <p className="mt-1 text-xs text-charcoal/55">
                        {entry.entryType.replaceAll("_", " ")}
                      </p>
                    </td>
                    <td className="px-4 py-3 font-bold text-charcoal">
                      {entry.eggUnits > 0 ? "+" : ""}
                      {entry.eggUnits}
                    </td>
                    <td className="px-4 py-3 text-charcoal/65">
                      {entry.sourceType.replaceAll("_", " ")}
                    </td>
                    <td className="px-4 py-3 text-charcoal/65">
                      {formatDateTime(entry.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
