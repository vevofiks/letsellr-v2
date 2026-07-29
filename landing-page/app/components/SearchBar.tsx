"use client";

import { useState } from "react";
import { MapPin, Building2, Home, ChevronDown, Search } from "lucide-react";

export default function SearchBar() {
  const [location, setLocation] = useState("");
  const [purpose, setPurpose] = useState("buy");
  const [category, setCategory] = useState("house");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    // Determine target domain based on environment
    const isProd = typeof window !== "undefined" && window.location.hostname !== "localhost";
    const baseUrl = isProd ? "https://app.letsellr.in" : "http://localhost:5173";

    // Construct query parameters
    const params = new URLSearchParams();
    if (location.trim()) params.append("search", location.trim());
    if (purpose) params.append("type", purpose);
    if (category) params.append("category", category);

    const targetUrl = `${baseUrl}/?${params.toString()}`;
    
    // Redirect the user
    window.location.href = targetUrl;
  };

  return (
    <form
      onSubmit={handleSearch}
      className="w-full max-w-4xl mx-auto bg-white/95 backdrop-blur-md border border-black/10 rounded-2xl md:rounded-full shadow-2xl p-3 md:p-2 flex flex-col md:flex-row items-center gap-3 md:gap-2 transition-all duration-300 hover:shadow-emerald-900/5 hover:border-emerald-500/20"
    >
      {/* Location Input Segment */}
      <div className="w-full md:flex-1 flex items-center gap-3 px-4 py-2 border-b md:border-b-0 md:border-r border-zinc-100 last:border-0">
        <MapPin className="w-5 h-5 text-zinc-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1">
            Location
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Search city, locality..."
            className="w-full bg-transparent text-sm font-semibold text-zinc-800 placeholder-zinc-400 border-none outline-none p-0 focus:ring-0"
          />
        </div>
      </div>

      {/* Purpose Select Segment (Buy/Rent) */}
      <div className="w-full md:w-44 flex items-center gap-3 px-4 py-2 border-b md:border-b-0 md:border-r border-zinc-100 last:border-0 relative">
        <Building2 className="w-5 h-5 text-zinc-400 shrink-0" />
        <div className="flex-1 min-w-0 pr-4">
          <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1">
            Purpose
          </label>
          <select
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            className="w-full bg-transparent text-sm font-semibold text-zinc-800 border-none outline-none p-0 focus:ring-0 appearance-none cursor-pointer"
          >
            <option value="buy">Buy Property</option>
            <option value="rent">Rent Property</option>
          </select>
        </div>
        <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-4 top-1/2 -translate-y-1 pointer-events-none" />
      </div>

      {/* Property Category Select Segment */}
      <div className="w-full md:w-48 flex items-center gap-3 px-4 py-2 relative">
        <Home className="w-5 h-5 text-zinc-400 shrink-0" />
        <div className="flex-1 min-w-0 pr-4">
          <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1">
            Type
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-transparent text-sm font-semibold text-zinc-800 border-none outline-none p-0 focus:ring-0 appearance-none cursor-pointer"
          >
            <option value="house">House</option>
            <option value="villa">Villa</option>
            <option value="apartment">Apartment</option>
            <option value="commercial">Commercial</option>
          </select>
        </div>
        <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-4 top-1/2 -translate-y-1 pointer-events-none" />
      </div>

      {/* Find Property CTA Button */}
      <button
        type="submit"
        className="w-full md:w-auto bg-[#0F0F11] hover:bg-zinc-800 text-white text-xs font-bold uppercase tracking-wider px-8 py-4 rounded-xl md:rounded-full transition-all duration-300 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-lg hover:shadow-black/20 shrink-0"
      >
        <Search className="w-4 h-4" />
        <span>Find Property</span>
      </button>
    </form>
  );
}
