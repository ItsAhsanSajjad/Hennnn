import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  Egg,
  PackageCheck,
  ShieldCheck,
  UserRound,
  Users,
  WalletCards,
} from "lucide-react";

import { AdminMetricCard } from "@/components/admin/admin-metric-card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { UserControls } from "@/components/admin/user-controls";
import { StatusBadge } from "@/components/shared/status-badge";
import { requireAdminPermission } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";
import { formatDateTime } from "@/lib/utilities/format";
import {
  ADMIN_PERMISSIONS,
  canManageRole,
  canManageUsers,
  roleLabels,
} from "@/server/policies/authorization";

export const dynamic = "force-dynamic";

export default async function AdminUserDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = await requireAdminPermission(ADMIN_PERMISSIONS.USERS_VIEW);
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      invitedBy: { include: { inviter: true } },
      invitedUsers: { include: { invitee: true } },
      auditLogs: { orderBy: { createdAt: "desc" }, take: 12 },
      _count: {
        select: {
          purchaseOrders: true,
          henAssets: true,
          eggSaleRequests: true,
          payoutMethods: true,
        },
      },
    },
  });

  if (!user || user.deletedAt) notFound();
  const canManage = canManageUsers(actor.role) && canManageRole(actor.role, user.role);

  return (
    <div className="grid gap-7">
      <AdminPageHeader
        icon={UserRound}
        eyebrow="Account profile"
        title={user.username}
        description="A consolidated account view for support and operations. Account controls are shown only to roles that can manage this record."
        actions={
          <Link
            href="/admin/users"
            className="inline-flex min-h-11 items-center gap-2 rounded-md border border-mist bg-surface px-4 text-sm font-bold text-forest hover:bg-ivory"
          >
            <ArrowLeft aria-hidden="true" size={17} />
            Back to users
          </Link>
        }
      />

      <section className="rounded-lg border border-mist bg-surface p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex size-12 items-center justify-center rounded-full bg-ivory text-lg font-extrabold text-leaf">
              {user.username.slice(0, 1).toUpperCase()}
            </div>
            <h2 className="mt-4 text-xl font-extrabold text-forest">{user.username}</h2>
            <p className="mt-1 text-sm text-charcoal/65">{user.phoneE164}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge
              tone={
                user.status === "ACTIVE"
                  ? "success"
                  : user.status === "PENDING"
                    ? "pending"
                    : "danger"
              }
            >
              {user.status}
            </StatusBadge>
            <StatusBadge tone={user.role === "USER" ? "neutral" : "info"}>
              {roleLabels[user.role]}
            </StatusBadge>
          </div>
        </div>
        <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Referral code", user.referralCode],
            ["Created", formatDateTime(user.createdAt)],
            ["Last sign-in", formatDateTime(user.lastLoginAt)],
            ["Invited by", user.invitedBy?.inviter.username ?? "Direct registration"],
            ["Direct invites", String(user.invitedUsers.length)],
            [
              "Phone verified",
              user.phoneVerifiedAt ? formatDateTime(user.phoneVerifiedAt) : "Not recorded",
            ],
          ].map(([label, value]) => (
            <div key={label} className="rounded-md border border-mist bg-ivory p-4">
              <dt className="text-xs font-bold uppercase tracking-normal text-charcoal/55">
                {label}
              </dt>
              <dd className="mt-2 break-words text-sm font-bold text-charcoal">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Account activity summary"
      >
        <AdminMetricCard
          icon={PackageCheck}
          label="Orders"
          value={user._count.purchaseOrders}
          detail="Purchase records linked to this account"
        />
        <AdminMetricCard
          icon={Egg}
          label="Hen assets"
          value={user._count.henAssets}
          detail="Assets created through approved orders"
          tone="amber"
        />
        <AdminMetricCard
          icon={WalletCards}
          label="Egg-sale requests"
          value={user._count.eggSaleRequests}
          detail="Customer sale requests in the workflow"
          tone="blue"
        />
        <AdminMetricCard
          icon={ShieldCheck}
          label="Payout methods"
          value={user._count.payoutMethods}
          detail="Saved payout method records"
        />
      </section>

      {canManage ? (
        <UserControls
          userId={user.id}
          role={user.role}
          status={user.status}
          actorRole={actor.role}
        />
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <article className="rounded-lg border border-mist bg-surface p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <Activity aria-hidden="true" className="text-leaf" size={21} />
            <div>
              <h2 className="font-extrabold text-forest">Recent account activity</h2>
              <p className="mt-1 text-xs text-charcoal/60">
                Events attributed to this account as an actor.
              </p>
            </div>
          </div>
          {user.auditLogs.length ? (
            <ul className="mt-5 divide-y divide-mist">
              {user.auditLogs.map((event) => (
                <li
                  key={event.id}
                  className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                >
                  <p className="text-sm font-bold text-charcoal">
                    {event.action.replaceAll("_", " ")}
                  </p>
                  <p className="shrink-0 text-xs text-charcoal/55">
                    {formatDateTime(event.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-5 text-sm text-charcoal/65">
              No attributed activity has been recorded yet.
            </p>
          )}
        </article>
        <aside className="rounded-lg border border-mist bg-ivory p-6">
          <Users aria-hidden="true" className="text-leaf" size={23} />
          <h2 className="mt-4 text-lg font-extrabold text-forest">Role boundary</h2>
          <p className="mt-2 text-sm leading-6 text-charcoal/70">
            {canManage
              ? "Changes are audited and cannot be used to alter a peer or a higher-privilege account."
              : "Your current role can inspect this record but cannot change its status or role."}
          </p>
        </aside>
      </section>
    </div>
  );
}
