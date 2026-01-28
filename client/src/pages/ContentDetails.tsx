import { useParams, Link } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Play, Plus, ThumbsUp, Film, ChevronDown } from "lucide-react";
import { heroItems, rows, RowItem } from "@/lib/mockData";
import PosterCard from "@/components/PosterCard";
import { useState, useEffect } from "react";

export default function ContentDetails() {
  const { id } = useParams();
  const [content, setContent] = useState<any>(null);

  useEffect(() => {
    // Simulate fetching content
    // Check hero items first
    let found = heroItems.find(i => i.id === id);
    
    // Check row items if not found
    if (!found) {
      for (const row of rows) {
        const item = row.items.find(i => i.id === id);
        if (item) {
          found = {
            ...item,
            // Add missing fields for RowItem to match HeroItem-like structure for the page
            heroImage: item.posterImage, // Fallback
            genres: ["Drama", "Sports"], // Mock
            description: "Experience the intensity and drama in this gripping series that takes you behind the scenes." // Mock
          } as any;
          break;
        }
      }
    }

    // Default fallback if nothing found (just for mockup purposes)
    if (!found) {
        found = heroItems[0];
    }
    
    setContent(found);
    window.scrollTo(0, 0);
  }, [id]);

  if (!content) return <div className="min-h-screen bg-black" />;

  const episodes = [
    { id: 1, title: "Episode 1", duration: "55m", image: "/assets/poster-action_1.jpg", desc: "The team preps for a Black Friday battle vs. the Bears in the wake of a tough loss to the Cowboys.", contentId: "action-1" },
    { id: 2, title: "Episode 2", duration: "57m", image: "/assets/poster-action_2.jpg", desc: "Dak Prescott and the Cowboys look to stay hot while the Giants, Eagles, and Commanders all try to turn their luck around.", contentId: "action-2" },
    { id: 3, title: "Episode 3", duration: "55m", image: "/assets/poster-action_3.jpg", desc: "While the Eagles and Cowboys look to rebound from tough losses, the Giants and Commanders face off on a snowy Sunday.", contentId: "action-3" },
    { id: 4, title: "Episode 4", duration: "54m", image: "/assets/poster-comedy_1.jpg", desc: "Each of the NFC East teams prepares for Christmas...even if only the Eagles will find a playoff ticket under the tree.", contentId: "comedy-1" },
  ];

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white/20">
      <Navbar />

      <main>
        {/* Hero Section */}
        <div className="relative h-[80vh] w-full">
          <div className="absolute inset-0">
            <img 
              src={content.heroImage} 
              alt={content.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent w-full md:w-2/3" />
          </div>

          <div className="absolute bottom-0 left-0 right-0 px-4 md:px-12 pb-12 z-10">
            <div className="max-w-2xl space-y-6">
              {content.logoImage ? (
                 <img src={content.logoImage} alt={content.title} className="h-24 md:h-32 object-contain" />
              ) : (
                 <h1 className="text-4xl md:text-6xl font-display font-black uppercase leading-none drop-shadow-xl">{content.title}</h1>
              )}

              <div className="flex items-center gap-3 text-sm font-medium text-gray-300">
                <span className="text-blue-400 font-bold">Season 1 Now Available</span>
              </div>
              
              <div className="flex items-center gap-3 text-sm font-medium text-gray-300">
                <span className="bg-white/10 px-1.5 py-0.5 rounded text-white border border-white/20">{content.rating}</span>
                <span>1 Season</span>
                <span className="border border-white/20 px-1 rounded text-[10px]">AD</span>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button className="flex items-center gap-2 bg-white text-black hover:bg-white/90 transition-colors h-12 px-8 rounded font-bold tracking-wide">
                  <Play className="w-5 h-5 fill-current" />
                  Watch S1 E1
                </button>
                
                <div className="flex items-center gap-6 px-2">
                    <button className="flex flex-col items-center gap-1 group text-gray-300 hover:text-white transition">
                        <Plus className="w-6 h-6" />
                        <span className="text-[10px] uppercase tracking-wider font-bold">My List</span>
                    </button>
                    <button className="flex flex-col items-center gap-1 group text-gray-300 hover:text-white transition">
                        <ThumbsUp className="w-6 h-6" />
                        <span className="text-[10px] uppercase tracking-wider font-bold">Rate</span>
                    </button>
                    <button className="flex flex-col items-center gap-1 group text-gray-300 hover:text-white transition">
                        <Film className="w-6 h-6" />
                        <span className="text-[10px] uppercase tracking-wider font-bold">Trailer</span>
                    </button>
                </div>
              </div>

              <p className="text-gray-300 text-sm md:text-base leading-relaxed max-w-xl drop-shadow-md">
                {content.description}
              </p>
              
              <div className="flex gap-2 text-xs text-gray-400 font-medium">
                 <span>{content.genres?.join(" • ")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Episodes Section */}
        <div className="px-4 md:px-12 py-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h2 className="text-xl font-bold">Episodes</h2>
                <button className="flex items-center gap-2 text-sm font-bold hover:bg-white/10 px-3 py-1.5 rounded transition">
                    Season 1 <ChevronDown className="w-4 h-4" />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {episodes.map(ep => (
                    <Link key={ep.id} href={`/content/${ep.contentId}`}>
                      <div className="group cursor-pointer space-y-3">
                          <div className="relative aspect-video bg-zinc-800 rounded-md overflow-hidden border-2 border-transparent transition-all duration-300 group-hover:border-white">
                              <img src={ep.image} alt={ep.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition" />
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/40">
                                  <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
                                      <Play className="w-6 h-6 fill-white text-white" />
                                  </div>
                              </div>
                              <div className="absolute bottom-2 left-2 bg-black/60 px-1.5 py-0.5 rounded text-[10px] font-bold">{ep.duration}</div>
                          </div>
                          <div>
                              <div className="font-bold text-sm mb-1 group-hover:text-white transition-colors">{ep.id}: {ep.title}</div>
                              <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed">{ep.desc}</p>
                          </div>
                      </div>
                    </Link>
                ))}
            </div>
        </div>

        {/* You May Also Like */}
        <div className="px-4 md:px-12 py-12 space-y-6">
            <h2 className="text-xl font-bold">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {rows[1].items.slice(0, 5).map((item) => (
                    <PosterCard key={item.id} item={item} width="w-full" />
                ))}
            </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
