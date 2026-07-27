import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Search, 
  Plus, 
  Building2, 
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

// Import shadcn components
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOwnerProperties();
  }, []);

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
          <Badge variant="success" className="font-extrabold uppercase tracking-wider text-[9px] px-2.5 py-0.5 flex items-center gap-1.5 shrink-0 rounded-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Live
          </Badge>
        );
      case "pending_review":
        return (
          <Badge variant="warning" className="font-extrabold uppercase tracking-wider text-[9px] px-2.5 py-0.5 flex items-center gap-1 shrink-0 rounded-md">
            <Clock className="h-3 w-3" /> Pending Review
          </Badge>
        );
      case "draft":
        return (
          <Badge variant="secondary" className="font-extrabold uppercase tracking-wider text-[9px] px-2.5 py-0.5 flex items-center gap-1 shrink-0 rounded-md">
            <FileEdit className="h-3 w-3" /> Draft
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive" className="font-extrabold uppercase tracking-wider text-[9px] px-2.5 py-0.5 flex items-center gap-1 shrink-0 rounded-md">
            <XCircle className="h-3 w-3" /> Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="font-extrabold uppercase tracking-wider text-[9px] px-2.5 py-0.5 flex items-center gap-1 shrink-0 rounded-md">
            <AlertTriangle className="h-3 w-3" /> {status === "expired" ? "Expired" : "Inactive"}
          </Badge>
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
    <div className="min-h-screen bg-slate-50/70 flex flex-col font-sans pb-20 md:pb-8 text-slate-900">
      <OwnerNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Header & Title Action */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="text-left">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight my-0">
              My Property Listings
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-500 font-semibold mt-0.5 sm:mt-1">
              View, edit, and monitor performance across all your property listings.
            </p>
          </div>

          <Link to="/owner/properties/new">
            <Button className="bg-brand-green hover:bg-brand-green-hover text-white font-extrabold text-xs px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-2xs transition-all cursor-pointer shrink-0 border-0 h-9.5">
              <Plus className="h-4 w-4" /> Add Property Listing
            </Button>
          </Link>
        </div>

        {/* Filter Controls: Search & Status Pills */}
        <Card className="border border-slate-200/80 rounded-xl p-4 shadow-2xs space-y-3.5 text-left">
          
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, location area, city, or reference code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-green focus:border-brand-green transition-all"
            />
          </div>

          {/* Status Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {statusPills.map((pill) => (
              <button
                key={pill.value}
                onClick={() => setStatusFilter(pill.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  statusFilter === pill.value
                    ? "bg-brand-green text-white shadow-2xs"
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

        </Card>

        {/* Property Cards List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="border border-slate-200/80 rounded-xl p-4 h-28 animate-pulse flex items-center gap-4">
                <div className="h-16 w-16 bg-slate-200 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 bg-slate-200 rounded-md" />
                  <div className="h-3 w-1/4 bg-slate-200 rounded-md" />
                </div>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border border-dashed border-slate-300 rounded-xl p-8 sm:p-12 text-center space-y-4 flex flex-col items-center justify-center">
            <Building2 className="h-12 w-12 text-slate-300" />
            <div>
              <h3 className="text-base font-extrabold text-slate-900 my-0">No properties found</h3>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your search query or status filter."
                  : "Post your first property listing to get started."}
              </p>
            </div>
            {statusFilter !== "all" || searchQuery ? (
              <button
                onClick={() => { setSearchQuery(""); setStatusFilter("all"); }}
                className="text-xs font-bold text-brand-green hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-0"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Reset Filters
              </button>
            ) : (
              <Link to="/owner/properties/new">
                <Button className="bg-brand-green text-white font-extrabold text-xs px-5 py-2.5 rounded-lg flex items-center gap-2 border-0 cursor-pointer h-9.5 shadow-2xs hover:bg-brand-green-hover transition-colors">
                  <Plus className="h-4 w-4" /> Add Property Listing
                </Button>
              </Link>
            )}
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((prop) => (
              <Card
                key={prop.id}
                className="border border-slate-200/80 hover:border-slate-300 rounded-xl p-4 shadow-2xs hover:shadow-md transition-all space-y-3.5 text-left"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  
                  {/* Property Info */}
                  <div className="flex items-start gap-3.5 sm:gap-4 min-w-0 flex-1">
                    <img
                      src={prop.photos && prop.photos.length > 0 ? prop.photos[0] : "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=400&q=80"}
                      alt=""
                      className="h-16 w-16 sm:h-24 sm:w-24 rounded-lg object-cover shrink-0 border border-slate-100"
                    />

                    <div className="space-y-1 sm:space-y-1.5 min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <Badge variant="secondary" className="font-black text-slate-500 uppercase tracking-widest text-[9px] px-2 py-0.5 rounded-md">
                          {prop.ref}
                        </Badge>
                        <Badge variant="secondary" className="font-extrabold text-brand-green uppercase tracking-wider text-[9px] px-2 py-0.5 bg-emerald-50 border-emerald-100/50 rounded-md">
                          {prop.category.replace("_", " ")}
                        </Badge>
                        {getStatusBadge(prop.status)}
                      </div>

                      <h3 className="text-sm sm:text-base font-extrabold text-slate-900 truncate my-0">
                        {prop.title}
                      </h3>

                      <p className="text-xs text-slate-500 font-semibold truncate my-0">
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
                    <Link to={`/owner/properties/${prop.id}`} className="flex-1 sm:flex-initial">
                      <Button variant="outline" className="w-full text-slate-700 hover:text-slate-900 border border-slate-200 font-extrabold text-xs px-3.5 py-2 rounded-lg h-9 flex items-center justify-center gap-1.5 transition-colors cursor-pointer">
                        <ExternalLink className="h-3.5 w-3.5 text-slate-500" /> View
                      </Button>
                    </Link>

                    <Link to={`/owner/properties/${prop.id}/edit`} className="flex-1 sm:flex-initial">
                      <Button className="w-full bg-emerald-50 hover:bg-emerald-100 text-brand-green font-extrabold text-xs px-3.5 py-2 rounded-lg h-9 flex items-center justify-center gap-1.5 transition-colors border-0 cursor-pointer">
                        <Edit className="h-3.5 w-3.5 text-brand-green" /> Edit
                      </Button>
                    </Link>

                    {(prop.status === "draft" || prop.status === "rejected") && (
                      <Button
                        variant="destructive"
                        onClick={() => handleDelete(prop.id, prop.title)}
                        disabled={deletingId === prop.id}
                        className="flex-1 sm:flex-initial font-extrabold text-xs px-3.5 py-2 rounded-lg h-9 flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {deletingId === prop.id ? "Deleting..." : "Delete"}
                      </Button>
                    )}
                  </div>

                </div>

                {/* Admin Rejection Reason Banner if rejected */}
                {prop.status === "rejected" && prop.admin_review_reason && (
                  <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-3.5 text-xs text-rose-800 flex items-start gap-2.5">
                    <XCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-extrabold">Rejection Reason:</strong>{" "}
                      <span>{prop.admin_review_reason}</span>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

      </main>
    </div>
  );
};
