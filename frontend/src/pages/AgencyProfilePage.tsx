import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { AppNavbar } from "@/components/AppNavbar";
import { 
  Building2, 
  MapPin, 
  MessageSquare, 
  ShieldCheck, 
  Calendar,
  Layers,
  Home,
  Bed,
  Bath,
  Maximize,
  ArrowLeft,
  Share2
} from "lucide-react";

interface AgencyProfile {
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

interface Property {
  id: string;
  ref: string;
  title: string;
  description: string;
  category: string;
  intent: string;
  price: number;
  price_unit: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  photos: string[];
  location_address: string;
  location_area: string;
  location_city: string;
  status: string;
  owner_whatsapp?: string;
  owner_phone?: string;
}

export const AgencyProfilePage: React.FC = () => {
  const { agencyId } = useParams<{ agencyId: string }>();
  const navigate = useNavigate();

  const [agency, setAgency] = useState<AgencyProfile | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  // Branding images stored in localStorage by the agency's settings page
  const [bannerUrl, setBannerUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  useEffect(() => {
    const fetchAgencyData = async () => {
      if (!agencyId) return;
      try {
        setLoading(true);
        // Fetch public agency details
        const agencyRes = await api.get(`/api/agencies/${agencyId}`);
        setAgency(agencyRes.data);

        // Fetch agency's public listings
        const propertiesRes = await api.get("/api/properties", {
          params: { owner_id: agencyId, limit: 100 }
        });
        setProperties(propertiesRes.data.results || []);
      } catch (err: any) {
        toast.error("Failed to load agency profile");
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchAgencyData();
  }, [agencyId, navigate]);

  // Load branding images from localStorage once we know the agency id
  useEffect(() => {
    if (!agency) return;
    const savedBanner = localStorage.getItem(`agency_banner_${agency.id}`);
    const savedLogo   = localStorage.getItem(`agency_logo_${agency.id}`);
    if (savedBanner) setBannerUrl(savedBanner);
    if (savedLogo)   setLogoUrl(savedLogo);
  }, [agency?.id]);

  const handleShareProfile = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Profile link copied to clipboard!");
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f6f5] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="relative flex items-center justify-center h-20 w-20">
            <div className="absolute inset-0 rounded-full border-[3px] border-slate-200 border-t-[#014645] animate-spin" />
            <img 
              src="/logo.png" 
              alt="Letsellr Logo" 
              className="h-9 w-auto z-10 animate-pulse" 
            />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">
            Preparing your experience...
          </p>
        </div>
      </div>
    );
  }

  if (!agency) return null;

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-16 text-left">
      <AppNavbar logoHref="/dashboard" />
      
      {/* Upper Banner */}
      <div className="h-36 sm:h-52 w-full relative overflow-hidden">
        {/* Floating Back Button */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="absolute top-3.5 left-4 z-30 flex items-center gap-1.5 bg-white/95 hover:bg-white text-slate-800 backdrop-blur-md px-3 py-2 sm:px-3.5 sm:py-2 rounded-full text-xs font-extrabold shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer border border-slate-200/80"
          title="Go Back"
        >
          <ArrowLeft className="h-4 w-4 text-slate-800 shrink-0" />
          <span className="hidden sm:inline">Back</span>
        </button>

        {bannerUrl ? (
          <img src={bannerUrl} alt="Agency Banner" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-linear-to-r from-[#014645] via-[#015755] to-[#016866] relative">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] bg-size-[16px_16px]" />
          </div>
        )}
        {/* Overlay for legibility */}
        {bannerUrl && <div className="absolute inset-0 bg-black/20" />}
      </div>

      {/* Main Profile Info Card */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 sm:-mt-16 relative z-10">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-7 shadow-sm space-y-6">
          
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-slate-100">
            
            {/* Left: Avatar + Title & Meta Info */}
            <div className="flex flex-col sm:flex-row gap-4 items-start text-left min-w-0 w-full sm:w-auto">
              
              {/* Agency Logo */}
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-white border-4 border-white shadow-md flex items-center justify-center shrink-0 overflow-hidden relative -mt-12 sm:-mt-14 z-20" style={{background: logoUrl ? undefined : "#01464514"}}>
                {logoUrl ? (
                  <img src={logoUrl} alt={agency.display_name} className="h-full w-full object-cover" />
                ) : agency.logo_key ? (
                  <img src={agency.logo_key} alt={agency.display_name} className="h-full w-full object-cover" />
                ) : (
                  <Building2 className="h-8 w-8 text-[#014645]/40" />
                )}
              </div>

              {/* Identity & Tags */}
              <div className="space-y-2 min-w-0 w-full sm:w-auto">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight my-0">
                    {agency.display_name}
                  </h1>
                  {agency.verification_status === "verified" && (
                    <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 rounded-md px-2 py-0.5 text-[10px] font-bold text-emerald-700 uppercase tracking-wide">
                      <ShieldCheck className="h-3 w-3 fill-emerald-500 text-white" /> Verified
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs font-medium text-slate-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    {agency.location_area}, {agency.location_city}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    Since {new Date(agency.member_since).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="flex items-center gap-1 font-bold text-[#014645]">
                    <Layers className="h-3.5 w-3.5 text-[#014645] shrink-0" />
                    {properties.length} Active {properties.length === 1 ? "Listing" : "Listings"}
                  </span>
                </div>

                {/* Areas Served Tags */}
                {agency.areas_served && agency.areas_served.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mr-0.5">Areas:</span>
                    {agency.areas_served.map((area, i) => (
                      <span key={i} className="bg-slate-50 border border-slate-200/80 rounded-md px-2 py-0.5 text-[10px] font-bold text-slate-600">
                        {area}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Actions (WhatsApp & Share) */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0 pt-2 sm:pt-0">
              <button 
                onClick={handleShareProfile}
                className="p-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-md transition-all cursor-pointer shadow-xs"
                title="Share Profile"
              >
                <Share2 className="h-4 w-4" />
              </button>

              <button 
                onClick={() => {
                  const propsWithWhatsApp = properties.find(p => p.owner_whatsapp);
                  const phoneNum = propsWithWhatsApp?.owner_whatsapp || "917025351519";
                  const message = `Hi, I am interested in property listings from ${agency.display_name}.`;
                  window.open(`https://wa.me/${phoneNum}?text=${encodeURIComponent(message)}`, "_blank");
                }}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 bg-[#014645] hover:bg-[#015755] text-white font-bold text-xs rounded-md cursor-pointer shadow-xs transition-all"
              >
                <MessageSquare className="h-4 w-4" /> Chat on WhatsApp
              </button>
            </div>
          </div>

          {/* About Section */}
          <div className="space-y-3">
            <h2 className="text-base font-extrabold text-slate-900 my-0">About the Agency</h2>
            <p className="text-sm text-slate-600 leading-relaxed font-normal whitespace-pre-line m-0">
              {agency.about || `${agency.display_name} is a premier property agency serving the ${agency.location_city} area, offering standard client representation and premium listing options.`}
            </p>
          </div>
        </div>

        {/* Listings Section */}
        <div className="mt-12 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900 my-0">
              Active Listings ({properties.length})
            </h2>
          </div>

          {properties.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-100 rounded-3xl flex flex-col items-center justify-center shadow-xs">
              <div className="p-3 bg-[#014645]/5 text-[#014645] rounded-full mb-3">
                <Home className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-900 m-0">No Active Listings</h3>
              <p className="text-xs text-slate-500 font-semibold mt-1">This agency doesn't have any live property listings right now.</p>
            </div>
          ) : (
            <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {properties.map((prop) => (
                <Link
                  key={prop.id}
                  to={`/properties/${prop.id}`}
                  className="relative border border-slate-200/70 bg-white hover:shadow-lg hover:border-slate-300 transition-all duration-300 overflow-hidden flex flex-col rounded-xl cursor-pointer group animate-in fade-in max-w-85 w-full mx-auto sm:mx-0"
                >
                  {/* Thumbnail */}
                  <div className="h-40 w-full overflow-hidden relative shrink-0">
                    <img
                      src={prop.photos && prop.photos.length > 0 ? prop.photos[0] : getCategoryFallbackImage(prop.category)}
                      alt={prop.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
                      <span className="inline-flex rounded-md bg-[#014645] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-xs">
                        For {prop.intent === "buy" ? "Sale" : prop.intent === "rent" ? "Rent" : "Lease"}
                      </span>
                    </div>

                    <div className="absolute top-2.5 right-2.5 flex items-center justify-center bg-white/95 backdrop-blur-sm border border-slate-100 rounded-md px-2 py-0.5 text-[9px] font-bold text-slate-700 shadow-xs gap-1">
                      <Home className="h-3 w-3 text-slate-500" />
                      <span className="capitalize">{prop.category.replace("_", " ")}</span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3.5 flex-1 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-red-500 shrink-0" />
                        <span className="truncate">{prop.location_area}, {prop.location_city}</span>
                      </div>
                      
                      <h3 className="text-xs font-bold text-slate-900 line-clamp-2 group-hover:text-[#014645] transition-colors leading-snug m-0">
                        {prop.title}
                      </h3>
                      
                      <p className="text-[10px] text-slate-400 font-medium line-clamp-1 leading-none m-0">
                        {prop.location_address}
                      </p>

                      {/* Specs */}
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold pt-2 border-t border-slate-50">
                        <span className="flex items-center gap-0.5 whitespace-nowrap">
                          <Bed className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          {prop.bedrooms || 0} Bed
                        </span>
                        <span className="text-slate-200 font-normal">•</span>
                        <span className="flex items-center gap-0.5 whitespace-nowrap">
                          <Bath className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          {prop.bathrooms || 0} Bath
                        </span>
                        <span className="text-slate-200 font-normal">•</span>
                        <span className="flex items-center gap-0.5 whitespace-nowrap">
                          <Maximize className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          {prop.area ? `${prop.area} SQFT` : "N/A"}
                        </span>
                      </div>
                    </div>

                    {/* Price Row */}
                    <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 mt-2.5">
                      <span className="font-extrabold text-sm text-slate-900 flex items-baseline gap-0.5">
                        {formatPrice(prop.price, prop.price_unit)}
                        {prop.intent === "rent" && <span className="text-[9px] font-medium text-slate-400">/ month</span>}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
