import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Eye, 
  MessageSquare, 
  Heart, 
  Clock, 
  XCircle, 
  MapPin,
  Sparkles,
  ExternalLink,
  Building2,
  Bed,
  Bath,
  Maximize2,
  Sofa,
  Phone,
  MessageCircle,
  Calendar,
  ShieldAlert,
  CheckCircle2
} from "lucide-react";
import { OwnerNavbar } from "@/components/OwnerNavbar";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Property {
  id: string;
  ref: string;
  title: string;
  description?: string;
  category: string;
  intent: string;
  price: number;
  price_unit: string;
  deposit?: number;
  area?: number;
  bedrooms?: number;
  bathrooms?: number;
  furnishing?: string;
  status: "draft" | "pending_review" | "live" | "rejected" | "expired" | "inactive";
  location_address?: string;
  location_area: string;
  location_city: string;
  location_pincode: string;
  location_state: string;
  latitude?: number;
  longitude?: number;
  photos: string[];
  video_link?: string;
  amenities: string[];
  owner_phone: string;
  owner_whatsapp?: string;
  created_at: string;
  admin_review_reason?: string;
  stats: {
    views: number;
    enquiries: number;
    saves: number;
  };
}

export const OwnerPropertyDetailPage: React.FC = () => {
  const { propertyId } = useParams<{ propertyId: string }>();
  const navigate = useNavigate();

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  useEffect(() => {
    if (propertyId) {
      fetchPropertyDetail(propertyId);
    }
  }, [propertyId]);

  const fetchPropertyDetail = async (id: string) => {
    try {
      setLoading(true);
      const res = await api.get(`/api/properties/${id}`);
      setProperty(res.data);
    } catch (err) {
      console.error("Failed to load owner property detail", err);
      toast.error("Failed to load property details.");
      navigate("/owner/properties");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!property) return;
    if (!window.confirm(`Are you sure you want to delete "${property.title}"?`)) return;

    try {
      setDeleting(true);
      await api.delete(`/api/properties/${property.id}`);
      toast.success("Listing deleted successfully.");
      navigate("/owner/properties");
    } catch (err) {
      console.error("Delete failed", err);
      toast.error("Failed to delete property.");
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status: Property["status"]) => {
    switch (status) {
      case "live":
        return (
          <Badge variant="success" className="font-extrabold uppercase tracking-wider text-[10px] px-3 py-1 flex items-center gap-1.5 shrink-0 rounded-full shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Live Listing
          </Badge>
        );
      case "pending_review":
        return (
          <Badge variant="warning" className="font-extrabold uppercase tracking-wider text-[10px] px-3 py-1 flex items-center gap-1.5 shrink-0 rounded-full shadow-2xs">
            <Clock className="h-3.5 w-3.5 shrink-0 animate-pulse" /> Pending Review
          </Badge>
        );
      case "draft":
        return (
          <Badge variant="secondary" className="font-extrabold uppercase tracking-wider text-[10px] px-3 py-1 flex items-center gap-1.5 shrink-0 rounded-full shadow-2xs">
            <Edit className="h-3.5 w-3.5 shrink-0" /> Draft
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive" className="font-extrabold uppercase tracking-wider text-[10px] px-3 py-1 flex items-center gap-1.5 shrink-0 rounded-full shadow-2xs">
            <XCircle className="h-3.5 w-3.5 shrink-0" /> Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="font-extrabold uppercase tracking-wider text-[10px] px-3 py-1 flex items-center gap-1.5 shrink-0 rounded-full">
            {status}
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <OwnerNavbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="relative flex items-center justify-center h-16 w-16">
              <div className="absolute inset-0 rounded-full border-3 border-slate-200 border-t-[#014645] animate-spin" />
              <img 
                src="/logo.png" 
                alt="Letsellr Logo" 
                className="h-7 w-auto z-10 animate-pulse" 
              />
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 animate-pulse">
              Loading Property Details...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!property) return null;

  const photos = property.photos && property.photos.length > 0 
    ? property.photos 
    : ["https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80"];

  const currentPhoto = photos[activePhotoIndex] || photos[0];

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 flex flex-col font-sans pb-20">
      <OwnerNavbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Top Header & Breadcrumb Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs text-left">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate("/owner/properties")}
              className="h-9 w-9 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-600 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
              title="Back to Properties"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#014645] bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200/60">
                  {property.ref}
                </span>
                {getStatusBadge(property.status)}
              </div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight my-0.5 truncate">
                {property.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
            <Link to={`/owner/properties/${property.id}/edit`}>
              <Button className="bg-[#014645] hover:bg-[#013534] text-white font-extrabold text-xs px-4 h-9.5 rounded-xl flex items-center gap-2 shadow-2xs cursor-pointer">
                <Edit className="h-4 w-4" /> Edit Listing
              </Button>
            </Link>

            <Link to={`/properties/${property.id}`} target="_blank">
              <Button variant="outline" className="border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold text-xs px-3.5 h-9.5 rounded-xl flex items-center gap-1.5 cursor-pointer">
                <ExternalLink className="h-3.5 w-3.5 text-slate-500" /> Preview
              </Button>
            </Link>

            {(property.status === "draft" || property.status === "rejected") && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
                className="font-extrabold text-xs px-3.5 h-9.5 rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" /> {deleting ? "Deleting..." : "Delete"}
              </Button>
            )}
          </div>
        </div>

        {/* Status Banners */}
        {property.status === "rejected" && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 space-y-3 shadow-2xs text-left">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-rose-800 font-black text-sm my-0">
                <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0" />
                <span>Listing Moderation Feedback</span>
              </div>
              <Badge className="bg-rose-200/80 text-rose-900 border-0 text-[10px] font-bold uppercase">Action Required</Badge>
            </div>
            <p className="text-xs text-rose-800 font-medium leading-relaxed pl-7 my-0">
              {property.admin_review_reason || "Your listing requires corrections before it can be published. Please update the listing details as advised."}
            </p>
            <div className="pl-7 pt-1">
              <Link to={`/owner/properties/${property.id}/edit`}>
                <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs h-9 px-4 rounded-xl flex items-center gap-1.5 shadow-2xs">
                  <Edit className="h-3.5 w-3.5" /> Edit & Resubmit Listing
                </Button>
              </Link>
            </div>
          </div>
        )}

        {property.status === "pending_review" && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-2 shadow-2xs text-left">
            <div className="flex items-center gap-2 text-amber-800 font-black text-sm my-0">
              <Clock className="h-5 w-5 text-amber-600 shrink-0 animate-pulse" />
              <span>Under Verification Review</span>
            </div>
            <p className="text-xs text-amber-800 font-medium leading-relaxed pl-7 my-0">
              Our moderation team is reviewing your listing parameters. It will automatically go live on the platform once approved.
            </p>
          </div>
        )}

        {/* Analytics & Performance Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex items-center justify-between hover:border-slate-300 transition-all">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Total Views</span>
              <span className="text-2xl font-black text-slate-900 block leading-none">{property.stats?.views || 0}</span>
              <span className="text-[10px] font-semibold text-slate-500">Impressions on site</span>
            </div>
            <div className="h-11 w-11 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
              <Eye className="h-5 w-5" />
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex items-center justify-between hover:border-emerald-300 transition-all">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block">Leads / Enquiries</span>
              <span className="text-2xl font-black text-emerald-700 block leading-none">{property.stats?.enquiries || 0}</span>
              <span className="text-[10px] font-semibold text-emerald-700">Direct WhatsApp / Calls</span>
            </div>
            <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <MessageSquare className="h-5 w-5" />
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex items-center justify-between hover:border-rose-200 transition-all">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-800 block">Favorites / Saves</span>
              <span className="text-2xl font-black text-rose-700 block leading-none">{property.stats?.saves || 0}</span>
              <span className="text-[10px] font-semibold text-slate-500">Bookmarked by users</span>
            </div>
            <div className="h-11 w-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <Heart className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Hero Gallery & Core Info */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
          
          {/* Main Gallery Display (7 cols) */}
          <div className="lg:col-span-7 space-y-3">
            <div className="relative rounded-2xl overflow-hidden aspect-16/10 bg-slate-900 border border-slate-200/80 shadow-xs group">
              <img
                src={currentPhoto}
                alt={property.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-linear-to-t from-slate-950/70 via-transparent to-transparent" />
              
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-white bg-slate-950/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/20">
                  {property.category.replace("_", " ")}
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-950/80 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-emerald-500/30">
                  For {property.intent}
                </span>
              </div>

              <div className="absolute bottom-3 right-3 text-white">
                <span className="text-[10px] font-bold bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/20">
                  Photo {activePhotoIndex + 1} of {photos.length}
                </span>
              </div>
            </div>

            {/* Gallery Thumbnails */}
            {photos.length > 1 && (
              <div className="flex items-center gap-2.5 overflow-x-auto pb-1 no-scrollbar">
                {photos.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActivePhotoIndex(idx)}
                    className={`h-16 w-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                      activePhotoIndex === idx
                        ? "border-[#014645] ring-2 ring-emerald-500/30 scale-95"
                        : "border-slate-200/80 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={p} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Pricing & Key Details Summary Card (5 cols) */}
          <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs flex flex-col justify-between space-y-6">
            <div className="space-y-5">
              {/* Title & Pricing */}
              <div>
                <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest block mb-1">
                  Listing Financials
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900">
                    ₹{property.price.toLocaleString()}
                  </span>
                  <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                    {property.price_unit === "per_month" ? "/ Month" : property.price_unit}
                  </span>
                </div>
                {property.deposit && property.deposit > 0 && (
                  <p className="text-xs text-slate-500 font-semibold mt-1 mb-0">
                    Security Deposit: <strong className="text-slate-800">₹{property.deposit.toLocaleString()}</strong>
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                  Location Information
                </span>
                <p className="text-xs text-slate-700 font-bold flex items-start gap-2 my-0 leading-relaxed">
                  <MapPin className="h-4 w-4 text-[#014645] shrink-0 mt-0.5" />
                  <span>
                    {property.location_address ? `${property.location_address}, ` : ""}
                    {property.location_area}, {property.location_city}, {property.location_state} - {property.location_pincode}
                  </span>
                </p>
              </div>

              {/* Quick Spec Highlights */}
              <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 space-y-0.5">
                  <span className="text-slate-400 font-extrabold block text-[9.5px] uppercase tracking-wider">Carpet Area</span>
                  <span className="font-extrabold text-slate-900 flex items-center gap-1">
                    <Maximize2 className="h-3.5 w-3.5 text-slate-500" />
                    {property.area ? `${property.area} sq.ft` : "N/A"}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 space-y-0.5">
                  <span className="text-slate-400 font-extrabold block text-[9.5px] uppercase tracking-wider">Bedrooms</span>
                  <span className="font-extrabold text-slate-900 flex items-center gap-1">
                    <Bed className="h-3.5 w-3.5 text-slate-500" />
                    {property.bedrooms ? `${property.bedrooms} Beds` : "N/A"}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 space-y-0.5">
                  <span className="text-slate-400 font-extrabold block text-[9.5px] uppercase tracking-wider">Bathrooms</span>
                  <span className="font-extrabold text-slate-900 flex items-center gap-1">
                    <Bath className="h-3.5 w-3.5 text-slate-500" />
                    {property.bathrooms ? `${property.bathrooms} Baths` : "N/A"}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 space-y-0.5">
                  <span className="text-slate-400 font-extrabold block text-[9.5px] uppercase tracking-wider">Furnishing</span>
                  <span className="font-extrabold text-slate-900 capitalize flex items-center gap-1">
                    <Sofa className="h-3.5 w-3.5 text-slate-500" />
                    {property.furnishing || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <Link to={`/owner/properties/${property.id}/edit`} className="w-full">
                <Button className="w-full bg-[#014645] hover:bg-[#013534] text-white font-extrabold text-xs h-10 rounded-xl flex items-center justify-center gap-2 shadow-2xs cursor-pointer">
                  <Edit className="h-4 w-4" /> Edit Property Details
                </Button>
              </Link>
            </div>
          </div>

        </div>

        {/* Detailed Sections: Description & Amenities & Contact Details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">

          {/* Left Main Content (8 cols) */}
          <div className="lg:col-span-8 space-y-6">

            {/* Property Description Card */}
            {property.description && (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-3">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider my-0 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-[#014645]" /> Description
                </h3>
                <p className="text-xs text-slate-600 font-normal leading-relaxed whitespace-pre-line my-0">
                  {property.description}
                </p>
              </div>
            )}

            {/* Amenities & Facilities Card */}
            {property.amenities && property.amenities.length > 0 && (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-3">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider my-0 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-600" /> Amenities & Facilities
                </h3>
                <div className="flex flex-wrap gap-2.5 pt-1">
                  {property.amenities.map((item) => (
                    <span
                      key={item}
                      className="bg-emerald-50 text-emerald-800 font-extrabold text-xs px-3.5 py-1.5 rounded-xl border border-emerald-200/60 flex items-center gap-1.5 shadow-2xs"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Right Sidebar Metadata (4 cols) */}
          <div className="lg:col-span-4 space-y-6">

            {/* Contact Details Card */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider my-0 border-b border-slate-100 pb-3">
                Owner Contact Details
              </h3>
              
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-slate-400" /> Phone
                  </span>
                  <span className="font-extrabold text-slate-900">{property.owner_phone}</span>
                </div>

                {property.owner_whatsapp && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                      <MessageCircle className="h-3.5 w-3.5 text-emerald-600" /> WhatsApp
                    </span>
                    <span className="font-extrabold text-slate-900">{property.owner_whatsapp}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" /> Posted Date
                  </span>
                  <span className="font-extrabold text-slate-700">
                    {new Date(property.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </main>
    </div>
  );
};
