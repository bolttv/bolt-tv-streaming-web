import { NextResponse } from "next/server";

export async function GET() {
  const siteId = process.env.JWPLAYER_SITE_ID || "";
  const playerKey = process.env.JWPLAYER_PLAYER_KEY || "xQRl7M0d";
  return NextResponse.json({
    libraryUrl: `https://cdn.jwplayer.com/libraries/${playerKey}.js`,
    siteId,
  });
}
