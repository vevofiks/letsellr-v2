"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export default function CTABanner() {
  const bannerRef = useScrollReveal<HTMLDivElement>({ y: 60, duration: 0.9, start: "top 90%" });
  const contentRef = useScrollReveal<HTMLDivElement>({ y: 30, duration: 0.8, stagger: 0.15, children: true, start: "top 82%", delay: 0.2 });

  return (
    <section id="contact" className="w-full bg-[#FAF9F6] px-4 md:px-8 py-16">
      {/* Full-bleed image banner with rounded corners */}
      <div
        ref={bannerRef}
        className="relative w-full rounded-3xl md:rounded-4xl overflow-hidden"
        style={{ minHeight: "420px" }}
      >
        {/* Background Image */}
        <Image
          src="/images/hero-villa.png"
          alt="Dream Property"
          fill
          className="object-cover object-center brightness-[0.55]"
          priority
        />

        {/* Centered Content Overlay */}
        <div ref={contentRef} className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-24 sm:py-32 min-h-105">
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.1] max-w-3xl mb-5">
            Ready to Make Your Dream Property a Reality?
          </h2>

          <p className="text-white/70 text-sm sm:text-base font-normal leading-relaxed max-w-lg mb-10">
            Explore a curated selection of properties that align with your vision and goals.
          </p>

          <a
            href="http://localhost:5173"
            className="inline-flex items-center gap-2 bg-white text-zinc-900 text-sm font-semibold px-8 py-4 rounded-full hover:bg-zinc-100 transition-all duration-200 shadow-lg hover:scale-105"
          >
            Get Started
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
