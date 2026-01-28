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
  const [playerError, setPlayerError] = useState<string | null>(null);
  const playerInstanceRef = useRef<any>(null);

  const { data: content, isLoading } = useQuery<Content>({
    queryKey: [`/api/content/${id}`],
    enabled: !!id,
  });

  const mediaId = content?.mediaId || id;

  useEffect(() => {
    if (!mediaId || !playerRef.current) return;

    let cleanup: (() => void) | undefined;
    let checkInterval: NodeJS.Timeout | undefined;
    let loadTimeout: NodeJS.Timeout | undefined;

    const initPlayer = () => {
      if (window.jwplayer && playerRef.current) {
        try {
          if (playerInstanceRef.current) {
            try {
              playerInstanceRef.current.remove();
            } catch (e) {
              // Ignore removal errors
            }
          }

          const player = window.jwplayer(playerRef.current);
          playerInstanceRef.current = player;
          
          player.setup({
            playlist: `https://cdn.jwplayer.com/v2/media/${mediaId}`,
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
            setPlayerError(null);
          });

          player.on("error", (e: any) => {
            console.error("JW Player error:", e);
            setPlayerError("Unable to play video. Please try again.");
          });

          player.on("setupError", (e: any) => {
            console.error("JW Player setup error:", e);
            setPlayerError("Failed to initialize player.");
          });
        } catch (err) {
          console.error("Player init error:", err);
          setPlayerError("Failed to initialize player.");
        }
      }
    };

    const loadJWPlayerScript = () => {
      return new Promise<void>((resolve, reject) => {
        if (window.jwplayer) {
          resolve();
          return;
        }

        const existingScript = document.querySelector('script[src*="jwplayer.com/libraries"]');
        if (existingScript) {
          existingScript.addEventListener('load', () => resolve());
          existingScript.addEventListener('error', () => reject(new Error('Failed to load JW Player')));
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdn.jwplayer.com/libraries/xQR17M0d.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load JW Player'));
        document.head.appendChild(script);
      });
    };

    const tryInit = async () => {
      if (window.jwplayer) {
        initPlayer();
      } else {
        try {
          await loadJWPlayerScript();
          checkInterval = setInterval(() => {
            if (window.jwplayer) {
              clearInterval(checkInterval);
              initPlayer();
            }
          }, 100);
          
          loadTimeout = setTimeout(() => {
            if (checkInterval) clearInterval(checkInterval);
            if (!window.jwplayer) {
              setPlayerError("JW Player library failed to load. Please refresh the page.");
            }
          }, 10000);
        } catch (err) {
          setPlayerError("Failed to load video player. Please refresh the page.");
        }
      }
    };

    tryInit();

    cleanup = () => {
      if (checkInterval) clearInterval(checkInterval);
      if (loadTimeout) clearTimeout(loadTimeout);
      if (playerInstanceRef.current) {
        try {
          playerInstanceRef.current.remove();
          playerInstanceRef.current = null;
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };

    return () => {
      if (cleanup) cleanup();
    };
  }, [mediaId]);

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
        <div className="w-full max-w-screen-2xl aspect-video relative">
          {(isLoading || !playerReady) && !playerError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
              <div className="text-xl text-gray-400">Loading player...</div>
            </div>
          )}
          {playerError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10">
              <div className="text-xl text-red-400 mb-4">{playerError}</div>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-white text-black rounded font-medium hover:bg-gray-200 transition"
              >
                Retry
              </button>
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
