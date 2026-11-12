# AGENTS.md

Este repositorio usa contexto persistente para agentes.

## Orden de lectura al iniciar una sesión

1. `resumen.md` — contexto estable del proyecto (arquitectura, decisiones, restricciones).
2. `sesion.md` — bitácora: qué se hizo, qué falta y bloqueos.

## Reglas

- Trabajar en la rama `android-app`; no empujar a `upstream` sin permiso explícito.
- No modificar `src/`, `Cargo.toml` ni la UI existente sin pedirlo antes.
- No commitear tokens, keystores, `local.properties` ni credenciales.
- Mantener el estilo de commits: `feat(...)`, `fix(...)`, `docs(...)`, `ci(...)`.
- Al terminar la sesión, actualizar `sesion.md` y promover a `resumen.md` lo que sea permanente.
- Si una decisión cambia, anotarla en `sesion.md` y reflejarla en `resumen.md`.

## Contexto rápido

- Producto: **Termuflix**, fork de `mesamirh/MovieBox-Tui`.
- Motor: Rust (TUI actual) con proveedores, proxy loopback y descargas.
- Objetivo: app Android con UI propia y reproductor embebido (Media3).
- UI: prototipo en AI Studio con **React + TypeScript + Tailwind**; luego port a Compose o WebView.
- Prompt de UI: `docs/ui-prompt-google-ai-studio.md`.
