// client/src/lib/watchHistory.ts

import { supabase } from "./supabase";

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

/**
 * Upsert watch progress to Supabase.
 * Replaces: POST /api/watch-progress
 */
export async function updateWatchProgress(
  sessionId: string,
  mediaId: string,
  title: string,
  posterImage: string,
  duration: number,
  watchedSeconds: number,
  category?: string,
): Promise<void> {
  const progress = duration > 0 ? Math.min(watchedSeconds / duration, 1) : 0;

  const { error } = await supabase.from("watch_history").upsert(
    {
      session_id: sessionId,
      media_id: mediaId,
      title,
      poster_image: posterImage,
      duration,
      watched_seconds: watchedSeconds,
      progress,
      category: category || null,
      last_watched_at: new Date().toISOString(),
    },
    {
      onConflict: "session_id,media_id",
    },
  );

  if (error) {
    console.error("Failed to update watch progress:", error);
  }
}

/**
 * Get continue watching list from Supabase.
 * Replaces: GET /api/continue-watching/:sessionId
 */
export async function getContinueWatching(
  sessionId: string,
): Promise<ContinueWatchingItem[]> {
  const { data, error } = await supabase
    .from("watch_history")
    .select("*")
    .eq("session_id", sessionId)
    .gt("progress", 0.01)
    .lt("progress", 0.95)
    .order("last_watched_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Failed to fetch continue watching:", error);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    mediaId: row.media_id,
    title: row.title,
    posterImage: row.poster_image,
    horizontalPosterLogo: `https://cdn.jwplayer.com/v2/media/${row.media_id}/images/Horizontal-Poster-Logo.jpg`,
    duration: row.duration,
    watchedSeconds: row.watched_seconds,
    progress: row.progress,
    lastWatchedAt: new Date(row.last_watched_at),
  }));
}

/**
 * Remove item from continue watching.
 * Replaces: DELETE /api/continue-watching/:sessionId/:mediaId
 */
export async function removeFromContinueWatching(
  sessionId: string,
  mediaId: string,
): Promise<void> {
  const { error } = await supabase
    .from("watch_history")
    .delete()
    .eq("session_id", sessionId)
    .eq("media_id", mediaId);

  if (error) {
    console.error("Failed to remove from continue watching:", error);
  }
}

/**
 * Get watch history for a specific series to determine next episode.
 * Used by useNextEpisode hook.
 */
export async function getSeriesWatchHistory(
  sessionId: string,
  mediaIds: string[],
): Promise<Map<string, number>> {
  if (mediaIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from("watch_history")
    .select("media_id, progress")
    .eq("session_id", sessionId)
    .in("media_id", mediaIds);

  if (error) {
    console.error("Failed to fetch series watch history:", error);
    return new Map();
  }

  const progressMap = new Map<string, number>();
  (data || []).forEach((row: any) => {
    progressMap.set(row.media_id, row.progress);
  });
  return progressMap;
}
