import { Egg } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { EggSaleRateForm } from "@/components/phase3/egg-sale-rate-form";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { prisma } from "@/lib/database/prisma";
import { requireAdminPermission } from "@/lib/auth/session";
import { formatDateTime, formatPaisa } from "@/lib/utilities/format";
import { ADMIN_PERMISSIONS } from "@/server/policies/authorization";

export const dynamic = "force-dynamic";

export default async function EggSaleRatesPage() {
  await requireAdminPermission(ADMIN_PERMISSIONS.SALE_RATES_MANAGE);
  const rates = await prisma.eggSaleRate.findMany({
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    take: 50,
  });
  const activeRate = rates.find((rate) => rate.isActive) ?? rates[0];

  return (
    <div className="space-y-8">
      <AdminPageHeader
        icon={Egg}
        eyebrow="Egg-sale controls"
        title="Egg-sale rates"
        description="Publish the server-controlled rate used for new egg-sale requests. Historical sale requests always keep their original rate snapshot."
      />
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(30rem,34rem)]">
        <section>
          {rates.length ? (
            <div className="grid gap-4">
              {rates.map((rate) => (
                <article key={rate.id} className="rounded-lg border border-mist bg-surface p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-forest">{rate.name}</p>
                      <p className="mt-1 text-sm text-charcoal/70">{rate.code}</p>
                    </div>
                    <StatusBadge tone={rate.isActive ? "success" : "neutral"}>
                      {rate.isActive ? "ACTIVE" : "INACTIVE"}
                    </StatusBadge>
                  </div>
                  <dl className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-md border border-mist bg-ivory p-3">
                      <dt className="text-xs font-bold uppercase text-charcoal/55">Rate</dt>
                      <dd className="mt-1 text-sm font-semibold text-charcoal">
                        {formatPaisa(rate.ratePaisaPerEgg)}
                      </dd>
                    </div>
                    <div className="rounded-md border border-mist bg-ivory p-3">
                      <dt className="text-xs font-bold uppercase text-charcoal/55">From</dt>
                      <dd className="mt-1 text-sm font-semibold text-charcoal">
                        {formatDateTime(rate.effectiveFrom)}
                      </dd>
                    </div>
                    <div className="rounded-md border border-mist bg-ivory p-3">
                      <dt className="text-xs font-bold uppercase text-charcoal/55">Until</dt>
                      <dd className="mt-1 text-sm font-semibold text-charcoal">
                        {formatDateTime(rate.effectiveUntil)}
                      </dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          ) : (
            <div>
              <EmptyState
                icon={Egg}
                title="No rates"
                message="Create one active egg purchase rate."
              />
            </div>
          )}
        </section>
        <aside className="h-fit xl:sticky xl:top-24">
          <EggSaleRateForm rate={activeRate} />
        </aside>
      </div>
    </div>
  );
}
