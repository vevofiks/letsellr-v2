"use client";

import { useState, useRef, useEffect } from "react";
import { MapPin, Building2, Home, ChevronDown, Search, Check } from "lucide-react";

const PURPOSE_OPTIONS = [
  { value: "buy", label: "Buy Property" },
  { value: "rent", label: "Rent Property" },
];

const CATEGORY_OPTIONS = [
  { value: "house", label: "House" },
  { value: "villa", label: "Villa" },
  { value: "apartment", label: "Apartment" },
  { value: "commercial", label: "Commercial" },
];

export default function SearchBar() {
  const [location, setLocation] = useState("");
  const [purpose, setPurpose] = useState("buy");
  const [category, setCategory] = useState("house");

  const [purposeOpen, setPurposeOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);

  const purposeRef = useRef<HTMLDivElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (purposeRef.current && !purposeRef.current.contains(e.target as Node)) {
        setPurposeOpen(false);
      }
      if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) {
        setCategoryOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    const isProd = typeof window !== "undefined" && window.location.hostname !== "localhost";
    const baseUrl = isProd ? "https://app.letsellr.in" : "http://localhost:5173";

    const params = new URLSearchParams();
    if (location.trim()) params.append("search", location.trim());
    if (purpose) params.append("type", purpose);
    if (category) params.append("category", category);

    const targetUrl = `${baseUrl}/?${params.toString()}`;
    window.location.href = targetUrl;
  };

  const currentPurposeLabel = PURPOSE_OPTIONS.find((o) => o.value === purpose)?.label || "Buy Property";
  const currentCategoryLabel = CATEGORY_OPTIONS.find((o) => o.value === category)?.label || "House";

  return (
    <form
      onSubmit={handleSearch}
      className="w-full max-w-4xl mx-auto bg-white/95 backdrop-blur-md border border-black/10 rounded-2xl md:rounded-full shadow-2xl p-3 md:p-2 flex flex-col md:flex-row items-center gap-3 md:gap-2 transition-all duration-300 hover:shadow-emerald-900/5 hover:border-[#23D283]/30"
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

      {/* Purpose Custom Dropdown Segment */}
      <div
        ref={purposeRef}
        className="w-full md:w-48 flex items-center gap-3 px-4 py-2 border-b md:border-b-0 md:border-r border-zinc-100 relative cursor-pointer group"
        onClick={() => {
          setPurposeOpen(!purposeOpen);
          setCategoryOpen(false);
        }}
      >
        <Building2 className="w-5 h-5 text-zinc-400 group-hover:text-[#23D283] transition-colors shrink-0" />
        <div className="flex-1 min-w-0 pr-2">
          <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1">
            Purpose
          </label>
          <div className="text-sm font-semibold text-zinc-800 truncate">
            {currentPurposeLabel}
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${
            purposeOpen ? "rotate-180 text-[#23D283]" : ""
          }`}
        />

        {/* Custom Dropdown Popup */}
        {purposeOpen && (
          <div className="absolute top-full left-0 mt-3 w-52 bg-white rounded-2xl shadow-xl border border-zinc-100 p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            {PURPOSE_OPTIONS.map((opt) => (
              <div
                key={opt.value}
                onClick={(e) => {
                  e.stopPropagation();
                  setPurpose(opt.value);
                  setPurposeOpen(false);
                }}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  purpose === opt.value
                    ? "bg-[#D9F7E9] text-[#0B6E4F]"
                    : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
                }`}
              >
                <span>{opt.label}</span>
                {purpose === opt.value && <Check className="w-3.5 h-3.5 text-[#23D283]" />}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Property Category Custom Dropdown Segment */}
      <div
        ref={categoryRef}
        className="w-full md:w-52 flex items-center gap-3 px-4 py-2 relative cursor-pointer group"
        onClick={() => {
          setCategoryOpen(!categoryOpen);
          setPurposeOpen(false);
        }}
      >
        <Home className="w-5 h-5 text-zinc-400 group-hover:text-[#23D283] transition-colors shrink-0" />
        <div className="flex-1 min-w-0 pr-2">
          <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1">
            Type
          </label>
          <div className="text-sm font-semibold text-zinc-800 truncate">
            {currentCategoryLabel}
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${
            categoryOpen ? "rotate-180 text-[#23D283]" : ""
          }`}
        />

        {/* Custom Dropdown Popup */}
        {categoryOpen && (
          <div className="absolute top-full left-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-zinc-100 p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            {CATEGORY_OPTIONS.map((opt) => (
              <div
                key={opt.value}
                onClick={(e) => {
                  e.stopPropagation();
                  setCategory(opt.value);
                  setCategoryOpen(false);
                }}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  category === opt.value
                    ? "bg-[#D9F7E9] text-[#0B6E4F]"
                    : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
                }`}
              >
                <span>{opt.label}</span>
                {category === opt.value && <Check className="w-3.5 h-3.5 text-[#23D283]" />}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Find Property CTA Button */}
      <button
        type="submit"
        className="w-full md:w-auto bg-[#23D283] hover:bg-[#11995E] text-white text-xs font-bold uppercase tracking-wider px-8 py-4 rounded-xl md:rounded-full transition-all duration-300 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-lg shadow-[#23D283]/25 shrink-0"
      >
        <Search className="w-4 h-4 text-white" />
        <span>Find Property</span>
      </button>
    </form>
  );
}
