import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import { getUserIdFromToken } from "@/lib/supabase-server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string; mediaId: string }> }
) {
  try {
    const { sessionId, mediaId } = await params;
    const userId = await getUserIdFromToken(request.headers.get("authorization") || undefined);
    await storage.removeFromContinueWatching(sessionId, mediaId, userId || undefined);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing from continue watching:", error);
    return NextResponse.json({ error: "Failed to remove from continue watching" }, { status: 500 });
  }
}
