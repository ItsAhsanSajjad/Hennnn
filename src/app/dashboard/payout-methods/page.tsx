import { CreditCard, PlusCircle, ShieldCheck, WalletCards } from "lucide-react";

import { ArchivePayoutMethodForm } from "@/components/phase3/archive-payout-method-form";
import { PayoutMethodForm } from "@/components/phase3/payout-method-form";
import { PayoutProviderMark, payoutProviderLabels } from "@/components/phase3/payout-provider-mark";
import { InnerPageHeader } from "@/components/layout/inner-page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { prisma } from "@/lib/database/prisma";
import { requireUser } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/utilities/format";
import { formatMaskedPayoutIdentifier } from "@/lib/utilities/phase3";

export const dynamic = "force-dynamic";

export default async function PayoutMethodsPage() {
  const user = await requireUser();
  const methods = await prisma.payoutMethod.findMany({
    where: { userId: user.id, archivedAt: null },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* 1. Shared Inner Top Bar */}
      <InnerPageHeader
        title="Payout Accounts"
        subtitle="Manage your EasyPaisa, JazzCash, or Pakistani bank accounts for egg cashouts."
        actionLabel="Sell Eggs"
        actionHref="/dashboard/sell-eggs"
        actionIcon="egg"
      />

      {/* 2. Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        {/* Saved Accounts Column */}
        <section className="rounded-3xl border border-[#D8793F]/25 bg-[#FFFDF4] p-6 sm:p-8 shadow-[0_14px_32px_rgba(16,34,45,0.08)]">
          <div className="flex items-center gap-3 mb-6">
            <span className="grid size-10 place-items-center rounded-2xl bg-[#FFD0A5]/40 text-[#8C3A14]">
              <WalletCards aria-hidden="true" size={20} />
            </span>
            <div>
              <h2 className="text-xl font-black text-[#17372F]">Saved Payout Accounts</h2>
              <p className="mt-0.5 text-xs font-semibold text-[#566D7E]">
                Active settlement channels available when selling harvest eggs.
              </p>
            </div>
          </div>

          {methods.length ? (
            <div className="space-y-4">
              {methods.map((method) => (
                <article
                  key={method.id}
                  className="overflow-hidden rounded-2xl border border-[#D8793F]/25 bg-[#FFF8EC] p-5 transition hover:border-[#D8793F]/45"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <div className="grid size-12 place-items-center rounded-xl bg-white border border-[#D8793F]/20 p-2 shrink-0">
                        <PayoutProviderMark provider={method.provider} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-black text-sm sm:text-base text-[#17372F]">
                            {payoutProviderLabels[method.provider]}
                          </p>
                          {method.isDefault ? (
                            <span className="rounded-full bg-[#D8793F]/20 px-2 py-0.5 text-[10px] font-black uppercase text-[#8C3A14] border border-[#D8793F]/30">
                              DEFAULT
                            </span>
                          ) : null}
                        </div>
                        {method.bankName ? (
                          <p className="text-xs font-bold text-[#8C3A14]">{method.bankName}</p>
                        ) : null}
                        <p className="text-xs font-semibold text-[#566D7E] mt-0.5">
                          {method.accountTitle}
                        </p>
                        <p className="text-xs font-mono font-bold text-[#17372F] mt-0.5">
                          {formatMaskedPayoutIdentifier(method.accountIdentifierLastFour)}
                        </p>
                      </div>
                    </div>
                    <StatusBadge tone={method.status === "ACTIVE" ? "success" : "neutral"}>
                      {method.status}
                    </StatusBadge>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-[#D8793F]/15 pt-3">
                    <p className="text-[11px] font-semibold text-[#566D7E]">
                      Updated {formatDateTime(method.updatedAt)}
                    </p>
                    <div className="flex items-center gap-2">
                      <ArchivePayoutMethodForm id={method.id} />
                    </div>
                  </div>

                  <details className="mt-3 rounded-xl border border-[#D8793F]/20 bg-white p-3">
                    <summary className="cursor-pointer text-xs font-black uppercase tracking-wider text-[#D8793F] hover:text-[#8C3A14]">
                      Edit Account Details
                    </summary>
                    <div className="mt-3">
                      <PayoutMethodForm method={method} embedded />
                    </div>
                  </details>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#D8793F]/30 bg-[#FFF8EC] p-10 text-center">
              <CreditCard className="mx-auto text-[#D8793F]/50" size={40} />
              <h3 className="mt-3 text-sm sm:text-base font-black text-[#17372F]">No Payout Methods Saved</h3>
              <p className="mt-1 text-xs text-[#566D7E] max-w-sm mx-auto">
                Add an EasyPaisa, JazzCash, or bank account to receive cash whenever you sell eggs.
              </p>
            </div>
          )}
        </section>

        {/* Add New Method Form Column */}
        <aside className="rounded-3xl border border-[#D8793F]/25 bg-[#FFFDF4] p-6 sm:p-8 shadow-[0_14px_32px_rgba(16,34,45,0.08)] h-fit">
          <PayoutMethodForm />
        </aside>
      </div>
    </div>
  );
}
