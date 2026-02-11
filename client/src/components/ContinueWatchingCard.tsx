import { Link } from "wouter";
import { cn } from "@/lib/utils";

interface ContinueWatchingItem {
  id: string;
  mediaId: string;
  title: string;
  posterImage: string;
  horizontalPosterLogo?: string;
  duration: number;
  watchedSeconds: number;
  progress: number;
}

interface ContinueWatchingCardProps {
  item: ContinueWatchingItem;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function ContinueWatchingCard({ item }: ContinueWatchingCardProps) {
  const remainingSeconds = item.duration - item.watchedSeconds;
  const remainingText = remainingSeconds > 60 
    ? `${Math.ceil(remainingSeconds / 60)} min left`
    : `${Math.round(remainingSeconds)} sec left`;

  const horizontalPosterLogoUrl = item.horizontalPosterLogo || `https://cdn.jwplayer.com/v2/media/${item.mediaId}/images/Horizontal-Poster-Logo.jpg`;
  const fallbackPosterUrl = `https://cdn.jwplayer.com/v2/media/${item.mediaId}/poster.jpg?width=480`;

  return (
    <Link href={`/watch/${item.mediaId}`}>
      <div 
        className="group relative flex-shrink-0 cursor-pointer transition-all duration-300 w-[240px] md:w-[300px]"
        data-testid={`continue-watching-card-${item.mediaId}`}
      >
        <div 
          className={cn(
            "relative overflow-hidden rounded-lg border-2 border-transparent transition-all duration-300",
            "group-hover:border-white/90 group-hover:z-10 bg-zinc-900 aspect-video"
          )}
        >
          <img
            src={horizontalPosterLogoUrl}
            alt={item.title}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src !== fallbackPosterUrl) {
                target.src = fallbackPosterUrl;
              }
            }}
          />
          
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
            <div 
              className="h-full bg-[#C14600] transition-all duration-300"
              style={{ width: `${Math.min(item.progress * 100, 100)}%` }}
            />
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <p className="text-white text-sm font-medium truncate">{item.title}</p>
            <p className="text-gray-300 text-xs">{remainingText}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
