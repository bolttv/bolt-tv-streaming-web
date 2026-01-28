import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Loader2 } from "lucide-react";

interface SearchResult {
  id: string;
  title: string;
  posterImage: string;
  verticalPosterImage?: string;
  rating: string;
  isNew: boolean;
  mediaId?: string;
  duration?: number;
}

export default function Search() {
  const [query, setQuery] = useState("");
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setQuery(params.get("q") || "");
  }, []);

  const { data: results, isLoading } = useQuery<SearchResult[]>({
    queryKey: ["/api/search", query],
    queryFn: async () => {
      if (!query) return [];
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    },
    enabled: !!query,
  });

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      
      <div className="pt-24 md:pt-28 px-4 md:px-12 pb-12">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white" data-testid="text-search-header">
            {query ? (
              <>Search Results for "<span className="text-white/80">{query}</span>"</>
            ) : (
              "Search"
            )}
          </h1>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-white/60" />
          </div>
        ) : !query ? (
          <div className="text-center py-20">
            <p className="text-white/60 text-lg">Enter a search term to find content</p>
          </div>
        ) : results && results.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {results.map((item) => (
              <Link key={item.id} href={`/content/${item.id}`}>
                <div 
                  className="group cursor-pointer"
                  data-testid={`card-search-result-${item.id}`}
                >
                  <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-zinc-800 mb-2">
                    <img
                      src={item.verticalPosterImage || item.posterImage}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    {item.isNew && (
                      <div className="absolute top-2 left-2 bg-zinc-100 text-black text-[9px] md:text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider shadow-sm">
                        New
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  </div>
                  <h3 className="text-sm text-white font-medium truncate group-hover:text-white/80 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-white/50">{item.rating}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-white/60 text-lg mb-2">No results found for "{query}"</p>
            <p className="text-white/40 text-sm">Try searching for a different title, athlete, or sport</p>
          </div>
        )}
      </div>
    </div>
  );
}
