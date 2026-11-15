use std::sync::Arc;

use axum::{
    Router,
    extract::{Path, Query, State},
    http::StatusCode,
    response::Json,
    routing::get,
};
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

#[derive(Serialize, Clone)]
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
        Ok(details) => Json(Some(map_media_details(&details))),
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

async fn downloads_list(State(_state): State<Arc<AppState>>) -> Json<Vec<ApiDownload>> {
    Json(vec![])
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

pub async fn run(port: u16) {
    let service = Arc::new(MovieBoxService::new());
    let state = Arc::new(AppState { service });

    let app = Router::new()
        .route("/health", get(health))
        .route("/api/v1/health", get(health))
        .route("/api/v1/providers", get(providers))
        .route("/api/v1/catalog", get(catalog))
        .route("/api/v1/search", get(search))
        .route("/api/v1/media/{id}", get(media_details))
        .route("/api/v1/live/channels", get(live_channels))
        .route("/api/v1/downloads", get(downloads_list))
        .route("/api/v1/playlists", get(playlists_list))
        .route("/api/v1/addons", get(addons_list))
        .route("/api/v1/favorites", get(favorites_list))
        .route("/api/v1/history", get(history_list))
        .with_state(state);

    let listener = TcpListener::bind(("127.0.0.1", port)).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
