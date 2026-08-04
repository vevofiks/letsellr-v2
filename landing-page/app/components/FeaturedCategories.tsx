"use client";
import { useState, useEffect } from "react";
import { getAppUrl } from "@/lib/utils";
import { useScrollReveal } from "@/hooks/useScrollReveal";

interface DbPropertyType {
  id: string;
  slug: string;
  label: string;
  description: string;
  image_url?: string;
}

interface Category {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  spanClass: string;
  hasButton: boolean;
  slug: string;
}

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1000&q=80",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1000&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80",
  "https://images.unsplash.com/photo-1600607687931-ce09059eeffa?auto=format&fit=crop&w=1000&q=80",
  "https://images.unsplash.com/photo-1600566753086-00f18efc2293?auto=format&fit=crop&w=1000&q=80",
  "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1000&q=80"
];

export default function FeaturedCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const containerRef = useScrollReveal<HTMLDivElement>({ y: 30, duration: 0.7, stagger: 0.1, children: true });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${apiBase}/api/properties/config/types`);
        if (res.ok) {
          const data: DbPropertyType[] = await res.json();
          
          const formatted: Category[] = data.map((dbCat, index) => {
            const isWide = index === 0 || (index + 1) % 6 === 0;
            const spanClass = isWide ? "col-span-2 md:col-span-2" : "col-span-1 md:col-span-1";
            
            const categoryImage =
              dbCat.image_url ||
              FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
            
            return {
              id: dbCat.id,
              slug: dbCat.slug,
              title: dbCat.label.toUpperCase(),
              subtitle: dbCat.description ? dbCat.description : "Explore Collection",
              image: categoryImage,
              spanClass,
              hasButton: isWide
            };
          });
          
          setCategories(formatted);
        }
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };
    fetchCategories();
  }, []);

  if (categories.length === 0) return null;

  return (
    <section className="py-6 md:py-24 px-4 sm:px-6 md:px-12 lg:px-20 w-full bg-[#FAF9F6] text-[#0F0F11]">
      <div className="max-w-[1600px] mx-auto">
        {/* Header Badge & Title */}
        <div className="flex flex-col items-center justify-center text-center mb-6 md:mb-12">
          <div className="inline-flex items-center gap-2 mb-1.5 md:mb-3">
            <span className="w-4 md:w-5 h-0.5 bg-[#23D283] rounded-full"></span>
            <span className="text-[10px] md:text-xs font-extrabold uppercase tracking-[0.22em] text-[#014645]">
              Featured Categories
            </span>
            <span className="w-4 md:w-5 h-0.5 bg-[#23D283] rounded-full"></span>
          </div>
          <h2 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-center text-[#0F0F11]">
            Explore Collections
          </h2>
        </div>

        {/* Bento Grid */}
        <div ref={containerRef} className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-3">
          {categories.map((cat) => (
            <a
              key={cat.id}
              href={`${getAppUrl()}/properties?q=${cat.slug}`}
              target="_blank"
              rel="noopener noreferrer"
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

              {/* Top Content */}
              <div className="relative z-10 w-full flex justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="bg-white/20 backdrop-blur-md p-2 rounded-full border border-white/30">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </div>
              </div>

              {/* Text Content */}
              <div className="relative z-10 flex flex-col items-start w-full">
                <span className="text-[10px] md:text-sm font-medium mb-1 text-white/80">
                  {cat.subtitle}
                </span>
                <h3 className="text-lg md:text-3xl font-black tracking-tight uppercase leading-none text-white">
                  {cat.title}
                </h3>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}