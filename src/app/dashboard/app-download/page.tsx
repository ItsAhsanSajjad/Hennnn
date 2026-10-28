"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Download,
  Smartphone,
  ShieldCheck,
  Zap,
  Bell,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Share2,
  Globe,
  Info,
  Layers,
  Clock,
  PlusSquare,
} from "lucide-react";
import { SubpageHeader } from "@/components/dashboard/shared/subpage-header";
import { PremiumHero } from "@/components/dashboard/shared/premium-hero";
import { StatisticsStrip } from "@/components/dashboard/shared/stat-card";

export default function AppDownloadPage() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const choiceResult = await installPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setIsInstalled(true);
      }
      setInstallPrompt(null);
    } else {
      alert("To install GrowMeta Egg: Open your browser menu (⋮ or share icon) and tap 'Add to Home screen' or 'Install App'.");
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300 pb-36 sm:pb-28">
      {/* 1. Subpage Navigation Strip */}
      <SubpageHeader
        badge="Mobile Portal"
        backHref="/dashboard"
        backLabel="Dashboard"
        actionHref="/dashboard"
        actionLabel="Go to Farm"
        actionIcon="egg"
      />

      {/* 2. Premium App Hero */}
      <PremiumHero
        badge="Official Mobile Web App"
        badgeIcon={Smartphone}
        title="Fast, Lightweight & Always Synced"
        description="Experience zero-latency flock monitoring, instant deposit verification notifications, and daily egg harvesting right from your mobile home screen with the official GrowMeta Egg Progressive Web App."
        imageSrc="/assets/dashboard/shortcuts/shortcut-app-download.webp"
        imageAlt="GrowMeta Egg App"
        chips={[
          { label: "High-Speed PWA Web App", icon: Zap },
          { label: "iOS & Android Supported", icon: Globe },
        ]}
        primaryAction={{
          label: isInstalled ? "App Installed!" : "Install App to Screen",
          onClick: handleInstallClick,
          icon: Download,
        }}
        secondaryAction={{
          label: "Continue in Browser",
          href: "/dashboard",
          icon: ArrowRight,
        }}
      />

      {/* 3. Statistics / Features Strip */}
      <StatisticsStrip
        stats={[
          {
            label: "App Performance",
            value: "Zero Latency",
            icon: Zap,
            iconBg: "emerald",
            subtext: "Instant Screen Loads",
            subtextColor: "emerald",
          },
          {
            label: "Device Storage",
            value: "< 2 MB Size",
            icon: Smartphone,
            iconBg: "copper",
            subtext: "Lightweight Footprint",
            subtextColor: "copper",
          },
          {
            label: "Collection Access",
            value: "1-Tap Harvest",
            icon: Layers,
            iconBg: "navy",
            subtext: "Direct Farm Controls",
            subtextColor: "emerald",
          },
        ]}
        ctaHref="/dashboard"
        ctaLabel="Open Farm"
      />

      {/* 4. Step-by-Step Installation Guides */}
      <section aria-label="Installation Instructions" className="space-y-6">
        <div className="border-b border-[#D8793F]/15 pb-4">
          <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#8C3A14]">
            QUICK SETUP GUIDE
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-[#17372F] tracking-tight mt-0.5">
            How to Install on Your Device
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Android Guide */}
          <div className="rounded-3xl border border-[#D8793F]/25 bg-[#FFFDF4] p-6 sm:p-8 shadow-[0_10px_24px_rgba(16,34,45,0.06)] space-y-4">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-2xl bg-[#10B981]/15 text-[#0A3323]">
                <Smartphone size={20} />
              </span>
              <div>
                <h3 className="text-lg font-black text-[#17372F]">Android (Chrome / Edge)</h3>
                <p className="text-xs font-semibold text-[#566D7E]">3-step home screen installation</p>
              </div>
            </div>

            <ol className="space-y-3 pt-2 text-xs font-semibold text-[#566D7E]">
              <li className="flex items-start gap-3 rounded-2xl bg-[#FFF8EC] p-3 border border-[#D8793F]/15">
                <span className="size-6 rounded-full bg-[#17372F] text-white font-black text-[11px] grid place-items-center shrink-0">
                  1
                </span>
                <span>Open <strong>growmeta-egg.pk</strong> in Google Chrome on your Android phone.</span>
              </li>
              <li className="flex items-start gap-3 rounded-2xl bg-[#FFF8EC] p-3 border border-[#D8793F]/15">
                <span className="size-6 rounded-full bg-[#17372F] text-white font-black text-[11px] grid place-items-center shrink-0">
                  2
                </span>
                <span>Tap the top-right menu (<strong>⋮</strong>) and select <strong>&apos;Install app&apos;</strong> or <strong>&apos;Add to Home screen&apos;</strong>.</span>
              </li>
              <li className="flex items-start gap-3 rounded-2xl bg-[#FFF8EC] p-3 border border-[#D8793F]/15">
                <span className="size-6 rounded-full bg-[#17372F] text-white font-black text-[11px] grid place-items-center shrink-0">
                  3
                </span>
                <span>Confirm installation. The GrowMeta Egg icon will appear directly on your app drawer.</span>
              </li>
            </ol>

            <button
              type="button"
              onClick={handleInstallClick}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl py-3 text-xs font-black uppercase tracking-wider text-white bg-[#10B981] hover:bg-[#059669] transition cursor-pointer min-h-[44px]"
            >
              <Download size={14} /> Install on Android Now
            </button>
          </div>

          {/* iOS Guide */}
          <div className="rounded-3xl border border-[#D8793F]/25 bg-[#FFFDF4] p-6 sm:p-8 shadow-[0_10px_24px_rgba(16,34,45,0.06)] space-y-4">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-2xl bg-[#FFD0A5]/40 text-[#8C3A14]">
                <PlusSquare size={20} />
              </span>
              <div>
                <h3 className="text-lg font-black text-[#17372F]">Apple iPhone (Safari)</h3>
                <p className="text-xs font-semibold text-[#566D7E]">Add to iOS Home Screen</p>
              </div>
            </div>

            <ol className="space-y-3 pt-2 text-xs font-semibold text-[#566D7E]">
              <li className="flex items-start gap-3 rounded-2xl bg-[#FFF8EC] p-3 border border-[#D8793F]/15">
                <span className="size-6 rounded-full bg-[#8C3A14] text-white font-black text-[11px] grid place-items-center shrink-0">
                  1
                </span>
                <span>Open <strong>growmeta-egg.pk</strong> using Safari on your iPhone or iPad.</span>
              </li>
              <li className="flex items-start gap-3 rounded-2xl bg-[#FFF8EC] p-3 border border-[#D8793F]/15">
                <span className="size-6 rounded-full bg-[#8C3A14] text-white font-black text-[11px] grid place-items-center shrink-0">
                  2
                </span>
                <span>Tap the <strong>Share</strong> button (box with an arrow pointing up) at the bottom toolbar.</span>
              </li>
              <li className="flex items-start gap-3 rounded-2xl bg-[#FFF8EC] p-3 border border-[#D8793F]/15">
                <span className="size-6 rounded-full bg-[#8C3A14] text-white font-black text-[11px] grid place-items-center shrink-0">
                  3
                </span>
                <span>Scroll down and tap <strong>&apos;Add to Home Screen&apos;</strong>, then tap <strong>&apos;Add&apos;</strong> in the top right.</span>
              </li>
            </ol>

            <Link
              href="/dashboard"
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl py-3 text-xs font-black uppercase tracking-wider text-[#17372F] bg-[#FFF8EC] border border-[#D8793F]/25 hover:bg-[#FFFDF4] transition cursor-pointer min-h-[44px]"
            >
              Open Dashboard in Safari <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* 5. Official App Store Listing Status Disclosure */}
      <section
        aria-label="Store Disclosure"
        className="rounded-3xl border border-[#D8793F]/25 bg-[#FFFDF4] p-6 sm:p-8 shadow-[0_12px_28px_rgba(16,34,45,0.06)] space-y-3"
      >
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-2xl bg-[#0D3850]/10 text-[#09263A]">
            <Info size={20} />
          </span>
          <div>
            <h2 className="text-base sm:text-lg font-black text-[#17372F]">Native App Store Compliance Notice</h2>
            <p className="text-xs font-semibold text-[#566D7E]">
              Google Play Store and Apple App Store native build review status.
            </p>
          </div>
        </div>

        <p className="text-xs sm:text-sm font-semibold text-[#566D7E] leading-relaxed pt-1">
          Our official Android APK and iOS native packages are currently under routine regulatory compliance review for agricultural fintech services. In the interim, our Progressive Web Application (PWA) delivers 100% of native capabilities with zero installation friction, instant updates, and zero device bloat.
        </p>
      </section>
    </div>
  );
}
