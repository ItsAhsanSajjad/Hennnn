import Link from "next/link";
import { CreditCard, Egg, Search, Users, WalletCards } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { requireAdminConsoleUser } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";
import { formatDateTime, formatPaisa } from "@/lib/utilities/format";
import { ADMIN_PERMISSIONS, hasAdminPermission, roleLabels } from "@/server/policies/authorization";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ q?: string }>;

export default async function AdminSearchPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireAdminConsoleUser();
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const hasQuery = query.length >= 2;
  const canSearchUsers = hasAdminPermission(user.role, ADMIN_PERMISSIONS.USERS_VIEW);
  const canSearchPayments = hasAdminPermission(user.role, ADMIN_PERMISSIONS.PAYMENTS_VIEW);
  const canSearchSales = hasAdminPermission(user.role, ADMIN_PERMISSIONS.EGG_SALES_VIEW);
  const canSearchSettlements = hasAdminPermission(user.role, ADMIN_PERMISSIONS.SETTLEMENTS_VIEW);
  const queryOptions = { contains: query, mode: "insensitive" as const };

  const [accounts, payments, sales, settlements] = await Promise.all([
    hasQuery && canSearchUsers
      ? prisma.user.findMany({
          where: {
            deletedAt: null,
            OR: [
              { username: queryOptions },
              { phoneE164: { contains: query } },
              { referralCode: { contains: query.toUpperCase() } },
            ],
          },
          select: { id: true, username: true, phoneE164: true, role: true, status: true },
          orderBy: { createdAt: "desc" },
          take: 8,
        })
      : Promise.resolve([]),
    hasQuery && canSearchPayments
      ? prisma.paymentSubmission.findMany({
          where: {
            OR: [
              { transactionReference: queryOptions },
              { purchaseOrder: { is: { orderReference: queryOptions } } },
              { purchaseOrder: { is: { user: { is: { username: queryOptions } } } } },
            ],
          },
          include: { purchaseOrder: { include: { user: true } } },
          orderBy: { submittedAt: "desc" },
          take: 8,
        })
      : Promise.resolve([]),
    hasQuery && canSearchSales
      ? prisma.eggSaleRequest.findMany({
          where: {
            OR: [{ publicReference: queryOptions }, { user: { is: { username: queryOptions } } }],
          },
          include: { user: true },
          orderBy: { submittedAt: "desc" },
          take: 8,
        })
      : Promise.resolve([]),
    hasQuery && canSearchSettlements
      ? prisma.payout.findMany({
          where: {
            OR: [
              { settlementReference: queryOptions },
              { user: { is: { username: queryOptions } } },
              { eggSaleRequest: { is: { publicReference: queryOptions } } },
            ],
          },
          include: { user: true, eggSaleRequest: true },
          orderBy: { recordedAt: "desc" },
          take: 8,
        })
      : Promise.resolve([]),
  ]);
  const total = accounts.length + payments.length + sales.length + settlements.length;

  return (
    <div className="grid gap-7">
      <AdminPageHeader
        icon={Search}
        eyebrow="Global search"
        title="Find a record"
        description="Search the record types available to your role. Results are limited and each result opens its existing controlled workflow."
      />
      <form className="grid gap-3 rounded-lg border border-mist bg-surface p-4 shadow-sm md:grid-cols-[minmax(0,1fr)_auto]">
        <label className="sr-only" htmlFor="global-record-search">
          Search operations records
        </label>
        <input
          id="global-record-search"
          name="q"
          type="search"
          defaultValue={query}
          placeholder="Search a username, order, payment reference, sale, or settlement"
          className="min-h-11 rounded-md border border-mist px-3 text-sm text-charcoal outline-none placeholder:text-charcoal/45 focus:border-leaf"
        />
        <Button type="submit">
          <Search aria-hidden="true" size={18} />
          Search
        </Button>
      </form>
      {!hasQuery ? (
        <EmptyState
          icon={Search}
          title="Start with at least two characters"
          message="Searches are limited to records your current role can view."
        />
      ) : total ? (
        <div className="grid gap-5">
          {accounts.length ? (
            <section className="overflow-hidden rounded-lg border border-mist bg-surface shadow-sm">
              <div className="flex items-center gap-3 border-b border-mist px-5 py-4">
                <Users aria-hidden="true" className="text-leaf" size={20} />
                <h2 className="font-extrabold text-forest">Users</h2>
              </div>
              <ul className="divide-y divide-mist">
                {accounts.map((account) => (
                  <li key={account.id}>
                    <Link
                      href={`/admin/users/${account.id}`}
                      className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-surface-2"
                    >
                      <div>
                        <p className="font-bold text-forest">{account.username}</p>
                        <p className="mt-1 text-xs text-charcoal/60">
                          {account.phoneE164} · {roleLabels[account.role]}
                        </p>
                      </div>
                      <StatusBadge tone={account.status === "ACTIVE" ? "success" : "pending"}>
                        {account.status}
                      </StatusBadge>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {payments.length ? (
            <section className="overflow-hidden rounded-lg border border-mist bg-surface shadow-sm">
              <div className="flex items-center gap-3 border-b border-mist px-5 py-4">
                <CreditCard aria-hidden="true" className="text-leaf" size={20} />
                <h2 className="font-extrabold text-forest">Payments</h2>
              </div>
              <ul className="divide-y divide-mist">
                {payments.map((payment) => (
                  <li key={payment.id}>
                    <Link
                      href={`/admin/payments/${payment.id}`}
                      className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-surface-2"
                    >
                      <div>
                        <p className="font-bold text-forest">
                          {payment.purchaseOrder.orderReference}
                        </p>
                        <p className="mt-1 text-xs text-charcoal/60">
                          {payment.purchaseOrder.user.username} · {payment.transactionReference}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-bold text-charcoal">
                        {formatPaisa(payment.amountPaisaSnapshot)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {sales.length ? (
            <section className="overflow-hidden rounded-lg border border-mist bg-surface shadow-sm">
              <div className="flex items-center gap-3 border-b border-mist px-5 py-4">
                <Egg aria-hidden="true" className="text-leaf" size={20} />
                <h2 className="font-extrabold text-forest">Egg-sale requests</h2>
              </div>
              <ul className="divide-y divide-mist">
                {sales.map((sale) => (
                  <li key={sale.id}>
                    <Link
                      href={`/admin/egg-sales/${sale.publicReference}`}
                      className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-surface-2"
                    >
                      <div>
                        <p className="font-bold text-forest">{sale.publicReference}</p>
                        <p className="mt-1 text-xs text-charcoal/60">
                          {sale.user.username} · submitted {formatDateTime(sale.submittedAt)}
                        </p>
                      </div>
                      <StatusBadge
                        tone={
                          sale.status === "PAYMENT_PROCESSING" || sale.status === "PAID"
                            ? "success"
                            : "pending"
                        }
                      >
                        {sale.status}
                      </StatusBadge>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {settlements.length ? (
            <section className="overflow-hidden rounded-lg border border-mist bg-surface shadow-sm">
              <div className="flex items-center gap-3 border-b border-mist px-5 py-4">
                <WalletCards aria-hidden="true" className="text-leaf" size={20} />
                <h2 className="font-extrabold text-forest">Settlements</h2>
              </div>
              <ul className="divide-y divide-mist">
                {settlements.map((settlement) => (
                  <li key={settlement.id}>
                    <Link
                      href={`/admin/egg-sales/${settlement.eggSaleRequest.publicReference}`}
                      className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-surface-2"
                    >
                      <div>
                        <p className="font-bold text-forest">{settlement.settlementReference}</p>
                        <p className="mt-1 text-xs text-charcoal/60">
                          {settlement.user.username} · {settlement.eggSaleRequest.publicReference}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-bold text-charcoal">
                        {formatPaisa(settlement.amountPaisa)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      ) : (
        <EmptyState
          icon={Search}
          title="No accessible records match"
          message="Try a different search term. Results exclude record types your role cannot view."
        />
      )}
    </div>
  );
}
