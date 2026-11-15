import React, { useState } from "react";
import { Pause, Play, Star, Trash2 } from "lucide-react";
import { PosterArt } from "../ui/PosterArt";
import { EmptyState } from "../ui/EmptyState";
import { formatEpisodeCode } from "../../lib/catalogLogic";
import type { CatalogItem, Download } from "../../types";

export type LibraryTab = "continue" | "history" | "favorites" | "downloads";

interface LibraryScreenProps {
  initialTab?: LibraryTab;
  continueItems: CatalogItem[];
  historyItems: CatalogItem[];
  favoriteItems: CatalogItem[];
  downloads: Download[];
  onSelectMedia: (id: string) => void;
  onRemoveContinue: (id: string) => void;
  onRemoveHistory: (id: string) => void;
  onToggleDownloadPause: (id: string) => void;
  onCancelDownload: (id: string) => void;
  onExploreCatalog: () => void;
}

const TABS: { id: LibraryTab; label: string }[] = [
  { id: "continue", label: "Continue" },
  { id: "history", label: "History" },
  { id: "favorites", label: "Favorites" },
  { id: "downloads", label: "Downloads" },
];

export const LibraryScreen: React.FC<LibraryScreenProps> = ({
  initialTab = "continue",
  continueItems,
  historyItems,
  favoriteItems,
  downloads,
  onSelectMedia,
  onRemoveContinue,
  onRemoveHistory,
  onToggleDownloadPause,
  onCancelDownload,
  onExploreCatalog,
}) => {
  const [tab, setTab] = useState<LibraryTab>(initialTab);

  const activeDownloads = downloads.filter(
    (d) => d.status === "downloading" || d.status === "paused"
  );
  const queuedDownloads = downloads.filter((d) => d.status === "queued");
  const completedDownloads = downloads.filter((d) => d.status === "completed");

  const renderProgressRows = (
    items: CatalogItem[],
    onRemove: (id: string) => void,
    emptyTitle: string,
    emptyDesc: string
  ) => {
    if (items.length === 0) {
      return (
        <EmptyState
          title={emptyTitle}
          description={emptyDesc}
          actions={[
            {
              label: "Browse catalog",
              onClick: onExploreCatalog,
              variant: "primary",
            },
          ]}
        />
      );
    }

    return (
      <div className="space-y-2.5">
        {items.map((item) => {
          const epCode = formatEpisodeCode(
            item.progress?.season,
            item.progress?.episode
          );
          return (
            <div
              key={item.id}
              className="p-3 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] flex items-center gap-3"
            >
              <button
                type="button"
                onClick={() => onSelectMedia(item.id)}
                className="w-24 shrink-0 rounded-[8px] overflow-hidden border border-[var(--border)]"
              >
                <PosterArt
                  title={item.title}
                  seed={item.poster}
                  aspect="16/9"
                  hideTitle
                />
              </button>

              <button
                type="button"
                onClick={() => onSelectMedia(item.id)}
                className="flex-1 min-w-0 text-left space-y-1.5"
              >
                <div className="text-[14px] font-semibold text-[var(--text)] truncate">
                  {item.title}
                </div>
                <div className="text-[12px] text-[var(--text-2)] truncate">
                  {epCode ? `${epCode} · ` : ""}
                  {item.progress?.watchedAgo
                    ? `Watched ${item.progress.watchedAgo}`
                    : `${item.year}`}
                </div>
                <div className="h-1 w-full rounded-full bg-[var(--surface-3)] overflow-hidden">
                  <div
                    className="h-full bg-[var(--accent)]"
                    style={{ width: `${item.progress?.percent ?? 0}%` }}
                  />
                </div>
              </button>

              <button
                type="button"
                onClick={() => onRemove(item.id)}
                aria-label={`Remove ${item.title}`}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-[8px] text-[var(--text-3)] hover:text-[var(--error)] hover:bg-[var(--surface-2)] shrink-0"
              >
                <Trash2 size={16} strokeWidth={1.5} />
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDownloadCard = (dl: Download) => (
    <div
      key={dl.id}
      className="p-3.5 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] space-y-2.5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[14px] font-semibold text-[var(--text)] truncate">
            {dl.title}
          </div>
          {dl.subtitle && (
            <div className="text-[12px] text-[var(--text-2)] mt-0.5 truncate">
              {dl.subtitle}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {(dl.status === "downloading" || dl.status === "paused") && (
            <button
              type="button"
              onClick={() => onToggleDownloadPause(dl.id)}
              aria-label={
                dl.status === "paused"
                  ? `Resume ${dl.title}`
                  : `Pause ${dl.title}`
              }
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-[8px] bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)]"
            >
              {dl.status === "paused" ? (
                <Play size={15} strokeWidth={1.5} />
              ) : (
                <Pause size={15} strokeWidth={1.5} />
              )}
            </button>
          )}
          <button
            type="button"
            onClick={() => onCancelDownload(dl.id)}
            aria-label={`Remove ${dl.title} download`}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-[8px] bg-[var(--surface-2)] border border-[var(--border)] text-[var(--error)]"
          >
            <Trash2 size={15} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <div className="h-1.5 w-full rounded-full bg-[var(--surface-3)] overflow-hidden">
        <div
          className="h-full bg-[var(--accent)] transition-all duration-200"
          style={{ width: `${dl.progress}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-[11px] font-mono-tabular text-[var(--text-2)]">
        <span>
          {dl.progress}% · {dl.size}
        </span>
        <span>
          {dl.speed} · {dl.eta}
        </span>
      </div>
    </div>
  );

  return (
    <div className="px-4 md:px-6 py-4 space-y-5 max-w-[1160px] mx-auto">
      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Library sections"
        className="border-b border-[var(--border)] flex gap-5 overflow-x-auto no-scrollbar"
      >
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              className={`min-h-[44px] pb-2.5 text-[14px] font-medium whitespace-nowrap border-b-2 transition-colors duration-150 ${
                active
                  ? "border-[var(--accent)] text-[var(--text)]"
                  : "border-transparent text-[var(--text-3)] hover:text-[var(--text-2)]"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "continue" &&
        renderProgressRows(
          continueItems,
          onRemoveContinue,
          "No titles in progress",
          "Start watching a movie or series to resume it later from here."
        )}

      {tab === "history" &&
        renderProgressRows(
          historyItems,
          onRemoveHistory,
          "Watch history is empty",
          "Completed and recently viewed titles will appear here."
        )}

      {tab === "favorites" &&
        (favoriteItems.length === 0 ? (
          <EmptyState
            title="No favorites saved"
            description="Bookmark titles from any details page to keep them within reach."
            actions={[
              {
                label: "Discover titles",
                onClick: onExploreCatalog,
                variant: "primary",
              },
            ]}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {favoriteItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectMedia(item.id)}
                className="text-left group"
              >
                <div className="rounded-[12px] overflow-hidden border border-[var(--border)] group-hover:border-[var(--border-strong)] transition-colors duration-150">
                  <PosterArt
                    title={item.title}
                    seed={item.poster}
                    subtitle={item.type === "series" ? "Series" : "Movie"}
                  />
                </div>
                <div className="mt-1.5 px-0.5 flex items-center justify-between text-[11px] text-[var(--text-3)] tabular-nums">
                  <span>{item.year}</span>
                  <span className="inline-flex items-center gap-0.5 text-[var(--text-2)]">
                    <Star size={10} strokeWidth={1.5} />
                    {item.rating.toFixed(1)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        ))}

      {tab === "downloads" &&
        (downloads.length === 0 ? (
          <EmptyState
            title="No offline downloads"
            description="Download movies or episodes from any details page for offline playback."
            actions={[
              {
                label: "Browse catalog",
                onClick: onExploreCatalog,
                variant: "primary",
              },
            ]}
          />
        ) : (
          <div className="space-y-5">
            {activeDownloads.length > 0 && (
              <div className="space-y-2.5">
                <h2 className="text-[12px] font-medium text-[var(--text-3)] uppercase tracking-wider">
                  Active ({activeDownloads.length})
                </h2>
                <div className="space-y-2.5">
                  {activeDownloads.map(renderDownloadCard)}
                </div>
              </div>
            )}

            {queuedDownloads.length > 0 && (
              <div className="space-y-2.5">
                <h2 className="text-[12px] font-medium text-[var(--text-3)] uppercase tracking-wider">
                  Queued ({queuedDownloads.length})
                </h2>
                <div className="space-y-2.5">
                  {queuedDownloads.map(renderDownloadCard)}
                </div>
              </div>
            )}

            {completedDownloads.length > 0 && (
              <div className="space-y-2.5">
                <h2 className="text-[12px] font-medium text-[var(--text-3)] uppercase tracking-wider">
                  Completed ({completedDownloads.length})
                </h2>
                <div className="space-y-2.5">
                  {completedDownloads.map(renderDownloadCard)}
                </div>
              </div>
            )}
          </div>
        ))}
    </div>
  );
};
