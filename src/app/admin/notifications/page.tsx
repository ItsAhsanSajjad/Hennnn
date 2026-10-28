import { Bell } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { requireAdminPermission } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";
import { formatDateTime } from "@/lib/utilities/format";
import { ADMIN_PERMISSIONS } from "@/server/policies/authorization";

export const dynamic = "force-dynamic";

export default async function AdminNotificationsPage() {
  await requireAdminPermission(ADMIN_PERMISSIONS.NOTIFICATIONS_VIEW);
  const notifications = await prisma.notification.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return (
    <div className="grid gap-7">
      <AdminPageHeader
        icon={Bell}
        eyebrow="Customer communications"
        title="Notifications"
        description="Review customer-facing account and workflow messages. The record is read-only here to avoid duplicate delivery during retries."
      />
      <section className="overflow-hidden rounded-lg border border-mist bg-surface shadow-sm">
        <div className="border-b border-mist px-5 py-4">
          <h2 className="font-extrabold text-forest">Recent notification records</h2>
        </div>
        {notifications.length ? (
          <div className="divide-y divide-mist">
            {notifications.map((notification) => (
              <article
                key={notification.id}
                className="grid gap-2 px-5 py-4 sm:grid-cols-[180px_minmax(0,1fr)_auto]"
              >
                <p className="font-bold text-forest">{notification.user.username}</p>
                <div>
                  <p className="font-bold text-charcoal">{notification.title}</p>
                  <p className="mt-1 text-sm leading-6 text-charcoal/65">{notification.message}</p>
                </div>
                <p className="text-xs text-charcoal/55">{formatDateTime(notification.createdAt)}</p>
              </article>
            ))}
          </div>
        ) : (
          <div className="p-6">
            <EmptyState
              icon={Bell}
              title="No notification records"
              message="Workflow and account notifications will appear here when they are created."
            />
          </div>
        )}
      </section>
    </div>
  );
}
