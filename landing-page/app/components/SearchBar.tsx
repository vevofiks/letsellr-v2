"use client";

import { useState, useEffect } from "react";
import { Search, MapPin } from "lucide-react";
import { getAppUrl } from "@/lib/utils";

const INTENT_TABS = [
  { id: "rent", label: "Rent" },
  { id: "buy", label: "Buy" },
  { id: "lease", label: "Lease" },
  { id: "agent", label: "Agent" },
];

const LOCATIONS = [
  "Mumbai, Maharashtra",
  "Delhi, NCR",
  "Bangalore, Karnataka",
  "Hyderabad, Telangana",
  "Ahmedabad, Gujarat",
  "Chennai, Tamil Nadu",
  "Kolkata, West Bengal",
  "Pune, Maharashtra",
  "Jaipur, Rajasthan",
  "Kochi, Kerala",
  "Ernakulam, Kerala",
  "Trivandrum, Kerala"
];

export default function SearchBar() {
  const [activeTab, setActiveTab] = useState("buy");
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.trim().length < 2) {
        setSuggestions([]);
        return;
      }
      
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${apiBase}/api/properties/autocomplete/locations?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data);
        }
      } catch (err) {
        console.error("Error fetching locations:", err);
      }
    };
    
    const timeoutId = setTimeout(() => {
      fetchSuggestions();
    }, 250);
    
    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSearch = (locationQuery: string) => {
    const baseUrl = getAppUrl();
    const params = new URLSearchParams();
    if (locationQuery.trim()) params.append("search", locationQuery.trim());
    params.append("type", activeTab);

    const targetUrl = `${baseUrl}/dashboard/search?${params.toString()}`;
    window.location.href = targetUrl;
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col items-center">
      {/* Tabs */}
      <div className="flex items-center gap-6 mb-4 px-4 w-full justify-start overflow-x-auto custom-scrollbar">
        {INTENT_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`text-[13px] md:text-sm font-bold tracking-wide transition-all relative pb-1.5 ${
              activeTab === tab.id
                ? "text-[#0F0F11]"
                : "text-zinc-400 hover:text-zinc-600"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#23D283] rounded-t-md" />
            )}
          </button>
        ))}
      </div>

      {/* Search Input Container */}
      <div className="relative w-full">
        <form
          onSubmit={onSubmit}
          className="w-full bg-white rounded-full shadow-lg border border-black/5 flex items-center px-2 py-2 transition-all duration-300 focus-within:ring-2 focus-within:ring-[#23D283]/20 focus-within:shadow-xl"
        >
          <div className="flex-1 flex items-center pl-4">
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Search by address, suburb or city"
              className="w-full bg-transparent text-sm md:text-base font-semibold text-zinc-800 placeholder-zinc-400 border-none outline-none focus:ring-0 px-0"
            />
          </div>
          <button
            type="submit"
            className="bg-[#23D283] hover:bg-[#11995E] p-3 md:p-3.5 rounded-full text-white transition-colors flex items-center justify-center cursor-pointer ml-2 shadow-md shadow-[#23D283]/30"
          >
            <Search className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </form>

        {/* Suggestions Dropdown */}
        {showSuggestions && query.trim() !== "" && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-zinc-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            {suggestions.map((loc) => (
              <div
                key={loc}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setQuery(loc);
                  handleSearch(loc);
                }}
                className="px-5 py-3 hover:bg-zinc-50 cursor-pointer flex items-center gap-3 transition-colors text-sm font-semibold text-zinc-700"
              >
                <MapPin className="w-4 h-4 text-zinc-400" />
                <span>{loc}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
