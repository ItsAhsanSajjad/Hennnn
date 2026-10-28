"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, ArrowRight } from "lucide-react";

const navLinks = [
  { label: "Home", href: "#home" },
  { label: "Why Us", href: "#why-us" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Plans", href: "#plans" },
  { label: "Sell Eggs", href: "#sell-eggs" },
  { label: "Farm Life", href: "#farm-life" },
  { label: "Transparency", href: "#transparency" },
  { label: "FAQ", href: "#faq" },
  { label: "About", href: "/about" },
];

export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);

      // Section scroll spy
      const sections = ["home", "why-us", "how-it-works", "plans", "sell-eggs", "farm-life", "transparency", "faq"];
      for (const s of sections) {
        const el = document.getElementById(s);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 140 && rect.bottom >= 140) {
            setActiveSection(s);
            break;
          }
        }
      }
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-[#10B981]/20 bg-[#091D28]/92 shadow-[0_12px_32px_rgba(0,0,0,0.5)] backdrop-blur-md py-2"
          : "border-b border-transparent bg-transparent py-3 sm:py-4"
      }`}
    >
      <div className="w-[min(calc(100%-24px),1240px)] sm:w-[min(calc(100%-40px),1240px)] mx-auto flex items-center justify-between gap-4">
        {/* Brand Logo Lockup */}
        <Link href="/" className="flex items-center gap-3 transition hover:opacity-95" aria-label="GrowMeta Egg Home">
          <Image
            src="/brand/growmeta-egg-lockup.png"
            alt="GrowMeta Egg"
            width={160}
            height={50}
            priority
            className="h-10 sm:h-11 w-auto object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]"
          />
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary Navigation">
          {navLinks.map((item) => {
            const isCurrent = item.href.startsWith("#") && activeSection === item.href.slice(1);
            return (
              <a
                key={item.href}
                href={item.href}
                className={`relative py-1 text-xs xl:text-sm font-bold transition-colors ${
                  isCurrent
                    ? "text-[#10B981] font-black"
                    : "text-[#A9C2BC] hover:text-[#10B981]"
                }`}
              >
                {item.label}
                {isCurrent && (
                  <span className="absolute inset-x-0 -bottom-1 h-0.5 rounded-full bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                )}
              </a>
            );
          })}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <Link
            href="/sign-in"
            className="hidden sm:inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/15 hover:border-white/25 transition active:scale-[0.98] min-h-[42px]"
          >
            Login
          </Link>

          <Link
            href="/sign-up"
            style={{
              background: "linear-gradient(180deg, #F59B52 0%, #D8793F 100%)",
              boxShadow: "0 2px 0 #8C3A14, 0 6px 16px rgba(216, 121, 63, 0.3)",
            }}
            className="inline-flex items-center justify-center gap-1.5 rounded-2xl px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white hover:brightness-105 active:translate-y-0.5 transition min-h-[42px]"
          >
            Create account <ArrowRight size={14} />
          </Link>

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-navigation-menu"
            aria-label={open ? "Close navigation menu" : "Open navigation menu"}
            className="grid size-10 place-items-center rounded-2xl border border-[#10B981]/30 bg-white/10 text-white hover:bg-white/15 transition lg:hidden"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Accessible Mobile Menu Dropdown */}
      {open && (
        <div
          id="mobile-navigation-menu"
          className="border-t border-[#10B981]/20 bg-[#091D28]/98 backdrop-blur-xl shadow-2xl lg:hidden animate-in slide-in-from-top-2 duration-200"
        >
          <nav className="w-[min(calc(100%-24px),1240px)] mx-auto grid gap-1 py-4" aria-label="Mobile Navigation">
            {navLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center rounded-xl px-3.5 py-2.5 text-sm font-bold text-[#A9C2BC] hover:bg-white/10 hover:text-[#10B981] transition"
              >
                {item.label}
              </a>
            ))}
            <div className="my-2 h-px bg-white/10" />
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Link
                href="/sign-in"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center rounded-xl border border-white/15 bg-white/10 py-2.5 text-xs font-bold text-white hover:bg-white/15 min-h-[44px]"
              >
                Login
              </Link>
              <Link
                href="/sign-up"
                onClick={() => setOpen(false)}
                style={{
                  background: "linear-gradient(180deg, #F59B52 0%, #D8793F 100%)",
                }}
                className="flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-black text-white hover:brightness-105 min-h-[44px]"
              >
                Create account <ArrowRight size={13} />
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

