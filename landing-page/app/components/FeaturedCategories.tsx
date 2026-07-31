"use client";
import { useState, useEffect } from "react";

import Image from "next/image";
import { ArrowRight, Building2, Tent, Briefcase, Map, LucideIcon } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

type CategoryType = "isolated-image" | "full-photo" | "icon";

interface DbPropertyType {
  id: string;
  slug: string;
  label: string;
  description: string;
}

interface Category {
  id: string;
  title: string;
  subtitle: string;
  type: CategoryType;
  image?: string;
  icon?: LucideIcon;
  bgClass: string;
  spanClass: string;
  hasButton: boolean;
  textColorClass?: string;
  iconColorClass?: string;
  slug: string;
}

const STYLE_MAPPINGS: Record<string, Partial<Category>> = {
  villas: { type: "isolated-image", image: "/images/isolated-villa-wbg.png", icon: Building2 },
  apartment: { type: "icon", icon: Building2 },
  commercial: { type: "icon", icon: Briefcase },
  land: { type: "icon", icon: Map },
  pg: { type: "icon", icon: Tent },
  hostel: { type: "icon", icon: Building2 }
};

const BACKGROUNDS = [
  { bgClass: "bg-[#F3F4F6]", iconColorClass: "text-[#e5e7eb]" }, // Gray
  { bgClass: "bg-[#E0F2FE]", iconColorClass: "text-[#bae6fd]" }, // Blue
  { bgClass: "bg-[#FEF9C3]", iconColorClass: "text-[#fef08a]" }, // Yellow
  { bgClass: "bg-[#FCE7F3]", iconColorClass: "text-[#fbcfe8]" }, // Pink
  { bgClass: "bg-[#DCFCE7]", iconColorClass: "text-[#bbf7d0]" }, // Green
  { bgClass: "bg-[#FFEDD5]", iconColorClass: "text-[#fed7aa]" }, // Orange
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
            const style = STYLE_MAPPINGS[dbCat.slug.toLowerCase()] || { type: "icon", icon: Building2 };
            const bg = BACKGROUNDS[index % BACKGROUNDS.length];
            
            // Layout logic: make first and every 6th item wide
            const isWide = index === 0 || (index + 1) % 6 === 0;
            const spanClass = isWide ? "md:col-span-2" : "md:col-span-1";
            
            return {
              id: dbCat.id,
              slug: dbCat.slug,
              title: dbCat.label,
              subtitle: dbCat.description ? dbCat.description.split(" ").slice(0, 3).join(" ") + "..." : "Explore Collection",
              type: style.type || "icon",
              image: style.image,
              icon: style.icon,
              bgClass: bg.bgClass,
              iconColorClass: bg.iconColorClass,
              spanClass,
              hasButton: isWide
            } as Category;
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
    <section className="py-16 px-6 md:px-12 lg:px-20 w-full bg-[#FAF9F6] text-[#0F0F11]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center mb-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.15em] uppercase bg-[#D9F7E9] text-[#0B6E4F] mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#23D283]"></span>
            Featured Categories
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-center">
            Explore Collections
          </h2>
        </div>
        
        <div ref={containerRef} className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
          {categories.map((cat) => {
            const isWhiteText = cat.textColorClass === "text-white";
            
            return (
              <div 
                key={cat.id}
                className={`group relative overflow-hidden rounded-3xl ${cat.bgClass} ${cat.spanClass} h-64 md:h-72 lg:h-80 flex flex-col justify-between p-6 md:p-8 cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300`}
              >
                {/* Full Photo Background */}
                {cat.type === "full-photo" && cat.image && (
                  <>
                    <Image
                      src={cat.image}
                      alt={cat.title}
                      fill
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                    />
                    {/* Gradient Overlay for text readability */}
                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent"></div>
                  </>
                )}

                {/* Text Content */}
                <div className={`relative z-10 flex flex-col items-start ${cat.spanClass.includes("col-span-2") ? 'max-w-[45%] md:max-w-[50%]' : 'max-w-[85%]'}`}>
                  <span className={`text-sm font-medium mb-1 ${isWhiteText ? 'text-zinc-300' : 'text-zinc-600'}`}>
                    {cat.subtitle}
                  </span>
                  <h3 className={`text-2xl md:text-3xl font-black tracking-tight uppercase leading-none ${isWhiteText ? 'text-white' : 'text-zinc-900'}`}>
                    {cat.title}
                  </h3>
                  
                  {cat.hasButton && (
                    <button className={`mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded transition-colors ${
                      isWhiteText 
                        ? 'bg-white text-black hover:bg-zinc-200' 
                        : 'bg-[#444] text-white hover:bg-black'
                    }`}>
                      Explore <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                {/* Isolated Image Render */}
                {cat.type === "isolated-image" && cat.image && (
                  <div className={`absolute right-0 bottom-0 ${cat.spanClass.includes("col-span-2") ? 'w-[65%] h-full' : 'w-full h-[75%]'} mix-blend-multiply flex items-end justify-end group-hover:scale-105 transition-transform duration-700 ease-out origin-bottom-right`}>
                    <div className={`relative w-full h-full ${cat.spanClass.includes("col-span-2") ? 'pr-4 pb-4 md:pr-8 md:pb-8' : 'px-4 pb-4 md:px-6 md:pb-6'}`}>
                      <Image
                        src={cat.image}
                        alt={cat.title}
                        fill
                        className={`object-contain ${cat.spanClass.includes("col-span-2") ? 'object-bottom-right' : 'object-bottom'} drop-shadow-md`}
                      />
                    </div>
                  </div>
                )}

                {/* Icon Render */}
                {cat.type === "icon" && cat.icon && (
                  <div className={`absolute -right-6 -bottom-6 md:-right-10 md:-bottom-10 mix-blend-multiply group-hover:scale-110 transition-transform duration-700 ease-out origin-bottom-right ${cat.iconColorClass || 'text-zinc-200'}`}>
                    <cat.icon className="w-48 h-48 md:w-64 md:h-64 opacity-50" strokeWidth={1} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
