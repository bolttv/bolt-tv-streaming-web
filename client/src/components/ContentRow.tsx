import { Row } from "@/lib/mockData";
import PosterCard from "./PosterCard";
import { useRef } from "react";

interface ContentRowProps {
  row: Row;
}

export default function ContentRow({ row }: ContentRowProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: window.innerWidth * 0.7, behavior: "smooth" });
    }
  };

  const isContinueWatching = row.title === "Continue Watching";

  return (
    <div className="py-2 md:py-3 pl-4 md:pl-12 group/row relative z-10">
      <h2 className="text-lg md:text-xl font-semibold text-white mb-3 md:mb-4">
        {row.title}
      </h2>
      
      <div 
        ref={scrollContainerRef}
        className="flex gap-3 md:gap-4 overflow-x-auto no-scrollbar pr-12 scroll-pl-12 snap-x"
      >
        {row.items.map((item) => (
          <PosterCard 
            key={item.id} 
            item={item} 
            isWide={isContinueWatching}
            width={isContinueWatching ? "w-[260px] md:w-[320px]" : undefined}
          />
        ))}
      </div>

      {/* Right gradient to hint more content */}
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent pointer-events-none z-20" />
    </div>
  );
}
