"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Search, MapPin, X, ChevronRight,
  Building2, Home, FileText, LayoutGrid,
  Bed, Map as MapIcon,
} from "lucide-react";
import gsap from "gsap";
import { getAppUrl } from "@/lib/utils";

const INTENT_TABS = [
  { id: "rent", label: "Rent", icon: FileText, description: "Find properties for rent" },
  { id: "buy", label: "Buy", icon: Home, description: "Find properties for sale" },
  { id: "lease", label: "Lease", icon: FileText, description: "Find properties for lease" },
  { id: "agent", label: "Agents", icon: Building2, description: "Find verified agencies" },
] as const;

type IntentId = typeof INTENT_TABS[number]["id"];

interface LocationSuggestion {
  label: string;
  subtext?: string;
}

interface PropertyType {
  id: string;
  slug: string;
  label: string;
}

function getCategoryIcon(slug: string) {
  if (slug === "villa" || slug === "villas") return Home;
  if (slug === "hostel" || slug === "pg") return Bed;
  if (slug === "commercial" || slug === "land") return MapIcon;
  return Building2;
}

// ── Trigger Button ────────────────────────────────────────────────────────────
export function SearchBarTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      id="search-trigger-btn"
      type="button"
      onClick={onClick}
      className="w-full bg-white rounded-full shadow-lg border border-black/5 flex items-center px-4 py-3 transition-all duration-300 hover:shadow-xl hover:border-[#23D283]/30 cursor-pointer group"
    >
      <Search className="w-4 h-4 text-zinc-400 group-hover:text-[#23D283] transition-colors mr-3 shrink-0" />
      <span className="flex-1 text-sm font-semibold text-zinc-400 text-left">
        Search Landmark...
      </span>
      <span className="bg-[#23D283] p-1.5 rounded-full ml-2 shrink-0">
        <ChevronRight className="w-3.5 h-3.5 text-white" />
      </span>
    </button>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function SearchBarModal({ open, onClose, activeTab }: { open: boolean; onClose: () => void; activeTab: IntentId }) {
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [popularLocations, setPopularLocations] = useState<LocationSuggestion[]>([]);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Fetch property types and popular locations once on mount
  useEffect(() => {
    fetch(`${apiBase}/api/properties/config/types`)
      .then((res) => res.ok ? res.json() : [])
      .then((data) => {
        if (Array.isArray(data)) setPropertyTypes(data);
      })
      .catch(() => { });

    fetch(`${apiBase}/api/properties/config/locations`)
      .then((res) => res.ok ? res.json() : [])
      .then((data) => {
        if (Array.isArray(data)) {
          const locs = data.map((d: any) => ({
            label: d.title.charAt(0).toUpperCase() + d.title.slice(1),
            subtext: "Popular City"
          }));
          setPopularLocations(locs);
        }
      })
      .catch(() => { });
  }, [apiBase]);

  // Focus input when modal opens
  useEffect(() => {
    if (open) {
      setQuery("");
      setSuggestions([]);
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [open]);

  // Keyboard close
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // Lock body scroll when modal open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Fetch autocomplete suggestions from API
  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const id = setTimeout(async () => {
      try {
        const endpoint =
          activeTab === "agent"
            ? `${apiBase}/api/agencies/autocomplete?q=${encodeURIComponent(query)}`
            : `${apiBase}/api/properties/autocomplete/locations?q=${encodeURIComponent(query)}`;
        const res = await fetch(endpoint);
        if (res.ok) {
          const data = await res.json();
          const normalised: LocationSuggestion[] = Array.isArray(data)
            ? data.map((item: any) =>
              typeof item === "string"
                ? { label: item }
                : {
                  label: item.label || item.display_name || item.name || "",
                  subtext: item.subtext || item.location_city,
                }
            )
            : [];
          setSuggestions(normalised.slice(0, 6));
          setShowSuggestions(true);
        }
      } catch {
        // silently ignore
      }
    }, 260);
    return () => clearTimeout(id);
  }, [query, activeTab, apiBase]);

  const navigate = (locationQuery: string) => {
    const baseUrl = getAppUrl();
    const params = new URLSearchParams();
    if (locationQuery.trim()) params.append("city", locationQuery.trim());
    params.append("intent", activeTab);
    if (activeCategory) params.append("category", activeCategory);
    window.location.href = `${baseUrl}/properties?${params.toString()}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(query);
  };

  const handleSelectSuggestion = (loc: LocationSuggestion) => {
    setQuery(loc.label);
    setShowSuggestions(false);
    navigate(loc.label);
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!open || !mounted) return null;

  const modalContent = (
    <>
      {/* Full-screen overlay */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search properties"
        className="fixed inset-0 flex items-start justify-center animate-in fade-in duration-200"
        style={{ zIndex: 99999 }}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Modal Card */}
        <div className="relative flex flex-col bg-white overflow-hidden w-full h-dvh sm:h-auto sm:max-h-[90vh] sm:w-130 sm:rounded-2xl sm:shadow-2xl sm:mt-20">

          {/* ── Modal Header ── */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 shrink-0">
            <div>
               <p className="text-sm font-bold text-zinc-800">
                 {INTENT_TABS.find((t) => t.id === activeTab)?.label}
               </p>
               <p className="text-[11px] font-medium text-zinc-400">
                 {INTENT_TABS.find((t) => t.id === activeTab)?.description}
               </p>
            </div>
            <button
              id="search-modal-close"
              type="button"
              onClick={onClose}
              className="p-2 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer shrink-0"
              aria-label="Close search"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* ── Category Type Tabs (hidden for agents) ── */}
          {activeTab !== "agent" && propertyTypes.length > 0 && (
            <div className="flex items-center gap-0 overflow-x-auto scrollbar-none shrink-0 border-b border-zinc-100 px-4 pb-0">
              {/* All
              <button
                type="button"
                onClick={() => setActiveCategory("")}
                className={`flex flex-col items-center gap-1 px-3 py-2.5 border-b-2 -mb-px text-[11px] font-bold whitespace-nowrap transition-all shrink-0 ${!activeCategory
                    ? "border-[#23D283] text-[#0F0F11]"
                    : "border-transparent text-zinc-400 hover:text-zinc-600"
                  }`}
              >
                <LayoutGrid className="w-4 h-4" />
                All
              </button> */}

              {propertyTypes.map((t) => {
                const Icon = getCategoryIcon(t.slug);
                return (
                  <button
                    key={t.slug}
                    type="button"
                    onClick={() => setActiveCategory(t.slug)}
                    className={`flex flex-col items-center gap-1 px-3 py-2.5 border-b-2 -mb-px text-[11px] font-bold whitespace-nowrap transition-all shrink-0 capitalize ${activeCategory === t.slug
                        ? "border-[#23D283] text-[#0F0F11]"
                        : "border-transparent text-zinc-400 hover:text-zinc-600"
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    {t.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* ── Search Input ── */}
          <div className="px-4 py-3 shrink-0">
            <form onSubmit={handleSubmit} className="relative">
              <div className="w-full bg-zinc-50 border border-zinc-200 rounded-xl flex items-center px-3 py-2.5 gap-3 transition-all duration-200 focus-within:border-[#23D283] focus-within:ring-2 focus-within:ring-[#23D283]/15 focus-within:bg-white">
                <Search className="w-4 h-4 text-zinc-400 shrink-0" />
                <input
                  ref={inputRef}
                  id="search-modal-input"
                  type="text"
                  value={query}
                  autoComplete="off"
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => query.trim().length >= 2 && setShowSuggestions(true)}
                  placeholder={
                    activeTab === "agent"
                      ? "Search agency name or city…"
                      : "City, suburb, ZIP code or area…"
                  }
                  className="flex-1 bg-transparent text-sm font-semibold text-zinc-800 placeholder-zinc-400 border-none outline-none focus:ring-0"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      setSuggestions([]);
                      inputRef.current?.focus();
                    }}
                    className="text-zinc-400 hover:text-zinc-600 cursor-pointer shrink-0 transition-colors"
                    aria-label="Clear"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSearching}
                  className="bg-[#23D283] hover:bg-[#11995E] disabled:opacity-60 p-2 rounded-lg text-white transition-colors flex items-center justify-center cursor-pointer shadow-sm shadow-[#23D283]/30 shrink-0"
                  aria-label="Search"
                >
                  {isSearching ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* ── Suggestions List ── */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-6">
            {query.trim().length < 2 && popularLocations.length > 0 ? (
              <div className="divide-y divide-zinc-50">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 mb-2 mt-2 px-1">
                  Popular Locations
                </p>
                {popularLocations.map((loc, i) => (
                  <button
                    key={i}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelectSuggestion(loc);
                    }}
                    className="w-full flex items-center gap-3 py-3 px-1 hover:bg-zinc-50 rounded-xl cursor-pointer transition-colors text-left group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-zinc-100 group-hover:bg-[#23D283]/10 flex items-center justify-center shrink-0 transition-colors">
                      <MapPin className="w-4 h-4 text-zinc-400 group-hover:text-[#23D283] transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-zinc-800 truncate">{loc.label}</p>
                      {loc.subtext && (
                        <p className="text-[11px] text-zinc-400 font-medium truncate">{loc.subtext}</p>
                      )}
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-300 group-hover:text-[#23D283] shrink-0 transition-colors" />
                  </button>
                ))}
              </div>
            ) : showSuggestions && suggestions.length > 0 ? (
              <div className="divide-y divide-zinc-50">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 mb-2 mt-2 px-1">
                  Suggestions
                </p>
                {suggestions.map((loc, i) => (
                  <button
                    key={i}
                    type="button"
                    id={`suggestion-${i}`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelectSuggestion(loc);
                    }}
                    className="w-full flex items-center gap-3 py-3 px-1 hover:bg-zinc-50 rounded-xl cursor-pointer transition-colors text-left group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-zinc-100 group-hover:bg-[#23D283]/10 flex items-center justify-center shrink-0 transition-colors">
                      <MapPin className="w-4 h-4 text-zinc-400 group-hover:text-[#23D283] transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-zinc-800 truncate">{loc.label}</p>
                      {loc.subtext && (
                        <p className="text-[11px] text-zinc-400 font-medium truncate">{loc.subtext}</p>
                      )}
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-300 group-hover:text-[#23D283] shrink-0 transition-colors" />
                  </button>
                ))}
              </div>
            ) : query.trim().length >= 2 && suggestions.length === 0 ? (
              <div className="text-center py-10 text-zinc-400">
                <MapPin className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm font-semibold">No locations found for &ldquo;{query}&rdquo;</p>
                <p className="text-xs mt-1 opacity-70">Try a city, area or landmark name</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}

// ── Default Export: combined trigger + modal ──────────────────────────────────
export default function SearchBar() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<IntentId>("rent");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const bubbleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const activeIndex = INTENT_TABS.findIndex((t) => t.id === activeTab);
    const activeEl = tabRefs.current[activeIndex];
    const bubbleEl = bubbleRef.current;
    
    if (activeEl && bubbleEl) {
      gsap.to(bubbleEl, {
        x: activeEl.offsetLeft,
        width: activeEl.offsetWidth,
        duration: 0.5,
        ease: "power4.out",
      });
    }
  }, [activeTab]);

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col items-start relative z-50">
      <style>{`
        .search-intent-bubble {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          border-radius: 9999px;
          background-color: rgba(35, 210, 131, 0.15);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(35, 210, 131, 0.3);
          pointer-events: none;
          z-index: 0;
          /* Setting initial x so it doesn't jump from 0 on first render if rent is not index 0 */
        }
        .search-intent-bubble::after {
          content: "";
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
          border-width: 8px 8px 0;
          border-style: solid;
          border-color: rgba(35, 210, 131, 0.5) transparent transparent transparent;
        }
      `}</style>

      {/* ── Outer Intent Tabs ── */}
      <div className="relative flex bg-white/20 backdrop-blur-md p-1 sm:p-1.5 rounded-full mb-2 shadow-none gap-1 ml-2 sm:ml-4 z-10">
        <div ref={bubbleRef} className="search-intent-bubble" />
        
        {INTENT_TABS.map((tab, idx) => (
          <button
            key={tab.id}
            ref={(el) => { tabRefs.current[idx] = el; }}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`relative z-10 flex items-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold transition-colors duration-300 cursor-pointer ${
              activeTab === tab.id
                ? "text-[#0B6E4F]"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="w-full px-2 sm:px-0">
        <SearchBarTrigger onClick={() => setOpen(true)} />
      </div>
      <SearchBarModal open={open} onClose={() => setOpen(false)} activeTab={activeTab} />
    </div>
  );
}
