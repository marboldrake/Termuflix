# Backend plan — Termuflix (Rust engine + UI)

> Companion to `resumen.md`. Describes how the Rust engine will serve the Termuflix UI.

## 1. Integration model

The UI generated in `termuflix-UI/` (React + Vite + Tailwind) is the design source of truth.
It already expects a local HTTP API at `http://127.0.0.1:8080` and a `CatalogApi` interface
(`termuflix-UI/src/lib/api.ts`).

**Phase 1 (fastest, recommended): WebView hybrid.**
Ship the built web bundle inside the Android APK (`assets/`) and load it in a `WebView`.
The Rust engine runs as a separate process (the existing binary, renamed to `libtermuflix_engine.so`
and placed in `jniLibs/`) and listens on `127.0.0.1:8080`. The WebView calls the API directly.
This reuses 100 % of the UI and keeps the player as a native Media3 activity launched by the engine.

**Phase 2 (optional): port to Compose.**
Migrate screen by screen to Jetpack Compose, using the web UI as the pixel-perfect spec.
The API contract stays identical, so no backend work is duplicated.

The in-app player is always native (Media3/ExoPlayer), regardless of the UI layer.

## 2. Engine run mode

Add a new CLI mode to the existing binary:

```text
moviebox-tui --serve [--port 8080] [--host 127.0.0.1]
```

- Reuses the existing tokio runtime, `MovieBoxService`, cache, config, history, favorites,
  download manager and the loopback proxy.
- Serves JSON over HTTP/1.1.
- Exposes `/health` for the UI's offline banner.
- On Android, the app starts this process on launch and stops it on exit.

The existing TUI mode (`moviebox-tui` with no flags) is unchanged.

## 3. API contract (from `termuflix-UI/src/lib/api.ts`)

Base URL: `http://127.0.0.1:8080/api/v1`

### Read (already expected by the UI)

| Method | Path | Rust source | Notes |
|---|---|---|---|
| GET | `/health` | new | `{ status, version, engine }` |
| GET | `/providers` | `MovieBoxService` + `config.rs` | `ProviderInfo[]` |
| GET | `/catalog?provider=<id>` | `service.search_typed` / homepage | `CatalogItem[]` |
| GET | `/search?q=&type=&provider=&page=&pageSize=` | `service.search_typed` | `{ items, total, hasMore }` |
| GET | `/media/:id` | `service.details_typed` | `MediaDetails \| null` |
| GET | `/live/channels?category=&q=` | `providers::tv` + `config` | `Channel[]` |
| GET | `/downloads` | `download.rs` + state | `Download[]` |
| GET | `/playlists` | `config` (tv_config) | `PlaylistItem[]` |
| GET | `/addons` | `providers::addons` | `AddonItem[]` |

### Write (UI handlers that are currently mock-only)

| Method | Path | Rust source | Notes |
|---|---|---|---|
| POST | `/downloads` | `download.rs` | body `{ mediaId, title, stream }` |
| PATCH | `/downloads/:id` | `download.rs` | `{ status: paused\|downloading }` |
| DELETE | `/downloads/:id` | `download.rs` | cancel |
| POST | `/playlists` | `config` | body `{ source }` |
| DELETE | `/playlists/:id` | `config` | remove |
| POST | `/playlists/:id/reload` | `providers::tv` | refresh channels |
| POST | `/addons` | `providers::addons` | body `{ manifestUrl }` |
| DELETE | `/addons/:id` | `providers::addons` | remove |
| POST | `/addons/:id/reload` | `providers::addons` | refresh catalogs |
| GET | `/favorites` | `favorites.rs` | `CatalogItem[]` |
| POST | `/favorites/:id` | `favorites.rs` | add |
| DELETE | `/favorites/:id` | `favorites.rs` | remove |
| GET | `/history` | `history.rs` | continue + history |
| POST | `/history` | `history.rs` | update progress |
| DELETE | `/history/:id` | `history.rs` | remove entry |
| GET | `/settings` | `config.rs` | `AppSettings` |
| PATCH | `/settings` | `config.rs` | partial update |
| POST | `/play` | `player.rs` | launch external player / return session |
| POST | `/bdix/recheck` | `net.rs` | connectivity probe |
| POST | `/cache/clear` | `cache.rs` | purge |
| POST | `/history/clear` | `history.rs` | purge |
| GET | `/version` | `updater::check` | for the update modal |

### Proxy / streaming

The UI builds stream URLs as `http://127.0.0.1:8080/proxy/stream/{id}/{quality}.mp4`.
The engine must serve those routes and fetch the real CDN URL with the right headers.
Two options:

1. **Reuse the existing sidecar** (`proxy::spawn_sidecar`) and return its URL in `Stream.url`.
   Simplest, but adds a second process.
2. **Serve proxy routes in-process** inside `--serve`. Cleaner for Android; recommended.

Recommendation: option 2. The proxy already rewrites DASH manifests and injects headers.

## 4. Data mapping (TypeScript ↔ Rust)

| UI type | Rust type | Notes |
|---|---|---|
| `CatalogItem` | `providers::models::CatalogItem` | map `poster` (string) to a palette key or seed; `progress` from history |
| `MediaDetails` | `providers::models::MediaDetails` + `PlaybackSource` + `Release` | join streams from resolved releases; `audio` from `AudioTrackOption` |
| `Stream` | `providers::models::PlaybackSource` / `Release` + `SourceMirror` | `url` is the proxy URL; `subtitles` from `SubtitleOption` |
| `Season` / `Episode` | `providers::models::Season` / `Episode` | add `progress` and `durationSeconds` |
| `Channel` | `providers::tv::Channel` | add `now` / `next` / `progress` from EPG if available |
| `Download` | `download.rs` state | map status and progress |
| `PlaylistItem` | `config` (tv_config) | expose channel count and last sync |
| `AddonItem` | `providers::addons::models::InstalledAddon` | expose version and catalog count |
| `ProviderInfo` | `providers::models::ProviderKind` + `ProviderCapabilities` | map status strings |
| `AppSettings` | `config::Config` | map theme names (graphite/onyx/slate) and provider flags |
| `ProgressInfo` | `history.rs` | resume seconds, percent, season, episode |

## 5. Persistence

The engine already persists everything the UI needs:

- `config.json` → settings, providers, theme, download folder, default player.
- `tv_config.json` → M3U playlist sources.
- `addons_config.json` → installed addons.
- `history.json` → watch progress.
- `favorites.json` → favorites.
- `playback/` → crash reconciliation.
- Cache dir → posters, HLS segments, proxy manifests.

No new storage is required. The HTTP layer just reads/writes these through the existing modules.

## 6. Engine lifecycle on Android

1. App starts → launch `libtermuflix_engine.so --serve --port 8080` from `nativeLibraryDir`.
2. Poll `/health` until 200 (max ~5s) → set `engineOnline = true`.
3. WebView loads the bundled UI; it calls the API.
4. On app background/exit → terminate the process.

Using `nativeLibraryDir` avoids the Android 10+ exec restriction that affects Termux.

## 7. Phases

| Phase | Deliverable | Depends on |
|---|---|---|
| A | `--serve` with read-only endpoints + `/health` + CORS | axum added to `Cargo.toml` |
| B | Write endpoints (downloads, playlists, addons, favorites, history, settings) | A |
| C | In-process proxy routes for stream URLs | A |
| D | Android packaging: jniLibs binary, service, WebView, lifecycle | A–C |
| E | Media3 player integration (optional, can keep external playback) | D |

## 8. Risks

- **Cargo.lock**: adding `axum` requires regenerating the lockfile. The user must run `cargo build` (non-locked) and commit `Cargo.lock` before CI (`--locked`) passes.
- **EPG**: the UI expects `now`/`next`/`progress` on channels. Verify `providers::tv` exposes EPG; otherwise add a minimal parser or stub.
- **Theme mapping**: the UI offers `graphite/onyx/slate`; the engine has 9 themes. Map the three neutral ones and ignore the rest on Android.
- **Repo URL**: the UI hardcodes `https://github.com/termuflix/termuflix` in `App.tsx` (`onOpenRepo`). Fix to `marboldrake/Termuflix`.
- **Leftover deps**: `@google/genai`, `express`, `dotenv`, `esbuild`, `tsx` are AI Studio template artifacts. Remove in a cleanup pass; not blocking.
- **No local build tooling on the dev machine initially**: Rust + MSVC Build Tools were installed during this session; verify with `cargo build --locked` before pushing.

## 9. Next concrete step

Implement Phase A: add `axum` to `Cargo.toml`, create `src/serve.rs` with a router exposing
`/health`, `/providers`, `/catalog`, `/search`, `/media/:id`, `/live/channels`, `/downloads`,
`/playlists`, `/addons`, and wire `--serve` in `main.rs`. Then build locally and fix compile errors.
