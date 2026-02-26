import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import { getUserIdFromToken } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, mediaId, title, posterImage, duration, watchedSeconds, category } = body;
    const userId = await getUserIdFromToken(request.headers.get("authorization") || undefined);

    if (!sessionId || !mediaId || !title || duration === undefined || watchedSeconds === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const validDuration = Math.max(0, Number(duration) || 0);
    const validWatchedSeconds = Math.max(0, Math.min(Number(watchedSeconds) || 0, validDuration));

    if (validDuration === 0) {
      return NextResponse.json({ error: "Invalid duration" }, { status: 400 });
    }

    const result = await storage.updateWatchProgress(
      sessionId,
      mediaId,
      title,
      posterImage || "",
      validDuration,
      validWatchedSeconds,
      category,
      userId || undefined
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating watch progress:", error);
    return NextResponse.json({ error: "Failed to update watch progress" }, { status: 500 });
  }
}
