  "use client";

import { useEffect, useState } from "react";
import { MessageCircle, Send, Sparkles, X } from "lucide-react";

import { brand } from "@/config/brand";

export function WelcomeWhatsAppModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem("gme_whatsapp_modal_dismissed_v1");
      if (!dismissed) {
        const timer = setTimeout(() => setOpen(true), 600);
        return () => clearTimeout(timer);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  function handleClose() {
    setOpen(false);
    try {
      localStorage.setItem("gme_whatsapp_modal_dismissed_v1", "true");
    } catch {
      // Ignore storage errors
    }
  }

  if (!open) return null;

  const whatsappGroup = "https://chat.whatsapp.com/growmeta-egg";
  const whatsappChannel = "https://whatsapp.com/channel/growmeta-egg";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-opacity duration-300"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        style={{
          boxShadow: "0 24px 70px rgba(0,0,0,0.6), 0 0 0 1px rgba(216, 121, 63, 0.3)",
        }}
        className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-[#09263A] border border-[#D8793F]/40 p-6 sm:p-8 text-[#FFFDF8] animate-in fade-in zoom-in-95 duration-200"
      >
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close welcome modal"
          className="absolute right-4 top-4 grid size-9 place-items-center rounded-full bg-white/10 text-[#DCE8E8] transition hover:bg-white/20 hover:text-white cursor-pointer"
        >
          <X size={18} aria-hidden="true" />
        </button>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#25D366]/40 bg-[#25D366]/15 px-3 py-1 text-xs font-black uppercase tracking-wider text-[#25D366]">
            <Sparkles size={13} aria-hidden="true" /> Official Community
          </span>
        </div>

        <h2 id="welcome-modal-title" className="mt-4 text-2xl sm:text-3xl font-black text-[#FFFDF8]">
          Welcome to <span className="text-[#F59B52]">{brand.name}</span>
        </h2>

        <div
          dir="rtl"
          className="mt-4 rounded-2xl border border-[#D8793F]/25 bg-[#061A2B]/80 p-4 text-base sm:text-lg leading-loose text-[#FFD0A5]"
        >
          ضروری معلومات اور تازہ ترین اپڈیٹس کے لیے ہمارا آفیشل واٹس ایپ گروپ اور چینل جوائن کریں۔
        </div>

        <p className="mt-3 text-xs sm:text-sm leading-relaxed text-[#DCE8E8]/80">
          Get real-time announcements, daily egg yield logs, community support, and verified administrative assistance.
        </p>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            href={whatsappGroup}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClose}
            className="flex items-center justify-center gap-2.5 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-black text-[#042010] shadow-md transition hover:bg-[#20bd5a] active:scale-98 cursor-pointer"
          >
            <MessageCircle size={18} aria-hidden="true" />
            Join WhatsApp Group
          </a>
          <a
            href={whatsappChannel}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClose}
            className="flex items-center justify-center gap-2.5 rounded-xl border border-[#25D366]/50 bg-[#25D366]/15 px-4 py-3 text-sm font-black text-[#25D366] shadow-md transition hover:bg-[#25D366]/25 active:scale-98 cursor-pointer"
          >
            <Send size={18} aria-hidden="true" />
            Follow Channel
          </a>
        </div>

        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={handleClose}
            className="cursor-pointer text-xs font-semibold text-[#DCE8E8]/70 hover:text-white underline"
          >
            Continue to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
