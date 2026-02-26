"use client"

import Link from "next/link";
import { Instagram, Facebook, Youtube } from "lucide-react";

export default function Footer() {
  const links = [
    "Accessibility",
    "Audio Description",
    "Privacy Policy",
    "Terms of Use",
    "Ad Choices",
    "Do Not Sell or Share My Personal Information",
    "Info",
    "Help"
  ];

  return (
    <footer className="bg-black border-t border-white/5 py-12 md:py-16 px-4 md:px-12 mt-12 md:mt-24">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-8 md:gap-4">
        {/* Left Side: Social Icons */}
        <div className="flex gap-4">
           {/* YouTube */}
           <div className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 cursor-pointer transition flex items-center justify-center group">
              <Youtube className="w-4 h-4 text-white fill-current group-hover:scale-110 transition-transform" />
           </div>

           {/* X (Twitter) */}
           <div className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 cursor-pointer transition flex items-center justify-center group">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-white fill-current group-hover:scale-110 transition-transform" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
           </div>

           {/* Facebook */}
           <div className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 cursor-pointer transition flex items-center justify-center group">
              <Facebook className="w-4 h-4 text-white fill-current group-hover:scale-110 transition-transform" />
           </div>

           {/* Instagram */}
           <div className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 cursor-pointer transition flex items-center justify-center group">
              <Instagram className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
           </div>

           {/* TikTok */}
           <div className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 cursor-pointer transition flex items-center justify-center group">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-white fill-current group-hover:scale-110 transition-transform" aria-hidden="true">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.65-1.62-1.12-1.6.27-1.3.75-1.3 3.03 0 1.66.21 3.3 1.02 4.68 1.8 3.1 5.48 4.43 8.84 3.19 2.13-.79 3.52-2.88 3.5-5.18h4.2c-.14 3.98-2.61 7.42-6.19 8.78-3.96 1.51-8.56-.25-10.4-3.95-1.07-2.14-1.08-4.72-.03-6.87 1.37-2.82 4.1-4.7 7.21-4.85V4.2c-2.39.18-4.49 1.59-5.71 3.7-.91 1.56-1.15 3.44-.71 5.2.53 2.11 2 3.86 3.96 4.67 2.47 1.02 5.37.5 7.49-.96 1.48-1.01 2.48-2.66 2.6-4.5H8.7c.02 1.94 1.37 3.66 3.2 4.08.7.16 1.43.14 2.13-.07 1.53-.46 2.67-1.74 2.87-3.32.22-1.74-.53-3.48-1.92-4.47-.94-.67-2.12-.99-3.26-.9V.02z" transform="translate(1 2)" />
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V0h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V6.71a6.37 6.37 0 0 0-3.8-.28 6.51 6.51 0 1 0 10.44 2.84v-4.8a8.32 8.32 0 0 0 5.33 1.92V1.5a4.79 4.79 0 0 1-2.74.3z" transform="scale(0.8) translate(5, 5)"/>
              </svg>
           </div>
        </div>

        {/* Right Side: Links */}
        <div className="flex flex-wrap gap-x-6 gap-y-3 md:justify-end text-[11px] font-medium text-zinc-400">
          {links.map((link) => (
            <Link key={link} href="#">
              <span className="hover:text-zinc-200 hover:underline transition-colors cursor-pointer whitespace-nowrap">
                {link}
              </span>
            </Link>
          ))}
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto mt-8 md:mt-12 text-[10px] text-zinc-600 text-left">
        © 2026 Bolt TV, LLC. All rights reserved.
      </div>
    </footer>
  );
}
