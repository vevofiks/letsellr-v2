"use client";

import { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { getAppUrl } from "@/lib/utils";

interface DbPropertyType {
  id: string;
  slug: string;
  label: string;
  description: string;
  image_url?: string | null;
}

interface CategoryItem {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  image: string;
  spanClass: string;
  hasButton: boolean;
}

const DEFAULT_IMAGES: Record<string, string> = {
  flat_apartment: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1000&q=80",
  house_villa: "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1000&q=80",
  pg_hostel: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80",
  comercial: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1000&q=80",
  land: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1000&q=80",
  coworking_space: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1000&q=80",
  apartment: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1000&q=80",
  commercial: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1000&q=80",
  coworking: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1000&q=80",
  "co-working space": "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1000&q=80",
  hostel: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1000&q=80",
  land_default: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1000&q=80",
  pg: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80",
  villa: "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1000&q=80",
  villas: "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1000&q=80",
};

const DEFAULT_CATEGORIES: CategoryItem[] = [
  {
    id: "1",
    slug: "apartment",
    title: "FLAT & APARTMENT",
    subtitle: "For the luxury and semi furnished...",
    image: DEFAULT_IMAGES.apartment,
    spanClass: "col-span-1 md:col-span-2",
    hasButton: true,
  },
  {
    id: "2",
    slug: "villa_house",
    title: "HOUSE & VILLA",
    subtitle: "Luxury villas",
    image: DEFAULT_IMAGES.villa,
    spanClass: "col-span-1 md:col-span-1",
    hasButton: false,
  },
  {
    id: "3",
    slug: "pg_hostel",
    title: "PG & HOSTEL",
    subtitle: "Rent for everyone",
    image: DEFAULT_IMAGES.pg_hostel,
    spanClass: "col-span-2 md:col-span-1",
    hasButton: false,
  },
  {
    id: "4",
    slug: "commercial",
    title: "COMMERCIAL",
    subtitle: "Office use",
    image: DEFAULT_IMAGES.commercial,
    spanClass: "col-span-1 md:col-span-1",
    hasButton: false,
  },
  {
    id: "5",
    slug: "land",
    title: "LAND",
    subtitle: "Lands for any purpose",
    image: DEFAULT_IMAGES.land,
    spanClass: "col-span-1 md:col-span-1",
    hasButton: false,
  },
  {
    id: "6",
    slug: "coworking_space",
    title: "COWORKING SPACE",
    subtitle: "Explore Collection",
    image: DEFAULT_IMAGES.coworking_space,
    spanClass: "col-span-2 md:col-span-2",
    hasButton: false,
  },
];

export default function FeaturedCategories() {
  const [categories, setCategories] = useState<CategoryItem[]>(DEFAULT_CATEGORIES);
  const containerRef = useScrollReveal<HTMLDivElement>({ y: 30, duration: 0.7, stagger: 0.1, children: true });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${apiBase}/api/properties/config/types`);
        if (res.ok) {
          const data: DbPropertyType[] = await res.json();
          if (data && data.length > 0) {
            const formatted: CategoryItem[] = data.map((dbCat, index) => {
              const slugKey = dbCat.slug.toLowerCase();
              const isDesktopWide = index === 0 || index % 5 === 0;
              // Mobile bento: every 3rd item (index 2,5,8...) spans full width
              const isMobileWide = index % 3 === 2;
              const spanClass = `${isMobileWide ? "col-span-2" : "col-span-1"} ${isDesktopWide ? "md:col-span-2" : "md:col-span-1"}`;

              const categoryImage =
                dbCat.image_url ||
                DEFAULT_IMAGES[slugKey] ||
                "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1000&q=80";

              return {
                id: dbCat.id,
                slug: dbCat.slug,
                title: dbCat.label.toUpperCase(),
                subtitle: dbCat.description ? dbCat.description : "Explore Collection",
                image: categoryImage,
                spanClass,
                hasButton: index === 0,
              };
            });
            setCategories(formatted);
          }
        }
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };
    fetchCategories();
  }, []);

  return (
    <section className="py-6 md:py-10 px-4 sm:px-6 md:px-12 lg:px-20 w-full bg-[#FAF9F6] text-[#0F0F11]">
      <div className="max-w-360 mx-auto">
        {/* Header Badge & Title */}
        <div className="flex flex-col items-center text-center mb-14 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2.5 mb-3">
        </div>
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#0F0F11] mb-3">
          Featured Categories
        </h2>
        <p className="text-zinc-500 text-sm font-normal leading-relaxed">
          Explore our curated selection of premier properties across prime locations.
        </p>
        </div>

        {/* Bento Grid */}
        <div ref={containerRef} className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-2">
          {categories.map((cat) => (
            <a
              key={cat.id}
              href={`${getAppUrl()}/dashboard?category=${cat.slug}`}
              className={`group relative overflow-hidden rounded-2xl md:rounded-3xl ${cat.spanClass} ${cat.spanClass.startsWith("col-span-2") ? "h-36" : "h-44"} md:h-72 lg:h-80 flex flex-col justify-between p-4 md:p-8 cursor-pointer shadow-sm hover:shadow-2xl transition-all duration-500`}
            >
              {/* Background Image */}
              <img
                src={cat.image}
                alt={cat.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />

              {/* Gradient Overlay for high-contrast text */}
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-black/20 group-hover:from-black/85 transition-colors duration-300" />

              {/* Top Text Content */}
              <div className="relative z-10">
                <span className="hidden sm:block text-xs font-semibold text-zinc-200/90 mb-1 tracking-wide">
                  {cat.subtitle}
                </span>
                <h3 className="text-sm sm:text-xl md:text-3xl font-black tracking-tight text-white uppercase leading-tight drop-shadow-sm">
                  {cat.title}
                </h3>
              </div>

              {/* Bottom Action Button / Arrow */}
              {cat.hasButton && (
                <div className="relative z-10 flex items-center justify-between mt-auto">
                  <div
                    className="flex items-center gap-2 bg-[#333] group-hover:bg-black text-white font-extrabold text-xs uppercase tracking-wider px-4 py-2 rounded-lg transition-all duration-300 shadow-sm"
                  >
                    Explore <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              )}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}