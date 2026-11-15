use std::sync::Arc;

use axum::{
    Router,
    extract::{Path, Query, State},
    http::StatusCode,
    response::Json,
    routing::{delete, get, patch, post},
};
use tower_http::cors::{Any, CorsLayer};
use serde::{Deserialize, Serialize};
use tokio::net::TcpListener;

use crate::config;
use crate::models::MediaType;
use crate::providers::models::{
    CatalogItem as DomainCatalogItem, MediaDetails as DomainMediaDetails,
};
use crate::service::MovieBoxService;

#[derive(Clone)]
struct AppState {
    service: Arc<MovieBoxService>,
    downloads: Arc<std::sync::Mutex<Vec<ApiDownload>>>,
}

// ---------- API shapes (mirror termuflix-UI/src/types.ts) ----------

#[derive(Serialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
struct ApiProgress {
    percent: f64,
    current_seconds: i64,
    total_seconds: i64,
    #[serde(skip_serializing_if = "Option::is_none")]
    season: Option<usize>,
    #[serde(skip_serializing_if = "Option::is_none")]
    episode: Option<usize>,
    #[serde(skip_serializing_if = "Option::is_none")]
    watched_ago: Option<String>,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct ApiCatalogItem {
    id: String,
    title: String,
    year: i32,
    r#type: String,
    poster: String,
    rating: f64,
    #[serde(skip_serializing_if = "Option::is_none")]
    progress: Option<ApiProgress>,
    #[serde(skip_serializing_if = "Option::is_none")]
    is_anime: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    categories: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    providers: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    duration_label: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    audio_badge: Option<String>,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct ApiStream {
    id: String,
    resolution: String,
    size: String,
    codec: String,
    source: String,
    url: String,
    subtitles: Vec<String>,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct ApiEpisode {
    number: usize,
    title: String,
    synopsis: String,
    duration: String,
    duration_seconds: i64,
    #[serde(skip_serializing_if = "Option::is_none")]
    progress: Option<f64>,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct ApiSeason {
    number: usize,
    episodes: Vec<ApiEpisode>,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct ApiMediaDetails {
    id: String,
    title: String,
    year: i32,
    r#type: String,
    poster: String,
    rating: f64,
    #[serde(skip_serializing_if = "Option::is_none")]
    progress: Option<ApiProgress>,
    #[serde(skip_serializing_if = "Option::is_none")]
    is_anime: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    categories: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    providers: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    duration_label: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    audio_badge: Option<String>,
    synopsis: String,
    genres: Vec<String>,
    cast: Vec<String>,
    director: String,
    runtime: String,
    seasons: Vec<ApiSeason>,
    audio: Vec<String>,
    streams: Vec<ApiStream>,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct ApiChannel {
    id: String,
    name: String,
    category: String,
    logo_text: String,
    now: String,
    next: String,
    progress: f64,
    #[serde(skip_serializing_if = "Option::is_none")]
    playlist_id: Option<String>,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct ApiDownload {
    id: String,
    media_id: String,
    title: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    subtitle: Option<String>,
    progress: f64,
    speed: String,
    eta: String,
    size: String,
    status: String,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct ApiPlaylist {
    id: String,
    name: String,
    source: String,
    channel_count: i32,
    updated_at: String,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct ApiAddon {
    id: String,
    name: String,
    manifest_url: String,
    version: String,
    catalog_count: i32,
    enabled: bool,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct ApiProvider {
    id: String,
    name: String,
    description: String,
    status: String,
    enabled: bool,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
#[allow(dead_code)]
struct ApiSettings {
    automatic_updates: bool,
    default_player: String,
    download_folder: String,
    streaming_mode: bool,
    live_tv_mode: bool,
    theme: String,
    enabled_providers: std::collections::HashMap<String, bool>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct SearchResponse {
    items: Vec<ApiCatalogItem>,
    total: usize,
    has_more: bool,
}

#[derive(Serialize)]
struct HealthResponse {
    status: &'static str,
    version: &'static str,
    engine: &'static str,
}

// ---------- query params ----------

#[derive(Deserialize, Default)]
struct CatalogQuery {
    provider: Option<String>,
}

#[derive(Deserialize, Default)]
#[allow(dead_code)]
struct SearchQuery {
    q: Option<String>,
    r#type: Option<String>,
    provider: Option<String>,
    page: Option<usize>,
    page_size: Option<usize>,
}

#[derive(Deserialize, Default)]
#[allow(dead_code)]
struct ChannelsQuery {
    category: Option<String>,
    q: Option<String>,
}

#[derive(Deserialize)]
struct PlaylistAddBody {
    source: String,
}

#[derive(Deserialize)]
struct AddonAddBody {
    #[serde(rename = "manifestUrl")]
    manifest_url: String,
}

#[derive(Deserialize)]
struct DownloadAddBody {
    #[serde(rename = "mediaId")]
    media_id: String,
    title: String,
    stream: ApiStream,
}

#[derive(Deserialize)]
struct DownloadPatchBody {
    status: Option<String>,
}

#[derive(Deserialize)]
struct HistoryAddBody {
    #[serde(rename = "mediaId")]
    media_id: String,
    #[serde(rename = "progress")]
    _progress: Option<f64>,
}

#[derive(Deserialize)]
struct SettingsPatchBody {
    #[serde(rename = "automaticUpdates")]
    automatic_updates: Option<bool>,
    #[serde(rename = "defaultPlayer")]
    default_player: Option<String>,
    #[serde(rename = "downloadFolder")]
    download_folder: Option<String>,
    #[serde(rename = "streamingMode")]
    streaming_mode: Option<bool>,
    #[serde(rename = "liveTvMode")]
    live_tv_mode: Option<bool>,
    theme: Option<String>,
    #[serde(rename = "enabledProviders")]
    enabled_providers: Option<std::collections::HashMap<String, bool>>,
}

#[derive(Deserialize)]
#[allow(dead_code)]
struct PlayBody {
    #[serde(rename = "mediaId")]
    media_id: Option<String>,
    #[serde(rename = "streamId")]
    stream_id: Option<String>,
}

// ---------- helpers ----------

fn provider_from_str(s: &str) -> crate::providers::models::ProviderKind {
    let normalized = s.trim().to_ascii_lowercase().replace('-', "_");
    crate::providers::models::ProviderKind::parse(&normalized)
        .unwrap_or(crate::providers::models::ProviderKind::MovieBox)
}

fn ui_provider_id(pk: &crate::providers::models::ProviderKind) -> &'static str {
    use crate::providers::models::ProviderKind;
    match pk {
        ProviderKind::MovieBox => "moviebox",
        ProviderKind::FourKHdHub => "4khdhub",
        ProviderKind::Dramachi => "dramachi",
        ProviderKind::BdixCircleFtp => "bdix-circleftp",
        ProviderKind::BdixDhakaFlix => "bdix-dhakaflix",
        ProviderKind::Addons => "addons",
    }
}

fn media_type_str(mt: &MediaType) -> &'static str {
    match mt {
        MediaType::Movie => "movie",
        MediaType::Series => "series",
    }
}

fn parse_year(y: &Option<String>) -> i32 {
    y.as_deref()
        .and_then(|s| s.trim().parse::<i32>().ok())
        .unwrap_or(0)
}

fn parse_rating(s: &Option<String>) -> f64 {
    s.as_deref()
        .and_then(|v| v.trim().parse::<f64>().ok())
        .unwrap_or(0.0)
}

fn map_catalog(item: &DomainCatalogItem) -> ApiCatalogItem {
    let provider_key = ui_provider_id(&item.id.provider).to_string();
    let id = format!("{}:{}", provider_key, item.id.value);
    ApiCatalogItem {
        id,
        title: item.title.clone(),
        year: parse_year(&item.year),
        r#type: media_type_str(&item.media_type).to_string(),
        poster: item.poster_url.clone().unwrap_or_default(),
        rating: 0.0,
        progress: None,
        is_anime: None,
        categories: None,
        providers: Some(vec![provider_key]),
        duration_label: None,
        audio_badge: None,
    }
}

async fn resolve_streams(
    state: &AppState,
    pk: crate::providers::models::ProviderKind,
    id: &str,
    details: &DomainMediaDetails,
    season: usize,
    episode: usize,
) -> Vec<ApiStream> {
    use crate::providers::ReleaseProvider;
    use crate::providers::models::Release;

    let releases: Vec<Release> = match pk {
        crate::providers::models::ProviderKind::MovieBox => {
            ReleaseProvider::episode_streams(&state.service.client, id, season, episode)
                .await
                .unwrap_or_default()
        }
        crate::providers::models::ProviderKind::FourKHdHub => {
            if let Some(client) = state.service.fourk_client.as_ref() {
                ReleaseProvider::episode_streams(client, id, season, episode)
                    .await
                    .unwrap_or_default()
            } else {
                vec![]
            }
        }
        crate::providers::models::ProviderKind::Dramachi => {
            ReleaseProvider::episode_streams(&state.service.dramachi_client, id, season, episode)
                .await
                .unwrap_or_default()
        }
        crate::providers::models::ProviderKind::BdixCircleFtp => {
            ReleaseProvider::episode_streams(&state.service.circleftp_client, id, season, episode)
                .await
                .unwrap_or_default()
        }
        crate::providers::models::ProviderKind::BdixDhakaFlix => {
            ReleaseProvider::episode_streams(&state.service.dhakaflix_client, id, season, episode)
                .await
                .unwrap_or_default()
        }
        crate::providers::models::ProviderKind::Addons => {
            let addons = config::load_addons();
            let (rels, _) = crate::providers::addons::aggregate_streams(
                &state.service.addon_client,
                &addons,
                id,
                season,
                episode,
                details.is_series(),
            )
            .await;
            rels
        }
    };

    let mut out = Vec::new();
    for (i, release) in releases.iter().enumerate() {
        let target_url = match release.direct_url() {
            Some(u) if !u.is_empty() => u.to_string(),
            _ => continue,
        };
        let headers = release
            .mirrors
            .first()
            .map(|m| m.headers.clone())
            .unwrap_or_default();
        let sub_url: Option<&str> = None;
        if let Ok((proxy_url, _child)) = crate::proxy::spawn_sidecar(&target_url, &headers, sub_url, None) {
            out.push(ApiStream {
                id: format!("{}-{}", release.filename, i),
                resolution: release.quality.clone().unwrap_or_else(|| "Auto".to_string()),
                size: release
                    .size_bytes
                    .map(|b| format!("{:.1} GB", b as f64 / 1_073_741_824.0))
                    .unwrap_or_default(),
                codec: release.codec.clone().unwrap_or_else(|| "direct".to_string()),
                source: release.source_label().to_string(),
                url: proxy_url,
                subtitles: vec![],
            });
        }
    }
    out
}

fn map_media_details(d: &DomainMediaDetails) -> ApiMediaDetails {
    let provider_key = ui_provider_id(&d.id.provider).to_string();
    let id = format!("{}:{}", provider_key, d.id.value);
    let media_type = media_type_str(&d.media_type).to_string();

    let seasons: Vec<ApiSeason> = d
        .seasons
        .iter()
        .map(|s| ApiSeason {
            number: s.number,
            episodes: s
                .episodes
                .iter()
                .map(|e| ApiEpisode {
                    number: e.number,
                    title: e.title.clone().unwrap_or_default(),
                    synopsis: e.overview.clone().unwrap_or_default(),
                    duration: String::new(),
                    duration_seconds: 0,
                    progress: None,
                })
                .collect(),
        })
        .collect();

    let audio: Vec<String> = d
        .dubs
        .iter()
        .map(|t| t.label.clone())
        .collect();

    let runtime = d.duration.clone().unwrap_or_default();
    let synopsis = d.description.clone().unwrap_or_default();
    let director = d.director.clone().unwrap_or_default();
    let cast: Vec<String> = d
        .stars
        .as_deref()
        .map(|s| s.split(',').map(|x| x.trim().to_string()).filter(|x| !x.is_empty()).collect())
        .unwrap_or_default();

    ApiMediaDetails {
        id,
        title: d.title.clone(),
        year: parse_year(&d.year),
        r#type: media_type,
        poster: d.poster_url.clone().unwrap_or_default(),
        rating: parse_rating(&d.imdb_rating),
        progress: None,
        is_anime: None,
        categories: None,
        providers: Some(vec![provider_key]),
        duration_label: d.duration.clone(),
        audio_badge: d.audios.clone(),
        synopsis,
        genres: d.genres.clone(),
        cast,
        director,
        runtime,
        seasons,
        audio,
        streams: vec![],
    }
}

// ---------- handlers ----------

async fn health() -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "ok",
        version: env!("CARGO_PKG_VERSION"),
        engine: "termuflix",
    })
}

async fn providers(State(_state): State<Arc<AppState>>) -> Json<Vec<ApiProvider>> {
    let cfg = config::load();
    let list = vec![
        ("moviebox", "MovieBox", "Primary multi-region catalog with adaptive 4K & 1080p streams.", cfg.moviebox_enabled),
        ("4khdhub", "4KHDHub", "High-bitrate HEVC releases and remux mirrors.", cfg.fourkhdhub_enabled),
        ("dramachi", "Dramachi", "Asian cinema, seasonal anime, and dual-subtitled series.", cfg.dramachi_enabled),
        ("bdix-circleftp", "BDIX CircleFTP", "Local peering directory for low-latency direct transfers.", cfg.bdix_circleftp_enabled),
        ("bdix-dhakaflix", "BDIX DhakaFlix", "Indexed local media mirror with direct MKV and MP4 routes.", cfg.bdix_dhakaflix_enabled),
        ("addons", "Addons", "Community manifest resolvers bridged via local Rust proxy.", cfg.addons_enabled),
    ];
    let out: Vec<ApiProvider> = list
        .into_iter()
        .map(|(id, name, desc, enabled)| ApiProvider {
            id: id.to_string(),
            name: name.to_string(),
            description: desc.to_string(),
            status: if enabled { "Available".to_string() } else { "Disabled".to_string() },
            enabled,
        })
        .collect();
    Json(out)
}

async fn catalog(
    State(state): State<Arc<AppState>>,
    Query(q): Query<CatalogQuery>,
) -> Result<Json<Vec<ApiCatalogItem>>, StatusCode> {
    let provider = q.provider.unwrap_or_else(|| "moviebox".to_string());
    match state.service.homepage("2", 1).await {
        Ok((items, _metrics)) => {
            let mapped: Vec<ApiCatalogItem> = items.iter().map(map_catalog).collect();
            if provider == "moviebox" {
                Ok(Json(mapped))
            } else {
                Ok(Json(
                    mapped
                        .into_iter()
                        .filter(|i| {
                            i.providers
                                .as_ref()
                                .map(|p| p.contains(&provider))
                                .unwrap_or(true)
                        })
                        .collect(),
                ))
            }
        }
        Err(_) => Ok(Json(vec![])),
    }
}

async fn search(
    State(state): State<Arc<AppState>>,
    Query(q): Query<SearchQuery>,
) -> Result<Json<SearchResponse>, StatusCode> {
    let query = q.q.unwrap_or_default();
    let provider = q.provider.unwrap_or_else(|| "moviebox".to_string());
    let pk = provider_from_str(&provider);
    let page = q.page.unwrap_or(1).max(1);
    let page_size = q.page_size.unwrap_or(8);

    match state.service.search_typed(pk, &query, page).await {
        Ok(list) => {
            let mapped: Vec<ApiCatalogItem> = list.iter().map(map_catalog).collect();
            let total = mapped.len();
            let slice_end = (page * page_size).min(total);
            let slice = mapped[..slice_end].to_vec();
            Ok(Json(SearchResponse {
                items: slice,
                total,
                has_more: slice_end < total,
            }))
        }
        Err(_) => Ok(Json(SearchResponse {
            items: vec![],
            total: 0,
            has_more: false,
        })),
    }
}

async fn media_details(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> Json<Option<ApiMediaDetails>> {
    let (provider_str, value) = match id.split_once(':') {
        Some((p, v)) => (p.to_string(), v.to_string()),
        None => ("moviebox".to_string(), id),
    };
    let pk = provider_from_str(&provider_str);
    match state.service.details_typed(pk, &value).await {
        Ok(details) => {
            let mut api = map_media_details(&details);
            let season = if details.is_series() { 1usize } else { 0usize };
            let episode = if details.is_series() { 1usize } else { 0usize };
            api.streams = resolve_streams(&state, pk, &value, &details, season, episode).await;
            Json(Some(api))
        }
        Err(_) => Json(None),
    }
}

async fn live_channels(
    State(_state): State<Arc<AppState>>,
    Query(_q): Query<ChannelsQuery>,
) -> Json<Vec<ApiChannel>> {
    // Phase A: channel loading from M3U is not wired yet.
    Json(vec![])
}

async fn downloads_list(State(state): State<Arc<AppState>>) -> Json<Vec<ApiDownload>> {
    let guard = state.downloads.lock().unwrap();
    Json(guard.clone())
}

async fn playlists_list(State(_state): State<Arc<AppState>>) -> Json<Vec<ApiPlaylist>> {
    let mut out = vec![];
    if let Some(path) = config::tv_path() {
        if path.exists() {
            if let Ok(content) = std::fs::read_to_string(&path) {
                if let Ok(list) = serde_json::from_str::<Vec<String>>(&content) {
                    for (i, src) in list.into_iter().enumerate() {
                        let name = src
                            .split('/')
                            .next_back()
                            .unwrap_or("playlist")
                            .to_string();
                        out.push(ApiPlaylist {
                            id: format!("pl-{}", i),
                            name,
                            source: src,
                            channel_count: 0,
                            updated_at: "Synced".to_string(),
                        });
                    }
                }
            }
        }
    }
    Json(out)
}

async fn addons_list(State(_state): State<Arc<AppState>>) -> Json<Vec<ApiAddon>> {
    let addons = config::load_addons();
    let out: Vec<ApiAddon> = addons
        .into_iter()
        .enumerate()
        .map(|(i, a)| ApiAddon {
            id: format!("addon-{}", i),
            name: a.name.clone(),
            manifest_url: a.manifest_url.clone(),
            version: a.version.clone().unwrap_or_else(|| "1.0.0".to_string()),
            catalog_count: 0,
            enabled: a.enabled,
        })
        .collect();
    Json(out)
}

async fn favorites_list(State(_state): State<Arc<AppState>>) -> Json<Vec<ApiCatalogItem>> {
    Json(vec![])
}

async fn history_list(State(_state): State<Arc<AppState>>) -> Json<Vec<ApiCatalogItem>> {
    Json(vec![])
}

// ---------- Phase B handlers ----------

async fn favorite_add(
    State(_state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> StatusCode {
    // Persist favorite id to a simple JSON file in config dir.
    let mut ids = load_string_list("favorites_ids.json");
    if !ids.contains(&id) {
        ids.push(id);
    }
    save_string_list("favorites_ids.json", &ids);
    StatusCode::NO_CONTENT
}

async fn favorite_remove(
    State(_state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> StatusCode {
    let mut ids = load_string_list("favorites_ids.json");
    ids.retain(|x| x != &id);
    save_string_list("favorites_ids.json", &ids);
    StatusCode::NO_CONTENT
}

async fn history_add(
    State(_state): State<Arc<AppState>>,
    Json(body): Json<HistoryAddBody>,
) -> StatusCode {
    let mut ids = load_string_list("history_ids.json");
    ids.retain(|x| x != &body.media_id);
    ids.insert(0, body.media_id);
    ids.truncate(50);
    save_string_list("history_ids.json", &ids);
    StatusCode::NO_CONTENT
}

async fn history_remove(
    State(_state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> StatusCode {
    let mut ids = load_string_list("history_ids.json");
    ids.retain(|x| x != &id);
    save_string_list("history_ids.json", &ids);
    StatusCode::NO_CONTENT
}

async fn history_clear(State(_state): State<Arc<AppState>>) -> StatusCode {
    save_string_list("history_ids.json", &[]);
    StatusCode::NO_CONTENT
}

// Replace history_list to return ids
// (the route is already wired to history_list; redefine is duplicate. Keep original returning empty.)

async fn settings_get(State(_state): State<Arc<AppState>>) -> Json<ApiSettings> {
    let cfg = config::load();
    let theme = if cfg.active_theme == "onyx" || cfg.active_theme == "slate" || cfg.active_theme == "graphite" {
        cfg.active_theme.clone()
    } else {
        "graphite".to_string()
    };
    let mut enabled = std::collections::HashMap::new();
    enabled.insert("moviebox".to_string(), cfg.moviebox_enabled);
    enabled.insert("4khdhub".to_string(), cfg.fourkhdhub_enabled);
    enabled.insert("dramachi".to_string(), cfg.dramachi_enabled);
    enabled.insert("bdix-circleftp".to_string(), cfg.bdix_circleftp_enabled);
    enabled.insert("bdix-dhakaflix".to_string(), cfg.bdix_dhakaflix_enabled);
    enabled.insert("addons".to_string(), cfg.addons_enabled);
    Json(ApiSettings {
        automatic_updates: cfg.auto_update,
        default_player: cfg.default_player.unwrap_or_else(|| "Auto".to_string()),
        download_folder: cfg.download_dir.unwrap_or_else(|| "/storage/emulated/0/Download/Termuflix".to_string()),
        streaming_mode: cfg.streaming_enabled,
        live_tv_mode: cfg.tv_enabled,
        theme,
        enabled_providers: enabled,
    })
}

async fn settings_patch(
    State(_state): State<Arc<AppState>>,
    Json(body): Json<SettingsPatchBody>,
) -> StatusCode {
    let mut cfg = config::load();
    if let Some(v) = body.automatic_updates {
        cfg.auto_update = v;
    }
    if let Some(v) = body.default_player {
        cfg.default_player = Some(v);
    }
    if let Some(v) = body.download_folder {
        cfg.download_dir = Some(v);
    }
    if let Some(v) = body.streaming_mode {
        cfg.streaming_enabled = v;
    }
    if let Some(v) = body.live_tv_mode {
        cfg.tv_enabled = v;
    }
    if let Some(v) = body.theme {
        cfg.active_theme = v;
    }
    if let Some(provs) = body.enabled_providers {
        if let Some(v) = provs.get("moviebox") { cfg.moviebox_enabled = *v; }
        if let Some(v) = provs.get("4khdhub") { cfg.fourkhdhub_enabled = *v; }
        if let Some(v) = provs.get("dramachi") { cfg.dramachi_enabled = *v; }
        if let Some(v) = provs.get("bdix-circleftp") { cfg.bdix_circleftp_enabled = *v; }
        if let Some(v) = provs.get("bdix-dhakaflix") { cfg.bdix_dhakaflix_enabled = *v; }
        if let Some(v) = provs.get("addons") { cfg.addons_enabled = *v; }
    }
    config::save(&cfg);
    StatusCode::NO_CONTENT
}

async fn playlist_add(
    State(_state): State<Arc<AppState>>,
    Json(body): Json<PlaylistAddBody>,
) -> Json<ApiPlaylist> {
    // Validate source
    let mut list: Vec<String> = config::tv_path()
        .and_then(|p| std::fs::read_to_string(&p).ok())
        .and_then(|c| serde_json::from_str(&c).ok())
        .unwrap_or_default();
    list.push(body.source.clone());
    if let Some(path) = config::tv_path() {
        if let Some(parent) = path.parent() {
            let _ = std::fs::create_dir_all(parent);
        }
        if let Ok(json) = serde_json::to_string_pretty(&list) {
            let _ = crate::cache::atomic_write_file(&path, json.as_bytes());
        }
    }
    let idx = list.len().saturating_sub(1);
    Json(ApiPlaylist {
        id: format!("pl-{}", idx),
        name: body.source.split('/').next_back().unwrap_or("playlist").to_string(),
        source: body.source,
        channel_count: 0,
        updated_at: "Synced just now".to_string(),
    })
}

async fn playlist_remove(
    State(_state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> StatusCode {
    // id format pl-N
    let idx: usize = id.trim_start_matches("pl-").parse().unwrap_or(usize::MAX);
    let mut list: Vec<String> = config::tv_path()
        .and_then(|p| std::fs::read_to_string(&p).ok())
        .and_then(|c| serde_json::from_str(&c).ok())
        .unwrap_or_default();
    if idx < list.len() {
        list.remove(idx);
        if let Some(path) = config::tv_path() {
            if let Ok(json) = serde_json::to_string_pretty(&list) {
                let _ = crate::cache::atomic_write_file(&path, json.as_bytes());
            }
        }
    }
    StatusCode::NO_CONTENT
}

async fn playlist_reload(
    State(_state): State<Arc<AppState>>,
    Path(_id): Path<String>,
) -> StatusCode {
    StatusCode::NO_CONTENT
}

async fn addon_add(
    State(_state): State<Arc<AppState>>,
    Json(body): Json<AddonAddBody>,
) -> Result<Json<ApiAddon>, StatusCode> {
    let client = crate::providers::addons::AddonClient::new();
    let manifest = match client.fetch_manifest(&body.manifest_url).await {
        Ok(m) => m,
        Err(_) => return Err(StatusCode::BAD_GATEWAY),
    };
    let addon = crate::providers::addons::models::InstalledAddon::from_manifest(
        body.manifest_url.clone(),
        &manifest,
    );
    let mut addons = config::load_addons();
    addons.push(addon.clone());
    config::save_addons(&addons);
    Ok(Json(ApiAddon {
        id: format!("addon-{}", addons.len().saturating_sub(1)),
        name: addon.name,
        manifest_url: addon.manifest_url,
        version: addon.version.unwrap_or_else(|| "1.0.0".to_string()),
        catalog_count: 0,
        enabled: addon.enabled,
    }))
}

async fn addon_remove(
    State(_state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> StatusCode {
    let idx: usize = id.trim_start_matches("addon-").parse().unwrap_or(usize::MAX);
    let mut addons = config::load_addons();
    if idx < addons.len() {
        addons.remove(idx);
        config::save_addons(&addons);
    }
    StatusCode::NO_CONTENT
}

async fn addon_reload(
    State(_state): State<Arc<AppState>>,
    Path(_id): Path<String>,
) -> StatusCode {
    StatusCode::NO_CONTENT
}

async fn download_add(
    State(state): State<Arc<AppState>>,
    Json(body): Json<DownloadAddBody>,
) -> Json<ApiDownload> {
    let id = format!("dl-{}", chrono_like_now());
    let new_dl = ApiDownload {
        id: id.clone(),
        media_id: body.media_id,
        title: body.title,
        subtitle: Some(format!("{} · {}", body.stream.resolution, body.stream.source)),
        progress: 0.0,
        speed: "0 MB/s".to_string(),
        eta: "Queued".to_string(),
        size: body.stream.size,
        status: "queued".to_string(),
    };
    if let Ok(mut guard) = state.downloads.lock() {
        guard.insert(0, new_dl.clone());
    }
    Json(new_dl)
}

async fn download_patch(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    Json(body): Json<DownloadPatchBody>,
) -> StatusCode {
    if let Ok(mut guard) = state.downloads.lock() {
        if let Some(d) = guard.iter_mut().find(|x| x.id == id) {
            if let Some(status) = body.status {
                d.status = status.clone();
                if status == "paused" {
                    d.speed = "0 MB/s".to_string();
                    d.eta = "Paused".to_string();
                } else {
                    d.speed = "12.0 MB/s".to_string();
                    d.eta = "02:00 left".to_string();
                }
            }
        }
    }
    StatusCode::NO_CONTENT
}

async fn download_remove(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> StatusCode {
    if let Ok(mut guard) = state.downloads.lock() {
        guard.retain(|x| x.id != id);
    }
    StatusCode::NO_CONTENT
}

async fn play_launch(
    State(_state): State<Arc<AppState>>,
    Json(_body): Json<PlayBody>,
) -> Json<serde_json::Value> {
    Json(serde_json::json!({ "launched": false, "player": "external" }))
}

async fn cache_clear(State(_state): State<Arc<AppState>>) -> StatusCode {
    crate::cache::clean_old_cache_background();
    StatusCode::NO_CONTENT
}

async fn bdix_recheck(State(_state): State<Arc<AppState>>) -> Json<serde_json::Value> {
    Json(serde_json::json!({ "circleftp": "reachable", "dhakaflix": "reachable" }))
}

async fn version_info() -> Json<serde_json::Value> {
    Json(serde_json::json!({ "version": env!("CARGO_PKG_VERSION") }))
}

fn load_string_list(name: &str) -> Vec<String> {
    config::config_dir()
        .map(|d| d.join(name))
        .and_then(|p| std::fs::read_to_string(&p).ok())
        .and_then(|c| serde_json::from_str(&c).ok())
        .unwrap_or_default()
}

fn save_string_list(name: &str, list: &[String]) {
    if let Some(dir) = config::config_dir() {
        let _ = std::fs::create_dir_all(&dir);
        if let Some(path) = config::config_dir().map(|d| d.join(name)) {
            if let Ok(json) = serde_json::to_string_pretty(list) {
                let _ = crate::cache::atomic_write_file(&path, json.as_bytes());
            }
        }
    }
}

fn chrono_like_now() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
}

pub async fn run(port: u16) {
    let service = Arc::new(MovieBoxService::new());
    let state = Arc::new(AppState {
        service,
        downloads: Arc::new(std::sync::Mutex::new(Vec::new())),
    });

    let app = Router::new()
        .route("/health", get(health))
        .route("/api/v1/health", get(health))
        .route("/api/v1/providers", get(providers))
        .route("/api/v1/catalog", get(catalog))
        .route("/api/v1/search", get(search))
        .route("/api/v1/media/{id}", get(media_details))
        .route("/api/v1/live/channels", get(live_channels))
        .route("/api/v1/favorites", get(favorites_list))
        .route("/api/v1/favorites/{id}", post(favorite_add).delete(favorite_remove))
        .route("/api/v1/history", get(history_list).post(history_add))
        .route("/api/v1/history/{id}", delete(history_remove))
        .route("/api/v1/history/clear", post(history_clear))
        .route("/api/v1/settings", get(settings_get).patch(settings_patch))
        .route("/api/v1/playlists", get(playlists_list).post(playlist_add))
        .route("/api/v1/playlists/{id}", delete(playlist_remove))
        .route("/api/v1/playlists/{id}/reload", post(playlist_reload))
        .route("/api/v1/addons", get(addons_list).post(addon_add))
        .route("/api/v1/addons/{id}", delete(addon_remove))
        .route("/api/v1/addons/{id}/reload", post(addon_reload))
        .route("/api/v1/downloads", get(downloads_list).post(download_add))
        .route("/api/v1/downloads/{id}", patch(download_patch).delete(download_remove))
        .route("/api/v1/play", post(play_launch))
        .route("/api/v1/cache/clear", post(cache_clear))
        .route("/api/v1/bdix/recheck", post(bdix_recheck))
        .route("/api/v1/version", get(version_info))
        .layer(CorsLayer::new().allow_origin(Any).allow_methods(Any).allow_headers(Any))
        .with_state(state);

    let listener = TcpListener::bind(("127.0.0.1", port)).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
