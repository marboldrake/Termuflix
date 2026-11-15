import React, { useEffect } from "react";
import { X } from "lucide-react";

interface ModalSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidthClass?: string;
}

export const ModalSheet: React.FC<ModalSheetProps> = ({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidthClass = "md:max-w-lg",
}) => {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 tf-fade-enter"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-[2px] cursor-default"
      />

      {/* Sheet / Dialog */}
      <div
        className={`relative z-10 w-full ${maxWidthClass} bg-[var(--surface)] border border-[var(--border)] rounded-t-[16px] md:rounded-[16px] shadow-[var(--shadow-soft)] flex flex-col max-h-[88vh] tf-sheet-enter pb-safe`}
      >
        {/* Mobile grab handle */}
        <div className="md:hidden flex justify-center pt-2.5 pb-1 shrink-0">
          <div className="w-9 h-1 rounded-full bg-[var(--border-strong)]" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-4 pt-3 pb-3 md:pt-4 border-b border-[var(--border)] shrink-0">
          <div className="min-w-0">
            <h2 className="text-[16px] font-semibold text-[var(--text)] leading-snug truncate">
              {title}
            </h2>
            {subtitle && (
              <p className="text-[12px] text-[var(--text-2)] mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={`Close ${title}`}
            className="min-h-[44px] min-w-[44px] -mr-2 -mt-1.5 flex items-center justify-center rounded-[8px] text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors duration-150 shrink-0"
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-4 py-4 flex-1">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-4 py-3 border-t border-[var(--border)] bg-[var(--bg-elev)] rounded-b-[16px] shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
