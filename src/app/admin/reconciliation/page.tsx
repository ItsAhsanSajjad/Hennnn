import { ShieldCheck } from "lucide-react";

import { StatusBadge } from "@/components/shared/status-badge";
import { requireAdminPermission } from "@/lib/auth/session";
import { runPhase3Reconciliation } from "@/server/services/reconciliation-service";
import { ADMIN_PERMISSIONS } from "@/server/policies/authorization";

export const dynamic = "force-dynamic";

export default async function ReconciliationPage() {
  await requireAdminPermission(ADMIN_PERMISSIONS.RECONCILIATION_VIEW);
  const result = await runPhase3Reconciliation();

  return (
    <div className="grid gap-6">
      <section>
        <h1 className="text-3xl font-black text-forest">Phase 3 reconciliation</h1>
        <p className="mt-2 text-sm leading-6 text-charcoal/70">
          Read-only detection for sales, reservations, settlements, referrals, and ledger balances.
        </p>
      </section>

      <section className="rounded-lg border border-mist bg-surface p-6">
        <div className="flex items-center gap-2">
          <ShieldCheck aria-hidden="true" className="text-leaf" size={20} />
          <h2 className="text-xl font-black text-forest">Current result</h2>
          <StatusBadge tone={result.ok ? "success" : "danger"}>
            {result.ok ? "OK" : "FINDINGS"}
          </StatusBadge>
        </div>
        <p className="mt-3 text-sm leading-6 text-charcoal/70">
          {result.findings.length} findings detected. This page does not repair records.
        </p>
      </section>

      {result.findings.length ? (
        <section className="overflow-hidden rounded-lg border border-mist bg-surface">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-mist text-sm">
              <thead className="bg-ivory text-left text-xs font-bold uppercase text-charcoal/65">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Entity</th>
                  <th className="px-4 py-3">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mist">
                {result.findings.map((finding, index) => (
                  <tr key={`${finding.code}-${finding.entityId ?? index}`}>
                    <td className="px-4 py-3 font-semibold text-forest">{finding.code}</td>
                    <td className="px-4 py-3">
                      <StatusBadge tone={finding.severity === "critical" ? "danger" : "pending"}>
                        {finding.severity}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3">
                      {finding.entityType} {finding.entityId ?? ""}
                    </td>
                    <td className="px-4 py-3">{finding.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
