const JWPLAYER_SITE_ID = process.env.JWPLAYER_SITE_ID;
const JWPLAYER_API_SECRET = process.env.JWPLAYER_API_SECRET;

export interface JWPlayerMedia {
  id: string;
  title: string;
  description?: string;
  duration?: number;
  status: string;
  created: string;
  updated: string;
  metadata?: {
    tags?: string[];
    custom_params?: Record<string, string>;
  };
  media_type?: string;
  hosting_type?: string;
  poster?: {
    url?: string;
  };
}

export interface JWPlayerResponse {
  media: JWPlayerMedia[];
  page: number;
  page_length: number;
  total: number;
}

export async function fetchJWPlayerMedia(): Promise<JWPlayerMedia[]> {
  if (!JWPLAYER_SITE_ID || !JWPLAYER_API_SECRET) {
    console.warn("JW Player credentials not configured, using fallback data");
    return [];
  }

  try {
    const response = await fetch(
      `https://api.jwplayer.com/v2/sites/${JWPLAYER_SITE_ID}/media?page_length=50`,
      {
        headers: {
          Authorization: `Bearer ${JWPLAYER_API_SECRET}`,
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error(`JW Player API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const data: JWPlayerResponse = await response.json();
    return data.media || [];
  } catch (error) {
    console.error("Failed to fetch JW Player media:", error);
    return [];
  }
}

export async function fetchJWPlayerMediaById(mediaId: string): Promise<JWPlayerMedia | null> {
  if (!JWPLAYER_SITE_ID || !JWPLAYER_API_SECRET) {
    return null;
  }

  try {
    const response = await fetch(
      `https://api.jwplayer.com/v2/sites/${JWPLAYER_SITE_ID}/media/${mediaId}`,
      {
        headers: {
          Authorization: `Bearer ${JWPLAYER_API_SECRET}`,
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch JW Player media by ID:", error);
    return null;
  }
}

export function getJWPlayerThumbnail(mediaId: string): string {
  return `https://cdn.jwplayer.com/v2/media/${mediaId}/poster.jpg?width=640`;
}

export function getJWPlayerHeroImage(mediaId: string): string {
  return `https://cdn.jwplayer.com/v2/media/${mediaId}/poster.jpg?width=1920`;
}

export function getJWPlayerPlayerUrl(mediaId: string): string {
  return `https://cdn.jwplayer.com/players/${mediaId}-${JWPLAYER_SITE_ID}.html`;
}
