/**
 * Watch Progress Hooks — Supabase direct calls
 *
 * Replaces:
 *   POST /api/watch-progress                → useSaveProgress()
 *   GET  /api/continue-watching/:sessionId   → useContinueWatching()
 *   GET  /api/recommendations/:sessionId     → (handled by useRecommendations in useContent.ts)
 *
 * Uses Supabase RLS with auth.uid() instead of anonymous sessionId.
 * For unauthenticated users, returns empty data.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ContinueWatchingItem {
  id: string;
  mediaId: string;
  title: string;
  posterImage: string;
  horizontalPosterLogo: string;
  duration: number;
  watchedSeconds: number;
  progress: number;
  lastWatchedAt: Date;
}

interface SaveProgressInput {
  mediaId: string;
  title: string;
  posterImage: string;
  duration: number;
  watchedSeconds: number;
  category?: string;
}

// ─── Continue Watching ───────────────────────────────────────────────────────

export function useContinueWatching() {
  const { user, isAuthenticated } = useAuth();

  return useQuery<ContinueWatchingItem[]>({
    queryKey: ["watch-progress", "continue", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("watch_history")
        .select("*")
        .eq("user_id", user.id)
        .order("last_watched_at", { ascending: false })
        .limit(20);

      if (error) {
        console.error("Error fetching continue watching:", error);
        return [];
      }

      // Filter out completed items (>95% watched) and map to expected shape
      return (data || [])
        .filter((row) => {
          if (!row.duration || row.duration === 0) return false;
          const progress = row.watched_seconds / row.duration;
          return progress < 0.95 && progress > 0.02; // Between 2% and 95%
        })
        .map((row) => ({
          id: row.id,
          mediaId: row.media_id,
          title: row.title,
          posterImage: row.poster_image || "",
          horizontalPosterLogo: row.poster_image || "", // Same image as fallback
          duration: row.duration,
          watchedSeconds: row.watched_seconds,
          progress: Math.round((row.watched_seconds / row.duration) * 100),
          lastWatchedAt: new Date(row.last_watched_at),
        }));
    },
    enabled: isAuthenticated && !!user,
    refetchOnWindowFocus: true,
    staleTime: 30_000, // 30 seconds
  });
}

// ─── Save Progress Mutation ──────────────────────────────────────────────────

export function useSaveProgress() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SaveProgressInput) => {
      if (!user) return null;

      const { error } = await supabase.from("watch_history").upsert(
        {
          user_id: user.id,
          media_id: input.mediaId,
          title: input.title,
          poster_image: input.posterImage,
          duration: Math.round(input.duration),
          watched_seconds: Math.round(input.watchedSeconds),
          category: input.category || null,
          last_watched_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,media_id",
        }
      );

      if (error) {
        console.error("Error saving watch progress:", error);
        throw error;
      }
    },
    // Don't invalidate on every save (happens every 5 seconds during playback)
    // We invalidate on unmount in Watch.tsx instead
  });
}

// ─── Delete Progress ─────────────────────────────────────────────────────────

export function useDeleteProgress() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mediaId: string) => {
      if (!user) return;

      const { error } = await supabase
        .from("watch_history")
        .delete()
        .eq("user_id", user.id)
        .eq("media_id", mediaId);

      if (error) {
        console.error("Error deleting watch progress:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["watch-progress", "continue", user?.id],
      });
    },
  });
}

// ─── Invalidation Helper ─────────────────────────────────────────────────────

/** Call this when leaving the Watch page to refresh continue watching */
export function useInvalidateContinueWatching() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return () => {
    if (user) {
      queryClient.invalidateQueries({
        queryKey: ["watch-progress", "continue", user.id],
      });
    }
  };
}

