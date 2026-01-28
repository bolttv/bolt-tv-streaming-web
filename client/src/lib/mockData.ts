export interface HeroItem {
  id: string;
  title: string;
  type: "series" | "movie";
  heroImage: string;
  logoImage?: string; // Optional logo overlay instead of text
  rating: string;
  seasonCount?: number;
  genres: string[];
  description: string;
  isNew: boolean;
}

export interface RowItem {
  id: string;
  title: string;
  posterImage: string;
  rating: string;
  seasonCount?: number;
  isNew: boolean;
  isNewEpisode?: boolean;
  continueProgress?: number; // 0 to 1
  seasonEpisodeLabel?: string;
}

export interface Row {
  id: string;
  title: string;
  items: RowItem[];
}

// Helper to get random image from our stock assets
const getPoster = (type: 'action' | 'comedy' | 'doc') => {
  const num = Math.floor(Math.random() * 3) + 1;
  return `/assets/poster-${type}_${num}.jpg`;
};

export const heroItems: HeroItem[] = [
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

const generateItems = (count: number, type: 'action' | 'comedy' | 'doc'): RowItem[] => {
  return Array.from({ length: count }).map((_, i) => ({
    id: `${type}-${i}`,
    title: type === 'action' ? `Action Movie ${i + 1}` : type === 'comedy' ? `Sitcom ${i + 1}` : `Wild Earth ${i + 1}`,
    posterImage: getPoster(type),
    rating: type === 'action' ? "PG-13" : type === 'comedy' ? "TV-14" : "TV-PG",
    seasonCount: type !== 'doc' ? Math.floor(Math.random() * 5) + 1 : undefined,
    isNew: Math.random() > 0.7,
    isNewEpisode: Math.random() > 0.8
  }));
};

export const rows: Row[] = [
  {
    id: "r1",
    title: "Featured",
    items: generateItems(10, "action")
  },
  {
    id: "r2",
    title: "Recommended For You",
    items: generateItems(10, "comedy")
  },
  {
    id: "r3",
    title: "Continue Watching",
    items: generateItems(5, "action").map(item => ({
      ...item,
      continueProgress: Math.random() * 0.8 + 0.1,
      seasonEpisodeLabel: "S2 E4"
    }))
  },
  {
    id: "r4",
    title: "Popular Series",
    items: generateItems(10, "comedy")
  },
  {
    id: "r5",
    title: "Documentaries",
    items: generateItems(10, "doc")
  },
  {
    id: "r6",
    title: "New Movies",
    items: generateItems(10, "action")
  }
];
