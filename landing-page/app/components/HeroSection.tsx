"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";

export default function HeroSection({ isLoading = true }: { isLoading?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLoading) return;

    const ctx = gsap.context(() => {
      // Start animations slightly after loading begins to slide out
      const delayOffset = 0.35;

      gsap.fromTo(
        ".hero-title",
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 1.2, delay: delayOffset, ease: "power3.out" }
      );
      gsap.fromTo(
        ".hero-building",
        { y: 150, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.6, delay: delayOffset + 0.05, ease: "power4.out" }
      );
      gsap.fromTo(
        ".hero-left",
        { opacity: 0, x: -30 },
        { opacity: 1, x: 0, duration: 1.0, delay: delayOffset + 0.2, ease: "power3.out" }
      );
      gsap.fromTo(
        ".hero-right",
        { opacity: 0, x: 30 },
        { opacity: 1, x: 0, duration: 1.0, delay: delayOffset + 0.2, ease: "power3.out" }
      );
      gsap.fromTo(
        ".hero-tagline",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1.0, delay: delayOffset + 0.4, ease: "power2.out" }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [isLoading]);

  return (
    <section
      ref={containerRef}
      className="bg-[#FAFAF8] text-[#0F0F11]"
    >
      {/* ─────────────────────────────────────────────
          DESKTOP LAYOUT (md and up)
      ───────────────────────────────────────────── */}
      <div className="hidden md:block relative overflow-hidden" style={{ height: "100vh", minHeight: "640px" }}>

        {/* Layer 0 — Brand name behind everything */}
        <div
          className="hero-title absolute left-0 right-0 flex justify-center pointer-events-none select-none"
          style={{ top: "88px", zIndex: 1, opacity: 0 }}
        >
          <h1
            className="font-extrabold uppercase tracking-tighter text-[#0F0F11] text-center leading-none"
            style={{ fontSize: "clamp(5rem, 11vw, 11.5rem)" }}
          >
            LETSELLR
          </h1>
        </div>

        {/* Layer 1 — Left: tag + description */}
        <div className="hero-left h-badge pt-24 flex px-10 flex-col gap-1.5" style={{ opacity: 0 }}>
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

        {/* Layer 1 — Right: stacked stats */}
        <div
          className="hero-right absolute flex flex-col items-end gap-4"
          style={{ top: "150px", right: "clamp(2rem, 4vw, 3.5rem)", zIndex: 20, opacity: 0 }}
        >
          {[
            { val: "100%", label: "Verified Owners" },
            { val: "10K", label: "Happy Clients" },
            { val: "15+", label: "Cities" },
          ].map((s) => (
            <div key={s.label} className="text-right">
              <div className="font-extrabold tracking-tighter text-[#0F0F11]" style={{ fontSize: "clamp(2rem, 4.5vw, 4rem)" }}>{s.val}</div>
              <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "#23D283" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Layer 2 — Building */}
        <div
          className="hero-building absolute left-1/2 -translate-x-1/2"
          style={{ top: "180px", bottom: "0", zIndex: 10, width: "min(1050px, 88vw)", opacity: 0 }}
        >
          <Image
            src="/images/isolated-villa-wbg.png"
            alt="Letsellr Premium Villa"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 88vw, 1050px"
            priority
            className="object-contain object-bottom animate-float"
            style={{
              filter: "drop-shadow(0 24px 50px rgba(0,0,0,0.13))",
              transform: "scale(1.54) translateY(14%)",
              transformOrigin: "bottom center"
            }}
          />
        </div>

        {/* Layer 3 — Bottom tagline */}
        <div
          className="hero-tagline absolute mb-10"
          style={{ bottom: "2.5rem", left: "clamp(2rem, 4vw, 3.5rem)", zIndex: 30, opacity: 0 }}
        >
          <h2
            className="font-extrabold tracking-tight text-[#0F0F11] uppercase leading-tight"
            style={{ fontSize: "clamp(1.8rem, 3.2vw, 3.2rem)", maxWidth: "420px" }}
          >
            Choose Your<br /><span style={{ color: "#23D283" }}>Next </span>Home
          </h2>
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          MOBILE LAYOUT (below md) — full 100svh
      ───────────────────────────────────────────── */}
      <div
        className="md:hidden relative bg-[#FAFAF8] overflow-hidden"
        style={{ height: "100svh", minHeight: "580px" }}
      >
        {/* Top Row: Description left — anchored at top */}
        <div className="absolute top-0 left-0 right-0 flex justify-between items-start px-5 pt-20 z-20">
          {/* Left: desc */}
          <div
            className="hero-left flex flex-col gap-2"
            style={{ maxWidth: "75%", opacity: 0 }}
          >
            <span
              className="inline-block text-[7px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full w-fit"
              style={{ border: "1px solid #23D283", color: "#23D283", background: "rgba(35,210,131,0.08)" }}
            >
              Direct Owners
            </span>
            <p className="text-[10px] text-zinc-600 leading-relaxed font-normal">
              Verified homes, direct from owners. <span style={{ color: "#23D283", fontWeight: 600 }}>100% admin-checked</span> listings.
            </p>
          </div>
        </div>

        {/* LETSELLR text — fixed position below description, always above villa */}
        <div
          className="hero-title absolute inset-x-0 pointer-events-none select-none flex justify-center"
          style={{ top: "175px", zIndex: 5, opacity: 0 }}
        >
          <h1
            className="font-extrabold uppercase tracking-tighter text-[#0F0F11] text-center leading-none w-full px-2"
            style={{ fontSize: "clamp(3rem, 19vw, 5.5rem)", letterSpacing: "-0.02em" }}
          >
            LETSELLR
          </h1>
        </div>

        {/* Villa centerpiece — starts below the LETSELLR text, overlaps it partially */}
        <div
          className="hero-building absolute left-0 right-0 px-4"
          style={{ top: "22%", bottom: "clamp(100px, 16vh, 140px)", zIndex: 10, opacity: 0 }}
        >
          <div className="relative w-full h-full">
            <Image
              src="/images/isolated-villa-wbg.png"
              alt="Letsellr Premium Villa"
              fill
              sizes="100vw"
              priority
              className="object-contain object-bottom"
              style={{
                filter: "drop-shadow(0 12px 28px rgba(0,0,0,0.12))",
                transform: "scale(1.15) translateY(0%)",
                transformOrigin: "bottom center",
              }}
            />
          </div>
        </div>

        {/* Bottom Row: Left Tagline + Right Stats */}
        <div
          className="absolute bottom-5 left-5 right-5 flex justify-between items-end z-30 pointer-events-none"
        >
          {/* Bottom Tagline */}
          <div
            className="hero-tagline pointer-events-auto"
            style={{ opacity: 0 }}
          >
            <h2
              className="font-extrabold tracking-tight text-[#0F0F11] uppercase leading-tight"
              style={{ fontSize: "7.5vw" }}
            >
              Choose <br />Your<br /><span style={{ color: "#23D283" }}>Next </span> Home
            </h2>
          </div>

          {/* Right: stats (Mobile bottom-right) */}
          <div
            className="hero-right flex flex-col items-end gap-2 pointer-events-auto"
            style={{ opacity: 0 }}
          >
            {[
              { val: "10K", label: "Clients" },
              { val: "15+", label: "Cities" },
              { val: "100%", label: "Verified" },
            ].map((s) => (
              <div key={s.label} className="text-right">
                <div className="text-[21px] font-extrabold tracking-tighter text-[#0F0F11] leading-none">{s.val}</div>
                <div className="text-[9px] font-bold uppercase tracking-widest mt-0.5" style={{ color: "#23D283" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}