import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import { getUserIdFromToken } from "@/lib/supabase-server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const userId = await getUserIdFromToken(request.headers.get("authorization") || undefined);
    const items = await storage.getContinueWatching(sessionId, userId || undefined);
    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching continue watching:", error);
    return NextResponse.json({ error: "Failed to fetch continue watching" }, { status: 500 });
  }
}
