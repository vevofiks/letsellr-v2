"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { getAppUrl } from "@/lib/utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function CTABanner() {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const bannerRef = useScrollReveal<HTMLDivElement>({ y: 60, duration: 0.9, start: "top 90%" });
  const contentRef = useScrollReveal<HTMLDivElement>({ y: 30, duration: 0.8, stagger: 0.15, children: true, start: "top 82%", delay: 0.2 });

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (imgRef.current) {
        gsap.to(imgRef.current, {
          yPercent: 20,
          ease: "none",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
          },
        });
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} id="contact" className="w-full bg-[#FAF9F6] px-4 md:px-8 py-16">
      {/* Full-bleed image banner with rounded corners */}
      <div
        ref={bannerRef}
        className="relative w-full rounded-3xl md:rounded-4xl overflow-hidden"
        style={{ minHeight: "420px" }}
      >
        {/* Background Image */}
        <Image
          ref={imgRef}
          src="/images/hero-villa.png"
          alt="Dream Property"
          fill
          sizes="100vw"
          className="object-cover object-center brightness-[0.55] scale-110"
          priority
        />

        {/* Centered Content Overlay */}
        <div ref={contentRef} className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-24 sm:py-32 min-h-105">
         

          <h2 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.1] max-w-3xl mb-5">
            Ready to Make Your Dream Property a Reality?
          </h2>

          <p className="text-white/80 text-sm sm:text-base font-normal leading-relaxed max-w-lg mb-10">
            Explore a curated selection of properties directly from verified owners across India.
          </p>

          <a
            href={getAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#23D283] hover:bg-[#11995E] text-white text-sm font-bold px-9 py-4 rounded-full transition-all duration-300 shadow-xl shadow-[#23D283]/30 hover:scale-105"
          >
            Get Started Now
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
