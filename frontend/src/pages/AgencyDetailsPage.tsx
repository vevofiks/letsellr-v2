import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Building2,
  MapPin,
  ShieldCheck,
  ArrowLeft,
  Calendar,
  Bed,
  Bath,
  Maximize2,
  ChevronRight,
  HelpCircle,
} from "lucide-react";
import api from "@/lib/api";
import { AppNavbar } from "@/components/AppNavbar";

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

interface Property {
  id: string;
  title: string;
  category: string;
  intent: string;
  price: number;
  price_unit: string;
  deposit?: number;
  location_area: string;
  location_city: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  photos: string[];
  status: string;
  created_at: string;
}

export const AgencyDetailsPage: React.FC = () => {
  const { agencyId } = useParams<{ agencyId: string }>();
  const navigate = useNavigate();

  const [agency, setAgency] = useState<Agency | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingAgency, setLoadingAgency] = useState(true);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("all");

  useEffect(() => {
    if (!agencyId) return;

    const fetchAgencyDetails = async () => {
      try {
        setLoadingAgency(true);
        const res = await api.get<Agency>(`/api/agencies/${agencyId}`);
        setAgency(res.data);
      } catch (err) {
        console.error("Failed to load agency details:", err);
      } finally {
        setLoadingAgency(false);
      }
    };

    const fetchAgencyProperties = async () => {
      try {
        setLoadingProperties(true);
        const res = await api.get<{ results: Property[] }>("/api/properties", {
          params: { owner_id: agencyId },
        });
        setProperties(res.data.results || []);
      } catch (err) {
        console.error("Failed to load agency properties:", err);
      } finally {
        setLoadingProperties(false);
      }
    };

    fetchAgencyDetails();
    fetchAgencyProperties();
  }, [agencyId]);

  const filteredProperties = properties.filter((prop) => {
    if (activeTab === "rent") return prop.intent === "rent";
    if (activeTab === "buy") return prop.intent === "buy" || prop.intent === "sale";
    return true;
  });

  const formatPrice = (price: number, unit: string) => {
    const formatted = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
    return unit === "per_month" ? `${formatted} / mo` : formatted;
  };

  const initials = agency?.display_name
    ? agency.display_name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
    : "AG";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <AppNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Back navigation */}
        <button
          onClick={() => navigate("/agencies")}
          className="inline-flex items-center gap-2 text-xs font-extrabold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Agencies
        </button>

        {/* Agency Profile Header Card */}
        {loadingAgency ? (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm animate-pulse space-y-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="h-24 w-24 rounded-3xl bg-slate-200 shrink-0" />
              <div className="space-y-3 flex-1 text-center sm:text-left">
                <div className="h-6 w-48 bg-slate-200 rounded mx-auto sm:mx-0" />
                <div className="h-4 w-32 bg-slate-100 rounded mx-auto sm:mx-0" />
                <div className="h-16 w-full max-w-xl bg-slate-50 rounded-2xl" />
              </div>
            </div>
          </div>
        ) : agency ? (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-md space-y-8 relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-start justify-between gap-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
                {agency.logo_key ? (
                  <img
                    src={agency.logo_key}
                    alt={agency.display_name}
                    className="h-24 w-24 sm:h-28 sm:w-28 rounded-3xl object-cover border-2 border-slate-100 shadow-md shrink-0"
                  />
                ) : (
                  <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-3xl bg-slate-900 text-white font-black text-3xl flex items-center justify-center shadow-inner shrink-0">
                    {initials}
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                      {agency.display_name}
                    </h1>
                    {agency.verification_status === "verified" && (
                      <span className="inline-flex items-center gap-1 bg-teal-50 border border-teal-100 text-brand-green px-3 py-1 rounded-full text-xs font-black">
                        <ShieldCheck className="h-3.5 w-3.5" /> Verified Agency
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs font-semibold text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-brand-green shrink-0" />
                      <span>
                        {agency.location_area
                          ? `${agency.location_area}, ${agency.location_city}`
                          : agency.location_city}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                      <span>
                        Member since{" "}
                        {new Date(agency.member_since).toLocaleDateString("en-IN", {
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  {agency.about && (
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium max-w-3xl pt-1">
                      {agency.about}
                    </p>
                  )}
                </div>
              </div>

              {/* Stat Pill */}
              <div className="w-full md:w-auto bg-teal-50/80 border border-teal-100 rounded-2xl p-5 flex flex-row md:flex-col items-center justify-between gap-4 text-center shrink-0">
                <div>
                  <span className="text-2xl sm:text-3xl font-black text-brand-green block">
                    {agency.total_listings}
                  </span>
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                    Active Listings
                  </span>
                </div>
              </div>
            </div>

            {/* Areas Served */}
            {agency.areas_served && agency.areas_served.length > 0 && (
              <div className="pt-6 border-t border-slate-100 space-y-3">
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                  Operational Areas &amp; Coverage
                </h4>
                <div className="flex flex-wrap gap-2">
                  {agency.areas_served.map((area, idx) => (
                    <span
                      key={idx}
                      className="bg-slate-100 text-slate-800 px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5"
                    >
                      <MapPin className="h-3 w-3 text-brand-green" />
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Agency Not Found</h3>
            <p className="text-xs text-slate-500">The requested real estate agency profile could not be located.</p>
            <Link
              to="/agencies"
              className="inline-block px-5 py-2 bg-brand-green text-white font-bold text-xs rounded-full"
            >
              Back to Agencies
            </Link>
          </div>
        )}

        {/* Agency Properties Section */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Building2 className="h-5 w-5 text-brand-green" />
                Properties Listed by {agency?.display_name || "Agency"}
              </h2>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                Showing {filteredProperties.length} available listings
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-slate-200/80 shadow-xs">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-4 py-1.5 text-xs font-extrabold rounded-xl transition-colors cursor-pointer ${
                  activeTab === "all"
                    ? "bg-brand-green text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                All ({properties.length})
              </button>
              <button
                onClick={() => setActiveTab("rent")}
                className={`px-4 py-1.5 text-xs font-extrabold rounded-xl transition-colors cursor-pointer ${
                  activeTab === "rent"
                    ? "bg-brand-green text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                For Rent
              </button>
              <button
                onClick={() => setActiveTab("buy")}
                className={`px-4 py-1.5 text-xs font-extrabold rounded-xl transition-colors cursor-pointer ${
                  activeTab === "buy"
                    ? "bg-brand-green text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                For Sale
              </button>
            </div>
          </div>

          {/* Properties Grid */}
          {loadingProperties ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-3xl h-80 border border-slate-100 animate-pulse"
                />
              ))}
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm space-y-3">
              <HelpCircle className="h-10 w-10 text-slate-300 mx-auto" />
              <h4 className="text-base font-bold text-slate-900">No properties in this category</h4>
              <p className="text-xs text-slate-500">
                This agency does not currently have active listings matching the selected tab filter.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProperties.map((prop) => (
                <div
                  key={prop.id}
                  onClick={() => navigate(`/properties/${prop.id}`)}
                  className="bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all overflow-hidden cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    {/* Property Image Container */}
                    <div className="relative h-48 w-full bg-slate-900 overflow-hidden">
                      {prop.photos && prop.photos.length > 0 ? (
                        <img
                          src={prop.photos[0]}
                          alt={prop.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-slate-500 bg-slate-100">
                          <Building2 className="h-10 w-10 text-slate-300" />
                        </div>
                      )}

                      {/* Intent Badge */}
                      <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-md text-brand-green px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm">
                        For {prop.intent === "buy" ? "Sale" : prop.intent === "rent" ? "Rent" : "Lease"}
                      </span>

                      {/* Category Badge */}
                      <span className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold capitalize shadow-sm">
                        {prop.category.replace("_", " ")}
                      </span>
                    </div>

                    {/* Card Content */}
                    <div className="p-5 space-y-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-xs font-semibold text-slate-400">
                          <MapPin className="h-3.5 w-3.5 text-brand-green shrink-0" />
                          <span className="truncate">
                            {prop.location_area}, {prop.location_city}
                          </span>
                        </div>
                        <h3 className="font-extrabold text-slate-900 text-base line-clamp-1 group-hover:text-brand-green transition-colors">
                          {prop.title}
                        </h3>
                      </div>

                      {/* Specs */}
                      <div className="flex items-center gap-4 text-xs font-bold text-slate-600 pt-1">
                        {prop.bedrooms && (
                          <span className="flex items-center gap-1">
                            <Bed className="h-4 w-4 text-slate-400" /> {prop.bedrooms} Beds
                          </span>
                        )}
                        {prop.bathrooms && (
                          <span className="flex items-center gap-1">
                            <Bath className="h-4 w-4 text-slate-400" /> {prop.bathrooms} Baths
                          </span>
                        )}
                        {prop.area && (
                          <span className="flex items-center gap-1">
                            <Maximize2 className="h-4 w-4 text-slate-400" /> {prop.area} sqft
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Price & Action */}
                  <div className="p-5 pt-0 border-t border-slate-50 flex items-center justify-between mt-2">
                    <div>
                      <span className="text-xs text-slate-400 font-bold block uppercase tracking-wider">
                        Price
                      </span>
                      <span className="text-lg font-black text-brand-green">
                        {formatPrice(prop.price, prop.price_unit)}
                      </span>
                    </div>

                    <span className="text-xs font-extrabold text-brand-green flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Details <ChevronRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AgencyDetailsPage;
