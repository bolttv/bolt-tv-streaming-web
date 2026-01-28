import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Search, Bell, User, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Series", href: "/" },
    { name: "Movies", href: "/" },
    { name: "HBO", href: "/" },
    { name: "Sports", href: "/" },
  ];

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-4 md:px-12 h-16 md:h-20 flex items-center justify-between",
        scrolled ? "bg-black/90 backdrop-blur-md" : "bg-gradient-to-b from-black/80 to-transparent"
      )}
    >
      <div className="flex items-center gap-8 md:gap-12">
        {/* Logo Mockup */}
        <Link href="/">
          <span className="text-2xl md:text-3xl font-bold tracking-tighter text-white font-display uppercase hover:text-white/90 transition cursor-pointer">
            HBO<span className="font-light opacity-80">MAX</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6 lg:gap-8">
          {navLinks.map((link) => (
            <Link key={link.name} href={link.href}>
              <span className="text-sm font-medium text-white/70 hover:text-white transition-colors duration-200 cursor-pointer">
                {link.name}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4 md:gap-6 text-white/80">
        <button className="hover:text-white transition p-1">
          <Search className="w-5 h-5 md:w-6 md:h-6" />
        </button>
        <button className="hidden md:block hover:text-white transition p-1">
          <Bell className="w-5 h-5 md:w-6 md:h-6" />
        </button>
        <button className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 border border-white/20 hover:border-white transition overflow-hidden">
          <img 
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" 
            alt="Profile" 
            className="w-full h-full object-cover"
          />
        </button>
      </div>
    </nav>
  );
}
