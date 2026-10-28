import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CreditCard,
  Egg,
  Leaf,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Sprout,
  Star,
  Tag,
  Wallet,
} from "lucide-react";

import { brand } from "@/config/brand";
import { LandingHeader } from "@/components/marketing/landing-header";
import { InteractiveHeroHen } from "@/components/marketing/interactive-hero-hen";
import {
  LandingFaq,
  SellEggsCalculator,
  HowItWorksTimeline,
} from "@/components/marketing/landing-interactive-sections";

export const revalidate = 3600;

export const metadata = {
  title: "Buy Your Hen. Track Every Egg. | GrowMeta Egg",
  description: brand.description,
};

const trustCards = [
  {
    icon: ShieldCheck,
    title: "Transparent Records",
    desc: "Every egg is logged on server-verified schedules with complete visibility in your personal ledger.",
  },
  {
    icon: CreditCard,
    title: "Secure Payment Review",
    desc: "Automated PayBost checkout and manual bank transfers reviewed with strict audit trails.",
  },
  {
    icon: BarChart3,
    title: "Account Tracking",
    desc: "Live ledger updates for active hens, daily egg production, and accurate real-time balances.",
  },
];

const planFeatures = [
  "125-day active egg recording cycle",
  "Hens activated immediately upon payment approval",
  "Daily egg records adhere to published plan rules",
  "Eligible eggs can be submitted for market sale",
  "Transparent audit logs and downloadable receipts",
];

const plans = [
  {
    name: "Starter Plan",
    hens: "1 Hen",
    tagline: "A clear, accessible place to start your flock",
    price: "PKR 500",
    unit: "PKR 500 per hen · 1 hen included",
    popular: false,
    cta: "Start with Starter Plan",
    features: planFeatures,
  },
  {
    name: "Recommended Plan",
    hens: "5 Hens",
    tagline: "Ideal for households building a productive flock",
    price: "PKR 2,500",
    unit: "PKR 500 per hen · 5 hens included",
    popular: true,
    badge: "★ Most Popular Flock",
    cta: "Get Recommended Plan",
    features: planFeatures,
  },
  {
    name: "Commercial Barn",
    hens: "10 Hens",
    tagline: "Maximum value for a larger commercial flock",
    price: "PKR 5,000",
    unit: "PKR 500 per hen · 10 hens included",
    popular: false,
    cta: "Get Commercial Plan",
    features: planFeatures,
  },
];

const transparencyItems = [
  {
    icon: Leaf,
    title: "Hen Ownership",
    text: "You own the hen rights. Our experienced agricultural team manages flock feeding, welfare, and housing.",
  },
  {
    icon: Sprout,
    title: "Daily Care",
    text: "Nutritious balanced feed, bio-secure facilities, and regular veterinary checks maintain high flock health.",
  },
  {
    icon: Egg,
    title: "Egg Recording",
    text: "Every egg is systematically recorded on a server-controlled schedule — no arbitrary estimates.",
  },
  {
    icon: LockKeyhole,
    title: "Secure Storage",
    text: "All account activities and financial transactions are stored in an immutable audit ledger.",
  },
  {
    icon: Tag,
    title: "Fair Pricing",
    text: "Strict PKR 500 per hen baseline with fully itemized service and processing fees at settlement.",
  },
  {
    icon: Wallet,
    title: "Timely Payouts",
    text: "Promptly processed egg-sale requests sent directly to your verified bank, JazzCash, or EasyPaisa.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#06171E] text-[#F7FBF8] selection:bg-[#10B981] selection:text-[#041410]">
      {/* 1. Sticky Premium Header */}
      <LandingHeader />

      <main>
        {/* 2. Hero Section */}
        <section
          id="home"
          aria-label="Hero Overview"
          className="relative overflow-hidden pt-8 pb-16 lg:pt-14 lg:pb-24"
        >
          {/* Subtle Ambient Radial Lighting */}
          <div className="pointer-events-none absolute -left-24 top-10 size-96 rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.18),transparent_70%)] blur-2xl" />
          <div className="pointer-events-none absolute -right-24 top-24 size-96 rounded-full bg-[radial-gradient(circle,rgba(216,121,63,0.12),transparent_70%)] blur-2xl" />

          <div className="w-[min(calc(100%-24px),1240px)] sm:w-[min(calc(100%-40px),1240px)] mx-auto grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
            {/* Left Hero Content */}
            <div className="space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#10B981]/30 bg-[#10B981]/10 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-[#10B981] shadow-sm">
                <Sparkles size={14} className="text-[#10B981]" aria-hidden="true" />
                Agri-Fintech Poultry Ecosystem
              </span>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.08]">
                Buy Your Hen. <br />
                Track <span className="font-serif italic font-normal text-[#F5C451]">Every Egg.</span>
              </h1>

              <p className="max-w-xl text-base sm:text-lg font-semibold text-[#A9C2BC] leading-relaxed">
                Own verified hens on our professionally managed farms. Monitor daily egg production in real time and sell your recorded eggs with complete transparency.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  href="/sign-up"
                  style={{
                    background: "linear-gradient(180deg, #F59B52 0%, #D8793F 100%)",
                    boxShadow: "0 3px 0 #8C3A14, 0 8px 20px rgba(216, 121, 63, 0.35)",
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl px-8 py-3.5 text-sm sm:text-base font-black uppercase tracking-wider text-white hover:brightness-105 active:translate-y-0.5 transition min-h-[48px]"
                >
                  Create Account <ArrowRight size={17} aria-hidden="true" />
                </Link>

                <Link
                  href="/sign-in"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-7 py-3.5 text-sm sm:text-base font-bold text-white hover:bg-white/15 transition active:scale-[0.98] min-h-[48px]"
                >
                  Login <ArrowRight size={17} aria-hidden="true" />
                </Link>
              </div>

              {/* Trust Indicators Strip */}
              <div className="flex flex-wrap items-center gap-6 border-t border-white/10 pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    <span className="grid size-9 place-items-center rounded-full border-2 border-[#06171E] bg-[#10B981] text-[11px] font-black text-white">AK</span>
                    <span className="grid size-9 place-items-center rounded-full border-2 border-[#06171E] bg-[#D8793F] text-[11px] font-black text-white">HM</span>
                    <span className="grid size-9 place-items-center rounded-full border-2 border-[#06171E] bg-[#F5C451] text-[11px] font-black text-[#17372F]">RS</span>
                  </div>
                  <div>
                    <p className="text-xs font-black text-white">2,400+ Members</p>
                    <p className="text-[11px] font-semibold text-[#A9C2BC]">Active flock owners</p>
                  </div>
                </div>

                <div className="h-7 w-px bg-white/15" />

                <div className="flex items-center gap-2.5">
                  <div className="flex text-[#F5C451]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={15} fill="#F5C451" aria-hidden="true" />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-white">4.9 / 5 Rating</span>
                </div>
              </div>
            </div>

            {/* Right Hero Interactive 3D Hen Stage */}
            <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
              <InteractiveHeroHen />
            </div>
          </div>
        </section>

        {/* 3. Trust Cards (Why Us) */}
        <section
          id="why-us"
          aria-label="Why Choose GrowMeta Egg"
          className="relative z-10 py-12 sm:py-16"
        >
          <div className="w-[min(calc(100%-24px),1240px)] sm:w-[min(calc(100%-40px),1240px)] mx-auto grid gap-6 md:grid-cols-3">
            {trustCards.map((card) => (
              <article
                key={card.title}
                className="rounded-3xl border border-[#10B981]/20 bg-[#09262B]/85 p-6 sm:p-7 shadow-[0_12px_28px_rgba(0,0,0,0.35)] hover:-translate-y-1 hover:border-[#10B981]/40 transition-all duration-300 flex items-start gap-4"
              >
                <div className="size-12 rounded-2xl bg-[#10B981]/15 border border-[#10B981]/30 grid place-items-center text-[#10B981] shrink-0">
                  <card.icon size={22} aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white tracking-tight">{card.title}</h2>
                  <p className="mt-1.5 text-xs sm:text-sm font-semibold leading-relaxed text-[#A9C2BC]">{card.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* 4. How It Works Section */}
        <section
          id="how-it-works"
          aria-label="How It Works"
          className="scroll-mt-24 py-16 sm:py-20 lg:py-24 bg-[#081F26]/70 border-y border-white/5"
        >
          <div className="w-[min(calc(100%-24px),1240px)] sm:w-[min(calc(100%-40px),1240px)] mx-auto space-y-12 sm:space-y-16">
            <div className="mx-auto max-w-2xl text-center space-y-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#10B981]/30 bg-[#10B981]/10 px-4 py-1 text-xs font-black uppercase tracking-wider text-[#10B981]">
                Simple 5-Step Process
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                How GrowMeta Egg <span className="font-serif italic font-normal text-[#F5C451]">works</span>.
              </h2>
              <p className="text-sm sm:text-base font-semibold text-[#A9C2BC]">
                From choosing your hens to tracking daily records and selling eggs — clear, reliable, and hands-off.
              </p>
            </div>

            {/* Interactive Timeline Component */}
            <HowItWorksTimeline />
          </div>
        </section>

        {/* 5. Plans Section */}
        <section
          id="plans"
          aria-label="Poultry Plans"
          className="scroll-mt-24 py-16 sm:py-20 lg:py-24"
        >
          <div className="w-[min(calc(100%-24px),1240px)] sm:w-[min(calc(100%-40px),1240px)] mx-auto space-y-12 sm:space-y-14">
            <div className="mx-auto max-w-2xl text-center space-y-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#10B981]/30 bg-[#10B981]/10 px-4 py-1 text-xs font-black uppercase tracking-wider text-[#10B981]">
                Verified Poultry Bundles
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                Choose your <span className="font-serif italic font-normal text-[#F5C451]">poultry plan</span>.
              </h2>
              <p className="text-sm sm:text-base font-semibold text-[#A9C2BC]">
                Select the flock size that fits your ambition. Transparent pricing at PKR 500 per hen.
              </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-3 lg:items-stretch">
              {plans.map((p) => (
                <div
                  key={p.name}
                  className={`relative flex flex-col rounded-3xl p-7 transition-all duration-300 ${
                    p.popular
                      ? "border-2 border-[#10B981] bg-gradient-to-b from-[#0B2C2E] to-[#082025] shadow-[0_20px_40px_rgba(0,0,0,0.6),0_0_24px_rgba(16,185,129,0.2)] lg:-translate-y-2.5"
                      : "border border-[#10B981]/20 bg-[#09262B]/85 shadow-[0_12px_28px_rgba(0,0,0,0.35)]"
                  }`}
                >
                  {p.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full border border-[#10B981] bg-gradient-to-r from-[#10B981] to-[#059669] px-4 py-1 text-[11px] font-black tracking-wider text-white uppercase shadow-md">
                      {p.badge}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-[#10B981]">{p.hens}</span>
                      <h3 className="mt-1 text-2xl font-black text-white">{p.name}</h3>
                    </div>
                    <div className="grid size-12 place-items-center rounded-2xl bg-white/10 text-[#10B981]">
                      <Sprout size={24} aria-hidden="true" />
                    </div>
                  </div>

                  <p className="mt-2 text-xs font-semibold text-[#A9C2BC]">{p.tagline}</p>

                  <div className="my-5 h-px bg-white/10" />

                  <div>
                    <div className="text-3xl font-black text-white tabular-nums">{p.price}</div>
                    <p className="mt-1 text-xs font-semibold text-[#A9C2BC]">{p.unit}</p>
                  </div>

                  <div className="my-6 h-px bg-white/10" />

                  <ul className="flex-1 space-y-3">
                    {p.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2.5 text-xs sm:text-sm font-semibold text-[#D5E5E0]">
                        <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[#10B981]" aria-hidden="true" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/sign-up"
                    style={{
                      background: p.popular
                        ? "linear-gradient(180deg, #F59B52 0%, #D8793F 100%)"
                        : "rgba(255, 255, 255, 0.08)",
                      boxShadow: p.popular
                        ? "0 2px 0 #8C3A14, 0 6px 16px rgba(216, 121, 63, 0.3)"
                        : "none",
                    }}
                    className={`mt-8 w-full inline-flex items-center justify-center gap-2 rounded-2xl py-3.5 px-4 text-xs font-black uppercase tracking-wider text-white transition active:scale-[0.98] min-h-[46px] ${
                      p.popular
                        ? "hover:brightness-105"
                        : "border border-white/15 hover:bg-white/15"
                    }`}
                  >
                    {p.cta} <ArrowRight size={15} aria-hidden="true" />
                  </Link>
                </div>
              ))}
            </div>

            <p className="flex items-center justify-center gap-2 text-center text-xs font-semibold text-[#A9C2BC]">
              <LockKeyhole size={14} className="text-[#10B981]" aria-hidden="true" />
              Full plan terms and cycle duration are presented transparently before checkout.
            </p>
          </div>
        </section>

        {/* 6. Sell Recorded Eggs Section (Split Layout) */}
        <section
          id="sell-eggs"
          aria-label="Sell Recorded Eggs"
          className="scroll-mt-24 py-16 sm:py-20 lg:py-24 bg-[#081F26]/70 border-y border-white/5"
        >
          <div className="w-[min(calc(100%-24px),1240px)] sm:w-[min(calc(100%-40px),1240px)] mx-auto grid items-center gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
            {/* Left: Editorial */}
            <div className="space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#10B981]/30 bg-[#10B981]/10 px-4 py-1 text-xs font-black uppercase tracking-wider text-[#10B981]">
                Flexible · Fair · Fast
              </span>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                Sell your <span className="font-serif italic font-normal text-[#F5C451]">recorded eggs</span>.
              </h2>

              <p className="text-sm sm:text-base font-semibold leading-relaxed text-[#A9C2BC]">
                Whenever your egg balance is ready, submit a sale request with a single tap. Our system calculates verified market rates, applies transparent processing, and issues direct payouts to your chosen payment method.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3">
                  <span className="grid size-7 place-items-center rounded-full bg-[#10B981]/20 text-[#10B981] font-black text-xs">✓</span>
                  <span className="text-sm font-bold text-white">Guaranteed fair market pricing with zero hidden fees</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="grid size-7 place-items-center rounded-full bg-[#10B981]/20 text-[#10B981] font-black text-xs">✓</span>
                  <span className="text-sm font-bold text-white">Prompt payouts via Bank Transfer, JazzCash, or EasyPaisa</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="grid size-7 place-items-center rounded-full bg-[#10B981]/20 text-[#10B981] font-black text-xs">✓</span>
                  <span className="text-sm font-bold text-white">Real-time status updates from request to completion</span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/sign-up"
                  style={{
                    background: "linear-gradient(180deg, #F59B52 0%, #D8793F 100%)",
                    boxShadow: "0 2px 0 #8C3A14, 0 6px 16px rgba(216, 121, 63, 0.3)",
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl px-7 py-3 text-xs sm:text-sm font-black uppercase tracking-wider text-white hover:brightness-105 active:translate-y-0.5 transition min-h-[46px]"
                >
                  Start Earning Today <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </div>
            </div>

            {/* Right: Interactive Settlement Calculator Card */}
            <div>
              <SellEggsCalculator />
            </div>
          </div>
        </section>

        {/* 7. Farm Life & Care Story */}
        <section
          id="farm-life"
          aria-label="Farm Life and Story"
          className="scroll-mt-24 py-16 sm:py-20 lg:py-24"
        >
          <div className="w-[min(calc(100%-24px),1240px)] sm:w-[min(calc(100%-40px),1240px)] mx-auto grid items-center gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-14">
            {/* Left: Farm Image with Rounded Mask Frame */}
            <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
              <div className="relative overflow-hidden rounded-[2.5rem] border-4 border-[#10B981]/40 shadow-[0_24px_50px_rgba(0,0,0,0.6)] aspect-[4/3]">
                <Image
                  src="/marketing/farm-story.jpg"
                  alt="Pasture-raised healthy hens in spacious farm coops"
                  width={1100}
                  height={900}
                  className="size-full object-cover"
                />
              </div>

              <div className="absolute -bottom-4 -right-2 sm:right-4 flex items-center gap-3 rounded-2xl border border-white/80 bg-[#FFFDF4] p-3.5 sm:p-4 text-[#17372F] shadow-xl">
                <span className="grid size-9 place-items-center rounded-xl bg-[#10B981]/20 text-[#0A3323]">
                  <Egg size={20} aria-hidden="true" />
                </span>
                <div>
                  <strong className="block text-xs font-black text-[#17372F]">Fresh Daily Yield</strong>
                  <small className="block text-[10px] font-semibold text-[#566D7E]">From healthy hens</small>
                </div>
              </div>
            </div>

            {/* Right: Narrative Story */}
            <div className="space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#10B981]/30 bg-[#10B981]/10 px-4 py-1 text-xs font-black uppercase tracking-wider text-[#10B981]">
                A Better Way to Grow
              </span>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                Healthy hens deliver <span className="font-serif italic font-normal text-[#F5C451]">real results</span>.
              </h2>

              <p className="text-sm sm:text-base font-semibold leading-relaxed text-[#A9C2BC]">
                At GrowMeta Egg, we combine rigorous bio-security standards with ethical poultry farming practices. Every hen under management receives premium balanced feed, climate-controlled shelter, and routine veterinary inspections.
              </p>

              <ul className="space-y-3 text-xs sm:text-sm font-bold text-[#D5E5E0]">
                <li className="flex items-center gap-3">
                  <span className="grid size-6 place-items-center rounded-full bg-[#10B981] text-xs text-[#041215]">✓</span>
                  Nutritious natural feed formulations & fresh clean water
                </li>
                <li className="flex items-center gap-3">
                  <span className="grid size-6 place-items-center rounded-full bg-[#10B981] text-xs text-[#041215]">✓</span>
                  Automated record-keeping for every batch produced
                </li>
                <li className="flex items-center gap-3">
                  <span className="grid size-6 place-items-center rounded-full bg-[#10B981] text-xs text-[#041215]">✓</span>
                  A transparent community bridging poultry farming and modern fintech
                </li>
              </ul>

              <div className="pt-2">
                <Link
                  href="/about"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-6 py-3 text-xs sm:text-sm font-bold text-white hover:bg-white/15 transition min-h-[46px]"
                >
                  Discover Our Mission <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 8. Transparency Section (3x2 Grid) */}
        <section
          id="transparency"
          aria-label="Transparency and Standards"
          className="scroll-mt-24 py-16 sm:py-20 lg:py-24 bg-[#081F26]/70 border-y border-white/5 gme-lazy-render"
        >
          <div className="w-[min(calc(100%-24px),1240px)] sm:w-[min(calc(100%-40px),1240px)] mx-auto space-y-12 sm:space-y-14">
            <div className="mx-auto max-w-2xl text-center space-y-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#10B981]/30 bg-[#10B981]/10 px-4 py-1 text-xs font-black uppercase tracking-wider text-[#10B981]">
                Guaranteed Integrity
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                Complete transparency, <span className="font-serif italic font-normal text-[#F5C451]">always</span>.
              </h2>
              <p className="text-sm sm:text-base font-semibold text-[#A9C2BC]">
                We believe trust is built through open accounting, verifiable flock records, and reliable settlements.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {transparencyItems.map((item) => (
                <div
                  key={item.title}
                  className="rounded-3xl border border-[#10B981]/20 bg-[#09262B]/85 p-6 sm:p-7 shadow-[0_12px_28px_rgba(0,0,0,0.35)] hover:-translate-y-1 hover:border-[#10B981]/40 transition-all duration-300 space-y-3"
                >
                  <div className="size-12 rounded-2xl bg-[#10B981]/15 border border-[#10B981]/30 grid place-items-center text-[#10B981]">
                    <item.icon size={22} aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-black text-white tracking-tight">{item.title}</h3>
                  <p className="text-xs sm:text-sm font-semibold leading-relaxed text-[#A9C2BC]">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 9. FAQ Section */}
        <section
          id="faq"
          aria-label="Frequently Asked Questions"
          className="scroll-mt-24 py-16 sm:py-20 lg:py-24 gme-lazy-render"
        >
          <div className="w-[min(calc(100%-24px),1240px)] sm:w-[min(calc(100%-40px),1240px)] mx-auto grid items-start gap-12 lg:grid-cols-[1.25fr_0.75fr]">
            {/* Left: Accordion list */}
            <div className="space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#10B981]/30 bg-[#10B981]/10 px-4 py-1 text-xs font-black uppercase tracking-wider text-[#10B981]">
                Got Questions?
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                Frequently asked <span className="font-serif italic font-normal text-[#F5C451]">questions</span>.
              </h2>
              <p className="text-sm sm:text-base font-semibold text-[#A9C2BC]">
                Everything you need to know about plans, egg records, and payout processing.
              </p>

              <div className="pt-2">
                <LandingFaq />
              </div>
            </div>

            {/* Right: Sticky Brand Assistance Card */}
            <div className="rounded-3xl border border-[#10B981]/25 bg-[#09262B] p-8 text-center space-y-5 shadow-[0_16px_36px_rgba(0,0,0,0.45)] lg:sticky lg:top-28">
              <div className="relative mx-auto size-24">
                <Image
                  src="/brand/growmeta-egg-icon.png"
                  alt="GrowMeta Egg Emblem"
                  width={100}
                  height={100}
                  className="size-full object-contain drop-shadow-[0_8px_20px_rgba(16,185,129,0.3)]"
                />
              </div>

              <div>
                <h3 className="text-xl font-black text-white">GrowMeta Egg Platform</h3>
                <p className="text-xs font-bold text-[#10B981] mt-1">Recorded · Reviewed · Paid</p>
                <p className="text-xs font-semibold leading-relaxed text-[#A9C2BC] mt-3">
                  Have specific questions about poultry plans or bulk orders? Our dedicated team is available to assist you.
                </p>
              </div>

              <div className="grid gap-2.5 pt-2">
                <Link
                  href="/contact"
                  style={{
                    background: "linear-gradient(180deg, #10B981 0%, #059669 100%)",
                    boxShadow: "0 2px 0 #047857, 0 6px 16px rgba(16, 185, 129, 0.3)",
                  }}
                  className="flex items-center justify-center gap-1.5 rounded-2xl py-3 text-xs font-black uppercase tracking-wider text-white hover:brightness-105 transition min-h-[44px]"
                >
                  Contact Support <ArrowRight size={14} aria-hidden="true" />
                </Link>
                <Link
                  href="/sign-up"
                  className="flex items-center justify-center rounded-2xl border border-white/20 bg-white/10 py-3 text-xs font-bold text-white hover:bg-white/15 transition min-h-[44px]"
                >
                  Create Account
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 10. Final Conversion CTA Banner */}
        <section
          aria-label="Start Your Poultry Journey"
          className="py-12 sm:py-16"
        >
          <div className="w-[min(calc(100%-24px),1240px)] sm:w-[min(calc(100%-40px),1240px)] mx-auto">
            <div className="relative overflow-hidden rounded-3xl border-2 border-[#10B981]/40 bg-gradient-to-r from-[#0A2E28] via-[#0D2433] to-[#0A2A26] p-8 sm:p-12 shadow-[0_24px_50px_rgba(0,0,0,0.6)]">
              <div className="pointer-events-none absolute -right-12 -top-12 size-60 rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.25),transparent_70%)]" />
              <div className="pointer-events-none absolute -bottom-12 -left-12 size-60 rounded-full bg-[radial-gradient(circle,rgba(216,121,63,0.15),transparent_70%)]" />

              <div className="relative z-10 flex flex-col items-center justify-between gap-8 text-center md:flex-row md:text-left">
                <div className="max-w-xl space-y-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#10B981]/30 bg-[#10B981]/15 px-3 py-0.5 text-[11px] font-black uppercase tracking-wider text-[#10B981]">
                    Ready to Begin?
                  </span>
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
                    Start your <span className="font-serif italic font-normal text-[#F5C451]">poultry journey</span> today
                  </h2>
                  <p className="text-sm font-semibold text-[#A9C2BC]">
                    Join thousands of smart flock owners who rely on GrowMeta Egg for transparent tracking and reliable payouts.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <Link
                    href="/sign-up"
                    style={{
                      background: "linear-gradient(180deg, #F59B52 0%, #D8793F 100%)",
                      boxShadow: "0 3px 0 #8C3A14, 0 8px 20px rgba(216, 121, 63, 0.35)",
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl px-8 py-3.5 text-sm font-black uppercase tracking-wider text-white hover:brightness-105 active:translate-y-0.5 transition min-h-[48px]"
                  >
                    Create Account <ArrowRight size={17} aria-hidden="true" />
                  </Link>
                  <Link
                    href="/sign-in"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-6 py-3.5 text-sm font-bold text-white hover:bg-white/15 transition min-h-[48px]"
                  >
                    Login
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 11. Footer */}
      <footer className="border-t border-white/10 bg-[#041217] pt-14 pb-8 text-[#A9C2BC]">
        <div className="w-[min(calc(100%-24px),1240px)] sm:w-[min(calc(100%-40px),1240px)] mx-auto grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2" aria-label="GrowMeta Egg Home">
              <Image
                src="/brand/growmeta-egg-lockup.png"
                alt="GrowMeta Egg"
                width={150}
                height={46}
                className="h-10 w-auto"
              />
            </Link>
            <p className="max-w-xs text-xs font-semibold leading-relaxed text-[#A9C2BC]">
              {brand.description}
            </p>
            <p className="text-xs font-bold text-[#10B981]">
              Official Domain: grow-meta-egg.digital
            </p>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-white">Platform</h4>
            <ul className="mt-4 space-y-2.5 text-xs font-semibold">
              <li><a href="#home" className="hover:text-[#10B981] transition">Home</a></li>
              <li><a href="#why-us" className="hover:text-[#10B981] transition">Why Us</a></li>
              <li><a href="#how-it-works" className="hover:text-[#10B981] transition">How It Works</a></li>
              <li><a href="#plans" className="hover:text-[#10B981] transition">Plans &amp; Pricing</a></li>
              <li><a href="#sell-eggs" className="hover:text-[#10B981] transition">Sell Recorded Eggs</a></li>
              <li><a href="#transparency" className="hover:text-[#10B981] transition">Transparency</a></li>
              <li><a href="#faq" className="hover:text-[#10B981] transition">FAQ</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-white">Company &amp; Legal</h4>
            <ul className="mt-4 space-y-2.5 text-xs font-semibold">
              <li><Link href="/about" className="hover:text-[#10B981] transition">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-[#10B981] transition">Contact Support</Link></li>
              <li><Link href="/legal/terms" className="hover:text-[#10B981] transition">Terms &amp; Conditions</Link></li>
              <li><Link href="/legal/privacy" className="hover:text-[#10B981] transition">Privacy Policy</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-white">Flock Assurance</h4>
            <p className="text-xs font-semibold leading-relaxed text-[#A9C2BC]">
              Every account is secured with server-side audit trails, authentic ledger records, and verified flock custody.
            </p>
            <div>
              <Link
                href="/sign-up"
                style={{
                  background: "linear-gradient(180deg, #10B981 0%, #059669 100%)",
                }}
                className="inline-flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-xs font-black text-white hover:brightness-105 transition min-h-[42px]"
              >
                Join Today <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>

        <div className="w-[min(calc(100%-24px),1240px)] sm:w-[min(calc(100%-40px),1240px)] mx-auto mt-12 border-t border-white/10 pt-6 space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-semibold text-[#6E8E87]">
            <p>© 2026 GrowMeta Egg. All rights reserved.</p>
            <p>Built with care for poultry flock owners across Pakistan.</p>
          </div>
          <p className="text-[10px] font-medium leading-relaxed text-[#6E8E87]">
            {brand.disclaimer}
          </p>
        </div>
      </footer>
    </div>
  );
}


