"use client";

import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useRef, useState, useCallback } from "react";
import { ArrowLeft, X } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSessionId, getAuthHeaders } from "@/lib/session";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useAuth } from "@/lib/auth-context";

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
  contentType?: string;
}

interface NextEpisode {
  seasonNumber: number;
  episodeNumber: number;
  mediaId: string;
}

const DEFAULT_PLAYER_LIBRARY_URL = "https://cdn.jwplayer.com/libraries/xQRl7M0d.js";

export default function Watch() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { hasActiveSubscription, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const playerInstanceRef = useRef<any>(null);
  const lastProgressUpdateRef = useRef<number>(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const playerLibraryUrlRef = useRef<string>(DEFAULT_PLAYER_LIBRARY_URL);

  useEffect(() => {
    if (!authLoading && !hasActiveSubscription) {
      router.push("/subscribe");
    }
  }, [authLoading, hasActiveSubscription, router]);

  const { data: content, isLoading, error: contentError } = useQuery<Content>({
    queryKey: [`/api/content/${id}`],
    enabled: !!id,
    retry: false,
  });

  const isSeries = content?.contentType === "Series";
  const contentLoaded = !isLoading && !!content;
  const contentMissing = !isLoading && !content;
  const mightBeSeries = isSeries || contentMissing;
  const sessionId = getSessionId();

  const { data: nextEpisode, isLoading: episodeLoading, isFetched: episodeFetched } = useQuery<NextEpisode | null>({
    queryKey: [`/api/series/${id}/next-episode`, sessionId],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/series/${id}/next-episode`, { headers });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!id && !isLoading && mightBeSeries,
    retry: false,
  });

  const resolvedMediaId = (() => {
    if (isSeries) return nextEpisode?.mediaId || undefined;
    if (contentMissing && nextEpisode?.mediaId) return nextEpisode.mediaId;
    return content?.mediaId || (content ? id : undefined);
  })();
  
  const mediaId = resolvedMediaId;
  const isResolvingMedia = isLoading || (mightBeSeries && episodeLoading);
  
  const seriesWithNoEpisode = isSeries && episodeFetched && !nextEpisode;
  const contentWithNoMedia = contentLoaded && !isSeries && !content?.mediaId;
  const contentNotFound = seriesWithNoEpisode || contentWithNoMedia || (!isLoading && !content && (!mightBeSeries || (episodeFetched && !nextEpisode)));

  const saveProgress = useCallback(async (watchedSeconds: number, duration: number) => {
    if (!mediaId || duration === 0) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get("category") || content?.category;
    
    try {
      const sid = getSessionId();
      const authHeaders = await getAuthHeaders();
      await fetch("/api/watch-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          sessionId: sid,
          mediaId,
          title: content?.title || "",
          posterImage: content?.posterImage || "",
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
    const loadPlayer = async () => {
      if (window.jwplayer) {
        setScriptLoaded(true);
        return;
      }

      try {
        const configRes = await fetch("/api/player-config");
        if (configRes.ok) {
          const config = await configRes.json();
          if (config.libraryUrl) {
            playerLibraryUrlRef.current = config.libraryUrl;
          }
        }
      } catch {
      }

      const libraryUrl = playerLibraryUrlRef.current;

      if (window.jwplayer) {
        setScriptLoaded(true);
        return;
      }

      const loadScript = (url: string) => {
        const script = document.createElement("script");
        script.src = url;
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

      const existingScript = document.querySelector(`script[src*="cdn.jwplayer.com/libraries"]`) as HTMLScriptElement | null;
      
      if (existingScript) {
        const existingSrc = existingScript.getAttribute("src") || "";
        if (existingSrc !== libraryUrl) {
          existingScript.remove();
          loadScript(libraryUrl);
        } else {
          const checkLoaded = setInterval(() => {
            if (window.jwplayer) {
              clearInterval(checkLoaded);
              setScriptLoaded(true);
            }
          }, 50);
          
          setTimeout(() => {
            clearInterval(checkLoaded);
            if (!window.jwplayer) {
              existingScript.remove();
              loadScript(libraryUrl);
            }
          }, 3000);
        }
        return;
      }

      loadScript(libraryUrl);
    };

    loadPlayer();
  }, []);

  useEffect(() => {
    if (!scriptLoaded || !mediaId || !playerContainerRef.current || contentNotFound) return;

    const initPlayer = () => {
      try {
        if (playerInstanceRef.current) {
          try {
            playerInstanceRef.current.remove();
          } catch (e) {
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
          autostart: true,
          mute: false,
          controls: true,
          stretching: "uniform",
          playsinline: true,
        });

        player.on("ready", () => {
          player.resize(window.innerWidth, window.innerHeight);
          
          setTimeout(() => {
            player.resize(window.innerWidth, window.innerHeight);
          }, 100);

          const handleResize = () => {
            if (playerInstanceRef.current) {
              playerInstanceRef.current.resize(window.innerWidth, window.innerHeight);
            }
          };
          window.addEventListener("resize", handleResize);
          player.on("remove", () => {
            window.removeEventListener("resize", handleResize);
          });

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
        }
        playerInstanceRef.current = null;
      }
      queryClient.invalidateQueries({ queryKey: ["/api/continue-watching", getSessionId()] });
    };
  }, [scriptLoaded, mediaId, saveProgress, queryClient, contentNotFound]);

  if (authLoading || !hasActiveSubscription) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      router.push("/home");
    }
  };

  return (
    <div className="watch-player-wrapper">
      <button
        onClick={handleBack}
        className="fixed top-4 left-4 z-50 flex items-center gap-2 text-white hover:text-gray-300 transition bg-black/50 px-3 py-2 rounded-full"
        data-testid="button-back"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      {contentNotFound && (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-black z-10">
          <div className="text-xl text-red-400 mb-4">Content not found</div>
          <p className="text-gray-400 mb-4">This video is no longer available.</p>
          <Link href="/home">
            <button className="px-4 py-2 bg-white text-black rounded font-medium hover:bg-gray-200 transition">
              Go Home
            </button>
          </Link>
        </div>
      )}
      {!contentNotFound && (isResolvingMedia || !playerReady) && !playerError && (
        <div className="fixed inset-0 flex items-center justify-center bg-black z-10 pointer-events-none">
          <LoadingSpinner size="lg" />
        </div>
      )}
      {!contentNotFound && playerError && (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-black z-10">
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
        className="jw-player-container"
        data-testid="video-player"
      />
    </div>
  );
}
