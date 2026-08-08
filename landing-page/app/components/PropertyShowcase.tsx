"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { BedDouble, Bath } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { getAppUrl } from "@/lib/utils";

const PRIMARY = "#23D283";

interface PropertyItem {
  id: string;
  title: string;
  category: string;
  location: string;
  price: string;
  sqft: string;
  beds: string;
  baths: string;
  intentTag: string;
  image: string;
  verified: boolean;
  isFeatured?: boolean;
}

const DEFAULT_PROPERTIES: PropertyItem[] = [
  {
    id: "prop-1",
    title: "The Horizon Coastal Villa",
    category: "Villas",
    location: "Kochi Marine Drive",
    price: "₹3.4 Cr",
    sqft: "3,800 sq.ft",
    beds: "4 Beds",
    baths: "3 Baths",
    intentTag: "For Sale",
    image: "/images/hero-villa.png",
    verified: true,
  },
  {
    id: "prop-2",
    title: "Nordic Modular Forest House",
    category: "Villas",
    location: "Munnar Hills, Kerala",
    price: "₹1.8 Cr",
    sqft: "2,400 sq.ft",
    beds: "3 Beds",
    baths: "2 Baths",
    intentTag: "For Sale",
    image: "/images/modular-cabin.png",
    verified: true,
  },
  {
    id: "prop-3",
    title: "Sunset Oceanfront Penthouse",
    category: "Apartments",
    location: "Worli, Mumbai",
    price: "₹45,000 / mo",
    sqft: "1,950 sq.ft",
    beds: "3 Beds",
    baths: "2 Baths",
    intentTag: "For Rent",
    image: "/images/coastal-penthouse.png",
    verified: true,
  },
  {
    id: "prop-4",
    title: "Emerald Heights Luxury Suite",
    category: "Apartments",
    location: "Kakkanad, Kochi",
    price: "₹85 L",
    sqft: "1,600 sq.ft",
    beds: "2 Beds",
    baths: "2 Baths",
    intentTag: "For Sale",
    image: "/images/hero-villa.png",
    verified: true,
  },
  {
    id: "prop-5",
    title: "Commercial Business Hub",
    category: "Commercial",
    location: "MG Road, Ernakulam",
    price: "₹1.2 Cr",
    sqft: "4,500 sq.ft",
    beds: "Commercial",
    baths: "4 Baths",
    intentTag: "For Sale",
    image: "/images/modular-cabin.png",
    verified: true,
  },
  {
    id: "prop-6",
    title: "Lakeside Plantation Estate",
    category: "Villas",
    location: "Kumarakom, Kerala",
    price: "₹4.5 Cr",
    sqft: "5,200 sq.ft",
    beds: "5 Beds",
    baths: "4 Baths",
    intentTag: "For Sale",
    image: "/images/coastal-penthouse.png",
    verified: true,
  },
];

const formatPriceInr = (val: number, unit?: string) => {
  if (val >= 10000000) {
    return `₹${(val / 10000000).toFixed(1)} Cr${unit === "per_month" ? " / mo" : ""}`;
  }
  if (val >= 100000) {
    return `₹${(val / 100000).toFixed(1)} L${unit === "per_month" ? " / mo" : ""}`;
  }
  return `₹${val.toLocaleString("en-IN")}${unit === "per_month" ? " / mo" : ""}`;
};

export default function PropertyShowcase() {
  const [activeTab, setActiveTab] = useState("All");
  const [propertyList, setPropertyList] = useState<PropertyItem[]>(DEFAULT_PROPERTIES);
  const headerRef = useScrollReveal<HTMLDivElement>({ y: 30, duration: 0.7 });
  const gridRef = useScrollReveal<HTMLDivElement>({ y: 50, duration: 0.7, stagger: 0.1, children: true, start: "top 85%" });

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        let res = await fetch(`${apiBase}/api/properties/featured?limit=6`);
        if (!res.ok) {
          res = await fetch(`${apiBase}/api/v1/properties/featured?limit=6`);
        }
        if (!res.ok) return;
        const data = await res.json();

        if (Array.isArray(data) && data.length > 0) {
          const mapped: PropertyItem[] = data.slice(0, 6).map((item: any) => {
            const firstPhoto =
              Array.isArray(item.photos) && item.photos.length > 0
                ? typeof item.photos[0] === "string"
                  ? item.photos[0]
                  : item.photos[0]?.photo_url || ""
                : "";

            let categoryLabel = item.category || "Villas";
            if (categoryLabel.length > 1) {
              categoryLabel = categoryLabel.charAt(0).toUpperCase() + categoryLabel.slice(1);
            }

            const intentTag = item.intent === "rent" || item.price_unit === "per_month" ? "For Rent" : "For Sale";

            return {
              id: item.id || item.ref,
              title: item.title,
              category: categoryLabel,
              location: `${item.location_area || ""}, ${item.location_city || ""}`.replace(/^,\s*/, ""),
              price: formatPriceInr(item.price, item.price_unit),
              sqft: item.area ? `${item.area.toLocaleString()} sq.ft` : "Featured",
              beds: item.bedrooms ? `${item.bedrooms} Beds` : "3 Beds",
              baths: item.bathrooms ? `${item.bathrooms} Baths` : "2 Baths",
              intentTag: intentTag,
              image: firstPhoto || "/images/hero-villa.png",
              verified: item.status === "live",
              isFeatured: item.is_featured,
            };
          });

          setPropertyList(mapped);
        }
      } catch (err) {
        // Fallback to default properties
      }
    };

    fetchFeatured();
  }, []);

  // Compute dynamic categories based on currently loaded properties
  const dynamicCategories = ["All", ...Array.from(new Set(propertyList.map((p) => p.category).filter(Boolean)))];

  const filteredProperties =
    activeTab === "All"
      ? propertyList
      : propertyList.filter((p) => p.category.toLowerCase() === activeTab.toLowerCase());

  return (
    <section id="properties" className="pt-4 pb-8 md:py-20 px-4 sm:px-6 md:px-12 lg:px-20 w-full bg-[#FAF9F6] text-[#0F0F11]">
      {/* Section Header */}
      <div ref={headerRef} className="flex flex-col items-center text-center mb-14 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2.5 mb-3">
        </div>
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#0F0F11] mb-3">
          Featured Properties
        </h2>
        <p className="text-zinc-500 text-sm font-normal leading-relaxed">
          Admin-verified properties available directly from owners across India.
        </p>
        </div>

      {/* Property Grid 3 per row (matching reference layout) */}
      <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
        {filteredProperties.map((prop) => (
          <a
            key={prop.id}
            href={`${getAppUrl()}/properties/${prop.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col cursor-pointer text-left"
          >
            {/* Image Container with rounded corners & Top-left pill badge */}
            <div className="relative aspect-[1.15/1] w-full rounded-[2.2rem] overflow-hidden bg-zinc-100 shadow-sm group-hover:shadow-xl transition-all duration-300">
              <Image
                src={prop.image}
                alt={prop.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />

              {/* Pill Tag (Top Left) Brand Verified Pill */}
              <div className="absolute top-4 left-4 z-10">
                <span className="inline-flex items-center justify-center gap-1.5 bg-[#D9F7E9]/95 backdrop-blur-xs text-[#0B6E4F] text-xs font-bold px-3.5 py-1.5 rounded-full shadow-xs leading-none border border-[#23D283]/30">
                  {prop.intentTag || "For Sale"}
                </span>
              </div>
            </div>

            {/* Content Below Image */}
            <div className="pt-3.5 px-0.5">
              {/* Specs Line: Beds · Baths */}
              <div className="flex items-center gap-2 text-xs font-medium text-zinc-600 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <BedDouble className="w-4 h-4 text-zinc-700 shrink-0" />
                  {prop.beds}
                </span>
                <span className="text-zinc-400 font-bold">·</span>
                <span className="flex items-center gap-1.5">
                  <Bath className="w-3.5 h-3.5 text-zinc-700 shrink-0" />
                  {prop.baths}
                </span>
              </div>

              {/* Title Line */}
              <h3 className="text-xl font-bold text-zinc-900 line-clamp-1 group-hover:text-[#23D283] transition-colors mb-1">
                {prop.title}
              </h3>

              {/* Price & Location Line */}
              <div className="flex items-center gap-2 text-sm truncate">
                <span className="font-extrabold text-[#0B6E4F] shrink-0">
                  {prop.price}
                </span>
                <span className="text-zinc-400 font-bold">·</span>
                <span className="text-xs text-zinc-500 font-normal truncate">
                  {prop.location}
                </span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
