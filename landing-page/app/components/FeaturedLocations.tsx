"use client";

import { useEffect, useState, useRef } from "react";
import { MapPin, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { getAppUrl } from "@/lib/utils";

interface LocationData {
  id: string;
  title: string;
  image_url: string | null;
  is_important: boolean;
  google_map_url?: string | null;
}

const CITY_FALLBACK_IMAGES: Record<string, string> = {
  kozhikode: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=800&q=80",
  kochi: "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=800&q=80",
  munnar: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
  bangalore: "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=800&q=80",
  trivandrum: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80",
  wayanad: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=800&q=80",
};

export default function FeaturedLocations() {
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [isScrollable, setIsScrollable] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const checkScrollable = () => {
    if (scrollRef.current) {
      const { scrollWidth, clientWidth } = scrollRef.current;
      setIsScrollable(scrollWidth > clientWidth + 5);
    }
  };

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    fetch(`${apiBase}/api/properties/config/locations`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setLocations(data);
        }
      })
      .catch((err) => console.error("Failed to fetch locations:", err));
  }, []);

  useEffect(() => {
    checkScrollable();
    // Add a slight timeout to ensure image & layout calculations are completed
    const timer = setTimeout(checkScrollable, 200);
    window.addEventListener("resize", checkScrollable);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", checkScrollable);
    };
  }, [locations]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const distance = 300;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -distance : distance,
        behavior: "smooth",
      });
    }
  };

  if (locations.length === 0) return null;

  return (
    <section className="w-full py-10 md:py-14 bg-[#FAF9F6] text-[#0F0F11]">
      <div className="max-w-360 mx-auto px-6 md:px-12 lg:px-20">
        {/* Header Block Centered */}
        <div className="flex flex-col items-center justify-center text-center mb-12">
          <div className="inline-flex items-center gap-2.5 mb-2">
            <span className="w-5 h-0.5 bg-[#23D283] rounded-full"></span>
            <span className="text-xs font-extrabold uppercase tracking-[0.22em] text-[#014645]">
              Popular Destinations
            </span>
            <span className="w-5 h-0.5 bg-[#23D283] rounded-full"></span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-center text-[#0F0F11]">
            Explore by Location
          </h2>
        </div>

        {/* Carousel Wrapper with Floating Arrow Keys */}
        <div className="relative group/carousel">
          {/* Arrow Buttons - Only rendered if items overflow and container is scrollable */}
          {isScrollable && (
            <>
              {/* Left Arrow Button */}
              <button
                onClick={() => scroll("left")}
                className="hidden sm:flex absolute -left-3 md:-left-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/95 backdrop-blur-md border border-slate-200 shadow-md items-center justify-center text-slate-800 hover:bg-[#014645] hover:text-white hover:border-[#014645] transition-all duration-300 cursor-pointer"
                aria-label="Scroll Left"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* Right Arrow Button */}
              <button
                onClick={() => scroll("right")}
                className="hidden sm:flex absolute -right-3 md:-right-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/95 backdrop-blur-md border border-slate-200 shadow-md items-center justify-center text-slate-800 hover:bg-[#014645] hover:text-white hover:border-[#014645] transition-all duration-300 cursor-pointer"
                aria-label="Scroll Right"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* X-Scrollable Container */}
          <div
            ref={scrollRef}
            className="w-full overflow-x-auto snap-x snap-mandatory pb-4 pt-1 scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden scroll-smooth"
          >
            <div className="flex gap-2 sm:gap-4 md:gap-5 min-w-max mx-auto justify-center px-2 sm:px-6">
              {locations.map((loc) => {
                const cityKey = loc.title.toLowerCase();
                const bgImage =
                  loc.image_url ||
                  CITY_FALLBACK_IMAGES[cityKey] ||
                  "https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=800&q=80";

                return (
                  <a
                    key={loc.id}
                    href={`${getAppUrl()}/dashboard?city=${encodeURIComponent(loc.title)}`}
                    className="group relative flex-none w-[22vw] h-[26vw] sm:w-44 sm:h-52 md:w-64 md:h-64 rounded-xl sm:rounded-2xl md:rounded-3xl overflow-hidden snap-start shadow-xs hover:shadow-xl transition-all duration-500 cursor-pointer border border-slate-200/80 bg-zinc-900"
                  >
                    {/* Background Image */}
                    <img
                      src={bgImage}
                      alt={loc.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/30 to-black/10 group-hover:from-black/90 transition-colors duration-300" />



                    {/* Bottom Title & Details */}
                    <div className="absolute inset-x-0 bottom-0 p-1.5 sm:p-4 md:p-5 z-10 flex flex-col items-center justify-end text-center">
                      <div className="hidden sm:flex items-center justify-center gap-1.5 text-[#23D283] text-xs font-semibold mb-1">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span>Kerala, India</span>
                      </div>

                      <h3 className="text-[10px] sm:text-lg md:text-2xl font-black text-white tracking-tight uppercase leading-tight group-hover:text-[#23D283] transition-colors duration-300">
                        {loc.title}
                      </h3>

                      <div className="hidden sm:flex items-center justify-center gap-1.5 mt-2 pt-2 border-t border-white/15 w-full opacity-80 group-hover:opacity-100 transition-opacity">
                        <span className="text-[11px] font-medium text-zinc-300">
                          Browse properties
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-white transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
