const JWPLAYER_SITE_ID = process.env.JWPLAYER_SITE_ID;
const JWPLAYER_API_SECRET = process.env.JWPLAYER_API_SECRET;

// Server-side cache for JW Player API responses
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class JWPlayerCache {
  private playlistCache = new Map<string, CacheEntry<JWPlayerPlaylistItem[]>>();
  private mediaCache = new Map<string, CacheEntry<JWPlayerPlaylistItem | null>>();
  private seriesEpisodesCache = new Map<string, CacheEntry<any>>();
  private seriesInfoCache = new Map<string, CacheEntry<any>>();
  
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly SERIES_TTL = 10 * 60 * 1000; // 10 minutes for series data
  
  private isValid<T>(entry: CacheEntry<T> | undefined): entry is CacheEntry<T> {
    if (!entry) return false;
    return Date.now() - entry.timestamp < entry.ttl;
  }
  
  getPlaylist(playlistId: string): JWPlayerPlaylistItem[] | null {
    const entry = this.playlistCache.get(playlistId);
    if (this.isValid(entry)) {
      return entry.data;
    }
    return null;
  }
  
  setPlaylist(playlistId: string, data: JWPlayerPlaylistItem[], ttl = this.DEFAULT_TTL): void {
    this.playlistCache.set(playlistId, { data, timestamp: Date.now(), ttl });
  }
  
  getMedia(mediaId: string): JWPlayerPlaylistItem | null | undefined {
    const entry = this.mediaCache.get(mediaId);
    if (this.isValid(entry)) {
      return entry.data;
    }
    return undefined; // undefined means not cached, null means cached as null
  }
  
  setMedia(mediaId: string, data: JWPlayerPlaylistItem | null, ttl = this.DEFAULT_TTL): void {
    this.mediaCache.set(mediaId, { data, timestamp: Date.now(), ttl });
  }
  
  getSeriesEpisodes(seriesId: string): any | null {
    const entry = this.seriesEpisodesCache.get(seriesId);
    if (this.isValid(entry)) {
      return entry.data;
    }
    return null;
  }
  
  setSeriesEpisodes(seriesId: string, data: any): void {
    this.seriesEpisodesCache.set(seriesId, { data, timestamp: Date.now(), ttl: this.SERIES_TTL });
  }
  
  getSeriesInfo(seriesId: string): any | null {
    const entry = this.seriesInfoCache.get(seriesId);
    if (this.isValid(entry)) {
      return entry.data;
    }
    return null;
  }
  
  setSeriesInfo(seriesId: string, data: any): void {
    this.seriesInfoCache.set(seriesId, { data, timestamp: Date.now(), ttl: this.SERIES_TTL });
  }
  
  getCacheStats(): { playlists: number; media: number; series: number } {
    return {
      playlists: this.playlistCache.size,
      media: this.mediaCache.size,
      series: this.seriesEpisodesCache.size + this.seriesInfoCache.size
    };
  }
}

export const jwPlayerCache = new JWPlayerCache();

export const PLAYLISTS = {
  heroBanner: "KMhhEA3u",
  featured: "WqLLBMnx",
  recommended: "hkXBUtcd",
  popular: "8A1ZTwWl",
  newMovies: "SnbG7v6j",
  documentaries: "RytYkppn",
};

export const SPORT_PLAYLISTS = [
  { id: "PFauvVKV", name: "College", slug: "college" },
  { id: "QzHRrJRZ", name: "Soccer", slug: "soccer" },
  { id: "BC45vsNB", name: "Baseball", slug: "baseball" },
  { id: "FZgrLpfJ", name: "Football", slug: "football" },
  { id: "YY5zhjLQ", name: "Basketball", slug: "basketball" },
  { id: "iCwCBaL7", name: "Action Sports", slug: "action-sports" },
];

export interface JWPlayerMediaSource {
  file: string;
  type: string;
  width?: number;
  height?: number;
  label?: string;
}

export interface JWPlayerImage {
  src: string;
  width: number;
  type: string;
}

export interface JWPlayerPlaylistItem {
  mediaid: string;
  title: string;
  description?: string;
  duration: number;
  pubdate: number;
  image: string;
  images?: JWPlayerImage[];
  sources: JWPlayerMediaSource[];
  tracks?: Array<{ file: string; kind: string; label?: string }>;
  tags?: string;
  feedid?: string;
  link?: string;
  variations?: Record<string, { images?: JWPlayerImage[] }>;
  custom_params?: Record<string, string>;
  trailerId?: string;
  genre?: string;
  rating?: string;
  contentType?: string;
}

export interface JWPlayerPlaylistResponse {
  title: string;
  description?: string;
  kind: string;
  feedid: string;
  playlist: JWPlayerPlaylistItem[];
}

export async function fetchJWPlayerPlaylist(playlistId: string): Promise<JWPlayerPlaylistItem[]> {
  // Check cache first
  const cached = jwPlayerCache.getPlaylist(playlistId);
  if (cached !== null) {
    return cached;
  }
  
  try {
    const response = await fetch(
      `https://cdn.jwplayer.com/v2/playlists/${playlistId}`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error(`JW Player Delivery API error: ${response.status} ${response.statusText}`);
      // Cache empty result for 30s to avoid hammering upstream on failures
      jwPlayerCache.setPlaylist(playlistId, [], 30 * 1000);
      return [];
    }

    const data: JWPlayerPlaylistResponse = await response.json();
    const playlist = data.playlist || [];
    
    // Cache the result
    jwPlayerCache.setPlaylist(playlistId, playlist);
    
    return playlist;
  } catch (error) {
    console.error("Failed to fetch JW Player playlist:", error);
    // Cache empty result for 30s on network errors
    jwPlayerCache.setPlaylist(playlistId, [], 30 * 1000);
    return [];
  }
}

export async function fetchJWPlayerMedia(mediaId: string): Promise<JWPlayerPlaylistItem | null> {
  // Check cache first
  const cached = jwPlayerCache.getMedia(mediaId);
  if (cached !== undefined) {
    return cached;
  }
  
  try {
    const response = await fetch(
      `https://cdn.jwplayer.com/v2/media/${mediaId}`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      jwPlayerCache.setMedia(mediaId, null);
      return null;
    }

    const data: JWPlayerPlaylistResponse = await response.json();
    const media = data.playlist?.[0] || null;
    
    // Cache the result
    jwPlayerCache.setMedia(mediaId, media);
    
    return media;
  } catch (error) {
    console.error("Failed to fetch JW Player media:", error);
    return null;
  }
}

export interface SeriesEpisode {
  episode_number: number;
  media_item: {
    mediaid: string;
    title: string;
    description?: string;
    duration: number;
    image: string;
    images?: JWPlayerImage[];
    tags?: string;
    pubdate?: number;
    contentType?: string;
  };
}

export interface SeriesEpisodesResponse {
  page: number;
  page_limit: number;
  total: number;
  episodes: SeriesEpisode[];
}

export interface SeriesInfo {
  series_id: string;
  seasons: Array<{
    season_id: string;
    season_number: number;
    season_title: string;
    season_description: string;
    episode_count: number;
    total_duration: number;
  }>;
  total_duration: number;
  episode_count: number;
  season_count: number;
}

export async function fetchSeriesInfo(seriesId: string): Promise<SeriesInfo | null> {
  // Check cache first
  const cached = jwPlayerCache.getSeriesInfo(seriesId);
  if (cached !== null) {
    return cached;
  }
  
  try {
    const response = await fetch(
      `https://cdn.jwplayer.com/apps/series/${seriesId}`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    jwPlayerCache.setSeriesInfo(seriesId, data);
    return data;
  } catch (error) {
    console.error("Failed to fetch JW Player series info:", error);
    return null;
  }
}

export async function fetchSeriesEpisodes(seriesId: string, seasonNumber: number = 1): Promise<SeriesEpisode[]> {
  // Check cache first
  const cacheKey = `${seriesId}_s${seasonNumber}`;
  const cached = jwPlayerCache.getSeriesEpisodes(cacheKey);
  if (cached !== null) {
    return cached;
  }
  
  try {
    const response = await fetch(
      `https://cdn.jwplayer.com/apps/series/${seriesId}/seasons/${seasonNumber}/episodes`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error(`JW Player Series Episodes API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const data: SeriesEpisodesResponse = await response.json();
    const episodes = data.episodes || [];
    jwPlayerCache.setSeriesEpisodes(cacheKey, episodes);
    return episodes;
  } catch (error) {
    console.error("Failed to fetch JW Player series episodes:", error);
    return [];
  }
}

export async function fetchAllJWPlayerMedia(): Promise<JWPlayerPlaylistItem[]> {
  if (!JWPLAYER_SITE_ID) {
    console.warn("JW Player Site ID not configured");
    return [];
  }

  try {
    const response = await fetch(
      `https://cdn.jwplayer.com/v2/sites/${JWPLAYER_SITE_ID}/media/`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      console.log(`Trying Management API fallback...`);
      return await fetchFromManagementAPI();
    }

    const data: JWPlayerPlaylistResponse = await response.json();
    return data.playlist || [];
  } catch (error) {
    console.error("Failed to fetch JW Player media list:", error);
    return await fetchFromManagementAPI();
  }
}

async function fetchFromManagementAPI(): Promise<JWPlayerPlaylistItem[]> {
  if (!JWPLAYER_SITE_ID || !JWPLAYER_API_SECRET) {
    return [];
  }

  try {
    const response = await fetch(
      `https://api.jwplayer.com/v2/sites/${JWPLAYER_SITE_ID}/media?page_length=50`,
      {
        headers: {
          Authorization: `Bearer ${JWPLAYER_API_SECRET}`,
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error(`JW Player Management API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    
    if (data.media && Array.isArray(data.media)) {
      return data.media.map((item: any) => ({
        mediaid: item.id,
        title: item.metadata?.title || item.title || "Untitled",
        description: item.metadata?.description || item.description,
        duration: item.duration || 0,
        pubdate: new Date(item.created).getTime() / 1000,
        image: `https://cdn.jwplayer.com/v2/media/${item.id}/poster.jpg?width=640`,
        sources: [],
        tags: item.metadata?.tags?.join(",") || "",
      }));
    }
    
    return [];
  } catch (error) {
    console.error("Management API fallback failed:", error);
    return [];
  }
}

export function getJWPlayerThumbnail(mediaId: string, width: number = 640): string {
  return `https://cdn.jwplayer.com/v2/media/${mediaId}/poster.jpg?width=${width}`;
}

export function getJWPlayerVerticalPoster(mediaId: string): string {
  return `https://cdn.jwplayer.com/v2/media/${mediaId}/images/Vertical-Poster.jpg`;
}

export function getJWPlayerHeroImage(mediaId: string): string {
  return `https://cdn.jwplayer.com/v2/media/${mediaId}/poster.jpg?width=1920`;
}

export function getJWPlayerHeroBannerLogo(mediaId: string): string {
  return `https://cdn.jwplayer.com/v2/media/${mediaId}/images/hero-banner-logo.png`;
}

export function getJWPlayerMotionThumbnail(mediaId: string, width: number = 640): string {
  return `https://cdn.jwplayer.com/v2/media/${mediaId}/poster.mp4?width=${width}`;
}

export function extractMotionThumbnailFromImages(images?: JWPlayerImage[]): string | null {
  if (!images) return null;
  const motionThumbnails = images.filter(img => img.type === 'video/mp4');
  if (motionThumbnails.length === 0) return null;
  const largest = motionThumbnails.reduce((a, b) => a.width > b.width ? a : b);
  return largest.src;
}

export async function checkMotionThumbnailExists(mediaId: string): Promise<string | null> {
  const url = getJWPlayerMotionThumbnail(mediaId, 640);
  try {
    const response = await fetch(url, { method: 'GET', redirect: 'manual' });
    if (response.status === 302 || response.ok) {
      return url;
    }
    return null;
  } catch {
    return null;
  }
}

export async function checkHeroBannerLogoExists(mediaId: string): Promise<boolean> {
  try {
    const response = await fetch(getJWPlayerHeroBannerLogo(mediaId), { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

export function extractTrailerId(media: JWPlayerPlaylistItem): string | null {
  // Check custom_params for trailer
  if (media.custom_params?.trailerId) {
    return media.custom_params.trailerId;
  }
  if (media.custom_params?.trailer) {
    return media.custom_params.trailer;
  }
  
  // Check link field for JWPlayer media ID pattern
  if (media.link) {
    // Match JWPlayer media IDs (8 character alphanumeric)
    const mediaIdMatch = media.link.match(/media\/([a-zA-Z0-9]{8})/);
    if (mediaIdMatch) {
      return mediaIdMatch[1];
    }
    // Also check for direct media ID in link
    const directIdMatch = media.link.match(/^[a-zA-Z0-9]{8}$/);
    if (directIdMatch) {
      return media.link;
    }
  }
  
  // Check trailerId field directly
  if (media.trailerId) {
    return media.trailerId;
  }
  
  return null;
}

export function findVerticalPoster(media: JWPlayerPlaylistItem): string | null {
  if (media.images) {
    const verticalImage = media.images.find(img => 
      img.src.toLowerCase().includes('vertical-poster') || 
      img.src.toLowerCase().includes('vertical_poster')
    );
    if (verticalImage) return verticalImage.src;
  }
  
  if (media.variations) {
    const verticalVariation = media.variations['vertical-poster'] || media.variations['vertical_poster'];
    if (verticalVariation?.images?.[0]) {
      return verticalVariation.images[0].src;
    }
  }
  
  return null;
}

export function getJWPlayerPlayerUrl(mediaId: string): string {
  return `https://cdn.jwplayer.com/players/${mediaId}-${JWPLAYER_SITE_ID}.html`;
}

export function getJWPlayerVideoUrl(mediaId: string): string {
  return `https://cdn.jwplayer.com/manifests/${mediaId}.m3u8`;
}

// Pre-warm cache on server startup
export async function prewarmCache(): Promise<void> {
  console.log("Pre-warming JW Player cache...");
  const startTime = Date.now();
  
  try {
    // Fetch all main playlists in parallel
    const playlistPromises = [
      fetchJWPlayerPlaylist(PLAYLISTS.heroBanner),
      fetchJWPlayerPlaylist(PLAYLISTS.featured),
      fetchJWPlayerPlaylist(PLAYLISTS.recommended),
      fetchJWPlayerPlaylist(PLAYLISTS.popular),
      fetchJWPlayerPlaylist(PLAYLISTS.newMovies),
      fetchJWPlayerPlaylist(PLAYLISTS.documentaries),
    ];
    
    // Also fetch sport playlists
    const sportPromises = SPORT_PLAYLISTS.map(sport => 
      fetchJWPlayerPlaylist(sport.id)
    );
    
    const results = await Promise.all([...playlistPromises, ...sportPromises]);
    
    // Extract series IDs from hero banner to prefetch episode data
    const heroBannerItems = results[0] || [];
    const seriesIds = heroBannerItems
      .filter(item => item.contentType === "Series")
      .map(item => item.mediaid);
    
    // Prefetch series episodes for hero items
    if (seriesIds.length > 0) {
      await Promise.all(
        seriesIds.map(seriesId => fetchSeriesEpisodes(seriesId, 1))
      );
    }
    
    const duration = Date.now() - startTime;
    const stats = jwPlayerCache.getCacheStats();
    console.log(`Cache pre-warmed in ${duration}ms - Playlists: ${stats.playlists}, Media: ${stats.media}, Series: ${stats.series}`);
  } catch (error) {
    console.error("Failed to pre-warm cache:", error);
  }
}
