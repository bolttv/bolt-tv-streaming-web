import { NextResponse } from "next/server";

export async function GET() {
  const siteId = process.env.JWPLAYER_SITE_ID || "";
  const playerKey = process.env.JWPLAYER_PLAYER_KEY || "EBg26wOK";
  return NextResponse.json({
    libraryUrl: `https://cdn.jwplayer.com/libraries/${playerKey}.js`,
    siteId,
  });
}
