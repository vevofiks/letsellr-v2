"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

// Smooth scroll helper scrolls gradually so ScrollTrigger animations fire
const smoothScrollTo = (id: string) => (e: React.MouseEvent) => {
  e.preventDefault();
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 lg:px-12 py-4 transition-all duration-300">
      <div
        className={`max-w-7xl mx-auto flex items-center justify-between px-6 py-4 rounded-2xl transition-all duration-300 ${
          scrolled
            ? "bg-white/90 backdrop-blur-xl shadow-md border border-black/5"
            : "bg-transparent"
        }`}
      >
        {/* Brand Logo scrolls back to top */}
        <a
          href="#"
          onClick={smoothScrollTo("__next")}
          className="flex items-center gap-2.5 group"
        >
          <Image
            src="/images/logo.png"
            alt="Letsellr Logo"
            width={39}
            height={39}
            className="object-contain"
            style={{ width: "auto", height: "auto" }}
          />
          <span className="font-extrabold text-xl tracking-tight text-[#0F0F11] font-sans uppercase">
            LETSELLR
          </span>
        </a>

        {/* Center Nav Links */}
        <nav className="hidden lg:flex items-center gap-8">
          <a
            href="#properties"
            onClick={smoothScrollTo("properties")}
            className="text-xs font-semibold text-zinc-700 hover:text-[#23D283] transition-colors"
          >
            Properties
          </a>
          <a
            href="#editorial"
            onClick={smoothScrollTo("editorial")}
            className="text-xs font-semibold text-zinc-700 hover:text-[#23D283] transition-colors"
          >
            Our Philosophy
          </a>
          <a
            href="#testimonials"
            onClick={smoothScrollTo("testimonials")}
            className="text-xs font-semibold text-zinc-700 hover:text-[#23D283] transition-colors"
          >
            Testimonials
          </a>
          <a
            href="#contact"
            onClick={smoothScrollTo("contact")}
            className="text-xs font-semibold text-zinc-700 hover:text-[#23D283] transition-colors"
          >
            Contact
          </a>
        </nav>

        {/* Right CTA Button */}
        <div className="relative group">
          <a
            href="https://app.letsellr.in/register/type"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center bg-[#23D283] hover:bg-[#11995E] text-white text-xs font-bold px-5 py-2.5 rounded-full transition-transform duration-300 shadow-md shadow-[#23D283]/20 group-hover:scale-105"
          >
            List Property
          </a>
          {/* Free Badge */}
          <span className="absolute -top-2 -right-2.5 bg-zinc-900 text-[#23D283] text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow-sm border-[1.5px] border-white pointer-events-none group-hover:scale-110 transition-transform duration-300 z-10 uppercase tracking-widest">
            Free
          </span>
        </div>
      </div>
    </header>
  );
}
