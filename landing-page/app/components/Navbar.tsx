"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { getAppUrl } from "@/lib/utils";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 30) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 px-4 md:px-12 py-4 transition-all duration-300">
      <div
        className={`max-w-7xl mx-auto flex items-center justify-between px-6 py-4 rounded-2xl transition-all duration-300 ${
          scrolled
            ? "bg-white/90 backdrop-blur-xl shadow-md border border-black/5"
            : "bg-transparent"
        }`}
      >
        {/* Brand Logo */}
        <a href="#" className="flex items-center gap-2.5 group">
          <Image
            src="/images/logo.png"
            alt="Letsellr Logo"
            width={39}
            height={39}
            className="object-contain"
          />
          <span className="font-extrabold text-xl tracking-tight text-[#0F0F11] font-sans uppercase">
            LETSELLR
          </span>
        </a>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-8">
          <a
            href="#properties"
            className="text-xs font-semibold text-zinc-700 hover:text-[#23D283] transition-colors"
          >
            Properties
          </a>
          <a
            href="#editorial"
            className="text-xs font-semibold text-zinc-700 hover:text-[#23D283] transition-colors"
          >
            Our Philosophy
          </a>
          <a
            href="#testimonials"
            className="text-xs font-semibold text-zinc-700 hover:text-[#23D283] transition-colors"
          >
            Testimonials
          </a>
          <a
            href="#contact"
            className="text-xs font-semibold text-zinc-700 hover:text-[#23D283] transition-colors"
          >
            Contact
          </a>
        </nav>

        {/* Right CTA Button */}
        <a
          href={getAppUrl()}
          className="bg-[#23D283] hover:bg-[#11995E] text-white text-xs font-bold px-5 py-2.5 rounded-full transition-all shadow-md shadow-[#23D283]/20 hover:scale-105"
        >
          List Property
        </a>
      </div>
    </header>
  );
}
