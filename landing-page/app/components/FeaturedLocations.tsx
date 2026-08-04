"use client";

import { useEffect, useState, useRef } from "react";
import { getAppUrl } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

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

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=800&q=80";

export default function FeaturedLocations() {
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [isHovered, setIsHovered] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    fetch(`${apiBase}/api/properties/config/locations`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setLocations(data);
      })
      .catch(() => { });
  }, []);

  useEffect(() => {
    if (isHovered || locations.length === 0) return;
    
    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          scrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          scrollRef.current.scrollBy({ left: 320, behavior: "smooth" });
        }
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [isHovered, locations]);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -320, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 320, behavior: "smooth" });
    }
  };

  if (locations.length === 0) return null;

  return (
    <section className="relative w-full py-8 md:py-14 bg-white text-[#0F0F11] overflow-hidden border-t border-zinc-100">
      {/* Decorative blurred background for subtle glassmorphism base */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] bg-[#23D283]/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[50%] bg-[#23D283]/5 blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10 w-full">

        {/* Header Section above the strip */}
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 mb-6 md:mb-8 flex items-end justify-between md:justify-center">
          <div className="text-left md:text-center md:flex md:flex-col md:items-center">

            <h2 className="text-xl sm:text-3xl md:text-4xl lg:text-4xl font-extrabold tracking-tight text-slate-900 leading-snug">
              TopCities <br className="hidden md:block" />
              <span className="font-serif italic font-normal text-slate-500">in Kozhikode</span>
            </h2>
          </div>

          {/* Mobile-only Navigation Buttons (top right) */}
          <div className="flex md:hidden items-center gap-2 pb-1">
            <button
              onClick={scrollLeft}
              className="p-2 rounded-full border border-zinc-200 bg-white hover:bg-slate-50 transition-colors shadow-sm text-slate-600 hover:text-[#23D283]"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={scrollRight}
              className="p-2 rounded-full border border-zinc-200 bg-white hover:bg-slate-50 transition-colors shadow-sm text-slate-600 hover:text-[#23D283]"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Carousel Container */}
        <div 
          className="relative w-full group"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onTouchStart={() => setIsHovered(true)}
          onTouchEnd={() => setIsHovered(false)}
        >

          {/* Desktop-only Floating Left Button */}
          <button
            onClick={scrollLeft}
            className="hidden md:flex lg:hidden absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full border border-zinc-200 bg-white hover:bg-slate-50 transition-all shadow-[0_8px_30px_rgb(0,0,0,0.08)] text-slate-600 hover:text-[#23D283] opacity-0 group-hover:opacity-100"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Full-width glassmorphic strip */}
          <div
            ref={scrollRef}
            className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar border-y border-zinc-200 bg-white/60 backdrop-blur-xl "
          >
            {/* Location Cells */}
            {locations.map((loc) => {
              const cityKey = loc.title.toLowerCase();
              const bgImage =
                loc.image_url ||
                CITY_IMAGES[cityKey] ||
                FALLBACK_IMAGE;

              return (
                <a
                  key={loc.id}
                  href={`${getAppUrl()}/properties?q=${encodeURIComponent(loc.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group shrink-0 w-[280px] md:w-[320px] p-6 md:p-8 flex items-center gap-5 border-r border-zinc-200 hover:bg-[#FAF9F6] transition-colors duration-500 snap-start"
                >
                  {/* Image */}
                  <div className="w-16 h-20 md:w-20 md:h-24 shrink-0 overflow-hidden bg-slate-100 rounded-sm shadow-sm border border-slate-200/50">
                    <img
                      src={bgImage}
                      alt={loc.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  </div>

                  {/* Text */}
                  <div className="flex flex-col flex-1 min-w-0">
                    <h3 className="text-sm md:text-[15px] font-bold text-slate-900 truncate group-hover:text-[#23D283] transition-colors">
                      {loc.title}
                    </h3>
                    <p className="text-[11px] md:text-xs font-medium text-slate-500 mt-1.5 leading-relaxed line-clamp-2">
                      Discover premium properties in {loc.title}.
                    </p>
                  </div>
                </a>
              );
            })}
          </div>

          {/* Desktop-only Floating Right Button */}
          <button
            onClick={scrollRight}
            className="hidden md:flex lg:hidden absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full border border-zinc-200 bg-white hover:bg-slate-50 transition-all shadow-[0_8px_30px_rgb(0,0,0,0.08)] text-slate-600 hover:text-[#23D283] opacity-0 group-hover:opacity-100"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
}
