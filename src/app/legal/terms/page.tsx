import { PublicHeader } from "@/components/layout/public-header";
import { brand } from "@/config/brand";

export const dynamic = "force-dynamic";

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      <PublicHeader />
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-black text-forest">Terms and conditions</h1>
        <p className="mt-4 text-sm text-charcoal/60">Version {brand.legal.termsVersion}</p>
        <div className="mt-6 space-y-4 leading-8 text-charcoal/75">
          <p>
            This Phase 1 placeholder states that no real deposits, payouts, daily returns,
            commissions, or poultry sale submissions are enabled.
          </p>
          <p>
            Commercial, compliance, refund, and risk disclosures require client-supplied facts and
            legal review before launch.
          </p>
        </div>
      </main>
    </div>
  );
}
