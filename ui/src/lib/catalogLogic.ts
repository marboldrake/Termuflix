import type {
  CatalogItem,
  Channel,
  ChannelCategory,
  DiscoverCategory,
  HomeFilter,
  MediaDetails,
  ProgressInfo,
  ProviderId,
} from "../types";

export function formatSecondsToClock(totalSec: number): string {
  const safe = Math.max(0, Math.floor(totalSec));
  const hours = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  if (hours > 0) {
    return `${hours}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

export function formatRemainingTime(progress?: ProgressInfo): string {
  if (!progress) return "";
  const remaining = Math.max(0, progress.totalSeconds - progress.currentSeconds);
  const mins = Math.ceil(remaining / 60);
  if (mins >= 60) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m left` : `${h}h left`;
  }
  return `${mins}m left`;
}

export function formatEpisodeCode(season?: number, episode?: number): string {
  if (!season || !episode) return "";
  const s = season.toString().padStart(2, "0");
  const e = episode.toString().padStart(2, "0");
  return `S${s}E${e}`;
}

export function filterCatalogItems(
  items: CatalogItem[],
  options: {
    query?: string;
    filter?: HomeFilter;
    provider?: ProviderId;
    category?: DiscoverCategory;
  }
): CatalogItem[] {
  const q = (options.query ?? "").trim().toLowerCase();
  const filter = options.filter ?? "all";

  return items.filter((item) => {
    if (filter === "movies" && (item.type !== "movie" || item.isAnime)) {
      return false;
    }
    if (filter === "series" && (item.type !== "series" || item.isAnime)) {
      return false;
    }
    if (filter === "anime" && !item.isAnime) {
      return false;
    }
    if (
      options.provider &&
      item.providers &&
      item.providers.length > 0 &&
      !item.providers.includes(options.provider)
    ) {
      return false;
    }
    if (
      options.category &&
      (!item.categories || !item.categories.includes(options.category))
    ) {
      return false;
    }
    if (q) {
      const hay = `${item.title} ${item.year} ${item.type}`.toLowerCase();
      return hay.includes(q);
    }
    return true;
  });
}

export function filterChannels(
  channels: Channel[],
  category: ChannelCategory,
  query: string
): Channel[] {
  const q = query.trim().toLowerCase();
  return channels.filter((ch) => {
    if (category !== "All" && ch.category !== category) {
      return false;
    }
    if (q) {
      const hay = `${ch.name} ${ch.now} ${ch.next} ${ch.category}`.toLowerCase();
      return hay.includes(q);
    }
    return true;
  });
}

export function findNextEpisode(
  details: MediaDetails,
  currentSeason: number,
  currentEpisode: number
): { season: number; episode: number; title: string; durationSeconds: number } | null {
  if (details.type !== "series" || details.seasons.length === 0) return null;
  const seasonIdx = details.seasons.findIndex((s) => s.number === currentSeason);
  if (seasonIdx === -1) return null;

  const season = details.seasons[seasonIdx];
  const epIdx = season.episodes.findIndex((e) => e.number === currentEpisode);
  if (epIdx !== -1 && epIdx + 1 < season.episodes.length) {
    const nextEp = season.episodes[epIdx + 1];
    return {
      season: season.number,
      episode: nextEp.number,
      title: nextEp.title,
      durationSeconds: nextEp.durationSeconds,
    };
  }

  if (seasonIdx + 1 < details.seasons.length) {
    const nextSeason = details.seasons[seasonIdx + 1];
    if (nextSeason.episodes.length > 0) {
      const firstEp = nextSeason.episodes[0];
      return {
        season: nextSeason.number,
        episode: firstEp.number,
        title: firstEp.title,
        durationSeconds: firstEp.durationSeconds,
      };
    }
  }

  return null;
}

export function validateSourceInput(raw: string): {
  valid: boolean;
  error?: string;
  normalized: string;
} {
  const trimmed = raw.trim();
  if (!trimmed) {
    return {
      valid: false,
      error: "Enter a URL or local file path.",
      normalized: "",
    };
  }
  const isHttp = /^https?:\/\/.+/i.test(trimmed);
  const isPath = /^(\/|~\/|[a-zA-Z]:\\).+/.test(trimmed);
  if (!isHttp && !isPath) {
    return {
      valid: false,
      error: "Source must start with http(s):// or a valid local path.",
      normalized: trimmed,
    };
  }
  return { valid: true, normalized: trimmed };
}
