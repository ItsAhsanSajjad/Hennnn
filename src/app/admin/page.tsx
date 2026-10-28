import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Banknote,
  ChevronRight,
  CreditCard,
  Egg,
  PackageCheck,
  ShieldCheck,
  Sprout,
  Users,
  WalletCards,
} from "lucide-react";
import type { EggSaleStatus, PaymentSubmissionStatus } from "@prisma/client";
import type { LucideIcon } from "lucide-react";

import { requireAdminPermission } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";
import { env } from "@/lib/env/server";
import { formatDateTime, formatPaisa } from "@/lib/utilities/format";
import { ADMIN_PERMISSIONS, hasAdminPermission } from "@/server/policies/authorization";
import { getSystemEggBalance } from "@/server/services/egg-ledger";

export const dynamic = "force-dynamic";

const reviewPaymentStatuses: PaymentSubmissionStatus[] = ["SUBMITTED", "UNDER_REVIEW"];
const reviewSaleStatuses: EggSaleStatus[] = ["AWAITING_REVIEW", "UNDER_REVIEW"];

const toneStyles: Record<string, string> = {
  gold: "bg-gold/15 text-gold",
  info: "bg-info/15 text-info",
  rose: "bg-danger/15 text-danger",
  leaf: "bg-leaf/15 text-leaf",
};

export default async function AdminPage() {
  const user = await requireAdminPermission(ADMIN_PERMISSIONS.DASHBOARD_VIEW);
  const canViewPayments = hasAdminPermission(user.role, ADMIN_PERMISSIONS.PAYMENTS_VIEW);
  const canViewEggSales = hasAdminPermission(user.role, ADMIN_PERMISSIONS.EGG_SALES_VIEW);
  const canViewSettlements = hasAdminPermission(user.role, ADMIN_PERMISSIONS.SETTLEMENTS_VIEW);
  const canViewAuditLogs = hasAdminPermission(user.role, ADMIN_PERMISSIONS.AUDIT_LOGS_VIEW);
  const displayName = user.username.charAt(0).toUpperCase() + user.username.slice(1);

  const [
    pendingPayments,
    paymentAmount,
    activeHens,
    pendingOrders,
    systemEggBalance,
    pendingEggSales,
    recordedSettlements,
    activeUsers,
    approvedToday,
  ] = await Promise.all([
    prisma.paymentSubmission.count({ where: { status: { in: reviewPaymentStatuses } } }),
    prisma.paymentSubmission.aggregate({
      where: { status: { in: reviewPaymentStatuses } },
      _sum: { amountPaisaSnapshot: true },
    }),
    prisma.henAsset.count({ where: { status: "ACTIVE" } }),
    prisma.purchaseOrder.count({
      where: { status: { in: ["PAYMENT_SUBMITTED", "UNDER_REVIEW"] } },
    }),
    getSystemEggBalance(),
    prisma.eggSaleRequest.count({ where: { status: { in: reviewSaleStatuses } } }),
    prisma.payout.count({ where: { status: "RECORDED" } }),
    prisma.user.count({ where: { status: "ACTIVE", deletedAt: null } }),
    prisma.paymentSubmission.count({
      where: {
        status: "APPROVED",
        reviewedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
  ]);
  const [paymentQueue, eggSaleQueue, settlementQueue, recentEvents] = await Promise.all([
    canViewPayments
      ? prisma.paymentSubmission.findMany({
          where: { status: { in: reviewPaymentStatuses } },
          include: { purchaseOrder: { include: { user: true } } },
          orderBy: { submittedAt: "asc" },
          take: 4,
        })
      : Promise.resolve([]),
    canViewEggSales
      ? prisma.eggSaleRequest.findMany({
          where: { status: { in: reviewSaleStatuses } },
          include: { user: true },
          orderBy: { submittedAt: "asc" },
          take: 4,
        })
      : Promise.resolve([]),
    canViewSettlements
      ? prisma.payout.findMany({
          where: { status: "RECORDED" },
          include: { user: true, eggSaleRequest: true },
          orderBy: { recordedAt: "asc" },
          take: 4,
        })
      : Promise.resolve([]),
    canViewAuditLogs
      ? prisma.auditLog.findMany({
          include: { actor: true },
          orderBy: { createdAt: "desc" },
          take: 6,
        })
      : Promise.resolve([]),
  ]);

  const totalPending =
    (canViewPayments ? pendingPayments : 0) +
    (canViewEggSales ? pendingEggSales : 0) +
    (canViewSettlements ? recordedSettlements : 0);

  const stats: {
    label: string;
    value: string | number;
    detail: string;
    icon: LucideIcon;
    href?: string;
    tone: keyof typeof toneStyles;
  }[] = [
    {
      label: "Payment reviews",
      value: pendingPayments,
      detail: `${formatPaisa(paymentAmount._sum?.amountPaisaSnapshot ?? 0n)} awaiting review`,
      icon: CreditCard,
      href: canViewPayments ? "/admin/payments" : undefined,
      tone: "gold",
    },
    {
      label: "Egg-sale reviews",
      value: pendingEggSales,
      detail: "Requests in review",
      icon: Banknote,
      href: canViewEggSales ? "/admin/egg-sales" : undefined,
      tone: "info",
    },
    {
      label: "Payout confirmations",
      value: recordedSettlements,
      detail: "Awaiting confirmation",
      icon: WalletCards,
      href: canViewSettlements ? "/admin/settlements" : undefined,
      tone: "rose",
    },
    {
      label: "Active hens",
      value: activeHens,
      detail: "In production now",
      icon: Sprout,
      href: hasAdminPermission(user.role, ADMIN_PERMISSIONS.HENS_VIEW) ? "/admin/hens" : undefined,
      tone: "leaf",
    },
    {
      label: "System egg balance",
      value: systemEggBalance,
      detail: "Total ledger eggs",
      icon: Egg,
      href: hasAdminPermission(user.role, ADMIN_PERMISSIONS.LEDGER_VIEW)
        ? "/admin/ledger"
        : undefined,
      tone: "info",
    },
    {
      label: "Active accounts",
      value: activeUsers,
      detail: `${pendingOrders} order${pendingOrders === 1 ? "" : "s"} awaiting review`,
      icon: Users,
      href: hasAdminPermission(user.role, ADMIN_PERMISSIONS.USERS_VIEW) ? "/admin/users" : undefined,
      tone: "leaf",
    },
  ];

  const health: { label: string; status: string; ok: boolean }[] = [
    { label: "Database", status: "Operational", ok: true },
    {
      label: "Notifications",
      status:
        env.NOTIFICATION_PROVIDER === "development"
          ? "Development"
          : env.NOTIFICATION_PROVIDER.toUpperCase(),
      ok: env.NOTIFICATION_PROVIDER !== "development",
    },
    {
      label: "File storage",
      status:
        env.STORAGE_PROVIDER === "disabled"
          ? "Disabled"
          : env.STORAGE_PROVIDER.charAt(0).toUpperCase() + env.STORAGE_PROVIDER.slice(1),
      ok: env.STORAGE_PROVIDER !== "disabled",
    },
    {
      label: "Rate limiting",
      status: env.RATE_LIMIT_PROVIDER === "redis" ? "Redis" : "In-memory",
      ok: env.RATE_LIMIT_PROVIDER === "redis",
    },
    { label: "Product mode", status: env.PRODUCT_MODE, ok: env.PRODUCT_MODE === "PRODUCTION" },
  ];

  return (
    <div className="grid gap-6">
      {/* Welcome hero */}
      <section className="relative overflow-hidden rounded-2xl border border-leaf/20 bg-[radial-gradient(circle_at_85%_0%,rgba(47,208,160,0.14),transparent_45%),linear-gradient(135deg,#0e1a16,#0a1310)] p-6 sm:p-8">
        <Image
          src="/admin/welcome-egg.png"
          alt=""
          width={760}
          height={581}
          priority
          unoptimized
          className="pointer-events-none absolute -right-6 top-1/2 hidden w-64 -translate-y-1/2 object-contain opacity-90 drop-shadow-[0_0_40px_rgba(47,208,160,0.25)] sm:block lg:w-80"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,19,16,0.97)_0%,rgba(10,19,16,0.85)_45%,transparent_100%)]" />
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl">
            <p className="text-sm text-muted">Welcome back,</p>
            <h1 className="mt-1 text-3xl font-black text-content sm:text-4xl">{displayName}</h1>
            <p className="mt-3 max-w-md text-sm leading-6 text-muted sm:text-base">
              Here&apos;s what&apos;s happening across GrowMeta Egg today — review queues, live
              operating metrics, and system health at a glance.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {totalPending > 0 ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3.5 py-1.5 text-sm font-bold text-gold">
                <span className="grid size-5 place-items-center rounded-full bg-gold text-[12px] font-black text-[#1a1205]">
                  {totalPending}
                </span>
                item{totalPending === 1 ? "" : "s"} need review
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-full border border-leaf/30 bg-leaf/10 px-3.5 py-1.5 text-sm font-bold text-leaf">
                All caught up
              </span>
            )}
            {approvedToday > 0 ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-leaf/20 bg-black/20 px-3.5 py-1.5 text-sm font-semibold text-muted">
                <span className="font-black text-content">{approvedToday}</span> approved today
              </span>
            ) : null}
          </div>
        </div>
      </section>

      {/* Stat row */}
      <section
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6"
        aria-label="Operations summary"
      >
        {stats.map((stat) => {
          const Icon = stat.icon;
          const inner = (
            <>
              <span
                className={`grid size-10 place-items-center rounded-lg ${toneStyles[stat.tone]}`}
              >
                <Icon aria-hidden="true" size={19} />
              </span>
              <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.08em] text-faint">
                {stat.label}
              </p>
              <p className="mt-1 text-2xl font-black text-content">{stat.value}</p>
              <p className="mt-1 truncate text-xs text-muted">{stat.detail}</p>
            </>
          );
          const base =
            "flex flex-col rounded-xl border border-line bg-[linear-gradient(150deg,#101a16,#0b1310)] p-4 transition-colors";
          return stat.href ? (
            <Link key={stat.label} href={stat.href} className={`${base} hover:border-leaf/35`}>
              {inner}
            </Link>
          ) : (
            <div key={stat.label} className={base}>
              {inner}
            </div>
          );
        })}
      </section>

      {/* Action required */}
      {canViewPayments || canViewEggSales || canViewSettlements ? (
        <section className="grid gap-4 xl:grid-cols-3">
          {canViewPayments ? (
            <ActionCard
              title="Payment queue"
              art="/admin/art-payments.png"
              href="/admin/payments"
              linkLabel="Review payments"
              badge={pendingPayments > 0 ? `${pendingPayments} pending` : undefined}
              empty={paymentQueue.length === 0}
              emptyText="No payment is waiting for review."
            >
              {paymentQueue.map((submission) => (
                <QueueRow
                  key={submission.id}
                  href={`/admin/payments/${submission.id}`}
                  title={submission.purchaseOrder.orderReference}
                  meta={`${submission.purchaseOrder.user.username} · ${formatPaisa(submission.amountPaisaSnapshot)}`}
                />
              ))}
            </ActionCard>
          ) : null}

          {canViewEggSales ? (
            <ActionCard
              title="Egg-sale queue"
              art="/admin/art-eggsales.png"
              href="/admin/egg-sales"
              linkLabel="Review egg sales"
              badge={pendingEggSales > 0 ? `${pendingEggSales} pending` : undefined}
              empty={eggSaleQueue.length === 0}
              emptyText="No egg-sale request is waiting."
            >
              {eggSaleQueue.map((sale) => (
                <QueueRow
                  key={sale.id}
                  href={`/admin/egg-sales/${sale.publicReference}`}
                  title={sale.publicReference}
                  meta={`${sale.user.username} · ${sale.eggQuantity} eggs`}
                />
              ))}
            </ActionCard>
          ) : null}

          {canViewSettlements ? (
            <ActionCard
              title="Settlement records"
              art="/admin/art-settlements.png"
              href="/admin/settlements"
              linkLabel="View settlements"
              badge={recordedSettlements > 0 ? `${recordedSettlements} pending` : undefined}
              empty={settlementQueue.length === 0}
              emptyText="No settlement awaiting confirmation."
            >
              {settlementQueue.map((payout) => (
                <QueueRow
                  key={payout.id}
                  href={`/admin/egg-sales/${payout.eggSaleRequest.publicReference}`}
                  title={payout.settlementReference}
                  meta={`${payout.user.username} · ${formatPaisa(payout.amountPaisa)}`}
                />
              ))}
            </ActionCard>
          ) : null}
        </section>
      ) : null}

      {/* Recent events + system health */}
      {canViewAuditLogs ? (
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <article className="rounded-2xl border border-line bg-[linear-gradient(155deg,#101a16,#0b1310)] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="flex items-center gap-2 text-lg font-black text-content">
                <Activity aria-hidden="true" className="text-leaf" size={20} /> Recent operating
                events
              </h2>
              <Link
                href="/admin/audit-logs"
                className="text-sm font-bold text-leaf hover:text-content"
              >
                View audit log
              </Link>
            </div>
            {recentEvents.length ? (
              <ul className="mt-4 divide-y divide-line">
                {recentEvents.map((event) => (
                  <li key={event.id}>
                    <Link href="/admin/audit-logs" className="group flex items-center gap-3 py-3.5">
                      <span className="size-2 shrink-0 rounded-full bg-leaf shadow-[0_0_8px_rgba(47,208,160,0.7)]" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-content">
                          {event.action.replaceAll("_", " ")}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-muted">
                          {event.actor?.username ?? "System"} · {event.entityType}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-faint">
                        {formatDateTime(event.createdAt)}
                      </span>
                      <ChevronRight
                        aria-hidden="true"
                        className="shrink-0 text-faint group-hover:text-leaf"
                        size={16}
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-muted">
                Authorized actions will appear here when they occur.
              </p>
            )}
          </article>

          <aside className="grid gap-4">
            <div className="rounded-2xl border border-line bg-[linear-gradient(155deg,#101a16,#0b1310)] p-5 sm:p-6">
              <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-faint">
                System health
              </h2>
              <ul className="mt-4 divide-y divide-line">
                {health.map((row) => (
                  <li key={row.label} className="flex items-center justify-between gap-3 py-3">
                    <span className="text-sm text-muted">{row.label}</span>
                    <span className="flex items-center gap-2 text-sm font-bold text-content">
                      {row.status}
                      <span
                        className={`size-2 rounded-full ${
                          row.ok
                            ? "bg-leaf shadow-[0_0_8px_rgba(47,208,160,0.7)]"
                            : "bg-gold shadow-[0_0_8px_rgba(231,185,85,0.6)]"
                        }`}
                      />
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-leaf/25 bg-[radial-gradient(circle_at_85%_100%,rgba(47,208,160,0.16),transparent_50%),linear-gradient(135deg,#0e1a16,#0a1310)] p-5 sm:p-6">
              <Image
                src="/admin/art-shield.png"
                alt=""
                width={460}
                height={389}
                unoptimized
                className="pointer-events-none absolute -bottom-4 -right-4 w-24 object-contain opacity-90 drop-shadow-[0_0_26px_rgba(47,208,160,0.25)]"
              />
              <div className="relative z-10 max-w-[75%]">
                <ShieldCheck aria-hidden="true" className="text-leaf" size={22} />
                <h2 className="mt-3 text-base font-black text-content">
                  Every action is on record
                </h2>
                <p className="mt-2 text-xs leading-5 text-muted">
                  Approvals, rejections, role changes, and settlements are all logged with the actor
                  and time.
                </p>
                <Link
                  href="/admin/audit-logs"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-leaf hover:text-content"
                >
                  View audit logs <ArrowRight aria-hidden="true" size={15} />
                </Link>
              </div>
            </div>
          </aside>
        </section>
      ) : null}
    </div>
  );
}

function ActionCard({
  title,
  art,
  href,
  linkLabel,
  badge,
  empty,
  emptyText,
  children,
}: {
  title: string;
  art: string;
  href: string;
  linkLabel: string;
  badge?: string;
  empty: boolean;
  emptyText: string;
  children: React.ReactNode;
}) {
  return (
    <article className="relative flex min-h-56 flex-col overflow-hidden rounded-2xl border border-line bg-[linear-gradient(150deg,#101a16,#0b1310)] p-5 sm:p-6">
      <Image
        src={art}
        alt=""
        width={420}
        height={410}
        unoptimized
        className="pointer-events-none absolute -bottom-3 -right-3 w-24 object-contain opacity-80 drop-shadow-[0_0_22px_rgba(47,208,160,0.22)] sm:w-28"
      />
      <div className="relative z-10 flex flex-1 flex-col">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-leaf">
            Action required
          </p>
          {badge ? (
            <span className="rounded-full border border-gold/30 bg-gold/10 px-2.5 py-0.5 text-[11px] font-bold text-gold">
              {badge}
            </span>
          ) : null}
        </div>
        <h2 className="mt-1 text-lg font-black text-content">{title}</h2>
        {empty ? (
          <p className="mt-4 text-sm text-muted">{emptyText}</p>
        ) : (
          <ul className="mt-3 max-w-[82%] divide-y divide-line">{children}</ul>
        )}
        <Link
          href={href}
          className={`mt-auto inline-flex w-fit items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition-colors ${
            empty
              ? "border border-line text-muted! hover:border-leaf/40 hover:text-content!"
              : "bg-leaf text-brand-ink! hover:bg-brand-strong"
          }`}
        >
          {linkLabel} <ArrowRight aria-hidden="true" size={15} />
        </Link>
      </div>
    </article>
  );
}

function QueueRow({ href, title, meta }: { href: string; title: string; meta: string }) {
  return (
    <li className="flex items-center justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-content">{title}</p>
        <p className="mt-0.5 truncate text-xs text-muted">{meta}</p>
      </div>
      <Link
        href={href}
        className="inline-flex shrink-0 items-center gap-1 rounded-md border border-leaf/40 bg-leaf/10 px-3 py-1.5 text-xs font-bold text-leaf! transition-colors hover:bg-leaf hover:text-brand-ink!"
      >
        Review
        <ArrowRight aria-hidden="true" size={13} />
      </Link>
    </li>
  );
}
