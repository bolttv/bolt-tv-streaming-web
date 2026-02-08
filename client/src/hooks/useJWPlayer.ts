// client/src/hooks/useJWPlayer.ts

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchPlaylist,
  fetchMedia,
  fetchSeriesEpisodes,
  fetchSeriesInfo,
  convertToHeroItem,
  convertToRowItem,
  convertToEpisodeItem,
  searchContent,
  PLAYLISTS,
  SPORT_CATEGORIES,
  type HeroItem,
  type RowItem,
  type ContentRow,
  type SportCategory,
  type EpisodeItem,
} from "../lib/jwplayer";
import { getContinueWatching, getSeriesWatchHistory } from "../lib/watchHistory";

// ============================================================
// Hero Content Hook
// Replaces: GET /api/content/hero
// ============================================================
export function useHeroContent() {
  return useQuery<HeroItem[]>({
    queryKey: ["hero-content"],
    queryFn: async () => {
      const playlist = await fetchPlaylist(PLAYLISTS.heroBanner);
      return playlist.map(convertToHeroItem);
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================================
// Content Rows Hook
// Replaces: GET /api/content/rows
// ============================================================
export function useContentRows() {
  return useQuery<ContentRow[]>({
    queryKey: ["content-rows"],
    queryFn: async () => {
      const [featured, recommended, popular, newMovies, documentaries] = await Promise.all([
        fetchPlaylist(PLAYLISTS.featured),
        fetchPlaylist(PLAYLISTS.recommended),
        fetchPlaylist(PLAYLISTS.popular),
        fetchPlaylist(PLAYLISTS.newMovies),
        fetchPlaylist(PLAYLISTS.documentaries),
      ]);

      return [
        { id: "featured", title: "Featured", items: featured.map(convertToRowItem) },
        { id: "recommended", title: "Recommended", items: recommended.map(convertToRowItem) },
        { id: "popular", title: "Popular Now", items: popular.map(convertToRowItem) },
        { id: "newMovies", title: "New Releases", items: newMovies.map(convertToRowItem) },
        { id: "documentaries", title: "Documentaries", items: documentaries.map(convertToRowItem) },
      ];
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================================
// Single Content by ID Hook
// Replaces: GET /api/content/:id
// ============================================================
export function useContentById(id: string | undefined) {
  return useQuery({
    queryKey: ["content", id],
    queryFn: async () => {
      if (!id) return null;
      const media = await fetchMedia(id);
      if (!media) return null;
      return convertToRowItem(media);
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================================
// Sport Categories (static data, enriched with thumbnails)
// Replaces: GET /api/sports
// ============================================================
export function useSportCategories() {
  return useQuery<SportCategory[]>({
    queryKey: ["sport-categories"],
    queryFn: async () => {
      const categories = await Promise.all(
        SPORT_CATEGORIES.map(async (cat) => {
          const playlist = await fetchPlaylist(cat.playlistId);
          const firstItem = playlist[0];
          return {
            ...cat,
            thumbnailImage: firstItem
              ? firstItem.image || `https://cdn.jwplayer.com/v2/media/${firstItem.mediaid}/poster.jpg?width=640`
              : "",
          };
        })
      );
      return categories;
    },
    staleTime: 10 * 60 * 1000,
  });
}

// ============================================================
// Sport Content Hook
// Replaces: GET /api/sports/:playlistId/content
// ============================================================
export function useSportContent(playlistId: string | undefined) {
  return useQuery<RowItem[]>({
    queryKey: ["sport-content", playlistId],
    queryFn: async () => {
      if (!playlistId) return [];
      const playlist = await fetchPlaylist(playlistId);
      return playlist.map(convertToRowItem);
    },
    enabled: !!playlistId,
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================================
// Series Episodes Hook
// Replaces: GET /api/series/:seriesId/episodes
// ============================================================
export function useSeriesEpisodes(seriesId: string | undefined) {
  return useQuery<EpisodeItem[]>({
    queryKey: ["series-episodes", seriesId],
    queryFn: async () => {
      if (!seriesId) return [];

      // Try Series API first
      const episodes = await fetchSeriesEpisodes(seriesId, 1);
      if (episodes.length > 0) {
        return episodes.map(ep => convertToEpisodeItem(ep, 1));
      }

      // Fallback: treat seriesId as playlistId
      const playlist = await fetchPlaylist(seriesId);
      return playlist.map((item, index) => ({
        id: item.mediaid,
        title: item.title,
        description: item.description || "",
        duration: item.duration,
        image: item.image || `https://cdn.jwplayer.com/v2/media/${item.mediaid}/poster.jpg?width=640`,
        episodeNumber: index + 1,
        seasonNumber: 1,
        mediaId: item.mediaid,
      }));
    },
    enabled: !!seriesId,
    staleTime: 10 * 60 * 1000,
  });
}

// ============================================================
// Next Episode Hook
// Replaces: GET /api/series/:seriesId/next-episode
// ============================================================
export function useNextEpisode(seriesId: string | undefined, sessionId: string | undefined) {
  return useQuery({
    queryKey: ["next-episode", seriesId, sessionId],
    queryFn: async () => {
      if (!seriesId || !sessionId) return null;

      const episodes = await fetchSeriesEpisodes(seriesId, 1);
      if (episodes.length === 0) return null;

      const mediaIds = episodes.map(ep => ep.media_item.mediaid);
      const progressMap = await getSeriesWatchHistory(sessionId, mediaIds);

      for (const episode of episodes) {
        const progress = progressMap.get(episode.media_item.mediaid) || 0;
        if (progress < 0.95) {
          return {
            seasonNumber: 1,
            episodeNumber: episode.episode_number,
            mediaId: episode.media_item.mediaid,
          };
        }
      }

      return {
        seasonNumber: 1,
        episodeNumber: episodes[0].episode_number,
        mediaId: episodes[0].media_item.mediaid,
      };
    },
    enabled: !!seriesId && !!sessionId,
    staleTime: 60 * 1000,
  });
}

// ============================================================
// Search Hook
// Replaces: GET /api/search?q=query
// ============================================================
export function useSearch(query: string) {
  const queryClient = useQueryClient();

  return useQuery<RowItem[]>({
    queryKey: ["search", query],
    queryFn: async () => {
      if (!query || query.trim().length === 0) return [];

      const rows = queryClient.getQueryData<ContentRow[]>(["content-rows"]);

      let allItems: RowItem[];
      if (rows) {
        allItems = rows.flatMap(row => row.items);
      } else {
        const [featured, recommended, popular, newMovies, documentaries] = await Promise.all([
          fetchPlaylist(PLAYLISTS.featured),
          fetchPlaylist(PLAYLISTS.recommended),
          fetchPlaylist(PLAYLISTS.popular),
          fetchPlaylist(PLAYLISTS.newMovies),
          fetchPlaylist(PLAYLISTS.documentaries),
        ]);
        allItems = [...featured, ...recommended, ...popular, ...newMovies, ...documentaries]
          .map(convertToRowItem);
      }

      const seen = new Set<string>();
      const unique = allItems.filter(item => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });

      return searchContent(unique, query);
    },
    enabled: query.trim().length > 0,
    staleTime: 30 * 1000,
  });
}

// ============================================================
// Continue Watching Hook
// Replaces: GET /api/continue-watching/:sessionId
// ============================================================
export function useContinueWatching(sessionId: string | undefined) {
  return useQuery({
    queryKey: ["continue-watching", sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      return getContinueWatching(sessionId);
    },
    enabled: !!sessionId,
    staleTime: 30 * 1000,
  });
}

// ============================================================
// Recommendations Hook
// Replaces: GET /api/recommendations/:sessionId
// ============================================================
export function useRecommendations(sessionId: string | undefined) {
  return useQuery<RowItem[]>({
    queryKey: ["recommendations", sessionId],
    queryFn: async () => {
      const playlist = await fetchPlaylist(PLAYLISTS.recommended);
      return playlist.map(convertToRowItem);
    },
    enabled: !!sessionId,
    staleTime: 5 * 60 * 1000,
  });
}