import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";
import { LucideIcon, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

interface HeroAction {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "outline";
  icon?: LucideIcon;
}

interface PremiumHeroProps {
  badge: string;
  badgeIcon?: LucideIcon;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  chips?: Array<{ label: string; icon?: LucideIcon }>;
  primaryAction?: HeroAction;
  secondaryAction?: HeroAction;
  children?: ReactNode;
}

export function PremiumHero({
  badge,
  badgeIcon: BadgeIcon = Sparkles,
  title,
  description,
  imageSrc,
  imageAlt,
  chips,
  primaryAction,
  secondaryAction,
  children,
}: PremiumHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-[#D8793F]/25 bg-gradient-to-br from-[#17372F] via-[#0D3850] to-[#0A221C] p-6 sm:p-8 md:p-10 shadow-[0_16px_36px_rgba(16,34,45,0.18)] text-white">
      {/* Background Ambient Glows */}
      <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-[#10B981]/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 size-72 rounded-full bg-[#D8793F]/15 blur-3xl" />

      <div className="relative z-10 grid gap-8 lg:grid-cols-12 lg:items-center">
        {/* Left Column: Content */}
        <div className="space-y-4 lg:col-span-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#10B981]/30 bg-[#10B981]/15 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-[#A7F3D0]">
            <BadgeIcon size={14} className="text-[#10B981]" /> {badge}
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight text-[#FFFDF4]">
            {title}
          </h1>

          <p className="text-xs sm:text-sm md:text-base font-semibold text-[#E6F4EA]/80 max-w-2xl leading-relaxed">
            {description}
          </p>

          {/* Chips / Indicators */}
          {chips && chips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {chips.map((chip, idx) => {
                const Icon = chip.icon || ShieldCheck;
                return (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold text-[#E6F4EA]"
                  >
                    <Icon size={13} className="text-[#10B981]" /> {chip.label}
                  </span>
                );
              })}
            </div>
          )}

          {/* Action Buttons */}
          {(primaryAction || secondaryAction) && (
            <div className="flex flex-wrap items-center gap-3 pt-3">
              {primaryAction &&
                (primaryAction.href ? (
                  <Link
                    href={primaryAction.href}
                    style={{
                      background: "linear-gradient(180deg, #F59B52 0%, #D8793F 100%)",
                      boxShadow: "0 2px 0 #8C3A14, 0 8px 20px rgba(216, 121, 63, 0.35)",
                    }}
                    className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-xs font-black uppercase tracking-wider text-white hover:brightness-105 active:translate-y-0.5 transition cursor-pointer min-h-[44px]"
                  >
                    {primaryAction.icon && <primaryAction.icon size={15} />}
                    {primaryAction.label}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={primaryAction.onClick}
                    style={{
                      background: "linear-gradient(180deg, #F59B52 0%, #D8793F 100%)",
                      boxShadow: "0 2px 0 #8C3A14, 0 8px 20px rgba(216, 121, 63, 0.35)",
                    }}
                    className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-xs font-black uppercase tracking-wider text-white hover:brightness-105 active:translate-y-0.5 transition cursor-pointer min-h-[44px]"
                  >
                    {primaryAction.icon && <primaryAction.icon size={15} />}
                    {primaryAction.label}
                  </button>
                ))}

              {secondaryAction &&
                (secondaryAction.href ? (
                  <Link
                    href={secondaryAction.href}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-xs font-black uppercase tracking-wider text-white hover:bg-white/15 transition cursor-pointer min-h-[44px]"
                  >
                    {secondaryAction.icon && <secondaryAction.icon size={15} />}
                    {secondaryAction.label}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={secondaryAction.onClick}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-xs font-black uppercase tracking-wider text-white hover:bg-white/15 transition cursor-pointer min-h-[44px]"
                  >
                    {secondaryAction.icon && <secondaryAction.icon size={15} />}
                    {secondaryAction.label}
                  </button>
                ))}
            </div>
          )}

          {children}
        </div>

        {/* Right Column: 3D Illustration */}
        <div className="flex justify-center lg:col-span-4">
          <div className="relative size-36 sm:size-48 md:size-56 rounded-3xl border border-white/15 bg-gradient-to-b from-white/10 to-transparent p-4 grid place-items-center shadow-[0_20px_40px_rgba(0,0,0,0.3)] hover:scale-105 transition-transform duration-500">
            <Image
              src={imageSrc}
              alt={imageAlt}
              width={200}
              height={200}
              priority
              className="w-full h-full object-contain drop-shadow-[0_16px_24px_rgba(0,0,0,0.4)]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
