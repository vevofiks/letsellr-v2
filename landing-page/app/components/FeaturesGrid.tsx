"use client";

import { cn } from "@/lib/utils";
import { Marquee } from "@/components/ui/marquee";

const PRIMARY = "#23D283";

const reviews = [
  {
    name: "Rahul Nair",
    username: "@rahul_nair",
    body: "Found my beachfront villa in Kozhikode without paying a single rupee in brokerage! Direct owner connect made it super fast.",
    img: "https://avatar.vercel.sh/rahul",
    role: "Property Buyer",
  },
  {
    name: "Ananya Sharma",
    username: "@ananya_s",
    body: "As a PG owner near Infopark, getting verified tenants directly via WhatsApp saved me thousands in broker commissions.",
    img: "https://avatar.vercel.sh/ananya",
    role: "Property Owner",
  },
  {
    name: "Vikram Dev",
    username: "@vikram_dev",
    body: "The 100% admin verification is genuine. No fake photos or outdated listings like other real estate portals.",
    img: "https://avatar.vercel.sh/vikram",
    role: "Tenant",
  },
  {
    name: "Priya Menon",
    username: "@priya_m",
    body: "Direct chat with property owners gave me full confidence before visiting. The cleanest property experience in Kerala!",
    img: "https://avatar.vercel.sh/priya",
    role: "Home Seeker",
  },
  {
    name: "Mohammed Fahad",
    username: "@fahad_m",
    body: "Rented my apartment in Marine Drive within 3 days. Clean design, fast response, and zero middleman calls.",
    img: "https://avatar.vercel.sh/fahad",
    role: "Apartment Owner",
  },
  {
    name: "Sneha Kapoor",
    username: "@sneha_k",
    body: "Zero commission real estate that actually works! Seamless search, transparent pricing, and instant location details.",
    img: "https://avatar.vercel.sh/sneha",
    role: "Verified Buyer",
  },
];

const firstRow = reviews.slice(0, reviews.length / 2);
const secondRow = reviews.slice(reviews.length / 2);

const ReviewCard = ({
  name,
  body,
  role,
}: {
  name: string;
  body: string;
  role: string;
}) => {
  return (
    <figure
      className={cn(
        "relative h-full w-80 cursor-pointer overflow-hidden rounded-2xl border p-5 transition-all duration-300",
        // Light styles with brand styling
        "border-black/8 bg-white/80 backdrop-blur-xs hover:bg-white hover:shadow-lg hover:border-black/15"
      )}
    >
      <div className="flex flex-row items-center justify-between gap-3">
        <figcaption className="text-sm font-bold text-[#0F0F11]">
          {name}
        </figcaption>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 shrink-0">
          {role}
        </span>
      </div>
      <blockquote className="mt-3 text-xs text-zinc-600 leading-relaxed font-normal">
        &ldquo;{body}&rdquo;
      </blockquote>
    </figure>
  );
};

export default function FeaturesGrid() {
  return (
    <section id="testimonials" className="py-24 px-4 md:px-8 max-w-7xl mx-auto w-full bg-[#FAF9F6] text-[#0F0F11]">
      {/* Header */}
      <div className="text-center mb-14 max-w-2xl mx-auto">
        <span
          className="text-[11px] font-mono font-bold uppercase tracking-widest block mb-2"
          style={{ color: PRIMARY }}
        >
          — TESTIMONIALS
        </span>
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#0F0F11] mb-3">
          Loved by Buyers &amp; Owners
        </h2>
        <p className="text-zinc-500 text-sm font-normal leading-relaxed">
          See how thousands of users close direct real estate deals without middleman fees or delays.
        </p>
      </div>

      {/* Marquee Rows */}
      <div className="relative flex w-full flex-col items-center justify-center overflow-hidden py-4">
        <Marquee pauseOnHover className="[--duration:30s] py-2">
          {firstRow.map((review) => (
            <ReviewCard key={review.username} {...review} />
          ))}
        </Marquee>
        <Marquee reverse pauseOnHover className="[--duration:30s] py-2">
          {secondRow.map((review) => (
            <ReviewCard key={review.username} {...review} />
          ))}
        </Marquee>

        {/* Gradient Fades for Left and Right edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1/6 bg-linear-to-r from-[#FAF9F6] to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/6 bg-linear-to-l from-[#FAF9F6] to-transparent z-10" />
      </div>
    </section>
  );
}
