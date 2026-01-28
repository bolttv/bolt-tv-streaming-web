import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Search, Bell, User, Menu, ChevronDown, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { isLoggedIn, getCleengAuth, clearCleengAuth } from "@/lib/cleeng";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setLoggedIn(isLoggedIn());
  }, []);

  const handleSignOut = () => {
    clearCleengAuth();
    setLoggedIn(false);
    setLocation("/");
  };

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Series", href: "/" },
    { name: "Movies", href: "/" },
    { name: "Docs", href: "/" },
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
          <img 
            src="/assets/bolt-logo-white.png" 
            alt="Bolt Logo" 
            className="h-6 md:h-8 w-auto hover:opacity-90 transition cursor-pointer" 
          />
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
        <button 
          className="hover:text-white transition p-1"
          onClick={() => setSearchOpen(!searchOpen)}
        >
          <Search className="w-5 h-5 md:w-6 md:h-6" />
        </button>
        
        <Link href="/subscribe">
          <button className="hidden md:block bg-white text-black font-bold px-4 py-1.5 rounded hover:bg-gray-200 transition text-sm" data-testid="button-nav-subscribe">
            Subscribe
          </button>
        </Link>
        
        <button className="hidden md:flex items-center gap-1 hover:text-white transition cursor-pointer font-bold text-sm">
          <span>EN</span>
          <ChevronDown className="w-3 h-3 md:w-4 md:h-4 stroke-[3]" />
        </button>
        
        {loggedIn ? (
          <button 
            onClick={handleSignOut}
            className="flex items-center gap-2 hover:text-white transition font-bold text-sm"
            data-testid="button-signout"
          >
            <div className="p-1 border-2 border-current rounded-full">
              <User className="w-4 h-4 md:w-5 md:h-5 fill-current" />
            </div>
            <span className="hidden md:inline">Sign Out</span>
          </button>
        ) : (
          <Link href="/signin">
            <button className="flex items-center gap-2 hover:text-white transition font-bold text-sm" data-testid="button-nav-signin">
              <div className="p-1 border-2 border-current rounded-full">
                <User className="w-4 h-4 md:w-5 md:h-5 fill-current" />
              </div>
              <span className="hidden md:inline">Sign In</span>
            </button>
          </Link>
        )}
      </div>
    </nav>
  );
}
