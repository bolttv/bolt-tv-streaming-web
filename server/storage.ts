import { type User, type InsertUser } from "@shared/schema";
import { randomUUID } from "crypto";
import { fetchAllJWPlayerMedia, getJWPlayerThumbnail, getJWPlayerHeroImage, JWPlayerPlaylistItem } from "./jwplayer";

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
}

export interface RowItem {
  id: string;
  title: string;
  posterImage: string;
  rating: string;
  seasonCount?: number;
  isNew: boolean;
  isNewEpisode?: boolean;
  continueProgress?: number;
  seasonEpisodeLabel?: string;
  mediaId?: string;
  duration?: number;
}

export interface ContentRow {
  id: string;
  title: string;
  items: RowItem[];
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getHeroItems(): Promise<HeroItem[]>;
  getContentRows(): Promise<ContentRow[]>;
  getContentById(id: string): Promise<HeroItem | RowItem | undefined>;
  refreshJWPlayerContent(): Promise<void>;
}

function convertJWPlayerToRowItem(media: JWPlayerPlaylistItem): RowItem {
  const tags = media.tags?.split(",") || [];
  const isNew = media.pubdate ? (Date.now() / 1000 - media.pubdate) < 7 * 24 * 60 * 60 : false;
  
  return {
    id: media.mediaid,
    title: media.title,
    posterImage: media.image || getJWPlayerThumbnail(media.mediaid),
    rating: "TV-MA",
    isNew,
    isNewEpisode: false,
    mediaId: media.mediaid,
    duration: media.duration,
  };
}

function convertJWPlayerToHeroItem(media: JWPlayerPlaylistItem): HeroItem {
  const tags = media.tags?.split(",") || [];
  const isNew = media.pubdate ? (Date.now() / 1000 - media.pubdate) < 7 * 24 * 60 * 60 : false;
  
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
  };
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private heroItems: HeroItem[];
  private contentRows: ContentRow[];
  private allContent: Map<string, HeroItem | RowItem>;
  private jwPlayerMedia: JWPlayerPlaylistItem[] = [];
  private lastFetch: number = 0;
  private isInitialized: boolean = false;

  constructor() {
    this.users = new Map();
    this.allContent = new Map();
    this.heroItems = [];
    this.contentRows = [];
  }

  async refreshJWPlayerContent(): Promise<void> {
    const now = Date.now();
    if (now - this.lastFetch < 60000 && this.isInitialized) {
      return;
    }

    console.log("Fetching content from JW Player...");
    const media = await fetchAllJWPlayerMedia();
    
    if (media.length > 0) {
      console.log(`Found ${media.length} items from JW Player`);
      this.jwPlayerMedia = media;
      this.lastFetch = now;
      this.isInitialized = true;
      
      this.heroItems = media.slice(0, 3).map(m => convertJWPlayerToHeroItem(m));
      
      const allItems = media.map(m => convertJWPlayerToRowItem(m));
      
      this.contentRows = [
        {
          id: "r1",
          title: "Featured",
          items: allItems.slice(0, 8)
        },
        {
          id: "r2",
          title: "Recommended For You",
          items: allItems.slice(0, 10)
        },
        {
          id: "r3",
          title: "Continue Watching",
          items: allItems.slice(0, 5).map(item => ({
            ...item,
            continueProgress: Math.random() * 0.8 + 0.1,
            seasonEpisodeLabel: "S1 E1"
          }))
        },
        {
          id: "r4",
          title: "Popular Series",
          items: allItems.slice(3, 13)
        },
        {
          id: "r5",
          title: "New Releases",
          items: allItems.filter(item => item.isNew).slice(0, 10)
        },
        {
          id: "r6",
          title: "All Content",
          items: allItems
        }
      ];
      
      this.allContent.clear();
      this.heroItems.forEach(item => this.allContent.set(item.id, item));
      this.contentRows.forEach(row => {
        row.items.forEach(item => this.allContent.set(item.id, item));
      });
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
      { id: "r3", title: "Continue Watching", items: featuredItems.slice(0, 3).map(item => ({ ...item, continueProgress: 0.5, seasonEpisodeLabel: "S1 E1" })) },
      { id: "r4", title: "Popular Series", items: featuredItems },
      { id: "r5", title: "New Releases", items: featuredItems.filter(i => i.isNew) },
      { id: "r6", title: "All Content", items: featuredItems }
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
}

export const storage = new MemStorage();
