"use client";

import React, { useEffect, useRef, useState } from "react";
import { Star, Quote, Sparkles, Building2, UserCheck, ShieldCheck } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface Testimonial {
  id: string;
  author_name: string;
  author_role: string;
  author_location?: string | null;
  content: string;
  avatar_url?: string | null;
  rating?: number | null;
  is_featured: boolean;
}

export default function TestimonialsSection() {
  const containerRef = useRef<HTMLElement>(null);
  const orb1Ref = useRef<HTMLDivElement>(null);
  const orb2Ref = useRef<HTMLDivElement>(null);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  useEffect(() => {
    if (loading) return;
    const ctx = gsap.context(() => {
      // Parallax scroll on glowing background orbs
      gsap.to(orb1Ref.current, {
        yPercent: -40,
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
        },
      });

      gsap.to(orb2Ref.current, {
        yPercent: 40,
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 1.2,
        },
      });

      // Cards staggered entrance animation
      gsap.fromTo(
        ".testimonial-card-item",
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          stagger: 0.18,
          ease: "power3.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 75%",
          },
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [loading]);

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${baseUrl}/api/testimonials`);
      if (res.ok) {
        const data = await res.json();
        setTestimonials(data || []);
      }
    } catch (err) {
      console.error("Failed to load testimonials:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fallback default testimonials if backend array doesn't have enough items
  const fallbackTestimonials: Testimonial[] = [
    {
      id: "fallback-1",
      author_name: "Aarav Sharma",
      author_role: "Property Owner",
      author_location: "South Delhi",
      content: "Letsellr completely changed how I rent my luxury apartments. Direct WhatsApp enquiries from verified tenants saved me lakhs in agent commissions!",
      rating: 5,
      is_featured: true,
    },
    {
      id: "fallback-2",
      author_name: "Priya Nair",
      author_role: "Homebuyer",
      author_location: "Indiranagar, Bengaluru",
      content: "Found my dream 3 BHK penthouse directly through the owner without any middlemen pushing fake deals. Transparency at its best!",
      rating: 5,
      is_featured: true,
    },
    {
      id: "fallback-3",
      author_name: "Vikram Malhotra",
      author_role: "Partner Agency",
      author_location: "Worli, Mumbai",
      content: "As a premier boutique agency, the verified lead quality on Letsellr is unmatched. Highly recommended platform for serious real estate deals.",
      rating: 5,
      is_featured: true,
    },
  ];

  const displayList = testimonials.length >= 3 
    ? testimonials 
    : [...testimonials, ...fallbackTestimonials].slice(0, 3);

  return (
    <section ref={containerRef} className="relative py-12 md:py-24 bg-[#014645] text-white overflow-hidden">
      {/* Background Decorative Gradient Orbs */}
      <div ref={orb1Ref} className="absolute top-0 right-1/4 w-96 h-96 bg-[#23D283]/15 rounded-full blur-3xl pointer-events-none" />
      <div ref={orb2Ref} className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#23D283]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-8 md:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-[#23D283]/15 border border-[#23D283]/30 text-[#23D283] text-[10px] md:text-xs font-semibold uppercase tracking-widest mb-3 md:mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Verified User Stories
          </div>
          <h2 className="text-xl sm:text-3xl lg:text-5xl font-extrabold tracking-tight text-white mb-3 md:mb-6">
            Loved by Buyers &amp; Owners
          </h2>
          <p className="text-xs sm:text-base lg:text-lg text-slate-300 font-light leading-relaxed">
            Discover how Letsellr empowers direct property connections across India with zero brokerage fee exploitation.
          </p>
        </div>

        {/* Testimonials Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-64 rounded-3xl bg-white/5 animate-pulse border border-white/10" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {displayList.map((t) => (
              <div
                key={t.id}
                className="testimonial-card-item group relative flex flex-col justify-between p-8 rounded-3xl bg-white/10 backdrop-blur-md border border-white/15 hover:border-[#23D283]/50 transition-all duration-300 hover:-translate-y-1.5 shadow-xl hover:shadow-[#23D283]/10"
              >
                {/* Quote Icon Badge */}
                <div className="absolute -top-4 right-8 w-10 h-10 rounded-full bg-[#23D283] text-[#014645] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Quote className="w-5 h-5 fill-current" />
                </div>

                <div>
                  {/* Rating Stars */}
                  <div className="flex items-center gap-1 mb-6">
                    {Array.from({ length: t.rating || 5 }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-[#23D283] fill-[#23D283]" />
                    ))}
                  </div>

                  {/* Content Body */}
                  <p className="text-slate-100 text-base leading-relaxed italic mb-8 font-light">
                    "{t.content}"
                  </p>
                </div>

                {/* Author Info Footer */}
                <div className="flex items-center gap-4 pt-6 border-t border-white/10">
                  <div className="w-12 h-12 rounded-full bg-linear-to-tr from-[#23D283] to-[#014645] border-2 border-white/20 flex items-center justify-center text-white font-bold text-lg shadow-inner overflow-hidden">
                    {t.avatar_url ? (
                      <img src={t.avatar_url} alt={t.author_name} className="w-full h-full object-cover" />
                    ) : (
                      t.author_name.charAt(0).toUpperCase()
                    )}
                  </div>

                  <div>
                    <h4 className="text-white font-bold text-sm tracking-wide group-hover:text-[#23D283] transition-colors">
                      {t.author_name}
                    </h4>
                    <p className="text-xs text-slate-300 flex items-center gap-1 mt-0.5">
                      <span className="capitalize font-medium text-[#23D283]">{t.author_role}</span>
                      {t.author_location && <span>• {t.author_location}</span>}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bottom Trust Badge Footer */}
        <div className="mt-16 pt-10 border-t border-white/10 flex flex-wrap items-center justify-center gap-8 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#23D283]" />
            <span>100% Verified Property Listings</span>
          </div>
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[#23D283]" />
            <span>Direct WhatsApp Connectivity</span>
          </div>
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#23D283]" />
            <span>Zero Brokerage Exploitation</span>
          </div>
        </div>
      </div>
    </section>
  );
}
