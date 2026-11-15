import React, { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Cast,
  Captions,
  ExternalLink,
  HelpCircle,
  Loader2,
  Maximize,
  Minimize,
  Pause,
  PictureInPicture2,
  Play,
  RotateCcw,
  RotateCw,
  SkipForward,
  Volume2,
} from "lucide-react";
import { formatEpisodeCode, formatSecondsToClock } from "../../lib/catalogLogic";
import type { PlayerSession, SubtitleLanguage } from "../../types";

interface PlayerScreenProps {
  session: PlayerSession;
  onBack: () => void;
  onOpenSubtitles: () => void;
  onOpenHelp: () => void;
  onNextEpisode: () => void;
  onCast: () => void;
  onOpenExternal: () => void;
  onCycleAudio: () => void;
  onCycleQuality: () => void;
  subtitle: SubtitleLanguage;
}

export const PlayerScreen: React.FC<PlayerScreenProps> = ({
  session,
  onBack,
  onOpenSubtitles,
  onOpenHelp,
  onNextEpisode,
  onCast,
  onOpenExternal,
  onCycleAudio,
  onCycleQuality,
  subtitle,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showResumePrompt, setShowResumePrompt] = useState(
    session.startSeconds > 0
  );
  const [isPlaying, setIsPlaying] = useState(session.startSeconds === 0);
  const [currentSeconds, setCurrentSeconds] = useState(session.startSeconds);
  const [buffering, setBuffering] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [pipActive, setPipActive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const bufferedSeconds = Math.min(
    session.totalSeconds,
    currentSeconds + Math.round(session.totalSeconds * 0.14)
  );

  // Sync if session changes (e.g., Next episode clicked)
  useEffect(() => {
    setShowResumePrompt(session.startSeconds > 0);
    setIsPlaying(session.startSeconds === 0);
    setCurrentSeconds(session.startSeconds);
    setPlaybackError(null);
    setBuffering(false);
  }, [session]);

  // Simulated playback clock
  useEffect(() => {
    if (!isPlaying || showResumePrompt || buffering || playbackError) return;
    const id = window.setInterval(() => {
      setCurrentSeconds((prev) => {
        if (prev + 1 >= session.totalSeconds) {
          setIsPlaying(false);
          return session.totalSeconds;
        }
        return prev + 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [isPlaying, showResumePrompt, buffering, playbackError, session.totalSeconds]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (showResumePrompt) return;
      if (e.key === " ") {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.key === "ArrowLeft") {
        setCurrentSeconds((s) => Math.max(0, s - 10));
      } else if (e.key === "ArrowRight") {
        setCurrentSeconds((s) => Math.min(session.totalSeconds, s + 10));
      } else if (e.key === "f" || e.key === "F") {
        setIsFullscreen((fs) => !fs);
      } else if (e.key === "Escape") {
        onBack();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showResumePrompt, session.totalSeconds, onBack]);

  const epCode = formatEpisodeCode(session.season, session.episode);
  const progressPct =
    session.totalSeconds > 0
      ? Math.min(100, (currentSeconds / session.totalSeconds) * 100)
      : 0;
  const bufferedPct =
    session.totalSeconds > 0
      ? Math.min(100, (bufferedSeconds / session.totalSeconds) * 100)
      : 0;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && containerRef.current?.requestFullscreen) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    } else {
      setIsFullscreen((v) => !v);
    }
  };

  const triggerBufferingPreview = () => {
    setBuffering(true);
    window.setTimeout(() => {
      setBuffering(false);
    }, 1200);
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-[#050607] text-[var(--text)] flex flex-col justify-between select-none"
    >
      {/* Top Overlay Bar */}
      <div className="p-4 md:px-6 pt-safe flex items-center justify-between gap-3 bg-gradient-to-b from-black/80 to-transparent z-10">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            aria-label="Exit player"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-[8px] hover:bg-white/10 transition-colors"
          >
            <ArrowLeft size={20} strokeWidth={1.5} />
          </button>
          <div className="min-w-0">
            <h1 className="text-[15px] md:text-[16px] font-semibold truncate">
              {session.title}
            </h1>
            {(epCode || session.episodeTitle) && (
              <p className="text-[12px] text-[var(--text-2)] font-mono-tabular truncate">
                {epCode}
                {session.episodeTitle ? ` · ${session.episodeTitle}` : ""}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setPlaybackError("Proxy stream socket reset (ECONNRESET).")}
            className="hidden sm:inline-flex min-h-[36px] px-2.5 rounded-[8px] border border-[var(--border)] text-[11px] text-[var(--text-3)] hover:text-[var(--text)] mr-1"
          >
            Test error
          </button>
          <button
            type="button"
            onClick={triggerBufferingPreview}
            className="hidden sm:inline-flex min-h-[36px] px-2.5 rounded-[8px] border border-[var(--border)] text-[11px] text-[var(--text-3)] hover:text-[var(--text)] mr-1"
          >
            Buffer
          </button>
          <button
            type="button"
            onClick={onCast}
            aria-label="Cast to device"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-[8px] hover:bg-white/10 transition-colors"
          >
            <Cast size={19} strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={onOpenHelp}
            aria-label="Player shortcuts"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-[8px] hover:bg-white/10 transition-colors"
          >
            <HelpCircle size={19} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Center 16:9 Cinema Frame + Play/Pause / Buffering / Error */}
      <div className="flex-1 flex items-center justify-center px-4 relative">
        <div className="w-full max-w-5xl aspect-video rounded-[12px] bg-[#08090C] border border-[var(--border)]/60 relative flex items-center justify-center overflow-hidden">
          {/* Subtle cinema frame lines */}
          <div
            aria-hidden="true"
            className="absolute inset-6 border border-white/[0.03] rounded-[8px] pointer-events-none"
          />

          {playbackError ? (
            <div className="text-center px-6 space-y-3 max-w-md z-10">
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--error)]">
                <AlertTriangle size={20} strokeWidth={1.5} />
              </div>
              <h2 className="text-[16px] font-semibold text-[var(--text)]">
                Playback error
              </h2>
              <p className="text-[13px] text-[var(--text-2)]">
                {playbackError}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setPlaybackError(null);
                    setIsPlaying(true);
                  }}
                  className="min-h-[44px] px-4 rounded-[8px] bg-[var(--accent)] text-[var(--accent-text)] text-[13px] font-semibold"
                >
                  Retry
                </button>
                <button
                  type="button"
                  onClick={onOpenExternal}
                  className="min-h-[44px] px-4 rounded-[8px] bg-[var(--surface-2)] border border-[var(--border)] text-[13px] font-medium text-[var(--text)] flex items-center gap-1.5"
                >
                  <ExternalLink size={14} strokeWidth={1.5} />
                  <span>Open in external player</span>
                </button>
              </div>
            </div>
          ) : buffering ? (
            <div className="flex flex-col items-center gap-2.5">
              <Loader2
                size={34}
                strokeWidth={1.5}
                className="animate-spin text-[var(--accent)]"
              />
              <span className="text-[12px] text-[var(--text-2)]">
                Buffering local proxy stream…
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-6 sm:gap-10 z-10">
              <button
                type="button"
                onClick={() =>
                  setCurrentSeconds((s) => Math.max(0, s - 10))
                }
                aria-label="Rewind 10 seconds"
                className="min-h-[48px] min-w-[48px] rounded-full bg-black/50 border border-[var(--border)] flex items-center justify-center text-[var(--text-2)] hover:text-[var(--text)] transition-colors"
              >
                <RotateCcw size={20} strokeWidth={1.5} />
              </button>

              <button
                type="button"
                onClick={() => setIsPlaying((p) => !p)}
                aria-label={isPlaying ? "Pause playback" : "Play playback"}
                className="w-16 h-16 rounded-full bg-[var(--accent)] text-[var(--accent-text)] flex items-center justify-center hover:opacity-90 transition-opacity shadow-[var(--shadow-soft)]"
              >
                {isPlaying ? (
                  <Pause size={26} strokeWidth={2} />
                ) : (
                  <Play size={26} strokeWidth={2} className="ml-0.5" />
                )}
              </button>

              <button
                type="button"
                onClick={() =>
                  setCurrentSeconds((s) =>
                    Math.min(session.totalSeconds, s + 10)
                  )
                }
                aria-label="Forward 10 seconds"
                className="min-h-[48px] min-w-[48px] rounded-full bg-black/50 border border-[var(--border)] flex items-center justify-center text-[var(--text-2)] hover:text-[var(--text)] transition-colors"
              >
                <RotateCw size={20} strokeWidth={1.5} />
              </button>
            </div>
          )}

          {/* Subtitle preview overlay */}
          {subtitle !== "Off" && isPlaying && !playbackError && !buffering && (
            <div className="absolute bottom-4 inset-x-4 flex justify-center pointer-events-none">
              <span className="px-3 py-1 rounded-[6px] bg-black/75 text-[13px] text-[var(--text)]">
                [{subtitle} captions active]
              </span>
            </div>
          )}

          {pipActive && (
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-[6px] bg-[var(--surface-2)] border border-[var(--border)] text-[11px] text-[var(--text-2)]">
              PiP ready
            </div>
          )}
        </div>
      </div>

      {/* Bottom Controls Bar */}
      <div className="px-4 md:px-6 pb-4 pb-safe pt-3 bg-gradient-to-t from-black/90 to-transparent space-y-3 z-10">
        {/* Seekbar with buffered range */}
        <div className="space-y-1.5">
          <div className="relative h-5 flex items-center">
            <div className="absolute inset-x-0 h-1.5 rounded-full bg-[var(--surface-3)] overflow-hidden pointer-events-none">
              <div
                className="h-full bg-[var(--border-strong)]"
                style={{ width: `${bufferedPct}%` }}
              />
            </div>
            <div
              className="absolute left-0 h-1.5 rounded-full bg-[var(--accent)] pointer-events-none"
              style={{ width: `${progressPct}%` }}
            />
            <input
              type="range"
              min={0}
              max={session.totalSeconds}
              value={currentSeconds}
              onChange={(e) => setCurrentSeconds(Number(e.target.value))}
              aria-label="Seek timeline"
              className="w-full h-5 opacity-0 cursor-pointer relative z-10"
            />
          </div>

          <div className="flex items-center justify-between text-[12px] font-mono-tabular text-[var(--text-2)]">
            <span>{formatSecondsToClock(currentSeconds)}</span>
            <span>{formatSecondsToClock(session.totalSeconds)}</span>
          </div>
        </div>

        {/* Utility Buttons */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={onCycleAudio}
              className="min-h-[40px] px-3 rounded-[8px] bg-[var(--surface)] border border-[var(--border)] text-[12px] text-[var(--text)] flex items-center gap-1.5 hover:border-[var(--border-strong)]"
            >
              <Volume2 size={14} strokeWidth={1.5} />
              <span className="truncate max-w-[96px]">
                {session.audioTrack}
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenSubtitles}
              className="min-h-[40px] px-3 rounded-[8px] bg-[var(--surface)] border border-[var(--border)] text-[12px] text-[var(--text)] flex items-center gap-1.5 hover:border-[var(--border-strong)]"
            >
              <Captions size={14} strokeWidth={1.5} />
              <span>{subtitle}</span>
            </button>

            <button
              type="button"
              onClick={onCycleQuality}
              className="min-h-[40px] px-3 rounded-[8px] bg-[var(--surface)] border border-[var(--border)] text-[12px] font-mono-tabular text-[var(--text)] hover:border-[var(--border-strong)]"
            >
              {session.quality}
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {session.hasNextEpisode && (
              <button
                type="button"
                onClick={onNextEpisode}
                className="min-h-[40px] px-3.5 rounded-[8px] bg-[var(--accent)] text-[var(--accent-text)] text-[12px] font-semibold flex items-center gap-1.5 hover:opacity-90"
              >
                <span>Next episode</span>
                <SkipForward size={14} strokeWidth={1.75} />
              </button>
            )}

            <button
              type="button"
              onClick={() => setPipActive((p) => !p)}
              aria-label="Toggle Picture in Picture"
              className={`min-h-[40px] min-w-[40px] flex items-center justify-center rounded-[8px] border ${
                pipActive
                  ? "bg-[var(--surface-3)] border-[var(--accent)] text-[var(--text)]"
                  : "bg-[var(--surface)] border-[var(--border)] text-[var(--text-2)]"
              }`}
            >
              <PictureInPicture2 size={16} strokeWidth={1.5} />
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-[8px] bg-[var(--surface)] border border-[var(--border)] text-[var(--text-2)] hover:text-[var(--text)]"
            >
              {isFullscreen ? (
                <Minimize size={16} strokeWidth={1.5} />
              ) : (
                <Maximize size={16} strokeWidth={1.5} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Resume Confirmation Modal */}
      {showResumePrompt && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Resume playback"
          className="fixed inset-0 z-20 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="w-full max-w-sm rounded-[16px] border border-[var(--border-strong)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)] space-y-4">
            <div className="space-y-1">
              <h2 className="text-[16px] font-semibold text-[var(--text)]">
                Resume from {formatSecondsToClock(session.startSeconds)}?
              </h2>
              <p className="text-[13px] text-[var(--text-2)]">
                You previously watched part of {session.title}
                {epCode ? ` (${epCode})` : ""}.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setCurrentSeconds(0);
                  setShowResumePrompt(false);
                  setIsPlaying(true);
                }}
                className="flex-1 min-h-[44px] rounded-[8px] border border-[var(--border)] bg-[var(--surface-2)] text-[13px] font-medium text-[var(--text)] hover:border-[var(--border-strong)]"
              >
                Start over
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurrentSeconds(session.startSeconds);
                  setShowResumePrompt(false);
                  setIsPlaying(true);
                }}
                className="flex-1 min-h-[44px] rounded-[8px] bg-[var(--accent)] text-[var(--accent-text)] text-[13px] font-semibold hover:opacity-90"
              >
                Resume
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
