"use client";

import dynamic from "next/dynamic";

const ContentDetailContent = dynamic(
  () => import("@/components/ContentDetailContent"),
  { ssr: false }
);

export default function ContentDetailPage() {
  return <ContentDetailContent />;
}
