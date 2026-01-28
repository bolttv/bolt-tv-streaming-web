import Navbar from "@/components/Navbar";
import HeroCarousel from "@/components/HeroCarousel";
import ContentRow from "@/components/ContentRow";
import SportCategoryCard from "@/components/SportCategoryCard";
import ContinueWatchingCard from "@/components/ContinueWatchingCard";
import Footer from "@/components/Footer";
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
    queryKey: ["/api/content/hero"],
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

  if (heroLoading || rowsLoading) {
    return (
      <div className="min-h-screen bg-background text-white flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white selection:bg-white/20">
      <Navbar />
      
      <main className="relative z-0">
        <HeroCarousel items={heroItems} />
        
        <div className="relative z-10 -mt-24 md:-mt-32 pb-20 space-y-4 md:space-y-8 bg-gradient-to-b from-transparent via-background/60 to-background">
          {rows.map((row, index) => (
            <div key={row.id}>
              <ContentRow row={row} />
              {row.title === "Recommended For You" && continueWatching.length > 0 && (
                <section className="px-4 md:px-12 mt-4 md:mt-8" data-testid="continue-watching-section">
                  <h2 className="text-lg md:text-xl font-semibold text-white mb-4 md:mb-6">
                    Continue Watching
                  </h2>
                  <div className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide pb-4">
                    {continueWatching.map((item) => (
                      <ContinueWatchingCard key={item.id} item={item} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          ))}

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
