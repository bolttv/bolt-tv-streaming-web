import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const content = await storage.getContentById(id);

    if (!content) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    const category = storage.getCategoryForMedia(id);
    return NextResponse.json({ ...content, category });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch content" }, { status: 500 });
  }
}
