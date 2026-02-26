"use client";

import dynamic from "next/dynamic";

const SearchContent = dynamic(
  () => import("@/components/SearchContent"),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin" />
      </div>
    ),
  }
);

export default function SearchPage() {
  return <SearchContent />;
}
