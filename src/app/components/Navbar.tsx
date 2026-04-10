"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Snapshots", href: "/#versions" },
    { name: "Git", href: "/#git" },
    { name: "Mestre", href: "/#master" },
    { name: "LinkedIn", href: "/#linkedin" },
    { name: "Plataformas", href: "/#platforms" },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 print:hidden ${
      scrolled ? "py-3 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800 shadow-2xl" : "py-6 bg-transparent"
    }`}>
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
        <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-rose-600 rounded-lg flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform duration-300">
             <span className="text-white font-black text-xs">AG</span>
          </div>
          <span className="text-lg font-bold tracking-tighter bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent">Antigravity</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              href={link.href}
              className="text-xs font-bold uppercase tracking-widest text-neutral-400 hover:text-orange-400 transition-colors"
            >
              {link.name}
            </Link>
          ))}
          
          <div className="h-4 w-px bg-neutral-800 mx-2"></div>
          
          <Link 
            href="/cv" 
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-full text-[10px] font-black uppercase tracking-widest border border-neutral-700 shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            <svg className="w-3 h-3 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            Imprimir CV
          </Link>
        </div>
      </div>
    </nav>
  );
}
