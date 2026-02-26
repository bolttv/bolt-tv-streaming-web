"use client";

import dynamic from "next/dynamic";

const WatchContent = dynamic(
  () => import("@/components/WatchContent"),
  { ssr: false }
);

export default function WatchPage() {
  return <WatchContent />;
}
