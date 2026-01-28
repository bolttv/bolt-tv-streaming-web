import Navbar from "@/components/Navbar";
import HeroCarousel from "@/components/HeroCarousel";
import ContentRow from "@/components/ContentRow";
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

export default function Home() {
  const { data: heroItems = [], isLoading: heroLoading } = useQuery<HeroItem[]>({
    queryKey: ["/api/content/hero"],
  });

  const { data: rows = [], isLoading: rowsLoading } = useQuery<Row[]>({
    queryKey: ["/api/content/rows"],
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
        </div>
      </main>

      <Footer />
    </div>
  );
}
