import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Download as DownloadIcon,
  ExternalLink,
  Heart,
  MoreHorizontal,
  Play,
  RefreshCw,
  Star,
} from "lucide-react";
import { PosterArt } from "../ui/PosterArt";
import { EmptyState } from "../ui/EmptyState";
import { PanelRowsSkeleton } from "../ui/Skeletons";
import type { MediaDetails, Stream } from "../../types";

interface DetailsScreenProps {
  details: MediaDetails | null;
  loading: boolean;
  isFavorite: boolean;
  onBack: () => void;
  onToggleFavorite: (id: string) => void;
  onOpenSynopsis: () => void;
  onPlay: (options: {
    stream: Stream;
    season?: number;
    episode?: number;
    audioTrack: string;
  }) => void;
  onDownload: (label: string, stream: Stream) => void;
  onOpenExternalPlayer: (stream: Stream) => void;
  onCopyUrl: (url: string) => void;
}

type DetailsTab = "streams" | "episodes" | "audio";

export const DetailsScreen: React.FC<DetailsScreenProps> = ({
  details,
  loading,
  isFavorite,
  onBack,
  onToggleFavorite,
  onOpenSynopsis,
  onPlay,
  onDownload,
  onOpenExternalPlayer,
  onCopyUrl,
}) => {
  const [activeTab, setActiveTab] = useState<DetailsTab>("streams");
  const [selectedStreamId, setSelectedStreamId] = useState<string>("");
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [selectedAudio, setSelectedAudio] = useState<string>("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [panelLoading, setPanelLoading] = useState(false);
  const [panelError, setPanelError] = useState<string | null>(null);

  useEffect(() => {
    if (!details) return;
    setSelectedStreamId(details.streams[0]?.id ?? "");
    setSelectedSeason(
      details.progress?.season ?? details.seasons[0]?.number ?? 1
    );
    setSelectedAudio(details.audio[0] ?? "English (Original)");
    setActiveTab(details.type === "series" ? "episodes" : "streams");
    setPanelError(null);
  }, [details]);

  if (loading || !details) {
    return (
      <div className="min-h-screen bg-[var(--bg)] p-4 md:p-6 max-w-5xl mx-auto space-y-6">
        <button
          type="button"
          onClick={onBack}
          aria-label="Go back"
          className="min-h-[44px] min-w-[44px] inline-flex items-center gap-2 text-[var(--text-2)] hover:text-[var(--text)]"
        >
          <ArrowLeft size={18} strokeWidth={1.5} />
          <span className="text-[14px]">Back</span>
        </button>
        <div className="h-56 rounded-[12px] tf-skeleton" />
        <PanelRowsSkeleton count={4} />
      </div>
    );
  }

  const activeStream =
    details.streams.find((s) => s.id === selectedStreamId) ?? details.streams[0];
  const currentSeasonObj =
    details.seasons.find((s) => s.number === selectedSeason) ??
    details.seasons[0];

  const defaultSeason = details.progress?.season ?? details.seasons[0]?.number;
  const defaultEpisode =
    details.progress?.episode ?? details.seasons[0]?.episodes[0]?.number;

  const handleTabChange = (tab: DetailsTab) => {
    setActiveTab(tab);
    setPanelError(null);
    setPanelLoading(true);
    window.setTimeout(() => setPanelLoading(false), 140);
  };

  const handlePrimaryPlay = () => {
    if (!activeStream) return;
    onPlay({
      stream: activeStream,
      season: details.type === "series" ? defaultSeason : undefined,
      episode: details.type === "series" ? defaultEpisode : undefined,
      audioTrack: selectedAudio,
    });
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] pb-28 md:pb-12">
      {/* Full-bleed Backdrop with vertical black scrim */}
      <div className="relative w-full h-[240px] sm:h-[300px] md:h-[340px] overflow-hidden">
        <PosterArt
          title={details.title}
          seed={details.poster}
          aspect="16/9"
          hideTitle
          className="w-full h-full object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, var(--bg) 0%, rgba(7,8,10,0.72) 55%, rgba(7,8,10,0.35) 100%)",
          }}
        />

        {/* Top Back & Overflow Bar */}
        <div className="absolute top-0 inset-x-0 p-4 md:px-6 flex items-center justify-between pt-safe">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to catalog"
            className="min-h-[44px] min-w-[44px] px-3 rounded-full bg-black/55 backdrop-blur-sm border border-[var(--border-strong)] flex items-center gap-1.5 text-[13px] font-medium text-[var(--text)] hover:bg-black/75 transition-colors duration-150"
          >
            <ArrowLeft size={16} strokeWidth={1.5} />
            <span>Back</span>
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="More options"
              aria-expanded={menuOpen}
              className="min-h-[44px] min-w-[44px] rounded-full bg-black/55 backdrop-blur-sm border border-[var(--border-strong)] flex items-center justify-center text-[var(--text)] hover:bg-black/75 transition-colors duration-150"
            >
              <MoreHorizontal size={18} strokeWidth={1.5} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-[12px] border border-[var(--border-strong)] bg-[var(--surface-2)] shadow-[var(--shadow-soft)] py-1 z-30">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    if (activeStream) onOpenExternalPlayer(activeStream);
                  }}
                  className="w-full min-h-[44px] px-3.5 text-left text-[13px] text-[var(--text)] hover:bg-[var(--surface-3)] flex items-center gap-2.5"
                >
                  <ExternalLink size={15} strokeWidth={1.5} />
                  <span>Open in external player</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    if (activeStream) onCopyUrl(activeStream.url);
                  }}
                  className="w-full min-h-[44px] px-3.5 text-left text-[13px] text-[var(--text)] hover:bg-[var(--surface-3)] flex items-center gap-2.5"
                >
                  <RefreshCw size={15} strokeWidth={1.5} />
                  <span>Copy proxy stream URL</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setPanelError(
                      "Resolver mirror timed out while fetching stream metadata."
                    );
                  }}
                  className="w-full min-h-[44px] px-3.5 text-left text-[13px] text-[var(--text-2)] hover:bg-[var(--surface-3)] flex items-center gap-2.5"
                >
                  <AlertCircle size={15} strokeWidth={1.5} />
                  <span>Simulate panel error</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 -mt-20 relative z-10 space-y-6">
        {/* Overlapping Poster + Title + Metadata */}
        <div className="flex flex-row items-end gap-4 md:gap-6">
          <div className="w-[104px] sm:w-[132px] md:w-[152px] shrink-0 rounded-[12px] overflow-hidden border border-[var(--border-strong)] shadow-[var(--shadow-soft)]">
            <PosterArt title={details.title} seed={details.poster} hideTitle />
          </div>

          <div className="min-w-0 flex-1 pb-1 space-y-2">
            <h1 className="text-[24px] md:text-[32px] font-semibold text-[var(--text)] leading-tight tracking-tight text-balance">
              {details.title}
            </h1>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[12px] text-[var(--text-2)] tabular-nums">
              <span>{details.year}</span>
              <span aria-hidden="true">·</span>
              <span>
                {details.isAnime
                  ? "Anime"
                  : details.type === "series"
                    ? "Series"
                    : "Movie"}
              </span>
              <span aria-hidden="true">·</span>
              <span>{details.runtime}</span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 text-[var(--text)] font-medium">
                <Star size={12} strokeWidth={1.5} />
                {details.rating.toFixed(1)}
              </span>
              {details.audioBadge && (
                <span className="px-1.5 py-0.5 rounded-[4px] bg-[var(--surface-2)] border border-[var(--border)] text-[11px] font-mono-tabular text-[var(--text)] whitespace-nowrap">
                  {details.audioBadge}
                </span>
              )}
            </div>

            {/* Genre Chips */}
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {details.genres.map((g) => (
                <span
                  key={g}
                  className="px-2.5 py-0.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[11px] text-[var(--text-2)]"
                >
                  {g}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Truncated Synopsis + Read More */}
        <div className="space-y-1.5 max-w-3xl">
          <p className="text-[14px] text-[var(--text-2)] leading-relaxed line-clamp-3">
            {details.synopsis}
          </p>
          <button
            type="button"
            onClick={onOpenSynopsis}
            className="text-[13px] font-medium text-[var(--text)] hover:underline"
          >
            Read more
          </button>
        </div>

        {/* Desktop & Tablet Action Row */}
        <div className="hidden md:flex items-center gap-3">
          <button
            type="button"
            onClick={handlePrimaryPlay}
            className="min-h-[44px] px-6 rounded-[8px] bg-[var(--accent)] text-[var(--accent-text)] text-[14px] font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity duration-150"
          >
            <Play size={16} strokeWidth={2} />
            <span>
              {details.progress && details.progress.percent > 0
                ? "Resume"
                : "Play"}
            </span>
          </button>
          <button
            type="button"
            onClick={() =>
              activeStream && onDownload(details.title, activeStream)
            }
            className="min-h-[44px] px-5 rounded-[8px] bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border-strong)] text-[14px] font-medium text-[var(--text)] flex items-center gap-2 transition-colors duration-150"
          >
            <DownloadIcon size={16} strokeWidth={1.5} />
            <span>Download</span>
          </button>
          <button
            type="button"
            onClick={() => onToggleFavorite(details.id)}
            aria-label={
              isFavorite
                ? `Remove ${details.title} from Favorites`
                : `Add ${details.title} to Favorites`
            }
            className="min-h-[44px] min-w-[44px] px-3.5 rounded-[8px] bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border-strong)] flex items-center justify-center gap-2 text-[14px] text-[var(--text)] transition-colors duration-150"
          >
            <Heart
              size={17}
              strokeWidth={1.5}
              className={isFavorite ? "fill-[var(--accent)] text-[var(--accent)]" : ""}
            />
            <span>{isFavorite ? "Saved" : "Save"}</span>
          </button>
        </div>

        {/* Section Tabs */}
        <div className="border-b border-[var(--border)] flex gap-6">
          {(
            [
              { id: "streams", label: "Streams" },
              { id: "episodes", label: "Seasons & Episodes" },
              { id: "audio", label: "Audio" },
            ] as { id: DetailsTab; label: string }[]
          ).map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => handleTabChange(tab.id)}
                className={`min-h-[44px] pb-2.5 text-[14px] font-medium whitespace-nowrap border-b-2 transition-colors duration-150 ${
                  active
                    ? "border-[var(--accent)] text-[var(--text)]"
                    : "border-transparent text-[var(--text-3)] hover:text-[var(--text-2)]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Panels */}
        {panelLoading ? (
          <PanelRowsSkeleton count={3} />
        ) : panelError ? (
          <div className="p-5 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertCircle
                size={18}
                strokeWidth={1.5}
                className="text-[var(--error)] shrink-0 mt-0.5"
              />
              <div>
                <div className="text-[14px] font-semibold text-[var(--text)]">
                  Panel load failed
                </div>
                <p className="text-[13px] text-[var(--text-2)] mt-0.5">
                  {panelError}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPanelError(null)}
              className="min-h-[44px] px-4 rounded-[8px] bg-[var(--accent)] text-[var(--accent-text)] text-[13px] font-medium shrink-0"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {activeTab === "streams" && (
              <div className="space-y-2.5">
                {details.streams.map((stream) => {
                  const selected = stream.id === activeStream?.id;
                  return (
                    <div
                      key={stream.id}
                      className={`p-3.5 rounded-[12px] border flex items-center justify-between gap-3 transition-colors duration-150 ${
                        selected
                          ? "bg-[var(--surface-2)] border-[var(--accent)]"
                          : "bg-[var(--surface)] border-[var(--border)] hover:border-[var(--border-strong)]"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedStreamId(stream.id)}
                        className="flex-1 min-w-0 text-left flex items-center gap-3"
                      >
                        <span className="px-2 py-1 rounded-[6px] bg-[var(--surface-3)] border border-[var(--border-strong)] text-[11px] font-mono-tabular font-semibold text-[var(--text)] shrink-0">
                          {stream.resolution}
                        </span>
                        <div className="min-w-0">
                          <div className="text-[13px] font-medium text-[var(--text)] truncate">
                            {stream.codec}
                          </div>
                          <div className="text-[12px] text-[var(--text-2)] font-mono-tabular mt-0.5 truncate">
                            {stream.size} · {stream.source}
                          </div>
                        </div>
                      </button>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {selected && (
                          <span className="text-[11px] font-medium text-[var(--success)] mr-1">
                            Selected
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => onDownload(details.title, stream)}
                          aria-label={`Download ${stream.resolution} stream`}
                          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-[8px] bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-2)] hover:text-[var(--text)]"
                        >
                          <DownloadIcon size={16} strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === "episodes" && (
              <div className="space-y-4">
                {details.seasons.length === 0 ? (
                  <EmptyState
                    compact
                    title="Feature film"
                    description="This title is a standalone movie. Switch to the Streams tab to pick resolution and source."
                    actions={[
                      {
                        label: "View streams",
                        onClick: () => setActiveTab("streams"),
                      },
                    ]}
                  />
                ) : (
                  <>
                    {/* Season Chips */}
                    <div className="flex gap-2 overflow-x-auto no-scrollbar">
                      {details.seasons.map((s) => {
                        const active = s.number === currentSeasonObj?.number;
                        return (
                          <button
                            key={s.number}
                            type="button"
                            onClick={() => setSelectedSeason(s.number)}
                            className={`min-h-[36px] px-3.5 rounded-full text-[12px] font-medium whitespace-nowrap border transition-colors duration-150 ${
                              active
                                ? "bg-[var(--accent)] text-[var(--accent-text)] border-[var(--accent)]"
                                : "bg-[var(--surface)] text-[var(--text-2)] border-[var(--border)] hover:text-[var(--text)]"
                            }`}
                          >
                            Season {s.number}
                          </button>
                        );
                      })}
                    </div>

                    {/* Episodes List */}
                    <div className="space-y-2.5">
                      {currentSeasonObj?.episodes.map((ep) => (
                        <div
                          key={ep.number}
                          className="p-3.5 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] space-y-2.5"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <button
                              type="button"
                              onClick={() =>
                                activeStream &&
                                onPlay({
                                  stream: activeStream,
                                  season: currentSeasonObj.number,
                                  episode: ep.number,
                                  audioTrack: selectedAudio,
                                })
                              }
                              className="flex-1 min-w-0 text-left"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-[12px] font-mono-tabular text-[var(--text-3)]">
                                  E{ep.number.toString().padStart(2, "0")}
                                </span>
                                <span className="text-[14px] font-semibold text-[var(--text)] truncate">
                                  {ep.title}
                                </span>
                              </div>
                              <p className="text-[12px] text-[var(--text-2)] mt-1 line-clamp-2 leading-relaxed">
                                {ep.synopsis}
                              </p>
                            </button>

                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-[12px] font-mono-tabular text-[var(--text-3)] mr-1">
                                {ep.duration}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  activeStream &&
                                  onDownload(
                                    `${details.title} · S${currentSeasonObj.number
                                      .toString()
                                      .padStart(2, "0")}E${ep.number
                                      .toString()
                                      .padStart(2, "0")}`,
                                    activeStream
                                  )
                                }
                                aria-label={`Download Episode ${ep.number}`}
                                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-[8px] text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]"
                              >
                                <DownloadIcon size={16} strokeWidth={1.5} />
                              </button>
                            </div>
                          </div>

                          {typeof ep.progress === "number" && ep.progress > 0 && (
                            <div className="h-1 w-full rounded-full bg-[var(--surface-3)] overflow-hidden">
                              <div
                                className="h-full bg-[var(--accent)]"
                                style={{ width: `${ep.progress}%` }}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === "audio" && (
              <div className="space-y-2">
                {details.audio.map((lang) => {
                  const selected = lang === selectedAudio;
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setSelectedAudio(lang)}
                      className={`w-full min-h-[48px] px-4 rounded-[12px] border flex items-center justify-between text-[14px] transition-colors duration-150 ${
                        selected
                          ? "bg-[var(--surface-2)] border-[var(--accent)] text-[var(--text)] font-medium"
                          : "bg-[var(--surface)] border-[var(--border)] text-[var(--text-2)] hover:text-[var(--text)]"
                      }`}
                    >
                      <span>{lang}</span>
                      {selected && <Check size={16} strokeWidth={1.75} />}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Mobile Sticky Bottom Action Bar */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-[var(--bg-elev)]/95 backdrop-blur-md border-t border-[var(--border)] px-4 py-2.5 pb-safe flex items-center gap-2.5">
        <button
          type="button"
          onClick={handlePrimaryPlay}
          className="flex-1 min-h-[44px] rounded-[8px] bg-[var(--accent)] text-[var(--accent-text)] text-[14px] font-semibold flex items-center justify-center gap-2"
        >
          <Play size={16} strokeWidth={2} />
          <span>
            {details.progress && details.progress.percent > 0
              ? "Resume"
              : "Play"}
          </span>
        </button>
        <button
          type="button"
          onClick={() =>
            activeStream && onDownload(details.title, activeStream)
          }
          aria-label={`Download ${details.title}`}
          className="min-h-[44px] min-w-[44px] px-3.5 rounded-[8px] bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] flex items-center justify-center"
        >
          <DownloadIcon size={18} strokeWidth={1.5} />
        </button>
        <button
          type="button"
          onClick={() => onToggleFavorite(details.id)}
          aria-label={
            isFavorite
              ? `Remove ${details.title} from Favorites`
              : `Add ${details.title} to Favorites`
          }
          className="min-h-[44px] min-w-[44px] px-3.5 rounded-[8px] bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] flex items-center justify-center"
        >
          <Heart
            size={18}
            strokeWidth={1.5}
            className={isFavorite ? "fill-[var(--accent)] text-[var(--accent)]" : ""}
          />
        </button>
      </div>
    </div>
  );
};
