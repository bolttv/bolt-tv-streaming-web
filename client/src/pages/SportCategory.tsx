import { useParams, Link } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PosterCard from "@/components/PosterCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

interface SportContent {
  id: string;
  title: string;
  posterImage: string;
  verticalPosterImage?: string;
  rating: string;
  isNew: boolean;
  mediaId?: string;
}

const SPORT_NAMES: Record<string, string> = {
  "PFauvVKV": "College",
  "QzHRrJRZ": "Soccer",
  "BC45vsNB": "Baseball",
  "FZgrLpfJ": "Football",
  "YY5zhjLQ": "Basketball",
  "iCwCBaL7": "Action Sports",
};

const SPORT_SLUGS: Record<string, string> = {
  "PFauvVKV": "college",
  "QzHRrJRZ": "soccer",
  "BC45vsNB": "baseball",
  "FZgrLpfJ": "football",
  "YY5zhjLQ": "basketball",
  "iCwCBaL7": "action-sports",
};

export default function SportCategory() {
  const { playlistId } = useParams();
  
  const { data: content = [], isLoading } = useQuery<SportContent[]>({
    queryKey: [`/api/sports/${playlistId}/content`],
    enabled: !!playlistId,
  });

  const sportName = playlistId ? SPORT_NAMES[playlistId] || "Sport" : "Sport";
  const sportSlug = playlistId ? SPORT_SLUGS[playlistId] : undefined;

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <main className="pt-24 px-4 md:px-12 pb-12">
        <div className="mb-8">
          <Link href="/">
            <button className="flex items-center gap-2 text-gray-400 hover:text-white transition mb-4" data-testid="button-back-home">
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Home</span>
            </button>
          </Link>
          <h1 className="text-3xl md:text-4xl font-display font-bold" data-testid="text-sport-title">
            {sportName}
          </h1>
          <p className="text-gray-400 mt-2">Browse all {sportName.toLowerCase()} content</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : content.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-xl text-gray-400 mb-4">No content available yet</div>
            <p className="text-gray-500">Check back soon for new {sportName.toLowerCase()} content!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4" data-testid="sport-content-grid">
            {content.map((item) => (
              <PosterCard key={item.id} item={item} width="w-full" category={sportSlug} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
