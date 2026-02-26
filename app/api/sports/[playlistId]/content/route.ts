import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ playlistId: string }> }
) {
  try {
    const { playlistId } = await params;
    const content = await storage.getSportContent(playlistId);
    return NextResponse.json(content);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch sport content" }, { status: 500 });
  }
}
