import Link from "next/link";
import { CheckCircle2, WalletCards } from "lucide-react";

import { AdminMetricCard } from "@/components/admin/admin-metric-card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { SettlementStatusForms } from "@/components/phase3/settlement-forms";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { requireAdminPermission } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";
import { formatDateTime, formatPaisa } from "@/lib/utilities/format";
import { ADMIN_PERMISSIONS, canRecordSettlements } from "@/server/policies/authorization";

export const dynamic = "force-dynamic";

export default async function SettlementsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const actor = await requireAdminPermission(ADMIN_PERMISSIONS.SETTLEMENTS_VIEW);
  // Default to only records awaiting confirmation, matching the sidebar badge.
  const showAll = (await searchParams).view === "all";
  const [payouts, recordedCount, confirmedCount, failedCount] = await Promise.all([
    prisma.payout.findMany({
      where: showAll ? {} : { status: "RECORDED" },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { user: true, eggSaleRequest: true },
    }),
    prisma.payout.count({ where: { status: "RECORDED" } }),
    prisma.payout.count({ where: { status: "CONFIRMED" } }),
    prisma.payout.count({ where: { status: "FAILED" } }),
  ]);
  const canRecord = canRecordSettlements(actor.role);

  return (
    <div className="grid gap-7">
      <AdminPageHeader
        icon={WalletCards}
        eyebrow="Settlement control"
        title="Manual settlements"
        description="Track recorded and confirmed external egg-sale payments. GrowMeta Egg records the operational reference and settlement status only; no bank or wallet transfer is initiated by this workspace."
      />
      <section className="grid gap-4 sm:grid-cols-3" aria-label="Settlement summary">
        <AdminMetricCard
          icon={WalletCards}
          label="Awaiting confirmation"
          value={recordedCount}
          detail="Recorded manual settlement references"
          tone="amber"
        />
        <AdminMetricCard
          icon={CheckCircle2}
          label="Confirmed"
          value={confirmedCount}
          detail="Settlement records marked confirmed"
        />
        <AdminMetricCard
          icon={WalletCards}
          label="Failed"
          value={failedCount}
          detail="Records marked failed for follow-up"
          tone="rose"
        />
      </section>
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/admin/settlements"
          className={`inline-flex min-h-9 items-center rounded-md border px-3 text-sm font-bold transition-colors ${
            !showAll
              ? "border-leaf/40 bg-leaf/10 text-leaf"
              : "border-mist text-charcoal/70 hover:bg-ivory"
          }`}
        >
          Awaiting confirmation
        </Link>
        <Link
          href="/admin/settlements?view=all"
          className={`inline-flex min-h-9 items-center rounded-md border px-3 text-sm font-bold transition-colors ${
            showAll
              ? "border-leaf/40 bg-leaf/10 text-leaf"
              : "border-mist text-charcoal/70 hover:bg-ivory"
          }`}
        >
          All settlements
        </Link>
      </div>
      {payouts.length ? (
        <section className="grid gap-4">
          {payouts.map((payout) => (
            <article
              key={payout.id}
              className="grid gap-5 rounded-lg border border-mist bg-surface p-5 shadow-sm xl:grid-cols-[minmax(0,1fr)_280px]"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    className="font-extrabold text-forest hover:text-leaf"
                    href={`/admin/egg-sales/${payout.eggSaleRequest.publicReference}`}
                  >
                    {payout.eggSaleRequest.publicReference}
                  </Link>
                  <StatusBadge
                    tone={
                      payout.status === "CONFIRMED"
                        ? "success"
                        : payout.status === "FAILED"
                          ? "danger"
                          : "pending"
                    }
                  >
                    {payout.status}
                  </StatusBadge>
                </div>
                <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    ["Customer", payout.user.username],
                    ["Amount", formatPaisa(payout.amountPaisa)],
                    ["Reference", payout.settlementReference],
                    ["Recorded", formatDateTime(payout.recordedAt)],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-md border border-mist bg-ivory p-3">
                      <dt className="text-xs font-bold uppercase tracking-normal text-charcoal/55">
                        {label}
                      </dt>
                      <dd className="mt-1 break-words text-sm font-bold text-charcoal">{value}</dd>
                    </div>
                  ))}
                </dl>
                {payout.notes ? (
                  <p className="mt-4 text-sm leading-6 text-charcoal/65">{payout.notes}</p>
                ) : null}
              </div>
              {canRecord && payout.status === "RECORDED" ? (
                <SettlementStatusForms payoutId={payout.id} />
              ) : (
                <div className="rounded-md border border-mist bg-ivory p-4 text-sm leading-6 text-charcoal/65">
                  {payout.status === "RECORDED"
                    ? "Your role can review this record but cannot confirm or fail it."
                    : "No settlement action is available for this status."}
                </div>
              )}
            </article>
          ))}
        </section>
      ) : (
        <EmptyState
          icon={WalletCards}
          title="No settlement records"
          message="Payment-processing sale requests can receive an external payment reference from their review page."
        />
      )}
    </div>
  );
}
