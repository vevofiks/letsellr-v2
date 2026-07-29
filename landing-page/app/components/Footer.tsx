"use client";

import Image from "next/image";
import { ArrowUpRight, ShieldCheck, MapPin, Phone, Mail } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const PRIMARY = "#23D283";

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const brandRef = useScrollReveal<HTMLDivElement>({ y: 30, duration: 0.8, start: "top 92%" });
  const linksRef = useScrollReveal<HTMLDivElement>({ y: 30, duration: 0.7, stagger: 0.1, children: true, start: "top 92%", delay: 0.15 });
  const ctaRef = useScrollReveal<HTMLDivElement>({ y: 20, duration: 0.7, start: "top 95%", delay: 0.3 });

  return (
    <footer className="bg-[#0F0F11] text-white w-full">
      {/* Top section */}
      <div className="px-6 md:px-12 lg:px-20 pt-16 pb-12 border-b border-white/10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Brand Column */}
          <div ref={brandRef} className="lg:col-span-4 flex flex-col gap-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Image
                  src="/images/logo.png"
                  alt="Letsellr"
                  width={62}
                  height={62}
                  className="object-contain"
                />
                <span className="font-extrabold text-2xl tracking-tight text-white">LETSELLR</span>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed max-w-xs font-light">
                India's direct property platform. Admin-verified listings, owner connect, transparent pricing.
              </p>
            </div>


            {/* Contact info */}
            <div className="flex flex-col gap-2 text-xs text-zinc-500">
              <span className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-zinc-600" />
                Kozhikode, Kerala, India
              </span>
              <span className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-zinc-600" />
                hello@letsellr.in
              </span>
            </div>
          </div>

          {/* Links Columns */}
          <div ref={linksRef} className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-10">
            <div>
              <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500 mb-5">
                Property Types
              </h4>
              <ul className="space-y-3 text-sm text-zinc-400">
                {["Luxury Villas", "Penthouse & Apts", "PG & Hostels", "Commercial Space", "Land & Plots"].map(l => (
                  <li key={l}>
                    <a href="#properties" className="hover:text-white transition-colors duration-150">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500 mb-5">
                Top Cities
              </h4>
              <ul className="space-y-3 text-sm text-zinc-400">
                {["Kozhikode, Kerala", "Kochi, Kerala", "Bangalore Urban", "Mumbai South", "Hyderabad"].map(l => (
                  <li key={l}>
                    <a href="#properties" className="hover:text-white transition-colors duration-150">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500 mb-5">
                Company
              </h4>
              <ul className="space-y-3 text-sm text-zinc-400">
                {[
                  { label: "About Letsellr", href: "#" },
                  { label: "List Property Free", href: "http://localhost:5173" },
                  { label: "Admin Verified", href: "#why-us" },
                  { label: "Privacy Policy", href: "#" },
                  { label: "Terms of Use", href: "#" },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <a href={href} className="hover:text-white transition-colors duration-150">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Middle CTA strip */}
      <div ref={ctaRef} className="px-6 md:px-12 lg:px-20 py-10 border-b border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <p className="text-zinc-400 text-sm font-light mb-1">Ready to find your next property?</p>
          <p className="text-white text-xl font-bold tracking-tight">
            Browse <span style={{ color: PRIMARY }}>verified listings</span> — direct from owners.
          </p>
        </div>
        <a
          href="http://localhost:5173"
          className="inline-flex items-center gap-2 text-sm font-semibold px-6 py-3 rounded-full transition-all duration-200 hover:scale-105 shrink-0 text-black"
          style={{ backgroundColor: PRIMARY }}
        >
          Explore Properties
          <ArrowUpRight className="w-4 h-4" />
        </a>
      </div>

      {/* Bottom copyright */}
      <div className="px-6 md:px-12 lg:px-20 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-xs text-zinc-600 font-mono">
          © 2026 LETSELLR PLATFORM. ALL RIGHTS RESERVED.
        </span>
        <button
          onClick={scrollToTop}
          className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-zinc-500 hover:bg-white/10 hover:text-white transition-all"
          aria-label="Scroll to top"
        >
          <ArrowUpRight className="w-4 h-4 -rotate-45" />
        </button>
      </div>
    </footer>
  );
}
