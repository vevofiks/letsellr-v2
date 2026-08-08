import React, { useState, useEffect } from "react";
import {
  Plus, Pencil, Trash2, Layers, RefreshCw, X, Check,
  ToggleLeft, ToggleRight, Tag,
} from "lucide-react";
import { toast } from "sonner";
import { adminService, type PropertyType } from "@/services/adminService";
import { Badge } from "@/components/ui/badge";
import { ImageInput } from "@/components/admin/ImageInput";

const ROLE_OPTIONS = ["owner", "agency"];

const slugify = (str: string) =>
  str.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

type FormState = {
  slug: string;
  label: string;
  description: string;
  image_url: string;
  imageFile: File | null;
  is_active: boolean;
  allowed_roles: string[];
};
const EMPTY: FormState = { slug: "", label: "", description: "", image_url: "", imageFile: null, is_active: true, allowed_roles: [] };

export const AdminCategoriesPage: React.FC = () => {
  const [types, setTypes] = useState<PropertyType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PropertyType | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<PropertyType | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async (manual = false) => {
    try {
      if (manual) setRefreshing(true); else setLoading(true);
      setTypes(await adminService.getPropertyTypes());
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Failed to load property types.");
    } finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY);
    setModalOpen(true);
  };

  const openEdit = (t: PropertyType) => {
    setEditTarget(t);
    setForm({
      slug: t.slug,
      label: t.label,
      description: t.description,
      image_url: t.image_url || "",
      imageFile: null,
      is_active: t.is_active,
      allowed_roles: t.allowed_roles ? t.allowed_roles.filter(r => ROLE_OPTIONS.includes(r)) : [],
    });
    setModalOpen(true);
  };

  const handleLabelChange = (val: string) => {
    setForm(f => ({ ...f, label: val, slug: editTarget ? f.slug : slugify(val) }));
  };

  const toggleRole = (role: string) => {
    setForm(f => ({
      ...f,
      allowed_roles: f.allowed_roles.includes(role)
        ? f.allowed_roles.filter(r => r !== role)
        : [...f.allowed_roles, role],
    }));
  };

  const handleSave = async () => {
    if (!form.label.trim() || !form.slug.trim()) {
      toast.error("Label and slug are required.");
      return;
    }
    try {
      setSaving(true);
      const payload = {
        slug: form.slug.trim(),
        label: form.label.trim(),
        description: form.description.trim(),
        // null (not undefined) so clearing the image actually clears it —
        // the API patches with exclude_unset, and undefined is dropped by JSON.
        image_url: form.imageFile ? undefined : (form.image_url.trim() || null),
        is_active: form.is_active,
        allowed_roles: form.allowed_roles,
      };

      let saved: PropertyType;
      if (editTarget) {
        saved = await adminService.updatePropertyType(editTarget.id, payload);
      } else {
        saved = await adminService.createPropertyType(payload);
      }

      // The upload endpoint needs a record to attach to, so it runs second and
      // overwrites image_url with the stored file's URL.
      if (form.imageFile) {
        saved = await adminService.uploadPropertyTypeImage(saved.id, form.imageFile);
      }

      setTypes(prev => prev.some(t => t.id === saved.id)
        ? prev.map(t => t.id === saved.id ? saved : t)
        : [...prev, saved]);
      toast.success(`"${saved.label}" ${editTarget ? "updated" : "created"}.`);

      setModalOpen(false);
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Save failed.");
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await adminService.deletePropertyType(deleteTarget.id);
      setTypes(prev => prev.filter(t => t.id !== deleteTarget.id));
      toast.success(`"${deleteTarget.label}" deleted.`);
      setDeleteTarget(null);
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Delete failed.");
    } finally { setDeleting(false); }
  };

  const handleToggleActive = async (t: PropertyType) => {
    try {
      const updated = await adminService.updatePropertyType(t.id, { is_active: !t.is_active });
      setTypes(prev => prev.map(x => x.id === updated.id ? updated : x));
      toast.success(`"${updated.label}" ${updated.is_active ? "enabled" : "disabled"}.`);
    } catch (e: any) {
      toast.error("Failed to toggle status.");
    }
  };

  return (
    <div className="space-y-6 text-left font-sans">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight my-0">
              Categories & Property Types
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Define property categories on the platform and specify which account roles can list them.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="flex-1 sm:flex-none justify-center bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs px-3.5 py-2 rounded-lg border border-slate-200/80 shadow-2xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-[#014645]" : ""}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={openCreate}
            className="flex-1 sm:flex-none justify-center bg-[#014645] hover:bg-[#013534] text-white font-extrabold text-xs px-4 py-2 rounded-lg shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span>Add Property Type</span>
          </button>
        </div>
      </div>

      {/* Table Card */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200/80 p-12 text-center space-y-3">
          <div className="h-7 w-7 border-2 border-[#014645] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Loading Categories...
          </p>
        </div>
      ) : types.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/80 p-12 flex flex-col items-center justify-center text-center space-y-3 shadow-2xs">
          <div className="h-12 w-12 rounded-xl bg-emerald-50 text-[#014645] flex items-center justify-center border border-emerald-200/60">
            <Layers className="h-6 w-6" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900 my-0 text-center">No Property Types Configured</h3>
          <p className="text-xs text-slate-500 font-medium max-w-md text-center my-2!">Create your first property category to enable listings.</p>
          <button onClick={openCreate} className="mt-2 bg-[#014645] text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-2xs">
            <Plus className="h-4 w-4" /> Add Type
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  {["Category / Slug", "Description", "Allowed Roles", "Status", "Created", "Actions"].map(h => (
                    <th key={h} className={`py-3 px-4 sm:px-5 whitespace-nowrap ${h === 'Actions' ? 'text-right' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {types.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 sm:px-5 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        {t.image_url ? (
                          <img src={t.image_url} alt={t.label} className="h-8 w-8 rounded-lg object-cover border border-slate-200/80 shrink-0" />
                        ) : (
                          <div className="h-8 w-8 rounded-lg bg-emerald-50 border border-emerald-200/60 text-[#014645] flex items-center justify-center shrink-0">
                            <Tag className="h-4 w-4" />
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-extrabold text-slate-900 leading-tight my-0">{t.label}</p>
                          <p className="text-[10.5px] font-mono text-slate-400 my-0">{t.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 sm:px-5 max-w-48 sm:max-w-64">
                      <p className="text-xs text-slate-600 truncate my-0">{t.description || "No description"}</p>
                    </td>
                    <td className="py-3 px-4 sm:px-5 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {t.allowed_roles.length === 0
                          ? <span className="text-[11px] text-slate-400 font-semibold">All roles</span>
                          : t.allowed_roles.map(r => (
                            <Badge key={r} variant="outline" className="text-[9px] font-black uppercase shrink-0">
                              {r}
                            </Badge>
                          ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 sm:px-5 whitespace-nowrap">
                      <button onClick={() => handleToggleActive(t)} className="cursor-pointer">
                        {t.is_active
                          ? <Badge variant="success" className="text-[9.5px] font-black uppercase flex items-center gap-1 shrink-0">
                              <ToggleRight className="h-3.5 w-3.5" /> Active
                            </Badge>
                          : <Badge variant="outline" className="text-[9.5px] font-black uppercase flex items-center gap-1 shrink-0">
                              <ToggleLeft className="h-3.5 w-3.5" /> Inactive
                            </Badge>
                        }
                      </button>
                    </td>
                    <td className="py-3 px-4 sm:px-5 whitespace-nowrap text-slate-500 text-[11px] font-semibold">{fmt(t.created_at)}</td>
                    <td className="py-3 px-4 sm:px-5 whitespace-nowrap text-right">
                      <div className="flex items-center gap-1.5 justify-end">
                        <button onClick={() => openEdit(t)} className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-colors">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setDeleteTarget(t)} className="h-8 w-8 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center cursor-pointer transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 my-0">
                  {editTarget ? "Edit Property Type" : "Create Property Type"}
                </h2>
                <p className="text-xs text-slate-500 font-medium my-0">
                  {editTarget ? `Editing "${editTarget.label}"` : "Define a new property category."}
                </p>
              </div>
              <button onClick={() => setModalOpen(false)} className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 block">Label *</label>
                  <input
                    value={form.label}
                    onChange={e => handleLabelChange(e.target.value)}
                    placeholder="e.g. Apartment"
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#014645]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 block">Slug *</label>
                  <input
                    value={form.slug}
                    onChange={e => setForm(f => ({ ...f, slug: slugify(e.target.value) }))}
                    placeholder="e.g. apartment"
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-lg px-3 py-2 text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:border-[#014645]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 block">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Brief description for this category..."
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-lg p-3 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#014645] resize-none"
                />
              </div>

              <ImageInput
                label="Category Image"
                imageUrl={form.image_url}
                imageFile={form.imageFile}
                existingUrl={editTarget?.image_url}
                onUrlChange={url => setForm(f => ({ ...f, image_url: url }))}
                onFileChange={file => setForm(f => ({ ...f, imageFile: file }))}
                disabled={saving}
              />

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 block">Allowed Roles (empty = all)</label>
                <div className="flex flex-wrap gap-1.5">
                  {ROLE_OPTIONS.map(role => {
                    const selected = form.allowed_roles.includes(role);
                    return (
                      <button key={role} type="button" onClick={() => toggleRole(role)}
                        className={`px-3 py-1 rounded-lg text-xs font-extrabold capitalize cursor-pointer transition-all flex items-center gap-1 ${
                          selected ? "bg-emerald-50 text-[#014645] border border-emerald-200" : "bg-slate-50 text-slate-600 border border-slate-200/80"
                        }`}
                      >
                        {selected && <Check className="h-3 w-3" />}
                        {role}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button onClick={() => setModalOpen(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3.5 py-2 rounded-lg cursor-pointer">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="bg-[#014645] hover:bg-[#013534] text-white font-extrabold text-xs px-4 py-2 rounded-lg shadow-2xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5">
                {saving ? "Saving..." : editTarget ? "Save Changes" : "Create Type"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-center">
            <div className="h-10 w-10 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 my-0">Delete "{deleteTarget.label}"?</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">This action cannot be undone.</p>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2 rounded-lg cursor-pointer">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs py-2 rounded-lg shadow-2xs cursor-pointer disabled:opacity-50">
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
