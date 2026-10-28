"use client";

import { useId, useState, useTransition } from "react";
import Image from "next/image";
import {
  AlertCircle,
  Banknote,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Coins,
  Copy,
  Crown,
  Edit2,
  Egg,
  ExternalLink,
  History,
  Landmark,
  Loader2,
  Lock,
  PauseCircle,
  PlayCircle,
  Plus,
  Receipt,
  RefreshCcw,
  RotateCcw,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  Sprout,
  Store,
  TrendingUp,
  Truck,
  User as UserIcon,
  X,
  XCircle,
} from "lucide-react";

import {
  getAdminEggSaleDetailsAction,
  markEggPayoutPaidAction,
  markEggPayoutProcessingAction,
  rejectEggPayoutAction,
  reverseEggMarketSaleAction,
  saveEggMarketAction,
  toggleEggMarketStatusAction,
} from "@/server/actions/egg-markets";

interface MarketItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  minEggs: number;
  maxEggs: number;
  pricePerEggPaisa: bigint | string;
  icon: string | null;
  imagePath?: string | null;
  imageAlt?: string | null;
  isVerified: boolean;
  isActive: boolean;
  isPaused: boolean;
  displayOrder: number;
  dailyLimitEggs: number | null;
  totalCapacityEggs: number | null;
  totalEggsPurchased: number;
  _count?: { sales: number };
}

interface SaleItem {
  id: string;
  publicReference: string;
  eggQuantity: number;
  pricePerEggPaisaSnapshot: bigint | string;
  totalAmountPaisa: bigint | string;
  status: string;
  payoutMethod?: string;
  accountNumberMasked?: string | null;
  adminTransactionId?: string | null;
  adminNotes?: string | null;
  rejectionReason?: string | null;
  submittedAt?: Date | string | null;
  processingAt?: Date | string | null;
  paidAt?: Date | string | null;
  createdAt: Date | string;
  user: {
    id: string;
    username: string;
    phoneE164: string;
    email?: string | null;
  };
  market: {
    id: string;
    name: string;
    code: string;
    icon: string | null;
    imagePath?: string | null;
  };
  reviewedBy?: {
    id: string;
    username: string;
  } | null;
}

interface AdminEggMarketsClientProps {
  markets: MarketItem[];
  sales: SaleItem[];
  statusCounts?: Record<string, number>;
  totalSalesCount: number;
}

export function AdminEggMarketsClient({
  markets: initialMarkets,
  sales: initialSales,
  statusCounts = {},
  totalSalesCount,
}: AdminEggMarketsClientProps) {
  const [tab, setTab] = useState<"payouts" | "markets" | "history">("payouts");
  const [editingMarket, setEditingMarket] = useState<MarketItem | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  
  // Payout review modal state
  const [reviewSale, setReviewSale] = useState<SaleItem | null>(null);
  const [reviewDetails, setReviewDetails] = useState<{
    accountHolderName?: string;
    accountNumber?: string;
    accountNumberMasked?: string;
  } | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [reviewMode, setReviewMode] = useState<"view" | "paid" | "reject">("view");
  const [adminTxnId, setAdminTxnId] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);
  
  const [sales, setSales] = useState<SaleItem[]>(initialSales);
  const [isPending, startTransition] = useTransition();

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleOpenReviewModal = async (sale: SaleItem) => {
    setReviewSale(sale);
    setReviewMode("view");
    setAdminTxnId(sale.adminTransactionId || "");
    setAdminNotes(sale.adminNotes || "");
    setRejectionReason(sale.rejectionReason || "");
    setIsLoadingDetails(true);
    setFeedback(null);

    const result = await getAdminEggSaleDetailsAction(sale.id);
    setIsLoadingDetails(false);
    if (result.ok && result.data) {
      setReviewDetails({
        accountHolderName: result.data.accountHolderName,
        accountNumber: result.data.accountNumber,
        accountNumberMasked: result.data.accountNumberMasked ?? sale.accountNumberMasked ?? undefined,
      });
    } else {
      setReviewDetails({
        accountHolderName: "Encrypted",
        accountNumber: sale.accountNumberMasked ?? "Encrypted",
      });
    }
  };

  const handleProcessPayout = (saleId: string) => {
    setFeedback(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("saleId", saleId);
      formData.set("notes", adminNotes);
      const result = await markEggPayoutProcessingAction({ status: "idle" }, formData);
      if (result.status === "success") {
        setFeedback({ ok: true, message: result.message || "Payout moved to Processing." });
        setSales((prev) =>
          prev.map((s) => (s.id === saleId ? { ...s, status: "PROCESSING", adminNotes } : s)),
        );
        if (reviewSale) {
          setReviewSale({ ...reviewSale, status: "PROCESSING", adminNotes });
        }
      } else {
        setFeedback({ ok: false, message: result.message || "Failed to update status." });
      }
    });
  };

  const handleMarkPaid = (saleId: string) => {
    if (!adminTxnId.trim()) {
      setFeedback({ ok: false, message: "Please enter the payment Transaction ID / TID." });
      return;
    }
    setFeedback(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("saleId", saleId);
      formData.set("adminTransactionId", adminTxnId.trim());
      formData.set("notes", adminNotes.trim());
      const result = await markEggPayoutPaidAction({ status: "idle" }, formData);
      if (result.status === "success") {
        setFeedback({ ok: true, message: result.message || "Payout marked as PAID." });
        setSales((prev) =>
          prev.map((s) =>
            s.id === saleId
              ? {
                  ...s,
                  status: "PAID",
                  adminTransactionId: adminTxnId.trim(),
                  adminNotes: adminNotes.trim(),
                  paidAt: new Date(),
                }
              : s,
          ),
        );
        setTimeout(() => {
          setReviewSale(null);
          setReviewDetails(null);
        }, 1200);
      } else {
        setFeedback({ ok: false, message: result.message || "Failed to approve payout." });
      }
    });
  };

  const handleRejectPayout = (saleId: string) => {
    if (!rejectionReason.trim()) {
      setFeedback({ ok: false, message: "Please enter a mandatory rejection reason." });
      return;
    }
    setFeedback(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("saleId", saleId);
      formData.set("reason", rejectionReason.trim());
      formData.set("notes", adminNotes.trim());
      const result = await rejectEggPayoutAction({ status: "idle" }, formData);
      if (result.status === "success") {
        setFeedback({ ok: true, message: result.message || "Payout rejected and eggs returned." });
        setSales((prev) =>
          prev.map((s) =>
            s.id === saleId
              ? {
                  ...s,
                  status: "REJECTED",
                  rejectionReason: rejectionReason.trim(),
                  adminNotes: adminNotes.trim(),
                }
              : s,
          ),
        );
        setTimeout(() => {
          setReviewSale(null);
          setReviewDetails(null);
        }, 1200);
      } else {
        setFeedback({ ok: false, message: result.message || "Failed to reject payout." });
      }
    });
  };

  const handleToggleMarket = (marketId: string, field: string, currentValue: boolean) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("marketId", marketId);
      formData.set("field", field);
      formData.set("value", String(!currentValue));
      await toggleEggMarketStatusAction({ status: "idle" }, formData);
    });
  };

  // Filtered sales list
  const filteredSales = sales.filter((s) => {
    if (statusFilter !== "ALL" && s.status !== statusFilter) return false;
    if (methodFilter !== "ALL" && s.payoutMethod !== methodFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchRef = s.publicReference.toLowerCase().includes(q);
      const matchUser = s.user.username.toLowerCase().includes(q);
      const matchPhone = s.user.phoneE164.includes(q);
      const matchMasked = s.accountNumberMasked?.includes(q) ?? false;
      const matchTxn = s.adminTransactionId?.toLowerCase().includes(q) ?? false;
      const matchMarket = s.market.name.toLowerCase().includes(q);
      if (!matchRef && !matchUser && !matchPhone && !matchMasked && !matchTxn && !matchMarket) {
        return false;
      }
    }
    return true;
  });

  const pendingCount = (statusCounts as any)?.PENDING_PAYMENT ?? 0;
  const processingCount = (statusCounts as any)?.PROCESSING ?? 0;

  return (
    <div className="space-y-6">
      {/* Tabs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab("payouts")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
              tab === "payouts"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : "text-muted hover:bg-white/5 hover:text-content"
            }`}
          >
            <Clock size={16} />
            <span>Payout Queue</span>
            {(pendingCount > 0 || processingCount > 0) && (
              <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-black text-black">
                {pendingCount + processingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setTab("markets")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
              tab === "markets"
                ? "bg-accent/20 text-accent border border-accent/40"
                : "text-muted hover:bg-white/5 hover:text-content"
            }`}
          >
            <Store size={16} />
            <span>Market Desks ({initialMarkets.length})</span>
          </button>

          <button
            onClick={() => setTab("history")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
              tab === "history"
                ? "bg-accent/20 text-accent border border-accent/40"
                : "text-muted hover:bg-white/5 hover:text-content"
            }`}
          >
            <History size={16} />
            <span>All Trades ({totalSalesCount})</span>
          </button>
        </div>

        {tab === "markets" && (
          <button
            onClick={() => {
              setEditingMarket(null);
              setIsFormModalOpen(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-xs font-bold text-black hover:bg-accent/90 transition"
          >
            <Plus size={15} />
            <span>Add New Market Desk</span>
          </button>
        )}
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between gap-3 ${
            feedback.ok
              ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/15 border border-rose-500/30 text-rose-300"
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-white/60 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* TAB 1: Payout Queue */}
      {tab === "payouts" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {[
                { label: "All Statuses", val: "ALL" },
                { label: "Pending Payment", val: "PENDING_PAYMENT" },
                { label: "Processing", val: "PROCESSING" },
                { label: "Paid", val: "PAID" },
                { label: "Rejected", val: "REJECTED" },
                { label: "Cancelled", val: "CANCELLED" },
              ].map((st) => (
                <button
                  key={st.val}
                  onClick={() => setStatusFilter(st.val)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                    statusFilter === st.val
                      ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                      : "bg-[#0b1512] text-muted hover:text-content hover:bg-white/5 border border-line"
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="rounded-xl border border-line bg-[#0b1512] px-3 py-2 text-xs font-bold text-content focus:outline-none"
              >
                <option value="ALL">All Methods</option>
                <option value="JAZZCASH">JazzCash Only</option>
                <option value="EASYPAISA">Easypaisa Only</option>
              </select>

              <div className="relative min-w-[220px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  placeholder="Search user, ref, phone, TID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-line bg-[#0b1512] pl-8 pr-3 py-2 text-xs font-medium text-content placeholder:text-muted focus:border-accent focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-2xl border border-line bg-[#0b1512] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-content">
                <thead className="border-b border-line bg-surface-lowest text-[11px] font-black uppercase tracking-wider text-muted">
                  <tr>
                    <th className="px-4 py-3.5">Reference</th>
                    <th className="px-4 py-3.5">User</th>
                    <th className="px-4 py-3.5">Market</th>
                    <th className="px-4 py-3.5">Eggs</th>
                    <th className="px-4 py-3.5">Payout PKR</th>
                    <th className="px-4 py-3.5">Destination Account</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5">Date</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60 font-medium">
                  {filteredSales.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-muted">
                        No egg payout requests match your current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredSales.map((sale) => {
                      const totalRs = Number(sale.totalAmountPaisa) / 100;
                      const isPendingPayment = sale.status === "PENDING_PAYMENT";
                      const isProcessing = sale.status === "PROCESSING";
                      const isPaid = sale.status === "PAID" || sale.status === "COMPLETED";
                      const isRejected = sale.status === "REJECTED";

                      return (
                        <tr key={sale.id} className="hover:bg-white/[0.02] transition">
                          <td className="px-4 py-3.5 font-mono font-bold text-accent">
                            {sale.publicReference}
                          </td>
                          <td className="px-4 py-3.5">
                            <p className="font-bold text-content">{sale.user.username}</p>
                            <p className="font-mono text-[11px] text-muted">{sale.user.phoneE164}</p>
                          </td>
                          <td className="px-4 py-3.5 font-semibold text-content">
                            {sale.market.name}
                          </td>
                          <td className="px-4 py-3.5 font-bold text-amber-400">
                            {sale.eggQuantity.toLocaleString()} Eggs
                          </td>
                          <td className="px-4 py-3.5 font-black text-emerald-400 text-sm">
                            PKR {totalRs.toLocaleString("en-PK", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-surface-lowest border border-line font-mono text-[11px]">
                              <strong className="text-white uppercase">{sale.payoutMethod || "JAZZCASH"}:</strong>
                              <span className="text-amber-300 font-bold">{sale.accountNumberMasked || "Masked"}</span>
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                isPaid
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                  : isProcessing
                                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                  : isRejected
                                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                  : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              }`}
                            >
                              {sale.status}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-muted">
                            {new Date(sale.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <button
                              onClick={() => handleOpenReviewModal(sale)}
                              className="px-3 py-1.5 rounded-xl text-xs font-black bg-amber-500 text-black hover:bg-amber-400 transition"
                            >
                              {isPendingPayment || isProcessing ? "Review & Pay" : "Details"}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Market Desks */}
      {tab === "markets" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {initialMarkets.map((m) => {
            const priceRs = Number(m.pricePerEggPaisa) / 100;
            return (
              <div
                key={m.id}
                className="rounded-2xl border border-line bg-[#0b1512] p-5 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-lg bg-surface-lowest text-[10px] font-mono font-bold text-muted border border-line">
                      {m.code}
                    </span>
                    <span className="text-xs font-black text-emerald-400">
                      PKR {priceRs.toFixed(2)} / egg
                    </span>
                  </div>
                  <h3 className="text-base font-black text-content mt-2">{m.name}</h3>
                  <p className="text-xs text-muted mt-1 line-clamp-2">
                    {m.description || "Wholesale egg market desk."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-surface-lowest border border-line text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted">Bounds</span>
                    <p className="font-bold text-content">{m.minEggs} - {m.maxEggs} eggs</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted">Purchased</span>
                    <p className="font-bold text-amber-400">{m.totalEggsPurchased.toLocaleString()} eggs</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-line">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleMarket(m.id, "isActive", m.isActive)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                        m.isActive ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
                      }`}
                    >
                      {m.isActive ? "Active" : "Disabled"}
                    </button>
                    <button
                      onClick={() => handleToggleMarket(m.id, "isPaused", m.isPaused)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                        m.isPaused ? "bg-amber-500/20 text-amber-300" : "bg-white/10 text-muted"
                      }`}
                    >
                      {m.isPaused ? "Paused" : "Live"}
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setEditingMarket(m);
                      setIsFormModalOpen(true);
                    }}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-content transition"
                    title="Edit Market"
                  >
                    <Edit2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: History (All Trades) */}
      {tab === "history" && (
        <div className="rounded-2xl border border-line bg-[#0b1512] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-content">
              <thead className="border-b border-line bg-surface-lowest text-[11px] font-black uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-4 py-3.5">Reference</th>
                  <th className="px-4 py-3.5">User</th>
                  <th className="px-4 py-3.5">Market</th>
                  <th className="px-4 py-3.5">Eggs</th>
                  <th className="px-4 py-3.5">Amount PKR</th>
                  <th className="px-4 py-3.5">TID / Notes</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60 font-medium">
                {sales.map((s) => (
                  <tr key={s.id} className="hover:bg-white/[0.02] transition">
                    <td className="px-4 py-3.5 font-mono font-bold text-accent">
                      {s.publicReference}
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-bold text-content">{s.user.username}</p>
                      <p className="font-mono text-[11px] text-muted">{s.user.phoneE164}</p>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-content">{s.market.name}</td>
                    <td className="px-4 py-3.5 font-bold text-amber-400">
                      {s.eggQuantity.toLocaleString()} Eggs
                    </td>
                    <td className="px-4 py-3.5 font-black text-emerald-400">
                      PKR {(Number(s.totalAmountPaisa) / 100).toLocaleString("en-PK")}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-muted text-[11px]">
                      {s.adminTransactionId || s.rejectionReason || "—"}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 uppercase text-content">
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-muted">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: Payout Review & Execution Modal */}
      {reviewSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl border border-line bg-[#0b1512] p-6 text-content space-y-6">
            <button
              onClick={() => {
                setReviewSale(null);
                setReviewDetails(null);
              }}
              className="absolute top-5 right-5 size-8 rounded-full bg-white/10 text-muted hover:text-content hover:bg-white/20 grid place-items-center transition"
            >
              <X size={16} />
            </button>

            {/* Header */}
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {reviewSale.status}
                </span>
                <span className="font-mono text-xs text-muted">{reviewSale.publicReference}</span>
              </div>
              <h3 className="text-xl font-black text-white mt-1">
                Process Egg Payout Request
              </h3>
              <p className="text-xs text-muted">
                Transfer PKR {(Number(reviewSale.totalAmountPaisa) / 100).toLocaleString("en-PK")} via {reviewSale.payoutMethod || "JazzCash"}.
              </p>
            </div>

            {/* User & Recipient Details Card */}
            <div className="p-4 rounded-2xl bg-surface-lowest border border-line space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-line">
                <span className="text-muted">GrowMeta User:</span>
                <span className="font-bold text-content">
                  {reviewSale.user.username} ({reviewSale.user.phoneE164})
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-line">
                <span className="text-muted">Egg Market:</span>
                <span className="font-bold text-white">{reviewSale.market.name}</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-line">
                <span className="text-muted">Reserved Eggs:</span>
                <span className="font-bold text-amber-400">
                  {reviewSale.eggQuantity.toLocaleString()} Eggs
                </span>
              </div>

              {/* Decrypted Recipient Account Details with 1-Click Copy */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-300 uppercase">
                    Payout Destination ({reviewSale.payoutMethod || "JAZZCASH"})
                  </span>
                  {isLoadingDetails && (
                    <span className="text-[10px] text-amber-400 flex items-center gap-1">
                      <Loader2 size={11} className="animate-spin" /> Decrypting...
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted text-[11px]">Account Title:</span>
                  <span className="font-bold text-white text-sm">
                    {reviewDetails?.accountHolderName || "Loading..."}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-muted text-[11px]">Mobile Number:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-amber-400 text-base">
                      {reviewDetails?.accountNumber || reviewSale.accountNumberMasked || "Loading..."}
                    </span>
                    {reviewDetails?.accountNumber && (
                      <button
                        onClick={() => handleCopy(reviewDetails.accountNumber!, "phone")}
                        className="px-2 py-1 rounded-lg bg-amber-500 text-black font-bold text-[11px] hover:bg-amber-400 transition flex items-center gap-1"
                        title="Copy phone number"
                      >
                        <Copy size={11} />
                        <span>{copiedField === "phone" ? "Copied!" : "Copy"}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-sm font-bold text-white">Total Payout:</span>
                <span className="text-lg font-black text-emerald-400">
                  PKR {(Number(reviewSale.totalAmountPaisa) / 100).toLocaleString("en-PK", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Review Mode Tabs */}
            {reviewSale.status !== "PAID" && reviewSale.status !== "REJECTED" && (
              <div className="flex items-center gap-2 border-b border-line pb-2">
                <button
                  onClick={() => setReviewMode("view")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    reviewMode === "view"
                      ? "bg-white/10 text-white"
                      : "text-muted hover:text-content"
                  }`}
                >
                  Actions
                </button>
                <button
                  onClick={() => setReviewMode("paid")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    reviewMode === "paid"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : "text-muted hover:text-content"
                  }`}
                >
                  Mark as Paid
                </button>
                <button
                  onClick={() => setReviewMode("reject")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    reviewMode === "reject"
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                      : "text-muted hover:text-content"
                  }`}
                >
                  Reject & Release Eggs
                </button>
              </div>
            )}

            {/* Mode: Default Actions */}
            {reviewMode === "view" && (
              <div className="space-y-3">
                {reviewSale.status === "PENDING_PAYMENT" && (
                  <button
                    onClick={() => handleProcessPayout(reviewSale.id)}
                    disabled={isPending}
                    className="w-full py-3 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 text-xs font-bold transition flex items-center justify-center gap-2"
                  >
                    {isPending ? <Loader2 size={14} className="animate-spin" /> : <Clock size={14} />}
                    <span>Move to &ldquo;Processing&rdquo; (Lock Under Review)</span>
                  </button>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setReviewMode("paid")}
                    className="py-3 rounded-xl bg-emerald-500 text-black font-black text-xs hover:bg-emerald-400 transition flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 size={15} />
                    <span>Approve & Mark Paid</span>
                  </button>

                  <button
                    onClick={() => setReviewMode("reject")}
                    className="py-3 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold text-xs hover:bg-rose-500/30 transition flex items-center justify-center gap-1.5"
                  >
                    <XCircle size={15} />
                    <span>Reject Payout</span>
                  </button>
                </div>
              </div>
            )}

            {/* Mode: Mark Paid Form */}
            {reviewMode === "paid" && (
              <div className="space-y-4 animate-in fade-in">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-amber-300 uppercase block">
                    Transaction ID / Reference (Mandatory)
                  </label>
                  <input
                    type="text"
                    value={adminTxnId}
                    onChange={(e) => setAdminTxnId(e.target.value)}
                    placeholder="e.g., TID-99882199 or JazzCash TID"
                    className="w-full rounded-xl border border-line bg-surface-lowest px-4 py-2.5 text-xs font-mono font-bold text-content focus:border-accent focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted uppercase block">
                    Internal Admin Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="e.g., Sent via corporate JazzCash"
                    className="w-full rounded-xl border border-line bg-surface-lowest px-4 py-2 text-xs font-medium text-content focus:border-accent focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setReviewMode("view")}
                    className="px-4 py-2.5 rounded-xl border border-line text-xs font-bold text-muted hover:text-content transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMarkPaid(reviewSale.id)}
                    disabled={isPending || !adminTxnId.trim()}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-black font-black text-xs hover:bg-emerald-400 transition flex items-center justify-center gap-1.5 disabled:opacity-40"
                  >
                    {isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    <span>Confirm Manual Transfer Completed</span>
                  </button>
                </div>
              </div>
            )}

            {/* Mode: Reject Form */}
            {reviewMode === "reject" && (
              <div className="space-y-4 animate-in fade-in">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-rose-400 uppercase block">
                    Rejection Reason (Mandatory - Shown to User)
                  </label>
                  <textarea
                    rows={2}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g., Invalid account title or account is not registered with JazzCash."
                    className="w-full rounded-xl border border-line bg-surface-lowest px-4 py-2.5 text-xs font-medium text-content focus:border-rose-500 focus:outline-none"
                    required
                  />
                  <p className="text-[11px] text-muted">
                    Rejecting will automatically create a compensatory ledger entry returning the {reviewSale.eggQuantity} reserved eggs to the user balance.
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setReviewMode("view")}
                    className="px-4 py-2.5 rounded-xl border border-line text-xs font-bold text-muted hover:text-content transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRejectPayout(reviewSale.id)}
                    disabled={isPending || !rejectionReason.trim()}
                    className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white font-black text-xs hover:bg-rose-600 transition flex items-center justify-center gap-1.5 disabled:opacity-40"
                  >
                    {isPending ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                    <span>Reject & Release {reviewSale.eggQuantity} Eggs</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: Edit / Create Market Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl border border-line bg-[#0b1512] p-6 text-content space-y-5 my-8">
            <button
              onClick={() => setIsFormModalOpen(false)}
              className="absolute top-5 right-5 size-8 rounded-full bg-white/10 text-muted hover:text-content hover:bg-white/20 grid place-items-center transition"
            >
              <X size={16} />
            </button>

            <h3 className="text-xl font-black text-white">
              {editingMarket ? `Edit ${editingMarket.name}` : "Create New Egg Market Desk"}
            </h3>

            <form
              action={async (formData) => {
                startTransition(async () => {
                  const result = await saveEggMarketAction({ status: "idle" }, formData);
                  if (result.status === "success") {
                    setFeedback({ ok: true, message: result.message || "Market saved." });
                    setIsFormModalOpen(false);
                  } else {
                    setFeedback({ ok: false, message: result.message || "Failed to save market." });
                  }
                });
              }}
              className="space-y-4 text-xs"
            >
              {editingMarket && <input type="hidden" name="id" value={editingMarket.id} />}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-muted uppercase">Market Code</label>
                  <input
                    type="text"
                    name="code"
                    defaultValue={editingMarket?.code || ""}
                    placeholder="AL-QAIM-MARKET"
                    disabled={!!editingMarket}
                    className="w-full rounded-xl border border-line bg-surface-lowest px-3 py-2 font-mono font-bold text-content uppercase focus:border-accent focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-muted uppercase">Market Name</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingMarket?.name || ""}
                    placeholder="Al Qaim Market"
                    className="w-full rounded-xl border border-line bg-surface-lowest px-3 py-2 font-bold text-content focus:border-accent focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-muted uppercase">Description</label>
                <input
                  type="text"
                  name="description"
                  defaultValue={editingMarket?.description || ""}
                  placeholder="Official wholesale egg trading desk"
                  className="w-full rounded-xl border border-line bg-surface-lowest px-3 py-2 font-medium text-content focus:border-accent focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-muted uppercase">Price / Egg (Rs)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="pricePerEggRs"
                    defaultValue={editingMarket ? Number(editingMarket.pricePerEggPaisa) / 100 : 10}
                    className="w-full rounded-xl border border-line bg-surface-lowest px-3 py-2 font-black text-emerald-400 focus:border-accent focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-muted uppercase">Min Eggs</label>
                  <input
                    type="number"
                    name="minEggs"
                    defaultValue={editingMarket?.minEggs ?? 1}
                    className="w-full rounded-xl border border-line bg-surface-lowest px-3 py-2 font-bold text-content focus:border-accent focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-muted uppercase">Max Eggs</label>
                  <input
                    type="number"
                    name="maxEggs"
                    defaultValue={editingMarket?.maxEggs ?? 100}
                    className="w-full rounded-xl border border-line bg-surface-lowest px-3 py-2 font-bold text-content focus:border-accent focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-muted uppercase">Image Path (WebP)</label>
                  <input
                    type="text"
                    name="imagePath"
                    defaultValue={editingMarket?.imagePath || ""}
                    placeholder="/images/egg-markets/al-qaim.webp"
                    className="w-full rounded-xl border border-line bg-surface-lowest px-3 py-2 font-mono text-[11px] text-content focus:border-accent focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-muted uppercase">Display Order</label>
                  <input
                    type="number"
                    name="displayOrder"
                    defaultValue={editingMarket?.displayOrder ?? 0}
                    className="w-full rounded-xl border border-line bg-surface-lowest px-3 py-2 font-bold text-content focus:border-accent focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-content select-none">
                  <input
                    type="checkbox"
                    name="isActive"
                    defaultChecked={editingMarket ? editingMarket.isActive : true}
                    className="size-4 rounded border-line bg-surface-lowest text-accent"
                  />
                  <span>Active</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-content select-none">
                  <input
                    type="checkbox"
                    name="isPaused"
                    defaultChecked={editingMarket ? editingMarket.isPaused : false}
                    className="size-4 rounded border-line bg-surface-lowest text-accent"
                  />
                  <span>Paused</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-content select-none">
                  <input
                    type="checkbox"
                    name="isVerified"
                    defaultChecked={editingMarket ? editingMarket.isVerified : true}
                    className="size-4 rounded border-line bg-surface-lowest text-accent"
                  />
                  <span>Verified Badge</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-line">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-line text-xs font-bold text-muted hover:text-content transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 rounded-xl bg-accent text-black font-black text-xs hover:bg-accent/90 transition flex items-center gap-1.5"
                >
                  {isPending && <Loader2 size={13} className="animate-spin" />}
                  <span>Save Market Desk</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
