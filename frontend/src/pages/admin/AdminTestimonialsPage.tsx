import React, { useState, useEffect } from "react";
import {
  Plus, Pencil, Trash2, RefreshCw, X, Star,
  MessageSquareQuote, Check, ToggleLeft, ToggleRight, User,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface Testimonial {
  id: string;
  author_name: string;
  author_role: "owner" | "seeker" | "agency";
  author_location: string | null;
  content: string;
  avatar_key: string | null;
  avatar_url: string | null;
  rating: number | null;
  status: "pending" | "approved" | "rejected";
  display_order: number;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

type FormState = {
  author_name: string;
  author_role: "owner" | "seeker" | "agency";
  author_location: string;
  content: string;
  rating: number | "";
  is_featured: boolean;
  display_order: number;
};

const EMPTY: FormState = {
  author_name: "",
  author_role: "seeker",
  author_location: "",
  content: "",
  rating: "",
  is_featured: false,
  display_order: 0,
};

const ROLE_LABELS: Record<string, string> = { owner: "Owner", seeker: "Seeker", agency: "Agency" };

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const StarRating = ({ value, onChange }: { value: number | ""; onChange: (v: number) => void }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((n) => (
      <button
        key={n}
        type="button"
        onClick={() => onChange(n)}
        className={`cursor-pointer transition-colors ${
          typeof value === "number" && n <= value ? "text-amber-400" : "text-slate-200 hover:text-amber-300"
        }`}
      >
        <Star className="h-5 w-5 fill-current" />
      </button>
    ))}
  </div>
);

export const AdminTestimonialsPage: React.FC = () => {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Testimonial | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Testimonial | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [statusFilter, setStatusFilter] = useState("");

  const load = async (manual = false) => {
    try {
      if (manual) setRefreshing(true); else setLoading(true);
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.get("/api/admin/testimonials", { params });
      setItems(res.data);
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Failed to load testimonials.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY);
    setModalOpen(true);
  };

  const openEdit = (t: Testimonial) => {
    setEditTarget(t);
    setForm({
      author_name: t.author_name,
      author_role: t.author_role,
      author_location: t.author_location || "",
      content: t.content,
      rating: t.rating ?? "",
      is_featured: t.is_featured,
      display_order: t.display_order,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.author_name.trim() || !form.content.trim()) {
      toast.error("Author name and content are required.");
      return;
    }
    if (form.content.length > 300) {
      toast.error("Content must be 300 characters or less.");
      return;
    }
    try {
      setSaving(true);
      const payload = {
        ...form,
        author_location: form.author_location || null,
        rating: form.rating === "" ? null : Number(form.rating),
      };
      if (editTarget) {
        const res = await api.patch(`/api/admin/testimonials/${editTarget.id}`, payload);
        setItems(prev => prev.map(i => i.id === res.data.id ? res.data : i));
        toast.success("Testimonial updated.");
      } else {
        const res = await api.post("/api/admin/testimonials", payload);
        setItems(prev => [res.data, ...prev]);
        toast.success("Testimonial created.");
      }
      setModalOpen(false);
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await api.delete(`/api/admin/testimonials/${deleteTarget.id}`);
      setItems(prev => prev.filter(i => i.id !== deleteTarget.id));
      toast.success("Testimonial deleted.");
      setDeleteTarget(null);
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Delete failed.");
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleStatus = async (t: Testimonial) => {
    const newStatus = t.status === "approved" ? "pending" : "approved";
    try {
      const res = await api.patch(`/api/admin/testimonials/${t.id}`, { status: newStatus });
      setItems(prev => prev.map(i => i.id === res.data.id ? res.data : i));
      toast.success(`Status set to "${newStatus}".`);
    } catch {
      toast.error("Failed to update status.");
    }
  };

  const handleToggleFeatured = async (t: Testimonial) => {
    try {
      const res = await api.patch(`/api/admin/testimonials/${t.id}`, { is_featured: !t.is_featured });
      setItems(prev => prev.map(i => i.id === res.data.id ? res.data : i));
      toast.success(res.data.is_featured ? "Marked as featured." : "Removed from featured.");
    } catch {
      toast.error("Failed to update.");
    }
  };

  return (
    <div className="space-y-6 text-left font-sans">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-emerald-50 border border-emerald-200/60 text-[#014645] flex items-center justify-center">
              <MessageSquareQuote className="h-5 w-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight my-0">
              Testimonials
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1 ml-0.5">
            Manage customer testimonials displayed on the platform.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-200/80 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#014645] cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs px-3.5 py-2 rounded-lg border border-slate-200/80 shadow-2xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-[#014645]" : ""}`} />
          </button>
          <button
            onClick={openCreate}
            className="bg-[#014645] hover:bg-[#013534] text-white font-extrabold text-xs px-4 py-2 rounded-lg shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Plus className="h-4 w-4" /> Add Testimonial
          </button>
        </div>
      </div>

      {/* Summary Chips */}
      {!loading && items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {(["approved", "pending", "rejected"] as const).map(s => {
            const count = items.filter(i => i.status === s).length;
            return count > 0 ? (
              <button
                key={s}
                onClick={() => setStatusFilter(statusFilter === s ? "" : s)}
                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border transition-all cursor-pointer ${
                  statusFilter === s
                    ? "bg-[#014645] text-white border-[#014645]"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                }`}
              >
                {count} {s}
              </button>
            ) : null;
          })}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200/80 p-12 text-center space-y-3">
          <div className="h-7 w-7 border-2 border-[#014645] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loading...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/80 p-14 flex flex-col items-center justify-center text-center space-y-3 shadow-2xs">
          <div className="h-14 w-14 rounded-2xl bg-emerald-50 text-[#014645] flex items-center justify-center border border-emerald-200/60">
            <MessageSquareQuote className="h-7 w-7" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900 my-0">No Testimonials Yet</h3>
          <p className="text-xs text-slate-500 font-medium max-w-xs my-0">
            Add your first customer testimonial to display social proof on the platform.
          </p>
          <button
            onClick={openCreate}
            className="mt-2 bg-[#014645] text-white text-xs font-extrabold px-5 py-2.5 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-2xs hover:bg-[#013534] transition-all"
          >
            <Plus className="h-4 w-4" /> Add Testimonial
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map(t => (
            <div
              key={t.id}
              className={`bg-white rounded-2xl border shadow-2xs overflow-hidden flex flex-col transition-all hover:shadow-md ${
                !t.is_active ? "opacity-50" : t.is_featured ? "border-amber-300 ring-1 ring-amber-200" : "border-slate-200/80"
              }`}
            >
              {/* Card Header */}
              <div className="px-4 pt-4 pb-3 flex items-start gap-3 border-b border-slate-100">
                <div className="h-10 w-10 rounded-full bg-linear-to-br from-emerald-400 to-teal-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                  {t.avatar_url ? (
                    <img src={t.avatar_url} alt={t.author_name} className="h-full w-full object-cover rounded-full" />
                  ) : (
                    t.author_name[0]?.toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-slate-900 truncate my-0">{t.author_name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                      {ROLE_LABELS[t.author_role]}
                    </span>
                    {t.author_location && (
                      <>
                        <span className="text-slate-200">·</span>
                        <span className="text-[10px] font-semibold text-slate-400 truncate">{t.author_location}</span>
                      </>
                    )}
                  </div>
                </div>
                {t.is_featured && (
                  <span className="shrink-0 text-[9px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                    Featured
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="px-4 py-3 flex-1">
                {t.rating && (
                  <div className="flex gap-0.5 mb-2">
                    {[1, 2, 3, 4, 5].map(n => (
                      <Star
                        key={n}
                        className={`h-3.5 w-3.5 fill-current ${n <= t.rating! ? "text-amber-400" : "text-slate-100"}`}
                      />
                    ))}
                  </div>
                )}
                <p className="text-xs text-slate-600 font-medium leading-relaxed line-clamp-4 my-0">
                  "{t.content}"
                </p>
              </div>

              {/* Card Footer */}
              <div className="px-4 pb-4 pt-3 border-t border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <button onClick={() => handleToggleStatus(t)} className="cursor-pointer">
                    <span className={`inline-flex items-center gap-1 text-[9.5px] font-black uppercase px-2 py-0.5 rounded-full border ${
                      t.status === "approved"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : t.status === "pending"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}>
                      {t.status === "approved" ? <ToggleRight className="h-3 w-3" /> : <ToggleLeft className="h-3 w-3" />}
                      {t.status}
                    </span>
                  </button>
                  <span className="text-[10px] text-slate-400 font-semibold">{fmt(t.created_at)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleToggleFeatured(t)}
                    title={t.is_featured ? "Remove from featured" : "Mark as featured"}
                    className={`flex-1 text-[10px] font-extrabold py-1.5 rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      t.is_featured
                        ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                        : "bg-slate-50 text-slate-500 border-slate-200 hover:border-amber-200 hover:text-amber-600"
                    }`}
                  >
                    <Star className="h-3 w-3 fill-current" />
                    {t.is_featured ? "Featured" : "Feature"}
                  </button>
                  <button
                    onClick={() => openEdit(t)}
                    className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(t)}
                    className="h-8 w-8 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center cursor-pointer transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 text-left flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 shrink-0">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 my-0">
                  {editTarget ? "Edit Testimonial" : "Add Testimonial"}
                </h2>
                <p className="text-xs text-slate-500 font-medium my-0 mt-0.5">
                  {editTarget ? `Editing testimonial by "${editTarget.author_name}"` : "Add a new customer testimonial."}
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
              {/* Author Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 block">
                    Author Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      value={form.author_name}
                      onChange={e => setForm(f => ({ ...f, author_name: e.target.value }))}
                      placeholder="e.g. Arjun Menon"
                      className="w-full bg-slate-50 border border-slate-200/80 rounded-lg pl-9 pr-3 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#014645] focus:ring-1 focus:ring-[#014645]/20 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 block">Role *</label>
                  <select
                    value={form.author_role}
                    onChange={e => setForm(f => ({ ...f, author_role: e.target.value as any }))}
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-lg px-3 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#014645] transition-all cursor-pointer"
                  >
                    <option value="seeker">Seeker</option>
                    <option value="owner">Owner</option>
                    <option value="agency">Agency</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 block">Location</label>
                  <input
                    value={form.author_location}
                    onChange={e => setForm(f => ({ ...f, author_location: e.target.value }))}
                    placeholder="e.g. Kochi, Kerala"
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-lg px-3 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#014645] transition-all"
                  />
                </div>
              </div>

              {/* Content */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase text-slate-400">Content *</label>
                  <span className={`text-[10px] font-bold ${form.content.length > 280 ? "text-rose-500" : "text-slate-400"}`}>
                    {form.content.length}/300
                  </span>
                </div>
                <textarea
                  value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  placeholder="What did the customer say..."
                  rows={4}
                  maxLength={300}
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-lg p-3 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#014645] focus:ring-1 focus:ring-[#014645]/20 resize-none transition-all leading-relaxed"
                />
              </div>

              {/* Rating */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 block">Rating</label>
                <div className="flex items-center gap-3">
                  <StarRating value={form.rating} onChange={v => setForm(f => ({ ...f, rating: f.rating === v ? "" : v }))} />
                  {form.rating !== "" && (
                    <button
                      onClick={() => setForm(f => ({ ...f, rating: "" }))}
                      className="text-[10px] text-slate-400 hover:text-slate-600 font-semibold cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Options Row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 block">Display Order</label>
                  <input
                    type="number"
                    value={form.display_order}
                    onChange={e => setForm(f => ({ ...f, display_order: Number(e.target.value) }))}
                    min={0}
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-lg px-3 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#014645] transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 block">Featured</label>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, is_featured: !f.is_featured }))}
                    className={`w-full py-2.5 px-3 rounded-lg border text-xs font-extrabold flex items-center gap-2 cursor-pointer transition-all ${
                      form.is_featured
                        ? "bg-amber-50 text-amber-700 border-amber-300"
                        : "bg-slate-50 text-slate-500 border-slate-200"
                    }`}
                  >
                    {form.is_featured ? <Check className="h-3.5 w-3.5" /> : <Star className="h-3.5 w-3.5" />}
                    {form.is_featured ? "Featured" : "Not Featured"}
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2.5 px-6 pb-6 pt-4 border-t border-slate-100 shrink-0">
              <button
                onClick={() => setModalOpen(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-lg cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-[#014645] hover:bg-[#013534] text-white font-extrabold text-xs px-5 py-2.5 rounded-lg shadow-2xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5 transition-all"
              >
                {saving ? "Saving..." : editTarget ? "Save Changes" : "Create Testimonial"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-center">
            <div className="h-12 w-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 my-0">
                Delete Testimonial?
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                By <span className="font-bold text-slate-700">{deleteTarget.author_name}</span>.{" "}
                {deleteTarget.status === "approved"
                  ? "This is approved - it will be soft-deleted (hidden)."
                  : "This will be permanently removed."}
              </p>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs py-2.5 rounded-lg shadow-2xs cursor-pointer disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
