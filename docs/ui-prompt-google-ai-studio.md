# Prompt para Google AI Studio — UI de Termuflix

> Copia todo el bloque de abajo en Google AI Studio (modo Build / app web).
> Resultado esperado: prototipo React + TypeScript + Tailwind, mobile-first, tema oscuro neutro.

---

```text
Actúa como diseñador de producto senior (UI/UX) y desarrollador front-end.

CONTEXTO
Estoy construyendo "Termuflix", una app Android para explorar y reproducir películas, series, anime y TV en vivo. El motor ya existe en Rust (scrapers, catálogo, proxy local, descargas) y la app Android se conectará más adelante a una API local en 127.0.0.1. Tu tarea es SOLO la UI: un prototipo funcional y creíble, sin backend real.

OBJETIVO
Genera una app React + TypeScript + Tailwind CSS (Vite), mobile-first, con navegación por estado (sin react-router), datos mock y todos los estados de carga, error y vacío. Debe sentirse como un producto real, no como un dashboard ni una demo genérica.

STACK
- React 18 + TypeScript + Vite.
- Tailwind CSS. Si no está disponible, CSS puro con variables equivalentes.
- Iconos: lucide-react (stroke 1.5).
- Sin librerías de UI que impongan su estilo (nada de MUI, Chakra, Ant, Bootstrap).
- Sin librerías de animación pesadas. Solo CSS transitions.
- Sin backend, sin autenticación, sin pagos, sin anuncios, sin analytics.

IDENTIDAD VISUAL (obligatoria)
- Tema oscuro único, neutro, elegante. Nada de colores llamativos.
- Variables:
  --bg: #07080A;
  --bg-elev: #0B0C0F;
  --surface: #121418;
  --surface-2: #171A1F;
  --surface-3: #1D2127;
  --border: #242830;
  --border-strong: #313640;
  --text: #F4F5F7;
  --text-2: #A7ADB8;
  --text-3: #6E7683;
  --accent: #D9DEE5;
  --accent-text: #0A0B0D;
  --success: #7FB89A;
  --warning: #D6B36A;
  --error: #D97A72;
  --info: #93A7C4;
- El acento es gris claro/blanco roto; los botones primarios son claros con texto negro. No uses rojo, azul eléctrico, morado ni neón.
- Sin degradados llamativos. Como máximo, un degradado vertical negro para legibilidad sobre imágenes.
- Tipografía: Inter o Geist. Pesos 400/500/600. Escala 11/12/14/16/20/24/32.
- Radios: 8px controles, 12px tarjetas, 16px hojas/modales, 999px chips.
- Bordes de 1px. Sombras suaves y negras (0 8px 24px rgba(0,0,0,.45)); sin glow.
- Espaciado en múltiplos de 4. Padding horizontal de 16px en móvil.
- Touch targets >= 44px. Respeta safe-area (notch y barra inferior).
- Movimiento: 150–220 ms ease-out. Respeta prefers-reduced-motion.
- Contraste AA, focus visible, aria-labels en iconos.
- Toda la UI en inglés. Código y comentarios en inglés.

NAVEGACIÓN
- Shell con bottom navigation de 5 ítems: Home, Search, Live TV, Library, Settings.
- Header contextual: título, chip de proveedor activo y acción secundaria.
- Navegación por estado con un tipo Route; sin URL routing.
- En pantallas >= 768px, la bottom nav pasa a sidebar lateral y las cuadrículas ganan columnas.
- Pantalla base de referencia: 390 x 844.

PANTALLAS

1) HOME / DISCOVER
- Header: wordmark "TERMUFLIX" en mayúsculas pequeñas con letter-spacing, control segmentado "Streaming | Live TV", chip de proveedor ("MovieBox") y botón de ajustes.
- Buscador grande y prominente, placeholder "Search movies, series, anime…".
- Chips rápidos: All, Movies, Series, Anime, Live TV.
- Sección "Continue watching": fila horizontal de tarjetas 16:9 con póster, título, SxxExx, barra de progreso y tiempo restante. Acción al mantener pulsado: Play, Download, Favorite.
- Sección "Favorites": fila de pósteres; estado vacío cuidado ("Nothing saved yet").
- Sección "Discover": chips de categorías (Trending Now, Top Rated, Latest Releases, Most Watched, Top Movies, Top Series, Addon Catalogs) y filas horizontales de pósteres.
- Pull-to-refresh visual y skeletons al cargar.

2) SEARCH
- Input autofocus con sugerencias y búsquedas recientes.
- Chips de filtro y selector de proveedor.
- Cuadrícula de resultados a 2 columnas: póster 2:3, título, año, badge Movie/Series, rating, SxxExx y progreso si existe.
- Estados: loading con skeletons, sin resultados ("No results for “…” on MovieBox") con acciones "Try another provider" y "Clear", error con "Retry" y "Switch provider".
- Indicador de paginación o scroll infinito.

3) DETAILS
- Backdrop a sangre con degradado negro, póster superpuesto, título grande.
- Metadatos: año, tipo, duración, badge de rating, badge de audio, géneros como chips.
- Sinopsis truncada con "Read more" que abre un modal.
- Botón primario "Play", secundario "Download", icono de favorito y menú de desbordamiento.
- Tabs: "Streams", "Seasons & Episodes", "Audio".
- Streams: filas con badge de calidad (4K/1080p/720p), tamaño, codec, fuente, icono de descarga y estado seleccionado.
- Seasons & Episodes: chips de temporada; lista de episodios con número, título, sinopsis corta, progreso y descarga.
- Audio: lista de idiomas con check.
- Barra de acciones sticky en la parte inferior en móvil.
- Estados de carga y error por panel.

4) PLAYER (mock visual)
- Pantalla completa 16:9 negra con un placeholder sutil (sin video real).
- Barra superior con back, título y botón de cast.
- Centro: play/pause grande.
- Barra inferior: seek con rango buffered, tiempo actual/total, audio, subtítulos, calidad, PiP y fullscreen.
- Botón "Next episode" cuando aplique.
- Estados: buffering, error de reproducción con "Retry" y "Open in external player".
- Modal de reanudar: "Resume from 00:42?" con "Resume" y "Start over".

5) LIVE TV
- Chips de categorías (All, News, Sports, Movies, Kids, Music).
- Buscador de canales.
- Lista de canales con logo monograma, nombre, EPG "Now / Next" y barra de progreso del programa.
- Acción para abrir el gestor de playlists M3U.
- Estado vacío: "No channels yet" con "Add playlist".

6) LIBRARY
- Tabs: Continue, History, Favorites, Downloads.
- Continue/History: filas con póster, título, progreso, "Watched 2h ago", acción de eliminar.
- Favorites: cuadrícula de pósteres.
- Downloads: tarjetas con progreso, velocidad, ETA, pausa/reanudar, cancelar, cola y completados.
- Estados vacíos para cada tab.

7) SETTINGS
- Pantalla completa en móvil (no un modal diminuto).
- Secciones: General, Content Modes, Appearance, Maintenance.
- General: Automatic Updates (toggle), Default Media Player (select: Auto, MPV, VLC, IINA, Android Player), Download Folder (fila con ruta y botón Change).
- Content Modes: Streaming Mode (toggle), Streaming Sources (toggles por proveedor: MovieBox, 4KHDHub, Dramachi, BDIX CircleFTP, BDIX DhakaFlix, Addons), Live TV Mode (toggle).
- Appearance: Theme (opciones neutras: Graphite, Onyx, Slate; no temas coloridos).
- Maintenance: Check for Updates, Re-check BDIX Network, Clear Disk Cache, Clear Watch History, GitHub Repository. Las acciones destructivas piden confirmación.
- Footer con versión de la app y enlace al repositorio.

POPUPS / MODALES (usar un componente reutilizable)
- En móvil, bottom sheet con handle; en desktop, modal centrado.
- Selector de proveedor: MovieBox, 4KHDHub, Dramachi, BDIX CircleFTP, BDIX DhakaFlix, Addons. Cada uno con nombre, descripción corta y estado.
- Selector de reproductor: Auto, MPV, VLC, IINA, Android Player.
- Selector de subtítulos/idioma: Off, English, Spanish, Portuguese (BR), Multi; buscador.
- Selector de temporada/episodio.
- Gestor de playlists Live TV: input para URL o ruta de archivo, botón Add, lista con remove y reload.
- Gestor de Addons: input de manifest URL, botón Add, lista con remove y reload.
- Modal de sinopsis con scroll.
- Modal de actualización: versión nueva, notas, "Update now", "Later" y enlace a release notes; incluir comandos de Homebrew/Scoop con botón de copiar.
- Diálogo de confirmación para acciones destructivas, con consecuencia clara y botón rojo solo en texto (no bloque de color).
- Hoja de ayuda con gestos y atajos.
- Toasts: INFO, SUCCESS, WARNING, ERROR. Icono, mensaje, barra de cuenta atrás y dismiss. Máximo 3 apilados.
- Hoja de descarga: título, progreso, velocidad, ETA, pausa/cancelar y contador de cola.

ESTADOS TRANSVERSALES
- Skeleton loaders en todas las listas y grids.
- Empty states con ilustración abstracta hecha en CSS (sin imágenes externas).
- Error states con acción de recuperación.
- Offline banner: "Engine not reachable" con "Retry", porque la app dependerá de una API local.
- Focus/hover/pressed states claros.

DATOS MOCK Y CÓDIGO
- src/types.ts con:
  MediaType = "movie" | "series";
  CatalogItem { id, title, year, type, poster, rating, progress? }
  MediaDetails extends CatalogItem { synopsis, genres, cast, director, runtime, seasons, audio, streams }
  Stream { id, resolution, size, codec, source, url, subtitles }
  Season { number, episodes }
  Episode { number, title, synopsis, duration, progress? }
  Channel { id, name, category, logoText, now, next, progress }
  Download { id, title, progress, speed, eta, status }
- src/data/mock.ts con 18 títulos, 4 series con temporadas y episodios, 6 canales y 3 descargas. Usa títulos reales de películas/series (sin marcas de plataformas).
- src/lib/api.ts con `interface CatalogApi` y una implementación `mockApi`. Deja un comentario claro de dónde irá `httpApi` apuntando a `http://127.0.0.1:<port>`.
- Pósteres: placeholders abstractos con gradientes neutros y el título; nada de URLs externas ni imágenes con copyright.
- Sin lorem ipsum visible: textos reales y creíbles.

REGLAS
- No hagas referencias a Netflix, Disney+, Prime Video, HBO, Apple TV+ ni a sus logos, colores o tipografías.
- No uses rojo como color de marca.
- No incluyas modo claro.
- No incluyas login, planes, anuncios ni perfiles.
- No inventes contenido para adultos.
- No uses emojis en la UI.
- No uses tablas de dashboard ni gráficos.
- Prioriza claridad, jerarquía y sensación premium sobria.

ENTREGABLE
- Proyecto completo y ejecutable.
- Lista de archivos creados.
- DESIGN.md con tokens, decisiones y componentes.
- Si hay límite de espacio, prioriza Home, Search, Details, Player y el sistema de modales; deja Live TV, Library y Settings completos pero más simples.
```
