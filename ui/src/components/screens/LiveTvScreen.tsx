import React, { useEffect, useState } from "react";
import { ListVideo, Play, Search, X } from "lucide-react";
import { EmptyState } from "../ui/EmptyState";
import { ChannelListSkeleton } from "../ui/Skeletons";
import { filterChannels } from "../../lib/catalogLogic";
import type { Channel, ChannelCategory } from "../../types";

interface LiveTvScreenProps {
  channels: Channel[];
  liveTvEnabled: boolean;
  onPlayChannel: (channel: Channel) => void;
  onOpenPlaylists: () => void;
  onEnableLiveTv: () => void;
}

const CATEGORIES: ChannelCategory[] = [
  "All",
  "News",
  "Sports",
  "Movies",
  "Kids",
  "Music",
];

export const LiveTvScreen: React.FC<LiveTvScreenProps> = ({
  channels,
  liveTvEnabled,
  onPlayChannel,
  onOpenPlaylists,
  onEnableLiveTv,
}) => {
  const [category, setCategory] = useState<ChannelCategory>("All");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const t = window.setTimeout(() => setLoading(false), 160);
    return () => window.clearTimeout(t);
  }, [category, channels.length]);

  if (!liveTvEnabled) {
    return (
      <div className="px-4 md:px-6 py-8 max-w-3xl mx-auto">
        <EmptyState
          title="Live TV mode is turned off"
          description="Enable Live TV mode in Settings to browse IPTV channels and EPG schedules."
          actions={[
            {
              label: "Enable Live TV",
              onClick: onEnableLiveTv,
              variant: "primary",
            },
          ]}
        />
      </div>
    );
  }

  const filtered = filterChannels(channels, category, query);

  return (
    <div className="px-4 md:px-6 py-4 space-y-4 max-w-[1160px] mx-auto">
      {/* Search + Manage Playlists */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search
            size={17}
            strokeWidth={1.5}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-3)] pointer-events-none"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search channels or programs…"
            aria-label="Search live TV channels"
            className="w-full min-h-[46px] pl-10 pr-10 rounded-[8px] bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--border-strong)] text-[14px] text-[var(--text)] placeholder:text-[var(--text-3)]"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear channel search"
              className="absolute right-1 top-1/2 -translate-y-1/2 min-h-[38px] min-w-[38px] flex items-center justify-center text-[var(--text-3)] hover:text-[var(--text)]"
            >
              <X size={15} strokeWidth={1.5} />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onOpenPlaylists}
          className="min-h-[46px] px-4 rounded-[8px] bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border-strong)] text-[13px] font-medium text-[var(--text)] flex items-center justify-center gap-2 shrink-0"
        >
          <ListVideo size={16} strokeWidth={1.5} />
          <span>Manage playlists</span>
        </button>
      </div>

      {/* Category Chips */}
      <div
        role="group"
        aria-label="Channel categories"
        className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0"
      >
        {CATEGORIES.map((cat) => {
          const active = category === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`min-h-[36px] px-3.5 rounded-full text-[12px] font-medium whitespace-nowrap border transition-colors duration-150 shrink-0 ${
                active
                  ? "bg-[var(--accent)] text-[var(--accent-text)] border-[var(--accent)]"
                  : "bg-[var(--surface)] text-[var(--text-2)] border-[var(--border)] hover:text-[var(--text)]"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Channels List */}
      {loading ? (
        <ChannelListSkeleton />
      ) : channels.length === 0 ? (
        <EmptyState
          title="No channels yet"
          description="Add an M3U or M3U8 playlist to load live broadcasts and EPG guide entries."
          actions={[
            {
              label: "Add playlist",
              onClick: onOpenPlaylists,
              variant: "primary",
            },
          ]}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No matching channels"
          description="No channels match your current category or search query."
          actions={[
            {
              label: "Reset filters",
              onClick: () => {
                setCategory("All");
                setQuery("");
              },
              variant: "secondary",
            },
          ]}
        />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((ch) => (
            <div
              key={ch.id}
              className="p-3.5 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)] flex items-center gap-3.5 transition-colors duration-150"
            >
              {/* Monogram Logo */}
              <div className="w-12 h-12 rounded-[10px] bg-[var(--surface-2)] border border-[var(--border-strong)] flex items-center justify-center font-semibold text-[13px] tracking-wider text-[var(--text)] shrink-0">
                {ch.logoText}
              </div>

              {/* Channel + EPG Now / Next */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[14px] font-semibold text-[var(--text)] truncate">
                    {ch.name}
                  </span>
                  <span className="text-[11px] text-[var(--text-3)] shrink-0">
                    {ch.category}
                  </span>
                </div>

                <div className="text-[12px] text-[var(--text)] truncate">
                  <span className="text-[var(--text-3)]">Now: </span>
                  {ch.now}
                </div>
                <div className="text-[11px] text-[var(--text-2)] truncate">
                  <span className="text-[var(--text-3)]">Next: </span>
                  {ch.next}
                </div>

                <div className="h-1 w-full rounded-full bg-[var(--surface-3)] overflow-hidden pt-0">
                  <div
                    className="h-full bg-[var(--accent)]"
                    style={{ width: `${ch.progress}%` }}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => onPlayChannel(ch)}
                aria-label={`Watch ${ch.name}`}
                className="min-h-[44px] min-w-[44px] rounded-[8px] bg-[var(--surface-2)] border border-[var(--border)] hover:border-[var(--border-strong)] flex items-center justify-center text-[var(--text)] shrink-0"
              >
                <Play size={16} strokeWidth={1.75} className="ml-0.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
