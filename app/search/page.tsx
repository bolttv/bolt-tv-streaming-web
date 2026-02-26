"use client";

import dynamic from "next/dynamic";

const SearchContent = dynamic(
  () => import("@/components/SearchContent"),
  { ssr: false }
);

export default function SearchPage() {
  return <SearchContent />;
}
