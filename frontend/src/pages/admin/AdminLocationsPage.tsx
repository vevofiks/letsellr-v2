import React, { useState, useEffect } from "react";
import {
  Plus, Pencil, Trash2, MapPin, RefreshCw, X, Check,
  ToggleLeft, ToggleRight, ExternalLink, Star,
} from "lucide-react";
import { toast } from "sonner";
import { adminService, type LocationData } from "@/services/adminService";

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

type FormState = { title: string; google_map_url: string; is_important: boolean };
const EMPTY: FormState = { title: "", google_map_url: "", is_important: false };

export const AdminLocationsPage: React.FC = () => {
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<LocationData | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<LocationData | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async (manual = false) => {
    try {
      if (manual) setRefreshing(true); else setLoading(true);
      setLocations(await adminService.getLocations());
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Failed to load locations.");
    } finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = locations.filter(l =>
    l.title.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setEditTarget(null); setForm(EMPTY); setModalOpen(true); };
  const openEdit = (l: LocationData) => {
    setEditTarget(l);
    setForm({ title: l.title, google_map_url: l.google_map_url || "", is_important: l.is_important });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Title is required."); return; }
    try {
      setSaving(true);
      const payload = { title: form.title.trim(), google_map_url: form.google_map_url.trim() || null, is_important: form.is_important };
      if (editTarget) {
        const updated = await adminService.updateLocation(editTarget.id, payload);
        setLocations(prev => prev.map(l => l.id === updated.id ? updated : l));
        toast.success(`"${updated.title}" updated.`);
      } else {
        const created = await adminService.createLocation(payload);
        setLocations(prev => [created, ...prev]);
        toast.success(`"${created.title}" added.`);
      }
      setModalOpen(false);
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Save failed.");
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await adminService.deleteLocation(deleteTarget.id);
      setLocations(prev => prev.filter(l => l.id !== deleteTarget.id));
      toast.success(`"${deleteTarget.title}" removed.`);
      setDeleteTarget(null);
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Delete failed.");
    } finally { setDeleting(false); }
  };

  const handleToggleImportant = async (l: LocationData) => {
    try {
      const updated = await adminService.updateLocation(l.id, { is_important: !l.is_important });
      setLocations(prev => prev.map(x => x.id === updated.id ? updated : x));
      toast.success(`"${updated.title}" marked as ${updated.is_important ? "important" : "standard"}.`);
    } catch { toast.error("Failed to update."); }
  };

  const importantCount = locations.filter(l => l.is_important).length;

  return (
    <div className="space-y-6" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight" style={{ color: "#08060d" }}>
              Location Management
            </h1>
            <span className="text-[12px] font-bold px-2.5 py-0.5 rounded-full" style={{ background: "#f1f5f9", color: "#6b6375", border: "1px solid #e2e8f0" }}>
              {locations.length} Locations
            </span>
          </div>
          <p className="text-[13px] font-medium mt-1" style={{ color: "#6B7280" }}>
            Manage cities and areas available for property listings. Star important ones for search prominence.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => load(true)} disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-all cursor-pointer disabled:opacity-50"
            style={{ background: "#ffffff", border: "1px solid #e2e8f0", color: "#6b6375" }}>
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} style={{ color: refreshing ? "#23D283" : undefined }} />
            Refresh
          </button>
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-bold cursor-pointer"
            style={{ background: "#23D283", color: "#ffffff" }}>
            <Plus className="h-4 w-4" />
            Add Location
          </button>
        </div>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: "Total Locations", value: locations.length, icon: MapPin, bg: "#D9F7E9", color: "#0B6E4F" },
          { label: "Featured / Important", value: importantCount, icon: Star, bg: "#FDE68A", color: "#92400E" },
          { label: "Standard Locations", value: locations.length - importantCount, icon: MapPin, bg: "#f1f5f9", color: "#6B7280" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-4 flex items-center gap-3" style={{ border: "1px solid oklch(0.922 0 0)" }}>
            <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: s.bg }}>
              <s.icon className="h-5 w-5" style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: "#6B7280" }}>{s.label}</p>
              <p className="text-xl font-black" style={{ color: "#08060d" }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search + Table */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid oklch(0.922 0 0)", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        {/* Search bar */}
        <div className="p-4" style={{ borderBottom: "1px solid oklch(0.922 0 0)" }}>
          <div className="relative max-w-sm">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#6B7280" }} />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search locations…"
              className="w-full rounded-xl pl-9 pr-4 py-2.5 text-[13px] font-medium focus:outline-none transition-all"
              style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", color: "#08060d" }}
              onFocus={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#23D283"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(35,210,131,0.12)"; }}
              onBlur={e => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "none"; }}
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer" style={{ color: "#6B7280" }}>
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="p-14 text-center">
            <div className="h-8 w-8 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-3" style={{ borderColor: "#23D283", borderTopColor: "transparent" }} />
            <p className="text-[12px] font-bold uppercase tracking-wider" style={{ color: "#6B7280" }}>Loading locations…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-14 text-center space-y-3">
            <div className="h-12 w-12 rounded-2xl flex items-center justify-center mx-auto" style={{ background: "#D9F7E9" }}>
              <MapPin className="h-6 w-6" style={{ color: "#11995E" }} />
            </div>
            <p className="text-[15px] font-black" style={{ color: "#08060d" }}>
              {search ? "No matches found" : "No locations yet"}
            </p>
            <p className="text-[13px]" style={{ color: "#6B7280" }}>
              {search ? `No location matches "${search}".` : "Add your first location to get started."}
            </p>
            {!search && (
              <button onClick={openCreate} className="mx-auto mt-2 flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-bold cursor-pointer" style={{ background: "#23D283", color: "#fff" }}>
                <Plus className="h-4 w-4" /> Add Location
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid oklch(0.922 0 0)" }}>
                  {["Location Title", "Map Link", "Priority", "Added", ""].map(h => (
                    <th key={h} className="py-3 px-5 text-[10px] font-black uppercase tracking-widest" style={{ color: "#6B7280" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((l, i) => (
                  <tr key={l.id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid #f1f5f9" : "none" }}
                    className="transition-colors hover:bg-[#fafafa]">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: l.is_important ? "#FDE68A" : "#f1f5f9" }}>
                          <MapPin className="h-4 w-4" style={{ color: l.is_important ? "#92400E" : "#6B7280" }} />
                        </div>
                        <div>
                          <p className="text-[13px] font-bold" style={{ color: "#08060d" }}>{l.title}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      {l.google_map_url ? (
                        <a href={l.google_map_url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[12px] font-semibold" style={{ color: "#23D283" }}>
                          View Map <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-[12px]" style={{ color: "#6B7280" }}>Not set</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5">
                      <button onClick={() => handleToggleImportant(l)} className="cursor-pointer">
                        {l.is_important
                          ? <span className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: "#FDE68A", color: "#92400E" }}>
                              <Star className="h-3 w-3 fill-current" /> Featured
                            </span>
                          : <span className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: "#f1f5f9", color: "#6B7280" }}>
                              <Star className="h-3 w-3" /> Standard
                            </span>
                        }
                      </button>
                    </td>
                    <td className="py-3.5 px-5 text-[12px]" style={{ color: "#6B7280" }}>{fmt(l.created_at)}</td>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-1.5 justify-end">
                        <button onClick={() => openEdit(l)}
                          className="h-8 w-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                          style={{ border: "1px solid #e2e8f0", color: "#6b6375" }}
                          onMouseEnter={e => { e.currentTarget.style.background = "#f1f5f9"; }} onMouseLeave={e => { e.currentTarget.style.background = ""; }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setDeleteTarget(l)}
                          className="h-8 w-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                          style={{ border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}
                          onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.05)"; }} onMouseLeave={e => { e.currentTarget.style.background = ""; }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Create / Edit Modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(8,6,13,0.5)", backdropFilter: "blur(4px)" }}>
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid oklch(0.922 0 0)" }}>
              <div>
                <h2 className="text-[17px] font-black" style={{ color: "#08060d" }}>
                  {editTarget ? "Edit Location" : "Add Location"}
                </h2>
                <p className="text-[12px] mt-0.5" style={{ color: "#6B7280" }}>
                  {editTarget ? `Editing "${editTarget.title}"` : "Add a new city or area to the platform."}
                </p>
              </div>
              <button onClick={() => setModalOpen(false)} className="h-8 w-8 rounded-full flex items-center justify-center cursor-pointer" style={{ background: "#f1f5f9", color: "#6b6375" }}>
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-widest" style={{ color: "#6B7280" }}>Location Title *</label>
                <input
                  value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Koramangala, Bangalore"
                  className="w-full rounded-xl px-3.5 py-2.5 text-[13px] font-medium focus:outline-none transition-all"
                  style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", color: "#08060d" }}
                  onFocus={e => { e.currentTarget.style.borderColor = "#23D283"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(35,210,131,0.12)"; e.currentTarget.style.background = "#fff"; }}
                  onBlur={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.background = "#f1f5f9"; }}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-widest" style={{ color: "#6B7280" }}>Google Maps URL</label>
                <input
                  value={form.google_map_url} onChange={e => setForm(f => ({ ...f, google_map_url: e.target.value }))}
                  placeholder="https://maps.google.com/…"
                  className="w-full rounded-xl px-3.5 py-2.5 text-[13px] font-medium focus:outline-none transition-all"
                  style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", color: "#08060d" }}
                  onFocus={e => { e.currentTarget.style.borderColor = "#23D283"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(35,210,131,0.12)"; e.currentTarget.style.background = "#fff"; }}
                  onBlur={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.background = "#f1f5f9"; }}
                />
                <p className="text-[11px]" style={{ color: "#6B7280" }}>Optional — shown as a map link in admin and on listing pages.</p>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <div>
                  <p className="text-[13px] font-semibold" style={{ color: "#08060d" }}>Mark as Important / Featured</p>
                  <p className="text-[11px]" style={{ color: "#6B7280" }}>Featured locations appear first in search filters.</p>
                </div>
                <button onClick={() => setForm(f => ({ ...f, is_important: !f.is_important }))} className="cursor-pointer ml-3 shrink-0">
                  {form.is_important
                    ? <ToggleRight className="h-6 w-6" style={{ color: "#23D283" }} />
                    : <ToggleLeft className="h-6 w-6" style={{ color: "#6B7280" }} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: "1px solid oklch(0.922 0 0)" }}>
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-xl text-[13px] font-semibold cursor-pointer" style={{ background: "#f1f5f9", color: "#6b6375", border: "1px solid #e2e8f0" }}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="px-5 py-2 rounded-xl text-[13px] font-bold cursor-pointer disabled:opacity-60 flex items-center gap-2" style={{ background: "#23D283", color: "#fff" }}>
                {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                {saving ? "Saving…" : editTarget ? "Save Changes" : "Add Location"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(8,6,13,0.5)", backdropFilter: "blur(4px)" }}>
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="h-12 w-12 rounded-2xl flex items-center justify-center mx-auto" style={{ background: "rgba(239,68,68,0.08)" }}>
              <Trash2 className="h-6 w-6" style={{ color: "#ef4444" }} />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-[16px] font-black" style={{ color: "#08060d" }}>Remove "{deleteTarget.title}"?</h3>
              <p className="text-[13px]" style={{ color: "#6B7280" }}>This location will no longer appear in property listing filters.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold cursor-pointer" style={{ background: "#f1f5f9", color: "#6b6375", border: "1px solid #e2e8f0" }}>
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2.5 rounded-xl text-[13px] font-bold cursor-pointer disabled:opacity-60" style={{ background: "#ef4444", color: "#fff" }}>
                {deleting ? "Removing…" : "Yes, Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
