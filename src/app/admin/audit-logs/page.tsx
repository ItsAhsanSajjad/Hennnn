import { requireAdminPermission } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";
import { formatDateTime } from "@/lib/utilities/format";
import { ADMIN_PERMISSIONS } from "@/server/policies/authorization";

export const dynamic = "force-dynamic";

export default async function AuditLogsPage() {
  await requireAdminPermission(ADMIN_PERMISSIONS.AUDIT_LOGS_VIEW);
  const logs = await prisma.auditLog.findMany({
    include: { actor: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <section className="rounded-lg border border-mist bg-surface p-6">
      <h1 className="text-3xl font-black text-forest">Audit logs</h1>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-ivory text-xs uppercase tracking-normal text-charcoal/60">
            <tr>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Actor</th>
              <th className="px-4 py-3">Entity</th>
              <th className="px-4 py-3">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-mist">
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="px-4 py-3 font-semibold text-charcoal">
                  {log.action.replaceAll("_", " ")}
                </td>
                <td className="px-4 py-3 text-charcoal/70">{log.actor?.username ?? "System"}</td>
                <td className="px-4 py-3 text-charcoal/70">{log.entityType}</td>
                <td className="px-4 py-3 text-charcoal/70">{formatDateTime(log.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
