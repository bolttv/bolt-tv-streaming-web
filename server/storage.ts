import { type User, type InsertUser, type WatchHistory, type InsertWatchHistory, watchHistory } from "@shared/schema";
import { randomUUID } from "crypto";
import { fetchJWPlayerPlaylist, getJWPlayerThumbnail, getJWPlayerHeroImage, getJWPlayerVerticalPoster, extractTrailerId, JWPlayerPlaylistItem, PLAYLISTS, SPORT_PLAYLISTS } from "./jwplayer";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

export interface HeroItem {
  id: string;
  title: string;
  type: "series" | "movie";
  heroImage: string;
  logoImage?: string;
  rating: string;
  seasonCount?: number;
  genres: string[];
  description: string;
  isNew: boolean;
  mediaId?: string;
  trailerId?: string;
}

export interface RowItem {
  id: string;
  title: string;
  posterImage: string;
  verticalPosterImage?: string;
  rating: string;
  seasonCount?: number;
  isNew: boolean;
  isNewEpisode?: boolean;
  continueProgress?: number;
  seasonEpisodeLabel?: string;
  mediaId?: string;
  duration?: number;
  trailerId?: string;
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
  
  updateWatchProgress(sessionId: string, mediaId: string, title: string, posterImage: string, duration: number, watchedSeconds: number, category?: string): Promise<WatchHistory>;
  getContinueWatching(sessionId: string): Promise<ContinueWatchingItem[]>;
  removeFromContinueWatching(sessionId: string, mediaId: string): Promise<void>;
  searchContent(query: string): Promise<RowItem[]>;
  getPersonalizedRecommendations(sessionId: string): Promise<RowItem[]>;
  getCategoryForMedia(mediaId: string): string | undefined;
}

function convertJWPlayerToRowItem(media: JWPlayerPlaylistItem): RowItem {
  const tags = media.tags?.split(",").map(t => t.trim()) || [];
  const isNew = media.pubdate ? (Date.now() / 1000 - media.pubdate) < 30 * 24 * 60 * 60 : false;
  const trailerId = extractTrailerId(media);
  
  return {
    id: media.mediaid,
    title: media.title,
    posterImage: media.image || getJWPlayerThumbnail(media.mediaid),
    verticalPosterImage: getJWPlayerVerticalPoster(media.mediaid),
    rating: "TV-MA",
    isNew,
    isNewEpisode: false,
    mediaId: media.mediaid,
    duration: media.duration,
    trailerId: trailerId || undefined,
  };
}

function convertJWPlayerToHeroItem(media: JWPlayerPlaylistItem): HeroItem {
  const tags = media.tags?.split(",").map(t => t.trim()) || [];
  const isNew = media.pubdate ? (Date.now() / 1000 - media.pubdate) < 30 * 24 * 60 * 60 : false;
  const trailerId = extractTrailerId(media);
  
  return {
    id: media.mediaid,
    title: media.title.toUpperCase(),
    type: tags.includes("movie") ? "movie" : "series",
    heroImage: getJWPlayerHeroImage(media.mediaid),
    rating: "TV-MA",
    genres: tags.length > 0 ? tags.slice(0, 2) : ["Entertainment"],
    description: media.description || "Watch this exclusive content now available on Bolt TV.",
    isNew,
    mediaId: media.mediaid,
    trailerId: trailerId || undefined,
  };
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
    
    const [featured, recommended, popular, newMovies, documentaries] = await Promise.all([
      fetchJWPlayerPlaylist(PLAYLISTS.featured),
      fetchJWPlayerPlaylist(PLAYLISTS.recommended),
      fetchJWPlayerPlaylist(PLAYLISTS.popular),
      fetchJWPlayerPlaylist(PLAYLISTS.newMovies),
      fetchJWPlayerPlaylist(PLAYLISTS.documentaries),
    ]);

    const totalItems = featured.length + recommended.length + popular.length + newMovies.length + documentaries.length;
    
    if (totalItems > 0) {
      console.log(`Found ${totalItems} total items from JW Player playlists`);
      this.lastFetch = now;
      this.isInitialized = true;
      
      this.heroItems = featured.slice(0, 3).map(m => convertJWPlayerToHeroItem(m));
      
      this.contentRows = [
        {
          id: "r1",
          title: "Featured",
          items: featured.map(m => convertJWPlayerToRowItem(m))
        },
        {
          id: "r2",
          title: "Recommended For You",
          items: recommended.map(m => convertJWPlayerToRowItem(m))
        },
        {
          id: "r3",
          title: "Popular",
          items: popular.map(m => convertJWPlayerToRowItem(m))
        },
        {
          id: "r4",
          title: "New Movies",
          items: newMovies.map(m => convertJWPlayerToRowItem(m))
        },
        {
          id: "r5",
          title: "Documentaries",
          items: documentaries.map(m => convertJWPlayerToRowItem(m))
        }
      ];
      
      this.allContent.clear();
      this.searchableContent.clear();
      
      this.heroItems.forEach(item => this.allContent.set(item.id, item));
      this.contentRows.forEach(row => {
        row.items.forEach(item => this.allContent.set(item.id, item));
      });
      
      const allMedia = [...featured, ...recommended, ...popular, ...newMovies, ...documentaries];
      for (const media of allMedia) {
        if (!this.searchableContent.has(media.mediaid)) {
          this.searchableContent.set(media.mediaid, {
            item: convertJWPlayerToRowItem(media),
            title: decodeHtmlEntities(media.title).toLowerCase(),
            tags: decodeHtmlEntities(media.tags || "").toLowerCase(),
            description: decodeHtmlEntities(media.description || "").toLowerCase(),
          });
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
    
    // Build category map for these items
    const sport = SPORT_PLAYLISTS.find(s => s.id === playlistId);
    if (sport) {
      for (const m of media) {
        this.mediaCategoryMap.set(m.mediaid, sport.slug);
      }
    }
    
    return media.map(m => convertJWPlayerToRowItem(m));
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

    return items.map(item => ({
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
}

export const storage = new MemStorage();
