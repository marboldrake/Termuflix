import {
  INITIAL_ADDONS,
  INITIAL_PLAYLISTS,
  MOCK_CHANNELS,
  MOCK_DOWNLOADS,
  MOCK_MEDIA,
  PROVIDERS,
} from "../data/mock";
import { filterCatalogItems, filterChannels } from "./catalogLogic";
import type {
  AddonItem,
  CatalogItem,
  Channel,
  ChannelCategory,
  Download,
  HomeFilter,
  MediaDetails,
  PlaylistItem,
  ProviderId,
  ProviderInfo,
} from "../types";

export interface SearchParams {
  query: string;
  filter: HomeFilter;
  provider: ProviderId;
  page: number;
  pageSize?: number;
}

export interface SearchResponse {
  items: CatalogItem[];
  total: number;
  hasMore: boolean;
}

export interface CatalogApi {
  getHomeCatalog(provider: ProviderId): Promise<CatalogItem[]>;
  searchCatalog(params: SearchParams): Promise<SearchResponse>;
  getMediaDetails(id: string): Promise<MediaDetails | null>;
  getChannels(category: ChannelCategory, query: string): Promise<Channel[]>;
  getDownloads(): Promise<Download[]>;
  getProviders(): Promise<ProviderInfo[]>;
  getPlaylists(): Promise<PlaylistItem[]>;
  getAddons(): Promise<AddonItem[]>;
}

/**
 * NOTE FOR RUST ENGINE INTEGRATION:
 * Replace `mockApi` with `httpApi` pointing to the local Termuflix Rust engine:
 *   const BASE_URL = `http://127.0.0.1:${port}/api/v1`;
 *
 * Example endpoints expected on the Rust HTTP server:
 *   - GET  ${BASE_URL}/catalog?provider=<id>
 *   - GET  ${BASE_URL}/search?q=<query>&type=<filter>&provider=<id>&page=<n>
 *   - GET  ${BASE_URL}/media/:id
 *   - GET  ${BASE_URL}/live/channels?category=<cat>&q=<query>
 *   - GET  ${BASE_URL}/downloads
 *   - POST ${BASE_URL}/downloads
 *   - GET  ${BASE_URL}/providers
 *   - GET  ${BASE_URL}/playlists
 *   - GET  ${BASE_URL}/addons
 */

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const BASE_URL = "http://127.0.0.1:8080/api/v1";

async function httpFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  if (!res.ok) {
    throw new Error(`Engine request failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

export const httpApi: CatalogApi = {
  async getHomeCatalog(provider: ProviderId): Promise<CatalogItem[]> {
    return httpFetch<CatalogItem[]>(`/catalog?provider=${encodeURIComponent(provider)}`);
  },

  async searchCatalog(params: SearchParams): Promise<SearchResponse> {
    const qs = new URLSearchParams({
      q: params.query,
      type: params.filter,
      provider: params.provider,
      page: String(params.page),
      pageSize: String(params.pageSize ?? 8),
    });
    return httpFetch<SearchResponse>(`/search?${qs.toString()}`);
  },

  async getMediaDetails(id: string): Promise<MediaDetails | null> {
    try {
      return await httpFetch<MediaDetails>(`/media/${encodeURIComponent(id)}`);
    } catch {
      return null;
    }
  },

  async getChannels(category: ChannelCategory, query: string): Promise<Channel[]> {
    const qs = new URLSearchParams({ category, q: query });
    return httpFetch<Channel[]>(`/live/channels?${qs.toString()}`);
  },

  async getDownloads(): Promise<Download[]> {
    return httpFetch<Download[]>("/downloads");
  },

  async getProviders(): Promise<ProviderInfo[]> {
    return httpFetch<ProviderInfo[]>("/providers");
  },

  async getPlaylists(): Promise<PlaylistItem[]> {
    return httpFetch<PlaylistItem[]>("/playlists");
  },

  async getAddons(): Promise<AddonItem[]> {
    return httpFetch<AddonItem[]>("/addons");
  },
};

export const mockApi: CatalogApi = {
  async getHomeCatalog(provider: ProviderId): Promise<CatalogItem[]> {
    await sleep(180);
    const items = filterCatalogItems(MOCK_MEDIA, { provider });
    return items.length > 0 ? items : MOCK_MEDIA;
  },

  async searchCatalog(params: SearchParams): Promise<SearchResponse> {
    await sleep(220);
    // Deterministic error trigger for testing error UI recovery
    if (params.query.trim().toLowerCase() === "error") {
      throw new Error(
        `Provider "${params.provider}" failed to respond (502 Proxy Timeout).`
      );
    }

    const filtered = filterCatalogItems(MOCK_MEDIA, {
      query: params.query,
      filter: params.filter,
      provider: params.provider,
    });

    const pageSize = params.pageSize ?? 8;
    const slice = filtered.slice(0, params.page * pageSize);

    return {
      items: slice,
      total: filtered.length,
      hasMore: slice.length < filtered.length,
    };
  },

  async getMediaDetails(id: string): Promise<MediaDetails | null> {
    await sleep(160);
    return MOCK_MEDIA.find((m) => m.id === id) ?? null;
  },

  async getChannels(
    category: ChannelCategory,
    query: string
  ): Promise<Channel[]> {
    await sleep(140);
    return filterChannels(MOCK_CHANNELS, category, query);
  },

  async getDownloads(): Promise<Download[]> {
    await sleep(100);
    return MOCK_DOWNLOADS;
  },

  async getProviders(): Promise<ProviderInfo[]> {
    await sleep(80);
    return PROVIDERS;
  },

  async getPlaylists(): Promise<PlaylistItem[]> {
    await sleep(80);
    return INITIAL_PLAYLISTS;
  },

  async getAddons(): Promise<AddonItem[]> {
    await sleep(80);
    return INITIAL_ADDONS;
  },
};
