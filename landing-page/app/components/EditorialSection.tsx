"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowUpRight, ArrowLeft, ArrowRight, Play } from "lucide-react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { getAppUrl } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

const PRIMARY = "#23D283";

// Gallery slides — main large image + thumbnails
const GALLERY_SLIDES = [
  {
    src: "/images/calicut-villa.png",
    alt: "Araamam Cliff Villa — Beachfront, Kozhikode",
    thumb: "/images/calicut-villa.png",
  },
  {
    src: "/images/hero-villa.png",
    alt: "The Horizon Coastal Villa — Kochi",
    thumb: "/images/hero-villa.png",
  },
  {
    src: "/images/modular-cabin.png",
    alt: "Nordic Modular Forest House — Munnar",
    thumb: "/images/modular-cabin.png",
  },
];

// Right-side property cards (rotating)
const PROPERTY_CARDS = [
  {
    image: "/images/coastal-penthouse.png",
    title: "Sunset Oceanfront Penthouse",
    location: "Worli, Mumbai",
    price: "₹45,000 / mo",
  },
  {
    image: "/images/commercial-tower.png",
    title: "Aura Glass Flagship Towers",
    location: "Indiranagar, Bangalore",
    price: "₹1.2 L / mo",
  },
  {
    image: "/images/hero-villa.png",
    title: "The Horizon Coastal Villa",
    location: "Kochi Marine Drive",
    price: "₹3.4 Cr",
  },
];

export default function EditorialSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  const [activeSlide, setActiveSlide] = useState(0);
  const [activePropCard, setActivePropCard] = useState(0);

  const prevSlide = () => setActiveSlide((p) => (p - 1 + GALLERY_SLIDES.length) % GALLERY_SLIDES.length);
  const nextSlide = () => setActiveSlide((p) => (p + 1) % GALLERY_SLIDES.length);

  const prevCard = () => setActivePropCard((p) => (p - 1 + PROPERTY_CARDS.length) % PROPERTY_CARDS.length);
  const nextCard = () => setActivePropCard((p) => (p + 1) % PROPERTY_CARDS.length);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        textRef.current,
        { opacity: 0, y: 50 },
        {
          opacity: 1, y: 0, duration: 1.2, ease: "power3.out",
          scrollTrigger: { trigger: textRef.current, start: "top 82%" },
        }
      );

      gsap.fromTo(
        ".editorial-stat",
        { opacity: 0, y: 40 },
        {
          opacity: 1, y: 0, duration: 0.8, stagger: 0.12, ease: "power2.out",
          scrollTrigger: { trigger: statsRef.current, start: "top 85%" },
        }
      );

      // Parallax image shift on scroll
      gsap.to(".editorial-main-img", {
        yPercent: -12,
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
        },
      });

      // Parallax card drift
      gsap.to(".editorial-card-drift", {
        yPercent: -15,
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 1.2,
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const currentSlide = GALLERY_SLIDES[activeSlide];
  const currentCard = PROPERTY_CARDS[activePropCard];

  return (
    <section
      ref={containerRef}
      className="py-16 md:py-24 px-6 md:px-12 lg:px-20 w-full"
      id="editorial"
    >
      {/* ── Top Headline Block ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end mb-12 md:mb-16">
        <div className="lg:col-span-7">
          {/* Eyebrow */}
          <div className="mb-5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.15em] uppercase bg-[#D9F7E9] text-[#0B6E4F]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#23D283]"></span>
              The Letsellr Philosophy
            </span>
          </div>

          <h2
            ref={textRef}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-[#0F0F11] leading-[1.06]"
          >
            Stunning{" "}
            <span className="font-serif italic font-normal">architecture</span>{" "}
            for spaces where people{" "}
            <span style={{ color: PRIMARY }}>live</span>,{" "}
            <span className="relative inline-block">
              <span className="font-serif italic font-normal">work</span>
              <span
                className="absolute -bottom-1 left-0 right-0 h-[2.5px] rounded-full"
                style={{ background: PRIMARY }}
              />
            </span>
            , and{" "}
            <span className="font-serif italic font-normal text-[#0F0F11]">chill</span>.
          </h2>
        </div>

        <div className="lg:col-span-5">
          <p className="text-zinc-500 text-sm md:text-base leading-relaxed font-normal max-w-sm">
            We eliminated the noise of traditional real estate. No middleman markups, no hidden charges — just genuine admin-checked properties directly connecting owners with seekers.
          </p>
        </div>
      </div>

      {/* ── 3-Panel Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-5 items-stretch">

        {/* LEFT — Large Image with thumbnail carousel */}
        <div className="lg:col-span-5 relative rounded-2xl overflow-hidden bg-zinc-900 min-h-95 md:min-h-120 group">
          {/* Main image */}
          <Image
            key={activeSlide}
            src={currentSlide.src}
            alt={currentSlide.alt}
            fill
            className="editorial-main-img object-cover object-center transition-all duration-700 ease-out group-hover:scale-[1.03]"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />

          {/* Green accent stripe */}
          <div
            className="absolute top-0 left-0 w-1 h-16 rounded-br-full"
            style={{ background: PRIMARY }}
          />

          {/* Top-right play button badge (decorative) */}
          <div className="absolute top-4 right-4 z-10">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-lg">
              <Play className="w-4 h-4 text-white fill-white" />
            </div>
          </div>

          {/* Thumbnail carousel at bottom */}
          <div className="absolute bottom-4 left-4 right-4 z-10 flex items-end justify-between">
            {/* Property label */}
            <p className="text-white/70 text-[11px] font-medium leading-snug max-w-40">
              Admin-verified properties in premium locations
            </p>

            {/* Thumbnails */}
            <div className="flex items-center gap-2 shrink-0">
              {GALLERY_SLIDES.map((slide, i) => (
                <button
                  key={i}
                  onClick={() => setActiveSlide(i)}
                  className={`relative w-10 h-10 rounded-full overflow-hidden border-2 transition-all duration-300 cursor-pointer ${
                    i === activeSlide
                      ? "border-white scale-110 shadow-lg"
                      : "border-white/40 opacity-70 hover:opacity-100"
                  }`}
                >
                  <Image src={slide.thumb} alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* CENTER — Info text card */}
        <div className="editorial-card-drift lg:col-span-4 flex flex-col justify-between bg-white rounded-2xl border border-black/8 shadow-sm p-8 md:p-10">
          <div>
            <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-zinc-400 block mb-4">
              Cabin &amp; Modular Homes
            </span>
            <h3 className="text-2xl md:text-3xl font-extrabold text-[#0F0F11] leading-tight tracking-tight mb-4">
              Big things can happen in small spaces.
            </h3>
            <p className="text-zinc-500 text-sm leading-relaxed mb-6 font-normal">
              With thoughtful design and smart organization, you can maximize every inch, making room for creativity and peace of mind.
            </p>

            {/* CTA Button */}
            <a
              href="#properties"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border border-[#23D283]/40 text-xs font-bold text-[#0B6E4F] bg-[#D9F7E9]/40 hover:bg-[#23D283] hover:text-white transition-all duration-300 cursor-pointer w-fit mb-8 shadow-xs"
            >
              Details
            </a>
          </div>

          <div>
            <p className="text-zinc-500 text-xs leading-relaxed font-normal border-t border-zinc-100 pt-5">
              Whether it&apos;s creating a cozy corner for relaxation or transforming a small area into a workspace — every listing connects you directly to the owner.
            </p>

            {/* Bottom link */}
            <a
              href="#properties"
              className="inline-flex items-center gap-2 text-xs font-bold text-[#0F0F11] uppercase tracking-widest group w-fit mt-5"
            >
              <span
                className="border-b-2 border-[#0F0F11] pb-0.5 transition-colors group-hover:border-[#23D283]"
              >
                Explore Listings
              </span>
              <ArrowUpRight
                className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </a>
          </div>
        </div>

        {/* RIGHT — Property card + nav arrows */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          {/* Property image card */}
          <div className="relative rounded-2xl overflow-hidden bg-zinc-200 flex-1 min-h-50 md:min-h-70 group">
            <Image
              key={activePropCard}
              src={currentCard.image}
              alt={currentCard.title}
              fill
              className="object-cover object-center transition-all duration-700 ease-out group-hover:scale-[1.05]"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent" />
          </div>

          {/* Info + nav */}
          <div className="bg-white rounded-2xl border border-black/8 shadow-sm p-5 flex flex-col gap-4">
            <div>
              <p className="text-xs text-zinc-400 font-semibold mb-1 truncate">{currentCard.location}</p>
              <h4 className="text-sm font-bold text-[#0F0F11] leading-snug line-clamp-2 mb-2">{currentCard.title}</h4>
              <p className="text-[11px] font-semibold text-zinc-500">
                Pricing Start at{" "}
                <span className="text-[#0B6E4F] font-extrabold text-sm">{currentCard.price}</span>
              </p>
            </div>

            {/* Explore button */}
            <a
              href={getAppUrl()}
              className="w-full flex items-center justify-center gap-2 bg-[#23D283] hover:bg-[#11995E] text-white text-xs font-bold py-3 rounded-xl transition-all duration-300 shadow-md shadow-[#23D283]/20 cursor-pointer"
            >
              Explore Properties
              <ArrowRight className="w-3.5 h-3.5" />
            </a>

            {/* Navigation arrows */}
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={prevCard}
                className="w-8 h-8 rounded-full border border-black/15 flex items-center justify-center text-zinc-600 hover:bg-[#23D283] hover:text-white hover:border-[#23D283] transition-all duration-200 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={nextCard}
                className="w-8 h-8 rounded-full border border-black/15 flex items-center justify-center text-zinc-600 hover:bg-[#23D283] hover:text-white hover:border-[#23D283] transition-all duration-200 cursor-pointer"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats row (Full-bleed edge-to-edge screen width) ── */}
      <div
        ref={statsRef}
        className="-mx-6 md:-mx-12 lg:-mx-20 bg-[#D9F7E9]/60 border-y border-[#23D283]/30 py-10 md:py-14 px-6 md:px-12 lg:px-20 grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10 mt-16 text-center shadow-xs"
      >
        {[
          { value: "15K", suffix: "+", label: "Direct Enquiries" },
          { value: "100", suffix: "%", label: "Client Satisfaction" },
          { value: "50", suffix: "+", label: "Properties Sold" },
          { value: "4.9", suffix: "★", label: "User Rating Score" },
        ].map((stat) => (
          <div key={stat.label} className="editorial-stat flex flex-col items-center justify-center">
            <span className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-[#0F0F11] leading-none">
              {stat.value}
              <span style={{ color: PRIMARY }}>{stat.suffix}</span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-3">
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
