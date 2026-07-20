import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Search, 
  Plus, 
  Building2, 
  CheckCircle2, 
  Clock, 
  FileEdit, 
  XCircle, 
  AlertTriangle, 
  ExternalLink, 
  Edit, 
  Trash2, 
  Eye, 
  MessageSquare,
  RefreshCw
} from "lucide-react";
import { OwnerNavbar } from "@/components/OwnerNavbar";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface Property {
  id: string;
  ref: string;
  title: string;
  category: string;
  intent: string;
  price: number;
  price_unit: string;
  status: "draft" | "pending_review" | "live" | "rejected" | "expired" | "inactive";
  location_city: string;
  location_area: string;
  photos: string[];
  created_at: string;
  admin_review_reason?: string;
  stats: {
    views: number;
    enquiries: number;
    saves: number;
  };
}

export const OwnerPropertiesPage: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchOwnerProperties();
  }, []);

  const fetchOwnerProperties = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/properties/owner/me");
      setProperties(res.data || []);
    } catch (err) {
      console.error("Failed to load properties", err);
      toast.error("Failed to load your properties.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      setDeletingId(id);
      await api.delete(`/api/properties/${id}`);
      toast.success("Listing deleted successfully.");
      setProperties((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Failed to delete property", err);
      toast.error("Failed to delete listing.");
    } finally {
      setDeletingId(null);
    }
  };

  // Filtered properties
  const filtered = properties.filter((p) => {
    const matchesSearch = 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.ref.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.location_city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.location_area.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = 
      statusFilter === "all" || 
      p.status === statusFilter || 
      (statusFilter === "expired" && p.status === "inactive");

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: Property["status"]) => {
    switch (status) {
      case "live":
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
            <CheckCircle2 className="h-3 w-3" /> Live
          </span>
        );
      case "pending_review":
        return (
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200/60 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
            <Clock className="h-3 w-3" /> Pending Review
          </span>
        );
      case "draft":
        return (
          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
            <FileEdit className="h-3 w-3" /> Draft
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200/60 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
            <XCircle className="h-3 w-3" /> Rejected
          </span>
        );
      case "expired":
      case "inactive":
        return (
          <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 border border-gray-200 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
            <AlertTriangle className="h-3 w-3" /> {status === "expired" ? "Expired" : "Inactive"}
          </span>
        );
    }
  };

  const statusPills = [
    { label: "All Properties", value: "all", count: properties.length },
    { label: "Live", value: "live", count: properties.filter(p => p.status === "live").length },
    { label: "Pending", value: "pending_review", count: properties.filter(p => p.status === "pending_review").length },
    { label: "Drafts", value: "draft", count: properties.filter(p => p.status === "draft").length },
    { label: "Rejected", value: "rejected", count: properties.filter(p => p.status === "rejected").length },
    { label: "Expired", value: "expired", count: properties.filter(p => p.status === "expired" || p.status === "inactive").length },
  ];

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col font-sans pb-20 md:pb-8">
      <OwnerNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Header & Title Action */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight my-0">
              My Property Listings
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-500 font-semibold mt-0.5 sm:mt-1">
              View, edit, and monitor performance across all your property listings.
            </p>
          </div>

          <Link
            to="/owner/properties/new"
            className="bg-brand-green hover:bg-brand-green-hover text-white font-extrabold text-xs px-4 sm:px-5 py-2 sm:py-2.5 rounded-full flex items-center gap-2 shadow-sm transition-all cursor-pointer shrink-0"
          >
            <Plus className="h-4 w-4" /> Add Property Listing
          </Link>
        </div>

        {/* Filter Controls: Search & Status Pills */}
        <div className="bg-white border border-slate-100 rounded-3xl p-3.5 sm:p-5 shadow-xs space-y-3.5 sm:space-y-4">
          
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, location area, city, or reference code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-2 sm:py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green transition-all"
            />
          </div>

          {/* Status Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 no-scrollbar">
            {statusPills.map((pill) => (
              <button
                key={pill.value}
                onClick={() => setStatusFilter(pill.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  statusFilter === pill.value
                    ? "bg-brand-green text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                }`}
              >
                <span>{pill.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  statusFilter === pill.value ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                }`}>
                  {pill.count}
                </span>
              </button>
            ))}
          </div>

        </div>

        {/* Property Cards List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white border border-slate-100 rounded-3xl p-5 h-32 animate-pulse flex items-center gap-4">
                <div className="h-20 w-20 bg-slate-200 rounded-2xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 bg-slate-200 rounded" />
                  <div className="h-3 w-1/4 bg-slate-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-8 sm:p-12 text-center space-y-4 flex flex-col items-center justify-center">
            <Building2 className="h-12 w-12 text-slate-300" />
            <div>
              <h3 className="text-base font-bold text-slate-900">No properties found</h3>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your search query or status filter."
                  : "Post your first property listing to get started."}
              </p>
            </div>
            {statusFilter !== "all" || searchQuery ? (
              <button
                onClick={() => { setSearchQuery(""); setStatusFilter("all"); }}
                className="text-xs font-bold text-brand-green hover:underline flex items-center gap-1"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Reset Filters
              </button>
            ) : (
              <Link
                to="/owner/properties/new"
                className="bg-brand-green text-white font-extrabold text-xs px-5 py-2.5 rounded-full flex items-center gap-2"
              >
                <Plus className="h-4 w-4" /> Add Property Listing
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((prop) => (
              <div
                key={prop.id}
                className="bg-white border border-slate-100 hover:border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  
                  {/* Property Info */}
                  <div className="flex items-start gap-3.5 sm:gap-4 min-w-0 flex-1">
                    <img
                      src={prop.photos && prop.photos.length > 0 ? prop.photos[0] : "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=400&q=80"}
                      alt=""
                      className="h-16 w-16 sm:h-24 sm:w-24 rounded-2xl object-cover shrink-0 border border-slate-100"
                    />

                    <div className="space-y-1 sm:space-y-1.5 min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-md">
                          {prop.ref}
                        </span>
                        <span className="text-[10px] font-extrabold text-brand-green uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-md">
                          {prop.category.replace("_", " ")}
                        </span>
                        {getStatusBadge(prop.status)}
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate my-0">
                        {prop.title}
                      </h3>

                      <p className="text-xs text-slate-500 font-semibold truncate">
                        {prop.location_area}, {prop.location_city}
                      </p>

                      <div className="flex items-center gap-3 sm:gap-4 pt-1 flex-wrap">
                        <span className="text-sm font-black text-slate-900">
                          ₹{prop.price.toLocaleString()}{" "}
                          <span className="text-[10px] text-slate-400 font-bold">
                            {prop.price_unit === "per_month" ? "/month" : "total"}
                          </span>
                        </span>

                        <div className="flex items-center gap-3 text-xs text-slate-400 font-semibold">
                          <span className="flex items-center gap-1" title="Views">
                            <Eye className="h-3.5 w-3.5" /> {prop.stats?.views || 0}
                          </span>
                          <span className="flex items-center gap-1" title="Leads">
                            <MessageSquare className="h-3.5 w-3.5" /> {prop.stats?.enquiries || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 shrink-0">
                    <Link
                      to={`/owner/properties/${prop.id}`}
                      className="flex-1 sm:flex-initial text-center bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs px-3.5 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> View
                    </Link>

                    <Link
                      to={`/owner/properties/${prop.id}/edit`}
                      className="flex-1 sm:flex-initial text-center bg-emerald-50 hover:bg-emerald-100 text-brand-green font-extrabold text-xs px-3.5 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Edit className="h-3.5 w-3.5" /> Edit
                    </Link>

                    {(prop.status === "draft" || prop.status === "rejected") && (
                      <button
                        onClick={() => handleDelete(prop.id, prop.title)}
                        disabled={deletingId === prop.id}
                        className="flex-1 sm:flex-initial bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold text-xs px-3.5 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {deletingId === prop.id ? "Deleting..." : "Delete"}
                      </button>
                    )}
                  </div>

                </div>

                {/* Admin Rejection Reason Banner if rejected */}
                {prop.status === "rejected" && prop.admin_review_reason && (
                  <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-3 text-xs text-rose-800 flex items-start gap-2.5">
                    <XCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-extrabold">Rejection Reason:</strong>{" "}
                      <span>{prop.admin_review_reason}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
};
