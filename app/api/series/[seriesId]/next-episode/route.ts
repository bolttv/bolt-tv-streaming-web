import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import { getUserIdFromToken } from "@/lib/supabase-server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ seriesId: string }> }
) {
  try {
    const { seriesId } = await params;
    const sessionId = request.headers.get("x-session-id") || "";
    const userId = await getUserIdFromToken(request.headers.get("authorization") || undefined);

    if (!sessionId && !userId) {
      const episodes = await storage.getSeriesEpisodes(seriesId);
      if (episodes.length > 0) {
        const firstEpisode = episodes.sort((a, b) => {
          const seasonDiff = (a.seasonNumber || 1) - (b.seasonNumber || 1);
          if (seasonDiff !== 0) return seasonDiff;
          return (a.episodeNumber || 1) - (b.episodeNumber || 1);
        })[0];
        return NextResponse.json({
          seasonNumber: firstEpisode.seasonNumber || 1,
          episodeNumber: firstEpisode.episodeNumber || 1,
          mediaId: firstEpisode.mediaId,
        });
      }
      return NextResponse.json(null);
    }

    const nextEpisode = await storage.getNextEpisodeToWatch(sessionId || "", seriesId, userId || undefined);
    return NextResponse.json(nextEpisode);
  } catch (error) {
    console.error("Error fetching next episode:", error);
    return NextResponse.json({ error: "Failed to fetch next episode" }, { status: 500 });
  }
}
