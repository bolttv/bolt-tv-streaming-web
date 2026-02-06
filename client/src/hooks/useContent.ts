/**
 * Content Hooks — React Query wrappers for JW Player CDN calls
 *
 * Replaces:
 *   GET /api/content/hero      → useHeroItems()
 *   GET /api/content/rows      → useContentRows()
 *   GET /api/content/:id       → useContent(id)
 *   GET /api/series/:id/episodes → useSeriesEpisodes(id)
 *   GET /api/sports            → useSportCategories()
 *   GET /api/sports/:id/content → useSportContent(id)
 *   GET /api/search?q=         → useSearch(query)
 *   GET /api/recommendations   → useRecommendations()
 */

import { useQuery } from "@tanstack/react-query";
import {
  fetchHeroItems,
  fetchContentRows,
  fetchContentById,
  fetchSportContent,
  fetchEpisodes,
  getSportCategories,
  searchContent,
  type HeroItem,
  type RowItem,
  type ContentRow,
  type SportCategory,
  type EpisodeItem,
} from "@/lib/jwplayer";

/** 5-minute stale time — matches old server-side cache TTL */
const CONTENT_STALE_TIME = 5 * 60 * 1000;

// ─── Hero Items ──────────────────────────────────────────────────────────────

export function useHeroItems() {
  return useQuery<HeroItem[]>({
    queryKey: ["jwp", "hero"],
    queryFn: fetchHeroItems,
    staleTime: CONTENT_STALE_TIME,
  });
}

// ─── Content Rows ────────────────────────────────────────────────────────────

export function useContentRows() {
  return useQuery<ContentRow[]>({
    queryKey: ["jwp", "rows"],
    queryFn: fetchContentRows,
    staleTime: CONTENT_STALE_TIME,
  });
}

// ─── Single Content Item ─────────────────────────────────────────────────────

export function useContent(id: string | undefined) {
  return useQuery({
    queryKey: ["jwp", "content", id],
    queryFn: () => fetchContentById(id!),
    enabled: !!id,
    staleTime: CONTENT_STALE_TIME,
  });
}

// ─── Series Episodes ─────────────────────────────────────────────────────────

export function useSeriesEpisodes(seriesId: string | undefined, enabled: boolean = true) {
  return useQuery<EpisodeItem[]>({
    queryKey: ["jwp", "episodes", seriesId],
    queryFn: () => fetchEpisodes(seriesId!),
    enabled: !!seriesId && enabled,
    staleTime: CONTENT_STALE_TIME,
  });
}

// ─── Sport Categories (static) ───────────────────────────────────────────────

export function useSportCategories() {
  return useQuery<SportCategory[]>({
    queryKey: ["jwp", "sports"],
    queryFn: () => getSportCategories(),
    staleTime: Infinity, // static data
  });
}

// ─── Sport Content ───────────────────────────────────────────────────────────

export function useSportContent(playlistId: string | undefined) {
  return useQuery<RowItem[]>({
    queryKey: ["jwp", "sport", playlistId],
    queryFn: () => fetchSportContent(playlistId!),
    enabled: !!playlistId,
    staleTime: CONTENT_STALE_TIME,
  });
}

// ─── Search ──────────────────────────────────────────────────────────────────

export function useSearch(query: string) {
  // Search needs all content rows to filter against
  const { data: allRows = [] } = useContentRows();

  return useQuery<RowItem[]>({
    queryKey: ["jwp", "search", query],
    queryFn: () => searchContent(query, allRows),
    enabled: !!query && query.length >= 2 && allRows.length > 0,
    staleTime: 60_000, // 1 minute for search results
  });
}

// ─── Personalized Recommendations ────────────────────────────────────────────

/**
 * Recommendations are derived from watch history categories.
 * For now, we pull from the "Recommended" row — same as the server did.
 * When watch history exists, we can refine this with category-based filtering.
 */
export function useRecommendations(hasContinueWatching: boolean) {
  const { data: rows = [] } = useContentRows();

  return useQuery<RowItem[]>({
    queryKey: ["jwp", "recommendations"],
    queryFn: () => {
      // Find the "Recommended For You" row
      const recRow = rows.find(r => r.title === "Recommended For You");
      return recRow?.items || [];
    },
    enabled: hasContinueWatching && rows.length > 0,
    staleTime: CONTENT_STALE_TIME,
  });
}

