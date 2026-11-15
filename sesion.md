# Sesión 001 — 2026-11-12

**Rama:** `android-app`
**Objetivo de la sesión:** analizar el proyecto, dejar lista la conexión con GitHub y preparar el contexto para las siguientes sesiones.

---

## Hecho

1. **Análisis del proyecto**
   - Revisado `Cargo.toml`, `README.md`, `docs/architecture.md`, `docs/cross-platform.md`, `docs/controls.md`, `docs/config.md`, `docs/known-issues.md`.
   - Revisados `main.rs`, `service.rs`, `proxy.rs`, `player.rs`, `config.rs`, `models.rs` y la estructura de `src/tui/`.
   - Confirmado que el target `aarch64-linux-android` ya compila en `release.yml`, pero no genera APK.
   - Confirmado que la reproducción actual depende de `mpv`/`VLC`/`IINA` o de Intents de Android.

2. **GitHub**
   - Identidad configurada: `Rafay A. <127603275+marboldrake@users.noreply.github.com>`.
   - `origin` verificado: `https://github.com/marboldrake/Termuflix` (fork real de `mesamirh/MovieBox-Tui`).
   - Añadido remoto `upstream`: `https://github.com/mesamirh/MovieBox-Tui.git`.
   - `git fetch upstream` correcto; `main` y `upstream/main` sincronizados (`0 / 0`).
   - Creada la rama `android-app` y subida a `origin` con tracking.
   - `push.autoSetupRemote = true`, `remote.pushDefault = origin`.
   - Verificado el permiso de escritura con un push real.
   - Credenciales: Git Credential Manager 2.9.1 (Windows Credential Manager).

3. **Documentación**
   - Creado `resumen.md` con el contexto estable del proyecto.
   - Creado `sesion.md` (este archivo).
   - Creado `AGENTS.md` como punto de entrada para agentes.
   - Creado `docs/ui-prompt-google-ai-studio.md` con el prompt de UI.

4. **Decisión de UI**
   - Para Google AI Studio se usará **HTML + React + TypeScript + Tailwind**.
   - Motivo: AI Studio previsualiza web; Kotlin/Compose no se puede ejecutar allí.
   - La UI final Android se decide después: **port a Compose** (recomendado) o **WebView**.

---

## Decisiones

| Tema | Decisión |
|---|---|
| Arquitectura | Camino B: motor Rust headless + UI nativa |
| UI en AI Studio | React + TypeScript + Tailwind, mobile-first, tema oscuro neutro |
| Colores | Negros/grises, acento gris claro; sin rojo, sin neón, sin marcas de streaming |
| Reproductor | Media3/ExoPlayer en fase posterior |
| Termux embebido | Descartado para la v1 (tamaño, `targetSdk 28`, GPLv3) |
| `package id` | Propuesto `dev.marboldrake.termuflix`, sin confirmar |
| `minSdk` | Propuesto 26 |
| Distribución | Sin confirmar |

---

## Análisis de la UI (termuflix-UI)

La UI ya existe en `../termuflix-UI` (generada en Google AI Studio). Se analizó sin modificarla.

- **Stack:** React 19 + Vite 8 + Tailwind v4 + TypeScript. ~5.500 líneas.
- **Pantallas:** Home, Search, Details, Player (mock), Live TV, Library, Settings.
- **Modales/sheets:** proveedor, reproductor, subtítulos, playlists, addons, sinopsis, actualización, confirmación, ayuda, descargas, acciones rápidas, toasts.
- **API:** `CatalogApi` en `src/lib/api.ts` con endpoints documentados.
- **Estado:** todo mock; escrituras solo locales.
- **Problemas menores detectados:** URL del repo hardcodeada a `termuflix/termuflix` (debería ser `marboldrake/Termuflix`); deps sobrantes (`@google/genai`, `express`, `dotenv`); `.aistudio/` con artefactos.
- **Plan de backend:** `docs/backend-plan.md`.

---

## Pendiente

- [x] Generar la UI en AI Studio y analizarla (../termuflix-UI).
- [x] Implementar el modo `--serve` en el motor (fase A): /health, /providers, /catalog, /search, /media/:id, /live/channels, /downloads, /playlists, /addons, /favorites, /history.
- [x] Implementar fase B (escritura): settings GET/PATCH, playlists CRUD+reload, addons CRUD+reload, favorites add/remove, history add/remove/clear, downloads create/patch/delete, play, cache/clear, bdix/recheck, version.
- [x] Compilar localmente y regenerar `Cargo.lock` (425 tests pasan; clippy limpio).
- [x] Probar el servidor: todos los endpoints de fase A y B responden correctamente (MovieBox real).
- [ ] Sustituir `mockApi` por `httpApi` en la UI.
- [ ] Confirmar **Compose vs WebView** para la UI final.
- [ ] Confirmar `package id`, `minSdk`, `targetSdk`, nombre visible e idioma.
- [ ] Crear `.github/workflows/android.yml`.
- [ ] Crear el esqueleto `android/`.
- [ ] Integrar Media3 y probar un stream real.
- [ ] Definir firma release y secrets del CI.

---

## Bloqueos / notas

- En este equipo no hay `cargo`, `java`, `gradle` ni Android SDK en `PATH`; el build se hará en GitHub Actions.
- El hook `.githooks/pre-commit` no está activo; no bloquea commits.
- `gh` no está instalado; no es necesario para `git push`.
- No se ha modificado ningún archivo de `src/`, `Cargo.toml` ni la UI existente.

---

## Próxima sesión

1. Pegar el resultado de AI Studio (código o enlace) en la conversación.
2. Revisar la UI contra el inventario de `resumen.md` (Home, Search, Details, Player, modales, Live TV, Library, Settings).
3. Decidir la capa final y empezar el esqueleto Android.
