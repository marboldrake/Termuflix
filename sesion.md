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

## Pendiente

- [ ] Generar la UI en AI Studio y revisar el prototipo.
- [ ] Confirmar **Compose vs WebView** para la UI final.
- [ ] Confirmar `package id`, `minSdk`, `targetSdk`, nombre visible e idioma.
- [ ] Crear `.github/workflows/android.yml`.
- [ ] Crear el esqueleto `android/` (Gradle + Kotlin/Compose o WebView).
- [ ] Implementar la API local del motor (`--serve`).
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
