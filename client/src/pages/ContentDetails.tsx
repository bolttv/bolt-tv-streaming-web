import { useParams, Link } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Play, Plus, ThumbsUp, Film, ChevronDown } from "lucide-react";
import PosterCard from "@/components/PosterCard";
import { useQuery } from "@tanstack/react-query";

type ContentType = "Trailer" | "Episode" | "Series" | "Movie" | "Documentary";

interface Content {
  id: string;
  title: string;
  heroImage?: string;
  posterImage?: string;
  logoImage?: string;
  rating: string;
  seasonCount?: number;
  genres?: string[];
  description?: string;
  isNew?: boolean;
  type?: "series" | "movie";
  trailerId?: string;
  contentType?: ContentType;
}

export default function ContentDetails() {
  const { id } = useParams();
  
  // Get category from URL params (when coming from sport page)
  const urlParams = new URLSearchParams(window.location.search);
  const category = urlParams.get("category");
  
  const { data: content, isLoading } = useQuery<Content>({
    queryKey: [`/api/content/${id}`],
    enabled: !!id,
  });

  const { data: rows = [] } = useQuery<any[]>({
    queryKey: ["/api/content/rows"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-xl">Content not found</div>
      </div>
    );
  }

  const episodes = [
    { id: 1, title: "Episode 1", duration: "55m", image: "/assets/poster-action_1.jpg", desc: "The team preps for a Black Friday battle vs. the Bears in the wake of a tough loss to the Cowboys.", contentId: "action-1" },
    { id: 2, title: "Episode 2", duration: "57m", image: "/assets/poster-action_2.jpg", desc: "Dak Prescott and the Cowboys look to stay hot while the Giants, Eagles, and Commanders all try to turn their luck around.", contentId: "action-2" },
    { id: 3, title: "Episode 3", duration: "55m", image: "/assets/poster-action_3.jpg", desc: "While the Eagles and Cowboys look to rebound from tough losses, the Giants and Commanders face off on a snowy Sunday.", contentId: "action-3" },
    { id: 4, title: "Episode 4", duration: "54m", image: "/assets/poster-comedy_1.jpg", desc: "Each of the NFC East teams prepares for Christmas...even if only the Eagles will find a playoff ticket under the tree.", contentId: "comedy-1" },
  ];

  const displayImage = content.heroImage || content.posterImage || "";
  const displayGenres = content.genres || ["Drama", "Sports"];
  const displayDescription = content.description || "Experience the intensity and drama in this gripping series that takes you behind the scenes.";

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white/20">
      <Navbar />

      <main>
        {/* Hero Section */}
        <div className="relative h-[70vh] sm:h-[75vh] md:h-[80vh] w-full">
          <div className="absolute inset-0">
            <img 
              src={displayImage} 
              alt={content.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent w-full md:w-2/3" />
          </div>

          <div className="absolute bottom-0 left-0 right-0 px-4 md:px-12 pb-12 z-10">
            <div className="max-w-2xl space-y-6">
              {content.logoImage ? (
                 <img src={content.logoImage} alt={content.title} className="h-16 sm:h-24 md:h-32 object-contain" />
              ) : (
                 <h1 className="text-3xl sm:text-4xl md:text-6xl font-display font-black uppercase leading-none drop-shadow-xl">{content.title}</h1>
              )}

              {/* Show season info only for Series/Episode content types */}
              {(content.contentType === "Series" || content.contentType === "Episode") && (
                <div className="flex items-center gap-3 text-sm font-medium text-gray-300">
                  <span className="text-blue-400 font-bold">Season 1 Now Available</span>
                </div>
              )}
              
              <div className="flex items-center gap-3 text-sm font-medium text-gray-300">
                <span className="bg-white/10 px-1.5 py-0.5 rounded text-white border border-white/20">{content.rating}</span>
                {(content.contentType === "Series" || content.contentType === "Episode") && (
                  <span>1 Season</span>
                )}
                {(content.contentType === "Movie" || content.contentType === "Documentary") && (
                  <span>{content.contentType}</span>
                )}
                {!content.contentType && (
                  <span>Series</span>
                )}
                <span className="border border-white/20 px-1 rounded text-[10px]">AD</span>
              </div>

              <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-2">
                <Link href={`/watch/${id}${category ? `?category=${category}` : ''}`}>
                  <button className="flex items-center gap-2 bg-white text-black hover:bg-white/90 transition-colors h-10 sm:h-12 px-5 sm:px-8 rounded font-bold tracking-wide text-sm sm:text-base" data-testid="button-watch">
                    <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                    Watch Now
                  </button>
                </Link>
                
                <div className="flex items-center gap-4 sm:gap-6 px-2">
                    <button className="flex flex-col items-center gap-1 group text-gray-300 hover:text-white transition">
                        <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
                        <span className="text-[9px] sm:text-[10px] uppercase tracking-wider font-bold">My List</span>
                    </button>
                    <button className="flex flex-col items-center gap-1 group text-gray-300 hover:text-white transition">
                        <ThumbsUp className="w-5 h-5 sm:w-6 sm:h-6" />
                        <span className="text-[9px] sm:text-[10px] uppercase tracking-wider font-bold">Rate</span>
                    </button>
                    {content.trailerId && (
                      <Link href={`/watch/${content.trailerId}${category ? `?category=${category}` : ''}`}>
                        <button className="flex flex-col items-center gap-1 group text-gray-300 hover:text-white transition" data-testid="button-trailer">
                            <Film className="w-5 h-5 sm:w-6 sm:h-6" />
                            <span className="text-[9px] sm:text-[10px] uppercase tracking-wider font-bold">Trailer</span>
                        </button>
                      </Link>
                    )}
                </div>
              </div>

              <p className="text-gray-300 text-sm md:text-base leading-relaxed max-w-xl drop-shadow-md">
                {displayDescription}
              </p>
              
              <div className="flex gap-2 text-xs text-gray-400 font-medium">
                 <span>{displayGenres.join(" • ")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Episodes Section - Only show for Series or Episode content types (explicitly, not when undefined) */}
        {(content.contentType === "Series" || content.contentType === "Episode") && (
          <div className="px-4 md:px-12 py-8 space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <h2 className="text-xl font-bold">Episodes</h2>
                  <button className="flex items-center gap-2 text-sm font-bold hover:bg-white/10 px-3 py-1.5 rounded transition">
                      Season 1 <ChevronDown className="w-4 h-4" />
                  </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  {episodes.map(ep => (
                      <Link key={ep.id} href={`/content/${ep.contentId}`}>
                        <div className="group cursor-pointer space-y-3">
                            <div className="relative aspect-video bg-zinc-800 rounded-md overflow-hidden border-2 border-transparent transition-all duration-300 group-hover:border-white">
                                <img src={ep.image} alt={ep.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition" />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/40">
                                    <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
                                        <Play className="w-6 h-6 fill-white text-white" />
                                    </div>
                                </div>
                                <div className="absolute bottom-2 left-2 bg-black/60 px-1.5 py-0.5 rounded text-[10px] font-bold">{ep.duration}</div>
                            </div>
                            <div>
                                <div className="font-bold text-sm mb-1 group-hover:text-white transition-colors">{ep.id}: {ep.title}</div>
                                <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed">{ep.desc}</p>
                            </div>
                        </div>
                      </Link>
                  ))}
              </div>
          </div>
        )}

        {/* You May Also Like */}
        <div className="px-4 md:px-12 py-12 space-y-6">
            <h2 className="text-xl font-bold">You May Also Like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                {rows[1]?.items?.slice(0, 5).map((item: any) => (
                    <PosterCard key={item.id} item={item} width="w-full" />
                ))}
            </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
