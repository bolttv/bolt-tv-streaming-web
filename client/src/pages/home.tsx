import Navbar from "@/components/Navbar";
import HeroCarousel from "@/components/HeroCarousel";
import ContentRow from "@/components/ContentRow";
import SportCategoryCard from "@/components/SportCategoryCard";
import ContinueWatchingCard from "@/components/ContinueWatchingCard";
import Footer from "@/components/Footer";
import { HomePageSkeleton } from "@/components/SkeletonLoaders";
import { useQuery } from "@tanstack/react-query";
import { getSessionId } from "@/lib/session";

interface HeroItem {
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
}

interface RowItem {
  id: string;
  title: string;
  posterImage: string;
  rating: string;
  seasonCount?: number;
  isNew: boolean;
  isNewEpisode?: boolean;
  continueProgress?: number;
  seasonEpisodeLabel?: string;
}

interface Row {
  id: string;
  title: string;
  items: RowItem[];
}

interface SportCategory {
  id: string;
  name: string;
  slug: string;
  playlistId: string;
  thumbnailImage: string;
}

interface ContinueWatchingItem {
  id: string;
  mediaId: string;
  title: string;
  posterImage: string;
  duration: number;
  watchedSeconds: number;
  progress: number;
}

export default function Home() {
  const sessionId = getSessionId();
  
  const { data: heroItems = [], isLoading: heroLoading } = useQuery<HeroItem[]>({
    queryKey: ["/api/content/hero", sessionId],
    queryFn: async () => {
      const res = await fetch("/api/content/hero", {
        headers: { "x-session-id": sessionId },
      });
      if (!res.ok) throw new Error("Failed to fetch hero items");
      return res.json();
    },
  });

  const { data: rows = [], isLoading: rowsLoading } = useQuery<Row[]>({
    queryKey: ["/api/content/rows"],
  });

  const { data: sportCategories = [] } = useQuery<SportCategory[]>({
    queryKey: ["/api/sports"],
  });

  const { data: continueWatching = [] } = useQuery<ContinueWatchingItem[]>({
    queryKey: ["/api/continue-watching", sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/continue-watching/${sessionId}`);
      if (!res.ok) return [];
      return res.json();
    },
    refetchOnWindowFocus: true,
  });

  const { data: personalizedRecs = [] } = useQuery<RowItem[]>({
    queryKey: ["/api/recommendations", sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/recommendations/${sessionId}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: continueWatching.length > 0,
  });

  if (heroLoading || rowsLoading) {
    return <HomePageSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background text-white selection:bg-white/20">
      <Navbar />
      
      <main className="relative z-0">
        <HeroCarousel items={heroItems} />
        
        <div className="relative z-10 -mt-10 md:-mt-14 pb-20 space-y-1 md:space-y-2 bg-gradient-to-b from-transparent via-background/60 to-background">
          {rows.map((row) => {
            // Use personalized recommendations if available and this is the Recommended row
            const usePersonalized = row.title === "Recommended For You" && personalizedRecs.length > 0;
            const displayRow = usePersonalized 
              ? { ...row, items: personalizedRecs }
              : row;
            
            return (
              <div key={row.id}>
                <ContentRow row={displayRow} />
                {row.title === "Recommended For You" && continueWatching.length > 0 && (
                  <section className="pl-4 md:pl-12 mt-1 md:mt-2 py-2 md:py-3" data-testid="continue-watching-section">
                    <h2 className="text-lg md:text-xl font-semibold text-white mb-3 md:mb-4">
                      Continue Watching
                    </h2>
                    <div className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide pr-12">
                      {continueWatching.map((item) => (
                        <ContinueWatchingCard key={item.id} item={item} />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            );
          })}

          {sportCategories.length > 0 && (
            <section className="px-4 md:px-12 pt-8" data-testid="browse-by-sport-section">
              <h2 className="text-lg md:text-xl font-semibold text-white mb-4 md:mb-6">
                Browse by Sport
              </h2>
              <div className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide pb-4">
                {sportCategories.map((category) => (
                  <SportCategoryCard key={category.id} category={category} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
