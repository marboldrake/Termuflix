import React, { useRef, useState } from "react";
import {
  ChevronRight,
  MoreVertical,
  Play,
  Radio,
  RefreshCw,
  Search,
  Star,
} from "lucide-react";
import { PosterArt } from "../ui/PosterArt";
import { EmptyState } from "../ui/EmptyState";
import { ContinueRowSkeleton, PosterRowSkeleton } from "../ui/Skeletons";
import {
  filterCatalogItems,
  formatEpisodeCode,
  formatRemainingTime,
} from "../../lib/catalogLogic";
import type {
  CatalogItem,
  Channel,
  DiscoverCategory,
  HomeFilter,
  HomeMode,
  ProviderInfo,
} from "../../types";

interface HomeScreenProps {
  catalog: CatalogItem[];
  continueItems: CatalogItem[];
  favoriteItems: CatalogItem[];
  channels: Channel[];
  loading: boolean;
  homeMode: HomeMode;
  activeProvider: ProviderInfo;
  onRefresh: () => void;
  onOpenSearch: (initialQuery?: string) => void;
  onSelectMedia: (id: string) => void;
  onLongPressItem: (item: CatalogItem) => void;
  onPlayChannel: (channel: Channel) => void;
  onOpenPlaylists: () => void;
  onSwitchToLiveTab: () => void;
}

const QUICK_FILTERS: { id: HomeFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "movies", label: "Movies" },
  { id: "series", label: "Series" },
  { id: "anime", label: "Anime" },
  { id: "live", label: "Live TV" },
];

const DISCOVER_CATEGORIES: DiscoverCategory[] = [
  "Trending Now",
  "Top Rated",
  "Latest Releases",
  "Most Watched",
  "Top Movies",
  "Top Series",
  "Addon Catalogs",
];

export const HomeScreen: React.FC<HomeScreenProps> = ({
  catalog,
  continueItems,
  favoriteItems,
  channels,
  loading,
  homeMode,
  activeProvider,
  onRefresh,
  onOpenSearch,
  onSelectMedia,
  onLongPressItem,
  onPlayChannel,
  onOpenPlaylists,
  onSwitchToLiveTab,
}) => {
  const [quickFilter, setQuickFilter] = useState<HomeFilter>("all");
  const [selectedCategory, setSelectedCategory] =
    useState<DiscoverCategory>("Trending Now");
  const [pullDistance, setPullDistance] = useState(0);
  const touchStartY = useRef<number | null>(null);
  const longPressTimer = useRef<number | null>(null);

  const handleFilterClick = (filter: HomeFilter) => {
    if (filter === "live") {
      onSwitchToLiveTab();
      return;
    }
    setQuickFilter(filter);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY <= 4) {
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0 && window.scrollY <= 4) {
      setPullDistance(Math.min(64, delta * 0.45));
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance >= 48) {
      onRefresh();
    }
    setPullDistance(0);
    touchStartY.current = null;
  };

  const startLongPress = (item: CatalogItem) => {
    cancelLongPress();
    longPressTimer.current = window.setTimeout(() => {
      onLongPressItem(item);
    }, 450);
  };

  const cancelLongPress = () => {
    if (longPressTimer.current !== null) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const filteredCatalog = filterCatalogItems(catalog, { filter: quickFilter });
  const orderedCategories: DiscoverCategory[] = [
    selectedCategory,
    ...DISCOVER_CATEGORIES.filter((c) => c !== selectedCategory),
  ];

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="px-4 md:px-6 py-4 space-y-6 max-w-[1360px] mx-auto"
    >
      {/* Visual Pull-to-refresh indicator */}
      {pullDistance > 8 && (
        <div
          aria-hidden="true"
          className="flex items-center justify-center gap-2 text-[12px] text-[var(--text-2)] transition-all"
          style={{ height: `${Math.round(pullDistance)}px` }}
        >
          <RefreshCw
            size={14}
            strokeWidth={1.5}
            className={pullDistance >= 48 ? "animate-spin" : ""}
          />
          <span>
            {pullDistance >= 48 ? "Release to refresh" : "Pull to refresh"}
          </span>
        </div>
      )}

      {/* Prominent Search Trigger + Refresh Control */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onOpenSearch()}
          className="flex-1 min-h-[46px] px-3.5 rounded-[8px] bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border-strong)] flex items-center gap-3 text-left transition-colors duration-150"
        >
          <Search
            size={18}
            strokeWidth={1.5}
            className="text-[var(--text-3)] shrink-0"
          />
          <span className="text-[14px] text-[var(--text-3)] truncate">
            Search movies, series, anime…
          </span>
        </button>

        <button
          type="button"
          onClick={onRefresh}
          aria-label="Refresh catalog"
          className="min-h-[46px] min-w-[46px] rounded-[8px] bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border-strong)] flex items-center justify-center text-[var(--text-2)] hover:text-[var(--text)] transition-colors duration-150 shrink-0"
        >
          <RefreshCw
            size={17}
            strokeWidth={1.5}
            className={loading ? "animate-spin" : ""}
          />
        </button>
      </div>

      {/* Live TV Quick Mode inside Home when segmented toggle is on Live TV */}
      {homeMode === "live" ? (
        <section aria-labelledby="home-live-heading" className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2
                id="home-live-heading"
                className="text-[16px] font-semibold text-[var(--text)]"
              >
                Live TV Lineup
              </h2>
              <p className="text-[12px] text-[var(--text-2)]">
                Active IPTV channels from configured playlists
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenPlaylists}
              className="min-h-[36px] px-3 rounded-[8px] bg-[var(--surface)] border border-[var(--border)] text-[12px] font-medium text-[var(--text)] hover:border-[var(--border-strong)]"
            >
              Manage playlists
            </button>
          </div>

          {channels.length === 0 ? (
            <EmptyState
              title="No channels yet"
              description="Import an M3U or M3U8 playlist to browse live broadcasts."
              actions={[
                {
                  label: "Add playlist",
                  onClick: onOpenPlaylists,
                  variant: "primary",
                },
              ]}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {channels.map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => onPlayChannel(ch)}
                  className="w-full text-left p-3 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)] flex items-center gap-3 transition-colors duration-150"
                >
                  <div className="w-12 h-12 rounded-[8px] bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center font-semibold text-[13px] tracking-wider text-[var(--text)] shrink-0">
                    {ch.logoText}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[14px] font-semibold text-[var(--text)] truncate">
                        {ch.name}
                      </span>
                      <span className="text-[11px] text-[var(--text-3)] shrink-0">
                        {ch.category}
                      </span>
                    </div>
                    <p className="text-[12px] text-[var(--text-2)] truncate mt-0.5">
                      Now: {ch.now}
                    </p>
                    <div className="h-1 w-full rounded-full bg-[var(--surface-3)] mt-2 overflow-hidden">
                      <div
                        className="h-full bg-[var(--accent)]"
                        style={{ width: `${ch.progress}%` }}
                      />
                    </div>
                  </div>
                  <Radio
                    size={16}
                    strokeWidth={1.5}
                    className="text-[var(--text-3)] shrink-0"
                  />
                </button>
              ))}
            </div>
          )}
        </section>
      ) : (
        <>
          {/* Quick Filter Chips */}
          <div
            role="group"
            aria-label="Catalog media type filters"
            className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0"
          >
            {QUICK_FILTERS.map((f) => {
              const active = quickFilter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => handleFilterClick(f.id)}
                  className={`min-h-[36px] px-3.5 rounded-full text-[13px] font-medium whitespace-nowrap border transition-colors duration-150 shrink-0 ${
                    active
                      ? "bg-[var(--accent)] text-[var(--accent-text)] border-[var(--accent)]"
                      : "bg-[var(--surface)] text-[var(--text-2)] border-[var(--border)] hover:text-[var(--text)] hover:border-[var(--border-strong)]"
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          {/* Continue Watching */}
          <section aria-labelledby="continue-heading" className="space-y-3">
            <div className="flex items-center justify-between">
              <h2
                id="continue-heading"
                className="text-[16px] font-semibold text-[var(--text)]"
              >
                Continue watching
              </h2>
              <span className="text-[12px] text-[var(--text-3)]">
                Hold card for actions
              </span>
            </div>

            {loading ? (
              <ContinueRowSkeleton />
            ) : continueItems.length === 0 ? (
              <EmptyState
                compact
                title="Nothing in progress"
                description="Titles you start playing will appear here for quick resumption."
              />
            ) : (
              <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 pb-1">
                {continueItems.map((item) => {
                  const epCode = formatEpisodeCode(
                    item.progress?.season,
                    item.progress?.episode
                  );
                  const remaining = formatRemainingTime(item.progress);

                  return (
                    <div
                      key={item.id}
                      onPointerDown={() => startLongPress(item)}
                      onPointerUp={cancelLongPress}
                      onPointerLeave={cancelLongPress}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        onLongPressItem(item);
                      }}
                      className="w-[244px] md:w-[272px] shrink-0 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] overflow-hidden group hover:border-[var(--border-strong)] transition-colors duration-150"
                    >
                      <button
                        type="button"
                        onClick={() => onSelectMedia(item.id)}
                        className="w-full text-left block"
                      >
                        <div className="relative">
                          <PosterArt
                            title={item.title}
                            seed={item.poster}
                            aspect="16/9"
                            hideTitle
                          />
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="w-10 h-10 rounded-full bg-black/65 border border-[var(--border-strong)] flex items-center justify-center text-[var(--text)] group-hover:scale-105 transition-transform duration-150">
                              <Play size={16} strokeWidth={1.75} className="ml-0.5" />
                            </span>
                          </div>
                          {/* Progress Bar */}
                          <div className="absolute bottom-0 inset-x-0 h-1 bg-[var(--surface-3)]">
                            <div
                              className="h-full bg-[var(--accent)]"
                              style={{
                                width: `${item.progress?.percent ?? 0}%`,
                              }}
                            />
                          </div>
                        </div>
                      </button>

                      <div className="p-3 flex items-start justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => onSelectMedia(item.id)}
                          className="min-w-0 text-left flex-1"
                        >
                          <div className="text-[14px] font-semibold text-[var(--text)] truncate">
                            {item.title}
                          </div>
                          <div className="text-[12px] text-[var(--text-2)] font-mono-tabular mt-0.5 truncate">
                            {epCode ? `${epCode} · ` : ""}
                            {remaining}
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => onLongPressItem(item)}
                          aria-label={`More actions for ${item.title}`}
                          className="min-h-[36px] min-w-[36px] -mr-1.5 -mt-1 flex items-center justify-center rounded-[8px] text-[var(--text-3)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]"
                        >
                          <MoreVertical size={16} strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Favorites */}
          <section aria-labelledby="favorites-heading" className="space-y-3">
            <div className="flex items-center justify-between">
              <h2
                id="favorites-heading"
                className="text-[16px] font-semibold text-[var(--text)]"
              >
                Favorites
              </h2>
              <span className="text-[12px] font-mono-tabular text-[var(--text-3)]">
                {favoriteItems.length}
              </span>
            </div>

            {loading ? (
              <PosterRowSkeleton />
            ) : favoriteItems.length === 0 ? (
              <EmptyState
                compact
                title="Nothing saved yet"
                description="Save movies, series, or anime from any details page to build your personal shelf."
              />
            ) : (
              <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 pb-1">
                {favoriteItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectMedia(item.id)}
                    className="w-[126px] md:w-[152px] shrink-0 text-left group"
                  >
                    <div className="rounded-[12px] overflow-hidden border border-[var(--border)] group-hover:border-[var(--border-strong)] transition-colors duration-150">
                      <PosterArt
                        title={item.title}
                        seed={item.poster}
                        subtitle={
                          item.isAnime
                            ? "Anime"
                            : item.type === "series"
                              ? "Series"
                              : "Movie"
                        }
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
            )}
          </section>

          {/* Discover */}
          <section aria-labelledby="discover-heading" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2
                id="discover-heading"
                className="text-[16px] font-semibold text-[var(--text)]"
              >
                Discover
              </h2>
              <span className="text-[12px] text-[var(--text-3)]">
                {activeProvider.name}
              </span>
            </div>

            {/* Category Chips */}
            <div
              role="tablist"
              aria-label="Discover categories"
              className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0"
            >
              {DISCOVER_CATEGORIES.map((cat) => {
                const active = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setSelectedCategory(cat)}
                    className={`min-h-[36px] px-3.5 rounded-full text-[12px] font-medium whitespace-nowrap border transition-colors duration-150 shrink-0 ${
                      active
                        ? "bg-[var(--surface-3)] text-[var(--text)] border-[var(--border-strong)]"
                        : "bg-transparent text-[var(--text-3)] border-[var(--border)] hover:text-[var(--text-2)]"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Horizontal Poster Rows */}
            {loading ? (
              <PosterRowSkeleton />
            ) : (
              <div className="space-y-6">
                {orderedCategories.slice(0, 4).map((category) => {
                  const rowItems = filterCatalogItems(filteredCatalog, {
                    category,
                  });
                  if (rowItems.length === 0) return null;
                  return (
                    <div key={category} className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <h3 className="text-[14px] font-semibold text-[var(--text)]">
                          {category}
                        </h3>
                        <button
                          type="button"
                          onClick={() => onOpenSearch("")}
                          className="min-h-[32px] px-2 -mr-2 text-[12px] text-[var(--text-2)] hover:text-[var(--text)] flex items-center gap-0.5"
                        >
                          <span>See all</span>
                          <ChevronRight size={14} strokeWidth={1.5} />
                        </button>
                      </div>

                      <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 pb-1">
                        {rowItems.map((item) => (
                          <button
                            key={`${category}-${item.id}`}
                            type="button"
                            onClick={() => onSelectMedia(item.id)}
                            className="w-[126px] md:w-[152px] shrink-0 text-left group"
                          >
                            <div className="rounded-[12px] overflow-hidden border border-[var(--border)] group-hover:border-[var(--border-strong)] transition-colors duration-150">
                              <PosterArt
                                title={item.title}
                                seed={item.poster}
                                subtitle={
                                  item.isAnime
                                    ? "Anime"
                                    : item.type === "series"
                                      ? "Series"
                                      : "Movie"
                                }
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
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};
