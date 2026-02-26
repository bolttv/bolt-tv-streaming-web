import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.jwplayer.com",
        pathname: "/**",
      },
    ],
  },
  allowedDevOrigins: [
    "*.replit.dev",
    "*.riker.replit.dev",
    "*.replit.app",
  ],
  serverExternalPackages: ["@supabase/supabase-js"],
  devIndicators: false,
  reactStrictMode: false,
};

export default nextConfig;
