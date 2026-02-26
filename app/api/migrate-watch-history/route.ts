import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import { getUserIdFromToken } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromToken(request.headers.get("authorization") || undefined);
    const body = await request.json();
    const { sessionId } = body;

    if (!userId || !sessionId) {
      return NextResponse.json({ error: "Missing auth or session" }, { status: 400 });
    }

    await storage.migrateSessionToUser(sessionId, userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error migrating watch history:", error);
    return NextResponse.json({ error: "Failed to migrate watch history" }, { status: 500 });
  }
}
