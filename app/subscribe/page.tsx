"use client";

import dynamic from "next/dynamic";

const SubscribePageContent = dynamic(
  () => import("@/components/SubscribePageContent"),
  { ssr: false }
);

export default function SubscribePage() {
  return <SubscribePageContent />;
}
