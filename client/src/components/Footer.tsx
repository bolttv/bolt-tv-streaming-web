import { Link } from "wouter";

export default function Footer() {
  const links = [
    "Privacy Policy",
    "Terms of Use",
    "Ad Choices",
    "Accessibility",
    "Help Center",
    "Cookie Settings",
    "About Us"
  ];

  return (
    <footer className="bg-black/50 border-t border-white/5 py-12 md:py-16 px-4 md:px-12 mt-12 md:mt-24">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-8">
        <div className="space-y-4">
          <img 
            src="/assets/bolt-logo-white.png" 
            alt="Bolt Logo" 
            className="h-6 w-auto opacity-50" 
          />
          <div className="flex gap-4">
             {/* Social placeholders */}
             {[1, 2, 3, 4].map(i => (
               <div key={i} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 cursor-pointer transition" />
             ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-12 gap-y-4">
          {links.map((link) => (
            <Link key={link} href="#">
              <span className="text-xs text-zinc-400 hover:text-zinc-200 hover:underline transition-colors cursor-pointer">
                {link}
              </span>
            </Link>
          ))}
        </div>
      </div>
      
      <div className="mt-12 text-[10px] text-zinc-600 text-center md:text-left">
        © 2026 Bolt Streaming, LLC. All rights reserved.
      </div>
    </footer>
  );
}
