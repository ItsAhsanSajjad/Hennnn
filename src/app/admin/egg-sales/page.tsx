import Link from "next/link";
import {
  Banknote,
  ClipboardCheck,
  Clock3,
  Search,
  ShieldCheck,
  WalletCards,
  XCircle,
} from "lucide-react";
import type { EggSaleStatus, PayoutMethodProvider, Prisma } from "@prisma/client";

import { AdminMetricCard } from "@/components/admin/admin-metric-card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { requireAdminPermission } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";
import { formatDateTime, formatPaisa } from "@/lib/utilities/format";
import { ADMIN_PERMISSIONS } from "@/server/policies/authorization";

export const dynamic = "force-dynamic";

const statuses: EggSaleStatus[] = [
  "AWAITING_REVIEW",
  "UNDER_REVIEW",
  "PAYMENT_PROCESSING",
  "PAID",
  "REJECTED",
  "CANCELLED",
];
const providers: PayoutMethodProvider[] = ["EASYPAISA", "JAZZCASH", "BANK_TRANSFER", "OTHER"];
// Default queue = requests still needing a review decision, so the list matches the
// sidebar badge and empties as each is reviewed. "All statuses" reveals everything.
const reviewPendingStatuses: EggSaleStatus[] = ["AWAITING_REVIEW", "UNDER_REVIEW"];
const pageSize = 25;

function saleTone(status: EggSaleStatus) {
  if (["PAYMENT_PROCESSING", "PAID"].includes(status)) return "success";
  if (["REJECTED", "CANCELLED"].includes(status)) return "danger";
  if (["AWAITING_REVIEW", "UNDER_REVIEW"].includes(status)) return "pending";
  return "neutral";
}

function parsePaisa(raw?: string) {
  const match = raw?.trim().match(/^(\d+)(?:\.(\d{1,2}))?$/);
  if (!match) return undefined;
  return BigInt(match[1]) * 100n + BigInt((match[2] ?? "").padEnd(2, "0") || "0");
}

function parseDate(raw?: string, endOfDay = false) {
  if (!raw) return undefined;
  const date = new Date(`${raw}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function pageHref(params: Record<string, string | undefined>, page: number) {
  const query = new URLSearchParams();
  Object.entries({ ...params, page: String(page) }).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });
  return `/admin/egg-sales?${query.toString()}`;
}

type SearchParams = Promise<{
  q?: string;
  status?: string;
  provider?: PayoutMethodProvider;
  reviewer?: string;
  from?: string;
  to?: string;
  min?: string;
  max?: string;
  sort?: string;
  page?: string;
}>;

export default async function AdminEggSalesPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdminPermission(ADMIN_PERMISSIONS.EGG_SALES_VIEW);
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const showAll = params.status === "ALL";
  const specificStatus = statuses.includes(params.status as EggSaleStatus)
    ? (params.status as EggSaleStatus)
    : undefined;
  const provider = providers.includes(params.provider as PayoutMethodProvider)
    ? params.provider
    : undefined;
  const reviewer = params.reviewer?.trim() ?? "";
  const minAmount = parsePaisa(params.min);
  const maxAmount = parsePaisa(params.max);
  const from = parseDate(params.from);
  const to = parseDate(params.to, true);
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const sort = ["submittedAsc", "amountDesc", "amountAsc"].includes(params.sort ?? "")
    ? params.sort!
    : "submittedDesc";
  const orderBy: Prisma.EggSaleRequestOrderByWithRelationInput =
    sort === "submittedAsc"
      ? { submittedAt: "asc" }
      : sort === "amountDesc"
        ? { totalAmountPaisa: "desc" }
        : sort === "amountAsc"
          ? { totalAmountPaisa: "asc" }
          : { submittedAt: "desc" };
  const where: Prisma.EggSaleRequestWhereInput = {
    ...(showAll
      ? {}
      : specificStatus
        ? { status: specificStatus }
        : { status: { in: reviewPendingStatuses } }),
    ...(provider ? { payoutProviderSnapshot: provider } : {}),
    ...(reviewer ? { reviewedBy: { username: { contains: reviewer, mode: "insensitive" } } } : {}),
    ...(from || to
      ? { submittedAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
      : {}),
    ...(minAmount !== undefined || maxAmount !== undefined
      ? {
          totalAmountPaisa: {
            ...(minAmount !== undefined ? { gte: minAmount } : {}),
            ...(maxAmount !== undefined ? { lte: maxAmount } : {}),
          },
        }
      : {}),
    ...(query
      ? {
          OR: [
            { publicReference: { contains: query, mode: "insensitive" } },
            { user: { username: { contains: query, mode: "insensitive" } } },
            { user: { name: { contains: query, mode: "insensitive" } } },
            { user: { email: { contains: query, mode: "insensitive" } } },
            { user: { phoneE164: { contains: query, mode: "insensitive" } } },
          ],
        }
      : {}),
  };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const periodForPayouts = { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) };

  const [
    sales,
    total,
    awaitingCount,
    reviewingCount,
    processingCount,
    pendingTotal,
    paidToday,
    paidPeriod,
    rejectedCount,
  ] = await Promise.all([
    prisma.eggSaleRequest.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: { select: { username: true, name: true, email: true, phoneE164: true } },
        reviewedBy: { select: { username: true } },
        payouts: {
          select: { status: true, confirmedAt: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    }),
    prisma.eggSaleRequest.count({ where }),
    prisma.eggSaleRequest.count({ where: { status: "AWAITING_REVIEW" } }),
    prisma.eggSaleRequest.count({ where: { status: "UNDER_REVIEW" } }),
    prisma.eggSaleRequest.count({ where: { status: "PAYMENT_PROCESSING" } }),
    prisma.eggSaleRequest.aggregate({
      where: { status: "PAYMENT_PROCESSING" },
      _sum: { totalAmountPaisa: true },
    }),
    prisma.payout.aggregate({
      where: { status: "CONFIRMED", confirmedAt: { gte: today } },
      _sum: { amountPaisa: true },
    }),
    prisma.payout.aggregate({
      where: {
        status: "CONFIRMED",
        ...(Object.keys(periodForPayouts).length ? { confirmedAt: periodForPayouts } : {}),
      },
      _sum: { amountPaisa: true },
    }),
    prisma.eggSaleRequest.count({ where: { status: "REJECTED" } }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentFilters = {
    q: query || undefined,
    status: showAll ? "ALL" : specificStatus,
    provider,
    reviewer: reviewer || undefined,
    from: params.from,
    to: params.to,
    min: params.min,
    max: params.max,
    sort,
  };

  return (
    <div className="grid gap-7">
      <AdminPageHeader
        icon={Banknote}
        eyebrow="Finance operations"
        title="Egg-sale queue"
        description="Review reserved egg-sale requests, document the external payment reference, and confirm settlement only after payment is actually completed."
        actions={
          <ButtonLink href="/api/admin/reports/egg-sales.csv" variant="secondary">
            Export CSV
          </ButtonLink>
        }
      />
      <section
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Egg sale operations summary"
      >
        <AdminMetricCard
          icon={ClipboardCheck}
          label="Awaiting review"
          value={awaitingCount}
          detail="New reserved requests"
          tone="amber"
        />
        <AdminMetricCard
          icon={Search}
          label="Under review"
          value={reviewingCount}
          detail="Assigned to operations"
          tone="blue"
        />
        <AdminMetricCard
          icon={Clock3}
          label="Payment processing"
          value={processingCount}
          detail="Ready for external payout"
          tone="rose"
        />
        <AdminMetricCard
          icon={WalletCards}
          label="Pending payable"
          value={formatPaisa(pendingTotal._sum.totalAmountPaisa ?? 0n)}
          detail="Payment-processing obligation"
          tone="amber"
        />
        <AdminMetricCard
          icon={ShieldCheck}
          label="Paid today"
          value={formatPaisa(paidToday._sum.amountPaisa ?? 0n)}
          detail="Confirmed finance outflow"
          tone="blue"
        />
        <AdminMetricCard
          icon={Banknote}
          label="Paid in period"
          value={formatPaisa(paidPeriod._sum.amountPaisa ?? 0n)}
          detail="Uses selected date range"
          tone="blue"
        />
        <AdminMetricCard
          icon={XCircle}
          label="Rejected requests"
          value={rejectedCount}
          detail="Reserved eggs released"
          tone="rose"
        />
      </section>

      <form className="grid gap-3 rounded-lg border border-mist bg-surface p-4 shadow-sm md:grid-cols-2 xl:grid-cols-4">
        <label
          className="grid gap-1 text-xs font-bold uppercase tracking-normal text-charcoal/60"
          htmlFor="egg-sale-search"
        >
          Search
          <input
            id="egg-sale-search"
            name="q"
            type="search"
            defaultValue={query}
            placeholder="Reference, user, phone"
            className="min-h-11 rounded-md border border-mist px-3 text-sm font-medium normal-case outline-none focus:border-leaf"
          />
        </label>
        <label
          className="grid gap-1 text-xs font-bold uppercase tracking-normal text-charcoal/60"
          htmlFor="egg-sale-status"
        >
          Status
          <select
            id="egg-sale-status"
            name="status"
            defaultValue={showAll ? "ALL" : (specificStatus ?? "")}
            className="min-h-11 rounded-md border border-mist bg-surface px-3 text-sm font-medium normal-case outline-none focus:border-leaf"
          >
            <option value="">Awaiting review</option>
            <option value="ALL">All statuses</option>
            {statuses.map((item) => (
              <option key={item} value={item}>
                {item.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <label
          className="grid gap-1 text-xs font-bold uppercase tracking-normal text-charcoal/60"
          htmlFor="egg-sale-provider"
        >
          Payment method
          <select
            id="egg-sale-provider"
            name="provider"
            defaultValue={provider ?? ""}
            className="min-h-11 rounded-md border border-mist bg-surface px-3 text-sm font-medium normal-case outline-none focus:border-leaf"
          >
            <option value="">All payment methods</option>
            {providers.map((item) => (
              <option key={item} value={item}>
                {item.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <label
          className="grid gap-1 text-xs font-bold uppercase tracking-normal text-charcoal/60"
          htmlFor="egg-sale-reviewer"
        >
          Reviewer
          <input
            id="egg-sale-reviewer"
            name="reviewer"
            defaultValue={reviewer}
            placeholder="Reviewer username"
            className="min-h-11 rounded-md border border-mist px-3 text-sm font-medium normal-case outline-none focus:border-leaf"
          />
        </label>
        <label
          className="grid gap-1 text-xs font-bold uppercase tracking-normal text-charcoal/60"
          htmlFor="egg-sale-from"
        >
          From
          <input
            id="egg-sale-from"
            name="from"
            type="date"
            defaultValue={params.from}
            className="min-h-11 rounded-md border border-mist px-3 text-sm font-medium normal-case outline-none focus:border-leaf"
          />
        </label>
        <label
          className="grid gap-1 text-xs font-bold uppercase tracking-normal text-charcoal/60"
          htmlFor="egg-sale-to"
        >
          To
          <input
            id="egg-sale-to"
            name="to"
            type="date"
            defaultValue={params.to}
            className="min-h-11 rounded-md border border-mist px-3 text-sm font-medium normal-case outline-none focus:border-leaf"
          />
        </label>
        <label
          className="grid gap-1 text-xs font-bold uppercase tracking-normal text-charcoal/60"
          htmlFor="egg-sale-min"
        >
          Min PKR
          <input
            id="egg-sale-min"
            name="min"
            inputMode="decimal"
            defaultValue={params.min}
            placeholder="0.00"
            className="min-h-11 rounded-md border border-mist px-3 text-sm font-medium normal-case outline-none focus:border-leaf"
          />
        </label>
        <label
          className="grid gap-1 text-xs font-bold uppercase tracking-normal text-charcoal/60"
          htmlFor="egg-sale-max"
        >
          Max PKR
          <input
            id="egg-sale-max"
            name="max"
            inputMode="decimal"
            defaultValue={params.max}
            placeholder="0.00"
            className="min-h-11 rounded-md border border-mist px-3 text-sm font-medium normal-case outline-none focus:border-leaf"
          />
        </label>
        <label
          className="grid gap-1 text-xs font-bold uppercase tracking-normal text-charcoal/60"
          htmlFor="egg-sale-sort"
        >
          Sort
          <select
            id="egg-sale-sort"
            name="sort"
            defaultValue={sort}
            className="min-h-11 rounded-md border border-mist bg-surface px-3 text-sm font-medium normal-case outline-none focus:border-leaf"
          >
            <option value="submittedDesc">Newest submitted</option>
            <option value="submittedAsc">Oldest submitted</option>
            <option value="amountDesc">Highest amount</option>
            <option value="amountAsc">Lowest amount</option>
          </select>
        </label>
        <div className="flex items-end gap-3 xl:col-span-3">
          <Button type="submit">
            <Search aria-hidden="true" size={17} />
            Apply filters
          </Button>
          <ButtonLink href="/admin/egg-sales" variant="secondary">
            Clear
          </ButtonLink>
        </div>
      </form>

      {sales.length ? (
        <>
          <section className="grid gap-3 md:hidden">
            {sales.map((sale) => (
              <article
                key={sale.id}
                className="rounded-lg border border-mist bg-surface p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-extrabold text-forest">{sale.publicReference}</p>
                    <p className="mt-1 text-sm text-charcoal/65">
                      {sale.user.name ?? sale.user.username} ·{" "}
                      {sale.user.phoneE164 ?? sale.user.email ?? "No contact"}
                    </p>
                  </div>
                  <StatusBadge tone={saleTone(sale.status)}>
                    {sale.status.replaceAll("_", " ")}
                  </StatusBadge>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs text-charcoal/55">Payable</dt>
                    <dd className="mt-1 font-extrabold tabular-nums text-charcoal">
                      {formatPaisa(sale.totalAmountPaisa)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-charcoal/55">Eggs</dt>
                    <dd className="mt-1 font-extrabold text-charcoal">{sale.eggQuantity}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-charcoal/55">Payment account</dt>
                    <dd className="mt-1 font-semibold text-charcoal">
                      {sale.payoutProviderSnapshot ?? "Payout"}{" "}
                      {sale.payoutIdentifierMaskedSnapshot ?? "Not recorded"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-charcoal/55">Reviewer</dt>
                    <dd className="mt-1 font-semibold text-charcoal">
                      {sale.reviewedBy?.username ?? "Unassigned"}
                    </dd>
                  </div>
                </dl>
                <Link
                  className="mt-4 inline-flex min-h-10 items-center text-sm font-bold text-forest underline"
                  href={`/admin/egg-sales/${sale.publicReference}`}
                >
                  Open request
                </Link>
              </article>
            ))}
          </section>
          <section className="hidden overflow-hidden rounded-lg border border-mist bg-surface shadow-sm md:block">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-ivory text-xs font-bold uppercase tracking-normal text-charcoal/65">
                  <tr>
                    <th className="px-4 py-3">Reference</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3 text-right">Eggs</th>
                    <th className="px-4 py-3 text-right">Rate</th>
                    <th className="px-4 py-3 text-right">Payable</th>
                    <th className="px-4 py-3">Payment account</th>
                    <th className="px-4 py-3">Reviewer</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Submitted</th>
                    <th className="px-4 py-3" aria-label="Open request" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-mist">
                  {sales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-surface-2">
                      <td className="px-4 py-3 font-bold text-forest">{sale.publicReference}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-charcoal">
                          {sale.user.name ?? sale.user.username}
                        </p>
                        <p className="mt-1 text-xs text-charcoal/60">
                          {sale.user.phoneE164 ?? sale.user.email ?? "No contact"}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-charcoal">
                        {sale.eggQuantity}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-charcoal">
                        {formatPaisa(sale.ratePaisaPerEggSnapshot)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold tabular-nums text-charcoal">
                        {formatPaisa(sale.totalAmountPaisa)}
                      </td>
                      <td className="px-4 py-3 text-charcoal/70">
                        {sale.payoutProviderSnapshot ?? "Payout"}
                        <br />
                        {sale.payoutIdentifierMaskedSnapshot ?? "Not recorded"}
                      </td>
                      <td className="px-4 py-3 text-charcoal/70">
                        {sale.reviewedBy?.username ?? "Unassigned"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge tone={saleTone(sale.status)}>
                          {sale.status.replaceAll("_", " ")}
                        </StatusBadge>
                      </td>
                      <td className="px-4 py-3 text-charcoal/65">
                        {formatDateTime(sale.submittedAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          className="inline-flex min-h-10 items-center rounded-md border border-mist px-3 text-xs font-bold text-forest hover:bg-ivory"
                          href={`/admin/egg-sales/${sale.publicReference}`}
                        >
                          Open
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <nav className="flex items-center justify-between gap-3" aria-label="Egg sale pagination">
            <p className="text-sm text-charcoal/65">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
            </p>
            <div className="flex gap-2">
              {page > 1 ? (
                <ButtonLink href={pageHref(currentFilters, page - 1)} variant="secondary">
                  Previous
                </ButtonLink>
              ) : (
                <span className="inline-flex min-h-11 items-center rounded-md border border-mist bg-ivory px-4 text-sm font-bold text-charcoal/40">
                  Previous
                </span>
              )}
              {page < totalPages ? (
                <ButtonLink href={pageHref(currentFilters, page + 1)} variant="secondary">
                  Next
                </ButtonLink>
              ) : (
                <span className="inline-flex min-h-11 items-center rounded-md border border-mist bg-ivory px-4 text-sm font-bold text-charcoal/40">
                  Next
                </span>
              )}
            </div>
          </nav>
        </>
      ) : (
        <EmptyState
          icon={Banknote}
          title="No sale requests match"
          message="Submitted egg-sale requests will appear here for finance review."
        />
      )}
    </div>
  );
}
