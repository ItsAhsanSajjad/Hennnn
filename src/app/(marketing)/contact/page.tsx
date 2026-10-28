import { BellRing, MessageSquareText, ShieldCheck } from "lucide-react";

import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";

export const revalidate = 3600;

export default function ContactPage() {
  return (
    <div className="pak-site min-h-screen">
      <PublicHeader />
      <main>
        <section className="border-b border-mist bg-surface">
          <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
            <p className="pak-kicker">Contact and support</p>
            <h1 className="mt-3 text-4xl font-extrabold text-forest sm:text-5xl">
              Support details should be verified before they are published.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-charcoal/70">
              This preview environment does not publish phone numbers, WhatsApp accounts, office
              addresses, or third-party provider claims that have not been independently verified.
            </p>
          </div>
        </section>

        <section className="bg-ivory">
          <div className="mx-auto grid max-w-4xl gap-4 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
            {[
              [MessageSquareText, "Account support", "Verified support channels can be published here when the operating team configures them."],
              [BellRing, "In-app updates", "Account notices, review states, and activity messages appear inside the protected workspace."],
              [ShieldCheck, "Privacy first", "Public contact details are not substituted with placeholders that could mislead users."],
            ].map(([Icon, title, text]) => {
              const FeatureIcon = Icon as typeof MessageSquareText;
              return (
                <article key={title as string} className="rounded-lg border border-mist bg-surface p-6">
                  <FeatureIcon aria-hidden="true" className="text-leaf" size={22} />
                  <h2 className="mt-5 text-lg font-extrabold text-forest">{title as string}</h2>
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
