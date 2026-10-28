import Link from "next/link";
import { ArrowRight, FileText, ShoppingBag, ShoppingCart } from "lucide-react";

import { InnerPageHeader } from "@/components/layout/inner-page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { prisma } from "@/lib/database/prisma";
import { requireUser } from "@/lib/auth/session";
import { formatDateTime, formatPaisa } from "@/lib/utilities/format";

export const dynamic = "force-dynamic";

export default async function DashboardOrdersPage() {
  const user = await requireUser();
  const orders = await prisma.purchaseOrder.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* 1. Shared Inner Top Bar */}
      <InnerPageHeader
        title="Purchase Orders"
        subtitle="Track the approval, activation, and payment status of your hen plan orders."
        actionLabel="Buy New Plan"
        actionHref="/dashboard/plans"
        actionIcon="cart"
      />

      {/* 2. Orders Content Table */}
      <section className="rounded-3xl border border-[#D8793F]/25 bg-[#FFFDF4] p-6 sm:p-8 shadow-[0_14px_32px_rgba(16,34,45,0.08)]">
        <div className="flex items-center gap-3 mb-6">
          <span className="grid size-10 place-items-center rounded-2xl bg-[#FFD0A5]/40 text-[#8C3A14]">
            <ShoppingBag aria-hidden="true" size={20} />
          </span>
          <div>
            <h2 className="text-xl font-black text-[#17372F]">Order History</h2>
            <p className="mt-0.5 text-xs font-semibold text-[#566D7E]">
              Review your submitted purchase deposits and instant activations.
            </p>
          </div>
        </div>

        {orders.length ? (
          <div className="overflow-x-auto rounded-2xl border border-[#D8793F]/20">
            <table className="w-full min-w-[720px] text-left text-xs sm:text-sm">
              <thead className="bg-[#FFF8EC] text-[11px] font-black uppercase tracking-wider text-[#8C3A14] border-b border-[#D8793F]/20">
                <tr>
                  <th className="px-5 py-4">Reference</th>
                  <th className="px-5 py-4">Plan Name</th>
                  <th className="px-5 py-4">Total Amount</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Date Submitted</th>
                  <th className="px-5 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D8793F]/15 bg-[#FFFDF4]">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#FFF8EC]/60 transition">
                    <td className="px-5 py-4 font-black text-[#17372F]">
                      <span className="font-mono text-xs">{order.orderReference}</span>
                    </td>
                    <td className="px-5 py-4 font-bold text-[#17372F]">{order.planNameSnapshot}</td>
                    <td className="px-5 py-4 font-black tabular-nums text-[#17372F]">
                      {formatPaisa(order.totalAmountPaisa)}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge tone={order.status === "APPROVED" ? "success" : "pending"}>
                        {order.status}
                      </StatusBadge>
                    </td>
                    <td className="px-5 py-4 font-semibold text-[#566D7E]">
                      {formatDateTime(order.createdAt)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/dashboard/orders/${order.orderReference}`}
                        className="inline-flex items-center gap-1 font-black text-[#D8793F] hover:text-[#8C3A14] transition"
                      >
                        Details
                        <ArrowRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#D8793F]/30 bg-[#FFF8EC] p-10 text-center">
            <FileText className="mx-auto text-[#D8793F]/50" size={40} />
            <h3 className="mt-3 text-sm sm:text-base font-black text-[#17372F]">No Orders Found</h3>
            <p className="mt-1 text-xs text-[#566D7E] max-w-sm mx-auto">
              You haven’t placed any hen purchase orders yet. Get started by exploring our flock plans.
            </p>
            <div className="mt-4">
              <Link
                href="/dashboard/plans"
                style={{
                  background: "linear-gradient(180deg, #F59B52 0%, #D8793F 100%)",
                  boxShadow: "0 2px 0 #8C3A14, 0 4px 12px rgba(216, 121, 63, 0.3)",
                }}
                className="inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-black text-white hover:brightness-105 transition"
              >
                <ShoppingCart size={14} /> View Flock Plans
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
