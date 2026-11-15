import React from "react";

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
}

interface EmptyStateProps {
  title: string;
  description: string;
  actions?: EmptyStateAction[];
  compact?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actions,
  compact = false,
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center border border-[var(--border)] bg-[var(--surface)] rounded-[12px] ${
        compact ? "px-4 py-7" : "px-6 py-12"
      }`}
    >
      {/* CSS-only abstract architectural illustration */}
      <div
        aria-hidden="true"
        className={`relative flex items-center justify-center mb-4 ${
          compact ? "w-14 h-14" : "w-20 h-20"
        }`}
      >
        <div className="absolute inset-0 rounded-full border border-[var(--border)]" />
        <div className="absolute inset-2.5 rounded-full border border-dashed border-[var(--border-strong)]" />
        <div className="w-6 h-6 rounded-[6px] border border-[var(--border-strong)] bg-[var(--surface-2)] rotate-12" />
      </div>

      <h3 className="text-[16px] font-semibold text-[var(--text)] leading-snug">
        {title}
      </h3>
      <p className="text-[13px] text-[var(--text-2)] mt-1 max-w-xs leading-relaxed">
        {description}
      </p>

      {actions && actions.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-2.5 mt-4">
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              className={`min-h-[44px] px-4 rounded-[8px] text-[13px] font-medium whitespace-nowrap transition-colors duration-150 ${
                action.variant === "primary"
                  ? "bg-[var(--accent)] text-[var(--accent-text)] hover:opacity-90"
                  : "bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] hover:border-[var(--border-strong)]"
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
