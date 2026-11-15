# Resumen del proyecto — Termuflix (Android)

> Contexto permanente para agentes. Última actualización: 2026-11-12.
> Leer también [`sesion.md`](sesion.md) (bitácora) y [`AGENTS.md`](AGENTS.md) (reglas de trabajo).

---

## 1. Identidad y estado

| Campo | Valor |
|---|---|
| Nombre del producto | **Termuflix** |
| Base | Fork de [`mesamirh/MovieBox-Tui`](https://github.com/mesamirh/MovieBox-Tui) |
| Versión actual | `0.1.29` |
| Lenguaje | Rust 2024 (`moviebox-tui`) |
| Tamaño | 84 archivos `.rs`, ~47.900 líneas |
| UI actual | TUI de terminal: `ratatui` + `crossterm` |
| Repositorio | `marboldrake/Termuflix` (fork), upstream `mesamirh/MovieBox-Tui` |
| Rama de trabajo | `android-app` |
| Estado | Análisis terminado. Sin cambios en `src/`. Documentación y conexión Git listas. |

---

## 2. Objetivo

Convertir el proyecto en una **app Android** con UI propia (diseño del usuario), reutilizando el motor Rust existente:

1. Catálogo, búsqueda, detalles y streams de los proveedores actuales.
2. Reproducción **dentro de la app** (Media3/ExoPlayer) en una fase posterior.
3. Backend local ligero; opcionalmente un runtime tipo Termux solo si hace falta `yt-dlp`/`ffmpeg`.
4. Build automático de APK en cada push mediante GitHub Actions.

La UI se diseña primero en **Google AI Studio** como prototipo web y luego se integra en Android.

---

## 3. Arquitectura actual (lo que ya existe)

```text
src/
├── main.rs                 # Entrada CLI, flags, arranque de la TUI
├── lib.rs                  # Declaración de módulos
├── service.rs              # Fachada multi-proveedor (search, details, homepage, posters)
├── models.rs               # Entidades de dominio
├── net.rs                  # DNS (Hickory) + clientes HTTP reqwest/rustls
├── proxy.rs                # Proxy HTTP loopback + reescritura DASH + inyección de headers
├── cache.rs                # Caché binario MessagePack
├── config.rs               # Configuración y rutas (Termux/Android incluidas)
├── download.rs             # Descargador multi-segmento con reanudación
├── history.rs              # Progreso de visionado y reconciliación
├── favorites.rs            # Favoritos
├── player.rs               # Detección/lanzamiento de mpv, VLC, IINA e Intents Android
├── providers/              # MovieBox, 4KHDHub, Dramachi, BDIX, addons Stremio, M3U/IPTV
├── tui/                    # Toda la capa visual de terminal
└── updater/                # Autoactualización
```

### Piezas clave para Android

- **`service.rs`** es la puerta de entrada limpia al catálogo. No depende de la TUI.
- **`proxy.rs`** ya resuelve streams con cabeceras y subtítulos en `127.0.0.1`; es la base ideal para un reproductor embebido.
- **`player.rs`** ya detecta Android/Termux y lanza Intents (`termux-open`, `termux-am`, `am start`). En la app se sustituirá por Media3.
- **`config.rs`** ya contempla rutas de Termux (`/data/data/com.termux/files/usr`).
- **`release.yml`** ya compila `aarch64-linux-android`, pero produce un `.tar.gz` con un binario CLI, **no un APK**.

---

## 4. Cómo muestra la información la TUI (inventario para la UI nueva)

### Home / Discover

- Wordmark, versión, barra de búsqueda grande.
- Pestañas **Continue Watching** y **Favorites**.
- Fila de modo: **Streaming / Live TV**.
- Chips de proveedor activo (`MovieBox`, `4KHDHub`, `Dramachi`, `BDIX`, `Addons`).
- **Discover Categories**: Trending Now, Top Rated, Latest Releases, Most Watched, Top Movies, Top Series, Addon Catalogs.
- Filas/cuadrícula de posters con título, año, tipo (`Movie`/`Series`), `SxxExx` y porcentaje visto.
- Footer con atajos contextuales.

### Búsqueda

- Input con sugerencias y comandos `/`.
- Resultados en cuadrícula/lista con póster, título, año, tipo, rating y progreso.
- Estados: cargando, sin resultados, error con **Retry** y **Switch Provider**, paginación.

### Detalles

- Póster, backdrop, título, tipo, año, **IMDb**, **Audio**, género, director, reparto.
- Sinopsis con modal de "leer más".
- Paneles: **Languages**, **Seasons**, **Episodes**, **Streams**.
- Tabla de streams: `RES`, `SIZE`, `CODEC`, `RELEASE/SOURCE`.
- Acciones: **Play**, **Download** / **Download Season**, **Favorite**.
- Selector de audio y de subtítulos antes de reproducir.

### Popups y modales

- Selector de proveedor.
- Categorías de Discover / Browse.
- Selector de tema.
- Selector de reproductor (`MPV`, `VLC`, `IINA`, `Android Player`).
- **Settings Hub** con 4 pestañas: General, Content Modes, Appearance, Maintenance.
- Gestor de playlists **Live TV** (añadir URL/ruta, listar, eliminar, recargar).
- Gestor de **Addons** Stremio (manifest URL, listar, eliminar, recargar).
- Selector de subtítulos/idioma.
- Modal de sinopsis.
- Modal de actualización disponible.
- Diálogos de confirmación para acciones destructivas.
- Ayuda interactiva.
- **Toasts** con tipo (`INFO`, `SUCCESS`, `WARNING`, `ERROR`), mensaje y barra de cuenta atrás.
- Progreso de descarga, cola, pausa/reanudar y cancelar.

### Live TV

- Playlist M3U, categorías, búsqueda, EPG (now/next), reproducción por Intent.

### Biblioteca

- Historial con progreso y tiempo relativo.
- Favoritos.
- Descargas en curso y completadas.

### Comandos de la TUI

`/settings`, `/browse`, `/history`, `/favorites`, `/list`, `/config`, `/clear`, `/help`, `/exit`.

---

## 5. Decisiones tomadas

| Tema | Decisión |
|---|---|
| Arquitectura Android | **Camino B**: núcleo Rust headless + UI nativa. El motor se empaqueta como librería (`lib*.so`) y expone una API local; no se ejecuta un terminal dentro de la app |
| UI en AI Studio | **HTML + React + TypeScript + Tailwind** (AI Studio previsualiza web, no Android) |
| UI final Android | Pendiente de confirmar: **port a Jetpack Compose** (recomendado) o **WebView** para ir más rápido |
| Reproductor | Media3/ExoPlayer con HLS/DASH, cabeceras y subtítulos |
| Runtime Termux | Solo fase opcional para `yt-dlp`/`ffmpeg`. Evitarlo en la v1 por tamaño, `targetSdk 28` y licencia GPLv3 |
| `package id` propuesto | `dev.marboldrake.termuflix` (sin confirmar) |
| `minSdk` propuesto | 26 (Android 8) |
| `targetSdk` propuesto | 35/36 |
| Distribución | Sin confirmar: sideload/F-Droid vs Play Store |
| Idioma de la app | Inglés en la UI; español para documentación interna |

### Por qué no meter Termux en la v1

- Android 10+ bloquea ejecutar binarios desde el directorio de datos si `targetSdk >= 29`; Termux usa `targetSdk 28`.
- Un userland completo añade ~80–150 MB, arranque lento y consumo de batería.
- **Termux es GPLv3**; embeber su terminal obligaría a licenciar la app como GPLv3, mientras el proyecto es MIT/Apache-2.0.
- Para reproducir no hace falta: `proxy.rs` ya sirve el stream con cabeceras y los subtítulos.

---

## 6. Repositorio y flujo Git

```text
origin    https://github.com/marboldrake/Termuflix      (fork, lectura/escritura)
upstream  https://github.com/mesamirh/MovieBox-Tui.git  (original, solo lectura)
rama      android-app  ->  origin/android-app
```

- Identidad configurada: `Rafay A. <127603275+marboldrake@users.noreply.github.com>`.
- Credenciales: Git Credential Manager 2.9.1 → Windows Credential Manager.
- `push.autoSetupRemote = true` y `remote.pushDefault = origin`.
- `main` y `upstream/main` están sincronizados (`0 / 0` al configurar).
- No se empuja nunca al upstream sin permiso explícito.
- No se commitean tokens, keystores ni `local.properties`.

### Convención de commits

```text
feat(android): ...
feat(engine): ...
docs(context): ...
ci(android): ...
fix(...): ...
```

---

## 7. CI/CD (plan)

- `.github/workflows/android.yml` (pendiente de crear):
  - `push` a `android-app`/`main`, `pull_request`, `workflow_dispatch`.
  - JDK 17 + Android SDK + NDK r26d + Rust `aarch64-linux-android`.
  - Compila el motor Rust, lo copia a `jniLibs/arm64-v8a/`, ejecuta `./gradlew assembleDebug`.
  - Sube `app-debug.apk` como artefacto.
  - En tags: `assembleRelease` firmado con secrets y adjunto al release.
- `ci.yml` actual sigue validando formato, clippy, audit, tests y paquete Rust.
- El hook `.githooks/pre-commit` existe pero **no está activo** (no hay `core.hooksPath`).

---

## 8. Comandos útiles

```bash
# Rust (escritorio)
cargo build --release --locked
cargo test --all-features --locked
cargo clippy --all-targets --all-features --locked -- -D warnings

# Git
git switch android-app
git fetch upstream
git merge upstream/main        # sincronizar el fork cuando toque
git push                       # crea/actualiza origin/android-app
```

> En este equipo no hay `cargo`, `java`, `gradle` ni Android SDK detectados en `PATH`; el build real se hace en GitHub Actions.

---

## 9. Restricciones y riesgos

- **Legal**: la app no aloja contenido; solo resuelve streams públicos. Revisar términos de cada proveedor y la política de la tienda que se use.
- **Proveedores**: los mirrors de 4KHDHub rotan y caducan; MovieBox firma peticiones con un secreto hardcodeado. Son módulos frágiles.
- **Termux/GPLv3**: ver sección 5.
- **Android moderno**: `exec` desde el directorio de datos está restringido; evitar binarios externos.
- **Play Store**: una app que agrega scrapers de streaming puede tener problemas de política. F-Droid/sideload es más viable.
- **Firma**: un APK release necesita keystore; el debug sirve para probar.

---

## 10. Archivos de contexto

| Archivo | Función |
|---|---|
| `AGENTS.md` | Punto de entrada para agentes; reglas y orden de lectura |
| `resumen.md` | Este documento: contexto estable |
| `sesion.md` | Bitácora de la sesión actual y siguientes pasos |
| `docs/ui-prompt-google-ai-studio.md` | Prompt completo para generar la UI en AI Studio |

---

## 11. UI (`ui/`) y plan de backend

La UI ya existe y ahora está integrada en el repo bajo `ui/` (generada en Google AI Studio).

- **Stack:** React 19 + Vite 8 + Tailwind v4 + TypeScript.
- **Tamaño:** ~5.500 líneas, 7 pantallas + sistema de modales/bottom sheets, tema oscuro neutro.
- **Contrato API:** `ui/src/lib/api.ts` define `CatalogApi` y documenta los endpoints esperados.
- **Estado:** `httpApi` implementado contra `http://127.0.0.1:8080/api/v1`; `mockApi` sigue disponible con `VITE_USE_MOCK=true`. `App.tsx` selecciona automáticamente.
- **Integración recomendada:** WebView híbrido (bundle en `assets/web/`, motor en `jniLibs/`), luego migración a Compose.
- **Plan completo:** `docs/backend-plan.md`.

- **Stack:** React 19 + Vite 8 + Tailwind v4 + TypeScript.
- **Tamaño:** ~5.500 líneas, 7 pantallas + sistema de modales/bottom sheets, tema oscuro neutro.
- **Contrato API:** `src/lib/api.ts` define `CatalogApi` y documenta los endpoints esperados (`/catalog`, `/search`, `/media/:id`, `/live/channels`, `/downloads`, `/playlists`, `/addons`, `/providers`, `/health`).
- **Estado:** 100 % mock. Los handlers de escritura (favoritos, historial, descargas, playlists, addons, settings) solo actualizan estado local.
- **Integración recomendada:** WebView híbrido primero (bundle en `assets/`, motor en `jniLibs/`), luego migración a Compose pantalla por pantalla.
- **Plan completo:** `docs/backend-plan.md`.

## 12. Próximos pasos

1. Implementar el modo `--serve` en el motor (fase A del plan de backend).
2. Compilar localmente y corregir errores; regenerar `Cargo.lock`.
3. Integrar la UI con el motor real (sustituir `mockApi` por `httpApi`).
4. Crear el esqueleto `android/` y `.github/workflows/android.yml`.
5. Integrar Media3 y probar un stream real.
