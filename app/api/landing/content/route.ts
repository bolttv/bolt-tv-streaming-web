import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

export async function GET() {
  try {
    const rows = await storage.getContentRows();
    const heroItems = await storage.getHeroItems();
    const limitedRows = rows.map(row => ({
      id: row.id,
      title: row.title,
      items: row.items.slice(0, 8).map(item => ({
        id: item.id,
        title: item.title,
        posterImage: item.posterImage,
        verticalPosterImage: item.verticalPosterImage,
        contentType: item.contentType,
      }))
    }));
    const limitedHero = heroItems.slice(0, 6).map((item: any) => ({
      id: item.id,
      title: item.title,
      posterImage: item.posterImage,
      heroImage: item.heroImage,
      verticalPosterImage: item.verticalPosterImage,
      description: item.description,
      contentType: item.contentType,
    }));
    return NextResponse.json(
      { rows: limitedRows, hero: limitedHero },
      { headers: { "Cache-Control": "public, max-age=300" } }
    );
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch landing content" }, { status: 500 });
  }
}
