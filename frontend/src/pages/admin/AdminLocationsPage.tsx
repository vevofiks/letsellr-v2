import React, { useState, useEffect } from "react";
import {
  Plus, Pencil, Trash2, MapPin, RefreshCw, X,
  ToggleLeft, ToggleRight, ExternalLink, Star,
} from "lucide-react";
import { toast } from "sonner";
import { adminService, type LocationData } from "@/services/adminService";
import { Badge } from "@/components/ui/badge";
import { ImageInput } from "@/components/admin/ImageInput";

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

type FormState = { title: string; google_map_url: string; image_url: string; is_important: boolean; imageFile: File | null };
const EMPTY: FormState = { title: "", google_map_url: "", image_url: "", is_important: false, imageFile: null };

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
    setForm({ title: l.title, google_map_url: l.google_map_url || "", image_url: l.image_url || "", is_important: l.is_important, imageFile: null });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Title is required."); return; }
    try {
      setSaving(true);
      const payload = {
        title: form.title.trim(),
        google_map_url: form.google_map_url.trim() || null,
        // Skipped when a file is queued — the upload below sets image_url instead.
        image_url: form.imageFile ? undefined : (form.image_url.trim() || null),
        is_important: form.is_important,
      };

      let savedLocation: LocationData;
      if (editTarget) {
        savedLocation = await adminService.updateLocation(editTarget.id, payload);
        toast.success(`"${savedLocation.title}" updated.`);
      } else {
        savedLocation = await adminService.createLocation(payload);
        toast.success(`"${savedLocation.title}" added.`);
      }

      if (form.imageFile) {
        savedLocation = await adminService.uploadLocationImage(savedLocation.id, form.imageFile);
        toast.success(`Image uploaded for "${savedLocation.title}".`);
      }

      setLocations(prev => {
        const exists = prev.find(l => l.id === savedLocation.id);
        if (exists) return prev.map(l => l.id === savedLocation.id ? savedLocation : l);
        return [savedLocation, ...prev];
      });
      
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
    <div className="space-y-6 text-left font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight my-0">
              Location Management
            </h1>
            <Badge variant="secondary" className="text-xs font-black px-2.5 py-0.5 rounded-md">
              {locations.length} Locations
            </Badge>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Manage cities and areas available for property listings on Letsellr.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => load(true)} disabled={refreshing}
            className="bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs px-3.5 py-2 rounded-lg border border-slate-200/80 shadow-2xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50">
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-[#014645]" : ""}`} />
            <span>Refresh</span>
          </button>
          <button onClick={openCreate}
            className="bg-[#014645] hover:bg-[#013534] text-white font-extrabold text-xs px-4 py-2 rounded-lg shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer">
            <Plus className="h-4 w-4" />
            <span>Add Location</span>
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-lg bg-emerald-50 text-[#014645] flex items-center justify-center shrink-0 border border-emerald-200/60">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Total Locations</span>
            <span className="text-lg font-black text-slate-900 leading-none block mt-0.5">{locations.length}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200/60">
            <Star className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Featured Locations</span>
            <span className="text-lg font-black text-slate-900 leading-none block mt-0.5">{importantCount}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 border border-slate-200">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Standard Locations</span>
            <span className="text-lg font-black text-slate-900 leading-none block mt-0.5">{locations.length - importantCount}</span>
          </div>
        </div>
      </div>

      {/* Search & Table Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200/80">
          <div className="relative max-w-sm">
            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search location title..."
              className="w-full bg-slate-50 border border-slate-200/80 rounded-lg pl-10 pr-4 py-2 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#014645] transition-all"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center space-y-3">
            <div className="h-7 w-7 border-2 border-[#014645] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loading Locations...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center space-y-3 shadow-2xs">
            <div className="h-12 w-12 rounded-xl bg-emerald-50 text-[#014645] flex items-center justify-center border border-emerald-200/60">
              <MapPin className="h-6 w-6" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 my-0 text-center">
              {search ? "No matches found" : "No locations added"}
            </h3>
            <p className="text-xs text-slate-500 font-medium max-w-md text-center my-0">
              {search ? `No location matches "${search}".` : "Add your first location."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  {["Location Title", "Map Link", "Priority", "Added", "Actions"].map(h => (
                    <th key={h} className={`py-3 px-5 ${h === 'Actions' ? 'text-right' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {filtered.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-2.5">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border ${
                          l.is_important ? "bg-amber-50 text-amber-700 border-amber-200/60" : "bg-slate-100 text-slate-500 border-slate-200"
                        }`}>
                          <MapPin className="h-4 w-4" />
                        </div>
                        <p className="text-xs font-extrabold text-slate-900 my-0">{l.title}</p>
                      </div>
                    </td>
                    <td className="py-3 px-5">
                      {l.google_map_url ? (
                        <a href={l.google_map_url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs font-bold text-[#014645] hover:underline">
                          <span>View Map</span> <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-semibold">Not set</span>
                      )}
                    </td>
                    <td className="py-3 px-5">
                      <button onClick={() => handleToggleImportant(l)} className="cursor-pointer">
                        {l.is_important
                          ? <Badge variant="warning" className="text-[9.5px] font-black uppercase flex items-center gap-1">
                              <Star className="h-3 w-3 fill-current" /> Featured
                            </Badge>
                          : <Badge variant="outline" className="text-[9.5px] font-black uppercase flex items-center gap-1">
                              <Star className="h-3 w-3" /> Standard
                            </Badge>
                        }
                      </button>
                    </td>
                    <td className="py-3 px-5 text-slate-500 text-[11px] font-semibold">{fmt(l.created_at)}</td>
                    <td className="py-3 px-5 text-right">
                      <div className="flex items-center gap-1.5 justify-end">
                        <button onClick={() => openEdit(l)} className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-colors">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setDeleteTarget(l)} className="h-8 w-8 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center cursor-pointer transition-colors">
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

      {/* Modal: Create/Edit */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 my-0">
                  {editTarget ? "Edit Location" : "Add Location"}
                </h2>
                <p className="text-xs text-slate-500 font-medium my-0">
                  {editTarget ? `Editing "${editTarget.title}"` : "Add a new city or area."}
                </p>
              </div>
              <button onClick={() => setModalOpen(false)} className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 block">Location Title *</label>
                <input
                  value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Koramangala, Bangalore"
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#014645]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 block">Google Maps Link</label>
                <input
                  value={form.google_map_url} onChange={e => setForm(f => ({ ...f, google_map_url: e.target.value }))}
                  placeholder="https://maps.google.com/..."
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#014645]"
                />
              </div>

              <ImageInput
                label="Location Image"
                imageUrl={form.image_url}
                imageFile={form.imageFile}
                existingUrl={editTarget?.image_url}
                onUrlChange={url => setForm(f => ({ ...f, image_url: url }))}
                onFileChange={file => setForm(f => ({ ...f, imageFile: file }))}
                disabled={saving}
              />

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                <div>
                  <p className="text-xs font-extrabold text-slate-900 my-0">Mark as Featured</p>
                  <p className="text-[11px] text-slate-500 font-medium my-0">Featured locations appear first in search dropdowns.</p>
                </div>
                <button onClick={() => setForm(f => ({ ...f, is_important: !f.is_important }))} className="cursor-pointer">
                  {form.is_important
                    ? <ToggleRight className="h-6 w-6 text-[#014645]" />
                    : <ToggleLeft className="h-6 w-6 text-slate-400" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button onClick={() => setModalOpen(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3.5 py-2 rounded-lg cursor-pointer">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="bg-[#014645] hover:bg-[#013534] text-white font-extrabold text-xs px-4 py-2 rounded-lg shadow-2xs cursor-pointer disabled:opacity-50">
                {saving ? "Saving..." : editTarget ? "Save Changes" : "Add Location"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Delete Confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-center">
            <div className="h-10 w-10 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 my-0">Remove "{deleteTarget.title}"?</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">This action cannot be undone.</p>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2 rounded-lg cursor-pointer">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs py-2 rounded-lg shadow-2xs cursor-pointer disabled:opacity-50">
                {deleting ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
