"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface LocationData {
  id: string;
  title: string;
  image_url: string | null;
  is_important: boolean;
}

export default function FeaturedLocations() {
  const [locations, setLocations] = useState<LocationData[]>([]);

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    fetch(`${apiBase}/api/properties/config/locations`)
      .then((res) => res.json())
      .then((data) => {
        // Filter out those without images for better UI, or show all
        setLocations(data);
      })
      .catch((err) => console.error("Failed to fetch locations:", err));
  }, []);

  if (locations.length === 0) return null;

  return (
    <section className="w-full px-4 py-8 md:py-12 bg-[#FAF9F6] max-w-7xl mx-auto">
      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 md:justify-center [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {locations.map((loc) => (
          <div
            key={loc.id}
            className="relative flex-none w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden shadow-md snap-center group cursor-pointer"
          >
            {/* Background Image */}
            {loc.image_url ? (
              <Image
                src={loc.image_url}
                alt={loc.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
            ) : (
              <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                <span className="text-gray-500 text-xs">No Image</span>
              </div>
            )}
            
            {/* Dark Overlay */}
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors duration-300" />
            
            {/* Title - Top Centered */}
            <div className="absolute inset-x-0 top-0 pt-6 md:pt-8 flex items-center justify-center">
              <h3 className="text-white font-bold text-sm md:text-lg text-center px-2 drop-shadow-md">
                {loc.title}
              </h3>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
