# Termuflix Design System (`DESIGN.md`)

## 1. Visual Identity & Aesthetic Principles
Termuflix is a quiet, restrained, dark-only media discovery and local-proxy playback interface built for Android (`390x844` baseline) and responsive tablet/desktop viewports (`>= 768px`).

- **Zero brand distraction**: No streaming-service colors, neon accents, glowing gradients, or decorative status dots.
- **High-contrast neutral hierarchy**: Primary CTAs use off-white (`--accent: #D9DEE5`) with near-black foreground text (`--accent-text: #0A0B0D`), reserving semantic hues exclusively for status and destructive text confirmation.

---

## 2. Design Tokens

### Color Tokens (`Graphite` Default)
| Token | Value | Role |
|---|---|---|
| `--bg` | `#07080A` | Root application canvas |
| `--bg-elev` | `#0B0C0F` | Navigation rail, bottom bar, modal footers |
| `--surface` | `#121418` | Primary cards, list rows, inputs |
| `--surface-2` | `#171A1F` | Selected rows, hover states, secondary buttons |
| `--surface-3` | `#1D2127` | Progress tracks, active category pills |
| `--border` | `#242830` | Default 1px structural hairlines |
| `--border-strong` | `#313640` | Hover/focused hairlines, modal elevation borders |
| `--text` | `#F4F5F7` | Primary headings, active labels |
| `--text-2` | `#A7ADB8` | Secondary metadata, synopses |
| `--text-3` | `#6E7683` | Captions, placeholders, inactive icons |
| `--accent` | `#D9DEE5` | Primary CTA fill, active progress fill, selected indicator |
| `--accent-text` | `#0A0B0D` | Text on primary CTA fill |
| `--success` | `#7FB89A` | Positive confirmations |
| `--warning` | `#D6B36A` | Disconnected/warning notices |
| `--error` | `#D97A72` | Destructive text-only actions, playback/search errors |
| `--info` | `#93A7C4` | Informational toast & release note links |

### Neutral Theme Presets
- **Graphite** (`#07080A` canvas / `#121418` surface): Balanced dark neutral.
- **Onyx** (`#030405` canvas / `#0D0E11` surface): True-black OLED variant.
- **Slate** (`#0A0C10` canvas / `#151921` surface): Subtle cool-charcoal variant.

### Typography
- **UI Sans**: `Inter` (`400`, `500`, `600`).
- **Telemetry / Timestamps / CLI**: `JetBrains Mono` with `font-variant-numeric: tabular-nums`.
- **Scale**: `11px`, `12px`, `14px`, `16px`, `20px`, `24px`, `32px`.

### Radii, Spacing & Elevation
- **Radii**: `8px` controls/inputs, `12px` media cards/rows, `16px` sheets/modals, `999px` interactive filter chips.
- **Spacing**: `4px` base unit; `16px` horizontal viewport margin on mobile (`24px` on `md+`).
- **Shadow**: `0 8px 24px rgba(0,0,0,0.45)` — soft black depth without glow.
- **Touch targets**: Minimum `44x44px` hitbox on interactive controls, with `env(safe-area-inset-*)` padding.
- **Motion**: `150–200ms` ease-out transitions on `transform` and `opacity` only; respects `prefers-reduced-motion: reduce`.

---

## 3. Navigation & Responsive Shell
- **State-driven routing**: Controlled via a `Route` union (`home | search | live | library | settings | details | player`), with zero URL router dependencies.
- **Mobile (`< 768px`)**: Sticky 56px contextual header + 64px 5-tab bottom navigation bar (`Home`, `Search`, `Live TV`, `Library`, `Settings`).
- **Desktop (`>= 768px`)**: Left sidebar rail (`228px–244px`) with primary navigation, download queue trigger, and shortcuts reference; multi-column grids scale cleanly (`2 -> 3 -> 4 -> 5` columns).

---

## 4. Component Architecture
- `src/components/layout/AppShell.tsx`: Responsive navigation shell, contextual header, and local engine offline banner (`127.0.0.1:8080`).
- `src/components/ui/PosterArt.tsx`: Deterministic CSS/SVG architectural poster and 16:9 backdrop renderer with neutral gradients and vertical legibility scrims (zero external image URLs).
- `src/components/ui/ModalSheet.tsx`: Adaptive container rendering as a bottom sheet with grab handle on mobile and a centered dialog on desktop.
- `src/components/ui/EmptyState.tsx`: CSS-only geometric empty state with recovery CTAs.
- `src/components/ui/Skeletons.tsx`: Shimmering loading placeholders for rows, search grids, channels, and detail panels.
- `src/components/ui/ToastContainer.tsx`: Stacked toast system (max 3) with countdown bar and dismiss control.
- `src/components/modals/AppModals.tsx`: Provider selector, Media player selector, Subtitles/Language selector, Season/Episode picker, M3U Playlist manager, Addon manifest manager, Synopsis reader, Software update modal (Homebrew/Scoop copy), Destructive confirmation dialogs, Gestures/Shortcuts sheet, Download queue sheet, and Long-press quick actions.
- `src/lib/api.ts`: `CatalogApi` interface and `mockApi` with documented transition path to `httpApi` against `http://127.0.0.1:<port>`.
