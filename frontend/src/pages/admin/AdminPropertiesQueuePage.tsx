import React, { useState, useEffect } from "react";
import {
  Building2,
  CheckCircle2,
  Clock,
  Search,
  RefreshCw,
  Eye,
  Check,
  X,
  AlertTriangle,
  MapPin,
  BedDouble,
  Bath,
  Maximize,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { adminService, type AdminProperty } from "@/services/adminService";

const getPhotoUrl = (photo: any): string => {
  if (!photo) return "";
  if (typeof photo === "string") return photo;
  return photo.photo_url || photo.url || photo.src || "";
};

const getAmenityName = (item: any): string => {
  if (!item) return "";
  if (typeof item === "string") return item;
  return item.name || item.label || item.title || "";
};

const getCategoryFallbackImage = (category?: string) => {
  switch (category) {
    case "apartment":
      return "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80";
    case "villa_house":
      return "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80";
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

export const AdminPropertiesQueuePage: React.FC = () => {
  const [properties, setProperties] = useState<AdminProperty[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [intentFilter, setIntentFilter] = useState<string>("all");
  
  // Tab State
  const [activeTab, setActiveTab] = useState<"pending" | "live">("pending");

  // Selected Property Modal state
  const [selectedProperty, setSelectedProperty] = useState<AdminProperty | null>(null);
  const [inspectModalOpen, setInspectModalOpen] = useState<boolean>(false);

  // Approve Modal state
  const [approveModalOpen, setApproveModalOpen] = useState<boolean>(false);
  const [approveReason, setApproveReason] = useState<string>("Meets all listing standards & verified");
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Reject Modal state
  const [rejectModalOpen, setRejectModalOpen] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>("");

  // Full-Screen Image Lightbox Preview state
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Load Properties from API
  const fetchProperties = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);

      if (activeTab === "pending") {
        const pendingData = await adminService.getPendingProperties();
        setProperties(pendingData);
      } else {
        const liveData = await adminService.getLiveProperties();
        setProperties(liveData);
      }
    } catch (err: any) {
      console.error("Failed to load properties:", err);
      toast.error(err.response?.data?.detail || "Failed to load properties queue.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [activeTab]);

  // Handle Approval Action
  const handleApprove = async () => {
    if (!selectedProperty) return;
    try {
      setActionLoading(true);
      await adminService.approveProperty(selectedProperty.id, approveReason);
      toast.success(`Property "${selectedProperty.title}" has been approved!`);
      
      // Update local state by removing approved item from pending queue
      setProperties((prev) => prev.filter((p) => p.id !== selectedProperty.id));
      setApproveModalOpen(false);
      setInspectModalOpen(false);
      setSelectedProperty(null);
    } catch (err: any) {
      console.error("Approval error:", err);
      toast.error(err.response?.data?.detail || "Failed to approve property.");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Rejection Action
  const handleReject = async () => {
    if (!selectedProperty) return;
    if (!rejectReason.trim()) {
      toast.error("Please provide a reason for rejecting this property listing.");
      return;
    }
    try {
      setActionLoading(true);
      await adminService.rejectProperty(selectedProperty.id, rejectReason);
      toast.error(`Property listing "${selectedProperty.title}" rejected.`);
      
      // Update local state by removing rejected item from pending queue
      setProperties((prev) => prev.filter((p) => p.id !== selectedProperty.id));
      setRejectModalOpen(false);
      setInspectModalOpen(false);
      setSelectedProperty(null);
      setRejectReason("");
    } catch (err: any) {
      console.error("Rejection error:", err);
      toast.error(err.response?.data?.detail || "Failed to reject property.");
    } finally {
      setActionLoading(false);
    }
  };

  // Filter properties based on search and category
  const filteredProperties = properties.filter((prop) => {
    const matchesSearch =
      prop.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (prop.ref_code && prop.ref_code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      prop.location_city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prop.location_area.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      categoryFilter === "all" || prop.category.toLowerCase() === categoryFilter.toLowerCase();

    const matchesIntent =
      intentFilter === "all" || prop.intent.toLowerCase() === intentFilter.toLowerCase();

    return matchesSearch && matchesCategory && matchesIntent;
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header & Page Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Property Management
            </h1>
            <span className="bg-amber-100 text-amber-800 text-xs font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-amber-200">
              <Clock className="h-3 w-3" />
              {properties.length} {activeTab === "pending" ? "Pending" : "Live"}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Review, verify, and moderate property submissions submitted by owners & agencies.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchProperties(true)}
            disabled={refreshing}
            className="bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 shadow-2xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-[#086942]" : ""}`} />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Pending Review
            </span>
            <span className="text-xl font-black text-slate-900 leading-none block mt-0.5">
              {properties.length}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-xl bg-emerald-50 text-[#086942] flex items-center justify-center shrink-0 border border-emerald-100">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Auto-Validation
            </span>
            <span className="text-xl font-black text-slate-900 leading-none block mt-0.5">
              Enabled
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Primary Queue
            </span>
            <span className="text-xl font-black text-slate-900 leading-none block mt-0.5">
              Residential & Commercial
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
              SLA Standard
            </span>
            <span className="text-xl font-black text-slate-900 leading-none block mt-0.5">
              &lt; 4 Hours
            </span>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-4 py-2 text-sm font-bold rounded-t-xl border-b-2 transition-all ${
            activeTab === "pending"
              ? "border-[#23D283] text-[#086942] bg-[#23D283]/10"
              : "border-transparent text-slate-500 hover:bg-slate-100"
          }`}
        >
          Pending Review
        </button>
        <button
          onClick={() => setActiveTab("live")}
          className={`px-4 py-2 text-sm font-bold rounded-t-xl border-b-2 transition-all ${
            activeTab === "live"
              ? "border-[#23D283] text-[#086942] bg-[#23D283]/10"
              : "border-transparent text-slate-500 hover:bg-slate-100"
          }`}
        >
          Live Properties
        </button>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden" style={{border:'1px solid oklch(0.922 0 0)',boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4" style={{color:'#6B7280'}} />
            <input
              type="text"
              placeholder="Search by property title, ref code, or city…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl pl-10 pr-4 py-2.5 text-[13px] font-medium transition-all focus:outline-none"
              style={{background:'#f1f5f9', border:'1px solid #e2e8f0', color:'#08060d'}}
              onFocus={(e) => { e.currentTarget.style.background='#fff'; e.currentTarget.style.borderColor='#23D283'; e.currentTarget.style.boxShadow='0 0 0 3px rgba(35,210,131,0.12)'; }}
              onBlur={(e) => { e.currentTarget.style.background='#f1f5f9'; e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.boxShadow='none'; }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer" style={{color:'#6B7280'}}>
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Filter Options */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-xl px-3 py-2.5 text-[13px] font-semibold focus:outline-none cursor-pointer"
              style={{background:'#f1f5f9', border:'1px solid #e2e8f0', color:'#08060d'}}
            >
              <option value="all">All Categories</option>
              <option value="apartment">Apartment</option>
              <option value="villa">Villa / House</option>
              <option value="pg">PG / Hostel</option>
              <option value="commercial">Commercial</option>
              <option value="land">Plot / Land</option>
            </select>

            <select
              value={intentFilter}
              onChange={(e) => setIntentFilter(e.target.value)}
              className="rounded-xl px-3 py-2.5 text-[13px] font-semibold focus:outline-none cursor-pointer"
              style={{background:'#f1f5f9', border:'1px solid #e2e8f0', color:'#08060d'}}
            >
              <option value="all">All Intents</option>
              <option value="rent">For Rent</option>
              <option value="sale">For Sale</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Queue List / Empty State */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-3">
          <div className="h-8 w-8 border-3 border-[#086942] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Fetching Property Submissions...
          </p>
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center flex flex-col items-center justify-center space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-[#086942] flex items-center justify-center mx-auto border border-emerald-100">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900 text-center">
            No Pending Properties in Queue
          </h3>
          <p className="text-xs text-slate-500 font-medium max-w-md mx-auto text-center">
            {searchQuery || categoryFilter !== "all" || intentFilter !== "all"
              ? "No property listings match your active filters. Try resetting search criteria."
              : "Awesome! All submitted property listings have been reviewed and processed."}
          </p>
          {(searchQuery || categoryFilter !== "all" || intentFilter !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setCategoryFilter("all");
                setIntentFilter("all");
              }}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2 rounded-xl transition-all"
            >
              Reset All Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredProperties.map((prop) => (
            <div
              key={prop.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col md:flex-row gap-5 items-start md:items-center justify-between group"
            >
              {/* Left Column: Image + Details */}
              <div className="flex flex-col sm:flex-row gap-4 items-start flex-1 min-w-0">
                {/* Property Thumbnail */}
                <div
                  onClick={() =>
                    setPreviewImage(
                      prop.photos && prop.photos.length > 0
                        ? getPhotoUrl(prop.photos[0]) || getCategoryFallbackImage(prop.category)
                        : getCategoryFallbackImage(prop.category)
                    )
                  }
                  className="h-28 w-full sm:w-36 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200 relative group-hover:border-slate-300 transition-all cursor-pointer group/thumb"
                  title="Click to view full image"
                >
                  <img
                    src={prop.photos && prop.photos.length > 0 ? getPhotoUrl(prop.photos[0]) : getCategoryFallbackImage(prop.category)}
                    alt={prop.title}
                    className="h-full w-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                  />

                  <span className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[9px] font-black px-2 py-0.5 rounded-md uppercase">
                    {prop.intent}
                  </span>
                </div>

                {/* Info Text Block */}
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-emerald-50 text-[#086942] text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider border border-emerald-100">
                      {prop.category}
                    </span>
                    {(prop.ref || prop.ref_code) && (
                      <span className="text-[11px] font-extrabold text-slate-400 font-mono">
                        #{prop.ref || prop.ref_code}
                      </span>
                    )}
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      Pending Review
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900 truncate tracking-tight">
                    {prop.title}
                  </h3>

                  <div className="flex items-center gap-3 text-xs font-semibold text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1 text-slate-700 font-extrabold">
                      <MapPin className="h-3.5 w-3.5 text-[#086942]" />
                      {prop.location_area}, {prop.location_city}
                    </span>
                    <span>•</span>
                    <span className="text-[#086942] font-black text-sm">
                      {formatPrice(prop.price)}
                      {prop.intent.toLowerCase() === "rent" ? "/mo" : ""}
                    </span>
                  </div>

                  {/* Specs Pill List */}
                  <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500 pt-1">
                    {prop.bedrooms && (
                      <span className="flex items-center gap-1">
                        <BedDouble className="h-3.5 w-3.5 text-slate-400" />
                        {prop.bedrooms} Bed
                      </span>
                    )}
                    {prop.bathrooms && (
                      <span className="flex items-center gap-1">
                        <Bath className="h-3.5 w-3.5 text-slate-400" />
                        {prop.bathrooms} Bath
                      </span>
                    )}
                    {prop.built_up_sqft && (
                      <span className="flex items-center gap-1">
                        <Maximize className="h-3.5 w-3.5 text-slate-400" />
                        {prop.built_up_sqft} sqft
                      </span>
                    )}
                    <span className="text-slate-400 font-medium">
                      Submitted {new Date(prop.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Action Buttons */}
              <div className="flex items-center gap-2 w-full md:w-auto shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 justify-end">
                {/* Inspect Button */}
                <button
                  onClick={() => {
                    setSelectedProperty(prop);
                    setInspectModalOpen(true);
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Inspect</span>
                </button>

                {activeTab === "pending" && (
                  <>
                    {/* Approve Button */}
                    <button
                      onClick={() => {
                        setSelectedProperty(prop);
                        setApproveReason("Meets all listing standards & verified");
                        setApproveModalOpen(true);
                      }}
                      className="bg-[#086942] hover:bg-[#065334] text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <Check className="h-4 w-4" />
                      <span>Approve</span>
                    </button>

                    {/* Reject Button */}
                    <button
                      onClick={() => {
                        setSelectedProperty(prop);
                        setRejectReason("");
                        setRejectModalOpen(true);
                      }}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                      <span>Reject</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal 1: Inspect Property Details Modal */}
      {inspectModalOpen && selectedProperty && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 text-left">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-50 text-[#086942] text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                    {selectedProperty.category}
                  </span>
                  <span className="bg-slate-100 text-slate-700 text-[10px] font-black px-2 py-0.5 rounded-md uppercase">
                    For {selectedProperty.intent}
                  </span>
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 mt-1">
                  {selectedProperty.title}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  {selectedProperty.location_address || `${selectedProperty.location_area}, ${selectedProperty.location_city}`}
                </p>
              </div>
              <button
                onClick={() => setInspectModalOpen(false)}
                className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Photos Carousel/Grid */}
            {selectedProperty.photos && selectedProperty.photos.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {selectedProperty.photos.map((photo, i) => {
                  const url = getPhotoUrl(photo) || getCategoryFallbackImage(selectedProperty.category);
                  return (
                    <div
                      key={i}
                      onClick={() => setPreviewImage(url)}
                      className="relative rounded-xl overflow-hidden border border-slate-200 cursor-pointer group/img h-28"
                      title="Click to expand full screen"
                    >
                      <img
                        src={url}
                        alt={`Property photo ${i + 1}`}
                        className="h-full w-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                        <Eye className="h-4 w-4" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div
                onClick={() => setPreviewImage(getCategoryFallbackImage(selectedProperty.category))}
                className="rounded-2xl overflow-hidden border border-slate-200 cursor-pointer group/img relative"
                title="Click to expand full screen"
              >
                <img
                  src={getCategoryFallbackImage(selectedProperty.category)}
                  alt="Property Preview"
                  className="h-44 w-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5">
                  <Eye className="h-4 w-4" />
                  <span>View Full Screen</span>
                </div>
              </div>
            )}

            {/* Quick Overview Key Data */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/70">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Price</span>
                <span className="text-sm font-black text-[#086942]">
                  {formatPrice(selectedProperty.price)}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Security Deposit</span>
                <span className="text-sm font-bold text-slate-800">
                  {(selectedProperty.deposit || selectedProperty.security_deposit) ? formatPrice((selectedProperty.deposit || selectedProperty.security_deposit)!) : "N/A"}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Built-up Area</span>
                <span className="text-sm font-bold text-slate-800">
                  {(selectedProperty.area || selectedProperty.built_up_sqft) ? `${selectedProperty.area || selectedProperty.built_up_sqft} sqft` : "N/A"}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Furnishing</span>
                <span className="text-sm font-bold text-slate-800 capitalize">
                  {selectedProperty.furnishing || selectedProperty.furnishing_status || "Unspecified"}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                Property Description
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/50 p-4 rounded-2xl border border-slate-100 font-medium">
                {selectedProperty.description || "No description provided by the owner."}
              </p>
            </div>

            {/* Amenities */}
            {selectedProperty.amenities && selectedProperty.amenities.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                  Amenities & Facilities
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedProperty.amenities.map((item, idx) => {
                    const name = getAmenityName(item);
                    if (!name) return null;
                    return (
                      <span
                        key={idx}
                        className="bg-emerald-50 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-xl border border-emerald-200/70 capitalize flex items-center gap-1.5"
                      >
                        <span className="text-[#086942]">✓</span> {name.replace(/_/g, " ")}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => {
                  setInspectModalOpen(false);
                  setRejectReason("");
                  setRejectModalOpen(true);
                }}
                className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                Reject Listing
              </button>
              <button
                onClick={() => {
                  setInspectModalOpen(false);
                  setApproveReason("Meets all listing standards & verified");
                  setApproveModalOpen(true);
                }}
                className="bg-[#086942] hover:bg-[#065334] text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
              >
                Approve Listing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Approve Confirmation Modal */}
      {approveModalOpen && selectedProperty && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-emerald-100 text-[#086942] flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Approve Property Listing
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  This will publish the listing publicly on Letsellr.
                </p>
              </div>
            </div>

            <div className="bg-emerald-50/60 border border-emerald-200 p-3.5 rounded-2xl text-xs text-emerald-900 space-y-1">
              <span className="font-extrabold block">Listing: {selectedProperty.title}</span>
              <span className="text-[11px] block opacity-80">
                Location: {selectedProperty.location_area}, {selectedProperty.location_city}
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold uppercase text-slate-500 block">
                Approval Reason / Moderation Note
              </label>
              <input
                type="text"
                value={approveReason}
                onChange={(e) => setApproveReason(e.target.value)}
                placeholder="e.g. Meets quality standards & verified"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-[#086942] focus:ring-2 focus:ring-[#086942]/20"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setApproveModalOpen(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="bg-[#086942] hover:bg-[#065334] text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? "Publishing..." : "Confirm & Publish"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Reject Confirmation Modal */}
      {rejectModalOpen && selectedProperty && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Reject Property Listing
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Inform the owner why this listing cannot be published.
                </p>
              </div>
            </div>

            <div className="bg-rose-50/60 border border-rose-200 p-3.5 rounded-2xl text-xs text-rose-900 space-y-1">
              <span className="font-extrabold block">Listing: {selectedProperty.title}</span>
              <span className="text-[11px] block opacity-80">
                Ref Code: #{selectedProperty.ref_code || "N/A"}
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold uppercase text-slate-500 block">
                Rejection Reason (Required)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain what needs to be fixed (e.g. Invalid photos, price mismatch, inappropriate text)..."
                rows={3}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 font-medium focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading || !rejectReason.trim()}
                className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Image Lightbox Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-999 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)}
        >
          {/* Top Close Button */}
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-5 right-5 h-11 w-11 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer transition-all z-50 border border-white/20 shadow-xl active:scale-95"
            title="Close Full-Screen View"
          >
            <X className="h-6 w-6" />
          </button>

          <div
            className="relative max-w-5xl max-h-[85vh] flex items-center justify-center p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewImage}
              alt="Full size property image"
              className="max-h-[82vh] max-w-full object-contain rounded-2xl shadow-2xl border border-white/10"
            />
          </div>

          <p className="text-white/70 text-xs font-semibold mt-3 pointer-events-none">
            Click anywhere outside or press the close button to dismiss
          </p>
        </div>
      )}
    </div>
  );
};
