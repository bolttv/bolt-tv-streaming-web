import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ seriesId: string }> }
) {
  try {
    const { seriesId } = await params;
    const episodes = await storage.getSeriesEpisodes(seriesId);
    return NextResponse.json(episodes);
  } catch (error) {
    console.error("Error fetching series episodes:", error);
    return NextResponse.json({ error: "Failed to fetch episodes" }, { status: 500 });
  }
}
