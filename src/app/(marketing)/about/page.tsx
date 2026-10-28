import {
  Building2,
  ClipboardCheck,
  Egg,
  FileCheck2,
  ReceiptText,
  ShieldCheck,
  Truck,
} from "lucide-react";

import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";

const operatingSteps = [
  { icon: Building2, label: "Poultry operations", text: "The operating business maintains the poultry-side plan configuration." },
  { icon: Egg, label: "Production records", text: "Approved hen assets contribute activity to each account's egg ledger." },
  { icon: Truck, label: "Distribution process", text: "The business process can track relevant operational and sale-review steps." },
  { icon: ReceiptText, label: "Account records", text: "Users see their order, status, egg, and request history in one workspace." },
];

const recordItems = [
  ["Order reference", "The plan snapshot, quantity, and amount at the moment an order is created."],
  ["Payment submission", "The supplied transaction reference, proof status, and finance review outcome."],
  ["Hen activation", "The approval result, activation date, daily record, and plan window."],
  ["Egg activity", "Ledger entries that show credited units, reservations, and related descriptions."],
  ["Sale request", "The requested quantity, configured rate snapshot, payout method, and settlement status."],
];

export const revalidate = 3600;

export default function AboutPage() {
  return (
    <div className="pak-site min-h-screen">
      <PublicHeader />
      <main>
        <section className="border-b border-mist bg-surface">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
            <p className="pak-kicker">Operating model</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-extrabold text-forest sm:text-5xl">
              A digital account layer around a real operating workflow.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-charcoal/70">
              GrowMeta Egg is designed to make a multi-step poultry participation workflow easier to
              understand. It connects plan selection, payment review, activation, egg records,
              and settlement requests through a consistent account history.
            </p>
          </div>
        </section>

        <section id="operations" className="scroll-mt-24 border-b border-mist bg-ivory">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
            <div className="max-w-2xl">
              <p className="pak-kicker">How operations connect</p>
              <h2 className="mt-3 text-3xl font-extrabold text-forest sm:text-4xl">
                From operations to an understandable account record.
              </h2>
            </div>
            <ol className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {operatingSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <li key={step.label} className="pak-data-card rounded-lg p-5">
                    <div className="flex items-center justify-between">
                      <span className="flex size-10 items-center justify-center rounded-md bg-ivory text-leaf">
                        <Icon aria-hidden="true" size={20} />
                      </span>
                      <span className="text-sm font-bold text-charcoal/45">0{index + 1}</span>
                    </div>
                    <h3 className="mt-6 text-lg font-extrabold text-forest">{step.label}</h3>
                    <p className="mt-2 text-sm leading-6 text-charcoal/70">{step.text}</p>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        <section id="transparency" className="scroll-mt-24 border-b border-mist bg-surface">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8 lg:py-24">
            <div>
              <p className="pak-kicker">Transparency</p>
              <h2 className="mt-3 text-3xl font-extrabold text-forest sm:text-4xl">
                What a user can verify inside the product.
              </h2>
              <p className="mt-4 max-w-md text-base leading-7 text-charcoal/70">
                Credibility comes from showing the origin and state of important activity. The
                workspace is structured around records, not vague balances.
              </p>
            </div>
            <div className="divide-y divide-mist rounded-lg border border-mist bg-surface px-5">
              {recordItems.map(([title, text], index) => (
                <div key={title} className="grid grid-cols-[40px_1fr] gap-4 py-5">
                  <span className="flex size-10 items-center justify-center rounded-md bg-ivory text-sm font-extrabold text-leaf">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="font-extrabold text-forest">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-charcoal/70">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-cream">
          <div className="mx-auto grid max-w-7xl gap-4 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8 lg:py-24">
            {[
              [ClipboardCheck, "Clear status", "Requests use clear review states so there is less guesswork about next steps."],
              [FileCheck2, "Plan snapshots", "Order records keep the relevant plan details available after the catalogue changes."],
              [ShieldCheck, "Protected access", "Accounts, sessions, and permission checks are handled in the application layer."],
            ].map(([Icon, title, text]) => {
              const FeatureIcon = Icon as typeof ClipboardCheck;
              return (
                <article key={title as string} className="rounded-lg border border-mist bg-surface p-6">
                  <FeatureIcon aria-hidden="true" className="text-leaf" size={22} />
                  <h3 className="mt-5 text-xl font-extrabold text-forest">{title as string}</h3>
                  <p className="mt-2 text-sm leading-6 text-charcoal/70">{text as string}</p>
                </article>
              );
            })}
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
