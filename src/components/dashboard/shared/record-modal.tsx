import { ReactNode } from "react";
import { X, LucideIcon, ShieldCheck } from "lucide-react";

interface RecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  badge?: string;
  badgeIcon?: LucideIcon;
  children: ReactNode;
  footer?: ReactNode;
}

export function RecordModal({
  isOpen,
  onClose,
  title,
  badge,
  badgeIcon: BadgeIcon = ShieldCheck,
  children,
  footer,
}: RecordModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="record-modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg rounded-3xl border border-[#D8793F]/30 bg-[#FFFDF4] p-6 sm:p-8 shadow-[0_24px_50px_rgba(16,34,45,0.25)] space-y-6 z-10 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[#D8793F]/15 pb-4">
          <div className="space-y-1">
            {badge && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#10B981]/30 bg-[#10B981]/15 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#0A3323]">
                <BadgeIcon size={12} className="text-[#10B981]" /> {badge}
              </span>
            )}
            <h2 id="record-modal-title" className="text-xl sm:text-2xl font-black text-[#17372F] tracking-tight">
              {title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-2xl border border-[#D8793F]/25 bg-[#FFF8EC] text-[#566D7E] hover:text-[#17372F] hover:bg-[#FFFDF4] transition cursor-pointer shrink-0"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-4">{children}</div>

        {/* Optional Footer */}
        {footer && <div className="border-t border-[#D8793F]/15 pt-4">{footer}</div>}
      </div>
    </div>
  );
}
