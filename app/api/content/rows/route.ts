import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

export async function GET() {
  try {
    const rows = await storage.getContentRows();
    return NextResponse.json(rows, {
      headers: { "Cache-Control": "public, max-age=60" },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch content rows" }, { status: 500 });
  }
}
