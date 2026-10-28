import { ArrowRight, Check, Sprout } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { formatPaisa } from "@/lib/utilities/format";
import type { PublicPlanPackage } from "@/lib/utilities/plan-packages";

type PublicPlanCardProps = {
  item: PublicPlanPackage;
  ctaLabel?: string;
};

export function PublicPlanCard({ item, ctaLabel }: PublicPlanCardProps) {
  const hasBundleSaving = item.totalPaisa !== item.originalTotalPaisa;

  return (
    <article
      className={`gme-plan-card flex h-full flex-col ${item.badge ? "border-[var(--brand-primary)]" : ""}`}
    >
      <div className="min-h-[126px]">
        <div className="flex items-start justify-between gap-3">
          <p className="flex items-center gap-2 text-sm font-bold text-[var(--brand-primary)]">
            <Sprout size={18} aria-hidden="true" />
            {item.hens} {item.hens === 1 ? "Hen" : "Hens"}
          </p>
          {item.badge ? (
            <span className="shrink-0 rounded-full bg-[var(--brand-primary)] px-3 py-1 text-xs font-bold text-white">
              {item.badge}
            </span>
          ) : null}
        </div>
        <h3 className="mt-4 text-2xl font-extrabold leading-8">{item.name}</h3>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{item.audience}</p>
      </div>

      <div className="my-6 min-h-[168px] border-y border-[var(--border-default)] py-5">
        <p className="min-h-5 text-xs font-semibold text-[var(--text-secondary)]">
          {hasBundleSaving ? (
            <>
              Regular price{" "}
              <span className="line-through">{formatPaisa(item.originalTotalPaisa)}</span>
            </>
          ) : (
            "Standard package price"
          )}
        </p>
        <p className="mt-1 text-xs font-bold uppercase tracking-[.08em] text-[var(--text-secondary)]">
          Package amount today
        </p>
        <p className="mt-1 text-3xl font-extrabold tabular-nums">{formatPaisa(item.totalPaisa)}</p>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          {formatPaisa(item.pricePerHenPaisa)} per hen | {item.hens} hen
          {item.hens === 1 ? "" : "s"} included
        </p>
        <div className="mt-3 min-h-8">
          {item.bundleDiscountPercent > 0 ? (
            <span className="inline-flex rounded-md bg-[var(--brand-soft)] px-3 py-1.5 text-sm font-bold text-[var(--brand-primary)]">
              Save {item.bundleDiscountPercent}% on this bundle
            </span>
          ) : null}
        </div>
      </div>

      <ul className="grid gap-3 text-sm text-[var(--text-secondary)]">
        {[
          `${item.validityDays} day egg record period`,
          "Hens activate after payment approval",
          "Egg entries follow the published plan rules",
          "Eligible eggs can be submitted for sale",
        ].map((feature) => (
          <li key={feature} className="flex gap-2 leading-5">
            <Check
              className="mt-0.5 shrink-0 text-[var(--brand-primary)]"
              size={17}
              aria-hidden="true"
            />
            {feature}
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-7">
        <ButtonLink href="/sign-up" className="min-h-12 w-full">
          {ctaLabel ?? (item.hens === 1 ? "Start with 1 Hen" : `Choose ${item.name}`)}
          <ArrowRight size={17} aria-hidden="true" />
        </ButtonLink>
        <p className="mt-4 min-h-10 text-xs leading-5 text-[var(--text-secondary)]">
          Full plan terms are shown before payment. Records start after approval.
        </p>
      </div>
    </article>
  );
}
