import React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  XCircle,
} from "lucide-react";
import type { ToastLevel, ToastMessage } from "../../types";

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

const LEVEL_STYLES: Record<
  ToastLevel,
  { color: string; Icon: React.FC<{ size?: number; strokeWidth?: number }> }
> = {
  INFO: { color: "var(--info)", Icon: Info },
  SUCCESS: { color: "var(--success)", Icon: CheckCircle2 },
  WARNING: { color: "var(--warning)", Icon: AlertTriangle },
  ERROR: { color: "var(--error)", Icon: XCircle },
};

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onDismiss,
}) => {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-16 right-4 left-4 md:left-auto md:w-[360px] z-[60] flex flex-col gap-2 pointer-events-none"
    >
      {toasts.slice(0, 3).map((toast) => {
        const { color, Icon } = LEVEL_STYLES[toast.level];
        return (
          <div
            key={toast.id}
            role="status"
            className="pointer-events-auto relative overflow-hidden rounded-[12px] border border-[var(--border-strong)] bg-[var(--surface-2)] shadow-[var(--shadow-soft)] px-3.5 py-2.5 flex items-center gap-3 tf-sheet-enter"
          >
            <span style={{ color }} className="shrink-0 flex items-center">
              <Icon size={18} strokeWidth={1.5} />
            </span>
            <p className="text-[13px] font-medium text-[var(--text)] flex-1 leading-snug">
              {toast.message}
            </p>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss notification"
              className="min-h-[36px] min-w-[36px] -mr-1.5 flex items-center justify-center rounded-[8px] text-[var(--text-3)] hover:text-[var(--text)] hover:bg-[var(--surface-3)] transition-colors duration-150"
            >
              <X size={15} strokeWidth={1.5} />
            </button>
            {/* Countdown progress bar */}
            <div
              aria-hidden="true"
              className="absolute bottom-0 left-0 right-0 h-[2px] tf-toast-countdown"
              style={{ backgroundColor: color }}
            />
          </div>
        );
      })}
    </div>
  );
};
