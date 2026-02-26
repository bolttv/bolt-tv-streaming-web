import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

export async function GET() {
  try {
    const categories = await storage.getSportCategories();
    return NextResponse.json(categories, {
      headers: { "Cache-Control": "public, max-age=300" },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch sport categories" }, { status: 500 });
  }
}
