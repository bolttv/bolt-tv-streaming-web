"use client"

import Link from "next/link";
import { cn } from "@/lib/utils";

interface SportCategory {
  id: string;
  name: string;
  slug: string;
  playlistId: string;
  thumbnailImage: string;
}

interface SportCategoryCardProps {
  category: SportCategory;
}

const SPORT_GRADIENTS: Record<string, string> = {
  "college": "from-gray-900/80 to-gray-700/40",
  "soccer": "from-gray-800/80 to-gray-600/40",
  "baseball": "from-gray-900/80 to-gray-600/40",
  "football": "from-[#050404]/80 to-gray-800/40",
  "basketball": "from-gray-900/80 to-gray-700/40",
  "action-sports": "from-gray-800/80 to-gray-600/40",
};

const SPORT_ICONS: Record<string, string> = {
  "college": "🎓",
  "soccer": "⚽",
  "baseball": "⚾",
  "football": "🏈",
  "basketball": "🏀",
  "action-sports": "🏂",
};

export default function SportCategoryCard({ category }: SportCategoryCardProps) {
  const gradient = SPORT_GRADIENTS[category.slug] || "from-gray-900/80 to-gray-700/40";
  const icon = SPORT_ICONS[category.slug] || "🏆";

  return (
    <Link href={`/sport/${category.playlistId}`}>
      <div 
        className="group relative flex-shrink-0 cursor-pointer transition-all duration-300 w-[160px] md:w-[220px]"
        data-testid={`sport-card-${category.slug}`}
      >
        <div 
          className={cn(
            "relative overflow-hidden rounded-lg border-2 border-transparent transition-all duration-300",
            "group-hover:border-white/90 group-hover:z-10 bg-zinc-900 aspect-[2/3]"
          )}
        >
          <div className={cn(
            "absolute inset-0 bg-gradient-to-b",
            gradient
          )} />
          
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
            <span className="text-5xl md:text-6xl mb-4">{icon}</span>
            <h3 className="text-lg md:text-xl font-bold text-white text-center drop-shadow-lg">
              {category.name}
            </h3>
          </div>

          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      </div>
    </Link>
  );
}
