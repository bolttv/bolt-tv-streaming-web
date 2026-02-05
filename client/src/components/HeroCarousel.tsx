import { HeroItem } from "@/lib/mockData";
import { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Play, Plus, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

interface HeroCarouselProps {
  items: HeroItem[];
}

export default function HeroCarousel({ items }: HeroCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 40 });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [failedLogos, setFailedLogos] = useState<Set<string>>(new Set());
  const [failedMotionThumbnails, setFailedMotionThumbnails] = useState<Set<string>>(new Set());

  const handleLogoError = (itemId: string) => {
    setFailedLogos(prev => new Set(prev).add(itemId));
  };

  const handleMotionThumbnailError = (itemId: string) => {
    setFailedMotionThumbnails(prev => new Set(prev).add(itemId));
  };

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    
    // Auto-advance
    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, 8000);

    return () => clearInterval(interval);
  }, [emblaApi, onSelect]);

  const scrollTo = (index: number) => {
    if (emblaApi) emblaApi.scrollTo(index);
  };

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  return (
    <div className="relative w-full h-[calc(70vh-90px)] sm:h-[calc(75vh-90px)] md:h-[calc(80vh-90px)] lg:h-[calc(90vh-90px)] overflow-hidden group">
      <div className="absolute inset-0 z-0" ref={emblaRef}>
        <div className="flex h-full">
          {items.map((item) => (
            <div key={item.id} className="relative flex-[0_0_100%] min-w-0 h-full">
              <div className="absolute inset-0">
                {item.motionThumbnail && !failedMotionThumbnails.has(item.id) ? (
                  <video
                    src={item.motionThumbnail}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover object-center"
                    onError={() => handleMotionThumbnailError(item.id)}
                    poster={item.heroImage}
                  />
                ) : (
                  <img
                    src={item.heroImage}
                    alt={item.title}
                    className="w-full h-full object-cover object-center"
                  />
                )}
                {/* Complex Gradient Overlays for Cinematic Feel */}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-black/40" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent w-2/3 md:w-1/2" />
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-background" />
                <div className="absolute bottom-32 left-0 right-0 h-48 bg-gradient-to-t from-background to-transparent" />
              </div>

              {/* Content - Lower left positioned */}
              <div className="absolute bottom-[124px] sm:bottom-[140px] md:bottom-[156px] left-4 md:left-12 max-w-xl z-20 space-y-3 sm:space-y-4 md:space-y-6 animate-in slide-in-from-left-4 fade-in duration-700 delay-300 fill-mode-both">
                {item.logoImage && !failedLogos.has(item.id) ? (
                  <img 
                    src={item.logoImage} 
                    alt={item.title} 
                    className="h-24 sm:h-32 md:h-52 object-contain" 
                    onError={() => handleLogoError(item.id)}
                  />
                ) : (
                  <h1 className="text-3xl sm:text-5xl md:text-7xl font-display font-black text-white leading-[0.9] tracking-tight uppercase drop-shadow-2xl">
                    {item.title}
                  </h1>
                )}

                {/* Metadata Line */}
                <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm md:text-base font-medium text-gray-300">
                  <span className="bg-white/10 px-1 sm:px-1.5 py-0.5 rounded text-white border border-white/20">{item.rating}</span>
                  {item.seasonCount && <span>{item.seasonCount} Seasons</span>}
                  <span className="w-1 h-1 bg-gray-400 rounded-full" />
                  <span>{item.genres[0]}</span>
                  {item.isNew && <span className="text-blue-400 font-bold uppercase tracking-wider hidden sm:inline">New Episode</span>}
                </div>

                <p className="text-gray-200 text-xs sm:text-sm md:text-lg line-clamp-2 md:line-clamp-3 leading-relaxed max-w-lg drop-shadow-md">
                  {item.description}
                </p>

                <div className="flex items-center gap-2 sm:gap-3 md:gap-4 pt-1 sm:pt-2">
                  {(() => {
                    const isSeries = item.contentType === "Series";
                    const isSingleContent = item.contentType === "Movie" || item.contentType === "Documentary" || item.contentType === "Episode";
                    
                    const watchButtonText = isSingleContent 
                      ? "Watch Now" 
                      : isSeries && item.nextEpisode 
                        ? `Watch S${item.nextEpisode.seasonNumber} E${item.nextEpisode.episodeNumber}`
                        : isSeries 
                          ? "Watch S1 E1"
                          : "Watch Now";
                    
                    const watchMediaId = isSeries && item.nextEpisode ? item.nextEpisode.mediaId : item.id;
                    
                    return (
                      <Link href={`/watch/${watchMediaId}`}>
                        <button className="flex items-center justify-center gap-1.5 sm:gap-2 bg-white text-black hover:bg-white/90 transition-colors h-9 sm:h-10 md:h-12 px-4 sm:px-6 md:px-8 rounded font-semibold tracking-wide text-xs sm:text-sm md:text-base cursor-pointer">
                          <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 fill-current" />
                          {watchButtonText}
                        </button>
                      </Link>
                    );
                  })()}
                  <button className="flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/10 text-white transition-colors h-9 w-9 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded backdrop-blur-sm">
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={scrollPrev}
        className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:scale-110"
        aria-label="Previous slide"
        data-testid="hero-arrow-prev"
      >
        <ChevronLeft className="w-10 h-10 md:w-12 md:h-12 text-white/70 hover:text-white transition-colors" strokeWidth={1.5} />
      </button>
      <button
        onClick={scrollNext}
        className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:scale-110"
        aria-label="Next slide"
        data-testid="hero-arrow-next"
      >
        <ChevronRight className="w-10 h-10 md:w-12 md:h-12 text-white/70 hover:text-white transition-colors" strokeWidth={1.5} />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-[48px] md:bottom-[64px] left-0 right-0 flex justify-center gap-2 md:gap-3 z-30">
        {items.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollTo(index)}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-300",
              index === selectedIndex ? "bg-white w-6 md:w-8" : "bg-white/30 hover:bg-white/50"
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
