import { cn } from "@/lib/utils";

export function HeroSkeleton() {
  return (
    <div className="relative h-[calc(70vh-30px)] md:h-[calc(85vh-30px)] w-full overflow-hidden bg-zinc-900">
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent" />
      
      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8 md:p-12 lg:p-16 pb-20 md:pb-28">
        <div className="max-w-2xl space-y-4">
          <div className="h-12 md:h-20 w-64 md:w-96 bg-zinc-800 rounded animate-pulse" />
          
          <div className="flex items-center gap-2 md:gap-3">
            <div className="h-4 w-12 bg-zinc-800 rounded animate-pulse" />
            <div className="h-4 w-20 bg-zinc-800 rounded animate-pulse" />
            <div className="h-4 w-16 bg-zinc-800 rounded animate-pulse" />
          </div>
          
          <div className="space-y-2">
            <div className="h-4 w-full bg-zinc-800 rounded animate-pulse" />
            <div className="h-4 w-3/4 bg-zinc-800 rounded animate-pulse" />
          </div>
          
          <div className="flex items-center gap-3 pt-2">
            <div className="h-10 md:h-12 w-32 md:w-40 bg-zinc-700 rounded animate-pulse" />
            <div className="h-10 md:h-12 w-10 md:w-12 bg-zinc-800 rounded animate-pulse" />
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="w-2 h-2 bg-zinc-700 rounded-full animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export function ContentRowSkeleton({ count = 5 }: { count?: number }) {
  return (
    <section className="pl-4 md:pl-12 py-3 md:py-4">
      <div className="h-6 w-40 bg-zinc-800 rounded mb-4 animate-pulse" />
      <div className="flex gap-3 md:gap-4 overflow-hidden">
        {Array.from({ length: count }).map((_, i) => (
          <PosterCardSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}

export function PosterCardSkeleton({ isWide = false }: { isWide?: boolean }) {
  return (
    <div className={cn(
      "flex-shrink-0",
      isWide ? "w-[280px] md:w-[320px]" : "w-[160px] md:w-[220px]"
    )}>
      <div className={cn(
        "bg-zinc-800 rounded-md animate-pulse",
        isWide ? "aspect-video" : "aspect-[2/3]"
      )} />
    </div>
  );
}

export function SportCategorySkeleton() {
  return (
    <section className="px-4 md:px-12 pt-8">
      <div className="h-6 w-36 bg-zinc-800 rounded mb-6 animate-pulse" />
      <div className="flex gap-3 md:gap-4 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex-shrink-0 w-[140px] md:w-[180px]">
            <div className="aspect-square bg-zinc-800 rounded-lg animate-pulse" />
            <div className="h-4 w-20 bg-zinc-800 rounded mt-2 mx-auto animate-pulse" />
          </div>
        ))}
      </div>
    </section>
  );
}

export function HomePageSkeleton() {
  return (
    <div className="min-h-screen bg-background text-white" data-testid="home-skeleton">
      <div className="h-16 bg-transparent" />
      
      <HeroSkeleton />
      
      <div className="relative z-10 -mt-10 md:-mt-14 pb-20 space-y-1 md:space-y-2 bg-gradient-to-b from-transparent via-background/60 to-background">
        <ContentRowSkeleton count={6} />
        <ContentRowSkeleton count={6} />
        <ContentRowSkeleton count={6} />
        <SportCategorySkeleton />
      </div>
    </div>
  );
}
