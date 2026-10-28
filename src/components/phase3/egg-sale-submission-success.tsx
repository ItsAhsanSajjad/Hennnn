import { BadgeCheck, ClipboardCheck, Inbox, Landmark, SearchCheck } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { formatDateTime, formatPaisa } from "@/lib/utilities/format";

export function EggSaleSubmissionSuccess({
  publicReference,
  eggQuantity,
  totalAmountPaisa,
  payoutAccount,
  submittedAt,
}: {
  publicReference: string;
  eggQuantity: number;
  totalAmountPaisa: bigint;
  payoutAccount: string;
  submittedAt: Date;
}) {
  const steps = [
    ["Request submitted", Inbox],
    ["Under review", SearchCheck],
    ["Payment processing", Landmark],
    ["Paid", BadgeCheck],
  ] as const;

  return (
    <section
      className="egg-sale-success overflow-hidden rounded-lg border border-leaf/25 bg-surface p-6 shadow-soft sm:p-8"
      aria-live="polite"
    >
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-center">
        <div>
          <span className="pak-section-title">
            <ClipboardCheck aria-hidden="true" size={15} />
            Request received
          </span>
          <h1 className="mt-4 text-3xl font-extrabold text-forest sm:text-4xl">
            Your egg-sale request has been received.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-charcoal/70">
            Your eggs are now reserved, and the GrowMeta Egg operations team can review your request. You
            will be notified when the payment status changes.
          </p>
          <dl className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              ["Sale request", publicReference],
              ["Eggs submitted", `${eggQuantity} eggs`],
              ["Estimated payable", formatPaisa(totalAmountPaisa)],
              ["Payment account", payoutAccount],
              ["Current status", "Awaiting review"],
              ["Submitted", formatDateTime(submittedAt)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-md border border-mist bg-ivory p-3">
                <dt className="text-xs font-bold uppercase tracking-normal text-charcoal/55">
                  {label}
                </dt>
                <dd className="mt-1 break-words text-sm font-bold text-charcoal">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href={`/dashboard/egg-sales/${publicReference}`} variant="secondary">
              View request
            </ButtonLink>
            <ButtonLink href="/dashboard">Return to dashboard</ButtonLink>
          </div>
        </div>

        <div className="egg-sale-processing-grid rounded-lg border border-mist bg-ivory p-5">
          <div className="egg-sale-tray" aria-hidden="true">
            <span className="egg-sale-token egg-sale-token-one" />
            <span className="egg-sale-token egg-sale-token-two" />
            <span className="egg-sale-token egg-sale-token-three" />
            <span className="egg-sale-tray-mark">
              <ClipboardCheck size={24} />
            </span>
          </div>
          <ol className="egg-sale-status-line mt-5 grid gap-4">
            {steps.map(([label, Icon], index) => (
              <li key={label} className="relative flex items-center gap-3 text-sm">
                <span
                  className={`grid size-9 place-items-center rounded-full ${index === 0 ? "bg-[var(--surface-dark)] text-white" : "bg-surface text-leaf"}`}
                >
                  <Icon aria-hidden="true" size={18} />
                </span>
                <span className={`font-bold ${index === 0 ? "text-forest" : "text-charcoal/60"}`}>
                  {label}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
