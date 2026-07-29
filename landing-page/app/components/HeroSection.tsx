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
        <div
          className="hero-left absolute flex flex-col gap-2.5"
          style={{ top: "96px", left: "clamp(2rem, 4vw, 3.5rem)", zIndex: 20, maxWidth: "230px", opacity: 0 }}
        >
         
          <p className="text-[12px] text-zinc-600 leading-relaxed font-normal">
            Verified homes, direct from owners across India.{" "}
            <span style={{ color: "#23D283", fontWeight: 600 }}>100% Admin-Verified.</span>{" "}Direct owner connect.
          </p>
        </div>

        {/* Layer 1 — Right: stacked stats */}
        <div
          className="hero-right absolute flex flex-col items-end gap-4"
          style={{ top: "96px", right: "clamp(2rem, 4vw, 3.5rem)", zIndex: 20, opacity: 0 }}
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
          className="hero-tagline absolute"
          style={{ bottom: "2.5rem", left: "clamp(2rem, 4vw, 3.5rem)", zIndex: 30, opacity: 0 }}
        >
          <h2
            className="font-extrabold tracking-tight text-[#0F0F11] uppercase leading-tight"
            style={{ fontSize: "clamp(1.8rem, 3.2vw, 3.2rem)", maxWidth: "420px" }}
          >
            Direct <span style={{ color: "#23D283" }}>Living</span><br />With Letsellr
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
        {/* LETSELLR text below navbar — villa overlaps from below */}
        <div
          className="hero-title absolute inset-x-0 pointer-events-none select-none"
          style={{ top: "240px", zIndex: 1, opacity: 0 }}
        >
          <h1
            className="font-extrabold uppercase tracking-tighter text-[#0F0F11] text-center leading-none"
            style={{ fontSize: "21.5vw" }}
          >
            LETSELLR
          </h1>
        </div>

        {/* Top Row: Description left, Stats right */}
        <div className="absolute top-0 left-0 right-0 flex justify-between items-start px-5 pt-20 z-20">
          {/* Left: desc */}
          <div
            className="hero-left flex flex-col gap-2"
            style={{ maxWidth: "45%", opacity: 0 }}
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

          {/* Right: stats */}
          <div
            className="hero-right flex flex-col items-end gap-3"
            style={{ opacity: 0 }}
          >
            {[
              { val: "10K", label: "Clients" },
              { val: "100%", label: "Verified" },
              { val: "15+", label: "Cities" },
            ].map((s) => (
              <div key={s.label} className="text-right">
                <div className="text-xl font-extrabold tracking-tighter text-[#0F0F11] leading-none">{s.val}</div>
                <div className="text-[8px] font-bold uppercase tracking-widest mt-0.5" style={{ color: "#23D283" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Villa centerpiece — fits within screen, overlaps LETSELLR text */}
        <div
          className="hero-building absolute left-0 right-0 px-4"
          style={{ top: "20%", bottom: "55px", zIndex: 10, opacity: 0 }}
        >
          <div className="relative w-full h-full">
            <Image
              src="/images/isolated-villa-wbg.png"
              alt="Letsellr Premium Villa"
              fill
              priority
              className="object-contain object-bottom"
              style={{
                filter: "drop-shadow(0 12px 28px rgba(0,0,0,0.12))",
                transform: "scale(1.2)",
                transformOrigin: "bottom center",
              }}
            />
          </div>
        </div>

        {/* Bottom Tagline */}
        <div
          className="hero-tagline absolute bottom-5 left-5 right-5 z-30"
          style={{ opacity: 0 }}
        >
          <h2
            className="font-extrabold tracking-tight text-[#0F0F11] uppercase leading-tight"
            style={{ fontSize: "6.5vw" }}
          >
            Direct <span style={{ color: "#23D283" }}>Living</span><br />With Letsellr
          </h2>
        </div>
      </div>
    </section>
  );
}
