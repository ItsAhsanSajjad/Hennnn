import { PublicHeader } from "@/components/layout/public-header";
import { brand } from "@/config/brand";

export const dynamic = "force-dynamic";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <PublicHeader />
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-black text-forest">Privacy policy</h1>
        <p className="mt-4 text-sm text-charcoal/60">Version {brand.legal.privacyVersion}</p>
        <div className="mt-6 space-y-4 leading-8 text-charcoal/75">
          <p>
            This placeholder explains that GrowMeta Egg collects account information, phone numbers,
            referral attribution, consent records, security events, and operational metadata needed
            to run the service.
          </p>
          <p>
            A launch-ready policy must be reviewed by qualified legal counsel before production use.
          </p>
        </div>
      </main>
    </div>
  );
}
