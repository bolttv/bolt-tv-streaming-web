import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get("q");
    if (!query || query.trim().length === 0) {
      return NextResponse.json([]);
    }
    const results = await storage.searchContent(query.trim());
    return NextResponse.json(results);
  } catch (error) {
    console.error("Error searching content:", error);
    return NextResponse.json({ error: "Failed to search content" }, { status: 500 });
  }
}
