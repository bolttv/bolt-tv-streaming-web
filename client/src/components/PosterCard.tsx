import { RowItem } from "@/lib/mockData";
import { Play, Plus, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface PosterCardProps {
  item: RowItem;
  width?: string;
  isWide?: boolean; // For "Continue Watching" style
  category?: string; // Category slug for recommendations tracking
}

import { Link } from "wouter";

export default function PosterCard({ item, width = "w-[160px] md:w-[220px]", isWide = false, category }: PosterCardProps) {
  const href = category ? `/content/${item.id}?category=${category}` : `/content/${item.id}`;
  
  return (
    <Link href={href}>
      <div 
        className={cn(
          "group relative flex-shrink-0 cursor-pointer transition-all duration-300",
          width
        )}
      >
        <div 
          className={cn(
            "relative overflow-hidden rounded-md border-2 border-transparent transition-all duration-300 group-hover:border-white/90 group-hover:z-10 bg-zinc-900",
            isWide ? "aspect-video" : "aspect-[2/3]"
          )}
        >
          <img
            src={isWide ? item.posterImage : (item.verticalPosterImage || item.posterImage)}
            alt={item.title}
            className="h-full w-full object-cover transition-opacity duration-300 group-hover:opacity-80"
            loading="eager"
            decoding="async"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src !== item.posterImage) {
                target.src = item.posterImage;
              }
            }}
          />
          
          {/* Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 md:p-4">
            <div className="flex items-center gap-2 mb-2">
              <button className="bg-white text-black rounded-full p-1.5 hover:scale-110 transition">
                <Play className="w-3 h-3 md:w-4 md:h-4 fill-current" />
              </button>
              <button className="bg-zinc-800/80 text-white rounded-full p-1.5 hover:bg-zinc-700 transition">
                <Plus className="w-3 h-3 md:w-4 md:h-4" />
              </button>
            </div>
            
            <div className="text-xs font-semibold text-white truncate">
              {item.title}
            </div>
            <div className="text-[10px] text-zinc-300 flex items-center gap-2 mt-1">
              <span>{item.rating}</span>
              {item.seasonCount && <span>• {item.seasonCount} Seasons</span>}
            </div>
          </div>

          {/* Labels */}
          {item.isNewEpisode && (
            <div className="absolute top-2 left-2 bg-white text-black text-[9px] md:text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider shadow-sm">
              New Episode
            </div>
          )}
          {item.isNew && !item.isNewEpisode && (
            <div className="absolute top-2 left-2 bg-zinc-100 text-black text-[9px] md:text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider shadow-sm">
              New
            </div>
          )}

          {/* Continue Watching Progress */}
          {item.continueProgress && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
              <div 
                className="h-full bg-white" 
                style={{ width: `${item.continueProgress * 100}%` }}
              />
            </div>
          )}
        </div>

        {isWide && item.seasonEpisodeLabel && (
          <div className="mt-2 text-xs md:text-sm text-zinc-400 group-hover:text-white transition-colors">
            {item.seasonEpisodeLabel}
          </div>
        )}
      </div>
    </Link>
  );
}
