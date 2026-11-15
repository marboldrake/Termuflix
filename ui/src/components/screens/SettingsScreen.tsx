import React from "react";
import { ChevronRight, ExternalLink, Folder } from "lucide-react";
import type {
  AppSettings,
  ProviderId,
  ProviderInfo,
  ThemePreset,
} from "../../types";

interface SettingsScreenProps {
  settings: AppSettings;
  providers: ProviderInfo[];
  engineOnline: boolean;
  onUpdateSettings: (patch: Partial<AppSettings>) => void;
  onToggleProvider: (id: ProviderId) => void;
  onOpenPlayerSelector: () => void;
  onChangeDownloadFolder: () => void;
  onOpenAddons: () => void;
  onOpenUpdates: () => void;
  onRecheckBdix: () => void;
  onToggleEngineOnline: () => void;
  onClearDiskCache: () => void;
  onClearWatchHistory: () => void;
  onOpenRepo: () => void;
}

const THEMES: { id: ThemePreset; label: string; swatch: string }[] = [
  { id: "graphite", label: "Graphite", swatch: "#121418" },
  { id: "onyx", label: "Onyx", swatch: "#07080A" },
  { id: "slate", label: "Slate", swatch: "#161A22" },
];

const ToggleSwitch: React.FC<{
  checked: boolean;
  onChange: () => void;
  label: string;
}> = ({ checked, onChange, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={onChange}
    className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors duration-150 ${
      checked
        ? "bg-[var(--accent)] border-[var(--accent)]"
        : "bg-[var(--surface-2)] border-[var(--border-strong)]"
    }`}
  >
    <span
      className={`inline-block h-5 w-5 transform rounded-full transition-transform duration-150 ${
        checked
          ? "translate-x-6 bg-[var(--accent-text)]"
          : "translate-x-1 bg-[var(--text-2)]"
      }`}
    />
  </button>
);

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  providers,
  engineOnline,
  onUpdateSettings,
  onToggleProvider,
  onOpenPlayerSelector,
  onChangeDownloadFolder,
  onOpenAddons,
  onOpenUpdates,
  onRecheckBdix,
  onToggleEngineOnline,
  onClearDiskCache,
  onClearWatchHistory,
  onOpenRepo,
}) => {
  return (
    <div className="px-4 md:px-6 py-4 space-y-6 max-w-3xl mx-auto">
      {/* General */}
      <section aria-labelledby="settings-general" className="space-y-2.5">
        <h2
          id="settings-general"
          className="text-[12px] font-medium text-[var(--text-3)] uppercase tracking-wider px-1"
        >
          General
        </h2>

        <div className="rounded-[12px] border border-[var(--border)] bg-[var(--surface)] divide-y divide-[var(--border)]">
          <div className="p-4 flex items-center justify-between gap-4">
            <div>
              <div className="text-[14px] font-medium text-[var(--text)]">
                Automatic Updates
              </div>
              <div className="text-[12px] text-[var(--text-2)] mt-0.5">
                Check for Rust engine and UI releases on launch
              </div>
            </div>
            <ToggleSwitch
              checked={settings.automaticUpdates}
              onChange={() =>
                onUpdateSettings({ automaticUpdates: !settings.automaticUpdates })
              }
              label="Toggle automatic updates"
            />
          </div>

          <button
            type="button"
            onClick={onOpenPlayerSelector}
            className="w-full min-h-[60px] p-4 flex items-center justify-between gap-4 text-left hover:bg-[var(--surface-2)] transition-colors duration-150"
          >
            <div>
              <div className="text-[14px] font-medium text-[var(--text)]">
                Default Media Player
              </div>
              <div className="text-[12px] text-[var(--text-2)] mt-0.5">
                {settings.defaultPlayer}
              </div>
            </div>
            <ChevronRight
              size={18}
              strokeWidth={1.5}
              className="text-[var(--text-3)] shrink-0"
            />
          </button>

          <div className="p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[14px] font-medium text-[var(--text)]">
                Download Folder
              </div>
              <div className="text-[12px] font-mono-tabular text-[var(--text-2)] mt-0.5 flex items-center gap-1.5 truncate">
                <Folder size={13} strokeWidth={1.5} className="shrink-0" />
                <span className="truncate">{settings.downloadFolder}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onChangeDownloadFolder}
              className="min-h-[38px] px-3.5 rounded-[8px] bg-[var(--surface-2)] border border-[var(--border)] hover:border-[var(--border-strong)] text-[12px] font-medium text-[var(--text)] shrink-0"
            >
              Change
            </button>
          </div>
        </div>
      </section>

      {/* Content Modes */}
      <section aria-labelledby="settings-content" className="space-y-2.5">
        <h2
          id="settings-content"
          className="text-[12px] font-medium text-[var(--text-3)] uppercase tracking-wider px-1"
        >
          Content Modes
        </h2>

        <div className="rounded-[12px] border border-[var(--border)] bg-[var(--surface)] divide-y divide-[var(--border)]">
          <div className="p-4 flex items-center justify-between gap-4">
            <div>
              <div className="text-[14px] font-medium text-[var(--text)]">
                Streaming Mode
              </div>
              <div className="text-[12px] text-[var(--text-2)] mt-0.5">
                Enable movies, series, and anime discovery scrapers
              </div>
            </div>
            <ToggleSwitch
              checked={settings.streamingMode}
              onChange={() =>
                onUpdateSettings({ streamingMode: !settings.streamingMode })
              }
              label="Toggle streaming mode"
            />
          </div>

          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-[var(--text-2)]">
                Streaming Sources
              </span>
              <button
                type="button"
                onClick={onOpenAddons}
                className="text-[12px] font-medium text-[var(--text)] hover:underline"
              >
                Manage addons
              </button>
            </div>

            <div className="space-y-2.5">
              {providers.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-3 py-1"
                >
                  <div className="min-w-0">
                    <div className="text-[14px] text-[var(--text)]">
                      {p.name}
                    </div>
                    <div className="text-[11px] text-[var(--text-3)] truncate">
                      {p.status}
                    </div>
                  </div>
                  <ToggleSwitch
                    checked={settings.enabledProviders[p.id]}
                    onChange={() => onToggleProvider(p.id)}
                    label={`Toggle ${p.name} source`}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 flex items-center justify-between gap-4">
            <div>
              <div className="text-[14px] font-medium text-[var(--text)]">
                Live TV Mode
              </div>
              <div className="text-[12px] text-[var(--text-2)] mt-0.5">
                Show IPTV channel guide and M3U playlists
              </div>
            </div>
            <ToggleSwitch
              checked={settings.liveTvMode}
              onChange={() =>
                onUpdateSettings({ liveTvMode: !settings.liveTvMode })
              }
              label="Toggle Live TV mode"
            />
          </div>
        </div>
      </section>

      {/* Appearance */}
      <section aria-labelledby="settings-appearance" className="space-y-2.5">
        <h2
          id="settings-appearance"
          className="text-[12px] font-medium text-[var(--text-3)] uppercase tracking-wider px-1"
        >
          Appearance
        </h2>

        <div className="p-4 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] space-y-3">
          <div className="text-[14px] font-medium text-[var(--text)]">
            Neutral Dark Theme
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {THEMES.map((t) => {
              const selected = settings.theme === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onUpdateSettings({ theme: t.id })}
                  className={`min-h-[56px] p-3 rounded-[10px] border flex flex-col items-start gap-2 transition-colors duration-150 ${
                    selected
                      ? "bg-[var(--surface-2)] border-[var(--accent)]"
                      : "bg-[var(--bg-elev)] border-[var(--border)] hover:border-[var(--border-strong)]"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className="w-5 h-5 rounded-full border border-[var(--border-strong)]"
                    style={{ backgroundColor: t.swatch }}
                  />
                  <span className="text-[13px] font-medium text-[var(--text)]">
                    {t.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Maintenance */}
      <section aria-labelledby="settings-maintenance" className="space-y-2.5">
        <h2
          id="settings-maintenance"
          className="text-[12px] font-medium text-[var(--text-3)] uppercase tracking-wider px-1"
        >
          Maintenance
        </h2>

        <div className="rounded-[12px] border border-[var(--border)] bg-[var(--surface)] divide-y divide-[var(--border)]">
          <button
            type="button"
            onClick={onOpenUpdates}
            className="w-full min-h-[52px] px-4 flex items-center justify-between text-left hover:bg-[var(--surface-2)] transition-colors duration-150"
          >
            <span className="text-[14px] text-[var(--text)]">
              Check for Updates
            </span>
            <ChevronRight
              size={17}
              strokeWidth={1.5}
              className="text-[var(--text-3)]"
            />
          </button>

          <button
            type="button"
            onClick={onRecheckBdix}
            className="w-full min-h-[52px] px-4 flex items-center justify-between text-left hover:bg-[var(--surface-2)] transition-colors duration-150"
          >
            <span className="text-[14px] text-[var(--text)]">
              Re-check BDIX Network
            </span>
            <span className="text-[12px] text-[var(--text-3)]">Run probe</span>
          </button>

          <div className="px-4 py-3 flex items-center justify-between gap-4">
            <div>
              <div className="text-[14px] text-[var(--text)]">
                Local Engine Connection
              </div>
              <div className="text-[12px] font-mono-tabular text-[var(--text-3)]">
                127.0.0.1:8080
              </div>
            </div>
            <ToggleSwitch
              checked={engineOnline}
              onChange={onToggleEngineOnline}
              label="Toggle local engine connection"
            />
          </div>

          <button
            type="button"
            onClick={onClearDiskCache}
            className="w-full min-h-[52px] px-4 flex items-center justify-between text-left hover:bg-[var(--surface-2)] transition-colors duration-150"
          >
            <span className="text-[14px] text-[var(--error)] font-medium">
              Clear Disk Cache
            </span>
            <span className="text-[12px] font-mono-tabular text-[var(--text-3)]">
              412 MB
            </span>
          </button>

          <button
            type="button"
            onClick={onClearWatchHistory}
            className="w-full min-h-[52px] px-4 flex items-center justify-between text-left hover:bg-[var(--surface-2)] transition-colors duration-150"
          >
            <span className="text-[14px] text-[var(--error)] font-medium">
              Clear Watch History
            </span>
            <ChevronRight
              size={17}
              strokeWidth={1.5}
              className="text-[var(--text-3)]"
            />
          </button>

          <button
            type="button"
            onClick={onOpenRepo}
            className="w-full min-h-[52px] px-4 flex items-center justify-between text-left hover:bg-[var(--surface-2)] transition-colors duration-150"
          >
            <span className="text-[14px] text-[var(--text)]">
              GitHub Repository
            </span>
            <ExternalLink
              size={16}
              strokeWidth={1.5}
              className="text-[var(--text-3)]"
            />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="pt-2 pb-6 text-center space-y-1">
        <p className="text-[12px] font-mono-tabular text-[var(--text-3)]">
          Termuflix v2.4.0 · Local Rust Engine UI
        </p>
        <p className="text-[12px] text-[var(--text-3)]">
          <a
            href="#repository"
            onClick={(e) => {
              e.preventDefault();
              onOpenRepo();
            }}
            className="hover:text-[var(--text-2)] underline underline-offset-2"
          >
            github.com/termuflix/termuflix
          </a>
        </p>
      </footer>
    </div>
  );
};
