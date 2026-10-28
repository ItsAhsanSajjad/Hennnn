import { Activity, Clock3, ShieldCheck } from "lucide-react";

import { InnerPageHeader } from "@/components/layout/inner-page-header";
import { prisma } from "@/lib/database/prisma";
import { requireUser } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/utilities/format";

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  const user = await requireUser();
  const logs = await prisma.auditLog.findMany({
    where: { actorUserId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* 1. Shared Inner Top Bar */}
      <InnerPageHeader
        title="Account Activity"
        subtitle="Security audit logs and history of all account actions taken."
      />

      {/* 2. Activity Feed Card */}
      <section className="rounded-3xl border border-[#D8793F]/25 bg-[#FFFDF4] p-6 sm:p-8 shadow-[0_14px_32px_rgba(16,34,45,0.08)]">
        <div className="flex items-center gap-3 mb-6">
          <span className="grid size-10 place-items-center rounded-2xl bg-[#FFD0A5]/40 text-[#8C3A14]">
            <Activity aria-hidden="true" size={20} />
          </span>
          <div>
            <h2 className="text-xl font-black text-[#17372F]">Audit Log</h2>
            <p className="mt-0.5 text-xs font-semibold text-[#566D7E]">
              Chronological security record of logins, transactions, and profile modifications.
            </p>
          </div>
        </div>

        {logs.length ? (
          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[#D8793F]/15 bg-[#FFF8EC] p-4 transition hover:border-[#D8793F]/35"
              >
                <div className="flex items-center gap-3">
                  <span className="grid size-8 place-items-center rounded-xl bg-white border border-[#D8793F]/20 text-[#8C3A14] shrink-0">
                    <ShieldCheck size={16} />
                  </span>
                  <div>
                    <p className="text-xs sm:text-sm font-black text-[#17372F]">
                      {log.action.replaceAll("_", " ")}
                    </p>
                    <p className="mt-0.5 text-[11px] font-bold uppercase tracking-wider text-[#8C3A14]">
                      {log.entityType ?? "ACCOUNT"}
                    </p>
                  </div>
                </div>

                <p className="flex items-center gap-1.5 text-xs font-semibold text-[#566D7E] pl-11 sm:pl-0">
                  <Clock3 size={13} />
                  {formatDateTime(log.createdAt)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#D8793F]/30 bg-[#FFF8EC] p-10 text-center">
            <Activity className="mx-auto text-[#D8793F]/50" size={40} />
            <h3 className="mt-3 text-sm sm:text-base font-black text-[#17372F]">No Activity Recorded</h3>
            <p className="mt-1 text-xs text-[#566D7E] max-w-sm mx-auto">
              Account audit events and security logs will appear here.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
