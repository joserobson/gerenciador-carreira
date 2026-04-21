"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const navLinks = [
  { name: "Snapshots",   href: "/#versions",   icon: "🕒" },
  { name: "Git Analyzer",href: "/#git",        icon: "⚙️" },
  { name: "Currículo",   href: "/#master",     icon: "📋" },
  { name: "LinkedIn",    href: "/#linkedin",   icon: "💼" },
  { name: "Exportar CV", href: "/#cv-export",  icon: "📄" },
  { name: "Plataformas", href: "/#platforms",  icon: "🎯" },
];

const sectionIds = ["versions", "git", "master", "linkedin", "cv-export", "platforms"];

export default function Navbar() {
  const [active, setActive] = useState("");

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActive(id); },
        { rootMargin: "-40% 0px -55% 0px" }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  return (
    <aside className="fixed top-0 left-0 h-screen w-52 bg-neutral-950 border-r border-neutral-800 flex flex-col z-100 print:hidden">
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-5 py-6 cursor-pointer shrink-0"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        <div className="w-8 h-8 bg-linear-to-br from-orange-500 to-rose-600 rounded-lg flex items-center justify-center shadow-lg shrink-0">
          <span className="text-white font-black text-xs">AG</span>
        </div>
        <div className="leading-tight">
          <p className="text-sm font-bold text-white tracking-tight">Antigravity</p>
          <p className="text-[10px] text-neutral-500">Career Manager</p>
        </div>
      </div>

      <div className="h-px bg-neutral-800 mx-4 shrink-0" />

      {/* Nav links */}
      <nav className="flex-1 flex flex-col gap-1 px-3 py-4 overflow-y-auto">
        {navLinks.map((link) => {
          const id = link.href.replace("/#", "");
          const isActive = active === id;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-orange-500/15 text-orange-400 border border-orange-500/20"
                  : "text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800/60"
              }`}
            >
              <span className="text-base leading-none">{link.icon}</span>
              <span className="truncate">{link.name}</span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="h-px bg-neutral-800 mx-4 shrink-0" />

      {/* Footer */}
      <div className="px-3 py-4 shrink-0">
        <Link
          href="/cv"
          target="_blank"
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-bold border border-neutral-700 transition-all hover:border-orange-500/40"
        >
          <svg className="w-3.5 h-3.5 text-orange-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Imprimir CV
        </Link>
      </div>
    </aside>
  );
}
