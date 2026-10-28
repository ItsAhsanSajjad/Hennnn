import { ChevronDown, CreditCard, Landmark, Plus, ReceiptText, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { PaymentAccountForm } from "@/components/phase2/payment-account-form";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { prisma } from "@/lib/database/prisma";
import { requireAdminPermission } from "@/lib/auth/session";
import { ADMIN_PERMISSIONS } from "@/server/policies/authorization";

export const dynamic = "force-dynamic";

const PROVIDER_META: Record<string, { label: string; icon: LucideIcon }> = {
  EASYPAISA: { label: "Easypaisa", icon: Wallet },
  JAZZCASH: { label: "JazzCash", icon: Wallet },
  BANK_TRANSFER: { label: "Bank transfer", icon: Landmark },
  OTHER: { label: "Other", icon: CreditCard },
};

function providerMeta(provider: string) {
  return PROVIDER_META[provider] ?? { label: provider, icon: CreditCard };
}

export default async function AdminPaymentAccountsPage() {
  await requireAdminPermission(ADMIN_PERMISSIONS.PAYMENT_ACCOUNTS_MANAGE);
  const accounts = await prisma.paymentAccount.findMany({
    orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
  });
  const activeCount = accounts.filter((account) => account.isActive).length;

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        icon={ReceiptText}
        eyebrow="Configuration"
        title="Payment accounts"
        description="Bank and wallet accounts that customers pay into. Only active accounts appear at checkout for payment submissions."
        actions={
          <div className="rounded-xl border border-line bg-[#0b1512] px-4 py-2 text-center">
            <p className="text-lg font-black text-content">
              {activeCount}
              <span className="text-sm font-bold text-muted"> / {accounts.length}</span>
            </p>
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted">Active</p>
          </div>
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
        <aside className="h-fit lg:sticky lg:top-6">
          <div className="rounded-2xl border border-line bg-[linear-gradient(145deg,#0d1815,#08110f)] p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-leaf/25 bg-leaf/10 text-leaf">
                <Plus aria-hidden="true" size={20} />
              </span>
              <div>
                <h2 className="text-lg font-extrabold text-content">Add an account</h2>
                <p className="text-xs text-muted">Somewhere new for customers to pay.</p>
              </div>
            </div>
            <div className="mt-5">
              <PaymentAccountForm />
            </div>
          </div>
        </aside>

        <section className="grid gap-4" aria-label="Existing payment accounts">
          {accounts.length ? (
            accounts.map((account) => {
              const meta = providerMeta(account.provider);
              const ProviderIcon = meta.icon;
              return (
                <article
                  key={account.id}
                  className="rounded-2xl border border-line bg-[linear-gradient(145deg,#0d1815,#08110f)] p-5 sm:p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-leaf/25 bg-leaf/10 text-leaf">
                        <ProviderIcon aria-hidden="true" size={22} />
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-base font-extrabold text-content">
                            {account.accountTitle}
                          </h3>
                          {account.isVerified && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              Verified
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-xs text-muted">
                          {meta.label} {account.bankName ? `(${account.bankName})` : ""} · {account.accountIdentifierProtected}
                        </p>
                      </div>
                    </div>
                    <StatusBadge tone={account.isActive ? "success" : "neutral"}>
                      {account.isActive ? "ACTIVE" : "INACTIVE"}
                    </StatusBadge>
                  </div>

                  <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-xs">
                    <div>
                      <dt className="text-faint">Last four</dt>
                      <dd className="mt-0.5 font-bold tabular-nums text-content">
                        {account.accountIdentifierLastFour}
                      </dd>
                    </div>
                    {account.iban ? (
                      <div>
                        <dt className="text-faint">IBAN</dt>
                        <dd className="mt-0.5 font-bold font-mono text-content">
                          {account.iban}
                        </dd>
                      </div>
                    ) : null}
                    <div>
                      <dt className="text-faint">Display order</dt>
                      <dd className="mt-0.5 font-bold tabular-nums text-content">
                        {account.displayOrder}
                      </dd>
                    </div>
                  </dl>

                  {account.instructions ? (
                    <p className="mt-3 line-clamp-2 text-xs leading-5 text-muted">
                      {account.instructions}
                    </p>
                  ) : null}

                  <details className="group mt-4 border-t border-line pt-4">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-bold text-leaf transition hover:text-content">
                      <span className="group-open:hidden">Edit details</span>
                      <span className="hidden group-open:inline">Close editor</span>
                      <ChevronDown
                        aria-hidden="true"
                        size={18}
                        className="transition-transform group-open:rotate-180"
                      />
                    </summary>
                    <div className="mt-5">
                      <PaymentAccountForm account={account} />
                    </div>
                  </details>
                </article>
              );
            })
          ) : (
            <div className="rounded-2xl border border-line bg-[linear-gradient(145deg,#0d1815,#08110f)] p-8">
              <EmptyState
                icon={ReceiptText}
                title="No payment accounts yet"
                message="Add your first bank or wallet account so customers can submit payments."
              />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
