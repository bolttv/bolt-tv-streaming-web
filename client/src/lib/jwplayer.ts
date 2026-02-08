// client/src/lib/jwplayer.ts

// ============================================================
// JW Player CDN Client Library
// Replaces server/jwplayer.ts + server/storage.ts transformations
// All calls go directly to cdn.jwplayer.com (public, no auth)
// ============================================================

export const PLAYLISTS = {
  heroBanner: "KMhhEA3u",
  featured: "WqLLBMnx",
  recommended: "hkXBUtcd",
  popular: "8A1ZTwWl",
  newMovies: "SnbG7v6j",
  documentaries: "RytYkppn",
} as const;

export const SPORT_CATEGORIES = [
  { id: "PFauvVKV", name: "College", slug: "college", playlistId: "PFauvVKV", thumbnailImage: "" },
  { id: "QzHRrJRZ", name: "Soccer", slug: "soccer", playlistId: "QzHRrJRZ", thumbnailImage: "" },
  { id: "BC45vsNB", name: "Baseball", slug: "baseball", playlistId: "BC45vsNB", thumbnailImage: "" },
  { id: "FZgrLpfJ", name: "Football", slug: "football", playlistId: "FZgrLpfJ", thumbnailImage: "" },
  { id: "YY5zhjLQ", name: "Basketball", slug: "basketball", playlistId: "YY5zhjLQ", thumbnailImage: "" },
  { id: "iCwCBaL7", name: "Action Sports", slug: "action-sports", playlistId: "iCwCBaL7", thumbnailImage: "" },
] as const;

// ============================================================
// Types
// ============================================================

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

export interface JWPlayerPlaylistResponse {
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

// ============================================================
// CDN URL Builders
// ============================================================

export function getJWPlayerThumbnail(mediaId: string, width = 640): string {
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

export function getJWPlayerMotionThumbnail(mediaId: string, width = 640): string {
  return `https://cdn.jwplayer.com/v2/media/${mediaId}/poster.mp4?width=${width}`;
}

// ============================================================
// CDN Fetch Functions
// ============================================================

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
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch series info:", error);
    return null;
  }
}

export async function fetchSeriesEpisodes(seriesId: string, seasonNumber = 1): Promise<SeriesEpisode[]> {
  try {
    const response = await fetch(
      `https://cdn.jwplayer.com/apps/series/${seriesId}/seasons/${seasonNumber}/episodes`,
      { headers: { Accept: "application/json" } }
    );
    if (!response.ok) return [];
    const data: SeriesEpisodesResponse = await response.json();
    return data.episodes || [];
  } catch (error) {
    console.error("Failed to fetch series episodes:", error);
    return [];
  }
}

// ============================================================
// Content Type Detection
// ============================================================

export function extractContentType(media: JWPlayerPlaylistItem): ContentType {
  if (media.contentType) {
    const normalized = media.contentType.toLowerCase();
    if (normalized === "trailer") return "Trailer";
    if (normalized === "episode") return "Episode";
    if (normalized === "series") return "Series";
    if (normalized === "movie") return "Movie";
    if (normalized === "documentary") return "Documentary";
  }

  const ct = media.custom_params?.content_type ||
    media.custom_params?.contentType ||
    media.custom_params?.ContentType ||
    media.custom_params?.type;

  if (ct) {
    const normalized = ct.toLowerCase();
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

// ============================================================
// Utility Functions
// ============================================================

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

export function extractMotionThumbnailFromImages(images?: JWPlayerImage[]): string | null {
  if (!images) return null;
  const motionThumbnails = images.filter(img => img.type === "video/mp4");
  if (motionThumbnails.length === 0) return null;
  const largest = motionThumbnails.reduce((a, b) => (a.width > b.width ? a : b));
  return largest.src;
}

// ============================================================
// Transformation Functions
// ============================================================

export function convertToHeroItem(media: JWPlayerPlaylistItem): HeroItem {
  const tags = media.tags?.split(",").map(t => t.trim()) || [];
  const isNew = media.pubdate ? (Date.now() / 1000 - media.pubdate) < 30 * 24 * 60 * 60 : false;
  const trailerId = extractTrailerId(media);
  const contentType = extractContentType(media);

  const rating = media.rating ||
    media.custom_params?.rating ||
    media.custom_params?.Rating ||
    media.custom_params?.content_rating ||
    "TV-MA";

  const genres = media.genre
    ? [media.genre]
    : tags.length > 0 ? tags.slice(0, 2) : ["Entertainment"];

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

export function convertToRowItem(media: JWPlayerPlaylistItem): RowItem {
  const isNew = media.pubdate ? (Date.now() / 1000 - media.pubdate) < 30 * 24 * 60 * 60 : false;
  const trailerId = extractTrailerId(media);
  const contentType = extractContentType(media);

  const rating = media.rating ||
    media.custom_params?.rating ||
    media.custom_params?.Rating ||
    media.custom_params?.content_rating ||
    "TV-MA";

  const genreTags = media.genre ? [media.genre] : (media.tags?.split(",").map(t => t.trim()) || []);

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

export function convertToEpisodeItem(episode: SeriesEpisode, seasonNumber = 1): EpisodeItem {
  return {
    id: episode.media_item.mediaid,
    title: episode.media_item.title,
    description: episode.media_item.description || "",
    duration: episode.media_item.duration,
    image: episode.media_item.image || getJWPlayerThumbnail(episode.media_item.mediaid),
    episodeNumber: episode.episode_number,
    seasonNumber,
    mediaId: episode.media_item.mediaid,
  };
}

// ============================================================
// Search (client-side, across cached content)
// ============================================================

export function searchContent(items: RowItem[], query: string): RowItem[] {
  if (!query || query.trim().length === 0) return [];
  const lowerQuery = query.toLowerCase().trim();

  return items.filter(item => {
    const title = item.title?.toLowerCase() || "";
    const description = item.description?.toLowerCase() || "";
    const genres = item.genres?.join(" ").toLowerCase() || "";
    return title.includes(lowerQuery) || description.includes(lowerQuery) || genres.includes(lowerQuery);
  });
}