import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  CheckCircle2,
  Clock,
  FileEdit,
  XCircle,
  AlertTriangle,
  Sparkles,
  ExternalLink,
  Edit,
  TrendingUp,
  Search,
  SlidersHorizontal,
  Trash2,
  MapPin,
  ChevronRight
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { OwnerNavbar } from "@/components/OwnerNavbar";
import { api } from "@/lib/api";
import { toast } from "sonner";

// Import shadcn components
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

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

export const OwnerDashboard: React.FC = () => {
  const { user } = useAuth();

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  // Filter states
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Mobile sheet state
  const [sheetOpen, setSheetOpen] = useState(false);

  const fetchOwnerProperties = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/properties/owner/me");
      const list: Property[] = res.data || [];
      setProperties(list);
      if (list.length > 0) {
        setSelectedPropertyId(list[0].id);
      }
    } catch (err) {
      console.error("Failed to load owner properties", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOwnerProperties();
  }, []);

  const handleDeleteProperty = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this property listing?")) return;
    try {
      await api.delete(`/api/properties/${id}`);
      toast.success("Property deleted successfully");
      const updated = properties.filter((p) => p.id !== id);
      setProperties(updated);
      setSheetOpen(false);
      if (selectedPropertyId === id) {
        setSelectedPropertyId(updated.length > 0 ? updated[0].id : null);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      console.error("Failed to delete property", error);
      toast.error(error.response?.data?.detail || "Failed to delete property");
    }
  };

  // Stats calculation
  const totalProperties = properties.length;
  const liveCount = properties.filter((p) => p.status === "live").length;
  const pendingCount = properties.filter((p) => p.status === "pending_review").length;
  const draftCount = properties.filter((p) => p.status === "draft").length;
  const rejectedCount = properties.filter((p) => p.status === "rejected").length;

  const totalViews = properties.reduce((acc, p) => acc + (p.stats?.views || 0), 0);
  const totalLeads = properties.reduce((acc, p) => acc + (p.stats?.enquiries || 0), 0);

  const isAgency = user?.role === "agency";

  // Filter properties for master list
  const filteredProperties = properties.filter((p) => {
    if (filterStatus !== "all" && p.status !== filterStatus) return false;
    if (filterCategory !== "all" && p.category !== filterCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchRef = p.ref.toLowerCase().includes(q);
      const matchCity = p.location_city?.toLowerCase().includes(q);
      const matchArea = p.location_area?.toLowerCase().includes(q);
      return matchTitle || matchRef || matchCity || matchArea;
    }
    return true;
  });

  const selectedProperty = properties.find((p) => p.id === selectedPropertyId) || filteredProperties[0] || null;

  const handlePropertySelect = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    if (window.innerWidth < 1024) { // lg breakpoint is 1024px
      setSheetOpen(true);
    }
  };

  const getStatusBadge = (status: Property["status"]) => {
    switch (status) {
      case "live":
        return (
          <Badge variant="success" className="font-extrabold uppercase tracking-wider text-[9px] px-2 py-0.5 flex items-center gap-1 shrink-0">
            <CheckCircle2 className="h-3 w-3 shrink-0" /> Live
          </Badge>
        );
      case "pending_review":
        return (
          <Badge variant="warning" className="font-extrabold uppercase tracking-wider text-[9px] px-2 py-0.5 flex items-center gap-1 shrink-0">
            <Clock className="h-3 w-3 shrink-0" /> Pending Review
          </Badge>
        );
      case "draft":
        return (
          <Badge variant="secondary" className="font-extrabold uppercase tracking-wider text-[9px] px-2 py-0.5 flex items-center gap-1 shrink-0">
            <FileEdit className="h-3 w-3 shrink-0" /> Draft
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive" className="font-extrabold uppercase tracking-wider text-[9px] px-2 py-0.5 flex items-center gap-1 shrink-0">
            <XCircle className="h-3 w-3 shrink-0" /> Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="font-extrabold uppercase tracking-wider text-[9px] px-2 py-0.5 flex items-center gap-1 shrink-0">
            <AlertTriangle className="h-3 w-3 shrink-0" /> {status}
          </Badge>
        );
    }
  };

  const renderPropertyInspector = (prop: Property) => {
    return (
      <div className="space-y-6 text-left">
        {/* Detail Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-brand-green uppercase tracking-widest">
                {prop.ref}
              </span>
              {getStatusBadge(prop.status)}
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight my-0">
              {prop.title}
            </h2>
            <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              {prop.location_area}, {prop.location_city}
            </p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-xl sm:text-2xl font-black text-slate-900">₹{prop.price.toLocaleString()}</span>
            <span className="text-xs text-slate-400 font-semibold block uppercase">
              {prop.price_unit === "per_month" ? "/ Month" : prop.price_unit}
            </span>
          </div>
        </div>

        {/* Admin Status Banner */}
        {prop.status === "rejected" && (
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 space-y-1">
            <div className="flex items-center gap-2 text-rose-700 font-bold text-xs">
              <XCircle className="h-4 w-4" /> Listing Moderation Feedback (Action Required)
            </div>
            <p className="text-xs text-rose-800 font-medium pl-6">
              {prop.admin_review_reason || "Please update your property information to comply with listing guidelines."}
            </p>
          </div>
        )}

        {prop.status === "pending_review" && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-1">
            <div className="flex items-center gap-2 text-amber-700 font-bold text-xs">
              <Clock className="h-4 w-4" /> Pending Admin Moderation
            </div>
            <p className="text-xs text-amber-800 font-medium pl-6">
              Your property is currently being reviewed by our moderation team. It will go live once verified.
            </p>
          </div>
        )}

        {/* Performance Metrics Grid */}
        <div className="grid grid-cols-3 gap-3 bg-slate-50/80 border border-slate-100 rounded-lg p-4">
          <div className="text-center space-y-0.5">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Total Views</span>
            <span className="text-lg sm:text-xl font-black text-slate-900">{prop.stats?.views || 0}</span>
          </div>
          <div className="text-center space-y-0.5 border-x border-slate-200/60">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Leads / Enquiries</span>
            <span className="text-lg sm:text-xl font-black text-brand-green">{prop.stats?.enquiries || 0}</span>
          </div>
          <div className="text-center space-y-0.5">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Favorites</span>
            <span className="text-lg sm:text-xl font-black text-brand-deep-green">{prop.stats?.saves || 0}</span>
          </div>
        </div>

        {/* Property Specs Breakdown */}
        <div className="space-y-2">
          <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">
            Property Specs
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
              <span className="text-slate-400 font-semibold block text-[10px]">Category</span>
              <span className="font-bold text-slate-900 capitalize">{prop.category}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
              <span className="text-slate-400 font-semibold block text-[10px]">Intent</span>
              <span className="font-bold text-slate-900 capitalize">{prop.intent}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
              <span className="text-slate-400 font-semibold block text-[10px]">Created Date</span>
              <span className="font-bold text-slate-900">
                {new Date(prop.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Inspector Actions */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Link to={`/owner/properties/${prop.id}/edit`}>
              <Button className="bg-brand-green hover:bg-brand-green-hover text-white font-extrabold text-xs px-5 py-2.5 rounded-md flex items-center gap-2 shadow-xs transition-all cursor-pointer">
                <Edit className="h-4 w-4" /> Edit Listing
              </Button>
            </Link>
            <Link to={`/owner/properties/${prop.id}`}>
              <Button variant="outline" className="text-slate-700 hover:text-slate-900 font-bold text-xs px-4 py-2.5 rounded-md border border-slate-200 transition-colors flex items-center gap-1.5">
                <ExternalLink className="h-3.5 w-3.5 text-slate-500" /> View Details
              </Button>
            </Link>
          </div>

          {(prop.status === "draft" || prop.status === "rejected") && (
            <Button
              variant="destructive"
              onClick={() => handleDeleteProperty(prop.id)}
              className="font-extrabold text-xs px-4 py-2.5 rounded-md flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 flex flex-col font-sans pb-20 md:pb-12">
      <OwnerNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Top Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <img src="/logo.png" alt="Letsellr Logo" className="h-9 sm:h-12 w-auto shrink-0" />
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight my-0 flex items-center gap-1.5 sm:gap-2 leading-tight">
                <span>Property Dashboard</span>
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-brand-green shrink-0" />
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-500 font-semibold mt-0.5 truncate">
                {isAgency ? "Agency Partner Workspace" : "Owner Self-Listing Workspace"} • {totalProperties} Total Managed Listings
              </p>
            </div>
          </div>
        </div>

        {/* Top Light Metrics Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* Left Stats Overview Card */}
          <Card className="lg:col-span-8 bg-white border border-slate-100 rounded-xl p-4 sm:p-6 shadow-xs flex flex-col justify-between gap-5">
            <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
              <span className="text-xs font-black uppercase tracking-wider text-brand-green flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 shrink-0" /> Business & Traffic Performance
              </span>
              <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200/60 whitespace-nowrap shrink-0">
                Real-Time Data
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400">Total Views</span>
                <p className="text-xl sm:text-2xl font-black text-slate-900 my-0">{totalViews.toLocaleString()}</p>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                  <div className="bg-brand-green h-full rounded-full" style={{ width: `${Math.min(100, (totalViews / 50) * 100)}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400">Total Leads</span>
                <p className="text-xl sm:text-2xl font-black text-brand-green my-0">{totalLeads.toLocaleString()}</p>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                  <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${Math.min(100, (totalLeads / 20) * 100)}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400">Live Listings</span>
                <p className="text-xl sm:text-2xl font-black text-slate-900 my-0">{liveCount}</p>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                  <div className="bg-brand-green h-full rounded-full" style={{ width: `${Math.min(100, (liveCount / Math.max(1, totalProperties)) * 100)}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400">Pending Review</span>
                <p className="text-xl sm:text-2xl font-black text-amber-600 my-0">{pendingCount}</p>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${Math.min(100, (pendingCount / Math.max(1, totalProperties)) * 100)}%` }} />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 font-medium">
              <span>Drafts: <strong className="text-slate-900">{draftCount}</strong> • Rejected: <strong className="text-rose-600">{rejectedCount}</strong></span>
              <span className="text-[11px] text-slate-400">Updated just now</span>
            </div>
          </Card>

          {/* Right Highlight Brand Accent Card */}
          <Card className="lg:col-span-4 bg-linear-to-br from-[#014645] to-[#013534] text-white rounded-xl p-5 sm:p-6 shadow-md flex flex-col justify-between relative overflow-hidden space-y-4 lg:space-y-0 border-0">
            <div className="space-y-2 sm:space-y-3 relative z-10 text-left">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-200/90 block">
                Manage & Upgrade
              </span>
              <p className="text-2xl sm:text-3xl font-black text-white tracking-tight my-0">
                {totalProperties} <span className="text-xs sm:text-sm font-semibold text-emerald-100/80">Listings Active</span>
              </p>
              <p className="text-xs text-slate-200 font-medium">
                Increase your visibility by submitting complete property details and high-resolution photos.
              </p>
            </div>

            <div className="pt-2 sm:pt-4 relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Link to="/owner/properties/new" className="flex-1">
                <Button className="w-full bg-white hover:bg-slate-100 text-brand-green font-extrabold text-xs py-2.5 rounded-lg text-center shadow-xs transition-all cursor-pointer">
                  Post New Listing
                </Button>
              </Link>
              <Link to="/owner/properties" className="flex-1 sm:flex-initial">
                <Button variant="outline" className="w-full bg-white/15 hover:bg-white/25 text-white font-bold text-xs px-4 py-2.5 rounded-lg text-center border border-white/20 transition-colors">
                  Manage All
                </Button>
              </Link>
            </div>
          </Card>

        </div>

        {/* Active Filters Bar */}
        <div className="bg-white border border-slate-100 rounded-xl p-3 sm:p-3.5 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">

          {/* Status Tab Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 lg:pb-0 no-scrollbar">
            <span className="text-xs font-extrabold text-slate-400 px-1 shrink-0 flex items-center gap-1">
              <SlidersHorizontal className="h-3.5 w-3.5" /> Filters:
            </span>

            <button
              onClick={() => setFilterStatus("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all shrink-0 cursor-pointer ${filterStatus === "all" ? "bg-brand-green text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                }`}
            >
              All ({totalProperties})
            </button>
            <button
              onClick={() => setFilterStatus("live")}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all shrink-0 cursor-pointer ${filterStatus === "live" ? "bg-emerald-600 text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                }`}
            >
              Live ({liveCount})
            </button>
            <button
              onClick={() => setFilterStatus("pending_review")}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all shrink-0 cursor-pointer ${filterStatus === "pending_review" ? "bg-amber-600 text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setFilterStatus("draft")}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all shrink-0 cursor-pointer ${filterStatus === "draft" ? "bg-slate-700 text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                }`}
            >
              Drafts ({draftCount})
            </button>
            {rejectedCount > 0 && (
              <button
                onClick={() => setFilterStatus("rejected")}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all shrink-0 cursor-pointer ${filterStatus === "rejected" ? "bg-rose-600 text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                  }`}
              >
                Rejected ({rejectedCount})
              </button>
            )}
          </div>

          {/* Search & Category Filter Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
            {/* Shadcn Select for category filter */}
            <Select value={filterCategory} onValueChange={(val) => setFilterCategory(val || "all")}>
              <SelectTrigger className="w-full sm:w-44 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg h-8 px-3 font-semibold text-slate-800 text-xs focus:ring-1 focus:ring-brand-green">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-slate-100 shadow-md rounded-lg p-1 z-50">
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="pg">PG / Co-Living</SelectItem>
                <SelectItem value="hostel">Hostels</SelectItem>
                {isAgency && (
                  <>
                    <SelectItem value="apartment">Apartments</SelectItem>
                    <SelectItem value="house">Houses</SelectItem>
                    <SelectItem value="villa">Villas</SelectItem>
                    <SelectItem value="land">Plot / Land</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>

            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search title, ref, city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green transition-colors"
              />
            </div>
          </div>

        </div>

        {/* Master-Detail Split Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left Master List */}
          <Card className="lg:col-span-5 bg-white border border-slate-100 rounded-xl p-5 shadow-xs flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-extrabold text-slate-900 my-0">Properties List</h3>
                <Badge variant="secondary" className="px-2.5 py-0.5 rounded-full font-bold">
                  {filteredProperties.length} items
                </Badge>
              </div>

              {loading ? (
                <div className="space-y-3 pt-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-slate-100 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : filteredProperties.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <Building2 className="h-10 w-10 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-500 font-semibold">No property listings found matching filters.</p>
                </div>
              ) : (
                <div className="space-y-2.5 pt-3 max-h-[480px] overflow-y-auto custom-scrollbar pr-1">
                  {filteredProperties.map((prop) => {
                    const isSelected = selectedProperty?.id === prop.id;
                    return (
                      <div
                        key={prop.id}
                        onClick={() => handlePropertySelect(prop.id)}
                        className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center gap-3.5 text-left ${isSelected
                            ? "bg-[#014645] text-white border-[#014645] shadow-md scale-[1.01]"
                            : "bg-slate-50/70 hover:bg-slate-100/80 text-slate-900 border-slate-200/60"
                          }`}
                      >
                        <img
                          src={prop.photos && prop.photos.length > 0 ? prop.photos[0] : "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=400&q=80"}
                          alt=""
                          className="h-14 w-14 rounded-md object-cover shrink-0 border border-slate-200"
                        />
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-[10px] font-black uppercase tracking-wider ${isSelected ? "text-emerald-300" : "text-slate-400"}`}>
                              {prop.ref}
                            </span>
                            {getStatusBadge(prop.status)}
                          </div>
                          <h4 className={`text-xs font-bold truncate my-0 ${isSelected ? "text-white" : "text-slate-900"}`}>
                            {prop.title}
                          </h4>
                          <p className={`text-[11px] font-semibold truncate ${isSelected ? "text-slate-200" : "text-slate-500"}`}>
                            ₹{prop.price.toLocaleString()} • {prop.location_city}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold mt-4">
              <Link to="/owner/properties" className="text-brand-green hover:underline flex items-center gap-1">
                View Full Properties Manager <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </Card>

          {/* Right Detail Inspector (Desktop Only) */}
          <div className="hidden lg:block lg:col-span-7">
            <Card className="bg-white border border-slate-100 rounded-xl p-6 shadow-xs text-slate-900 flex flex-col justify-between min-h-120 h-full">
              {selectedProperty ? (
                renderPropertyInspector(selectedProperty)
              ) : (
                <div className="h-full flex flex-col items-center justify-center py-20 text-center space-y-3 text-slate-400">
                  <Building2 className="h-12 w-12 text-slate-300" />
                  <p className="text-xs font-semibold">Select a property listing from the left to view detailed inspector.</p>
                </div>
              )}
            </Card>
          </div>

        </div>

      </main>

      {/* Mobile Responsive Drawer (Sheet) for Listing Inspector */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="overflow-y-auto w-full sm:max-w-xl">
          <SheetHeader className="pb-4 border-b border-slate-100">
            <SheetTitle>Listing Inspector</SheetTitle>
            <SheetDescription>View performance and manage listing actions.</SheetDescription>
          </SheetHeader>
          {selectedProperty ? (
            <div className="py-6">
              {renderPropertyInspector(selectedProperty)}
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
};
