import Link from "next/link";
import {
  ShieldCheck,
  Building2,
  Scale,
  FileText,
  CheckCircle2,
  Lock,
  HelpCircle,
  ArrowRight,
  Download,
  Clock,
  Sparkles,
  Info,
} from "lucide-react";
import { SubpageHeader } from "@/components/dashboard/shared/subpage-header";
import { PremiumHero } from "@/components/dashboard/shared/premium-hero";
import { StatisticsStrip } from "@/components/dashboard/shared/stat-card";

export const dynamic = "force-dynamic";

export default function LegalCompliancePage() {
  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300 pb-36 sm:pb-28">
      {/* 1. Subpage Navigation Strip */}
      <SubpageHeader
        badge="Legal & Regulatory"
        backHref="/dashboard"
        backLabel="Dashboard"
        actionHref="/dashboard"
        actionLabel="Go to Farm"
        actionIcon="egg"
      />

      {/* 2. Premium Regulatory Hero */}
      <PremiumHero
        badge="Regulatory Compliance"
        badgeIcon={ShieldCheck}
        title="Custody, Governance & Tax Protocol"
        description="GrowMeta Egg operates a structured agricultural flock custody model. All financial top-ups, sales receipts, and disbursements comply with commercial record-keeping and applicable withholding provisions."
        imageSrc="/assets/dashboard/shortcuts/shortcut-fbr-secp.webp"
        imageAlt="Regulatory Compliance"
        chips={[
          { label: "Pakistani Agricultural Custody Standards", icon: Building2 },
          { label: "Transparent Financial Ledger Record-keeping", icon: Scale },
        ]}
        primaryAction={{
          label: "Return to Dashboard",
          href: "/dashboard",
          icon: ArrowRight,
        }}
      />

      {/* 3. Compliance Pillars Statistics Strip */}
      <StatisticsStrip
        stats={[
          {
            label: "Flock Custody",
            value: "100% Biological",
            icon: ShieldCheck,
            iconBg: "emerald",
            subtext: "Partner Poultry Sheds",
            subtextColor: "emerald",
          },
          {
            label: "Tax Framework",
            value: "FBR Withholding",
            icon: Building2,
            iconBg: "copper",
            subtext: "Applicable Income Tax Law",
            subtextColor: "copper",
          },
          {
            label: "Disbursement Policy",
            value: "Verified Payouts",
            icon: Scale,
            iconBg: "navy",
            subtext: "CNIC & Bank Matched",
            subtextColor: "emerald",
          },
        ]}
        ctaHref="/dashboard"
        ctaLabel="Go to Dashboard"
      />

      {/* 4. Structured Governance & Policy Articles */}
      <section aria-label="Governance Framework" className="space-y-6">
        <div className="border-b border-[#D8793F]/15 pb-4">
          <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#8C3A14]">
            OPERATIONAL TRANSPARENCY
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-[#17372F] tracking-tight mt-0.5">
            Governance & Taxation Disclosures
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Article 1: FBR Taxation */}
          <div className="rounded-3xl border border-[#D8793F]/25 bg-[#FFFDF4] p-6 sm:p-8 shadow-[0_10px_24px_rgba(16,34,45,0.06)] space-y-4">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-2xl bg-[#10B981]/15 text-[#0A3323]">
                <Building2 size={20} />
              </span>
              <div>
                <h3 className="text-lg font-black text-[#17372F]">FBR Taxation & Withholding Protocol</h3>
                <p className="text-xs font-semibold text-[#566D7E]">Federal Board of Revenue compliance</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm font-semibold text-[#566D7E] leading-relaxed">
              Agricultural egg sales and commercial livestock yields are accounted for under standard Pakistani tax reporting frameworks. Platform disbursements reflect applicable statutory withholding provisions where required by active fiscal directives.
            </p>

            <ul className="space-y-2 pt-1 text-xs font-semibold text-[#566D7E]">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-[#10B981] shrink-0" />
                <span>Auditable digital ledger invoices generated for every transaction</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-[#10B981] shrink-0" />
                <span>Annual transaction certificates available upon member request</span>
              </li>
            </ul>
          </div>

          {/* Article 2: Biological Custody & SECP Governance */}
          <div className="rounded-3xl border border-[#D8793F]/25 bg-[#FFFDF4] p-6 sm:p-8 shadow-[0_10px_24px_rgba(16,34,45,0.06)] space-y-4">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-2xl bg-[#FFD0A5]/40 text-[#8C3A14]">
                <Scale size={20} />
              </span>
              <div>
                <h3 className="text-lg font-black text-[#17372F]">Biological Asset Custody Agreement</h3>
                <p className="text-xs font-semibold text-[#566D7E]">Commercial poultry farm management</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm font-semibold text-[#566D7E] leading-relaxed">
              Participating members acquire rights to biological production units maintained in partnered poultry facilities. GrowMeta Egg manages feed, veterinary vaccinations, biosecurity controls, and daily egg harvesting on behalf of members.
            </p>

            <ul className="space-y-2 pt-1 text-xs font-semibold text-[#566D7E]">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-[#10B981] shrink-0" />
                <span>Veterinary-inspected commercial poultry stock</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-[#10B981] shrink-0" />
                <span>Transparent production accounting & daily egg credits</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 5. Disclaimer Notice */}
      <section
        aria-label="Legal Disclaimer"
        className="rounded-3xl border border-[#D8793F]/25 bg-[#FFFDF4] p-6 sm:p-8 shadow-[0_12px_28px_rgba(16,34,45,0.06)] space-y-3"
      >
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-2xl bg-[#0D3850]/10 text-[#09263A]">
            <Info size={20} />
          </span>
          <div>
            <h2 className="text-base sm:text-lg font-black text-[#17372F]">Statutory Disclaimer</h2>
            <p className="text-xs font-semibold text-[#566D7E]">
              Important notices regarding poultry yield variations.
            </p>
          </div>
        </div>

        <p className="text-xs sm:text-sm font-semibold text-[#566D7E] leading-relaxed pt-1">
          Biological egg output rates are structured based on commercial poultry production cycles and contract terms. Past flock yield histories do not guarantee future commercial outcomes in catastrophic weather or epidemic events. For complete terms of service and custody contracts, consult our support desk.
        </p>
      </section>
    </div>
  );
}
