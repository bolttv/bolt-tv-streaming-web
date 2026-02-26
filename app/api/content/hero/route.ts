import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import { getUserIdFromToken } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.headers.get("x-session-id") || "";
    const userId = await getUserIdFromToken(request.headers.get("authorization") || undefined);
    const heroItems = await storage.getHeroItems();

    const heroItemsWithNextEpisode = await Promise.all(
      heroItems.map(async (item) => {
        if (item.contentType === "Series") {
          try {
            const nextEpisode = (sessionId || userId)
              ? await storage.getNextEpisodeToWatch(sessionId || "", item.id, userId || undefined)
              : await storage.getFirstEpisode(item.id);
            return { ...item, nextEpisode };
          } catch {
            return item;
          }
        }
        return item;
      })
    );

    return NextResponse.json(heroItemsWithNextEpisode, {
      headers: { "Cache-Control": "private, max-age=30" },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch hero items" }, { status: 500 });
  }
}
