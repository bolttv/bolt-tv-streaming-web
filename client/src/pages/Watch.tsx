import { useParams, Link, useLocation } from "wouter";
import { useEffect, useRef, useState, useCallback } from "react";
import { ArrowLeft, X } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSessionId } from "@/lib/session";
import LoadingSpinner from "@/components/LoadingSpinner";

declare global {
  interface Window {
    jwplayer: any;
  }
}

interface Content {
  id: string;
  title: string;
  mediaId?: string;
  posterImage?: string;
  duration?: number;
  description?: string;
  category?: string;
}

const JW_PLAYER_LIBRARY_URL = "https://cdn.jwplayer.com/libraries/EBg26wOK.js";

export default function Watch() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const playerInstanceRef = useRef<any>(null);
  const lastProgressUpdateRef = useRef<number>(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { data: content, isLoading, error: contentError } = useQuery<Content>({
    queryKey: [`/api/content/${id}`],
    enabled: !!id,
    retry: false,
  });

  // Only use mediaId if we have content, otherwise we'll show content not found
  const mediaId = content?.mediaId || (content ? id : undefined);
  
  // Handle content not found
  const contentNotFound = !isLoading && !content && id;

  const saveProgress = useCallback(async (watchedSeconds: number, duration: number) => {
    if (!content || !mediaId || duration === 0) return;
    
    // Get category from URL search params (when coming from sport page) or from content
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get("category") || content.category;
    
    try {
      const sessionId = getSessionId();
      await fetch("/api/watch-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          mediaId,
          title: content.title,
          posterImage: content.posterImage || "",
          duration: Math.round(duration),
          watchedSeconds: Math.round(watchedSeconds),
          category,
        }),
      });
    } catch (err) {
      console.error("Failed to save watch progress:", err);
    }
  }, [content, mediaId]);

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
    if (!scriptLoaded || !mediaId || !playerContainerRef.current || contentNotFound) return;

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

        player.on("play", () => {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
          }
          progressIntervalRef.current = setInterval(() => {
            if (playerInstanceRef.current) {
              const position = playerInstanceRef.current.getPosition() || 0;
              const duration = playerInstanceRef.current.getDuration() || 0;
              
              if (position - lastProgressUpdateRef.current >= 5) {
                lastProgressUpdateRef.current = position;
                saveProgress(position, duration);
              }
            }
          }, 5000);
        });

        player.on("pause", () => {
          if (playerInstanceRef.current) {
            const position = playerInstanceRef.current.getPosition() || 0;
            const duration = playerInstanceRef.current.getDuration() || 0;
            saveProgress(position, duration);
          }
        });

        player.on("complete", () => {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
          }
          if (playerInstanceRef.current) {
            const duration = playerInstanceRef.current.getDuration() || 0;
            saveProgress(duration, duration);
          }
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
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (playerInstanceRef.current) {
        const position = playerInstanceRef.current.getPosition?.() || 0;
        const duration = playerInstanceRef.current.getDuration?.() || 0;
        if (position > 0 && duration > 0) {
          saveProgress(position, duration);
        }
        try {
          playerInstanceRef.current.remove();
        } catch (e) {
          // Ignore cleanup errors
        }
        playerInstanceRef.current = null;
      }
      queryClient.invalidateQueries({ queryKey: ["/api/continue-watching", getSessionId()] });
    };
  }, [scriptLoaded, mediaId, saveProgress, queryClient, contentNotFound]);

  const handleBack = () => {
    // Go back to the previous page in history, or home if no history
    if (window.history.length > 1) {
      window.history.back();
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
          {contentNotFound && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10">
              <div className="text-xl text-red-400 mb-4">Content not found</div>
              <p className="text-gray-400 mb-4">This video is no longer available.</p>
              <Link href="/">
                <button className="px-4 py-2 bg-white text-black rounded font-medium hover:bg-gray-200 transition">
                  Go Home
                </button>
              </Link>
            </div>
          )}
          {!contentNotFound && (isLoading || !playerReady) && !playerError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black z-10 pointer-events-none">
              <LoadingSpinner size="lg" />
            </div>
          )}
          {!contentNotFound && playerError && (
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
