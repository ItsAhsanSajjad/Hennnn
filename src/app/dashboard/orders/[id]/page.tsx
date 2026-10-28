import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  CreditCard,
  Egg,
  Landmark,
  Package,
  ShieldCheck,
  Smartphone,
  Wallet,
  XCircle,
  Zap,
} from "lucide-react";

import { InnerPageHeader } from "@/components/layout/inner-page-header";
import { PaymentSubmitForm } from "@/components/phase2/payment-submit-form";
import { PaymentReviewPending } from "@/components/phase2/payment-review-pending";
import { PayOnlineButton } from "@/components/phase2/pay-online-button";
import { OnlinePaymentReturn } from "@/components/phase2/online-payment-return";
import { prisma } from "@/lib/database/prisma";
import { requireUser } from "@/lib/auth/session";
import { formatDateTime, formatPaisa } from "@/lib/utilities/format";
import { getPaymentMethodSettings } from "@/server/services/payment-methods";
import { isPaybostConfigured } from "@/server/services/paybost";
import { isUnconfirmedPaybost } from "@/server/services/payments";

export const dynamic = "force-dynamic";

export default async function DashboardOrderDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ pay?: string }>;
}) {
  const user = await requireUser();
  const { id: orderReference } = await params;
  const { pay } = await searchParams;
  const [order, accounts, methodSettings] = await Promise.all([
    prisma.purchaseOrder.findFirst({
      where: { orderReference, userId: user.id },
      include: {
        paymentSubmissions: { include: { proofs: true }, orderBy: { createdAt: "desc" } },
      },
    }),
    prisma.paymentAccount.findMany({
      where: { isActive: true, archivedAt: null },
      orderBy: { displayOrder: "asc" },
    }),
    getPaymentMethodSettings(),
  ]);
  if (!order) notFound();

  const onlineEnabled = methodSettings.paybostEnabled && isPaybostConfigured();
  const manualEnabled = methodSettings.manualPaymentEnabled;
  const latestSubmission = order.paymentSubmissions[0];
  const isUnconfirmedOnline = Boolean(
    latestSubmission && isUnconfirmedPaybost(latestSubmission),
  );
  const latestMethod = latestSubmission?.method ?? "MANUAL";
  const canSubmit =
    order.status === "AWAITING_PAYMENT" ||
    order.status === "REJECTED" ||
    isUnconfirmedOnline;

  const statusView =
    order.status === "APPROVED"
      ? {
          label: "Payment Approved & Active",
          cls: "border-emerald-500/30 bg-emerald-50 text-emerald-800",
          Icon: CheckCircle2,
        }
      : order.status === "REJECTED"
        ? {
            label: "Payment Rejected",
            cls: "border-rose-500/30 bg-rose-50 text-rose-800",
            Icon: XCircle,
          }
        : isUnconfirmedOnline
          ? {
              label: "Awaiting Payment Deposit",
              cls: "border-[#D8793F]/40 bg-[#FFF8EC] text-[#8C3A14]",
              Icon: Clock3,
            }
          : order.status === "PAYMENT_SUBMITTED" || order.status === "UNDER_REVIEW"
            ? {
                label: "Under Finance Review",
                cls: "border-[#D8793F]/40 bg-[#FFF8EC] text-[#8C3A14]",
                Icon: Clock3,
              }
            : {
                label: "Awaiting Payment Deposit",
                cls: "border-[#D8793F]/40 bg-[#FFF8EC] text-[#8C3A14]",
                Icon: Clock3,
              };
  const StatusIcon = statusView.Icon;

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 pb-28 sm:pb-16 animate-in fade-in duration-300">
      {/* 1. Shared Inner Top Bar */}
      <InnerPageHeader
        title="Complete Payment"
        subtitle={`Order #${order.orderReference} · Deposit funds to activate your flock.`}
        actionLabel="All Hen Plans"
        actionHref="/dashboard/plans"
        actionIcon="egg"
      />

      {/* 2. 3-Step Connected Progress Stepper (Matching BuyHensFlow) */}
      <section aria-label="Purchase Steps">
        <div className="grid grid-cols-3 gap-1.5 sm:gap-3 select-none">
          {/* Step 1: Done */}
          <div className="p-2 sm:p-3.5 rounded-2xl border bg-[#FFFDF4]/80 border-[#D8793F]/20 flex items-center gap-2 sm:gap-3">
            <span className="size-6 sm:size-9 rounded-lg sm:rounded-xl font-black text-xs sm:text-sm grid place-items-center shrink-0 bg-emerald-600 text-white shadow-xs">
              <CheckCircle2 size={16} />
            </span>
            <div className="min-w-0">
              <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-wider text-emerald-700 hidden xs:block">
                Step 1 · Done
              </p>
              <h4 className="text-[11px] sm:text-sm font-black text-[#17372F] leading-tight truncate">
                <span className="hidden sm:inline">{order.quantity} {order.quantity === 1 ? "Hen" : "Hens"} Selected</span>
                <span className="sm:hidden">{order.quantity} {order.quantity === 1 ? "Hen" : "Hens"}</span>
              </h4>
            </div>
          </div>

          {/* Step 2: Done */}
          <div className="p-2 sm:p-3.5 rounded-2xl border bg-[#FFFDF4]/80 border-[#D8793F]/20 flex items-center gap-2 sm:gap-3">
            <span className="size-6 sm:size-9 rounded-lg sm:rounded-xl font-black text-xs sm:text-sm grid place-items-center shrink-0 bg-emerald-600 text-white shadow-xs">
              <CheckCircle2 size={16} />
            </span>
            <div className="min-w-0">
              <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-wider text-emerald-700 hidden xs:block">
                Step 2 · Done
              </p>
              <h4 className="text-[11px] sm:text-sm font-black text-[#17372F] leading-tight truncate">
                <span className="hidden sm:inline">Method Chosen</span>
                <span className="sm:hidden">Method</span>
              </h4>
            </div>
          </div>

          {/* Step 3: Active */}
          <div
            style={{
              boxShadow: "0 4px 14px rgba(216, 121, 63, 0.18)",
            }}
            className="p-2 sm:p-3.5 rounded-2xl border-2 border-[#D8793F] bg-[#FFFDF4] ring-2 ring-[#D8793F]/30 flex items-center gap-2 sm:gap-3"
          >
            <span className="size-6 sm:size-9 rounded-lg sm:rounded-xl bg-gradient-to-br from-[#F59B52] to-[#D8793F] text-white font-black text-xs sm:text-sm grid place-items-center shrink-0 shadow-xs">
              3
            </span>
            <div className="min-w-0">
              <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-wider text-[#8C3A14] hidden xs:block">
                Step 3 · Active
              </p>
              <h4 className="text-[11px] sm:text-sm font-black text-[#17372F] leading-tight truncate">
                <span className="hidden sm:inline">Payment Details</span>
                <span className="sm:hidden">Details</span>
              </h4>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Online Payment Return Feedback (if redirected back from Paybost) */}
      <OnlinePaymentReturn pay={pay} orderId={order.id} />

      {/* 4. Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
        {/* Left Column: Payment Details & Submission */}
        <div className="space-y-6">
          {/* Main Deposit Instruction Card */}
          <div
            style={{
              boxShadow: "0 16px 36px rgba(16, 34, 45, 0.08), 0 3px 0 rgba(216, 121, 63, 0.22)",
            }}
            className="rounded-3xl border border-[#D8793F]/25 bg-[#FFFDF4] p-5 sm:p-7 relative overflow-hidden"
          >
            <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-[#D8793F]/20">
              <div>
                <span className="inline-block px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-[#D8793F]/15 text-[#8C3A14] border border-[#D8793F]/30">
                  STEP 03 · DEPOSIT DETAILS
                </span>
                <h3 className="mt-2 text-2xl sm:text-3xl font-black text-[#17372F]">
                  Send exact amount
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-[#566D7E]">
                  Transfer the exact PKR total to one of our verified official accounts below.
                </p>
              </div>

              {/* Status Pill */}
              <div
                className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-xs font-black ${statusView.cls}`}
              >
                <StatusIcon size={16} /> {statusView.label}
              </div>
            </div>

            {/* Large Highlighted Amount To Send Box */}
            <div className="my-6 rounded-2xl bg-gradient-to-br from-[#09263A] to-[#061A2B] p-5 sm:p-6 text-center text-white border-2 border-[#D8793F]/40 shadow-lg">
              <p className="text-[11px] font-black uppercase tracking-widest text-[#FFD0A5]">
                EXACT AMOUNT TO SEND
              </p>
              <p className="mt-1 text-3xl sm:text-4xl font-black text-[#FFFDF4]">
                {formatPaisa(order.totalAmountPaisa)}
              </p>
              <p className="mt-1 text-xs font-semibold text-[#DCE8E8]">
                For {order.quantity} {order.quantity === 1 ? "Hen" : "Hens"} ({order.planNameSnapshot})
              </p>
            </div>

            {/* Instant Pay Online Option if configured */}
            {canSubmit && onlineEnabled && (
              <div className="mb-6 rounded-2xl border-2 border-emerald-500/40 bg-emerald-50/70 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="size-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Zap size={22} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-[#17372F]">
                      Pay Online via Paybost Gateway
                    </h4>
                    <p className="text-xs text-[#566D7E]">
                      Instant automated activation with debit card or mobile wallet.
                    </p>
                  </div>
                </div>
                <div className="w-full sm:w-auto shrink-0">
                  <PayOnlineButton orderId={order.id} />
                </div>
              </div>
            )}

            {/* Form or Review View */}
            {canSubmit ? (
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-[#8C3A14] mb-3">
                  MANUAL BANK / WALLET TRANSFER
                </p>
                <PaymentSubmitForm purchaseOrderId={order.id} accounts={accounts} />
              </div>
            ) : order.status === "PAYMENT_SUBMITTED" || order.status === "UNDER_REVIEW" ? (
              <PaymentReviewPending status={order.status} method={latestMethod} orderId={order.id} />
            ) : order.status === "APPROVED" ? (
              <div className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-50 p-6 text-center">
                <div className="size-14 rounded-full bg-emerald-600 text-white grid place-items-center mx-auto mb-3 shadow-md">
                  <CheckCircle2 size={32} />
                </div>
                <h4 className="text-xl font-black text-[#17372F]">Order Approved &amp; Active</h4>
                <p className="text-xs text-[#566D7E] mt-1 max-w-md mx-auto">
                  Your hens have been assigned to your farm. Daily egg production begins
                  automatically.
                </p>
                <Link
                  href="/dashboard/hens"
                  className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#061A2B] text-white text-xs font-black hover:bg-[#09263A] transition"
                >
                  View My Flock <ArrowRight size={14} />
                </Link>
              </div>
            ) : null}
          </div>
        </div>

        {/* Right Column: Order Summary Card (Sticky on desktop only) */}
        <div
          style={{
            boxShadow: "0 16px 36px rgba(16, 34, 45, 0.08), 0 3px 0 rgba(216, 121, 63, 0.22)",
          }}
          className="rounded-3xl border-2 border-[#D8793F]/35 bg-[#FFF8EC] p-5 sm:p-6 lg:sticky lg:top-24 h-fit relative overflow-hidden"
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#D8793F]/20">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#8C3A14]">
                ORDER SUMMARY
              </span>
              <h4 className="text-lg font-black text-[#17372F]">Order details</h4>
            </div>
            <div className="size-10 rounded-xl bg-[#D8793F]/20 border border-[#D8793F]/35 grid place-items-center text-[#8C3A14]">
              <Egg size={18} />
            </div>
          </div>

          <div className="mt-4 space-y-3 text-xs">
            <div className="flex justify-between items-center text-[#566D7E]">
              <span>Order Reference</span>
              <span className="font-mono font-black text-[#17372F]">#{order.orderReference}</span>
            </div>
            <div className="flex justify-between items-center text-[#566D7E]">
              <span>Plan Name</span>
              <span className="font-black text-[#17372F]">{order.planNameSnapshot}</span>
            </div>
            <div className="flex justify-between items-center text-[#566D7E]">
              <span>Quantity</span>
              <span className="font-black text-[#17372F]">
                {order.quantity} {order.quantity === 1 ? "Hen" : "Hens"}
              </span>
            </div>
            <div className="flex justify-between items-center text-[#566D7E]">
              <span>Created At</span>
              <span className="font-semibold text-[#17372F]">
                {formatDateTime(order.createdAt)}
              </span>
            </div>
            <div className="flex justify-between items-center text-[#566D7E]">
              <span>Payment Due</span>
              <span className="font-semibold text-[#17372F]">
                {formatDateTime(order.paymentDueAt)}
              </span>
            </div>
          </div>

          {/* Large Highlighted Total Box */}
          <div className="mt-6 rounded-2xl bg-gradient-to-br from-[#09263A] to-[#061A2B] p-5 text-center text-white border border-[#D8793F]/40 shadow-md">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#FFD0A5]">
              TOTAL PAYABLE
            </p>
            <p className="mt-1 text-2xl sm:text-3xl font-black text-[#FFFDF4]">
              {formatPaisa(order.totalAmountPaisa)}
            </p>
          </div>

          {/* Trust Badges */}
          <div className="mt-6 pt-4 border-t border-[#D8793F]/20 space-y-2.5 text-xs font-bold text-[#17372F]">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
              <span>Admin review in 5 - 15 minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
              <span>100% verified poultry custody</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
              <span>Instant egg trade &amp; bank cashout</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
