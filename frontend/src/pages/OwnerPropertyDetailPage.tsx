import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Eye, 
  MessageSquare, 
  Heart, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  MapPin
} from "lucide-react";
import { OwnerNavbar } from "@/components/OwnerNavbar";
import { toast } from "sonner";
import { api } from "@/lib/api";

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
      toast.success("Listing deleted.");
      navigate("/owner/properties");
    } catch (err) {
      console.error("Delete failed", err);
      toast.error("Failed to delete property.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <OwnerNavbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-brand-green" />
            <p className="text-xs font-bold text-slate-500">Loading property details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!property) return null;

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col font-sans pb-12">
      <OwnerNavbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Top Navigation & Action Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <button
            onClick={() => navigate("/owner/properties")}
            className="inline-flex items-center gap-2 text-xs font-extrabold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
          >
            <ArrowLeft className="h-4 w-4" /> Back to My Properties
          </button>

          <div className="flex items-center gap-2">
            <Link
              to={`/owner/properties/${property.id}/edit`}
              className="bg-brand-green hover:bg-brand-green-hover text-white font-extrabold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition-all"
            >
              <Edit className="h-4 w-4" /> Edit Listing
            </Link>

            {(property.status === "draft" || property.status === "rejected") && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="h-4 w-4" /> {deleting ? "Deleting..." : "Delete"}
              </button>
            )}
          </div>
        </div>

        {/* Status Notification Banner */}
        {property.status === "rejected" && (
          <div className="bg-rose-50 border border-rose-200 rounded-3xl p-5 text-rose-900 space-y-2 shadow-xs">
            <div className="flex items-center gap-2 font-extrabold text-sm text-rose-700">
              <XCircle className="h-5 w-5 text-rose-600" /> Property Listing Rejected
            </div>
            <p className="text-xs font-medium text-rose-800">
              <strong>Admin Feedback:</strong> {property.admin_review_reason || "Please update your property information to comply with listing guidelines."}
            </p>
            <div className="pt-1">
              <Link
                to={`/owner/properties/${property.id}/edit`}
                className="inline-flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2 rounded-full shadow-xs"
              >
                <Edit className="h-3.5 w-3.5" /> Edit & Resubmit Listing
              </Link>
            </div>
          </div>
        )}

        {property.status === "pending_review" && (
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 text-amber-900 space-y-1 shadow-xs">
            <div className="flex items-center gap-2 font-extrabold text-sm text-amber-800">
              <Clock className="h-5 w-5 text-amber-600" /> Pending Admin Review
            </div>
            <p className="text-xs font-medium text-amber-700">
              Your property has been submitted and is undergoing admin review. It will become visible on the public search once approved.
            </p>
          </div>
        )}

        {property.status === "live" && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-5 text-emerald-900 space-y-1 shadow-xs">
            <div className="flex items-center gap-2 font-extrabold text-sm text-emerald-800">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" /> Listing is Live
            </div>
            <p className="text-xs font-medium text-emerald-700">
              Your property is live and receiving active buyer & tenant traffic on Letsellr.
            </p>
          </div>
        )}

        {/* Performance Metrics Bar */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Eye className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Views</span>
              <span className="text-2xl font-black text-slate-900">{property.stats?.views || 0}</span>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
              <MessageSquare className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Leads / Enquiries</span>
              <span className="text-2xl font-black text-slate-900">{property.stats?.enquiries || 0}</span>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <Heart className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Favorites / Saves</span>
              <span className="text-2xl font-black text-slate-900">{property.stats?.saves || 0}</span>
            </div>
          </div>
        </div>

        {/* Main Details Card */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          
          {/* Header Info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2.5 py-1 rounded-md">
                  {property.ref}
                </span>
                <span className="text-xs font-extrabold text-brand-green uppercase tracking-wider bg-emerald-50 px-2.5 py-1 rounded-md">
                  {property.category.replace("_", " ")}
                </span>
                <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded-md">
                  For {property.intent}
                </span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight my-0">
                {property.title}
              </h1>
              <p className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                {property.location_area}, {property.location_city}, {property.location_state} - {property.location_pincode}
              </p>
            </div>

            <div className="text-left sm:text-right shrink-0">
              <span className="text-3xl font-black text-slate-900 block">
                ₹{property.price.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-slate-400">
                {property.price_unit === "per_month" ? "Per Month" : "Total Price"}
              </span>
            </div>
          </div>

          {/* Photo Gallery Grid */}
          {property.photos && property.photos.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {property.photos.map((photo, i) => (
                <img
                  key={i}
                  src={photo}
                  alt=""
                  className="h-48 w-full object-cover rounded-2xl border border-slate-100 shadow-xs"
                />
              ))}
            </div>
          )}

          {/* Description */}
          {property.description && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900 my-0">Description</h3>
              <p className="text-xs text-slate-600 font-normal leading-relaxed whitespace-pre-line">
                {property.description}
              </p>
            </div>
          )}

          {/* Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Area</span>
              <span className="text-sm font-black text-slate-900">{property.area ? `${property.area} sq ft` : "N/A"}</span>
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Bedrooms</span>
              <span className="text-sm font-black text-slate-900">{property.bedrooms ?? "N/A"}</span>
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Bathrooms</span>
              <span className="text-sm font-black text-slate-900">{property.bathrooms ?? "N/A"}</span>
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Furnishing</span>
              <span className="text-sm font-black text-slate-900 capitalize">{property.furnishing || "N/A"}</span>
            </div>
          </div>

          {/* Amenities */}
          {property.amenities && property.amenities.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900 my-0">Amenities & Facilities</h3>
              <div className="flex flex-wrap gap-2">
                {property.amenities.map((item) => (
                  <span key={item} className="bg-emerald-50 text-brand-green font-extrabold text-xs px-3 py-1 rounded-full border border-emerald-100">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Owner Phone & WhatsApp */}
          <div className="border-t border-slate-100 pt-6 space-y-2">
            <h3 className="text-sm font-bold text-slate-900 my-0">Owner Contact Info</h3>
            <p className="text-xs font-semibold text-slate-600">
              Phone: <strong>{property.owner_phone}</strong> {property.owner_whatsapp && `• WhatsApp: ${property.owner_whatsapp}`}
            </p>
          </div>

        </div>

      </main>
    </div>
  );
};
