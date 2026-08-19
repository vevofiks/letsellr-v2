"use client";

import { useEffect, useState } from "react";
import { getAppUrl } from "@/lib/utils";
import { useScrollReveal } from "@/hooks/useScrollReveal";

interface LocationData {
  id: string;
  title: string;
  image_url: string | null;
  is_important: boolean;
}

const CITY_IMAGES: Record<string, string> = {
  kozhikode: "https://picsum.photos/seed/kozhikode/600/800",
  "calicut town": "https://picsum.photos/seed/calicut/600/800",
  calicut: "https://picsum.photos/seed/calicut/600/800",
  kochi: "https://picsum.photos/seed/kochi/600/800",
  munnar: "https://picsum.photos/seed/munnar/600/800",
  mukkam: "https://picsum.photos/seed/mukkam/600/800",
  nadakavu: "https://picsum.photos/seed/nadakavu/600/800",
  palazhi: "https://picsum.photos/seed/palazhi/600/800",
  mankave: "https://picsum.photos/seed/mankave/600/800",
  thondayad: "https://picsum.photos/seed/thondayad/600/800",
  bangalore: "https://picsum.photos/seed/bangalore/600/800",
  trivandrum: "https://picsum.photos/seed/trivandrum/600/800",
  wayanad: "https://picsum.photos/seed/wayanad/600/800",
};

const FALLBACK_POOL = [
  "https://picsum.photos/seed/city1/600/800",
  "https://picsum.photos/seed/city2/600/800",
  "https://picsum.photos/seed/city3/600/800",
  "https://picsum.photos/seed/city4/600/800",
  "https://picsum.photos/seed/city5/600/800",
];

function getImage(loc: LocationData, index: number): string {
  if (loc.image_url) return loc.image_url;
  const key = loc.title.toLowerCase().trim();
  if (CITY_IMAGES[key]) return CITY_IMAGES[key];
  for (const [k, v] of Object.entries(CITY_IMAGES)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return FALLBACK_POOL[index % FALLBACK_POOL.length];
}

export default function FeaturedLocations() {
  const [locations, setLocations] = useState<LocationData[]>([]);
  const sectionRef = useScrollReveal<HTMLElement>({ y: 30, duration: 0.8, start: "top 88%" });

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    fetch(`${apiBase}/api/properties/config/locations`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setLocations(data);
      })
      .catch(() => {});
  }, []);

  if (locations.length === 0) return null;

  // Duplicate for seamless loop
  const looped = [...locations, ...locations, ...locations, ...locations];
  const speed = Math.max(18, locations.length * 3.5);

  return (
    <section ref={sectionRef} className="w-full py-8 md:py-10 bg-[#FAF9F6] overflow-hidden">
      <style>{`
        @keyframes loc-marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .loc-track {
          animation: loc-marquee ${speed}s linear infinite;
          will-change: transform;
        }
        .loc-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Section Header */}
      <div className="flex flex-col items-center text-center mb-14 max-w-2xl mx-auto">
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#0F0F11] mb-3">
          Prime Locations
        </h2>
        <p className="text-zinc-500 text-sm font-normal leading-relaxed">
          Explore verified properties across prime locations in Kerala.
        </p>
      </div>

      {/* Infinite Marquee Strip */}
      <div className="overflow-hidden">
        <div className="loc-track flex gap-3 md:gap-4 w-max">
          {looped.map((loc, index) => {
            const img = getImage(loc, index % locations.length);
            return (
              <a
                key={`${loc.id}-${index}`}
                href={`${getAppUrl()}/dashboard?city=${encodeURIComponent(loc.title)}`}
                className="group flex-none cursor-pointer flex flex-col items-center gap-2"
                style={{ width: "clamp(108px, 31vw, 200px)" }}
              >
                {/* Portrait Photo Card */}
                <div
                  className="relative w-full rounded-2xl md:rounded-3xl overflow-hidden shadow-sm group-hover:shadow-lg transition-shadow duration-300"
                  style={{ aspectRatio: "5 / 5" }}
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-[1.04]"
                    style={{ backgroundImage: `url('${img}')` }}
                  />
                  {/* Bottom gradient */}
                  <div className="absolute inset-0 bg-linear-to-t from-black/55 via-black/10 to-transparent" />
                </div>
                {/* City name below */}
                <p className="text-[9px] sm:text-[11px] font-extrabold text-[#0F0F11] uppercase tracking-widest text-center leading-tight group-hover:text-[#014645] transition-colors">
                  {loc.title}
                </p>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}