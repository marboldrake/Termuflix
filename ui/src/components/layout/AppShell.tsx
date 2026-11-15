import React from "react";
import {
  Bookmark,
  ChevronDown,
  Download as DownloadIcon,
  HelpCircle,
  Home,
  Radio,
  RefreshCw,
  Search,
  Settings,
  WifiOff,
} from "lucide-react";
import type { HomeMode, ProviderInfo, Route } from "../../types";

interface AppShellProps {
  route: Route;
  onNavigate: (route: Route) => void;
  homeMode: HomeMode;
  onHomeModeChange: (mode: HomeMode) => void;
  activeProvider: ProviderInfo;
  onOpenProviders: () => void;
  onOpenDownloads: () => void;
  onOpenHelp: () => void;
  activeDownloadCount: number;
  engineOnline: boolean;
  onRetryEngine: () => void;
  children: React.ReactNode;
}

const NAV_ITEMS: {
  id: Route;
  label: string;
  Icon: React.FC<{ size?: number; strokeWidth?: number }>;
}[] = [
  { id: "home", label: "Home", Icon: Home },
  { id: "search", label: "Search", Icon: Search },
  { id: "live", label: "Live TV", Icon: Radio },
  { id: "library", label: "Library", Icon: Bookmark },
  { id: "settings", label: "Settings", Icon: Settings },
];

const ROUTE_TITLES: Record<Route, string> = {
  home: "Home",
  search: "Search",
  live: "Live TV",
  library: "Library",
  settings: "Settings",
  details: "Details",
  player: "Player",
};

export const AppShell: React.FC<AppShellProps> = ({
  route,
  onNavigate,
  homeMode,
  onHomeModeChange,
  activeProvider,
  onOpenProviders,
  onOpenDownloads,
  onOpenHelp,
  activeDownloadCount,
  engineOnline,
  onRetryEngine,
  children,
}) => {
  const showHomeBar = route === "home";

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col md:flex-row">
      {/* Desktop Sidebar (>= 768px) */}
      <aside className="hidden md:flex md:flex-col md:w-[228px] lg:w-[244px] shrink-0 border-r border-[var(--border)] bg-[var(--bg-elev)] sticky top-0 h-screen">
        <div className="h-14 px-5 flex items-center justify-between border-b border-[var(--border)] shrink-0">
          <button
            type="button"
            onClick={() => onNavigate("home")}
            className="text-[13px] font-semibold tracking-[0.18em] uppercase text-[var(--text)] whitespace-nowrap text-left"
          >
            TERMUFLIX
          </button>
        </div>

        <nav
          aria-label="Primary navigation"
          className="flex-1 p-3 space-y-1 overflow-y-auto"
        >
          {NAV_ITEMS.map(({ id, label, Icon }) => {
            const active = route === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onNavigate(id)}
                aria-current={active ? "page" : undefined}
                className={`w-full min-h-[44px] px-3 rounded-[8px] flex items-center gap-3 text-[14px] font-medium transition-colors duration-150 ${
                  active
                    ? "bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)]"
                    : "text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface)] border border-transparent"
                }`}
              >
                <Icon size={18} strokeWidth={1.5} />
                <span className="whitespace-nowrap">{label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-[var(--border)] space-y-2 shrink-0">
          <button
            type="button"
            onClick={onOpenDownloads}
            className="w-full min-h-[44px] px-3 rounded-[8px] flex items-center justify-between text-[13px] text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface)] transition-colors duration-150"
          >
            <span className="flex items-center gap-2.5">
              <DownloadIcon size={16} strokeWidth={1.5} />
              <span>Downloads</span>
            </span>
            {activeDownloadCount > 0 && (
              <span className="text-[11px] font-mono-tabular text-[var(--text)]">
                {activeDownloadCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={onOpenHelp}
            className="w-full min-h-[44px] px-3 rounded-[8px] flex items-center gap-2.5 text-[13px] text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface)] transition-colors duration-150"
          >
            <HelpCircle size={16} strokeWidth={1.5} />
            <span>Gestures &amp; Shortcuts</span>
          </button>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Contextual Sticky Top Header */}
        <header className="sticky top-0 z-30 h-14 pt-safe bg-[var(--bg)]/95 backdrop-blur-md border-b border-[var(--border)] px-3 sm:px-4 md:px-6 flex items-center justify-between gap-1.5 sm:gap-2">
          {showHomeBar ? (
            <>
              {/* Wordmark on mobile + Segmented Control */}
              <div className="flex items-center gap-2 min-w-0">
                <span className="md:hidden text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--text)] whitespace-nowrap shrink-0">
                  TERMUFLIX
                </span>

                {/* Segmented control: Streaming | Live TV */}
                <div
                  role="tablist"
                  aria-label="Content mode"
                  className="inline-flex items-center p-0.5 rounded-[8px] bg-[var(--surface)] border border-[var(--border)] shrink-0"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={homeMode === "streaming"}
                    onClick={() => onHomeModeChange("streaming")}
                    className={`min-h-[30px] px-2 sm:px-2.5 rounded-[6px] text-[11px] sm:text-[12px] font-medium whitespace-nowrap transition-colors duration-150 ${
                      homeMode === "streaming"
                        ? "bg-[var(--accent)] text-[var(--accent-text)]"
                        : "text-[var(--text-2)] hover:text-[var(--text)]"
                    }`}
                  >
                    Streaming
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={homeMode === "live"}
                    onClick={() => onHomeModeChange("live")}
                    className={`min-h-[30px] px-2 sm:px-2.5 rounded-[6px] text-[11px] sm:text-[12px] font-medium whitespace-nowrap transition-colors duration-150 ${
                      homeMode === "live"
                        ? "bg-[var(--accent)] text-[var(--accent-text)]"
                        : "text-[var(--text-2)] hover:text-[var(--text)]"
                    }`}
                  >
                    Live TV
                  </button>
                </div>
              </div>

              {/* Active Provider Chip + Settings */}
              <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                <button
                  type="button"
                  onClick={onOpenProviders}
                  aria-label={`Active provider ${activeProvider.name}, change provider`}
                  className="min-h-[34px] px-2 sm:px-2.5 rounded-full bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border-strong)] text-[11px] sm:text-[12px] font-medium text-[var(--text)] flex items-center gap-1 transition-colors duration-150 max-w-[90px] sm:max-w-[156px]"
                >
                  <span className="truncate">{activeProvider.name}</span>
                  <ChevronDown
                    size={13}
                    strokeWidth={1.5}
                    className="text-[var(--text-3)] shrink-0"
                  />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate("settings")}
                  aria-label="Open Settings"
                  className="min-h-[44px] min-w-[40px] sm:min-w-[44px] -mr-1.5 flex items-center justify-center rounded-[8px] text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface)] transition-colors duration-150"
                >
                  <Settings size={17} strokeWidth={1.5} />
                </button>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-[16px] font-semibold text-[var(--text)] truncate">
                {ROUTE_TITLES[route]}
              </h1>
              <div className="flex items-center gap-1.5 shrink-0">
                {route !== "settings" && (
                  <button
                    type="button"
                    onClick={onOpenProviders}
                    aria-label={`Active provider ${activeProvider.name}, change provider`}
                    className="min-h-[36px] px-2.5 rounded-full bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border-strong)] text-[12px] font-medium text-[var(--text)] flex items-center gap-1 transition-colors duration-150"
                  >
                    <span className="truncate max-w-[116px]">
                      {activeProvider.name}
                    </span>
                    <ChevronDown
                      size={14}
                      strokeWidth={1.5}
                      className="text-[var(--text-3)] shrink-0"
                    />
                  </button>
                )}
                <button
                  type="button"
                  onClick={onOpenDownloads}
                  aria-label="Open download queue"
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-[8px] text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface)] transition-colors duration-150 relative"
                >
                  <DownloadIcon size={18} strokeWidth={1.5} />
                  {activeDownloadCount > 0 && (
                    <span className="absolute top-2 right-2 text-[10px] font-mono-tabular leading-none text-[var(--text)] bg-[var(--surface-3)] border border-[var(--border-strong)] rounded-full px-1 py-0.5">
                      {activeDownloadCount}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={onOpenHelp}
                  aria-label="Gestures and keyboard shortcuts"
                  className="min-h-[44px] min-w-[44px] -mr-2 flex items-center justify-center rounded-[8px] text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface)] transition-colors duration-150"
                >
                  <HelpCircle size={18} strokeWidth={1.5} />
                </button>
              </div>
            </>
          )}
        </header>

        {/* Offline Engine Banner */}
        {!engineOnline && (
          <div
            role="alert"
            className="bg-[var(--surface)] border-b border-[var(--border)] px-4 md:px-6 py-2.5 flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <WifiOff
                size={16}
                strokeWidth={1.5}
                className="text-[var(--error)] shrink-0"
              />
              <p className="text-[13px] text-[var(--text)] truncate">
                Engine not reachable{" "}
                <span className="text-[var(--text-3)] font-mono-tabular text-[12px]">
                  127.0.0.1:8080
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={onRetryEngine}
              className="min-h-[36px] px-3 rounded-[8px] bg-[var(--surface-2)] border border-[var(--border-strong)] text-[12px] font-medium text-[var(--text)] hover:bg-[var(--surface-3)] flex items-center gap-1.5 shrink-0 transition-colors duration-150"
            >
              <RefreshCw size={13} strokeWidth={1.5} />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Scrollable Content */}
        <main className="flex-1 pb-24 md:pb-10">{children}</main>
      </div>

      {/* Mobile Bottom Navigation (< 768px) */}
      <nav
        aria-label="Mobile navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[var(--bg-elev)]/95 backdrop-blur-md border-t border-[var(--border)] pb-safe"
      >
        <div className="grid grid-cols-5 h-16">
          {NAV_ITEMS.map(({ id, label, Icon }) => {
            const active = route === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onNavigate(id)}
                aria-current={active ? "page" : undefined}
                className={`min-h-[44px] flex flex-col items-center justify-center gap-1 transition-colors duration-150 ${
                  active
                    ? "text-[var(--text)]"
                    : "text-[var(--text-3)] hover:text-[var(--text-2)]"
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2 : 1.5} />
                <span className="text-[11px] font-medium leading-none tracking-tight whitespace-nowrap">
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
