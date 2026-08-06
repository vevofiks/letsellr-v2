"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";

export default function HeroSection({ isLoading = true }: { isLoading?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [imgSrc, setImgSrc] = useState("https://cdn.letsellr.in/isolated-villa-wbg.png");

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
          DESKTOP LAYOUT (lg and up)
      ───────────────────────────────────────────── */}
      <div className="hidden lg:block relative overflow-hidden" style={{ height: "100vh", minHeight: "640px" }}>

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
            src={imgSrc}
            alt="Letsellr Premium Villa"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 88vw, 1050px"
            priority
            onError={() => setImgSrc("/images/isolated-villa-wbg.png")}
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
          MOBILE + TABLET LAYOUT (below lg)

          Everything flows in a single flex column instead of being
          absolutely positioned, so the pieces divide up whatever height
          the device actually has. The villa takes the leftover space
          (flex-1), which keeps its distance to the title identical on a
          650px phone and a 1024px tablet. The one hand-tuned number is
          the title/villa overlap, expressed as a multiple of the title
          size so it scales with the type.
      ───────────────────────────────────────────── */}
      <div
        className="lg:hidden relative bg-[#FAFAF8] overflow-hidden flex flex-col"
        style={
          {
            height: "100svh",
            minHeight: "560px",
            "--hero-title-size": "clamp(2.75rem, 18vw, 7rem)",
          } as React.CSSProperties
        }
      >
        {/* Top: badge + description — pt clears the fixed navbar */}
        <div
          className="hero-left shrink-0 px-5 sm:px-8 pt-24 flex flex-col gap-2"
          style={{ maxWidth: "34rem", opacity: 0 }}
        >
          <span
            className="inline-block text-[7px] sm:text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full w-fit"
            style={{ border: "1px solid #23D283", color: "#23D283", background: "rgba(35,210,131,0.08)" }}
          >
            Direct Owners
          </span>
          <p className="text-[10px] sm:text-xs text-zinc-600 leading-relaxed font-normal">
            Verified homes, direct from owners. <span style={{ color: "#23D283", fontWeight: 600 }}>100% admin-checked</span> listings.
          </p>
        </div>

        {/* Pushes the wordmark+villa group down so the composition sits low,
            like the desktop. Collapses to nothing when height is tight. */}
        <div className="flex-1 min-h-[2vh]" />

        {/* LETSELLR wordmark */}
        <div
          className="hero-title shrink-0 px-3 pointer-events-none select-none"
          style={{ zIndex: 5, opacity: 0 }}
        >
          <h1
            className="font-extrabold uppercase tracking-tighter text-[#0F0F11] text-center leading-none"
            style={{ fontSize: "var(--hero-title-size)", letterSpacing: "-0.02em" }}
          >
            LETSELLR
          </h1>
        </div>

        {/* Villa — eats ALL remaining height (flex-1) and scales off that
            height, so it always fills the space with no vertical gap. Width
            follows the aspect ratio and is free to bleed past the screen
            edges (clipped by the wrapper), which is what keeps it big and
            identical in proportion on every device. The negative margin is a
            fraction of the title size, so the roofline cuts through the
            bottom of the letters by the same amount everywhere.
            Uses the alpha-trimmed asset — the original PNG's ~19% transparent
            padding is what forced the magic scale() values before. */}
        <div
          className="hero-building relative mx-auto"
          style={{
            zIndex: 10,
            opacity: 0,
            width: "140%",
            aspectRatio: "961 / 649",
            flex: "0 1 auto",
            minHeight: 0,
            marginTop: "calc(var(--hero-title-size) * -0.34)",
          }}
        >
          <Image
            src="/images/isolated-villa-trimmed.png"
            alt="Letsellr Premium Villa"
            fill
            sizes="(max-width: 1024px) 140vw, 1050px"
            priority
            className="object-contain object-bottom"
            style={{ filter: "drop-shadow(0 12px 28px rgba(0,0,0,0.12))" }}
          />
        </div>

        {/* Bottom: tagline left + stats right */}
        <div
          className="shrink-0 px-5 sm:px-8 flex justify-between items-end gap-4 z-30"
          style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
        >
          <div className="hero-tagline" style={{ opacity: 0 }}>
            <h2
              className="font-extrabold tracking-tight text-[#0F0F11] uppercase leading-tight"
              style={{ fontSize: "clamp(1.6rem, 7.5vw, 3rem)" }}
            >
              Choose <br />Your<br /><span style={{ color: "#23D283" }}>Next </span> Home
            </h2>
          </div>

          <div className="hero-right flex flex-col items-end gap-2" style={{ opacity: 0 }}>
            {[
              { val: "10K", label: "Clients" },
              { val: "15+", label: "Cities" },
              { val: "100%", label: "Verified" },
            ].map((s) => (
              <div key={s.label} className="text-right">
                <div
                  className="font-extrabold tracking-tighter text-[#0F0F11] leading-none"
                  style={{ fontSize: "clamp(1.15rem, 5.5vw, 2rem)" }}
                >
                  {s.val}
                </div>
                <div className="text-[9px] font-bold uppercase tracking-widest mt-0.5" style={{ color: "#23D283" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}