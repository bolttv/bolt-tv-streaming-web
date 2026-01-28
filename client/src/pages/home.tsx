import Navbar from "@/components/Navbar";
import HeroCarousel from "@/components/HeroCarousel";
import ContentRow from "@/components/ContentRow";
import SportCategoryCard from "@/components/SportCategoryCard";
import Footer from "@/components/Footer";
import { useQuery } from "@tanstack/react-query";

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

export default function Home() {
  const { data: heroItems = [], isLoading: heroLoading } = useQuery<HeroItem[]>({
    queryKey: ["/api/content/hero"],
  });

  const { data: rows = [], isLoading: rowsLoading } = useQuery<Row[]>({
    queryKey: ["/api/content/rows"],
  });

  const { data: sportCategories = [] } = useQuery<SportCategory[]>({
    queryKey: ["/api/sports"],
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
          {rows.map((row) => (
            <ContentRow key={row.id} row={row} />
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
