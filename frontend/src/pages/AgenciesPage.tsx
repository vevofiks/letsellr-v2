import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Search,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Building,
  Layers,
  Navigation,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import api from "@/lib/api";
import { AppNavbar } from "@/components/AppNavbar";
import { toast } from "sonner";

interface Agency {
  id: string;
  display_name: string;
  about: string;
  logo_key: string | null;
  areas_served: string[];
  location_city: string;
  location_area: string;
  verification_status: string;
  member_since: string;
  total_listings: number;
}

interface AgencyBrowseResponse {
  results: Agency[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export const AgenciesPage: React.FC = () => {
  const navigate = useNavigate();
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("");

  // Location GPS state
  const [isLocating, setIsLocating] = useState(false);
  const [detectedCity, setDetectedCity] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAgencies, setTotalAgencies] = useState(0);

  useEffect(() => {
    const fetchAgencies = async () => {
      try {
        setLoading(true);
        const params: Record<string, any> = { page, limit: 12 };
        if (cityFilter) params.city = cityFilter;

        const res = await api.get<AgencyBrowseResponse>("/api/agencies", { params });
        setAgencies(res.data.results || []);
        setTotalPages(res.data.total_pages || 1);
        setTotalAgencies(res.data.total || 0);
      } catch (err) {
        console.error("Failed to load agencies:", err);
        toast.error("Could not fetch agencies directory.");
      } finally {
        setLoading(false);
      }
    };

    fetchAgencies();
  }, [cityFilter, page]);

  // Handle GPS location click
  const handleGPSLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    toast.info("Accessing GPS location...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          // Reverse geocode via OpenStreetMap Nominatim
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          const address = data.address || {};
          const city =
            address.city ||
            address.town ||
            address.village ||
            address.county ||
            address.state_district;

          if (city) {
            setDetectedCity(city);
            setCityFilter(city);
            setPage(1);
            toast.success(`Found location: ${city}`);
          } else {
            toast.error("Unable to determine city from GPS coordinates.");
          }
        } catch (err) {
          console.error("Geocoding error:", err);
          toast.error("Failed to resolve city from GPS location.");
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.error("Geolocation position error:", error);
        setIsLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          toast.error("Location permission denied. Please select a city manually.");
        } else {
          toast.error("Unable to retrieve GPS position.");
        }
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  };

  const clearLocationFilter = () => {
    setDetectedCity(null);
    setCityFilter("");
    setPage(1);
  };

  // Client side search query filtering over current page items
  const filteredAgencies = agencies.filter((agency) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const nameMatch = agency.display_name.toLowerCase().includes(query);
    const cityMatch = agency.location_city.toLowerCase().includes(query);
    const areaMatch = agency.location_area.toLowerCase().includes(query);
    const servedMatch = agency.areas_served.some((area) =>
      area.toLowerCase().includes(query)
    );
    return nameMatch || cityMatch || areaMatch || servedMatch;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <AppNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Hero Banner Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-brand-green rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-96 h-96 bg-brand-green/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold text-teal-300 border border-white/10">
              <Building2 className="h-4 w-4" />
              Verified Partner Network
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
              Real Estate Agencies &amp; Brokers
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-medium">
              Explore trusted real estate partners, view verified credentials, and browse exclusive property listings directly from licensed agencies.
            </p>
          </div>
        </div>

        {/* Search & Filter Section */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200/80 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search agencies by name, location, or area..."
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-brand-green transition-colors text-slate-800 placeholder-slate-400"
              />
            </div>

            {/* City Filter & GPS Button */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-48">
                <select
                  value={cityFilter}
                  onChange={(e) => {
                    setCityFilter(e.target.value);
                    setDetectedCity(null);
                    setPage(1);
                  }}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-brand-green cursor-pointer appearance-none"
                >
                  <option value="">All Cities</option>
                  <option value="Kochi">Kochi</option>
                  <option value="Trivandrum">Trivandrum</option>
                  <option value="Calicut">Calicut</option>
                  <option value="Kottayam">Kottayam</option>
                  <option value="Thrissur">Thrissur</option>
                </select>
              </div>

              {/* Location GPS Finder Button */}
              <button
                onClick={handleGPSLocation}
                disabled={isLocating}
                title="Find agencies near your current GPS location"
                className="flex items-center gap-2 px-4 py-3 bg-teal-50 border border-teal-200 text-brand-green font-extrabold text-xs rounded-xl hover:bg-teal-100 transition-colors shrink-0 cursor-pointer disabled:opacity-50"
              >
                {isLocating ? (
                  <Loader2 className="h-4 w-4 animate-spin text-brand-green" />
                ) : (
                  <Navigation className="h-4 w-4 text-brand-green" />
                )}
                <span className="hidden sm:inline">Near Me</span>
              </button>
            </div>
          </div>

          {/* Active GPS Location Badge */}
          {detectedCity && (
            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-full text-xs font-extrabold">
              <MapPin className="h-3.5 w-3.5 text-brand-green" />
              <span>Agencies near location: <strong>{detectedCity}</strong></span>
              <button
                onClick={clearLocationFilter}
                className="hover:bg-emerald-100 p-0.5 rounded-full transition-colors cursor-pointer"
              >
                <X className="h-3.5 w-3.5 text-emerald-700" />
              </button>
            </div>
          )}
        </div>

        {/* Agency Listing Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm animate-pulse space-y-4"
              >
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-slate-200" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-32 bg-slate-200 rounded" />
                    <div className="h-3 w-20 bg-slate-100 rounded" />
                  </div>
                </div>
                <div className="h-16 bg-slate-50 rounded-2xl" />
                <div className="h-10 bg-slate-200 rounded-xl" />
              </div>
            ))}
          </div>
        ) : filteredAgencies.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm space-y-4 max-w-md mx-auto my-8">
            <div className="h-16 w-16 bg-teal-50 text-brand-green rounded-full flex items-center justify-center mx-auto">
              <Building className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900">No agencies found</h3>
            <p className="text-xs text-slate-500 font-medium">
              We couldn't find any real estate agencies matching your current search or location criteria.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                clearLocationFilter();
              }}
              className="px-5 py-2.5 bg-brand-green text-white font-extrabold text-xs rounded-full shadow-sm hover:bg-brand-green-hover transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAgencies.map((agency) => {
                const initials = agency.display_name
                  ? agency.display_name
                      .split(" ")
                      .slice(0, 2)
                      .map((w) => w[0])
                      .join("")
                      .toUpperCase()
                  : "AG";

                const isVerified = agency.verification_status === "verified";

                return (
                  <div
                    key={agency.id}
                    onClick={() => navigate(`/agencies/${agency.id}`)}
                    className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between group"
                  >
                    <div className="space-y-4">
                      {/* Header: Logo + Verified Badge */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3.5">
                          {agency.logo_key ? (
                            <img
                              src={agency.logo_key}
                              alt={agency.display_name}
                              className="h-14 w-14 rounded-2xl object-cover border border-slate-100 shadow-sm shrink-0"
                            />
                          ) : (
                            <div className="h-14 w-14 rounded-2xl bg-slate-900 text-white font-black text-lg flex items-center justify-center shadow-inner shrink-0">
                              {initials}
                            </div>
                          )}
                          <div>
                            <h3 className="font-extrabold text-slate-900 text-base group-hover:text-brand-green transition-colors line-clamp-1">
                              {agency.display_name}
                            </h3>
                            <div className="flex items-center gap-1 text-slate-500 text-xs font-medium mt-0.5">
                              <MapPin className="h-3.5 w-3.5 text-brand-green shrink-0" />
                              <span>
                                {agency.location_area
                                  ? `${agency.location_area}, ${agency.location_city}`
                                  : agency.location_city}
                              </span>
                            </div>
                          </div>
                        </div>

                        {isVerified && (
                          <div
                            className="p-1.5 rounded-full bg-teal-50 text-brand-green border border-teal-100 shrink-0"
                            title="Verified Partner Agency"
                          >
                            <ShieldCheck className="h-4 w-4" />
                          </div>
                        )}
                      </div>

                      {/* About snippet */}
                      {agency.about && (
                        <p className="text-xs text-slate-600 font-normal line-clamp-2 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100">
                          {agency.about}
                        </p>
                      )}

                      {/* Areas Served Tags */}
                      {agency.areas_served && agency.areas_served.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Areas Served
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {agency.areas_served.slice(0, 3).map((area, idx) => (
                              <span
                                key={idx}
                                className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-[10px] font-bold"
                              >
                                {area}
                              </span>
                            ))}
                            {agency.areas_served.length > 3 && (
                              <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded-full text-[10px] font-bold">
                                +{agency.areas_served.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer Stats & Button */}
                    <div className="pt-4 mt-6 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-900">
                        <Layers className="h-4 w-4 text-brand-green" />
                        <span>{agency.total_listings} Listings</span>
                      </div>

                      <div className="flex items-center gap-1 text-xs font-black text-brand-green group-hover:translate-x-0.5 transition-transform">
                        View Profile <ArrowRight className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 shadow-xs">
                <span className="text-xs font-extrabold text-slate-500">
                  Showing Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalAgencies} total agencies)
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (page > 1) {
                        setPage(page - 1);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }
                    }}
                    disabled={page === 1}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-slate-700 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => {
                          setPage(p);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className={`h-8 w-8 rounded-xl text-xs font-black transition-colors cursor-pointer ${
                          page === p
                            ? "bg-brand-green text-white shadow-xs"
                            : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      if (page < totalPages) {
                        setPage(page + 1);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }
                    }}
                    disabled={page >= totalPages}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-slate-700 transition-colors cursor-pointer"
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};
export default AgenciesPage;
