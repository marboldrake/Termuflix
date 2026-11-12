<div align="center">

# Termuflix

**Android app to discover, organize and play movies, series, anime and live TV — built on the MovieBox-Tui engine.**

[![CI](https://img.shields.io/github/actions/workflow/status/marboldrake/Termuflix/ci.yml?branch=main&label=CI&logo=github&style=flat)](https://github.com/marboldrake/Termuflix/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-MIT%2FApache--2.0-blue.svg?style=flat)](#license)

</div>

> **Status: early development.** The Rust engine is functional as a terminal app. The Android app, the local engine API and the in-app player are in progress.

---

## What is Termuflix

Termuflix is a fork of [MovieBox-Tui](https://github.com/mesamirh/MovieBox-Tui) (base version `0.1.29`) with a different product goal: turn its multi-provider catalog and streaming engine into an **Android app with its own interface**.

The engine already handles the hard parts: signed provider requests, search, details, seasons and episodes, stream resolution, a loopback HTTP proxy for authenticated streams, subtitle handling, batch downloads, watch history, favorites and caching.

What is new is the presentation layer: a native Android app, a local API between the engine and the UI, and an embedded video player.

---

## Goals

- **Android first.** A real app with a dark, neutral interface — not a terminal wrapped in a WebView.
- **Reuse the engine.** Keep the Rust providers, proxy and downloader; do not rewrite them in Kotlin.
- **Local by design.** The app talks to the engine on `127.0.0.1`; no external backend, no telemetry.
- **In-app playback.** Media3/ExoPlayer for HLS/DASH, headers, subtitles and resume — no dependency on VLC or MX Player.
- **Build on every push.** GitHub Actions produces an installable APK artifact.
- **Honest scoping.** Optional Termux-style tooling (`yt-dlp`, `ffmpeg`) only if a later phase really needs it.

---

## Architecture

```text
┌──────────────────────────────────────────────┐
│                 Android app                  │
│   Kotlin + Jetpack Compose (or WebView UI)   │
│                                              │
│   UI  ──►  Local API client  ──►  127.0.0.1  │
│   Player (Media3 / ExoPlayer)                │
└───────────────────────┬──────────────────────┘
                        │ HTTP / JSON
┌───────────────────────▼──────────────────────┐
│              Rust engine (headless)          │
│  service.rs · providers/ · proxy.rs          │
│  cache · history · favorites · downloads     │
└───────────────────────┬──────────────────────┘
                        │
        ┌───────────────┼────────────────┐
        ▼               ▼                ▼
   MovieBox        4KHDHub          Dramachi / BDIX
   Stremio addons  M3U / IPTV      Local disk cache
```

The desktop terminal UI (`src/tui/`) remains in the repository and keeps working. It is the reference for flows, states and data, not the final interface.

---

## Current capabilities (engine)

- **Providers:** MovieBox (signed CloudFront requests), 4KHDHub, Dramachi, BDIX CircleFTP and DhakaFlix.
- **Addons:** community Stremio HTTP manifests and stream aggregation.
- **Live TV:** M3U playlists, categories, EPG and search.
- **Streams:** quality selection (`4K`, `1080p`, `720p`, `480p`, `Auto`) and subtitle picker.
- **Playback (today):** `mpv`, `VLC`, `IINA`, or Android intents (`termux-open`, `termux-am`).
- **Downloads:** multi-segment HTTP range engine with pause, resume and season batches.
- **Library:** continue watching, history and favorites stored locally.
- **Cache:** binary MessagePack cache with atomic writes.
- **Proxy:** loopback HTTP relay with header injection and DASH manifest rewriting.

---

## Roadmap

| Phase | Deliverable | Status |
|---|---|---|
| 0 | Repository setup, context docs, Git flow | Done |
| 1 | Android CI workflow (APK artifact per push) | Planned |
| 2 | Headless engine API (`--serve`) | Planned |
| 3 | Android shell + UI (Compose or WebView) | Planned |
| 4 | Media3 player with headers, subtitles and resume | Planned |
| 5 | Release signing, distribution, updates | Planned |
| 6 | Optional Termux-style tooling for `yt-dlp`/`ffmpeg` | Optional |

Phase details and decisions live in [`resumen.md`](resumen.md) and [`sesion.md`](sesion.md).

---

## Repository layout

```text
src/                    Rust engine + current terminal UI
  service.rs            Multi-provider facade
  providers/            MovieBox, 4KHDHub, Dramachi, BDIX, addons, M3U
  proxy.rs              Loopback HTTP proxy and DASH rewriter
  download.rs           Segmented downloader
  tui/                  Terminal presentation layer
  player.rs             External player and Android intent launch
tests/                  Integration and contract tests
docs/                   Architecture, configuration and provider guides
resumen.md              Stable project context for agents
sesion.md               Session log and next steps
AGENTS.md               Entry point for AI agents
```

---

## Build (desktop engine)

Requirements: Rust `1.90.0` or newer.

```bash
git clone https://github.com/marboldrake/Termuflix.git
cd Termuflix
cargo build --release --locked
cargo run --release --locked
```

Run the test suite:

```bash
cargo test --all-features --locked
```

The current terminal app expects an external player (`mpv`, `VLC` or `IINA`). On Android/Termux it uses `termux-open` or `am start` until the in-app player is ready.

---

## Android build

The Android app is not in the repository yet. The plan is:

1. Add an `android/` Gradle project with a Kotlin shell.
2. Build the Rust engine for `aarch64-linux-android`.
3. Package it as a native library and expose a local API.
4. Assemble a debug APK in GitHub Actions on every push.
5. Sign release builds with repository secrets.

The existing `.github/workflows/release.yml` already compiles the Rust binary for `aarch64-linux-android`, but it produces a terminal binary archive, not an APK. A dedicated `android.yml` workflow will handle the app.

---

## Context documents

This repository keeps durable context for every new session:

| File | Purpose |
|---|---|
| [`resumen.md`](resumen.md) | Architecture, decisions, constraints and current state |
| [`sesion.md`](sesion.md) | What was done, what is pending and blockers |
| [`AGENTS.md`](AGENTS.md) | Reading order and working rules for AI agents |
| [`docs/ui-prompt-google-ai-studio.md`](docs/ui-prompt-google-ai-studio.md) | Prompt used to generate the Android UI prototype |

---

## Contributing

- Work on the `android-app` branch; `main` mirrors the current stable baseline.
- Keep commits scoped: `feat(android)`, `feat(engine)`, `docs(context)`, `ci(android)`.
- Do not commit tokens, keystores or `local.properties`.
- Run `cargo fmt --check`, `cargo clippy --all-targets --all-features --locked -- -D warnings` and the test suite before opening a PR.

---

## Credits

Termuflix is based on [MovieBox-Tui](https://github.com/mesamirh/MovieBox-Tui) by mesamirh and its contributors. The upstream project provides the provider integrations, terminal UI and release tooling. Upstream translations remain available as `README_ES.md`, `README_BN.md` and `README_HI.md` for reference.

## License

Dual-licensed under [MIT](LICENSE-MIT) or [Apache-2.0](LICENSE-APACHE).

## Disclaimer

Termuflix does not host or store media. It resolves publicly available streams and plays them with a local player. Users are responsible for complying with the laws and terms of service that apply in their country.
