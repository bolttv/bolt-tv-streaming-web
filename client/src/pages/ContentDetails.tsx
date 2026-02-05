import { useParams, Link } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Play, Plus, ChevronDown } from "lucide-react";
import PosterCard from "@/components/PosterCard";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

type ContentType = "Trailer" | "Episode" | "Series" | "Movie" | "Documentary";

interface Content {
  id: string;
  title: string;
  heroImage?: string;
  motionThumbnail?: string;
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

interface Episode {
  id: string;
  title: string;
  description: string;
  duration: number;
  image: string;
  episodeNumber?: number;
  seasonNumber?: number;
  mediaId: string;
}

interface NextEpisode {
  seasonNumber: number;
  episodeNumber: number;
  mediaId: string;
}

function getSessionId(): string {
  let sessionId = localStorage.getItem("session_id");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem("session_id", sessionId);
  }
  return sessionId;
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

export default function ContentDetails() {
  const { id } = useParams();
  const [logoFailed, setLogoFailed] = useState(false);
  const [motionThumbnailFailed, setMotionThumbnailFailed] = useState(false);
  
  // Reset states and scroll to top when content changes
  useEffect(() => {
    setLogoFailed(false);
    setMotionThumbnailFailed(false);
    window.scrollTo(0, 0);
  }, [id]);
  
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

  // Fetch episodes for series content type only (not for individual episodes)
  const { data: episodes = [] } = useQuery<Episode[]>({
    queryKey: [`/api/series/${id}/episodes`],
    enabled: !!id && content?.contentType === "Series",
  });

  // Fetch next episode to watch for series
  const { data: nextEpisode } = useQuery<NextEpisode | null>({
    queryKey: [`/api/series/${id}/next-episode`, getSessionId()],
    queryFn: async () => {
      const response = await fetch(`/api/series/${id}/next-episode`, {
        headers: { "x-session-id": getSessionId() }
      });
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!id && content?.contentType === "Series",
  });

  // Determine watch button text and link
  // Series = multiple episodes, so show dynamic episode button
  // Episode/Movie/Documentary = single content, show "Watch Now"
  const isSeries = content?.contentType === "Series";
  const isSingleContent = content?.contentType === "Movie" || content?.contentType === "Documentary" || content?.contentType === "Episode";
  
  const watchButtonText = isSingleContent 
    ? "Watch Now" 
    : isSeries && nextEpisode 
      ? `Watch S${nextEpisode.seasonNumber} E${nextEpisode.episodeNumber}`
      : isSeries 
        ? "Watch S1 E1"
        : "Watch Now";
  
  const watchMediaId = isSeries && nextEpisode ? nextEpisode.mediaId : id;

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

  const displayImage = content.heroImage || content.posterImage || "";
  const displayGenres = content.genres || ["Drama", "Sports"];
  const displayDescription = content.description || "Experience the intensity and drama in this gripping series that takes you behind the scenes.";

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white/20">
      <Navbar />

      <main>
        {/* Hero Section */}
        <div className="relative w-full h-[calc(70vh-90px)] sm:h-[calc(75vh-90px)] md:h-[calc(80vh-90px)] lg:h-[calc(90vh-90px)]">
          <div className="absolute inset-0">
            {content.motionThumbnail && !motionThumbnailFailed ? (
              <video
                src={content.motionThumbnail}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
                onError={() => setMotionThumbnailFailed(true)}
                poster={displayImage}
              />
            ) : (
              <img 
                src={displayImage} 
                alt={content.title}
                className="w-full h-full object-cover"
              />
            )}
            {/* Complex Gradient Overlays for Cinematic Feel */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-black/40" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent w-2/3 md:w-1/2" />
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-background" />
            <div className="absolute bottom-32 left-0 right-0 h-48 bg-gradient-to-t from-background to-transparent" />
          </div>

          <div className="absolute bottom-[124px] sm:bottom-[140px] md:bottom-[156px] left-4 md:left-12 max-w-xl z-20 space-y-3 sm:space-y-4 md:space-y-6">
              {content.logoImage && !logoFailed ? (
                 <img 
                   src={content.logoImage} 
                   alt={content.title} 
                   className="h-24 sm:h-32 md:h-52 object-contain" 
                   onError={() => setLogoFailed(true)}
                 />
              ) : (
                 <h1 className="text-3xl sm:text-5xl md:text-7xl font-display font-black text-white leading-[0.9] tracking-tight uppercase drop-shadow-2xl">{content.title}</h1>
              )}

              {/* Metadata Line */}
              <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm md:text-base font-medium text-gray-300">
                <span className="bg-white/10 px-1 sm:px-1.5 py-0.5 rounded text-white border border-white/20">{content.rating}</span>
                {(content.contentType === "Series" || content.contentType === "Episode") && (
                  <span>1 Season</span>
                )}
                {(content.contentType === "Movie" || content.contentType === "Documentary") && (
                  <span>{content.contentType}</span>
                )}
                <span className="w-1 h-1 bg-gray-400 rounded-full" />
                <span>{displayGenres[0]}</span>
                {(content.contentType === "Series" || content.contentType === "Episode") && (
                  <span className="text-blue-400 font-bold uppercase tracking-wider hidden sm:inline">New Episode</span>
                )}
              </div>

              <p className="text-gray-200 text-xs sm:text-sm md:text-lg line-clamp-2 md:line-clamp-3 leading-relaxed max-w-lg drop-shadow-md">
                {displayDescription}
              </p>

              <div className="flex items-center gap-2 sm:gap-3 md:gap-4 pt-1 sm:pt-2">
                <Link href={`/watch/${watchMediaId}${category ? `?category=${category}` : ''}`}>
                  <button className="flex items-center gap-2 bg-white text-black hover:bg-white/90 transition-colors h-10 sm:h-12 px-5 sm:px-8 rounded font-bold tracking-wide text-sm sm:text-base" data-testid="button-watch">
                    <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                    {watchButtonText}
                  </button>
                </Link>
                <button className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-white/30 text-white hover:border-white hover:bg-white/10 transition-all" data-testid="button-add-list">
                  <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
          </div>
        </div>

        {/* Content Sections - pulled up to match home page */}
        <div className="relative z-10 -mt-10 md:-mt-14 pb-20 bg-gradient-to-b from-transparent via-background/60 to-background">
        
        {/* Episodes Section - Only show for Series or Episode content types with episodes available */}
        {(content.contentType === "Series" || content.contentType === "Episode") && episodes.length > 0 && (
          <div className="px-4 md:px-12 pt-4 pb-8 space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <h2 className="text-lg md:text-xl font-semibold text-white">Episodes</h2>
                  <button className="flex items-center gap-2 text-sm font-bold hover:bg-white/10 px-3 py-1.5 rounded transition">
                      Season 1 <ChevronDown className="w-4 h-4" />
                  </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  {episodes.map((ep, index) => (
                      <Link key={ep.id} href={`/watch/${ep.mediaId}${category ? `?category=${category}` : ''}`}>
                        <div className="group cursor-pointer space-y-3" data-testid={`episode-card-${ep.id}`}>
                            <div className="relative aspect-video bg-zinc-800 rounded-md overflow-hidden border-2 border-transparent transition-all duration-300 group-hover:border-white">
                                <img src={ep.image} alt={ep.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition" />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/40">
                                    <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
                                        <Play className="w-6 h-6 fill-white text-white" />
                                    </div>
                                </div>
                                <div className="absolute bottom-2 left-2 bg-black/60 px-1.5 py-0.5 rounded text-[10px] font-bold">{formatDuration(ep.duration)}</div>
                            </div>
                            <div>
                                <div className="font-bold text-sm mb-1 group-hover:text-white transition-colors">{ep.episodeNumber || index + 1}: {ep.title}</div>
                                <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed">{ep.description}</p>
                            </div>
                        </div>
                      </Link>
                  ))}
              </div>
          </div>
        )}

        {/* You May Also Like */}
        <div className="px-4 md:px-12 pt-8 pb-4 space-y-6">
            <h2 className="text-lg md:text-xl font-semibold text-white">You May Also Like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                {rows[1]?.items?.slice(0, 5).map((item: any) => (
                    <PosterCard key={item.id} item={item} width="w-full" />
                ))}
            </div>
        </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
