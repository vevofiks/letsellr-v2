"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import gsap from "gsap";
import { Montserrat } from "next/font/google";
import { getAppUrl } from "@/lib/utils";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
});

export default function HeroSection({ isLoading = true }: { isLoading?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLoading) return;
    const ctx = gsap.context(() => {
      const d = 0.25;
      gsap.fromTo(".h-badge",   { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.7, delay: d,        ease: "power2.out" });
      gsap.fromTo(".h-img",     { opacity: 0, scale: 1.03 }, { opacity: 1, scale: 1, duration: 1.6, delay: d, ease: "power3.out" });
      gsap.fromTo(".h-headline",{ opacity: 0, y: 36 }, { opacity: 1, y: 0, duration: 1.0, delay: d + 0.2, ease: "power3.out" });
      gsap.fromTo(".h-cta",     { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.7, delay: d + 0.44, ease: "power2.out" });
      gsap.fromTo(".h-stats",   { opacity: 0, x: 16 }, { opacity: 1, x: 0, duration: 0.9, delay: d + 0.3,  ease: "power2.out" });
    }, containerRef);
    return () => ctx.revert();
  }, [isLoading]);

  const stats = [
    { val: "100%", label: "Verified Owners" },
    { val: "10K",  label: "Happy Clients" },
    { val: "15+",  label: "Cities" },
  ];

  return (
    <section
      ref={containerRef}
      className="relative overflow-hidden"
      style={{ height: "100vh", minHeight: "600px", backgroundColor: "#EDE8DF" }}
    >
      {/* ── DESKTOP Background image (UNTOUCHED) ── */}
      <div
        className="hidden md:block h-img absolute inset-0 z-0"
        style={{ opacity: 0 }}
      >
        <Image
          src="/images/hero-bg.png"
          alt="Letsellr luxury villa"
          fill
          priority
          quality={100}
          unoptimized
          className="object-cover object-right"
        />
        {/* Fade left white portion into cream so left text column is clean */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, #EDE8DF 16%, rgba(237,232,223,0.6) 30%, rgba(237,232,223,0.1) 48%, transparent 62%)",
          }}
        />
      </div>

      {/* ── MOBILE Background image (Focussed on villa & arch) ── */}
      <div
        className="md:hidden h-img absolute inset-0 z-0"
        style={{ opacity: 0 }}
      >
        <Image
          src="/images/hero-bg.png"
          alt="Letsellr luxury villa"
          fill
          priority
          quality={100}
          unoptimized
          className="object-cover object-[65%_35%]"
        />
        {/* Smooth bottom-up fade: Keeps top 65% villa crisp & untouched while anchoring text on readable cream */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: [
              "linear-gradient(to bottom, rgba(237,232,223,0.8) 0%, transparent 16%)",
              "linear-gradient(to top, #EDE8DF 0%, rgba(237,232,223,0.95) 30%, rgba(237,232,223,0.6) 48%, transparent 68%)",
            ].join(", "),
          }}
        />
      </div>

      {/* ══ DESKTOP ══ */}
      <div className="hidden md:block absolute inset-0 z-10">

        {/* Left column */}
        <div
          className="absolute inset-y-0 flex flex-col"
          style={{ left: "clamp(2.5rem, 5vw, 5.5rem)", width: "clamp(280px, 40vw, 520px)" }}
        >
          {/* Badge + description */}
          <div className="h-badge pt-24 flex flex-col gap-1.5" style={{ opacity: 0 }}>
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase w-fit"
              style={{
                background: "rgba(255,255,255,0.7)",
                color: "#1A5C38",
                border: "1px solid rgba(35,210,131,0.4)",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#23D283]" />
              Direct Owners
            </span>

            <p className="text-[12px] text-zinc-600 leading-relaxed mt-2">
              Verified homes from owners across India.
            </p>
            <p className="text-[12px] font-semibold text-[#23D283]">
              100% Admin-Verified.
            </p>
            <div className="w-8 h-0.5 mt-2 rounded-full bg-[#23D283]" />
          </div>

          {/* Push headline towards bottom half */}
          <div className="flex-1" />

          {/* Headline — font sized so "NEXT HOME" sits on one line */}
          <h1
            className={`h-headline ${montserrat.className} font-black uppercase tracking-tight text-[#0F0F11] mb-8`}
            style={{ fontSize: "clamp(2.5rem, 4.6vw, 5rem)", lineHeight: 1.12, opacity: 0 }}
          >
            CHOOSE<br />
            YOUR<br />
            <span style={{ color: "#1A5C38" }}>NEXT HOME</span>
          </h1>

          {/* CTA */}
          <div className="h-cta pb-16" style={{ opacity: 0 }}>
            <a
              href={getAppUrl()}
              className="group inline-flex items-center gap-3 bg-[#0F0F11] hover:bg-[#23D283] text-white hover:text-[#0F0F11] font-bold text-sm px-6 py-3.5 rounded-full transition-all duration-300 shadow-lg hover:scale-105"
            >
              <span>Connect Directly With Owners</span>
              <span className="w-7 h-7 rounded-full bg-[#23D283] group-hover:bg-[#0F0F11] flex items-center justify-center transition-colors shrink-0">
                <ArrowRight className="w-3.5 h-3.5 text-[#0F0F11] group-hover:text-white" />
              </span>
            </a>
          </div>
        </div>

        {/* Right: Stats column */}
        <div
          className="h-stats absolute flex flex-col justify-center"
          style={{
            right: "clamp(0.5rem, 1.5vw, 1.5rem)",
            top: "50%",
            transform: "translateY(-50%)",
            opacity: 0,
          }}
        >
          {stats.map((s, i) => (
            <div key={s.label}>
              <div
                className="font-extrabold tracking-tighter text-[#0F0F11] leading-none"
                style={{ fontSize: "clamp(2rem, 4vw, 4.2rem)" }}
              >
                {s.val}
              </div>
              <div
                className="text-[9px] font-bold uppercase tracking-widest mt-1"
                style={{ color: "rgba(0,0,0,0.45)" }}
              >
                {s.label}
              </div>
              {i < stats.length - 1 && (
                <div className="w-full h-px mt-5 mb-5" style={{ background: "rgba(0,0,0,0.1)" }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ══ MOBILE ══ */}
      <div className="md:hidden relative z-10 min-h-dvh flex flex-col justify-between px-5 pt-20 pb-8">

        {/* Badge + description — top */}
        <div className="h-badge relative z-10 flex flex-col gap-1" style={{ opacity: 0 }}>
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold tracking-widest uppercase w-fit"
            style={{ background: "rgba(255,255,255,0.85)", color: "#1A5C38", border: "1px solid rgba(35,210,131,0.5)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#23D283]" />
            Direct Owners
          </span>
          <p className="text-[12px] text-zinc-700 font-medium leading-tight mt-1">Verified homes from owners across India.</p>
          <p className="text-[12px] font-bold text-[#1A5C38]">100% Admin-Verified.</p>
        </div>

        {/* Headline + Stats + CTA container — bottom anchored */}
        <div className="relative z-10 flex flex-col gap-5 mt-auto pt-10">

          {/* Headline */}
          <h1
            className={`h-headline ${montserrat.className} font-black uppercase tracking-tight text-[#0F0F11]`}
            style={{ fontSize: "clamp(2.1rem, 9.5vw, 3rem)", lineHeight: 1.08, opacity: 0 }}
          >
            CHOOSE<br />YOUR<br />
            <span style={{ color: "#1A5C38" }}>NEXT HOME</span>
          </h1>

          {/* Stats Bar — Clean transparent layout */}
          <div
            className="h-stats flex items-center justify-around py-1"
            style={{ opacity: 0 }}
          >
            {stats.map((s, i) => (
              <div key={s.label} className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-xl font-black text-[#0F0F11] leading-none">{s.val}</div>
                  <div className="text-[9px] font-bold uppercase tracking-wider text-zinc-600 mt-1">{s.label}</div>
                </div>
                {i < stats.length - 1 && <div className="w-px h-6 bg-black/20" />}
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <div className="h-cta" style={{ opacity: 0 }}>
            <a
              href={getAppUrl()}
              className="w-full inline-flex items-center justify-between bg-[#0F0F11] text-white font-bold text-sm px-6 py-4 rounded-full shadow-xl active:scale-[0.98] transition-transform"
            >
              <span>Connect Directly With Owners</span>
              <span className="w-8 h-8 rounded-full bg-[#23D283] flex items-center justify-center shrink-0">
                <ArrowRight className="w-4 h-4 text-[#0F0F11]" />
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
