import { HeroItem } from "@/lib/mockData";
import { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Play, Plus, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeroCarouselProps {
  items: HeroItem[];
}

export default function HeroCarousel({ items }: HeroCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 40 });
  const [selectedIndex, setSelectedIndex] = useState(0);

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

  return (
    <div className="relative w-full h-[85vh] md:h-[90vh] overflow-hidden group">
      <div className="absolute inset-0 z-0" ref={emblaRef}>
        <div className="flex h-full">
          {items.map((item) => (
            <div key={item.id} className="relative flex-[0_0_100%] min-w-0 h-full">
              <div className="absolute inset-0">
                <img
                  src={item.heroImage}
                  alt={item.title}
                  className="w-full h-full object-cover object-center"
                />
                {/* Complex Gradient Overlays for Cinematic Feel */}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-black/40" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent w-2/3 md:w-1/2" />
                <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-background to-transparent" />
              </div>

              {/* Content */}
              <div className="absolute bottom-32 md:bottom-36 left-4 md:left-12 max-w-xl z-20 space-y-4 md:space-y-6 animate-in slide-in-from-left-4 fade-in duration-700 delay-300 fill-mode-both">
                {item.logoImage ? (
                  <img src={item.logoImage} alt={item.title} className="h-20 md:h-32 object-contain mb-4" />
                ) : (
                  <h1 className="text-5xl md:text-7xl font-display font-black text-white leading-[0.9] tracking-tight uppercase drop-shadow-2xl">
                    {item.title}
                  </h1>
                )}

                {/* Metadata Line */}
                <div className="flex items-center gap-3 text-sm md:text-base font-medium text-gray-300">
                  <span className="bg-white/10 px-1.5 py-0.5 rounded text-white border border-white/20">{item.rating}</span>
                  {item.seasonCount && <span>{item.seasonCount} Seasons</span>}
                  <span className="w-1 h-1 bg-gray-400 rounded-full" />
                  <span>{item.genres[0]}</span>
                  {item.isNew && <span className="text-blue-400 font-bold uppercase tracking-wider">New Episode</span>}
                </div>

                <p className="text-gray-200 text-sm md:text-lg line-clamp-2 md:line-clamp-3 leading-relaxed max-w-lg drop-shadow-md">
                  {item.description}
                </p>

                <div className="flex items-center gap-3 md:gap-4 pt-2">
                  <button className="flex items-center justify-center gap-2 bg-white text-black hover:bg-white/90 transition-colors h-10 md:h-12 px-6 md:px-8 rounded font-semibold tracking-wide text-sm md:text-base">
                    <Play className="w-4 h-4 md:w-5 md:h-5 fill-current" />
                    {item.type === "series" ? "Watch S1 E1" : "Watch Now"}
                  </button>
                  <button className="flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/10 text-white transition-colors h-10 w-10 md:h-12 md:w-12 rounded backdrop-blur-sm">
                    <Plus className="w-5 h-5 md:w-6 md:h-6" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dots Indicator */}
      <div className="absolute bottom-8 md:bottom-12 left-0 right-0 flex justify-center gap-2 md:gap-3 z-30">
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
