export type MediaType = "movie" | "series";

export type MediaCategoryTag = "movie" | "series" | "anime";

export type Route =
  | "home"
  | "search"
  | "live"
  | "library"
  | "settings"
  | "details"
  | "player";

export type HomeMode = "streaming" | "live";

export type HomeFilter = "all" | "movies" | "series" | "anime" | "live";

export type DiscoverCategory =
  | "Trending Now"
  | "Top Rated"
  | "Latest Releases"
  | "Most Watched"
  | "Top Movies"
  | "Top Series"
  | "Addon Catalogs";

export type ProviderId =
  | "moviebox"
  | "4khdhub"
  | "dramachi"
  | "bdix-circleftp"
  | "bdix-dhakaflix"
  | "addons";

export interface ProviderInfo {
  id: ProviderId;
  name: string;
  description: string;
  status: "Available" | "Fast Local" | "Experimental";
  enabled: boolean;
}

export type PlayerOption =
  | "Auto"
  | "MPV"
  | "VLC"
  | "IINA"
  | "Android Player";

export type ThemePreset = "graphite" | "onyx" | "slate";

export type SubtitleLanguage =
  | "Off"
  | "English"
  | "Spanish"
  | "Portuguese (BR)"
  | "Multi";

export interface ProgressInfo {
  percent: number; // 0 to 100
  currentSeconds: number;
  totalSeconds: number;
  season?: number;
  episode?: number;
  watchedAgo?: string;
}

export interface CatalogItem {
  id: string;
  title: string;
  year: number;
  type: MediaType;
  poster: string; // Palette key or abstract seed for CSS/SVG poster
  rating: number;
  progress?: ProgressInfo;
  // Additional editorial/catalog metadata used for filtering and display
  isAnime?: boolean;
  categories?: DiscoverCategory[];
  providers?: ProviderId[];
  durationLabel?: string;
  audioBadge?: string;
}

export interface Stream {
  id: string;
  resolution: "4K" | "1080p" | "720p";
  size: string;
  codec: string;
  source: string;
  url: string;
  subtitles: SubtitleLanguage[];
}

export interface Episode {
  number: number;
  title: string;
  synopsis: string;
  duration: string;
  durationSeconds: number;
  progress?: number; // 0 to 100
}

export interface Season {
  number: number;
  episodes: Episode[];
}

export interface MediaDetails extends CatalogItem {
  synopsis: string;
  genres: string[];
  cast: string[];
  director: string;
  runtime: string;
  seasons: Season[];
  audio: string[];
  streams: Stream[];
}

export type ChannelCategory =
  | "All"
  | "News"
  | "Sports"
  | "Movies"
  | "Kids"
  | "Music";

export interface Channel {
  id: string;
  name: string;
  category: Exclude<ChannelCategory, "All">;
  logoText: string;
  now: string;
  next: string;
  progress: number; // 0 to 100
  playlistId?: string;
}

export type DownloadStatus = "downloading" | "paused" | "queued" | "completed";

export interface Download {
  id: string;
  mediaId: string;
  title: string;
  subtitle?: string;
  progress: number; // 0 to 100
  speed: string;
  eta: string;
  size: string;
  status: DownloadStatus;
}

export interface PlaylistItem {
  id: string;
  name: string;
  source: string;
  channelCount: number;
  updatedAt: string;
}

export interface AddonItem {
  id: string;
  name: string;
  manifestUrl: string;
  version: string;
  catalogCount: number;
  enabled: boolean;
}

export type ToastLevel = "INFO" | "SUCCESS" | "WARNING" | "ERROR";

export interface ToastMessage {
  id: string;
  level: ToastLevel;
  message: string;
}

export interface AppSettings {
  automaticUpdates: boolean;
  defaultPlayer: PlayerOption;
  downloadFolder: string;
  streamingMode: boolean;
  liveTvMode: boolean;
  theme: ThemePreset;
  enabledProviders: Record<ProviderId, boolean>;
}

export interface PlayerSession {
  mediaId: string;
  title: string;
  type: MediaType;
  season?: number;
  episode?: number;
  episodeTitle?: string;
  streamId: string;
  quality: string;
  audioTrack: string;
  subtitle: SubtitleLanguage;
  startSeconds: number;
  totalSeconds: number;
  hasNextEpisode: boolean;
}
