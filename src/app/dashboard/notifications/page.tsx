import { Bell, BellRing, Clock3 } from "lucide-react";

import { InnerPageHeader } from "@/components/layout/inner-page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { prisma } from "@/lib/database/prisma";
import { requireUser } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/utilities/format";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await requireUser();
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* 1. Shared Inner Top Bar */}
      <InnerPageHeader
        title="Notifications"
        subtitle="System alerts, payment confirmations, and farm updates."
      />

      {/* 2. Notifications Feed Card */}
      <section className="rounded-3xl border border-[#D8793F]/25 bg-[#FFFDF4] p-6 sm:p-8 shadow-[0_14px_32px_rgba(16,34,45,0.08)]">
        <div className="flex items-center gap-3 mb-6">
          <span className="grid size-10 place-items-center rounded-2xl bg-[#FFD0A5]/40 text-[#8C3A14]">
            <Bell aria-hidden="true" size={20} />
          </span>
          <div>
            <h2 className="text-xl font-black text-[#17372F]">Inbox & Alerts</h2>
            <p className="mt-0.5 text-xs font-semibold text-[#566D7E]">
              Important updates about your deposits, withdrawals, and daily egg harvests.
            </p>
          </div>
        </div>

        {notifications.length ? (
          <div className="space-y-3">
            {notifications.map((item) => (
              <div
                key={item.id}
                className={`flex flex-col sm:flex-row sm:items-start justify-between gap-3 rounded-2xl border p-4 transition ${
                  item.readAt
                    ? "border-[#D8793F]/15 bg-[#FFF8EC]"
                    : "border-[#D8793F] bg-white shadow-sm"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 grid size-8 place-items-center rounded-xl shrink-0 ${
                      item.readAt
                        ? "bg-[#FFF8EC] text-[#566D7E]"
                        : "bg-[#FFD0A5]/50 text-[#8C3A14]"
                    }`}
                  >
                    <BellRing size={16} />
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs sm:text-sm font-black text-[#17372F]">{item.title}</p>
                      <StatusBadge tone={item.readAt ? "neutral" : "info"}>{item.type}</StatusBadge>
                    </div>
                    <p className="mt-1 text-xs sm:text-sm font-semibold leading-relaxed text-[#566D7E]">
                      {item.message}
                    </p>
                  </div>
                </div>

                <p className="flex items-center gap-1.5 text-xs font-semibold text-[#566D7E] pl-11 sm:pl-0 shrink-0">
                  <Clock3 size={13} />
                  {formatDateTime(item.createdAt)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#D8793F]/30 bg-[#FFF8EC] p-10 text-center">
            <Bell className="mx-auto text-[#D8793F]/50" size={40} />
            <h3 className="mt-3 text-sm sm:text-base font-black text-[#17372F]">No Notifications</h3>
            <p className="mt-1 text-xs text-[#566D7E] max-w-sm mx-auto">
              You’re all caught up! New account alerts and updates will appear here.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
