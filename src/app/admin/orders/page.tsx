import Link from "next/link";
import { ClipboardList, Search } from "lucide-react";
import type { PurchaseOrderStatus } from "@prisma/client";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { requireAdminPermission } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";
import { formatDateTime, formatPaisa } from "@/lib/utilities/format";
import { ADMIN_PERMISSIONS } from "@/server/policies/authorization";

export const dynamic = "force-dynamic";

const statuses: PurchaseOrderStatus[] = [
  "AWAITING_PAYMENT",
  "PAYMENT_SUBMITTED",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
  "EXPIRED",
];
type SearchParams = Promise<{ q?: string; status?: string }>;

export default async function AdminOrdersPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdminPermission(ADMIN_PERMISSIONS.ORDERS_VIEW);
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const status = statuses.includes(params.status as PurchaseOrderStatus)
    ? (params.status as PurchaseOrderStatus)
    : undefined;
  const orders = await prisma.purchaseOrder.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(query
        ? {
            OR: [
              { orderReference: { contains: query, mode: "insensitive" } },
              { user: { username: { contains: query, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: {
      user: true,
      henPlan: true,
      paymentSubmissions: { select: { id: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return (
    <div className="grid gap-7">
      <AdminPageHeader
        icon={ClipboardList}
        eyebrow="Purchase operations"
        title="Orders"
        description="Review trusted order snapshots, payment state, and activation progress. Pricing and production terms are retained on each order."
      />
      <form className="grid gap-3 rounded-lg border border-mist bg-surface p-4 shadow-sm md:grid-cols-[minmax(0,1fr)_220px_auto]">
        <label className="sr-only" htmlFor="order-query">
          Search orders
        </label>
        <input
          id="order-query"
          name="q"
          defaultValue={query}
          placeholder="Order reference or customer"
          className="min-h-11 rounded-md border border-mist px-3 text-sm outline-none focus:border-leaf"
        />
        <label className="sr-only" htmlFor="order-status">
          Status
        </label>
        <select
          id="order-status"
          name="status"
          defaultValue={status ?? ""}
          className="min-h-11 rounded-md border border-mist px-3 text-sm outline-none focus:border-leaf"
        >
          <option value="">All statuses</option>
          {statuses.map((value) => (
            <option key={value} value={value}>
              {value.replaceAll("_", " ")}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[var(--surface-dark)] px-4 text-sm font-bold text-white hover:bg-leaf"
        >
          <Search aria-hidden="true" size={17} />
          Filter
        </button>
      </form>
      <section className="overflow-hidden rounded-lg border border-mist bg-surface shadow-sm">
        {orders.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="bg-ivory text-xs font-bold uppercase tracking-normal text-charcoal/60">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Plan snapshot</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mist">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-surface-2">
                    <td className="px-4 py-3 font-bold text-forest">{order.orderReference}</td>
                    <td className="px-4 py-3 text-charcoal/70">{order.user.username}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-charcoal">{order.planNameSnapshot}</p>
                      <p className="mt-1 text-xs text-charcoal/55">
                        {order.quantity} hens | {order.dailyEggUnitsSnapshot} egg/day
                      </p>
                    </td>
                    <td className="px-4 py-3 font-bold text-charcoal">
                      {formatPaisa(order.totalAmountPaisa)}
                    </td>
                    <td className="px-4 py-3 text-charcoal/65">
                      {order.paymentSubmissions.length
                        ? order.paymentSubmissions.at(-1)?.status.replaceAll("_", " ")
                        : "Not submitted"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        tone={
                          order.status === "APPROVED"
                            ? "success"
                            : order.status === "REJECTED"
                              ? "danger"
                              : "pending"
                        }
                      >
                        {order.status}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3 text-charcoal/65">
                      {formatDateTime(order.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders/${order.orderReference}`}
                        className="font-bold text-leaf hover:text-forest"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6">
            <EmptyState
              icon={ClipboardList}
              title="No orders found"
              message="Try a different search or status filter."
            />
          </div>
        )}
      </section>
    </div>
  );
}
