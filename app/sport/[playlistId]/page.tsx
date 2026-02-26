"use client";

import dynamic from "next/dynamic";

const SportCategoryContent = dynamic(
  () => import("@/components/SportCategoryContent"),
  { ssr: false }
);

export default function SportCategoryPage() {
  return <SportCategoryContent />;
}
