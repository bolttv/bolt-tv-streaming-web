"use client";

import dynamic from "next/dynamic";

const WatchContent = dynamic(
  () => import("@/components/WatchContent"),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    ),
  }
);

export default function WatchPage() {
  return <WatchContent />;
}
