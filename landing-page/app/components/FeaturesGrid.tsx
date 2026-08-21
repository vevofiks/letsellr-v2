"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Marquee } from "@/components/ui/marquee";
import { useScrollReveal } from "@/hooks/useScrollReveal";

interface Testimonial {
  id: string;
  author_name: string;
  author_role: string;
  author_location?: string | null;
  content: string;
  avatar_url?: string | null;
  rating?: number | null;
}

const fallbackReviews = [
  {
    id: "fb-1",
    author_name: "Rahul Nair",
    author_role: "Property Buyer",
    content: "Found my beachfront villa in Kozhikode without paying a single rupee in brokerage! Direct owner connect made it super fast.",
    rating: 5,
  },
  {
    id: "fb-2",
    author_name: "Ananya Sharma",
    author_role: "Property Owner",
    content: "As a PG owner near Infopark, getting verified tenants directly via WhatsApp saved me thousands in broker commissions.",
    rating: 5,
  },
  {
    id: "fb-3",
    author_name: "Vikram Dev",
    author_role: "Tenant",
    content: "The 100% admin verification is genuine. No fake photos or outdated listings like other real estate portals.",
    rating: 5,
  },
  {
    id: "fb-4",
    author_name: "Priya Menon",
    author_role: "Home Seeker",
    content: "Direct chat with property owners gave me full confidence before visiting. The cleanest property experience in Kerala!",
    rating: 5,
  },
  {
    id: "fb-5",
    author_name: "Mohammed Fahad",
    author_role: "Apartment Owner",
    content: "Rented my apartment in Marine Drive within 3 days. Clean design, fast response, and zero middleman calls.",
    rating: 5,
  },
  {
    id: "fb-6",
    author_name: "Sneha Kapoor",
    author_role: "Verified Buyer",
    content: "Zero commission real estate that actually works! Seamless search, transparent pricing, and instant location details.",
    rating: 5,
  },
];

const ReviewCard = ({
  author_name,
  content,
  author_role,
  avatar_url,
  rating = 5,
}: Testimonial) => {
  const starCount = rating || 5;

  return (
    <figure
      className={cn(
        "relative h-full w-80 cursor-pointer overflow-hidden rounded-2xl border p-5 transition-all duration-300 flex flex-col justify-between",
        "border-black/8 bg-white/90 backdrop-blur-xs hover:bg-white hover:shadow-md hover:border-[#23D283]/40"
      )}
    >
      <div>
        <div className="flex flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {avatar_url ? (
              <img src={avatar_url} alt={author_name} className="w-6 h-6 rounded-full object-cover" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-[#014645] text-white text-[10px] font-bold flex items-center justify-center">
                {author_name.charAt(0)}
              </div>
            )}
            <figcaption className="text-sm font-bold text-[#0F0F11]">
              {author_name}
            </figcaption>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#D9F7E9] text-[#0B6E4F] shrink-0 border border-[#23D283]/30 capitalize">
            {author_role}
          </span>
        </div>

        {/* Rating Stars */}
        <div className="flex items-center gap-1 mt-2.5">
          {Array.from({ length: starCount }).map((_, i) => (
            <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          ))}
        </div>

        <blockquote className="mt-2.5 text-xs text-zinc-600 leading-relaxed font-normal">
          &ldquo;{content}&rdquo;
        </blockquote>
      </div>
    </figure>
  );
};

export default function FeaturesGrid() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const headerRef = useScrollReveal<HTMLDivElement>({ y: 30, duration: 0.8, start: "top 88%" });
  const marqueeRef = useScrollReveal<HTMLDivElement>({ y: 40, duration: 0.9, delay: 0.1, start: "top 92%" });

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${baseUrl}/api/testimonials`);
      if (res.ok) {
        const data = await res.json();
        setTestimonials(data || []);
      }
    } catch (err) {
      console.error("Failed to load testimonials:", err);
    }
  };

  const fallbackReviewsMapped = fallbackReviews.map(f => ({
    id: f.id,
    author_name: f.author_name,
    author_role: f.author_role,
    content: f.content,
    rating: f.rating,
  }));

  // Pad with dummy data if we don't have enough to fill out the marquee grid nicely
  const list = testimonials.length >= 6 
    ? testimonials 
    : [...testimonials, ...fallbackReviewsMapped].slice(0, 6);

  const halfLength = Math.ceil(list.length / 2);
  const firstRow = list.slice(0, halfLength);
  const secondRow = list.slice(halfLength).length > 0 ? list.slice(halfLength) : firstRow;

  return (
    <section id="testimonials" className=" px-4 md:px-8 max-w-7xl mx-auto w-full bg-[#FAF9F6] text-[#0F0F11]">
      <div ref={headerRef} className="flex flex-col items-center text-center mb-14 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2.5 mb-3">
        </div>
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#0F0F11] mb-3">
          Loved by Buyers &amp; Owners
        </h2>
        <p className="text-zinc-500 text-sm font-normal leading-relaxed">
          See how thousands of users close direct real estate deals without middleman fees or delays.
        </p>
      </div>

      {/* Marquee Rows */}
      <div ref={marqueeRef} className="relative flex w-full flex-col items-center justify-center overflow-hidden py-4">
        <Marquee pauseOnHover className="[--duration:30s] py-2">
          {firstRow.map((review) => (
            <ReviewCard key={review.id} {...review} />
          ))}
        </Marquee>
        <Marquee reverse pauseOnHover className="[--duration:30s] py-2">
          {secondRow.map((review) => (
            <ReviewCard key={review.id} {...review} />
          ))}
        </Marquee>

        {/* Gradient Fades for Left and Right edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1/6 bg-linear-to-r from-[#FAF9F6] to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/6 bg-linear-to-l from-[#FAF9F6] to-transparent z-10" />
      </div>
    </section>
  );
}
