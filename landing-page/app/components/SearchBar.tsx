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
import { Icon } from "@iconify/react";

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
  slug: string;
  label: string;
}

// Category values match `Property.category` exactly as stored by the backend
// (see letsellr-api/app/modules/properties/schemas.py). "PGs & Hostel" covers
// two backend categories at once the comma-separated value is understood by
// GET /api/properties?category=pg,hostel as an OR match.
const PROPERTY_TYPES: PropertyType[] = [
  { slug: "apartment", label: "Flat & Apartment" },
  { slug: "villa_house", label: "House & Villa" },
  { slug: "pg_hostel", label: "PGs & Hostel" },
  { slug: "commercial", label: "Commercial" },
  { slug: "land", label: "Land" },
  { slug: "coworking_space", label: "Coworking Space" },
];

function getCategoryIconName(slug: string) {
  if (slug === "villa_house") return "material-symbols:holiday-village-outline";
  if (slug === "apartment") return "mingcute:building-2-fill";
  if (slug === "pg_hostel") return "osmic:hostel-14";
  if (slug === "commercial") return "hugeicons:office";
  if (slug === "land") return "material-symbols-light:landscape";
  if (slug === "coworking_space") return "streamline-ultimate:office-desk-2";
  
  return "mingcute:building-1-line";
}

// ── Trigger Button ────────────────────────────────────────────────────────────
export function SearchBarTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      id="search-trigger-btn"
      type="button"
      onClick={onClick}
      className="w-full bg-white rounded-full shadow-xs shadow-green-400 border border-black/5 flex items-center px-4 py-3 transition-all duration-300 hover:shadow-sm hover:border-[#23D283]/30 cursor-pointer group"
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
  const [popularLocations, setPopularLocations] = useState<LocationSuggestion[]>([]);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const scrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const dragged = useRef(false);

  const onMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    isDragging.current = true;
    dragged.current = false;
    startX.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeft.current = scrollRef.current.scrollLeft;
  };
  const onMouseLeave = () => { isDragging.current = false; };
  const onMouseUp = () => { isDragging.current = false; };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !scrollRef.current) return;
    e.preventDefault();
    dragged.current = true;
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX.current) * 2;
    scrollRef.current.scrollLeft = scrollLeft.current - walk;
  };

  // Fetch popular locations once on mount
  useEffect(() => {
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
        const endpoint = `${apiBase}/api/properties/autocomplete/locations?q=${encodeURIComponent(query)}`;
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
          const maxSuggestions = activeTab === "agent" ? 6 : 5;
          setSuggestions(normalised.slice(0, maxSuggestions));
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
          {activeTab !== "agent" && (
            <div 
              ref={scrollRef}
              onMouseDown={onMouseDown}
              onMouseLeave={onMouseLeave}
              onMouseUp={onMouseUp}
              onMouseMove={onMouseMove}
              className="flex items-center gap-0 overflow-x-auto scrollbar-none overscroll-none touch-pan-x shrink-0 border-b border-zinc-100 px-4 pb-0 cursor-grab active:cursor-grabbing select-none"
            >
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

              {PROPERTY_TYPES.map((t) => {
                const iconName = getCategoryIconName(t.slug);
                return (
                  <button
                    key={t.slug}
                    type="button"
                    onClick={(e) => {
                      if (dragged.current) {
                        e.preventDefault();
                        e.stopPropagation();
                        return;
                      }
                      setActiveCategory(t.slug);
                    }}
                    className={`flex flex-col items-center gap-1.5 px-3 py-2.5 border-b-2 -mb-px text-[11px] font-bold whitespace-nowrap transition-all shrink-0 capitalize ${activeCategory === t.slug
                        ? "border-[#23D283] text-[#0F0F11]"
                        : "border-transparent text-zinc-400 hover:text-zinc-600"
                      }`}
                  >
                    <Icon icon={iconName} fontSize={26} />
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
  const underlineRef = useRef<HTMLDivElement>(null);
  const hasPositioned = useRef(false);

  // Tabs are equal-width, so the underline has to be re-measured on resize as
  // well as on selection — hence the shared positioning helper.
  useEffect(() => {
    const place = (animate: boolean) => {
      const activeIndex = INTENT_TABS.findIndex((t) => t.id === activeTab);
      const activeEl = tabRefs.current[activeIndex];
      const underlineEl = underlineRef.current;
      if (!activeEl || !underlineEl) return;

      const to = { x: activeEl.offsetLeft, width: activeEl.offsetWidth };
      // First paint jumps straight to position; only later changes slide.
      if (animate) gsap.to(underlineEl, { ...to, duration: 0.4, ease: "power3.out" });
      else gsap.set(underlineEl, to);
    };

    place(hasPositioned.current);
    hasPositioned.current = true;

    const onResize = () => place(false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [activeTab]);

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col items-start relative z-50">
      {/* ── Outer Intent Tabs ──
          Equal-width columns sharing the trigger's gutter: the row can never
          outgrow the viewport, so nothing gets clipped on narrow screens. */}
      <div className="w-full px-2 sm:px-0 mb-3">
        <div
          role="tablist"
          aria-label="What are you looking for"
          className="relative flex items-stretch border-b border-black/10"
        >
          {INTENT_TABS.map((tab, idx) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                ref={(el) => { tabRefs.current[idx] = el; }}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1 sm:gap-1.5 px-1 pb-2.5 pt-1 text-xs sm:text-sm font-bold tracking-tight whitespace-nowrap transition-colors duration-300 cursor-pointer ${
                  isActive
                    ? "text-[#0B6E4F]"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                <tab.icon className="w-4 h-4 shrink-0" />
                {tab.label}
              </button>
            );
          })}

          {/* Slides + resizes under the active tab (GSAP drives x / width) */}
          <div
            ref={underlineRef}
            aria-hidden="true"
            className="absolute bottom-0 left-0 h-0.75 rounded-full bg-[#23D283] pointer-events-none"
          />
        </div>
      </div>

      <div className="w-full px-2 sm:px-0">
        <SearchBarTrigger onClick={() => setOpen(true)} />
      </div>
      <SearchBarModal open={open} onClose={() => setOpen(false)} activeTab={activeTab} />
    </div>
  );
}
