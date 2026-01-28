import { useParams, Link, useLocation } from "wouter";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

declare global {
  interface Window {
    jwplayer: any;
  }
}

interface Content {
  id: string;
  title: string;
  mediaId?: string;
  description?: string;
}

export default function Watch() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const playerRef = useRef<HTMLDivElement>(null);
  const [playerReady, setPlayerReady] = useState(false);

  const { data: content } = useQuery<Content>({
    queryKey: [`/api/content/${id}`],
    enabled: !!id,
  });

  useEffect(() => {
    if (!content?.mediaId || !playerRef.current) return;

    const initPlayer = () => {
      if (window.jwplayer && playerRef.current) {
        const player = window.jwplayer(playerRef.current);
        player.setup({
          playlist: `https://cdn.jwplayer.com/v2/media/${content.mediaId}`,
          width: "100%",
          height: "100%",
          aspectratio: "16:9",
          autostart: true,
          mute: false,
          controls: true,
          stretching: "uniform",
        });

        player.on("ready", () => {
          setPlayerReady(true);
        });

        return () => {
          player.remove();
        };
      }
    };

    if (window.jwplayer) {
      return initPlayer();
    } else {
      const checkPlayer = setInterval(() => {
        if (window.jwplayer) {
          clearInterval(checkPlayer);
          initPlayer();
        }
      }, 100);
      return () => clearInterval(checkPlayer);
    }
  }, [content?.mediaId]);

  const handleBack = () => {
    if (content?.id) {
      setLocation(`/content/${content.id}`);
    } else {
      setLocation("/");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-white hover:text-gray-300 transition"
            data-testid="button-back"
          >
            <ArrowLeft className="w-6 h-6" />
            <span className="font-medium">Back</span>
          </button>
          
          <h1 className="text-lg font-bold truncate max-w-md" data-testid="text-video-title">
            {content?.title || "Loading..."}
          </h1>
          
          <Link href="/">
            <button className="p-2 hover:bg-white/10 rounded-full transition" data-testid="button-close">
              <X className="w-6 h-6" />
            </button>
          </Link>
        </div>
      </div>

      <div className="flex items-center justify-center min-h-screen bg-black pt-16">
        <div className="w-full max-w-screen-2xl aspect-video">
          {!playerReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-black">
              <div className="text-xl text-gray-400">Loading player...</div>
            </div>
          )}
          <div 
            ref={playerRef} 
            id="jwplayer-container"
            className="w-full h-full"
            data-testid="video-player"
          />
        </div>
      </div>
    </div>
  );
}
