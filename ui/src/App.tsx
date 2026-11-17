import { useCallback, useEffect, useMemo, useState } from "react";
import { httpApi, mockApi } from "./lib/api";

const api = import.meta.env.VITE_USE_MOCK === "true" ? mockApi : httpApi;
import { findNextEpisode } from "./lib/catalogLogic";
import {
  INITIAL_FAVORITE_IDS,
  INITIAL_RECENT_SEARCHES,
  MOCK_CHANNELS,
  MOCK_MEDIA,
  PROVIDERS,
} from "./data/mock";
import { AppShell } from "./components/layout/AppShell";
import { HomeScreen } from "./components/screens/HomeScreen";
import { SearchScreen } from "./components/screens/SearchScreen";
import { DetailsScreen } from "./components/screens/DetailsScreen";
import { PlayerScreen } from "./components/screens/PlayerScreen";
import { LiveTvScreen } from "./components/screens/LiveTvScreen";
import {
  LibraryScreen,
  type LibraryTab,
} from "./components/screens/LibraryScreen";
import { SettingsScreen } from "./components/screens/SettingsScreen";
import {
  AddonManagerModal,
  ConfirmDialog,
  DownloadSheetModal,
  HelpShortcutsModal,
  PlayerSelectorModal,
  PlaylistManagerModal,
  ProviderSelectorModal,
  QuickActionsModal,
  SubtitleSelectorModal,
  SynopsisModal,
  UpdateModal,
} from "./components/modals/AppModals";
import { ToastContainer } from "./components/ui/ToastContainer";
import type {
  AddonItem,
  AppSettings,
  CatalogItem,
  Channel,
  Download,
  HomeMode,
  MediaDetails,
  PlayerSession,
  PlaylistItem,
  ProviderId,
  Route,
  Stream,
  SubtitleLanguage,
  ToastLevel,
  ToastMessage,
} from "./types";

const DOWNLOAD_FOLDERS = [
  "/storage/emulated/0/Download/Termuflix",
  "/storage/emulated/0/Movies/Termuflix",
  "/sdcard/Termuflix/Offline",
];

export default function App() {
  const [route, setRoute] = useState<Route>("home");
  const [returnRoute, setReturnRoute] = useState<Route>("home");
  const [homeMode, setHomeMode] = useState<HomeMode>("streaming");
  const [libraryTab, setLibraryTab] = useState<LibraryTab>("continue");

  // Catalog & active media
  const [activeProviderId, setActiveProviderId] =
    useState<ProviderId>("moviebox");
  const [catalog, setCatalog] = useState<CatalogItem[]>(MOCK_MEDIA);
  const [catalogLoading, setCatalogLoading] = useState<boolean>(true);
  const [searchInitialQuery, setSearchInitialQuery] = useState<string>("");
  const [recentSearches, setRecentSearches] = useState<string[]>(
    INITIAL_RECENT_SEARCHES
  );

  // Selected Details & Player
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const [mediaDetails, setMediaDetails] = useState<MediaDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState<boolean>(false);
  const [playerSession, setPlayerSession] = useState<PlayerSession | null>(
    null
  );
  const [subtitleLang, setSubtitleLang] = useState<SubtitleLanguage>("English");

  // User Library state
  const [favoriteIds, setFavoriteIds] = useState<string[]>(INITIAL_FAVORITE_IDS);
  const [continueIds, setContinueIds] = useState<string[]>(() =>
    MOCK_MEDIA.filter((m) => m.progress && m.progress.percent > 0).map(
      (m) => m.id
    )
  );
  const [historyIds, setHistoryIds] = useState<string[]>([
    "dune-part-two",
    "severance",
    "frieren",
    "oppenheimer",
  ]);
  const [downloads, setDownloads] = useState<Download[]>([]);

  // Live TV & Addons
  const [playlists, setPlaylists] = useState<PlaylistItem[]>([]);
  const [channels, setChannels] = useState<Channel[]>(MOCK_CHANNELS);
  const [addons, setAddons] = useState<AddonItem[]>([]);

  // Settings & Connectivity
  const [engineOnline, setEngineOnline] = useState<boolean>(true);
  const [settings, setSettings] = useState<AppSettings>({
    automaticUpdates: true,
    defaultPlayer: "Auto",
    downloadFolder: DOWNLOAD_FOLDERS[0],
    streamingMode: true,
    liveTvMode: true,
    theme: "graphite",
    enabledProviders: {
      moviebox: true,
      "4khdhub": true,
      dramachi: true,
      "bdix-circleftp": true,
      "bdix-dhakaflix": true,
      addons: true,
    },
  });

  // Modals & Toasts
  const [providerModalOpen, setProviderModalOpen] = useState(false);
  const [playerModalOpen, setPlayerModalOpen] = useState(false);
  const [subtitleModalOpen, setSubtitleModalOpen] = useState(false);
  const [playlistModalOpen, setPlaylistModalOpen] = useState(false);
  const [addonModalOpen, setAddonModalOpen] = useState(false);
  const [synopsisModalOpen, setSynopsisModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [quickActionItem, setQuickActionItem] = useState<CatalogItem | null>(
    null
  );
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    onConfirm: () => void;
  } | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const pushToast = useCallback((level: ToastLevel, message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [{ id, level, message }, ...prev].slice(0, 3));
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Apply neutral dark theme attribute
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", settings.theme);
  }, [settings.theme]);

  // Initial load from mockApi
  useEffect(() => {
    let active = true;
    (async () => {
      const [dl, pl, ad] = await Promise.all([
        api.getDownloads(),
        api.getPlaylists(),
        api.getAddons(),
      ]);
      if (!active) return;
      setDownloads(dl);
      setPlaylists(pl);
      setAddons(ad);
    })();
    return () => {
      active = false;
    };
  }, []);

  const loadHomeCatalog = useCallback(async (provider: ProviderId) => {
    setCatalogLoading(true);
    try {
      const items = await api.getHomeCatalog(provider);
      setCatalog(items);
    } catch (e) {
      console.error("Failed to load catalog:", e);
      pushToast("ERROR", "Could not reach the local engine");
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHomeCatalog(activeProviderId);
  }, [activeProviderId, loadHomeCatalog]);

  const providersList = useMemo(
    () =>
      PROVIDERS.map((p) => ({
        ...p,
        enabled: settings.enabledProviders[p.id],
      })),
    [settings.enabledProviders]
  );

  const activeProvider = useMemo(
    () =>
      providersList.find((p) => p.id === activeProviderId) ?? providersList[0],
    [providersList, activeProviderId]
  );

  const continueItems = useMemo(
    () => MOCK_MEDIA.filter((m) => continueIds.includes(m.id)),
    [continueIds]
  );

  const historyItems = useMemo(
    () => MOCK_MEDIA.filter((m) => historyIds.includes(m.id)),
    [historyIds]
  );

  const favoriteItems = useMemo(
    () => MOCK_MEDIA.filter((m) => favoriteIds.includes(m.id)),
    [favoriteIds]
  );

  const navigateTo = (next: Route) => {
    if (next !== "details" && next !== "player") {
      setReturnRoute(next);
    }
    setRoute(next);
  };

  const openDetails = async (id: string) => {
    if (route !== "details" && route !== "player") {
      setReturnRoute(route);
    }
    setSelectedMediaId(id);
    setRoute("details");
    setDetailsLoading(true);
    const details = await api.getMediaDetails(id);
    setMediaDetails(details);
    setDetailsLoading(false);
  };

  const startPlayback = (
    details: MediaDetails,
    options: {
      stream: Stream;
      season?: number;
      episode?: number;
      audioTrack: string;
      forceStartSeconds?: number;
    }
  ) => {
    if (settings.defaultPlayer !== "Auto") {
      pushToast(
        "INFO",
        `Handing off "${details.title}" (${options.stream.resolution}) to ${settings.defaultPlayer}.`
      );
    }

    const epObj =
      options.season && options.episode
        ? details.seasons
            .find((s) => s.number === options.season)
            ?.episodes.find((e) => e.number === options.episode)
        : undefined;

    const totalSeconds =
      epObj?.durationSeconds ?? details.progress?.totalSeconds ?? 5400;

    let startSeconds = 0;
    if (typeof options.forceStartSeconds === "number") {
      startSeconds = options.forceStartSeconds;
    } else if (
      details.progress &&
      (!options.season ||
        (details.progress.season === options.season &&
          details.progress.episode === options.episode))
    ) {
      startSeconds = details.progress.currentSeconds;
    } else if (epObj?.progress && epObj.progress > 0 && epObj.progress < 100) {
      startSeconds = Math.round((epObj.progress / 100) * totalSeconds);
    }

    const hasNext =
      options.season && options.episode
        ? Boolean(findNextEpisode(details, options.season, options.episode))
        : false;

    setHistoryIds((prev) => [details.id, ...prev.filter((i) => i !== details.id)]);
    setContinueIds((prev) => [
      details.id,
      ...prev.filter((i) => i !== details.id),
    ]);

    setPlayerSession({
      mediaId: details.id,
      title: details.title,
      type: details.type,
      season: options.season,
      episode: options.episode,
      episodeTitle: epObj?.title,
      streamId: options.stream.id,
      quality: options.stream.resolution,
      audioTrack: options.audioTrack,
      subtitle: subtitleLang,
      startSeconds,
      totalSeconds,
      hasNextEpisode: hasNext,
    });
    setRoute("player");
  };

  const handleNextEpisode = () => {
    if (!playerSession || !mediaDetails) return;
    if (!playerSession.season || !playerSession.episode) return;
    const next = findNextEpisode(
      mediaDetails,
      playerSession.season,
      playerSession.episode
    );
    if (!next) return;
    const stream =
      mediaDetails.streams.find((s) => s.id === playerSession.streamId) ??
      mediaDetails.streams[0];
    if (!stream) return;

    startPlayback(mediaDetails, {
      stream,
      season: next.season,
      episode: next.episode,
      audioTrack: playerSession.audioTrack,
      forceStartSeconds: 0,
    });
    pushToast(
      "INFO",
      `Playing S${next.season.toString().padStart(2, "0")}E${next.episode
        .toString()
        .padStart(2, "0")}: ${next.title}`
    );
  };

  const handleToggleFavorite = (id: string) => {
    const exists = favoriteIds.includes(id);
    const title = MOCK_MEDIA.find((m) => m.id === id)?.title ?? "Title";
    setFavoriteIds((prev) =>
      exists ? prev.filter((item) => item !== id) : [id, ...prev]
    );
    pushToast(
      exists ? "INFO" : "SUCCESS",
      exists ? `Removed "${title}" from Favorites` : `Saved "${title}" to Favorites`
    );
  };

  const handleAddDownload = (label: string, stream: Stream, mediaId?: string) => {
    const id = `dl-${Date.now()}`;
    const newDl: Download = {
      id,
      mediaId: mediaId ?? selectedMediaId ?? "custom",
      title: label,
      subtitle: `${stream.resolution} · ${stream.source}`,
      progress: 12,
      speed: "11.8 MB/s",
      eta: "03:10 left",
      size: stream.size,
      status: "downloading",
    };
    setDownloads((prev) => [newDl, ...prev]);
    pushToast("SUCCESS", `Added "${label}" (${stream.resolution}) to downloads`);
  };

  const handleToggleDownloadPause = (id: string) => {
    setDownloads((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        const nextStatus = d.status === "paused" ? "downloading" : "paused";
        return {
          ...d,
          status: nextStatus,
          speed: nextStatus === "paused" ? "0 MB/s" : "13.4 MB/s",
          eta: nextStatus === "paused" ? "Paused" : "01:55 left",
        };
      })
    );
  };

  const handleCancelDownload = (id: string) => {
    setDownloads((prev) => prev.filter((d) => d.id !== id));
    pushToast("INFO", "Removed item from download queue");
  };

  const handlePlayChannel = (ch: Channel) => {
    setPlayerSession({
      mediaId: ch.id,
      title: ch.name,
      type: "series",
      episodeTitle: ch.now,
      streamId: ch.id,
      quality: "1080p",
      audioTrack: "Stereo",
      subtitle: "Off",
      startSeconds: 0,
      totalSeconds: 3600,
      hasNextEpisode: false,
    });
    setReturnRoute(route === "home" ? "home" : "live");
    setRoute("player");
  };

  const handleAddPlaylist = (source: string) => {
    const nameGuess = source.split("/").pop()?.replace(/\.m3u8?$/i, "") || "Custom M3U";
    const newPl: PlaylistItem = {
      id: `pl-${Date.now()}`,
      name: nameGuess,
      source,
      channelCount: 8,
      updatedAt: "Synced just now",
    };
    setPlaylists((prev) => [newPl, ...prev]);
    if (channels.length === 0) {
      setChannels(MOCK_CHANNELS.slice(0, 3));
    }
    pushToast("SUCCESS", `Imported playlist "${nameGuess}"`);
  };

  const handleRemovePlaylist = (id: string) => {
    setPlaylists((prev) => {
      const next = prev.filter((p) => p.id !== id);
      if (next.length === 0) {
        setChannels([]);
      }
      return next;
    });
    pushToast("INFO", "Playlist removed");
  };

  const handleReloadPlaylist = (id: string) => {
    setPlaylists((prev) =>
      prev.map((p) => (p.id === id ? { ...p, updatedAt: "Synced just now" } : p))
    );
    pushToast("SUCCESS", "Playlist channels refreshed");
  };

  const handleAddAddon = (manifestUrl: string) => {
    const slug =
      manifestUrl.replace(/^https?:\/\//, "").split("/")[0] || "Community Addon";
    const newAddon: AddonItem = {
      id: `addon-${Date.now()}`,
      name: slug,
      manifestUrl,
      version: "1.0.0",
      catalogCount: 2,
      enabled: true,
    };
    setAddons((prev) => [newAddon, ...prev]);
    pushToast("SUCCESS", `Installed addon "${slug}"`);
  };

  const handleCopyText = (text: string, label: string) => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    pushToast("SUCCESS", `${label} copied to clipboard`);
  };

  const activeDownloadCount = downloads.filter(
    (d) => d.status !== "completed"
  ).length;

  // Fullscreen route overrides (Details & Player)
  if (route === "player" && playerSession) {
    return (
      <>
        <PlayerScreen
          session={playerSession}
          subtitle={subtitleLang}
          onBack={() => setRoute(selectedMediaId ? "details" : returnRoute)}
          onOpenSubtitles={() => setSubtitleModalOpen(true)}
          onOpenHelp={() => setHelpModalOpen(true)}
          onNextEpisode={handleNextEpisode}
          onCast={() =>
            pushToast("INFO", "Scanning local network for DLNA / Cast receivers…")
          }
          onOpenExternal={() =>
            pushToast(
              "INFO",
              `Opening stream in ${
                settings.defaultPlayer === "Auto"
                  ? "MPV"
                  : settings.defaultPlayer
              }`
            )
          }
          onCycleAudio={() => {
            const tracks = mediaDetails?.audio ?? ["English (Original)", "Spanish (Latin)"];
            const idx = tracks.indexOf(playerSession.audioTrack);
            const nextTrack = tracks[(idx + 1) % tracks.length];
            setPlayerSession((s) => (s ? { ...s, audioTrack: nextTrack } : s));
            pushToast("INFO", `Audio track: ${nextTrack}`);
          }}
          onCycleQuality={() => {
            const qualities = ["4K", "1080p", "720p"];
            const idx = qualities.indexOf(playerSession.quality);
            const nextQ = qualities[(idx + 1) % qualities.length];
            setPlayerSession((s) => (s ? { ...s, quality: nextQ } : s));
            pushToast("INFO", `Stream quality switched to ${nextQ}`);
          }}
        />
        <SubtitleSelectorModal
          open={subtitleModalOpen}
          onClose={() => setSubtitleModalOpen(false)}
          value={subtitleLang}
          onSelect={(lang) => {
            setSubtitleLang(lang);
            pushToast("INFO", `Subtitles: ${lang}`);
          }}
        />
        <HelpShortcutsModal
          open={helpModalOpen}
          onClose={() => setHelpModalOpen(false)}
        />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  if (route === "details") {
    return (
      <>
        <DetailsScreen
          details={mediaDetails}
          loading={detailsLoading}
          isFavorite={
            mediaDetails ? favoriteIds.includes(mediaDetails.id) : false
          }
          onBack={() => setRoute(returnRoute)}
          onToggleFavorite={handleToggleFavorite}
          onOpenSynopsis={() => setSynopsisModalOpen(true)}
          onPlay={(opts) => {
            if (mediaDetails) startPlayback(mediaDetails, opts);
          }}
          onDownload={(label, stream) =>
            handleAddDownload(label, stream, mediaDetails?.id)
          }
          onOpenExternalPlayer={(stream) =>
            pushToast(
              "INFO",
              `Launched ${stream.resolution} stream in ${
                settings.defaultPlayer === "Auto"
                  ? "Android Player"
                  : settings.defaultPlayer
              }`
            )
          }
          onCopyUrl={(url) => handleCopyText(url, "Proxy stream URL")}
        />
        <SynopsisModal
          open={synopsisModalOpen}
          onClose={() => setSynopsisModalOpen(false)}
          details={mediaDetails}
        />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  return (
    <>
      <AppShell
        route={route}
        onNavigate={navigateTo}
        homeMode={homeMode}
        onHomeModeChange={setHomeMode}
        activeProvider={activeProvider}
        onOpenProviders={() => setProviderModalOpen(true)}
        onOpenDownloads={() => setDownloadModalOpen(true)}
        onOpenHelp={() => setHelpModalOpen(true)}
        activeDownloadCount={activeDownloadCount}
        engineOnline={engineOnline}
        onRetryEngine={() => {
          setEngineOnline(true);
          pushToast("SUCCESS", "Connected to local engine at 127.0.0.1:8080");
        }}
      >
        {route === "home" && (
          <HomeScreen
            catalog={catalog}
            continueItems={continueItems}
            favoriteItems={favoriteItems}
            channels={channels}
            loading={catalogLoading}
            homeMode={homeMode}
            activeProvider={activeProvider}
            onRefresh={() => {
              loadHomeCatalog(activeProviderId);
              pushToast("INFO", `Refreshed ${activeProvider.name} catalog`);
            }}
            onOpenSearch={(q = "") => {
              setSearchInitialQuery(q);
              navigateTo("search");
            }}
            onSelectMedia={openDetails}
            onLongPressItem={(item) => setQuickActionItem(item)}
            onPlayChannel={handlePlayChannel}
            onOpenPlaylists={() => setPlaylistModalOpen(true)}
            onSwitchToLiveTab={() => navigateTo("live")}
          />
        )}

        {route === "search" && (
          <SearchScreen
            api={api}
            initialQuery={searchInitialQuery}
            activeProvider={activeProvider}
            recentSearches={recentSearches}
            onAddRecentSearch={(term) =>
              setRecentSearches((prev) =>
                [term, ...prev.filter((t) => t !== term)].slice(0, 6)
              )
            }
            onRemoveRecentSearch={(term) =>
              setRecentSearches((prev) => prev.filter((t) => t !== term))
            }
            onOpenProviders={() => setProviderModalOpen(true)}
            onSelectMedia={openDetails}
          />
        )}

        {route === "live" && (
          <LiveTvScreen
            channels={channels}
            liveTvEnabled={settings.liveTvMode}
            onPlayChannel={handlePlayChannel}
            onOpenPlaylists={() => setPlaylistModalOpen(true)}
            onEnableLiveTv={() => {
              setSettings((s) => ({ ...s, liveTvMode: true }));
              pushToast("SUCCESS", "Live TV mode enabled");
            }}
          />
        )}

        {route === "library" && (
          <LibraryScreen
            initialTab={libraryTab}
            continueItems={continueItems}
            historyItems={historyItems}
            favoriteItems={favoriteItems}
            downloads={downloads}
            onSelectMedia={openDetails}
            onRemoveContinue={(id) => {
              setContinueIds((prev) => prev.filter((x) => x !== id));
              pushToast("INFO", "Removed from Continue watching");
            }}
            onRemoveHistory={(id) => {
              setHistoryIds((prev) => prev.filter((x) => x !== id));
              pushToast("INFO", "Removed from Watch history");
            }}
            onToggleDownloadPause={handleToggleDownloadPause}
            onCancelDownload={handleCancelDownload}
            onExploreCatalog={() => navigateTo("home")}
          />
        )}

        {route === "settings" && (
          <SettingsScreen
            settings={settings}
            providers={providersList}
            engineOnline={engineOnline}
            onUpdateSettings={(patch) =>
              setSettings((prev) => ({ ...prev, ...patch }))
            }
            onToggleProvider={(id) =>
              setSettings((prev) => ({
                ...prev,
                enabledProviders: {
                  ...prev.enabledProviders,
                  [id]: !prev.enabledProviders[id],
                },
              }))
            }
            onOpenPlayerSelector={() => setPlayerModalOpen(true)}
            onChangeDownloadFolder={() => {
              const idx = DOWNLOAD_FOLDERS.indexOf(settings.downloadFolder);
              const next = DOWNLOAD_FOLDERS[(idx + 1) % DOWNLOAD_FOLDERS.length];
              setSettings((prev) => ({ ...prev, downloadFolder: next }));
              pushToast("INFO", `Download folder set to ${next}`);
            }}
            onOpenAddons={() => setAddonModalOpen(true)}
            onOpenUpdates={() => setUpdateModalOpen(true)}
            onRecheckBdix={() =>
              pushToast(
                "SUCCESS",
                "BDIX CircleFTP (18ms) & DhakaFlix (22ms) reachable"
              )
            }
            onToggleEngineOnline={() => {
              setEngineOnline((prev) => {
                const next = !prev;
                pushToast(
                  next ? "SUCCESS" : "WARNING",
                  next
                    ? "Local engine connection restored"
                    : "Local engine disconnected (offline preview)"
                );
                return next;
              });
            }}
            onClearDiskCache={() =>
              setConfirmState({
                open: true,
                title: "Clear Disk Cache?",
                description:
                  "This removes 412 MB of cached posters, HLS segments, and proxy manifests. Downloaded media files will not be deleted.",
                confirmLabel: "Clear cache",
                onConfirm: () =>
                  pushToast("SUCCESS", "Cleared 412 MB from disk cache"),
              })
            }
            onClearWatchHistory={() =>
              setConfirmState({
                open: true,
                title: "Clear Watch History?",
                description:
                  "This clears all watch progress and recent history across your Library. Saved favorites remain intact.",
                confirmLabel: "Clear history",
                onConfirm: () => {
                  setHistoryIds([]);
                  setContinueIds([]);
                  pushToast("SUCCESS", "Watch history cleared");
                },
              })
            }
            onOpenRepo={() =>
              handleCopyText(
                "https://github.com/marboldrake/Termuflix",
                "Repository URL"
              )
            }
          />
        )}
      </AppShell>

      {/* Reusable Modals */}
      <ProviderSelectorModal
        open={providerModalOpen}
        onClose={() => setProviderModalOpen(false)}
        providers={providersList}
        activeProvider={activeProviderId}
        onSelect={(id) => {
          setActiveProviderId(id);
          const name = providersList.find((p) => p.id === id)?.name ?? id;
          pushToast("INFO", `Switched provider to ${name}`);
        }}
      />

      <PlayerSelectorModal
        open={playerModalOpen}
        onClose={() => setPlayerModalOpen(false)}
        value={settings.defaultPlayer}
        onSelect={(p) => {
          setSettings((prev) => ({ ...prev, defaultPlayer: p }));
          pushToast("SUCCESS", `Default player set to ${p}`);
        }}
      />

      <PlaylistManagerModal
        open={playlistModalOpen}
        onClose={() => setPlaylistModalOpen(false)}
        playlists={playlists}
        onAdd={handleAddPlaylist}
        onReload={handleReloadPlaylist}
        onRemove={handleRemovePlaylist}
      />

      <AddonManagerModal
        open={addonModalOpen}
        onClose={() => setAddonModalOpen(false)}
        addons={addons}
        onAdd={handleAddAddon}
        onReload={(id) => {
          const name = addons.find((a) => a.id === id)?.name ?? "Addon";
          pushToast("SUCCESS", `Reloaded ${name}`);
        }}
        onRemove={(id) => {
          setAddons((prev) => prev.filter((a) => a.id !== id));
          pushToast("INFO", "Addon removed");
        }}
      />

      <UpdateModal
        open={updateModalOpen}
        onClose={() => setUpdateModalOpen(false)}
        onUpdateNow={() =>
          pushToast("SUCCESS", "Downloading Termuflix v2.5.0 release package…")
        }
        onCopyCommand={handleCopyText}
      />

      <HelpShortcutsModal
        open={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
      />

      <DownloadSheetModal
        open={downloadModalOpen}
        onClose={() => setDownloadModalOpen(false)}
        downloads={downloads}
        onTogglePause={handleToggleDownloadPause}
        onCancel={handleCancelDownload}
        onOpenLibraryDownloads={() => {
          setLibraryTab("downloads");
          navigateTo("library");
        }}
      />

      <QuickActionsModal
        item={quickActionItem}
        isFavorite={
          quickActionItem ? favoriteIds.includes(quickActionItem.id) : false
        }
        onClose={() => setQuickActionItem(null)}
        onPlay={async (item) => {
          const details = await api.getMediaDetails(item.id);
          if (details && details.streams[0]) {
            setMediaDetails(details);
            setSelectedMediaId(details.id);
            startPlayback(details, {
              stream: details.streams[0],
              season: item.progress?.season,
              episode: item.progress?.episode,
              audioTrack: details.audio[0] ?? "English (Original)",
            });
          }
        }}
        onDownload={async (item) => {
          const details = await api.getMediaDetails(item.id);
          const stream = details?.streams[1] ?? details?.streams[0];
          if (stream) {
            handleAddDownload(item.title, stream, item.id);
          }
        }}
        onToggleFavorite={handleToggleFavorite}
      />

      {confirmState && (
        <ConfirmDialog
          open={confirmState.open}
          onClose={() => setConfirmState(null)}
          title={confirmState.title}
          description={confirmState.description}
          confirmLabel={confirmState.confirmLabel}
          onConfirm={confirmState.onConfirm}
        />
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}
