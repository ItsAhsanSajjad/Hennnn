import { Gift, Users } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ReferralPurchaseBenefitForm } from "@/components/phase3/referral-purchase-benefit-form";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { requireAdminPermission } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";
import { formatDateTime, formatPaisa } from "@/lib/utilities/format";
import { ADMIN_PERMISSIONS } from "@/server/policies/authorization";
import {
  getReferralPurchaseBenefitConfig,
  referralPurchaseBenefitDefaults,
} from "@/server/services/referral-purchase-benefit";

export const dynamic = "force-dynamic";

export default async function ReferralRulesPage() {
  await requireAdminPermission(ADMIN_PERMISSIONS.REFERRAL_RULES_MANAGE);
  const [config, legacyRules] = await Promise.all([
    getReferralPurchaseBenefitConfig(),
    prisma.referralRule.findMany({
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
      take: 20,
    }),
  ]);
  const campaign = config ?? referralPurchaseBenefitDefaults;

  return (
    <div className="space-y-8">
      <AdminPageHeader
        icon={Users}
        eyebrow="Referral controls"
        title="Referral campaign"
        description="Configure one direct referral path. The buyer benefit is calculated on the server; inviter hens are created only after the qualifying payment approval."
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(30rem,34rem)]">
        <section className="grid gap-6">
          <article className="rounded-lg border border-mist bg-surface p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="pak-kicker">Current campaign</p>
                <h2 className="mt-2 text-xl font-extrabold text-forest">Direct purchase benefit</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-charcoal/70">
                  A referred customer receives a per-hen discount. When their approved order meets
                  the threshold, the inviter receives the configured hen benefit once for that
                  source order.
                </p>
              </div>
              <StatusBadge tone={campaign.isActive ? "success" : "neutral"}>
                {campaign.isActive ? "ACTIVE" : "INACTIVE"}
              </StatusBadge>
            </div>
            <dl className="mt-6 grid gap-3 sm:grid-cols-3">
              <Metric
                label="Qualifying order"
                value={`${campaign.qualifyingHenQuantity}+ hens`}
              />
              <Metric
                label="Inviter commission"
                value={`${campaign.inviterHenRewardPercent}% of hens`}
              />
              <Metric
                label="Buyer discount"
                value={`${formatPaisa(campaign.inviteeDiscountPaisaPerHen)} per hen`}
              />
            </dl>
            <div className="mt-5 flex gap-3 rounded-md border border-amber/20 bg-amber/10 p-4 text-sm leading-6 text-charcoal/75">
              <Gift aria-hidden="true" className="mt-0.5 shrink-0 text-amber" size={19} />
              <p>
                {campaign.isActive
                  ? "Current campaign rules apply only to new eligible orders. Existing orders and rewards keep their recorded values."
                  : "The campaign is currently disabled. No new buyer discounts or inviter hen benefits will be created."}
              </p>
            </div>
          </article>

          <section className="rounded-lg border border-mist bg-surface shadow-sm">
            <div className="border-b border-mist px-6 py-5">
              <p className="pak-kicker">Historical rules</p>
              <h2 className="mt-1 text-lg font-extrabold text-forest">Legacy egg-reward records</h2>
              <p className="mt-1 text-sm leading-6 text-charcoal/65">
                Preserved records from the earlier egg-reward model. They remain visible for audit
                history and are not changed by the current campaign settings.
              </p>
            </div>
            {legacyRules.length ? (
              <div className="divide-y divide-mist">
                {legacyRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="grid gap-3 px-6 py-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center"
                  >
                    <div>
                      <p className="font-bold text-forest">{rule.name}</p>
                      <p className="mt-1 text-xs text-charcoal/60">{rule.code}</p>
                    </div>
                    <p className="text-sm font-semibold text-charcoal">
                      {rule.rewardEggUnits} eggs
                    </p>
                    <div className="flex items-center gap-3 sm:justify-end">
                      <StatusBadge tone={rule.isActive ? "success" : "neutral"}>
                        {rule.isActive ? "ACTIVE" : "INACTIVE"}
                      </StatusBadge>
                      <span className="text-xs text-charcoal/55">
                        {formatDateTime(rule.updatedAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6">
                <EmptyState
                  icon={Gift}
                  title="No historical rules"
                  message="No earlier egg-reward rules are recorded."
                />
              </div>
            )}
          </section>
        </section>

        <aside className="h-fit xl:sticky xl:top-24">
          <ReferralPurchaseBenefitForm config={campaign} />
        </aside>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-mist bg-ivory p-4">
      <dt className="text-xs font-bold uppercase tracking-[0.06em] text-charcoal/55">{label}</dt>
      <dd className="mt-2 text-lg font-extrabold tabular-nums text-forest">{value}</dd>
    </div>
  );
}
