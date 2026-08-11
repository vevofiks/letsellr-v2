import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
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
  ChevronRight,
  Eye,
  MessageSquare,
  Bookmark
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
import { useConfirm } from "@/components/ConfirmDialogProvider";

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
  const confirm = useConfirm();

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  // Filter states
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Mobile sheet state
  const [sheetOpen, setSheetOpen] = useState(false);

  const [propertyTypes, setPropertyTypes] = useState<any[]>([]);

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
    const fetchConfig = async () => {
      try {
        const res = await api.get("/api/properties/config/types");
        setPropertyTypes(res.data);
      } catch (err) {
        console.error("Failed to load property types", err);
      }
    };
    fetchConfig();
  }, []);

  const handleDeleteProperty = async (id: string) => {
    const isConfirmed = await confirm({
      title: "Delete Property",
      description: "Are you sure you want to delete this property listing?",
      variant: "destructive"
    });
    if (!isConfirmed) return;
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
          <Badge variant="warning" className="font-extrabold uppercase tracking-wider text-[9px] px-2.5 py-0.5 flex items-center gap-1.5 shrink-0 rounded-md">
            <Clock className="h-3 w-3 shrink-0" /> Pending Review
          </Badge>
        );
      case "draft":
        return (
          <Badge variant="secondary" className="font-extrabold uppercase tracking-wider text-[9px] px-2.5 py-0.5 flex items-center gap-1.5 shrink-0 rounded-md">
            <FileEdit className="h-3 w-3 shrink-0" /> Draft
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive" className="font-extrabold uppercase tracking-wider text-[9px] px-2.5 py-0.5 flex items-center gap-1.5 shrink-0 rounded-md">
            <XCircle className="h-3 w-3 shrink-0" /> Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="font-extrabold uppercase tracking-wider text-[9px] px-2.5 py-0.5 flex items-center gap-1.5 shrink-0 rounded-md">
            <AlertTriangle className="h-3 w-3 shrink-0" /> {status}
          </Badge>
        );
    }
  };

  const renderPropertyInspector = (prop: Property) => {
    const coverImage = prop.photos && prop.photos.length > 0
      ? prop.photos[0]
      : "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80";

    return (
      <div className="space-y-5 text-left flex flex-col justify-between h-full">
        <div className="space-y-4">
          {/* Cover Preview Image Header */}
          <div className="relative rounded-xl overflow-hidden aspect-16/7 sm:aspect-21/9 bg-slate-900 border border-slate-200/80 shadow-2xs group">
            <img
              src={coverImage}
              alt={prop.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-linear-to-t from-slate-950/85 via-slate-950/30 to-transparent" />

            <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
              <span className="text-[10px] font-black text-white uppercase tracking-widest bg-slate-950/70 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/20 shadow-xs">
                {prop.ref}
              </span>
              {getStatusBadge(prop.status)}
            </div>

            <div className="absolute bottom-3 left-3 right-3 text-white">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-emerald-300 bg-emerald-950/80 backdrop-blur-xs px-2 py-0.5 rounded border border-emerald-500/30">
                  {prop.category.replace("_", " ")} • {prop.intent}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight my-0 line-clamp-1">
                {prop.title}
              </h3>
              <p className="text-xs text-slate-300 font-medium flex items-center gap-1 mt-0.5 my-0">
                <MapPin className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                {prop.location_area}, {prop.location_city}
              </p>
            </div>
          </div>

          {/* Pricing Banner */}
          <div className="flex items-center justify-between p-3.5 bg-emerald-50/60 border border-emerald-100/80 rounded-xl">
            <div>
              <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest block">
                Listing Price
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-black text-slate-900">₹{prop.price.toLocaleString()}</span>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {prop.price_unit === "per_month" ? "/ month" : prop.price_unit}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Created On
              </span>
              <span className="text-xs font-extrabold text-slate-700">
                {new Date(prop.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            </div>
          </div>

          {/* Admin Moderation Alerts */}
          {prop.status === "rejected" && (
            <div className="bg-rose-50 border border-rose-200/80 rounded-xl p-3.5 space-y-1 text-left">
              <div className="flex items-center gap-2 text-rose-700 font-extrabold text-xs my-0">
                <XCircle className="h-4 w-4 shrink-0" /> Listing Moderation Feedback
              </div>
              <p className="text-xs text-rose-800 font-medium pl-6 my-0">
                {prop.admin_review_reason || "Please update your property information to comply with listing guidelines."}
              </p>
            </div>
          )}

          {prop.status === "pending_review" && (
            <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3.5 space-y-1 text-left">
              <div className="flex items-center gap-2 text-amber-700 font-extrabold text-xs my-0">
                <Clock className="h-4 w-4 shrink-0 animate-pulse" /> Pending Admin Review
              </div>
              <p className="text-xs text-amber-800 font-medium pl-6 my-0">
                Your property is currently undergoing admin review. It will go live once verified.
              </p>
            </div>
          )}

          {/* Performance Metrics Cards */}
          <div>
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-2 text-left">
              Engagement & Stats
            </span>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3 text-center space-y-0.5 hover:border-slate-300 transition-colors">
                <div className="flex items-center justify-center gap-1 text-slate-400">
                  <Eye className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-extrabold uppercase tracking-wider">Views</span>
                </div>
                <span className="text-lg font-black text-slate-900 block leading-tight">{prop.stats?.views || 0}</span>
              </div>

              <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-xl p-3 text-center space-y-0.5 hover:border-emerald-300 transition-colors">
                <div className="flex items-center justify-center gap-1 text-emerald-700">
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-extrabold uppercase tracking-wider">Leads</span>
                </div>
                <span className="text-lg font-black text-emerald-700 block leading-tight">{prop.stats?.enquiries || 0}</span>
              </div>

              <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3 text-center space-y-0.5 hover:border-slate-300 transition-colors">
                <div className="flex items-center justify-center gap-1 text-slate-400">
                  <Bookmark className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-extrabold uppercase tracking-wider">Saved</span>
                </div>
                <span className="text-lg font-black text-slate-900 block leading-tight">{prop.stats?.saves || 0}</span>
              </div>
            </div>
          </div>

          {/* Specifications Grid */}
          <div className="space-y-2">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block text-left">
              Property Specifications
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 text-left space-y-0.5">
                <span className="text-slate-400 font-extrabold block text-[9.5px] uppercase tracking-wider">Category</span>
                <span className="font-extrabold text-slate-900 capitalize block truncate">{prop.category.replace("_", " ")}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 text-left space-y-0.5">
                <span className="text-slate-400 font-extrabold block text-[9.5px] uppercase tracking-wider">Intent</span>
                <span className="font-extrabold text-slate-900 capitalize block truncate">{prop.intent}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 text-left space-y-0.5">
                <span className="text-slate-400 font-extrabold block text-[9.5px] uppercase tracking-wider">Location</span>
                <span className="font-extrabold text-slate-900 block truncate">{prop.location_city}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Inspector Actions */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Link to={`/owner/properties/${prop.id}/edit`}>
              <Button className="bg-[#014645] hover:bg-[#013534] text-white font-extrabold text-xs px-4 py-2 rounded-lg flex items-center gap-2 shadow-2xs transition-all cursor-pointer h-9">
                <Edit className="h-4 w-4" /> Edit Listing
              </Button>
            </Link>
            <Link to={`/owner/properties/${prop.id}`}>
              <Button variant="outline" className="text-slate-700 hover:text-slate-900 font-extrabold text-xs px-4 py-2 rounded-lg border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer h-9">
                <ExternalLink className="h-3.5 w-3.5 text-slate-500" /> View Details
              </Button>
            </Link>
          </div>

          <Button
            variant="destructive"
            onClick={() => handleDeleteProperty(prop.id)}
            className="font-extrabold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer h-9"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 flex flex-col font-sans pb-20 md:pb-12">
      <OwnerNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Top Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 text-left">
          <div className="flex items-center gap-3 min-w-0">
            <img src="/logo.png" alt="Letsellr Logo" className="h-8 sm:h-10 w-auto shrink-0" />
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight my-0 flex items-center gap-2">
                <span>Property Dashboard</span>
                <Sparkles className="h-4 w-4 text-brand-green shrink-0" />
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-500 font-semibold mt-0.5 truncate my-0">
                {isAgency ? "Agency Workspace" : "Owner Listing Workspace"} • {totalProperties} Active Listings
              </p>
            </div>
          </div>

          <Link to="/owner/properties/new">
            <Button className="bg-brand-green hover:bg-brand-green-hover text-white font-extrabold text-xs px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-2xs transition-all cursor-pointer h-9.5 shrink-0">
              + Post New Listing
            </Button>
          </Link>
        </div>

        {/* Top Light Metrics Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

          {/* Left Stats Overview Card */}
          <Card className="lg:col-span-8 bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs flex flex-col justify-between gap-4 text-left">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-black uppercase tracking-wider text-brand-green flex items-center gap-1.5 my-0">
                <TrendingUp className="h-4 w-4 shrink-0" /> Performance & Analytics
              </span>
              <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200/60">
                Real-Time Data
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50/80 border border-slate-100 p-3.5 rounded-lg space-y-1">
                <span className="text-[11px] font-bold text-slate-400 block">Total Views</span>
                <p className="text-xl font-black text-slate-900 my-0">{totalViews.toLocaleString()}</p>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                  <div className="bg-brand-green h-full rounded-full" style={{ width: `${Math.min(100, (totalViews / 50) * 100)}%` }} />
                </div>
              </div>

              <div className="bg-slate-50/80 border border-slate-100 p-3.5 rounded-lg space-y-1">
                <span className="text-[11px] font-bold text-slate-400 block">Total Enquiries</span>
                <p className="text-xl font-black text-brand-green my-0">{totalLeads.toLocaleString()}</p>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                  <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${Math.min(100, (totalLeads / 20) * 100)}%` }} />
                </div>
              </div>

              <div className="bg-slate-50/80 border border-slate-100 p-3.5 rounded-lg space-y-1">
                <span className="text-[11px] font-bold text-slate-400 block">Live Listings</span>
                <p className="text-xl font-black text-slate-900 my-0">{liveCount}</p>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                  <div className="bg-brand-green h-full rounded-full" style={{ width: `${Math.min(100, (liveCount / Math.max(1, totalProperties)) * 100)}%` }} />
                </div>
              </div>

              <div className="bg-slate-50/80 border border-slate-100 p-3.5 rounded-lg space-y-1">
                <span className="text-[11px] font-bold text-slate-400 block">Pending Review</span>
                <p className="text-xl font-black text-amber-600 my-0">{pendingCount}</p>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${Math.min(100, (pendingCount / Math.max(1, totalProperties)) * 100)}%` }} />
                </div>
              </div>
            </div>

            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Drafts: <strong className="text-slate-900">{draftCount}</strong> • Rejected: <strong className="text-rose-600">{rejectedCount}</strong></span>
              <span className="text-[10px] text-slate-400 font-bold">Updated just now</span>
            </div>
          </Card>

          {/* Right Highlight Brand Accent Card */}
          <Card className="lg:col-span-4 bg-linear-to-br from-[#014645] to-[#013534] text-white rounded-xl p-5 shadow-sm flex flex-col justify-between relative overflow-hidden space-y-3 border-0 text-left">
            <div className="space-y-2 relative z-10">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-200 block">
                Manage & Grow
              </span>
              <p className="text-2xl font-black text-white tracking-tight my-0">
                {totalProperties} <span className="text-xs font-semibold text-emerald-100/80">Listings Total</span>
              </p>
              <p className="text-xs text-slate-200 font-medium leading-relaxed my-0">
                Keep pricing and room availability up-to-date to maximize tenant enquiries.
              </p>
            </div>

            <div className="pt-3 relative z-10 flex items-center gap-2">
              <Link to="/owner/properties/new" className="flex-1">
                <Button className="w-full bg-white hover:bg-slate-100 text-brand-green font-extrabold text-xs py-2 rounded-lg text-center shadow-2xs transition-all cursor-pointer border-0 h-9">
                  Post New Property
                </Button>
              </Link>
              <Link to="/owner/properties" className="flex-1">
                <Button variant="outline" className="w-full bg-white/15 hover:bg-white/25 text-white font-extrabold text-xs px-3 py-2 rounded-lg text-center border border-white/20 transition-colors h-9">
                  All Listings
                </Button>
              </Link>
            </div>
          </Card>

        </div>

        {/* Active Filters Bar */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-2xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 text-left">

          {/* Status Tab Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 no-scrollbar">
            <span className="text-xs font-extrabold text-slate-400 px-1 shrink-0 flex items-center gap-1">
              <SlidersHorizontal className="h-3.5 w-3.5" /> Filter:
            </span>

            <button
              onClick={() => setFilterStatus("all")}
              className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all shrink-0 cursor-pointer ${filterStatus === "all" ? "bg-brand-green text-white shadow-2xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                }`}
            >
              All ({totalProperties})
            </button>
            <button
              onClick={() => setFilterStatus("live")}
              className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all shrink-0 cursor-pointer ${filterStatus === "live" ? "bg-emerald-600 text-white shadow-2xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                }`}
            >
              Live ({liveCount})
            </button>
            <button
              onClick={() => setFilterStatus("pending_review")}
              className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all shrink-0 cursor-pointer ${filterStatus === "pending_review" ? "bg-amber-600 text-white shadow-2xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setFilterStatus("draft")}
              className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all shrink-0 cursor-pointer ${filterStatus === "draft" ? "bg-slate-700 text-white shadow-2xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                }`}
            >
              Drafts ({draftCount})
            </button>
            {rejectedCount > 0 && (
              <button
                onClick={() => setFilterStatus("rejected")}
                className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all shrink-0 cursor-pointer ${filterStatus === "rejected" ? "bg-rose-600 text-white shadow-2xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
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
              <SelectTrigger className="w-full sm:w-44 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg h-8.5 px-3 font-semibold text-slate-800 text-xs focus:ring-1 focus:ring-brand-green">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-slate-100 shadow-md rounded-lg p-1 z-50">
                <SelectItem value="all">All Categories</SelectItem>
                {propertyTypes.length > 0 ? (
                  propertyTypes
                    .filter((t: any) => t.allowed_roles.includes(user?.role || "owner"))
                    .map((t: any) => (
                      <SelectItem key={t.slug} value={t.slug}>{t.label}</SelectItem>
                    ))
                ) : (
                  <SelectItem value="loading" disabled>Loading...</SelectItem>
                )}
              </SelectContent>
            </Select>

            <div className="relative flex-1 sm:w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search title, ref, city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green transition-colors"
              />
            </div>
          </div>

        </div>

        {/* Master-Detail Split Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 text-left">

          {/* Left Master List */}
          <Card className="lg:col-span-5 bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs flex flex-col justify-between self-start">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <h3 className="text-sm font-extrabold text-slate-900 my-0">Properties List</h3>
                <Badge variant="secondary" className="px-2.5 py-0.5 rounded-full font-extrabold text-[10px]">
                  {filteredProperties.length} items
                </Badge>
              </div>

              {loading ? (
                <div className="space-y-2.5 pt-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : filteredProperties.length === 0 ? (
                <div className="py-10 text-center space-y-2">
                  <Building2 className="h-9 w-9 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-500 font-semibold my-0">No property listings found matching filters.</p>
                </div>
              ) : (
                <div className="space-y-2 pt-2 max-h-130 overflow-y-auto custom-scrollbar pr-1">
                  {filteredProperties.map((prop) => {
                    const isSelected = selectedProperty?.id === prop.id;
                    return (
                      <div
                        key={prop.id}
                        onClick={() => handlePropertySelect(prop.id)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-3 text-left relative overflow-hidden ${isSelected
                            ? "bg-emerald-50/80 border-emerald-300 text-slate-900 shadow-2xs ring-1 ring-emerald-500/30"
                            : "bg-white hover:bg-slate-50 text-slate-900 border-slate-200/70"
                          }`}
                      >
                        {isSelected && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#014645] rounded-l-xl" />
                        )}
                        <img
                          src={prop.photos && prop.photos.length > 0 ? prop.photos[0] : "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=400&q=80"}
                          alt=""
                          className="h-12 w-12 rounded-lg object-cover shrink-0 border border-slate-200/60"
                        />
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-[9px] font-black uppercase tracking-wider ${isSelected ? "text-emerald-800" : "text-slate-400"}`}>
                              {prop.ref}
                            </span>
                            {getStatusBadge(prop.status)}
                          </div>
                          <h4 className="text-xs font-extrabold truncate my-0 text-slate-900">
                            {prop.title}
                          </h4>
                          <p className="text-[11px] font-semibold truncate my-0 text-slate-500">
                            ₹{prop.price.toLocaleString()} • {prop.location_city}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold mt-3">
              <Link to="/owner/properties" className="text-[#014645] hover:underline flex items-center gap-1">
                View Full Properties Manager <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </Card>

          {/* Right Detail Inspector (Desktop Only) */}
          <div className="hidden lg:block lg:col-span-7">
            <Card className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs text-slate-900 flex flex-col justify-between min-h-120 h-full">
              {selectedProperty ? (
                renderPropertyInspector(selectedProperty)
              ) : (
                <div className="h-full flex flex-col items-center justify-center py-20 text-center space-y-2 text-slate-400">
                  <Building2 className="h-10 w-10 text-slate-300" />
                  <p className="text-xs font-semibold">Select a property listing from the left to view detailed inspector.</p>
                </div>
              )}
            </Card>
          </div>

        </div>

      </main>

      {/* Mobile Responsive Drawer (Sheet) for Listing Inspector */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="overflow-y-auto w-full sm:max-w-xl rounded-t-2xl">
          <SheetHeader className="pb-3 border-b border-slate-100 text-left">
            <SheetTitle className="text-base font-black text-slate-900">Listing Inspector</SheetTitle>
            <SheetDescription className="text-xs text-slate-500">View performance and manage listing actions.</SheetDescription>
          </SheetHeader>
          {selectedProperty ? (
            <div className="py-4">
              {renderPropertyInspector(selectedProperty)}
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
};
