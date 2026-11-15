import React, { useMemo, useState } from "react";
import {
  Check,
  Copy,
  Download as DownloadIcon,
  ExternalLink,
  Heart,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { ModalSheet } from "../ui/ModalSheet";
import { validateSourceInput } from "../../lib/catalogLogic";
import type {
  AddonItem,
  CatalogItem,
  Download,
  MediaDetails,
  PlayerOption,
  PlaylistItem,
  ProviderId,
  ProviderInfo,
  SubtitleLanguage,
} from "../../types";

/* 1. Provider Selector Modal */
interface ProviderModalProps {
  open: boolean;
  onClose: () => void;
  providers: ProviderInfo[];
  activeProvider: ProviderId;
  onSelect: (id: ProviderId) => void;
}

export const ProviderSelectorModal: React.FC<ProviderModalProps> = ({
  open,
  onClose,
  providers,
  activeProvider,
  onSelect,
}) => (
  <ModalSheet
    open={open}
    onClose={onClose}
    title="Select Catalog Provider"
    subtitle="Choose the active Rust scraper or local BDIX mirror"
  >
    <div className="space-y-2">
      {providers.map((p) => {
        const selected = p.id === activeProvider;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => {
              onSelect(p.id);
              onClose();
            }}
            className={`w-full text-left p-3.5 rounded-[12px] border transition-colors duration-150 flex items-start justify-between gap-3 ${
              selected
                ? "bg-[var(--surface-2)] border-[var(--accent)]"
                : "bg-[var(--bg-elev)] border-[var(--border)] hover:border-[var(--border-strong)]"
            }`}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-semibold text-[var(--text)]">
                  {p.name}
                </span>
                <span className="text-[11px] text-[var(--text-3)]">
                  · {p.status}
                </span>
              </div>
              <p className="text-[12px] text-[var(--text-2)] mt-1 leading-snug">
                {p.description}
              </p>
            </div>
            {selected && (
              <Check
                size={18}
                strokeWidth={1.75}
                className="text-[var(--accent)] shrink-0 mt-0.5"
              />
            )}
          </button>
        );
      })}
    </div>
  </ModalSheet>
);

/* 2. Media Player Selector Modal */
interface PlayerSelectorModalProps {
  open: boolean;
  onClose: () => void;
  value: PlayerOption;
  onSelect: (player: PlayerOption) => void;
}

const PLAYER_OPTIONS: { id: PlayerOption; note: string }[] = [
  { id: "Auto", note: "Built-in Termuflix player with local proxy buffering" },
  { id: "MPV", note: "External MPV intent with hardware decoding" },
  { id: "VLC", note: "External VLC player for broad container support" },
  { id: "IINA", note: "Desktop macOS native player handoff" },
  { id: "Android Player", note: "System ExoPlayer / Media3 chooser" },
];

export const PlayerSelectorModal: React.FC<PlayerSelectorModalProps> = ({
  open,
  onClose,
  value,
  onSelect,
}) => (
  <ModalSheet
    open={open}
    onClose={onClose}
    title="Default Media Player"
    subtitle="Used when launching streams from Details"
  >
    <div className="space-y-2">
      {PLAYER_OPTIONS.map((opt) => {
        const selected = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => {
              onSelect(opt.id);
              onClose();
            }}
            className={`w-full min-h-[52px] text-left px-3.5 py-2.5 rounded-[12px] border transition-colors duration-150 flex items-center justify-between gap-3 ${
              selected
                ? "bg-[var(--surface-2)] border-[var(--accent)]"
                : "bg-[var(--bg-elev)] border-[var(--border)] hover:border-[var(--border-strong)]"
            }`}
          >
            <div>
              <div className="text-[14px] font-medium text-[var(--text)]">
                {opt.id}
              </div>
              <div className="text-[12px] text-[var(--text-2)]">{opt.note}</div>
            </div>
            {selected && (
              <Check
                size={18}
                strokeWidth={1.75}
                className="text-[var(--accent)] shrink-0"
              />
            )}
          </button>
        );
      })}
    </div>
  </ModalSheet>
);

/* 3. Subtitle / Language Selector Modal */
interface SubtitleModalProps {
  open: boolean;
  onClose: () => void;
  value: SubtitleLanguage;
  onSelect: (lang: SubtitleLanguage) => void;
}

const SUBTITLE_OPTIONS: SubtitleLanguage[] = [
  "Off",
  "English",
  "Spanish",
  "Portuguese (BR)",
  "Multi",
];

export const SubtitleSelectorModal: React.FC<SubtitleModalProps> = ({
  open,
  onClose,
  value,
  onSelect,
}) => {
  const [query, setQuery] = useState("");
  const filtered = useMemo(
    () =>
      SUBTITLE_OPTIONS.filter((l) =>
        l.toLowerCase().includes(query.trim().toLowerCase())
      ),
    [query]
  );

  return (
    <ModalSheet
      open={open}
      onClose={onClose}
      title="Subtitles & Captions"
      subtitle="Select track or search language"
    >
      <div className="relative mb-3">
        <Search
          size={16}
          strokeWidth={1.5}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-3)]"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter languages..."
          aria-label="Filter subtitle languages"
          className="w-full min-h-[44px] pl-9 pr-3 rounded-[8px] bg-[var(--bg-elev)] border border-[var(--border)] text-[14px] text-[var(--text)] placeholder:text-[var(--text-3)]"
        />
      </div>
      <div className="space-y-1.5">
        {filtered.map((lang) => {
          const selected = lang === value;
          return (
            <button
              key={lang}
              type="button"
              onClick={() => {
                onSelect(lang);
                onClose();
              }}
              className={`w-full min-h-[44px] px-3.5 rounded-[8px] border flex items-center justify-between text-[14px] transition-colors duration-150 ${
                selected
                  ? "bg-[var(--surface-2)] border-[var(--accent)] text-[var(--text)] font-medium"
                  : "bg-[var(--bg-elev)] border-[var(--border)] text-[var(--text-2)] hover:text-[var(--text)]"
              }`}
            >
              <span>{lang}</span>
              {selected && <Check size={16} strokeWidth={1.75} />}
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-[13px] text-[var(--text-3)] py-4 text-center">
            No subtitle tracks match &ldquo;{query}&rdquo;.
          </p>
        )}
      </div>
    </ModalSheet>
  );
};

/* 4. Season / Episode Picker Modal */
interface EpisodePickerModalProps {
  open: boolean;
  onClose: () => void;
  details: MediaDetails | null;
  currentSeason?: number;
  currentEpisode?: number;
  onSelectEpisode: (season: number, episode: number) => void;
}

export const EpisodePickerModal: React.FC<EpisodePickerModalProps> = ({
  open,
  onClose,
  details,
  currentSeason = 1,
  currentEpisode = 1,
  onSelectEpisode,
}) => {
  const [seasonNum, setSeasonNum] = useState(currentSeason);

  if (!details || details.seasons.length === 0) return null;
  const activeSeason =
    details.seasons.find((s) => s.number === seasonNum) ?? details.seasons[0];

  return (
    <ModalSheet
      open={open}
      onClose={onClose}
      title="Seasons & Episodes"
      subtitle={details.title}
    >
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3">
        {details.seasons.map((s) => (
          <button
            key={s.number}
            type="button"
            onClick={() => setSeasonNum(s.number)}
            className={`min-h-[36px] px-3.5 rounded-full text-[12px] font-medium whitespace-nowrap border transition-colors duration-150 ${
              s.number === activeSeason.number
                ? "bg-[var(--accent)] text-[var(--accent-text)] border-[var(--accent)]"
                : "bg-[var(--surface-2)] text-[var(--text-2)] border-[var(--border)] hover:text-[var(--text)]"
            }`}
          >
            Season {s.number}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {activeSeason.episodes.map((ep) => {
          const isCurrent =
            activeSeason.number === currentSeason &&
            ep.number === currentEpisode;
          return (
            <button
              key={ep.number}
              type="button"
              onClick={() => {
                onSelectEpisode(activeSeason.number, ep.number);
                onClose();
              }}
              className={`w-full text-left p-3 rounded-[12px] border flex items-center justify-between gap-3 transition-colors duration-150 ${
                isCurrent
                  ? "bg-[var(--surface-2)] border-[var(--accent)]"
                  : "bg-[var(--bg-elev)] border-[var(--border)] hover:border-[var(--border-strong)]"
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-mono-tabular text-[var(--text-3)]">
                    E{ep.number.toString().padStart(2, "0")}
                  </span>
                  <span className="text-[14px] font-medium text-[var(--text)] truncate">
                    {ep.title}
                  </span>
                </div>
                <p className="text-[12px] text-[var(--text-2)] mt-0.5 line-clamp-1">
                  {ep.synopsis}
                </p>
              </div>
              <span className="text-[12px] font-mono-tabular text-[var(--text-3)] shrink-0">
                {ep.duration}
              </span>
            </button>
          );
        })}
      </div>
    </ModalSheet>
  );
};

/* 5. Live TV M3U Playlist Manager */
interface PlaylistManagerModalProps {
  open: boolean;
  onClose: () => void;
  playlists: PlaylistItem[];
  onAdd: (source: string) => void;
  onReload: (id: string) => void;
  onRemove: (id: string) => void;
}

export const PlaylistManagerModal: React.FC<PlaylistManagerModalProps> = ({
  open,
  onClose,
  playlists,
  onAdd,
  onReload,
  onRemove,
}) => {
  const [sourceInput, setSourceInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = validateSourceInput(sourceInput);
    if (!res.valid) {
      setError(res.error ?? "Invalid playlist source.");
      return;
    }
    setError(null);
    onAdd(res.normalized);
    setSourceInput("");
  };

  return (
    <ModalSheet
      open={open}
      onClose={onClose}
      title="Live TV Playlists"
      subtitle="Add M3U / M3U8 URLs or local Android file paths"
    >
      <form onSubmit={handleSubmit} className="space-y-2 mb-5">
        <label
          htmlFor="playlist-source-input"
          className="block text-[12px] font-medium text-[var(--text-2)]"
        >
          Playlist URL or file path
        </label>
        <div className="flex gap-2">
          <input
            id="playlist-source-input"
            type="text"
            value={sourceInput}
            onChange={(e) => {
              setSourceInput(e.target.value);
              if (error) setError(null);
            }}
            placeholder="https://example.com/channels.m3u"
            className="flex-1 min-w-0 min-h-[44px] px-3 rounded-[8px] bg-[var(--bg-elev)] border border-[var(--border)] text-[14px] text-[var(--text)] placeholder:text-[var(--text-3)]"
          />
          <button
            type="submit"
            className="min-h-[44px] px-4 rounded-[8px] bg-[var(--accent)] text-[var(--accent-text)] text-[13px] font-medium flex items-center gap-1.5 shrink-0 hover:opacity-90 transition-opacity duration-150"
          >
            <Plus size={16} strokeWidth={1.75} />
            <span>Add</span>
          </button>
        </div>
        {error && (
          <p className="text-[12px] text-[var(--error)]" role="alert">
            {error}
          </p>
        )}
      </form>

      <div className="space-y-2">
        {playlists.map((pl) => (
          <div
            key={pl.id}
            className="p-3 rounded-[12px] border border-[var(--border)] bg-[var(--bg-elev)] flex items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <div className="text-[14px] font-medium text-[var(--text)] truncate">
                {pl.name}
              </div>
              <div className="text-[11px] font-mono-tabular text-[var(--text-3)] truncate mt-0.5">
                {pl.source}
              </div>
              <div className="text-[12px] text-[var(--text-2)] mt-1">
                {pl.channelCount} channels · {pl.updatedAt}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => onReload(pl.id)}
                aria-label={`Reload ${pl.name}`}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-[8px] text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]"
              >
                <RefreshCw size={16} strokeWidth={1.5} />
              </button>
              <button
                type="button"
                onClick={() => onRemove(pl.id)}
                aria-label={`Remove ${pl.name}`}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-[8px] text-[var(--error)] hover:bg-[var(--surface-2)]"
              >
                <Trash2 size={16} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        ))}
        {playlists.length === 0 && (
          <p className="text-[13px] text-[var(--text-3)] text-center py-4">
            No M3U playlists configured.
          </p>
        )}
      </div>
    </ModalSheet>
  );
};

/* 6. Addons Manager Modal */
interface AddonManagerModalProps {
  open: boolean;
  onClose: () => void;
  addons: AddonItem[];
  onAdd: (manifestUrl: string) => void;
  onReload: (id: string) => void;
  onRemove: (id: string) => void;
}

export const AddonManagerModal: React.FC<AddonManagerModalProps> = ({
  open,
  onClose,
  addons,
  onAdd,
  onReload,
  onRemove,
}) => {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = validateSourceInput(url);
    if (!res.valid) {
      setError(res.error ?? "Invalid manifest URL.");
      return;
    }
    setError(null);
    onAdd(res.normalized);
    setUrl("");
  };

  return (
    <ModalSheet
      open={open}
      onClose={onClose}
      title="Addon Manifests"
      subtitle="Install community catalog and stream resolvers"
    >
      <form onSubmit={handleSubmit} className="space-y-2 mb-5">
        <label
          htmlFor="addon-manifest-input"
          className="block text-[12px] font-medium text-[var(--text-2)]"
        >
          Manifest URL
        </label>
        <div className="flex gap-2">
          <input
            id="addon-manifest-input"
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (error) setError(null);
            }}
            placeholder="https://addon.example.org/manifest.json"
            className="flex-1 min-w-0 min-h-[44px] px-3 rounded-[8px] bg-[var(--bg-elev)] border border-[var(--border)] text-[14px] text-[var(--text)] placeholder:text-[var(--text-3)]"
          />
          <button
            type="submit"
            className="min-h-[44px] px-4 rounded-[8px] bg-[var(--accent)] text-[var(--accent-text)] text-[13px] font-medium flex items-center gap-1.5 shrink-0 hover:opacity-90"
          >
            <Plus size={16} strokeWidth={1.75} />
            <span>Add</span>
          </button>
        </div>
        {error && (
          <p className="text-[12px] text-[var(--error)]" role="alert">
            {error}
          </p>
        )}
      </form>

      <div className="space-y-2">
        {addons.map((addon) => (
          <div
            key={addon.id}
            className="p-3 rounded-[12px] border border-[var(--border)] bg-[var(--bg-elev)] flex items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-medium text-[var(--text)] truncate">
                  {addon.name}
                </span>
                <span className="text-[11px] font-mono-tabular text-[var(--text-3)]">
                  v{addon.version}
                </span>
              </div>
              <p className="text-[11px] font-mono-tabular text-[var(--text-3)] truncate mt-0.5">
                {addon.manifestUrl}
              </p>
              <p className="text-[12px] text-[var(--text-2)] mt-1">
                {addon.catalogCount} catalogs
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => onReload(addon.id)}
                aria-label={`Reload ${addon.name}`}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-[8px] text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]"
              >
                <RefreshCw size={16} strokeWidth={1.5} />
              </button>
              <button
                type="button"
                onClick={() => onRemove(addon.id)}
                aria-label={`Remove ${addon.name}`}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-[8px] text-[var(--error)] hover:bg-[var(--surface-2)]"
              >
                <Trash2 size={16} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        ))}
        {addons.length === 0 && (
          <p className="text-[13px] text-[var(--text-3)] text-center py-4">
            No addon manifests installed.
          </p>
        )}
      </div>
    </ModalSheet>
  );
};

/* 7. Synopsis Modal */
interface SynopsisModalProps {
  open: boolean;
  onClose: () => void;
  details: MediaDetails | null;
}

export const SynopsisModal: React.FC<SynopsisModalProps> = ({
  open,
  onClose,
  details,
}) => {
  if (!details) return null;
  return (
    <ModalSheet
      open={open}
      onClose={onClose}
      title={details.title}
      subtitle={`${details.year} · ${details.runtime} · Directed by ${details.director}`}
    >
      <div className="space-y-4">
        <p className="text-[14px] text-[var(--text)] leading-relaxed">
          {details.synopsis}
        </p>
        <div className="pt-3 border-t border-[var(--border)] space-y-2">
          <div className="text-[12px] font-medium text-[var(--text-2)]">
            Cast
          </div>
          <p className="text-[13px] text-[var(--text)]">
            {details.cast.join(" · ")}
          </p>
        </div>
        <div className="space-y-1">
          <div className="text-[12px] font-medium text-[var(--text-2)]">
            Genres
          </div>
          <p className="text-[13px] text-[var(--text)]">
            {details.genres.join(" · ")}
          </p>
        </div>
      </div>
    </ModalSheet>
  );
};

/* 8. Update Modal */
interface UpdateModalProps {
  open: boolean;
  onClose: () => void;
  onUpdateNow: () => void;
  onCopyCommand: (cmd: string, label: string) => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
  open,
  onClose,
  onUpdateNow,
  onCopyCommand,
}) => {
  const brewCmd = "brew upgrade termuflix";
  const scoopCmd = "scoop update termuflix";

  return (
    <ModalSheet
      open={open}
      onClose={onClose}
      title="Update Available · v2.5.0"
      subtitle="Current version: v2.4.0 · Released November 2026"
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 rounded-[8px] border border-[var(--border)] bg-[var(--surface-2)] text-[13px] font-medium text-[var(--text)] hover:border-[var(--border-strong)]"
          >
            Later
          </button>
          <button
            type="button"
            onClick={() => {
              onUpdateNow();
              onClose();
            }}
            className="min-h-[44px] px-4 rounded-[8px] bg-[var(--accent)] text-[var(--accent-text)] text-[13px] font-medium hover:opacity-90"
          >
            Update now
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="space-y-2 text-[13px] text-[var(--text-2)]">
          <p className="text-[var(--text)] font-medium">Release highlights</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Faster BDIX CircleFTP &amp; DhakaFlix directory indexing in Rust engine.</li>
            <li>Adaptive HLS seek buffer pre-warming for local proxy playback.</li>
            <li>Improved Android Media3 subtitle track auto-selection.</li>
          </ul>
          <a
            href="#release-notes"
            onClick={(e) => {
              e.preventDefault();
              onCopyCommand("https://github.com/termuflix/termuflix/releases/tag/v2.5.0", "Release notes URL");
            }}
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--info)] hover:underline pt-1"
          >
            <span>Read full release notes</span>
            <ExternalLink size={13} strokeWidth={1.5} />
          </a>
        </div>

        <div className="space-y-2 pt-3 border-t border-[var(--border)]">
          <div className="text-[12px] font-medium text-[var(--text-2)]">
            Desktop CLI package managers
          </div>
          {[
            { label: "Homebrew", cmd: brewCmd },
            { label: "Scoop", cmd: scoopCmd },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between gap-2 px-3 py-2 rounded-[8px] bg-[var(--bg-elev)] border border-[var(--border)]"
            >
              <div className="min-w-0">
                <div className="text-[11px] text-[var(--text-3)]">
                  {item.label}
                </div>
                <code className="text-[12px] font-mono-tabular text-[var(--text)] truncate block">
                  {item.cmd}
                </code>
              </div>
              <button
                type="button"
                onClick={() => onCopyCommand(item.cmd, `${item.label} command`)}
                aria-label={`Copy ${item.label} command`}
                className="min-h-[36px] min-w-[36px] px-2.5 rounded-[8px] bg-[var(--surface-2)] border border-[var(--border)] text-[12px] text-[var(--text)] flex items-center gap-1.5 shrink-0 hover:border-[var(--border-strong)]"
              >
                <Copy size={13} strokeWidth={1.5} />
                <span>Copy</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </ModalSheet>
  );
};

/* 9. Destructive Confirmation Dialog */
interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onClose,
  title,
  description,
  confirmLabel,
  onConfirm,
}) => (
  <ModalSheet
    open={open}
    onClose={onClose}
    title={title}
    maxWidthClass="md:max-w-md"
    footer={
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="min-h-[44px] px-4 rounded-[8px] border border-[var(--border)] bg-[var(--surface-2)] text-[13px] font-medium text-[var(--text)] hover:border-[var(--border-strong)]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className="min-h-[44px] px-4 rounded-[8px] border border-[var(--border)] bg-[var(--surface-2)] text-[13px] font-semibold text-[var(--error)] hover:bg-[var(--surface-3)]"
        >
          {confirmLabel}
        </button>
      </div>
    }
  >
    <p className="text-[14px] text-[var(--text-2)] leading-relaxed">
      {description}
    </p>
  </ModalSheet>
);

/* 10. Help & Gestures / Shortcuts Sheet */
export const HelpShortcutsModal: React.FC<{
  open: boolean;
  onClose: () => void;
}> = ({ open, onClose }) => (
  <ModalSheet
    open={open}
    onClose={onClose}
    title="Gestures & Shortcuts"
    subtitle="Touch controls and keyboard navigation"
  >
    <div className="space-y-4">
      <div>
        <h3 className="text-[12px] font-medium text-[var(--text-3)] uppercase tracking-wider mb-2">
          Touch &amp; Mobile
        </h3>
        <div className="divide-y divide-[var(--border)] rounded-[12px] border border-[var(--border)] bg-[var(--bg-elev)]">
          {[
            ["Hold Continue Watching card", "Open Play, Download, Favorite actions"],
            ["Pull down on Home", "Refresh active catalog provider"],
            ["Tap player center", "Toggle play / pause overlay"],
          ].map(([gesture, desc]) => (
            <div
              key={gesture}
              className="px-3.5 py-2.5 flex items-center justify-between gap-4"
            >
              <span className="text-[13px] font-medium text-[var(--text)]">
                {gesture}
              </span>
              <span className="text-[12px] text-[var(--text-2)] text-right">
                {desc}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-[12px] font-medium text-[var(--text-3)] uppercase tracking-wider mb-2">
          Keyboard &amp; Player
        </h3>
        <div className="divide-y divide-[var(--border)] rounded-[12px] border border-[var(--border)] bg-[var(--bg-elev)]">
          {[
            ["Space", "Play or pause playback"],
            ["Left / Right", "Seek backward or forward 10s"],
            ["F", "Toggle fullscreen canvas"],
            ["Esc", "Close active sheet or exit player"],
          ].map(([key, desc]) => (
            <div
              key={key}
              className="px-3.5 py-2.5 flex items-center justify-between gap-4"
            >
              <kbd className="px-2 py-0.5 rounded-[6px] bg-[var(--surface-2)] border border-[var(--border)] text-[11px] font-mono-tabular text-[var(--text)]">
                {key}
              </kbd>
              <span className="text-[12px] text-[var(--text-2)] text-right">
                {desc}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </ModalSheet>
);

/* 11. Download Queue Sheet */
interface DownloadSheetModalProps {
  open: boolean;
  onClose: () => void;
  downloads: Download[];
  onTogglePause: (id: string) => void;
  onCancel: (id: string) => void;
  onOpenLibraryDownloads: () => void;
}

export const DownloadSheetModal: React.FC<DownloadSheetModalProps> = ({
  open,
  onClose,
  downloads,
  onTogglePause,
  onCancel,
  onOpenLibraryDownloads,
}) => {
  const activeCount = downloads.filter((d) => d.status !== "completed").length;

  return (
    <ModalSheet
      open={open}
      onClose={onClose}
      title="Downloads"
      subtitle={`${activeCount} in queue · ${downloads.length} total`}
      footer={
        <button
          type="button"
          onClick={() => {
            onOpenLibraryDownloads();
            onClose();
          }}
          className="w-full min-h-[44px] rounded-[8px] border border-[var(--border)] bg-[var(--surface-2)] text-[13px] font-medium text-[var(--text)] hover:border-[var(--border-strong)]"
        >
          Manage all in Library
        </button>
      }
    >
      <div className="space-y-2.5">
        {downloads.map((dl) => (
          <div
            key={dl.id}
            className="p-3 rounded-[12px] border border-[var(--border)] bg-[var(--bg-elev)] space-y-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[14px] font-medium text-[var(--text)] truncate">
                  {dl.title}
                </div>
                <div className="text-[12px] text-[var(--text-2)] font-mono-tabular mt-0.5">
                  {dl.status === "completed"
                    ? `${dl.size} · Ready offline`
                    : `${dl.progress}% · ${dl.speed} · ${dl.eta}`}
                </div>
              </div>
              {dl.status !== "completed" && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => onTogglePause(dl.id)}
                    aria-label={
                      dl.status === "paused"
                        ? `Resume ${dl.title}`
                        : `Pause ${dl.title}`
                    }
                    className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-[8px] bg-[var(--surface-2)] text-[var(--text)]"
                  >
                    {dl.status === "paused" ? (
                      <Play size={14} strokeWidth={1.5} />
                    ) : (
                      <Pause size={14} strokeWidth={1.5} />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => onCancel(dl.id)}
                    aria-label={`Cancel ${dl.title}`}
                    className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-[8px] bg-[var(--surface-2)] text-[var(--error)]"
                  >
                    <Trash2 size={14} strokeWidth={1.5} />
                  </button>
                </div>
              )}
            </div>
            <div className="h-1.5 w-full rounded-full bg-[var(--surface-3)] overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--accent)] transition-all duration-200"
                style={{ width: `${dl.progress}%` }}
              />
            </div>
          </div>
        ))}
        {downloads.length === 0 && (
          <p className="text-[13px] text-[var(--text-3)] text-center py-6">
            Download queue is empty.
          </p>
        )}
      </div>
    </ModalSheet>
  );
};

/* 12. Long-Press Quick Actions Sheet */
interface QuickActionsModalProps {
  item: CatalogItem | null;
  isFavorite: boolean;
  onClose: () => void;
  onPlay: (item: CatalogItem) => void;
  onDownload: (item: CatalogItem) => void;
  onToggleFavorite: (id: string) => void;
}

export const QuickActionsModal: React.FC<QuickActionsModalProps> = ({
  item,
  isFavorite,
  onClose,
  onPlay,
  onDownload,
  onToggleFavorite,
}) => {
  if (!item) return null;
  return (
    <ModalSheet
      open={Boolean(item)}
      onClose={onClose}
      title={item.title}
      subtitle={`${item.year} · ${item.type === "series" ? "Series" : "Movie"}`}
    >
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => {
            onPlay(item);
            onClose();
          }}
          className="w-full min-h-[48px] px-4 rounded-[12px] bg-[var(--accent)] text-[var(--accent-text)] font-medium text-[14px] flex items-center gap-3"
        >
          <Play size={18} strokeWidth={1.75} />
          <span>Play now</span>
        </button>
        <button
          type="button"
          onClick={() => {
            onDownload(item);
            onClose();
          }}
          className="w-full min-h-[48px] px-4 rounded-[12px] bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] font-medium text-[14px] flex items-center gap-3 hover:border-[var(--border-strong)]"
        >
          <DownloadIcon size={18} strokeWidth={1.5} />
          <span>Download for offline</span>
        </button>
        <button
          type="button"
          onClick={() => {
            onToggleFavorite(item.id);
            onClose();
          }}
          className="w-full min-h-[48px] px-4 rounded-[12px] bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] font-medium text-[14px] flex items-center gap-3 hover:border-[var(--border-strong)]"
        >
          <Heart
            size={18}
            strokeWidth={1.5}
            className={isFavorite ? "fill-[var(--accent)]" : ""}
          />
          <span>{isFavorite ? "Remove from Favorites" : "Add to Favorites"}</span>
        </button>
      </div>
    </ModalSheet>
  );
};
