import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { AppNavbar } from "@/components/AppNavbar";

import { 
  Home, 
  PlusCircle, 
  Search, 
  MapPin, 
  ChevronLeft, 
  ChevronRight, 
  Bed, 
  Bath, 
  Maximize
} from "lucide-react";


// ── Client / Seeker Dashboard ────────────────────────────────────────────────
export const ClientDashboard: React.FC = () => {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [intent, setIntent] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [searchCity, setSearchCity] = useState<string>("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [gpsActive, setGpsActive] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState<string>("");
  const [page, setPage] = useState(1);
  const limit = 6;

  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect non-client authenticated users to their respective dashboards
  useEffect(() => {
    if (user) {
      if (user.role === "owner" || user.role === "agency") {
        navigate("/owner/dashboard", { replace: true });
      } else if (user.role === "admin") {
        navigate("/admin", { replace: true });
      }
    }
  }, [user, navigate]);

  // Fallback images for premium property categories
  const getCategoryFallbackImage = (cat: string) => {
    switch (cat) {
      case "apartment":
        return "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80";
      case "villa_house":
        return "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80";
      case "land":
        return "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80";
      case "commercial":
        return "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80";
      case "pg":
      case "hostel":
        return "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80";
      default:
        return "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80";
    }
  };

  const formatPrice = (price: number, unit: string) => {
    const formatted = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(price);
    return unit === "per_month" ? `${formatted}/mo` : formatted;
  };

  // Fetch properties from backend
  const fetchProperties = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit,
      };
      if (intent) params.intent = intent;
      if (category) params.category = category;
      if (city) params.city = city;
      if (lat !== null && lng !== null && gpsActive) {
        params.lat = lat;
        params.lng = lng;
        params.radius = 20.0;
      }

      const res = await api.get("/api/properties", { params });
      setProperties(res.data.results || res.data || []);
    } catch (err) {
      console.error("Failed to fetch properties", err);
      toast.error("Failed to load listings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [intent, category, city, lat, lng, gpsActive, page]);

  // Geolocation trigger
  const toggleGPS = () => {
    if (gpsActive) {
      setGpsActive(false);
      setLat(null);
      setLng(null);
      setDetectedLocation("");
      setPage(1);
      toast.success("Nearby GPS filter disabled");
      return;
    }

    setGpsLoading(true);
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        setLat(latitude);
        setLng(longitude);
        setGpsActive(true);
        setGpsLoading(false);
        setPage(1);
        toast.success("Location retrieved! Searching within 20km.");

        // Resolve city and state from coordinates
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`
          );
          const data = await response.json();
          const cityVal = 
            data.address?.city || 
            data.address?.town || 
            data.address?.village || 
            data.address?.county || 
            "";
          const stateVal = data.address?.state || "";

          if (cityVal && stateVal) {
            setDetectedLocation(`${cityVal}, ${stateVal}`);
          } else {
            setDetectedLocation(cityVal || stateVal || "");
          }
        } catch (err) {
          console.error("Failed to reverse geocode GPS location:", err);
        }
      },
      (error) => {
        setGpsLoading(false);
        if (error.code === error.PERMISSION_DENIED) {
          toast.error("Location access denied. Please enable location permissions.");
        } else if (error.code === error.TIMEOUT) {
          toast.error("Location retrieval timed out. Defaulting to standard search.");
        } else {
          toast.error("Failed to retrieve location: " + error.message);
        }
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCity(searchCity);
    setPage(1);
  };

  const handleResetAll = () => {
    setIntent("");
    setCategory("");
    setCity("");
    setSearchCity("");
    setLat(null);
    setLng(null);
    setGpsActive(false);
    setPage(1);
    toast.success("Filters reset successfully");
  };



  const handleOpenDetails = (prop: any) => {
    navigate(`/properties/${prop.id}`);
  };

  // Missing SkeletonCard component
  const SkeletonCard = () => (
    <Card className="border-slate-100 bg-white overflow-hidden animate-pulse rounded-[24px] p-4">
      <div className="h-48 w-full bg-slate-200 rounded-[16px]" />
      <CardHeader className="space-y-3 pb-3 px-0">
        <div className="flex items-center justify-between">
          <div className="h-5 w-16 bg-slate-200 rounded-full" />
          <div className="h-5 w-24 bg-slate-200 rounded" />
        </div>
        <div className="h-6 w-3/4 bg-slate-200 rounded" />
        <div className="h-4 w-1/2 bg-slate-200 rounded" />
      </CardHeader>
      <CardContent className="space-y-4 px-0 pb-0">
        <div className="flex gap-4">
          <div className="h-4 w-12 bg-slate-200 rounded" />
          <div className="h-4 w-12 bg-slate-200 rounded" />
          <div className="h-4 w-12 bg-slate-200 rounded" />
        </div>
        <div className="h-10 w-full bg-slate-200 rounded-lg" />
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-[#f4f6f5] text-left relative font-sans">

      <AppNavbar logoHref="/dashboard" />

      {/* Main Container */}
      <main className="mx-auto max-w-9xl px-5 py-8">
        
        {/* Full-width Hero Banner Section */}
        <div 
          className="relative overflow-hidden rounded-[32px] text-white py-20 px-8 md:px-16 shadow-lg bg-cover bg-center mb-8 flex flex-col items-center justify-center min-h-[380px]"
          style={{ backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.5), rgba(0,0,0,0.85)), url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=80')` }}
        >
          <div className="relative z-10 text-center max-w-3xl space-y-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-md px-4 py-1.5 text-xs font-bold text-teal-200 border border-white/10 uppercase tracking-widest">
              Your Reliable Ally in Worldwide Real Estate
            </span>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white m-0 leading-tight">
              Choose Your Next Home
            </h1>
          </div>
        </div>

        {/* Floating Custom Search Filter Bar */}
        <div className="max-w-4xl mx-auto -mt-10 md:-mt-20 relative z-20 px-4 md:px-8">
          <Card className="border border-slate-100 shadow-2xl bg-white rounded-3xl md:rounded-full p-4 md:py-3.5 md:px-6">
            <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-center gap-4 md:gap-2">
              
              {/* Category Dropdown */}
              <div className="flex-1 w-full text-left md:px-3 md:min-w-[160px]">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">Type</span>
                <Select
                  value={category || "all"}
                  onValueChange={(val) => {
                    setCategory(val === "all" || !val ? "" : val);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="border-none focus-visible:border-transparent focus-visible:ring-0 focus-visible:ring-transparent focus:ring-transparent focus:border-transparent outline-none focus-visible:outline-none shadow-none bg-transparent hover:bg-transparent h-auto px-0 py-0 font-bold text-slate-800 text-sm focus-visible:ring-offset-0">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-slate-100 shadow-xl rounded-2xl p-1 z-30">
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="villa_house">Villa / House</SelectItem>
                    <SelectItem value="land">Land</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="pg">PG</SelectItem>
                    <SelectItem value="hostel">Hostel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Divider */}
              <div className="hidden md:block h-8 w-px bg-slate-200" />

              {/* Intent Dropdown */}
              <div className="flex-[1.3] w-full text-left md:px-3 md:min-w-[220px]">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">Intent</span>
                <Select
                  value={intent || "all"}
                  onValueChange={(val) => {
                    setIntent(val === "all" || !val ? "" : val);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="border-none focus-visible:border-transparent focus-visible:ring-0 focus-visible:ring-transparent focus:ring-transparent focus:border-transparent outline-none focus-visible:outline-none shadow-none bg-transparent hover:bg-transparent h-auto px-0 py-0 font-bold text-slate-800 text-sm focus-visible:ring-offset-0">
                    <SelectValue placeholder="All Listings (Buy/Rent)" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-slate-100 shadow-xl rounded-2xl p-1 z-30">
                    <SelectItem value="all">All (Buy/Rent)</SelectItem>
                    <SelectItem value="rent">For Rent</SelectItem>
                    <SelectItem value="buy">For Sale</SelectItem>
                    <SelectItem value="lease">For Lease</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Divider */}
              <div className="hidden md:block h-8 w-px bg-slate-200" />

              {/* City input */}
              <div className="flex-[1.5] w-full text-left md:px-3 relative">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">Location</span>
                <div className="flex items-center gap-1.5">
                  <Search className="h-4 w-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search City or Area..."
                    value={searchCity}
                    onChange={(e) => setSearchCity(e.target.value)}
                    className="w-full bg-transparent border-0 font-bold text-slate-800 text-sm focus:outline-none focus:ring-0 placeholder-slate-400 p-0"
                  />
                </div>
              </div>

              {/* Actions: Search & Reset */}
              <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
                <Button 
                  type="submit" 
                  className="flex-1 md:flex-none bg-[#1b3b2b] hover:bg-[#254f3b] text-white text-xs font-extrabold tracking-wider uppercase py-3.5 px-8 rounded-full flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 shrink-0"
                >
                  <Search className="h-4 w-4 shrink-0" />
                  Search
                </Button>

                {(intent || category || city || gpsActive || searchCity) && (
                  <button
                    type="button"
                    onClick={handleResetAll}
                    className="inline-flex items-center justify-center h-12 w-12 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-rose-600 transition-all duration-300 shadow-sm hover:shadow active:scale-95 cursor-pointer shrink-0"
                    title="Reset Filters"
                  >
                    <svg className="h-5 w-5 stroke-current" fill="none" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                  </button>
                )}
              </div>
            </form>
          </Card>
        </div>

        {/* GPS location integration wrapper below filter */}
        <div className="flex justify-center items-center gap-3 mt-4 flex-wrap relative z-20">
          <button
            type="button"
            onClick={toggleGPS}
            disabled={gpsLoading}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border transition-all cursor-pointer bg-white shadow-sm ${
              gpsActive 
                ? "border-emerald-500 text-emerald-700 bg-emerald-50/50" 
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {gpsLoading ? (
              <>
                <span className="h-3.5 w-3.5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                Locating...
              </>
            ) : (
              <>
                <MapPin className={`h-3.5 w-3.5 ${gpsActive ? "text-emerald-600 animate-bounce" : "text-[#1b3b2b]"}`} />
                {gpsActive ? "GPS Proximity Sorting Active (20km)" : "Find Properties Nearby Me"}
              </>
            )}
          </button>
          
          {gpsActive && (
            <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-3 py-1">
              Location: {detectedLocation || "Resolving Address..."}
            </span>
          )}
        </div>

        {/* Title Grid Section */}
        <div className="flex flex-col md:flex-row justify-between items-baseline gap-2 mb-8 mt-12 border-b border-slate-200/60 pb-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Featured Properties</h2>
            <p className="text-slate-500 text-xs md:text-sm mt-1">Handpicked luxury residences direct from verified owners.</p>
          </div>
          {properties.length > 0 && (
            <span className="text-xs bg-[#1b3b2b]/10 text-[#1b3b2b] px-3.5 py-1 rounded-full font-bold uppercase tracking-wider">
              Showing Page {page}
            </span>
          )}
        </div>

        {/* Listings Content */}
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : properties.length === 0 ? (
          /* Contextual Empty State */
          <div className="flex flex-col items-center justify-center border border-slate-100 bg-white rounded-[32px] p-16 text-center shadow-sm">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 text-slate-400 mb-6">
              <Home className="h-10 w-10 text-[#1b3b2b]" />
            </div>
            
            {gpsActive && city ? (
              <>
                <h3 className="text-xl font-bold text-slate-900">No properties matched combined filters</h3>
                <p className="text-slate-500 max-w-md mt-2 text-sm leading-relaxed">
                  We are searching for properties that are located within 20km of your coordinates <strong>AND</strong> match the city text search: <span className="text-slate-900 font-semibold">"{city}"</span>. 
                  <br/>Try disabling one of these active restrictions to broaden your search:
                </p>
                <div className="flex gap-4 mt-6">
                  <Button 
                    onClick={() => { setGpsActive(false); setLat(null); setLng(null); }}
                    className="bg-[#1b3b2b] hover:bg-[#152e22] text-white text-xs font-semibold rounded-full px-6"
                  >
                    Disable GPS Filter
                  </Button>
                  <Button 
                    onClick={() => { setCity(""); setSearchCity(""); }}
                    variant="outline"
                    className="border-slate-200 text-slate-700 text-xs font-semibold rounded-full px-6"
                  >
                    Clear City Filter
                  </Button>
                </div>
              </>
            ) : gpsActive ? (
              <>
                <h3 className="text-xl font-bold text-slate-900">No properties found nearby</h3>
                <p className="text-slate-500 max-w-sm mt-1 text-sm">
                  No listings are currently available within 20km of your GPS location.
                </p>
                <Button 
                  onClick={() => { setGpsActive(false); setLat(null); setLng(null); }}
                  className="mt-6 bg-[#1b3b2b] hover:bg-[#152e22] text-white text-xs font-semibold rounded-full px-6"
                >
                  Disable GPS Search
                </Button>
              </>
            ) : city ? (
              <>
                <h3 className="text-xl font-bold text-slate-900">No properties found in "{city}"</h3>
                <p className="text-slate-500 max-w-sm mt-1 text-sm">
                  Try searching for a different city or clearing the text filter.
                </p>
                <Button 
                  onClick={() => { setCity(""); setSearchCity(""); }}
                  className="mt-6 bg-[#1b3b2b] hover:bg-[#152e22] text-white text-xs font-semibold rounded-full px-6"
                >
                  Clear Search
                </Button>
              </>
            ) : (
              <>
                <h3 className="text-xl font-bold text-slate-900">No properties listed yet</h3>
                <p className="text-slate-500 max-w-sm mt-1 text-sm">
                  Try resetting active category or intent filters to view all listings.
                </p>
                <Button 
                  onClick={handleResetAll}
                  className="mt-6 bg-[#1b3b2b] hover:bg-[#152e22] text-white text-xs font-semibold rounded-full px-6"
                >
                  Reset All Filters
                </Button>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Grid layout matching design */}
            <div className="grid gap-6 grid-cols-1 md:grid-cols-3 lg:grid-cols-4">
              {properties.map((prop) => (
                <Card 
                  key={prop.id} 
                  className="border border-slate-100 bg-white hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col group p-3.5 rounded-[20px]"
                >
                  {/* Aspect image box */}
                  <div className="h-48 w-full rounded-[14px] overflow-hidden relative shrink-0">
                    <img
                      src={prop.photos && prop.photos.length > 0 ? prop.photos[0] : getCategoryFallbackImage(prop.category)}
                      alt={prop.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    
                    {/* Absolute tags matching Webflow theme */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                      <span className="inline-flex rounded-[6px] bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-800 shadow-sm uppercase tracking-wider">
                        For {prop.intent === "buy" ? "Sale" : prop.intent === "rent" ? "Rent" : "Lease"}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3">
                      <span className="inline-flex rounded-[6px] bg-[#1b3b2b] px-2.5 py-1 text-[10px] font-semibold text-white shadow-sm uppercase tracking-wider">
                        {prop.category.replace("_", " ")}
                      </span>
                    </div>
                    
                    {prop.owner_role === "agency" && (
                      <div className="absolute bottom-3 left-3">
                        <span className="inline-flex items-center gap-1 rounded bg-amber-500 text-white px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest">
                          Agency
                        </span>
                      </div>
                    )}
                  </div>

                  <CardHeader className="pb-1.5 flex-1 flex flex-col justify-between px-1 pt-3.5 space-y-0">
                    <div className="space-y-1">
                      {/* Location text top-aligned in Webflow design */}
                      <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        {prop.location_area}, {prop.location_city}
                      </div>

                      <CardTitle className="text-base font-semibold text-slate-900 line-clamp-1 pt-1 group-hover:text-[#1b3b2b] transition-colors leading-tight m-0">
                        {prop.title}
                      </CardTitle>

                      {/* Specs Row with no border layout */}
                      <div className="flex flex-wrap items-center gap-y-1.5 gap-x-3 text-[11px] text-slate-500 font-medium py-1.5 mt-1.5 mb-2.5">
                        <div className="flex items-center gap-1 shrink-0">
                          <Bed className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{prop.bedrooms || 0} Bed Room</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Bath className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{prop.bathrooms || 0} Bath</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Maximize className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{prop.area ? `${prop.area.toLocaleString()} SQ FT` : "N/A"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: Price & Details button */}
                    <div className="flex items-center justify-between pt-2 w-full gap-1.5 border-t border-slate-50">
                      <span className="font-extrabold text-sm sm:text-base text-slate-950 whitespace-nowrap">
                        {formatPrice(prop.price, prop.price_unit)}
                      </span>
                      <button
                        onClick={() => handleOpenDetails(prop)}
                        className="bg-[#1b3b2b] hover:bg-[#152e22] text-white text-[11px] sm:text-xs font-semibold px-3 sm:px-4 py-2.5 rounded-lg transition-colors flex items-center gap-1 shadow-sm cursor-pointer shrink-0"
                      >
                        View Details <span className="font-mono text-xs leading-none">→</span>
                      </button>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between border-t border-slate-200/80 pt-8 mt-12">
              <Button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                variant="outline"
                className="border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer rounded-full px-5 py-2.5"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              <span className="text-xs text-slate-500 font-extrabold">
                Page {page}
              </span>

              <Button
                onClick={() => setPage(p => p + 1)}
                disabled={properties.length < limit}
                variant="outline"
                className="border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer rounded-full px-5 py-2.5"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

// ── Owner & Agency Dashboard ────────────────────────────────────────────────
export const OwnerDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-left">
      <AppNavbar logoHref="/owner/dashboard" title="Partner Dashboard" />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Property Management</h1>
            <p className="mt-1 text-sm text-slate-500">List and manage your property portfolio.</p>
          </div>
          <Button className="bg-[#308178] hover:bg-[#25645d] text-white flex items-center gap-1.5 self-start">
            <PlusCircle className="h-4.5 w-4.5" />
            Add Property
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-6 sm:grid-cols-3 mb-8">
          <Card className="border-slate-100 bg-white">
            <CardHeader className="pb-2">
              <CardDescription className="font-semibold uppercase tracking-wider text-slate-400">
                Active Listings
              </CardDescription>
              <CardTitle className="text-3xl font-extrabold text-[#308178]">0 Listings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-400">Properties visible on search.</p>
            </CardContent>
          </Card>
          <Card className="border-slate-100 bg-white">
            <CardHeader className="pb-2">
              <CardDescription className="font-semibold uppercase tracking-wider text-slate-400">
                Leads / Inquiries
              </CardDescription>
              <CardTitle className="text-3xl font-extrabold text-[#308178]">0 Leads</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-400">Client messages waiting response.</p>
            </CardContent>
          </Card>
          <Card className="border-slate-100 bg-white">
            <CardHeader className="pb-2">
              <CardDescription className="font-semibold uppercase tracking-wider text-slate-400">
                Total Views
              </CardDescription>
              <CardTitle className="text-3xl font-extrabold text-[#308178]">0 Views</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-400">Number of users who saw listings.</p>
            </CardContent>
          </Card>
        </div>

        {/* Empty state management panel */}
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 bg-white rounded-xl p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-50 text-[#308178] mb-4">
            <Home className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No properties listed yet</h3>
          <p className="text-slate-500 max-w-sm mt-1 text-sm">
            Add properties to start showcasing them to active buyers and renters.
          </p>
          <Button className="mt-6 bg-[#308178] hover:bg-[#25645d] text-white">
            Add Your First Listing
          </Button>
        </div>
      </main>
    </div>
  );
};

// ── Admin Dashboard ─────────────────────────────────────────────────────────
export const AdminDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-left">
      <AppNavbar logoHref="/admin" title="Admin Dashboard" />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">System Control Room</h1>
          <p className="mt-1 text-sm text-slate-500">Monitor registrations, roles, and database status.</p>
        </div>

        {/* System Stats */}
        <div className="grid gap-6 sm:grid-cols-4 mb-8">
          <Card className="border-slate-100 bg-white">
            <CardHeader className="pb-1">
              <CardDescription className="font-semibold uppercase tracking-wider text-slate-400">Total Users</CardDescription>
              <CardTitle className="text-2xl font-bold text-[#308178]">42</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-slate-100 bg-white">
            <CardHeader className="pb-1">
              <CardDescription className="font-semibold uppercase tracking-wider text-slate-400">Agencies</CardDescription>
              <CardTitle className="text-2xl font-bold text-[#308178]">6</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-slate-100 bg-white">
            <CardHeader className="pb-1">
              <CardDescription className="font-semibold uppercase tracking-wider text-slate-400">Owners</CardDescription>
              <CardTitle className="text-2xl font-bold text-[#308178]">14</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-slate-100 bg-white">
            <CardHeader className="pb-1">
              <CardDescription className="font-semibold uppercase tracking-wider text-slate-400">Active Listings</CardDescription>
              <CardTitle className="text-2xl font-bold text-[#308178]">112</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Administration Table Mockup */}
        <Card className="border-slate-200 bg-white">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-lg font-bold">User Registrations Queue</CardTitle>
            <CardDescription>Verify newly registered partners and agencies.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-500">
                <thead className="bg-slate-50 text-xs text-slate-700 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Verification</th>
                    <th className="px-6 py-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    { name: "Apex Properties", email: "contact@apex.com", role: "agency", status: "Pending" },
                    { name: "Sarah Connor", email: "sarah@cyber.com", role: "owner", status: "Verified" },
                    { name: "John Miller", email: "john@miller.me", role: "user", status: "Verified" },
                  ].map((u, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-bold text-slate-900">{u.name}</td>
                      <td className="px-6 py-4">{u.email}</td>
                      <td className="px-6 py-4 capitalize">{u.role}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          u.status === "Verified" ? "bg-teal-50 text-[#308178]" : "bg-amber-50 text-amber-800"
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Button variant="ghost" className="text-slate-500 hover:text-slate-900 text-xs">
                          Review
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};
