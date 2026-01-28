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

const JW_PLAYER_LIBRARY_URL = "https://cdn.jwplayer.com/libraries/xQR17M0d.js";

export default function Watch() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const playerInstanceRef = useRef<any>(null);

  const { data: content, isLoading } = useQuery<Content>({
    queryKey: [`/api/content/${id}`],
    enabled: !!id,
  });

  const mediaId = content?.mediaId || id;

  useEffect(() => {
    const checkAndLoadScript = () => {
      if (window.jwplayer) {
        setScriptLoaded(true);
        return;
      }

      const existingScript = document.querySelector(`script[src="${JW_PLAYER_LIBRARY_URL}"]`);
      
      if (existingScript) {
        const checkLoaded = setInterval(() => {
          if (window.jwplayer) {
            clearInterval(checkLoaded);
            setScriptLoaded(true);
          }
        }, 50);
        
        setTimeout(() => clearInterval(checkLoaded), 10000);
        return;
      }

      const script = document.createElement("script");
      script.src = JW_PLAYER_LIBRARY_URL;
      script.async = true;
      
      script.onload = () => {
        const checkLoaded = setInterval(() => {
          if (window.jwplayer) {
            clearInterval(checkLoaded);
            setScriptLoaded(true);
          }
        }, 50);
        
        setTimeout(() => {
          clearInterval(checkLoaded);
          if (!window.jwplayer) {
            setPlayerError("Failed to initialize JW Player.");
          }
        }, 5000);
      };
      
      script.onerror = () => {
        setPlayerError("Failed to load video player library.");
      };
      
      document.head.appendChild(script);
    };

    checkAndLoadScript();
  }, []);

  useEffect(() => {
    if (!scriptLoaded || !mediaId || !playerContainerRef.current) return;

    const initPlayer = () => {
      try {
        if (playerInstanceRef.current) {
          try {
            playerInstanceRef.current.remove();
          } catch (e) {
            // Ignore
          }
          playerInstanceRef.current = null;
        }

        const container = playerContainerRef.current;
        if (!container) return;

        container.id = `jwplayer-${Date.now()}`;

        const player = window.jwplayer(container);
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
          setPlayerError("Unable to play this video.");
        });

        player.on("setupError", (e: any) => {
          console.error("JW Player setup error:", e);
          setPlayerError("Video player setup failed.");
        });

        setTimeout(() => {
          if (!playerReady && player.getState && player.getState() !== "idle") {
            setPlayerReady(true);
          }
        }, 2000);

      } catch (err) {
        console.error("Player init error:", err);
        setPlayerError("Failed to initialize video player.");
      }
    };

    initPlayer();

    return () => {
      if (playerInstanceRef.current) {
        try {
          playerInstanceRef.current.remove();
        } catch (e) {
          // Ignore cleanup errors
        }
        playerInstanceRef.current = null;
      }
    };
  }, [scriptLoaded, mediaId]);

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
            <div className="absolute inset-0 flex items-center justify-center bg-black z-10 pointer-events-none">
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
            ref={playerContainerRef}
            className="w-full h-full"
            data-testid="video-player"
          />
        </div>
      </div>
    </div>
  );
}
