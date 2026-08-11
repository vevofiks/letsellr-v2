import React, { useState, useEffect } from "react";
import { adminService, type AdminProperty } from "@/services/adminService";
import { api } from "@/lib/api";
import {
  Sparkles,
  Search,
  Star,
  Plus,
  Trash2,
  Building2,
  CheckCircle2,
  XCircle,
  MessageSquareQuote,
  Filter,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { useConfirm } from "@/components/ConfirmDialogProvider";

interface Testimonial {
  id: string;
  author_name: string;
  author_role: string;
  author_location: string | null;
  content: string;
  avatar_key: string | null;
  rating: number | null;
  status: "pending" | "approved" | "rejected";
  display_order: number;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const AdminLandingPageConfig: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"featured" | "testimonials">("featured");
  const confirm = useConfirm();

  // ── Featured Properties State ──
  const [liveProperties, setLiveProperties] = useState<AdminProperty[]>([]);
  const [loadingProperties, setLoadingProperties] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // ── Testimonials State ──
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loadingTestimonials, setLoadingTestimonials] = useState<boolean>(true);
  const [testimonialModalOpen, setTestimonialModalOpen] = useState<boolean>(false);
  const [selectedTestimonial, setSelectedTestimonial] = useState<Testimonial | null>(null);

  // Form state for Testimonial modal
  const [formAuthorName, setFormAuthorName] = useState("");
  const [formAuthorRole, setFormAuthorRole] = useState("owner");
  const [formAuthorLocation, setFormAuthorLocation] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formRating, setFormRating] = useState<number>(5);
  const [formIsFeatured, setFormIsFeatured] = useState<boolean>(true);
  const [submittingTestimonial, setSubmittingTestimonial] = useState<boolean>(false);

  useEffect(() => {
    fetchProperties();
    fetchTestimonials();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoadingProperties(true);
      const data = await adminService.getLiveProperties();
      setLiveProperties(data || []);
    } catch (err) {
      toast.error("Failed to load live properties");
    } finally {
      setLoadingProperties(false);
    }
  };

  const fetchTestimonials = async () => {
    try {
      setLoadingTestimonials(true);
      const res = await api.get("/api/admin/testimonials");
      setTestimonials(res.data || []);
    } catch (err) {
      toast.error("Failed to load testimonials");
    } finally {
      setLoadingTestimonials(false);
    }
  };

  // ── Featured Properties Handlers ──
  const featuredProperties = liveProperties.filter((p) => p.is_featured);

  const handleToggleFeature = async (property: AdminProperty) => {
    if (!property.is_featured && featuredProperties.length >= 6) {
      toast.error("Limit Reached! Maximum 6 properties can be featured on the Landing Page top section. Remove one to add this.");
      return;
    }

    try {
      const updated = await adminService.toggleFeatureProperty(property.id);
      setLiveProperties((prev) =>
        prev.map((p) => (p.id === updated.id ? { ...p, is_featured: updated.is_featured } : p))
      );
      if (updated.is_featured) {
        toast.success(`"${property.title}" added to Top 6 Featured showcase!`);
      } else {
        toast.info(`"${property.title}" removed from Top 6 Featured showcase.`);
      }
    } catch (err) {
      toast.error("Failed to update feature status");
    }
  };

  // Categories list for filter dropdown
  const categoriesList = Array.from(
    new Set(liveProperties.map((p) => p.category).filter(Boolean))
  );

  const filteredProperties = liveProperties.filter((p) => {
    const matchesSearch =
      searchQuery === "" ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.location_city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.location_area.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.ref && p.ref.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      categoryFilter === "all" ||
      p.category.toLowerCase() === categoryFilter.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  // ── Testimonial Handlers ──
  const openNewTestimonialModal = () => {
    setSelectedTestimonial(null);
    setFormAuthorName("");
    setFormAuthorRole("owner");
    setFormAuthorLocation("");
    setFormContent("");
    setFormRating(5);
    setFormIsFeatured(true);
    setTestimonialModalOpen(true);
  };

  const openEditTestimonialModal = (t: Testimonial) => {
    setSelectedTestimonial(t);
    setFormAuthorName(t.author_name);
    setFormAuthorRole(t.author_role);
    setFormAuthorLocation(t.author_location || "");
    setFormContent(t.content);
    setFormRating(t.rating || 5);
    setFormIsFeatured(t.is_featured);
    setTestimonialModalOpen(true);
  };

  const handleSaveTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAuthorName.trim() || !formContent.trim()) {
      toast.error("Please fill in author name and testimonial content.");
      return;
    }

    try {
      setSubmittingTestimonial(true);
      const payload = {
        author_name: formAuthorName,
        author_role: formAuthorRole,
        author_location: formAuthorLocation || null,
        content: formContent,
        rating: formRating,
        is_featured: formIsFeatured,
      };

      if (selectedTestimonial) {
        await api.patch(`/api/admin/testimonials/${selectedTestimonial.id}`, payload);
        toast.success("Testimonial updated successfully!");
      } else {
        await api.post("/api/admin/testimonials", payload);
        toast.success("Testimonial created successfully!");
      }
      setTestimonialModalOpen(false);
      fetchTestimonials();
    } catch (err) {
      toast.error("Failed to save testimonial.");
    } finally {
      setSubmittingTestimonial(false);
    }
  };

  const handleDeleteTestimonial = async (id: string) => {
    const isConfirmed = await confirm({
      title: "Delete Testimonial",
      description: "Are you sure you want to delete this testimonial?",
      variant: "destructive"
    });
    if (!isConfirmed) return;
    try {
      await api.delete(`/api/admin/testimonials/${id}`);
      toast.success("Testimonial deleted.");
      fetchTestimonials();
    } catch (err) {
      toast.error("Failed to delete testimonial.");
    }
  };

  const handleToggleTestimonialStatus = async (t: Testimonial) => {
    const nextStatus = t.status === "approved" ? "rejected" : "approved";
    try {
      await api.patch(`/api/admin/testimonials/${t.id}`, { status: nextStatus });
      toast.success(`Testimonial status updated to ${nextStatus}.`);
      fetchTestimonials();
    } catch (err) {
      toast.error("Failed to update status.");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <Sparkles className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Landing Page Manager
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Configure featured inventory showcase (Top 6 properties) and manage public customer testimonials.
          </p>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex items-center p-1 bg-slate-100/80 rounded-xl border border-slate-200 shrink-0">
          <button
            onClick={() => setActiveTab("featured")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "featured"
                ? "bg-white text-[#014645] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Building2 className="w-4 h-4" />
            Featured Top 6 ({featuredProperties.length}/6)
          </button>
          <button
            onClick={() => setActiveTab("testimonials")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "testimonials"
                ? "bg-white text-[#014645] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <MessageSquareQuote className="w-4 h-4" />
            Testimonials ({testimonials.length})
          </button>
        </div>
      </div>

      {/* ── TAB 1: FEATURED TOP 6 PROPERTIES ── */}
      {activeTab === "featured" && (
        <div className="space-y-6">
          {/* Top 6 Current Slots Banner */}
          <div className="bg-linear-to-r from-[#014645] to-[#0B6E4F] rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/10 text-emerald-300 border border-white/10 mb-2">
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    Public Showcase Slots
                  </span>
                  <h2 className="text-xl font-black text-white">
                    Top 6 Featured Inventory Showcase
                  </h2>
                  <p className="text-xs text-emerald-100/80 mt-1 max-w-xl font-medium">
                    Select up to 6 approved property listings to highlight on the public Landing Page section. The public dynamic category chips will automatically adjust based on these selected properties.
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-white">
                    {featuredProperties.length} <span className="text-emerald-300/60 text-xl font-bold">/ 6</span>
                  </div>
                  <div className="text-[10px] font-bold tracking-wider uppercase text-emerald-200">
                    Slots Filled
                  </div>
                </div>
              </div>

              {/* Grid of Current 6 Featured Slots */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-3 border-t border-white/10">
                {[0, 1, 2, 3, 4, 5].map((index) => {
                  const prop = featuredProperties[index];
                  return (
                    <div
                      key={index}
                      className={`relative rounded-xl p-3 border transition-all ${
                        prop
                          ? "bg-white/10 border-white/20 text-white backdrop-blur-xs"
                          : "bg-black/10 border-dashed border-white/20 text-emerald-200/50 flex flex-col items-center justify-center min-h-25"
                      }`}
                    >
                      {prop ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 rounded bg-emerald-400/20 text-emerald-200 text-[9px] font-black uppercase">
                              #{index + 1} Slot
                            </span>
                            <button
                              onClick={() => handleToggleFeature(prop)}
                              title="Remove from Top 6"
                              className="text-rose-300 hover:text-rose-100 hover:bg-rose-500/20 p-1 rounded transition cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className="text-xs font-bold line-clamp-1 text-white">
                            {prop.title}
                          </p>
                          <div className="flex items-center justify-between text-[10px] text-emerald-200/80">
                            <span className="font-semibold">{prop.category}</span>
                            <span className="font-extrabold text-white">₹{prop.price.toLocaleString("en-IN")}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center space-y-1">
                          <Plus className="w-5 h-5 mx-auto opacity-40" />
                          <span className="text-[10px] font-semibold block">
                            Slot #{index + 1} Empty
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Directory Search & Filter Controls */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Live Properties Directory
                </h3>
                <p className="text-xs text-slate-500">
                  Search approved live listings and click "+ Add to Top 6" to feature them on the landing page.
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Category Filter */}
                <div className="relative">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="pl-8 pr-8 py-2 rounded-xl text-xs font-bold bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#014645]"
                  >
                    <option value="all">All Categories ({liveProperties.length})</option>
                    {categoriesList.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3 pointer-events-none" />
                </div>

                {/* Search Bar */}
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Search by title, city, area..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-4 py-2 rounded-xl text-xs font-medium bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#014645]"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                </div>
              </div>
            </div>

            {/* Properties Table */}
            {loadingProperties ? (
              <div className="py-12 text-center text-slate-400 text-xs font-semibold">
                Loading live properties...
              </div>
            ) : filteredProperties.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <Building2 className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs text-slate-500 font-medium">
                  No properties matching your criteria found.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] font-black uppercase text-slate-400 tracking-wider">
                      <th className="py-3 px-3">Property</th>
                      <th className="py-3 px-3">Category</th>
                      <th className="py-3 px-3">Location</th>
                      <th className="py-3 px-3">Price</th>
                      <th className="py-3 px-3">Featured Status</th>
                      <th className="py-3 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium">
                    {filteredProperties.map((p) => {
                      const firstPhoto =
                        Array.isArray(p.photos) && p.photos.length > 0
                          ? typeof p.photos[0] === "string"
                            ? p.photos[0]
                            : p.photos[0]?.photo_url
                          : "/images/hero-villa.png";

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-3">
                              <img
                                src={firstPhoto || "/images/hero-villa.png"}
                                alt={p.title}
                                className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0"
                              />
                              <div>
                                <span className="font-bold text-slate-900 block line-clamp-1">
                                  {p.title}
                                </span>
                                <span className="text-[10px] text-slate-400 block font-mono">
                                  {p.ref || p.id.slice(0, 8)}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-[11px] font-bold">
                              {p.category}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-600">
                            {p.location_area}, {p.location_city}
                          </td>
                          <td className="py-3 px-3 font-black text-emerald-700">
                            ₹{p.price.toLocaleString("en-IN")}
                            {p.price_unit === "per_month" && <span className="text-[10px] text-slate-400 font-normal"> / mo</span>}
                          </td>
                          <td className="py-3 px-3">
                            {p.is_featured ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                                <Sparkles className="w-3 h-3 text-emerald-600" />
                                Top 6 Featured
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">Standard Listing</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => handleToggleFeature(p)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                                p.is_featured
                                  ? "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                                  : featuredProperties.length >= 6
                                  ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                                  : "bg-[#014645] text-white hover:bg-[#0b6e4f] shadow-2xs"
                              }`}
                            >
                              {p.is_featured ? (
                                <>
                                  <XCircle className="w-3.5 h-3.5" />
                                  Remove
                                </>
                              ) : (
                                <>
                                  <Plus className="w-3.5 h-3.5" />
                                  Add to Top 6
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: CUSTOMER TESTIMONIALS ── */}
      {activeTab === "testimonials" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200/80">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Customer Testimonials
              </h3>
              <p className="text-xs text-slate-500">
                Manage owner and agency testimonials displayed on the public landing page.
              </p>
            </div>
            <button
              onClick={openNewTestimonialModal}
              className="px-4 py-2 rounded-xl bg-[#014645] text-white text-xs font-bold hover:bg-[#0b6e4f] transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              Add Testimonial
            </button>
          </div>

          {loadingTestimonials ? (
            <div className="py-12 text-center text-slate-400 text-xs font-semibold">
              Loading testimonials...
            </div>
          ) : testimonials.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-3 border border-slate-200/80">
              <MessageSquareQuote className="w-10 h-10 text-slate-300" />
              <h4 className="text-sm font-bold text-slate-800 text-center">No Testimonials Yet</h4>
              <p className="text-xs text-slate-500 max-w-sm text-center">
                Create customer testimonials to build social proof on the platform.
              </p>
              <button
                onClick={openNewTestimonialModal}
                className="mt-2 px-4 py-2 rounded-xl bg-[#014645] text-white text-xs font-bold hover:bg-[#0b6e4f] inline-flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
              >
                <Plus className="w-4 h-4" />
                Add First Testimonial
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {testimonials.map((t) => (
                <div
                  key={t.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-amber-400">
                        {Array.from({ length: t.rating || 5 }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                        ))}
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          t.status === "approved"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 italic line-clamp-4">
                      "{t.content}"
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 text-xs block">
                        {t.author_name}
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                        {t.author_role} {t.author_location ? `• ${t.author_location}` : ""}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleTestimonialStatus(t)}
                        title={t.status === "approved" ? "Reject" : "Approve"}
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                      >
                        {t.status === "approved" ? (
                          <XCircle className="w-4 h-4 text-rose-500" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        )}
                      </button>
                      <button
                        onClick={() => openEditTestimonialModal(t)}
                        title="Edit"
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                      >
                        <Eye className="w-4 h-4 text-slate-600" />
                      </button>
                      <button
                        onClick={() => handleDeleteTestimonial(t.id)}
                        title="Delete"
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Add / Edit Testimonial Modal ── */}
      {testimonialModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">
                {selectedTestimonial ? "Edit Testimonial" : "Add New Testimonial"}
              </h3>
              <button
                onClick={() => setTestimonialModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTestimonial} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Author Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formAuthorName}
                    onChange={(e) => setFormAuthorName(e.target.value)}
                    placeholder="e.g. Rajesh Kumar"
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#014645]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Author Role *
                  </label>
                  <select
                    value={formAuthorRole}
                    onChange={(e) => setFormAuthorRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#014645]"
                  >
                    <option value="owner">Property Owner</option>
                    <option value="agency">Real Estate Agency</option>
                    <option value="seeker">Property Seeker</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Location (City / Area)
                </label>
                <input
                  type="text"
                  value={formAuthorLocation}
                  onChange={(e) => setFormAuthorLocation(e.target.value)}
                  placeholder="e.g. Kochi, Kerala"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#014645]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Testimonial Content *
                </label>
                <textarea
                  required
                  rows={4}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Enter customer feedback..."
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#014645]"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-700">Rating:</label>
                  <select
                    value={formRating}
                    onChange={(e) => setFormRating(Number(e.target.value))}
                    className="px-2 py-1 rounded-lg text-xs bg-slate-50 border border-slate-200"
                  >
                    {[5, 4, 3, 2, 1].map((r) => (
                      <option key={r} value={r}>
                        {r} Stars
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setTestimonialModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingTestimonial}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#014645] text-white hover:bg-[#0b6e4f] cursor-pointer"
                  >
                    {submittingTestimonial ? "Saving..." : "Save Testimonial"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
