import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Search, User, ChevronDown, Loader2, X, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth0 } from "@auth0/auth0-react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading, logout, loginWithRedirect } = useAuth0();
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 150);
    }
  }, [searchOpen]);

  const handleSearchClose = () => {
    setSearchOpen(false);
    setSearchQuery("");
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      handleSearchClose();
    }
  };

  const handleSignOut = () => {
    logout({ logoutParams: { returnTo: window.location.origin } });
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
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        scrolled ? "bg-black/90 backdrop-blur-md" : "bg-gradient-to-b from-black/80 to-transparent"
      )}
    >
      <div className="px-4 md:px-12 h-16 md:h-20 flex items-center justify-between">
        <div className="flex items-center gap-8 md:gap-12 flex-shrink-0">
          <Link href="/">
            <img 
              src="/assets/bolt-logo-white.png" 
              alt="Bolt Logo" 
              className="h-6 md:h-8 w-auto hover:opacity-90 transition cursor-pointer flex-shrink-0" 
            />
          </Link>

          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            {navLinks.map((link) => (
              <Link key={link.name} href={link.href}>
                <span className="text-sm font-medium text-white/70 hover:text-white transition-colors duration-200 cursor-pointer whitespace-nowrap">
                  {link.name}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 md:gap-6 text-white/80 flex-shrink-0">
          <div className="hidden lg:flex items-center">
            <div
              className={cn(
                "flex items-center bg-zinc-800 rounded-full overflow-hidden transition-all duration-[285ms] ease-out",
                searchOpen 
                  ? "w-[30vw] xl:w-[35vw] 2xl:w-[40vw] max-w-[700px] px-5 py-[13px] mr-3" 
                  : "w-0 px-0 py-0"
              )}
            >
              <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-3">
                <Search className={cn(
                  "w-4 h-4 text-white/60 flex-shrink-0 transition-opacity duration-200",
                  searchOpen ? "opacity-100" : "opacity-0"
                )} />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title, athlete or genre..."
                  className={cn(
                    "flex-1 bg-transparent text-white text-sm placeholder:text-white/40 outline-none min-w-0 transition-opacity duration-200",
                    searchOpen ? "opacity-100" : "opacity-0"
                  )}
                  data-testid="input-search-desktop"
                />
              </form>
              <button
                type="button"
                onClick={handleSearchClose}
                className={cn(
                  "p-1 hover:bg-white/10 rounded-full transition-all duration-200 flex-shrink-0",
                  searchOpen ? "opacity-100" : "opacity-0"
                )}
                data-testid="button-search-close-desktop"
              >
                <X className="w-4 h-4 text-white/60 hover:text-white" />
              </button>
            </div>
            
            <button 
              className={cn(
                "hover:text-white transition p-1",
                searchOpen && "text-white"
              )}
              onClick={() => setSearchOpen(!searchOpen)}
              data-testid="button-search-desktop"
            >
              <Search className="w-6 h-6" />
            </button>
          </div>
          
          <button 
            className="lg:hidden hover:text-white transition p-1"
            onClick={() => setSearchOpen(!searchOpen)}
            data-testid="button-search-mobile"
          >
            <Search className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          
          <Link href="/subscribe">
            <button className="hidden md:block bg-white text-black font-bold px-4 py-1.5 rounded hover:bg-gray-200 transition text-sm whitespace-nowrap" data-testid="button-nav-subscribe">
              Subscribe
            </button>
          </Link>
          
          <button className="hidden md:flex items-center gap-1 hover:text-white transition cursor-pointer font-bold text-sm">
            <span>EN</span>
            <ChevronDown className="w-3 h-3 md:w-4 md:h-4 stroke-[3]" />
          </button>
          
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />
          ) : isAuthenticated ? (
            <button 
              onClick={handleSignOut}
              className="flex items-center gap-2 hover:text-white transition font-bold text-sm flex-shrink-0"
              data-testid="button-signout"
            >
              <div className="p-1 border-2 border-current rounded-full">
                <User className="w-4 h-4 md:w-5 md:h-5 fill-current" />
              </div>
              <span className="hidden md:inline whitespace-nowrap">Sign Out</span>
            </button>
          ) : (
            <button 
              onClick={() => loginWithRedirect()}
              className="flex items-center gap-2 hover:text-white transition font-bold text-sm flex-shrink-0" 
              data-testid="button-nav-signin"
            >
              <div className="p-1 border-2 border-current rounded-full">
                <User className="w-4 h-4 md:w-5 md:h-5 fill-current" />
              </div>
              <span className="hidden md:inline whitespace-nowrap">Sign In</span>
            </button>
          )}
          
          <button 
            className="md:hidden hover:text-white transition p-1 flex-shrink-0"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="button-mobile-menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>
      
      <div
        className={cn(
          "lg:hidden overflow-hidden transition-all duration-300 ease-out px-4 md:px-12",
          searchOpen ? "max-h-20 py-3" : "max-h-0 py-0",
          scrolled ? "bg-black/90" : "bg-black/70 backdrop-blur-sm"
        )}
      >
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-3 bg-zinc-800 rounded-full px-4 py-3">
          <Search className="w-4 h-4 text-white/60 flex-shrink-0" />
          <input
            ref={searchOpen ? searchInputRef : undefined}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, athlete or genre..."
            className="flex-1 bg-transparent text-white text-sm placeholder:text-white/40 outline-none min-w-0"
            data-testid="input-search-mobile"
          />
          <button
            type="button"
            onClick={handleSearchClose}
            className="p-1 hover:bg-white/10 rounded-full transition-all duration-200 flex-shrink-0"
            data-testid="button-search-close-mobile"
          >
            <X className="w-4 h-4 text-white/60 hover:text-white" />
          </button>
        </form>
      </div>
      
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-black/95 backdrop-blur-md md:hidden border-t border-white/10">
          <div className="flex flex-col p-4 space-y-4">
            {navLinks.map((link) => (
              <Link key={link.name} href={link.href}>
                <span 
                  className="block text-base font-medium text-white/80 hover:text-white transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </span>
              </Link>
            ))}
            <Link href="/subscribe">
              <button 
                className="w-full bg-white text-black font-bold px-4 py-3 rounded hover:bg-gray-200 transition text-sm mt-2"
                onClick={() => setMobileMenuOpen(false)}
                data-testid="button-mobile-subscribe"
              >
                Subscribe
              </button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
