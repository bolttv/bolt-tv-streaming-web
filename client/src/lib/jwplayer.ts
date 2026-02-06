/**
 * JW Player Client-Side Library
 * 
 * All JW Player CDN endpoints are PUBLIC (no auth required).
 * This replaces the Express server proxy — fetches directly from cdn.jwplayer.com.
 * React Query handles caching (replaces server-side MemStorage).
 */

// ─── Constants ───────────────────────────────────────────────────────────────

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

// ─── Types ───────────────────────────────────────────────────────────────────

export type ContentType = "Trailer" | "Episode" | "Series" | "Movie" | "Documentary";

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
  sources: Array<{ file: string; type: string; width?: number; height?: number; label?: string }>;
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

interface JWPlayerPlaylistResponse {
  title: string;
  description?: string;
  kind: string;
  feedid: string;
  playlist: JWPlayerPlaylistItem[];
}

export interface HeroItem {
  id: string;
  title: string;
  type: "series" | "movie";
  heroImage: string;
  motionThumbnail?: string;
  logoImage?: string;
  rating: string;
  seasonCount?: number;
  genres: string[];
  description: string;
  isNew: boolean;
  mediaId?: string;
  trailerId?: string;
  contentType?: ContentType;
}

export interface RowItem {
  id: string;
  title: string;
  posterImage: string;
  verticalPosterImage?: string;
  horizontalPosterLogo?: string;
  heroImage?: string;
  motionThumbnail?: string;
  logoImage?: string;
  rating: string;
  genres?: string[];
  description?: string;
  seasonCount?: number;
  isNew: boolean;
  isNewEpisode?: boolean;
  continueProgress?: number;
  seasonEpisodeLabel?: string;
  mediaId?: string;
  duration?: number;
  trailerId?: string;
  contentType?: ContentType;
}

export interface ContentRow {
  id: string;
  title: string;
  items: RowItem[];
}

export interface SportCategory {
  id: string;
  name: string;
  slug: string;
  playlistId: string;
  thumbnailImage: string;
}

export interface EpisodeItem {
  id: string;
  title: string;
  description: string;
  duration: number;
  image: string;
  episodeNumber?: number;
  seasonNumber?: number;
  mediaId: string;
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

interface SeriesInfo {
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

// ─── Image URL Helpers ───────────────────────────────────────────────────────

export function getJWPlayerThumbnail(mediaId: string, width: number = 640): string {
  return `https://cdn.jwplayer.com/v2/media/${mediaId}/poster.jpg?width=${width}`;
}

export function getJWPlayerVerticalPoster(mediaId: string): string {
  return `https://cdn.jwplayer.com/v2/media/${mediaId}/images/Vertical-Poster.jpg`;
}

export function getJWPlayerHorizontalPosterLogo(mediaId: string): string {
  return `https://cdn.jwplayer.com/v2/media/${mediaId}/images/Horizontal-Poster-Logo.jpg`;
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

// ─── Utility Functions ───────────────────────────────────────────────────────

export function extractMotionThumbnailFromImages(images?: JWPlayerImage[]): string | null {
  if (!images) return null;
  const motionThumbnails = images.filter(img => img.type === "video/mp4");
  if (motionThumbnails.length === 0) return null;
  const largest = motionThumbnails.reduce((a, b) => (a.width > b.width ? a : b));
  return largest.src;
}

export function extractTrailerId(media: JWPlayerPlaylistItem): string | null {
  if (media.custom_params?.trailerId) return media.custom_params.trailerId;
  if (media.custom_params?.trailer) return media.custom_params.trailer;

  if (media.link) {
    const mediaIdMatch = media.link.match(/media\/([a-zA-Z0-9]{8})/);
    if (mediaIdMatch) return mediaIdMatch[1];
    const directIdMatch = media.link.match(/^[a-zA-Z0-9]{8}$/);
    if (directIdMatch) return media.link;
  }

  if (media.trailerId) return media.trailerId;
  return null;
}

export function extractContentType(media: JWPlayerPlaylistItem): ContentType {
  if (media.contentType) {
    const normalized = media.contentType.toLowerCase();
    if (normalized === "trailer") return "Trailer";
    if (normalized === "episode") return "Episode";
    if (normalized === "series") return "Series";
    if (normalized === "movie") return "Movie";
    if (normalized === "documentary") return "Documentary";
  }

  const contentType =
    media.custom_params?.content_type ||
    media.custom_params?.contentType ||
    media.custom_params?.ContentType ||
    media.custom_params?.type;

  if (contentType) {
    const normalized = contentType.toLowerCase();
    if (normalized === "trailer") return "Trailer";
    if (normalized === "episode") return "Episode";
    if (normalized === "series") return "Series";
    if (normalized === "movie") return "Movie";
    if (normalized === "documentary") return "Documentary";
  }

  const tags = media.tags?.toLowerCase() || "";
  const title = media.title?.toLowerCase() || "";

  if (tags.includes("trailer") || title.includes("trailer")) return "Trailer";
  if (tags.includes("documentary") || tags.includes("doc")) return "Documentary";
  if (tags.includes("movie") || tags.includes("film")) return "Movie";
  if (tags.includes("episode") || title.match(/episode\s*\d+/i) || title.match(/ep\s*\d+/i)) return "Episode";

  return "Series";
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function isNotTrailer(m: JWPlayerPlaylistItem): boolean {
  const title = m.title?.toLowerCase() || "";
  const tags = m.tags?.toLowerCase() || "";
  return !title.includes("trailer") && !tags.includes("trailer");
}

function isNotEpisode(m: JWPlayerPlaylistItem): boolean {
  return extractContentType(m) !== "Episode";
}

function isGlobalContent(m: JWPlayerPlaylistItem): boolean {
  return isNotTrailer(m) && isNotEpisode(m);
}

// ─── Conversion Functions ────────────────────────────────────────────────────

export function convertToRowItem(media: JWPlayerPlaylistItem): RowItem {
  const isNew = media.pubdate ? (Date.now() / 1000 - media.pubdate) < 30 * 24 * 60 * 60 : false;
  const trailerId = extractTrailerId(media);
  const rating =
    media.rating ||
    media.custom_params?.rating ||
    media.custom_params?.Rating ||
    media.custom_params?.content_rating ||
    "TV-MA";
  const genreTags = media.genre ? [media.genre] : (media.tags?.split(",").map(t => t.trim()) || []);
  const contentType = extractContentType(media);

  return {
    id: media.mediaid,
    title: media.title,
    posterImage: media.image || getJWPlayerThumbnail(media.mediaid),
    verticalPosterImage: getJWPlayerVerticalPoster(media.mediaid),
    heroImage: getJWPlayerHeroImage(media.mediaid),
    motionThumbnail: extractMotionThumbnailFromImages(media.images) || undefined,
    logoImage: getJWPlayerHeroBannerLogo(media.mediaid),
    rating,
    genres: genreTags.length > 0 ? genreTags.slice(0, 2) : undefined,
    description: media.description || undefined,
    isNew,
    isNewEpisode: false,
    mediaId: media.mediaid,
    duration: media.duration,
    trailerId: trailerId || undefined,
    contentType,
  };
}

export function convertToHeroItem(media: JWPlayerPlaylistItem): HeroItem {
  const tags = media.tags?.split(",").map(t => t.trim()) || [];
  const isNew = media.pubdate ? (Date.now() / 1000 - media.pubdate) < 30 * 24 * 60 * 60 : false;
  const trailerId = extractTrailerId(media);
  const rating =
    media.rating ||
    media.custom_params?.rating ||
    media.custom_params?.Rating ||
    media.custom_params?.content_rating ||
    "TV-MA";
  const genres = media.genre
    ? [media.genre]
    : tags.length > 0 ? tags.slice(0, 2) : ["Entertainment"];
  const contentType = extractContentType(media);

  return {
    id: media.mediaid,
    title: media.title.toUpperCase(),
    type: contentType.toLowerCase() === "movie" ? "movie" : "series",
    heroImage: getJWPlayerHeroImage(media.mediaid),
    motionThumbnail: extractMotionThumbnailFromImages(media.images) || undefined,
    logoImage: getJWPlayerHeroBannerLogo(media.mediaid),
    rating,
    genres,
    description: media.description || "Watch this exclusive content now available on Bolt TV.",
    isNew,
    mediaId: media.mediaid,
    trailerId: trailerId || undefined,
    contentType,
  };
}

// ─── CDN Fetch Functions ─────────────────────────────────────────────────────

export async function fetchPlaylist(playlistId: string): Promise<JWPlayerPlaylistItem[]> {
  try {
    const response = await fetch(`https://cdn.jwplayer.com/v2/playlists/${playlistId}`, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return [];
    const data: JWPlayerPlaylistResponse = await response.json();
    return data.playlist || [];
  } catch (error) {
    console.error("Failed to fetch JW Player playlist:", error);
    return [];
  }
}

export async function fetchMedia(mediaId: string): Promise<JWPlayerPlaylistItem | null> {
  try {
    const response = await fetch(`https://cdn.jwplayer.com/v2/media/${mediaId}`, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return null;
    const data: JWPlayerPlaylistResponse = await response.json();
    return data.playlist?.[0] || null;
  } catch (error) {
    console.error("Failed to fetch JW Player media:", error);
    return null;
  }
}

export async function fetchSeriesInfo(seriesId: string): Promise<SeriesInfo | null> {
  try {
    const response = await fetch(`https://cdn.jwplayer.com/apps/series/${seriesId}`, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error("Failed to fetch series info:", error);
    return null;
  }
}

export async function fetchSeriesEpisodes(seriesId: string, seasonNumber: number = 1): Promise<SeriesEpisode[]> {
  try {
    const response = await fetch(
      `https://cdn.jwplayer.com/apps/series/${seriesId}/seasons/${seasonNumber}/episodes`,
      { headers: { Accept: "application/json" } }
    );
    if (!response.ok) return [];
    const data = await response.json();
    return data.episodes || [];
  } catch (error) {
    console.error("Failed to fetch series episodes:", error);
    return [];
  }
}

// ─── Composed Data Fetchers (called by React Query hooks) ────────────────────

/** Fetch hero banner items from the hero playlist */
export async function fetchHeroItems(): Promise<HeroItem[]> {
  const playlist = await fetchPlaylist(PLAYLISTS.heroBanner);
  return playlist.filter(isNotTrailer).map(convertToHeroItem);
}

/** Fetch all content rows */
export async function fetchContentRows(): Promise<ContentRow[]> {
  const [featured, recommended, popular, newMovies, documentaries] = await Promise.all([
    fetchPlaylist(PLAYLISTS.featured),
    fetchPlaylist(PLAYLISTS.recommended),
    fetchPlaylist(PLAYLISTS.popular),
    fetchPlaylist(PLAYLISTS.newMovies),
    fetchPlaylist(PLAYLISTS.documentaries),
  ]);

  return [
    { id: "r1", title: "Featured", items: featured.filter(isGlobalContent).map(convertToRowItem) },
    { id: "r2", title: "Recommended For You", items: recommended.filter(isGlobalContent).map(convertToRowItem) },
    { id: "r3", title: "Popular", items: popular.filter(isGlobalContent).map(convertToRowItem) },
    { id: "r4", title: "New Movies", items: newMovies.filter(isGlobalContent).map(convertToRowItem) },
    { id: "r5", title: "Documentaries", items: documentaries.filter(isGlobalContent).map(convertToRowItem) },
  ];
}

/** Fetch a single content item by media ID */
export async function fetchContentById(id: string): Promise<HeroItem | RowItem | null> {
  const media = await fetchMedia(id);
  if (!media) return null;

  const contentType = extractContentType(media);
  // Hero items for series/movies, row items otherwise
  if (contentType === "Series" || contentType === "Movie" || contentType === "Documentary") {
    return convertToHeroItem(media);
  }
  return convertToRowItem(media);
}

/** Fetch sport categories (static data, no CDN call) */
export function getSportCategories(): SportCategory[] {
  return SPORT_PLAYLISTS.map(sport => ({
    id: sport.slug,
    name: sport.name,
    slug: sport.slug,
    playlistId: sport.id,
    thumbnailImage: `/assets/sport-${sport.slug}.jpg`,
  }));
}

/** Fetch content for a specific sport playlist */
export async function fetchSportContent(playlistId: string): Promise<RowItem[]> {
  const playlist = await fetchPlaylist(playlistId);
  return playlist.filter(isNotTrailer).map(convertToRowItem);
}

/** Fetch episodes for a series */
export async function fetchEpisodes(seriesId: string): Promise<EpisodeItem[]> {
  // Try Series API first
  try {
    const seriesInfo = await fetchSeriesInfo(seriesId);
    if (seriesInfo?.seasons?.length) {
      const allEpisodes: EpisodeItem[] = [];
      for (const season of seriesInfo.seasons) {
        const episodes = await fetchSeriesEpisodes(seriesId, season.season_number);
        for (const ep of episodes) {
          allEpisodes.push({
            id: ep.media_item.mediaid,
            title: ep.media_item.title,
            description: ep.media_item.description || "",
            duration: ep.media_item.duration,
            image: ep.media_item.image || getJWPlayerThumbnail(ep.media_item.mediaid),
            episodeNumber: ep.episode_number,
            seasonNumber: season.season_number,
            mediaId: ep.media_item.mediaid,
          });
        }
      }
      if (allEpisodes.length > 0) return allEpisodes;
    }
  } catch {
    // Fall through to playlist-based approach
  }

  // Fallback: Check for playlistId custom param
  try {
    const seriesMedia = await fetchMedia(seriesId);
    if (seriesMedia) {
      const episodePlaylistId =
        seriesMedia.custom_params?.playlistId ||
        seriesMedia.custom_params?.PlaylistId ||
        seriesMedia.custom_params?.season1 ||
        seriesMedia.custom_params?.Season1;

      if (episodePlaylistId) {
        const playlistItems = await fetchPlaylist(episodePlaylistId);
        return playlistItems.map((item, index) => ({
          id: item.mediaid,
          title: item.title,
          description: item.description || "",
          duration: item.duration,
          image: item.image || getJWPlayerThumbnail(item.mediaid),
          episodeNumber: index + 1,
          seasonNumber: 1,
          mediaId: item.mediaid,
        }));
      }
    }
  } catch {
    // Fall through
  }

  return [];
}

/** Search content across all main playlists (client-side filter) */
export async function searchContent(query: string, allRows: ContentRow[]): Promise<RowItem[]> {
  if (!query || query.length < 2) return [];

  const normalizedQuery = decodeHtmlEntities(query).toLowerCase();
  const seen = new Set<string>();
  const results: RowItem[] = [];

  for (const row of allRows) {
    for (const item of row.items) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);

      const title = decodeHtmlEntities(item.title).toLowerCase();
      const tags = item.genres?.join(" ").toLowerCase() || "";
      const description = decodeHtmlEntities(item.description || "").toLowerCase();

      if (title.includes(normalizedQuery) || tags.includes(normalizedQuery) || description.includes(normalizedQuery)) {
        results.push(item);
      }
    }
  }

  return results;
}

/** Build a map of mediaId → sport category slug for watch progress tracking */
export function buildCategoryMap(sportContent: Map<string, RowItem[]>): Map<string, string> {
  const map = new Map<string, string>();
  for (const [slug, items] of sportContent) {
    for (const item of items) {
      map.set(item.id, slug);
    }
  }
  return map;
}

