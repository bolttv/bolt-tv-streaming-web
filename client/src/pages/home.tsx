import Navbar from "@/components/Navbar";
import HeroCarousel from "@/components/HeroCarousel";
import ContentRow from "@/components/ContentRow";
import Footer from "@/components/Footer";
import { heroItems, rows } from "@/lib/mockData";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-white selection:bg-white/20">
      <Navbar />
      
      <main className="relative z-0">
        <HeroCarousel items={heroItems} />
        
        <div className="relative z-10 -mt-24 md:-mt-32 pb-20 space-y-4 md:space-y-8 bg-gradient-to-b from-transparent via-background/60 to-background">
          {rows.map((row) => (
            <ContentRow key={row.id} row={row} />
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
