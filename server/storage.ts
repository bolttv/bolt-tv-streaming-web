import { type User, type InsertUser, type WatchHistory, type InsertWatchHistory, watchHistory } from "@shared/schema";
import { randomUUID } from "crypto";
import { fetchJWPlayerPlaylist, fetchJWPlayerMedia, fetchSeriesEpisodes, fetchSeriesInfo, getJWPlayerThumbnail, getJWPlayerHeroImage, getJWPlayerVerticalPoster, getJWPlayerHeroBannerLogo, getJWPlayerMotionThumbnail, extractMotionThumbnailFromImages, checkMotionThumbnailExists, extractTrailerId, JWPlayerPlaylistItem, PLAYLISTS, SPORT_PLAYLISTS } from "./jwplayer";
import { db } from "./db";
import { eq, and, desc, sql, inArray } from "drizzle-orm";

export type ContentType = "Trailer" | "Episode" | "Series" | "Movie" | "Documentary";

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

export interface ContinueWatchingItem {
  id: string;
  mediaId: string;
  title: string;
  posterImage: string;
  duration: number;
  watchedSeconds: number;
  progress: number;
  lastWatchedAt: Date;
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

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getHeroItems(): Promise<HeroItem[]>;
  getContentRows(): Promise<ContentRow[]>;
  getContentById(id: string): Promise<HeroItem | RowItem | undefined>;
  getSportCategories(): Promise<SportCategory[]>;
  getSportContent(playlistId: string): Promise<RowItem[]>;
  refreshJWPlayerContent(): Promise<void>;
  getSeriesEpisodes(seriesId: string): Promise<EpisodeItem[]>;
  
  updateWatchProgress(sessionId: string, mediaId: string, title: string, posterImage: string, duration: number, watchedSeconds: number, category?: string): Promise<WatchHistory>;
  getContinueWatching(sessionId: string): Promise<ContinueWatchingItem[]>;
  removeFromContinueWatching(sessionId: string, mediaId: string): Promise<void>;
  searchContent(query: string): Promise<RowItem[]>;
  getPersonalizedRecommendations(sessionId: string): Promise<RowItem[]>;
  getCategoryForMedia(mediaId: string): string | undefined;
  getNextEpisodeToWatch(sessionId: string, seriesId: string): Promise<{ seasonNumber: number; episodeNumber: number; mediaId: string } | null>;
  getFirstEpisode(seriesId: string): Promise<{ seasonNumber: number; episodeNumber: number; mediaId: string } | null>;
}

function extractContentType(media: JWPlayerPlaylistItem): ContentType {
  // First check the direct contentType field from JW Player API
  if (media.contentType) {
    const normalized = media.contentType.toLowerCase();
    if (normalized === "trailer") return "Trailer";
    if (normalized === "episode") return "Episode";
    if (normalized === "series") return "Series";
    if (normalized === "movie") return "Movie";
    if (normalized === "documentary") return "Documentary";
  }
  
  // Then check custom_params for explicit content_type
  const contentType = media.custom_params?.content_type || 
                      media.custom_params?.contentType ||
                      media.custom_params?.ContentType ||
                      media.custom_params?.type;
  
  if (contentType) {
    // Normalize the content type to match our expected values
    const normalized = contentType.toLowerCase();
    if (normalized === "trailer") return "Trailer";
    if (normalized === "episode") return "Episode";
    if (normalized === "series") return "Series";
    if (normalized === "movie") return "Movie";
    if (normalized === "documentary") return "Documentary";
  }
  
  // Fallback: derive content type from tags or title
  const tags = media.tags?.toLowerCase() || "";
  const title = media.title?.toLowerCase() || "";
  
  // Check for trailer
  if (tags.includes("trailer") || title.includes("trailer")) {
    return "Trailer";
  }
  
  // Check for documentary
  if (tags.includes("documentary") || tags.includes("doc")) {
    return "Documentary";
  }
  
  // Check for movie
  if (tags.includes("movie") || tags.includes("film")) {
    return "Movie";
  }
  
  // Check for episode
  if (tags.includes("episode") || title.match(/episode\s*\d+/i) || title.match(/ep\s*\d+/i)) {
    return "Episode";
  }
  
  // Default to Series for content that doesn't match other types
  return "Series";
}

function convertJWPlayerToRowItem(media: JWPlayerPlaylistItem): RowItem {
  const isNew = media.pubdate ? (Date.now() / 1000 - media.pubdate) < 30 * 24 * 60 * 60 : false;
  const trailerId = extractTrailerId(media);
  
  // Get rating from direct API field first, then custom_params as fallback
  const rating = media.rating || 
                 media.custom_params?.rating || 
                 media.custom_params?.Rating || 
                 media.custom_params?.content_rating ||
                 "TV-MA";
  
  // Get genre from direct API field first, then tags as fallback
  const genreTags = media.genre ? [media.genre] : (media.tags?.split(",").map(t => t.trim()) || []);
  
  // Get content type
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

function convertJWPlayerToHeroItem(media: JWPlayerPlaylistItem): HeroItem {
  const tags = media.tags?.split(",").map(t => t.trim()) || [];
  const isNew = media.pubdate ? (Date.now() / 1000 - media.pubdate) < 30 * 24 * 60 * 60 : false;
  const trailerId = extractTrailerId(media);
  
  // Get rating from direct API field first, then custom_params as fallback
  const rating = media.rating || 
                 media.custom_params?.rating || 
                 media.custom_params?.Rating || 
                 media.custom_params?.content_rating ||
                 "TV-MA";
  
  // Get genre from direct API field first, then tags as fallback
  const genres = media.genre 
    ? [media.genre] 
    : (tags.length > 0 ? tags.slice(0, 2) : ["Entertainment"]);
  
  // Get content type
  const contentType = extractContentType(media);
  
  // Get hero banner logo URL (frontend will check if it exists)
  const logoImage = getJWPlayerHeroBannerLogo(media.mediaid);
  
  return {
    id: media.mediaid,
    title: media.title.toUpperCase(),
    type: contentType.toLowerCase() === "movie" ? "movie" : "series",
    heroImage: getJWPlayerHeroImage(media.mediaid),
    motionThumbnail: extractMotionThumbnailFromImages(media.images) || undefined,
    logoImage,
    rating,
    genres,
    description: media.description || "Watch this exclusive content now available on Bolt TV.",
    isNew,
    mediaId: media.mediaid,
    trailerId: trailerId || undefined,
    contentType,
  };
}

// Cache for motion thumbnail existence checks (persists across requests)
const motionThumbnailCache = new Map<string, string | null>();

async function enrichWithMotionThumbnail<T extends { motionThumbnail?: string; mediaId?: string; id?: string }>(item: T): Promise<T> {
  if (item.motionThumbnail) return item;
  const mediaId = item.mediaId || item.id;
  if (!mediaId) return item;
  
  // Check cache first
  if (motionThumbnailCache.has(mediaId)) {
    const cachedResult = motionThumbnailCache.get(mediaId);
    if (cachedResult) {
      return { ...item, motionThumbnail: cachedResult };
    }
    return item;
  }
  
  // Fetch and cache result
  const motionThumbnail = await checkMotionThumbnailExists(mediaId);
  motionThumbnailCache.set(mediaId, motionThumbnail);
  
  if (motionThumbnail) {
    return { ...item, motionThumbnail };
  }
  return item;
}

async function enrichItemsWithMotionThumbnails<T extends { motionThumbnail?: string; mediaId?: string; id?: string }>(items: T[]): Promise<T[]> {
  return Promise.all(items.map(enrichWithMotionThumbnail));
}

interface SearchableContent {
  item: RowItem;
  title: string;
  tags: string;
  description: string;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function extractEpisodeNumber(title: string): number {
  // Try to extract episode number from title patterns like "Episode 1", "Ep 5", "E03", etc.
  const patterns = [
    /episode\s*(\d+)/i,
    /ep\.?\s*(\d+)/i,
    /e(\d+)/i,
    /\s(\d+):\s/,  // "1: Title"
  ];
  
  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match) {
      return parseInt(match[1]);
    }
  }
  
  return 0;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private heroItems: HeroItem[];
  private contentRows: ContentRow[];
  private allContent: Map<string, HeroItem | RowItem>;
  private searchableContent: Map<string, SearchableContent>;
  private mediaCategoryMap: Map<string, string>; // mediaId -> category slug
  private categoryMapBuilt: boolean = false;
  private categoryMapPromise: Promise<void> | null = null;
  private lastFetch: number = 0;
  private isInitialized: boolean = false;

  constructor() {
    this.users = new Map();
    this.allContent = new Map();
    this.searchableContent = new Map();
    this.mediaCategoryMap = new Map();
    this.heroItems = [];
    this.contentRows = [];
  }

  async refreshJWPlayerContent(): Promise<void> {
    const now = Date.now();
    if (now - this.lastFetch < 60000 && this.isInitialized) {
      return;
    }

    console.log("Fetching content from JW Player playlists...");
    
    const [heroBanner, featured, recommended, popular, newMovies, documentaries] = await Promise.all([
      fetchJWPlayerPlaylist(PLAYLISTS.heroBanner),
      fetchJWPlayerPlaylist(PLAYLISTS.featured),
      fetchJWPlayerPlaylist(PLAYLISTS.recommended),
      fetchJWPlayerPlaylist(PLAYLISTS.popular),
      fetchJWPlayerPlaylist(PLAYLISTS.newMovies),
      fetchJWPlayerPlaylist(PLAYLISTS.documentaries),
    ]);

    const totalItems = heroBanner.length + featured.length + recommended.length + popular.length + newMovies.length + documentaries.length;
    
    // Filter out trailers from content (trailers should only be accessible via trailer icon)
    const isNotTrailer = (m: JWPlayerPlaylistItem) => {
      const title = m.title?.toLowerCase() || "";
      const tags = m.tags?.toLowerCase() || "";
      return !title.includes("trailer") && !tags.includes("trailer");
    };
    
    // Filter out episodes from global content (episodes should only appear in series detail pages)
    const isNotEpisode = (m: JWPlayerPlaylistItem) => {
      const contentType = extractContentType(m);
      return contentType !== "Episode";
    };
    
    // Combined filter for content rows
    const isGlobalContent = (m: JWPlayerPlaylistItem) => isNotTrailer(m) && isNotEpisode(m);
    
    if (totalItems > 0) {
      console.log(`Found ${totalItems} total items from JW Player playlists`);
      this.lastFetch = now;
      this.isInitialized = true;
      
      const heroBannerFiltered = heroBanner.filter(isNotTrailer);
      const featuredFiltered = featured.filter(isGlobalContent);
      const heroItemsRaw = heroBannerFiltered.map(m => convertJWPlayerToHeroItem(m));
      this.heroItems = await enrichItemsWithMotionThumbnails(heroItemsRaw);
      
      const contentRowsRaw = [
        {
          id: "r1",
          title: "Featured",
          items: featuredFiltered.map(m => convertJWPlayerToRowItem(m))
        },
        {
          id: "r2",
          title: "Recommended For You",
          items: recommended.filter(isGlobalContent).map(m => convertJWPlayerToRowItem(m))
        },
        {
          id: "r3",
          title: "Popular",
          items: popular.filter(isGlobalContent).map(m => convertJWPlayerToRowItem(m))
        },
        {
          id: "r4",
          title: "New Movies",
          items: newMovies.filter(isGlobalContent).map(m => convertJWPlayerToRowItem(m))
        },
        {
          id: "r5",
          title: "Documentaries",
          items: documentaries.filter(isGlobalContent).map(m => convertJWPlayerToRowItem(m))
        }
      ];
      
      this.contentRows = await Promise.all(contentRowsRaw.map(async row => ({
        ...row,
        items: await enrichItemsWithMotionThumbnails(row.items)
      })));
      
      this.allContent.clear();
      this.searchableContent.clear();
      
      this.heroItems.forEach(item => this.allContent.set(item.id, item));
      this.contentRows.forEach(row => {
        row.items.forEach(item => this.allContent.set(item.id, item));
      });
      
      // Add ALL media to allContent (including trailers) so they can still be fetched for playback
      const allMedia = [...featured, ...recommended, ...popular, ...newMovies, ...documentaries];
      const trailerIdsToFetch: string[] = [];
      
      for (const media of allMedia) {
        // Add to allContent so trailers can still be played via direct access
        if (!this.allContent.has(media.mediaid)) {
          this.allContent.set(media.mediaid, convertJWPlayerToRowItem(media));
        }
        
        // Collect trailer IDs to fetch separately
        const trailerId = extractTrailerId(media);
        if (trailerId && !this.allContent.has(trailerId)) {
          trailerIdsToFetch.push(trailerId);
        }
        
        // Add non-trailers to searchable content
        const title = media.title?.toLowerCase() || "";
        const tags = media.tags?.toLowerCase() || "";
        const isTrailer = title.includes("trailer") || tags.includes("trailer");
        
        if (!isTrailer && !this.searchableContent.has(media.mediaid)) {
          this.searchableContent.set(media.mediaid, {
            item: convertJWPlayerToRowItem(media),
            title: decodeHtmlEntities(media.title).toLowerCase(),
            tags: decodeHtmlEntities(tags).toLowerCase(),
            description: decodeHtmlEntities(media.description || "").toLowerCase(),
          });
        }
      }
      
      // Fetch trailer content separately (they're not in playlists, only referenced by trailerId)
      if (trailerIdsToFetch.length > 0) {
        const uniqueTrailerIds = [...new Set(trailerIdsToFetch)];
        const trailerPromises = uniqueTrailerIds.map(id => fetchJWPlayerMedia(id));
        const trailers = await Promise.all(trailerPromises);
        
        for (const trailer of trailers) {
          if (trailer && !this.allContent.has(trailer.mediaid)) {
            this.allContent.set(trailer.mediaid, convertJWPlayerToRowItem(trailer));
          }
        }
      }
      
      // Build category map from sport playlists (tracked for awaiting in watch progress)
      if (!this.categoryMapBuilt && !this.categoryMapPromise) {
        this.categoryMapPromise = this.buildCategoryMap();
      }
    } else {
      console.log("No JW Player content found, using fallback data");
      if (!this.isInitialized) {
        this.initializeFallbackContent();
        this.isInitialized = true;
      }
    }
  }

  private initializeFallbackContent() {
    this.heroItems = [
      {
        id: "h1",
        title: "GRIT & GLORY",
        type: "series",
        heroImage: "/assets/hero-grit-glory.png",
        rating: "TV-MA",
        seasonCount: 1,
        genres: ["Sports", "Drama"],
        description: "On the field, every second counts. Behind the scenes, the pressure never stops. Witness the untold stories of determination and sacrifice.",
        isNew: true
      },
      {
        id: "h2",
        title: "THE BOARDROOM",
        type: "series",
        heroImage: "/assets/hero-drama.png",
        rating: "TV-MA",
        seasonCount: 4,
        genres: ["Drama", "Business"],
        description: "Power, betrayal, and billions of dollars. The Roy family saga continues as alliances shift and new enemies emerge.",
        isNew: true
      },
      {
        id: "h3",
        title: "DUNE: PROPHET",
        type: "movie",
        heroImage: "/assets/hero-scifi.png",
        rating: "PG-13",
        genres: ["Sci-Fi", "Adventure"],
        description: "A mythic and emotionally charged hero's journey, Dune tells the story of Paul Atreides, a brilliant and gifted young man born into a great destiny beyond his understanding.",
        isNew: false
      }
    ];

    const featuredItems: RowItem[] = [
      { id: "f1", title: "Grit & Glory: Bo Nix", posterImage: "/assets/poster-grit-bo.png", rating: "TV-MA", seasonCount: 1, isNew: true, isNewEpisode: true },
      { id: "f2", title: "Rookie", posterImage: "/assets/poster-rookie.png", rating: "TV-14", seasonCount: 1, isNew: true },
      { id: "f3", title: "Traviesa", posterImage: "/assets/poster-traviesa.png", rating: "TV-MA", isNew: true },
      { id: "f4", title: "Surfing The Midnight Sun", posterImage: "/assets/poster-surfing.png", rating: "TV-PG", isNew: false },
      { id: "f5", title: "Full Throttle", posterImage: "/assets/poster-full-throttle.png", rating: "TV-14", seasonCount: 2, isNew: false },
      { id: "f6", title: "DTM: Beyond The Grid", posterImage: "/assets/poster-dtm.png", rating: "TV-MA", isNew: true },
      { id: "f7", title: "Grit & Glory: Arch Manning", posterImage: "/assets/poster-grit-arch.png", rating: "TV-MA", seasonCount: 1, isNew: true },
      { id: "f8", title: "Life On Ice", posterImage: "/assets/poster-life-on-ice.png", rating: "TV-14", seasonCount: 3, isNew: false }
    ];

    this.contentRows = [
      { id: "r1", title: "Featured", items: featuredItems },
      { id: "r2", title: "Recommended For You", items: featuredItems.slice(0, 5) },
      { id: "r3", title: "Popular", items: featuredItems },
      { id: "r4", title: "New Movies", items: featuredItems.filter(i => i.isNew) },
      { id: "r5", title: "Documentaries", items: featuredItems.slice(2, 6) }
    ];

    this.allContent.clear();
    this.heroItems.forEach(item => this.allContent.set(item.id, item));
    this.contentRows.forEach(row => {
      row.items.forEach(item => this.allContent.set(item.id, item));
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getHeroItems(): Promise<HeroItem[]> {
    await this.refreshJWPlayerContent();
    return this.heroItems;
  }

  async getContentRows(): Promise<ContentRow[]> {
    await this.refreshJWPlayerContent();
    return this.contentRows;
  }

  async getContentById(id: string): Promise<HeroItem | RowItem | undefined> {
    await this.refreshJWPlayerContent();
    return this.allContent.get(id);
  }

  async getSportCategories(): Promise<SportCategory[]> {
    return SPORT_PLAYLISTS.map(sport => ({
      id: sport.slug,
      name: sport.name,
      slug: sport.slug,
      playlistId: sport.id,
      thumbnailImage: `/assets/sport-${sport.slug}.jpg`,
    }));
  }

  async getSportContent(playlistId: string): Promise<RowItem[]> {
    const media = await fetchJWPlayerPlaylist(playlistId);
    
    // Filter out trailers
    const isNotTrailer = (m: JWPlayerPlaylistItem) => {
      const title = m.title?.toLowerCase() || "";
      const tags = m.tags?.toLowerCase() || "";
      return !title.includes("trailer") && !tags.includes("trailer");
    };
    const filtered = media.filter(isNotTrailer);
    
    // Build category map for these items
    const sport = SPORT_PLAYLISTS.find(s => s.id === playlistId);
    if (sport) {
      for (const m of filtered) {
        this.mediaCategoryMap.set(m.mediaid, sport.slug);
      }
    }
    
    // Apply motion thumbnail enrichment to all banner content
    const items = filtered.map(m => convertJWPlayerToRowItem(m));
    return enrichItemsWithMotionThumbnails(items);
  }

  async getSeriesEpisodes(seriesId: string): Promise<EpisodeItem[]> {
    await this.refreshJWPlayerContent();
    
    // Get the content to check if it's a series
    const content = this.allContent.get(seriesId);
    if (!content) {
      return [];
    }
    
    // First, try to fetch episodes directly from JW Player's Series API
    // This uses the series structure in JW Player and returns episodes in the order set in the dashboard
    try {
      // Get series info to find available seasons
      const seriesInfo = await fetchSeriesInfo(seriesId);
      
      if (seriesInfo && seriesInfo.seasons && seriesInfo.seasons.length > 0) {
        const allEpisodes: EpisodeItem[] = [];
        
        // Fetch episodes from all seasons in order
        for (const season of seriesInfo.seasons) {
          const seriesEpisodes = await fetchSeriesEpisodes(seriesId, season.season_number);
          
          for (const ep of seriesEpisodes) {
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
        
        if (allEpisodes.length > 0) {
          console.log(`Found ${allEpisodes.length} episodes for series ${seriesId} via Series API`);
          return allEpisodes;
        }
      }
    } catch (err) {
      console.log("Could not fetch series episodes from Series API:", err);
    }
    
    // Fallback: Try playlist-based approach if series API didn't return episodes
    try {
      const seriesMedia = await fetchJWPlayerMedia(seriesId);
      if (seriesMedia) {
        // Check for playlistId custom parameter
        const episodePlaylistId = seriesMedia.custom_params?.playlistId ||
                                  seriesMedia.custom_params?.PlaylistId ||
                                  seriesMedia.custom_params?.season1 ||
                                  seriesMedia.custom_params?.Season1;
        
        if (episodePlaylistId) {
          const playlistItems = await fetchJWPlayerPlaylist(episodePlaylistId);
          
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
    } catch (err) {
      console.log("Could not fetch series media for episode playlist:", err);
    }
    
    // Fallback: Search for episodes by series_id custom parameter across playlists
    const episodes: EpisodeItem[] = [];
    const allPlaylists = [
      PLAYLISTS.heroBanner,
      PLAYLISTS.featured,
      PLAYLISTS.recommended,
      PLAYLISTS.popular,
      PLAYLISTS.newMovies,
      PLAYLISTS.documentaries,
      ...SPORT_PLAYLISTS.map(s => s.id),
    ];
    
    for (const playlistId of allPlaylists) {
      try {
        const items = await fetchJWPlayerPlaylist(playlistId);
        
        for (const item of items) {
          if (item.mediaid === seriesId) continue;
          
          const itemSeriesId = item.custom_params?.series_id || 
                               item.custom_params?.seriesId ||
                               item.custom_params?.SeriesId;
          
          if (itemSeriesId === seriesId) {
            if (!episodes.find(e => e.id === item.mediaid)) {
              episodes.push({
                id: item.mediaid,
                title: item.title,
                description: item.description || "",
                duration: item.duration,
                image: item.image || getJWPlayerThumbnail(item.mediaid),
                episodeNumber: episodes.length + 1,
                seasonNumber: 1,
                mediaId: item.mediaid,
              });
            }
          }
        }
      } catch (err) {
        // Continue with other playlists
      }
    }
    
    if (episodes.length > 0) {
      return episodes.slice(0, 12);
    }
    
    // Final fallback: If this is a sport category, return other items from same category
    const category = this.mediaCategoryMap.get(seriesId);
    if (category) {
      const sport = SPORT_PLAYLISTS.find(s => s.slug === category);
      if (sport) {
        const playlistItems = await fetchJWPlayerPlaylist(sport.id);
        const filteredItems = playlistItems.filter(item => {
          if (item.mediaid === seriesId) return false;
          const title = item.title?.toLowerCase() || "";
          const tags = item.tags?.toLowerCase() || "";
          return !title.includes("trailer") && !tags.includes("trailer");
        });
        
        return filteredItems.slice(0, 8).map((item, index) => ({
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
    
    // No episodes found
    return [];
  }

  async buildCategoryMap(): Promise<void> {
    // Build category map from all sport playlists (called once at startup or refresh)
    console.log("Building category map from sport playlists...");
    for (const sport of SPORT_PLAYLISTS) {
      try {
        const content = await fetchJWPlayerPlaylist(sport.id);
        for (const m of content) {
          this.mediaCategoryMap.set(m.mediaid, sport.slug);
        }
      } catch {
        // Continue with other playlists
      }
    }
    this.categoryMapBuilt = true;
    console.log(`Category map built with ${this.mediaCategoryMap.size} entries`);
  }

  private async ensureCategoryMapReady(): Promise<void> {
    if (this.categoryMapBuilt) return;
    
    // Start building if not already in progress
    if (!this.categoryMapPromise) {
      this.categoryMapPromise = this.buildCategoryMap();
    }
    
    // Wait for build to complete (with timeout to avoid blocking indefinitely)
    try {
      await Promise.race([
        this.categoryMapPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error("Category map timeout")), 10000))
      ]);
    } catch (err) {
      console.warn("Category map build timeout or error, proceeding without category");
    }
  }

  getCategoryForMedia(mediaId: string): string | undefined {
    return this.mediaCategoryMap.get(mediaId);
  }

  async updateWatchProgress(
    sessionId: string,
    mediaId: string,
    title: string,
    posterImage: string,
    duration: number,
    watchedSeconds: number,
    category?: string
  ): Promise<WatchHistory> {
    const progress = duration > 0 ? Math.min(watchedSeconds / duration, 1) : 0;
    
    // Ensure category map is ready before lookup (await initial build if needed)
    await this.ensureCategoryMapReady();
    
    // Use provided category or look up from cached map (fast lookup)
    const resolvedCategory = category || this.mediaCategoryMap.get(mediaId);
    
    const existing = await db
      .select()
      .from(watchHistory)
      .where(and(eq(watchHistory.sessionId, sessionId), eq(watchHistory.mediaId, mediaId)))
      .limit(1);

    if (existing.length > 0) {
      const [updated] = await db
        .update(watchHistory)
        .set({
          watchedSeconds,
          progress,
          lastWatchedAt: new Date(),
          title,
          posterImage,
          duration,
          ...(resolvedCategory && { category: resolvedCategory }),
        })
        .where(eq(watchHistory.id, existing[0].id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(watchHistory)
        .values({
          sessionId,
          mediaId,
          title,
          posterImage,
          duration,
          watchedSeconds,
          progress,
          category: resolvedCategory,
        })
        .returning();
      return created;
    }
  }

  async getContinueWatching(sessionId: string): Promise<ContinueWatchingItem[]> {
    const items = await db
      .select()
      .from(watchHistory)
      .where(and(
        eq(watchHistory.sessionId, sessionId),
        sql`${watchHistory.progress} > 0.01`,
        sql`${watchHistory.progress} < 0.95`
      ))
      .orderBy(desc(watchHistory.lastWatchedAt))
      .limit(20);

    // Filter out trailers from continue watching
    const filtered = items.filter(item => {
      const title = item.title?.toLowerCase() || "";
      return !title.includes("trailer");
    });

    return filtered.map(item => ({
      id: item.id,
      mediaId: item.mediaId,
      title: item.title,
      posterImage: item.posterImage || "",
      duration: item.duration,
      watchedSeconds: item.watchedSeconds,
      progress: item.progress,
      lastWatchedAt: item.lastWatchedAt,
    }));
  }

  async removeFromContinueWatching(sessionId: string, mediaId: string): Promise<void> {
    await db
      .delete(watchHistory)
      .where(and(eq(watchHistory.sessionId, sessionId), eq(watchHistory.mediaId, mediaId)));
  }

  async searchContent(query: string): Promise<RowItem[]> {
    await this.refreshJWPlayerContent();
    
    const lowerQuery = query.toLowerCase();
    const results: RowItem[] = [];
    const seenIds = new Set<string>();

    for (const [id, content] of this.searchableContent.entries()) {
      if (seenIds.has(id)) continue;
      
      const matchesTitle = content.title.includes(lowerQuery);
      const matchesTags = content.tags.includes(lowerQuery);
      const matchesDescription = content.description.includes(lowerQuery);
      
      if (matchesTitle || matchesTags || matchesDescription) {
        seenIds.add(id);
        results.push(content.item);
      }
    }

    for (const sport of SPORT_PLAYLISTS) {
      const sportContent = await fetchJWPlayerPlaylist(sport.id);
      for (const media of sportContent) {
        if (seenIds.has(media.mediaid)) continue;
        
        const title = decodeHtmlEntities(media.title).toLowerCase();
        const tags = decodeHtmlEntities(media.tags || "").toLowerCase();
        const description = decodeHtmlEntities(media.description || "").toLowerCase();
        
        const matchesTitle = title.includes(lowerQuery);
        const matchesTags = tags.includes(lowerQuery);
        const matchesDescription = description.includes(lowerQuery);
        const matchesSport = sport.name.toLowerCase().includes(lowerQuery);
        
        if (matchesTitle || matchesTags || matchesDescription || matchesSport) {
          seenIds.add(media.mediaid);
          results.push(convertJWPlayerToRowItem(media));
        }
      }
    }

    return results;
  }

  async getPersonalizedRecommendations(sessionId: string): Promise<RowItem[]> {
    // Use JW Player's built-in recommendation engine
    const JW_RECOMMENDATIONS_PLAYLIST = "hkXBUtcd";
    
    try {
      const recommendations = await fetchJWPlayerPlaylist(JW_RECOMMENDATIONS_PLAYLIST);
      return recommendations.map(m => convertJWPlayerToRowItem(m));
    } catch (error) {
      console.error("Error fetching JW Player recommendations:", error);
      return [];
    }
  }

  async getNextEpisodeToWatch(sessionId: string, seriesId: string): Promise<{ seasonNumber: number; episodeNumber: number; mediaId: string } | null> {
    // Get all episodes for this series
    const episodes = await this.getSeriesEpisodes(seriesId);
    if (episodes.length === 0) {
      return null;
    }

    // Sort episodes by season and episode number
    const sortedEpisodes = [...episodes].sort((a, b) => {
      const seasonDiff = (a.seasonNumber || 1) - (b.seasonNumber || 1);
      if (seasonDiff !== 0) return seasonDiff;
      return (a.episodeNumber || 1) - (b.episodeNumber || 1);
    });

    // Get user's watch history for this series' episodes
    const episodeMediaIds = sortedEpisodes.map(ep => ep.mediaId);
    const watchedItems = episodeMediaIds.length > 0 
      ? await db
          .select()
          .from(watchHistory)
          .where(and(
            eq(watchHistory.sessionId, sessionId),
            inArray(watchHistory.mediaId, episodeMediaIds)
          ))
      : [];

    // Create a map of mediaId to watch progress
    const watchProgressMap = new Map<string, number>();
    for (const item of watchedItems) {
      watchProgressMap.set(item.mediaId, item.progress);
    }

    // Find the next episode to watch
    // 1. If user is currently watching an episode (progress > 0.01 and < 0.95), return that episode
    // 2. If user finished an episode (progress >= 0.95), return the next episode
    // 3. If user hasn't watched any, return the first episode

    let lastCompletedEpisodeIndex = -1;
    let currentlyWatchingEpisode: { seasonNumber: number; episodeNumber: number; mediaId: string } | null = null;

    for (let i = 0; i < sortedEpisodes.length; i++) {
      const episode = sortedEpisodes[i];
      const progress = watchProgressMap.get(episode.mediaId) || 0;

      if (progress > 0.01 && progress < 0.95) {
        // User is currently watching this episode
        currentlyWatchingEpisode = {
          seasonNumber: episode.seasonNumber || 1,
          episodeNumber: episode.episodeNumber || (i + 1),
          mediaId: episode.mediaId
        };
      }

      if (progress >= 0.95) {
        // User completed this episode
        lastCompletedEpisodeIndex = i;
      }
    }

    // If currently watching an episode, return that
    if (currentlyWatchingEpisode) {
      return currentlyWatchingEpisode;
    }

    // If completed some episodes, return the next one
    if (lastCompletedEpisodeIndex >= 0 && lastCompletedEpisodeIndex < sortedEpisodes.length - 1) {
      const nextEpisode = sortedEpisodes[lastCompletedEpisodeIndex + 1];
      return {
        seasonNumber: nextEpisode.seasonNumber || 1,
        episodeNumber: nextEpisode.episodeNumber || (lastCompletedEpisodeIndex + 2),
        mediaId: nextEpisode.mediaId
      };
    }

    // If completed the last episode, return the last episode (user can rewatch)
    if (lastCompletedEpisodeIndex === sortedEpisodes.length - 1) {
      const lastEpisode = sortedEpisodes[lastCompletedEpisodeIndex];
      return {
        seasonNumber: lastEpisode.seasonNumber || 1,
        episodeNumber: lastEpisode.episodeNumber || sortedEpisodes.length,
        mediaId: lastEpisode.mediaId
      };
    }

    // Default: return first episode
    const firstEpisode = sortedEpisodes[0];
    return {
      seasonNumber: firstEpisode.seasonNumber || 1,
      episodeNumber: firstEpisode.episodeNumber || 1,
      mediaId: firstEpisode.mediaId
    };
  }

  async getFirstEpisode(seriesId: string): Promise<{ seasonNumber: number; episodeNumber: number; mediaId: string } | null> {
    const episodes = await this.getSeriesEpisodes(seriesId);
    if (episodes.length === 0) return null;
    
    const sortedEpisodes = episodes.sort((a, b) => {
      const seasonDiff = (a.seasonNumber || 1) - (b.seasonNumber || 1);
      if (seasonDiff !== 0) return seasonDiff;
      return (a.episodeNumber || 1) - (b.episodeNumber || 1);
    });
    
    const firstEpisode = sortedEpisodes[0];
    return {
      seasonNumber: firstEpisode.seasonNumber || 1,
      episodeNumber: firstEpisode.episodeNumber || 1,
      mediaId: firstEpisode.mediaId
    };
  }
}

export const storage = new MemStorage();
