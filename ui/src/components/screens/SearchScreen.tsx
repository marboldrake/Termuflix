import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ChevronDown,
  Clock,
  Search,
  Star,
  X,
} from "lucide-react";
import { PosterArt } from "../ui/PosterArt";
import { EmptyState } from "../ui/EmptyState";
import { SearchGridSkeleton } from "../ui/Skeletons";
import { formatEpisodeCode } from "../../lib/catalogLogic";
import { MOCK_MEDIA } from "../../data/mock";
import type {
  CatalogApi,
} from "../../lib/api";
import type {
  CatalogItem,
  HomeFilter,
  ProviderId,
  ProviderInfo,
} from "../../types";

interface SearchScreenProps {
  api: CatalogApi;
  initialQuery: string;
  activeProvider: ProviderInfo;
  recentSearches: string[];
  onAddRecentSearch: (term: string) => void;
  onRemoveRecentSearch: (term: string) => void;
  onOpenProviders: () => void;
  onSelectMedia: (id: string) => void;
}

const FILTER_OPTIONS: { id: HomeFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "movies", label: "Movies" },
  { id: "series", label: "Series" },
  { id: "anime", label: "Anime" },
];

export const SearchScreen: React.FC<SearchScreenProps> = ({
  api,
  initialQuery,
  activeProvider,
  recentSearches,
  onAddRecentSearch,
  onRemoveRecentSearch,
  onOpenProviders,
  onSelectMedia,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [filter, setFilter] = useState<HomeFilter>("all");
  const [page, setPage] = useState(1);
  const [results, setResults] = useState<CatalogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const [retryTick, setRetryTick] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    const timer = window.setTimeout(async () => {
      try {
        const res = await api.searchCatalog({
          query,
          filter,
          provider: activeProvider.id as ProviderId,
          page,
          pageSize: 8,
        });
        if (!active) return;
        setResults(res.items);
        setTotal(res.total);
        setHasMore(res.hasMore);
      } catch (err) {
        if (!active) return;
        setError(
          err instanceof Error
            ? err.message
            : "Search request failed on local engine."
        );
      } finally {
        if (active) setLoading(false);
      }
    }, 150);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [api, query, filter, activeProvider.id, page, retryTick]);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return MOCK_MEDIA.filter((m) => m.title.toLowerCase().includes(q))
      .slice(0, 4)
      .map((m) => m.title);
  }, [query]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onAddRecentSearch(query.trim());
    }
    setFocused(false);
  };

  const handleSelectTerm = (term: string) => {
    setQuery(term);
    setPage(1);
    onAddRecentSearch(term);
    setFocused(false);
  };

  const handleClear = () => {
    setQuery("");
    setPage(1);
    setError(null);
    inputRef.current?.focus();
  };

  return (
    <div className="px-4 md:px-6 py-4 space-y-4 max-w-[1360px] mx-auto">
      {/* Search Input Bar */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <Search
          size={18}
          strokeWidth={1.5}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-3)] pointer-events-none"
        />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onFocus={() => setFocused(true)}
          onBlur={() => window.setTimeout(() => setFocused(false), 160)}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          placeholder={`Search ${activeProvider.name} (type "error" to preview error state)…`}
          aria-label="Search catalog"
          className="w-full min-h-[48px] pl-10 pr-11 rounded-[8px] bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--border-strong)] text-[14px] text-[var(--text)] placeholder:text-[var(--text-3)]"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search query"
            className="absolute right-1 top-1/2 -translate-y-1/2 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-[8px] text-[var(--text-3)] hover:text-[var(--text)]"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        )}

        {/* Suggestions dropdown when typing */}
        {focused && suggestions.length > 0 && (
          <div className="absolute z-20 left-0 right-0 mt-1.5 rounded-[12px] border border-[var(--border-strong)] bg-[var(--surface-2)] shadow-[var(--shadow-soft)] overflow-hidden">
            {suggestions.map((title) => (
              <button
                key={title}
                type="button"
                onMouseDown={() => handleSelectTerm(title)}
                className="w-full min-h-[44px] px-3.5 flex items-center gap-2.5 text-left text-[13px] text-[var(--text)] hover:bg-[var(--surface-3)] transition-colors duration-150"
              >
                <Search
                  size={14}
                  strokeWidth={1.5}
                  className="text-[var(--text-3)] shrink-0"
                />
                <span className="truncate">{title}</span>
              </button>
            ))}
          </div>
        )}
      </form>

      {/* Recent Searches */}
      {!query && recentSearches.length > 0 && (
        <div className="space-y-2">
          <div className="text-[12px] font-medium text-[var(--text-3)]">
            Recent searches
          </div>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((term) => (
              <div
                key={term}
                className="inline-flex items-center rounded-full bg-[var(--surface)] border border-[var(--border)] overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => handleSelectTerm(term)}
                  className="min-h-[34px] pl-3 pr-2 text-[12px] text-[var(--text-2)] hover:text-[var(--text)] flex items-center gap-1.5"
                >
                  <Clock size={12} strokeWidth={1.5} />
                  <span>{term}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveRecentSearch(term)}
                  aria-label={`Remove recent search ${term}`}
                  className="min-h-[34px] pr-2.5 pl-1 text-[var(--text-3)] hover:text-[var(--text)] flex items-center"
                >
                  <X size={12} strokeWidth={1.5} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Chips + Provider Selector */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div
          role="group"
          aria-label="Search type filters"
          className="flex items-center gap-2 overflow-x-auto no-scrollbar"
        >
          {FILTER_OPTIONS.map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  setFilter(f.id);
                  setPage(1);
                }}
                className={`min-h-[36px] px-3.5 rounded-full text-[12px] font-medium whitespace-nowrap border transition-colors duration-150 ${
                  active
                    ? "bg-[var(--accent)] text-[var(--accent-text)] border-[var(--accent)]"
                    : "bg-[var(--surface)] text-[var(--text-2)] border-[var(--border)] hover:text-[var(--text)]"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onOpenProviders}
          className="min-h-[36px] px-3 rounded-[8px] bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border-strong)] text-[12px] font-medium text-[var(--text)] flex items-center gap-1.5 shrink-0"
        >
          <span>Provider: {activeProvider.name}</span>
          <ChevronDown size={14} strokeWidth={1.5} className="text-[var(--text-3)]" />
        </button>
      </div>

      {/* Results Header */}
      {!loading && !error && results.length > 0 && (
        <div className="flex items-center justify-between text-[12px] text-[var(--text-3)]">
          <span>
            Showing <span className="font-mono-tabular">{results.length}</span> of{" "}
            <span className="font-mono-tabular">{total}</span> results
          </span>
          <span>{activeProvider.name}</span>
        </div>
      )}

      {/* States: Loading / Error / Empty / Results Grid */}
      {loading ? (
        <SearchGridSkeleton />
      ) : error ? (
        <div className="rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-6 text-center space-y-3">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--error)]">
            <AlertCircle size={20} strokeWidth={1.5} />
          </div>
          <div className="space-y-1">
            <h2 className="text-[16px] font-semibold text-[var(--text)]">
              Could not reach {activeProvider.name}
            </h2>
            <p className="text-[13px] text-[var(--text-2)] max-w-md mx-auto">
              {error}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => setRetryTick((t) => t + 1)}
              className="min-h-[44px] px-4 rounded-[8px] bg-[var(--accent)] text-[var(--accent-text)] text-[13px] font-medium"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={onOpenProviders}
              className="min-h-[44px] px-4 rounded-[8px] bg-[var(--surface-2)] border border-[var(--border)] text-[13px] font-medium text-[var(--text)]"
            >
              Switch provider
            </button>
          </div>
        </div>
      ) : results.length === 0 ? (
        <EmptyState
          title={`No results for "${query}" on ${activeProvider.name}`}
          description="Try another catalog provider or clear the active search filters."
          actions={[
            {
              label: "Try another provider",
              onClick: onOpenProviders,
              variant: "primary",
            },
            {
              label: "Clear",
              onClick: handleClear,
              variant: "secondary",
            },
          ]}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {results.map((item) => {
              const epCode = formatEpisodeCode(
                item.progress?.season,
                item.progress?.episode
              );
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectMedia(item.id)}
                  className="text-left group"
                >
                  <div className="relative rounded-[12px] overflow-hidden border border-[var(--border)] group-hover:border-[var(--border-strong)] transition-colors duration-150">
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
                    {item.progress && item.progress.percent > 0 && (
                      <div className="absolute bottom-0 inset-x-0 h-1 bg-[var(--surface-3)]">
                        <div
                          className="h-full bg-[var(--accent)]"
                          style={{ width: `${item.progress.percent}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="mt-1.5 space-y-0.5 px-0.5">
                    <div className="text-[11px] text-[var(--text-2)] flex items-center justify-between gap-1.5 tabular-nums">
                      <span>
                        {item.year} · {item.type === "series" ? "Series" : "Movie"}
                      </span>
                      <span className="inline-flex items-center gap-0.5">
                        <Star size={10} strokeWidth={1.5} />
                        {item.rating.toFixed(1)}
                      </span>
                    </div>
                    {epCode && (
                      <div className="text-[11px] font-mono-tabular text-[var(--text-3)]">
                        {epCode} · {item.progress?.percent}%
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Pagination Indicator */}
          {hasMore && (
            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                className="min-h-[44px] px-5 rounded-[8px] bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border-strong)] text-[13px] font-medium text-[var(--text)] transition-colors duration-150"
              >
                Load more ({total - results.length} remaining)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
