import React, { useState, useEffect } from "react";
import {
  Plus, Pencil, Trash2, Layers, RefreshCw, X, Check,
  ToggleLeft, ToggleRight, Tag,
} from "lucide-react";
import { toast } from "sonner";
import { adminService, type PropertyType } from "@/services/adminService";

const ROLE_OPTIONS = ["owner", "agency", "user", "admin"];

const slugify = (str: string) =>
  str.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

// ── Inline form for create/edit ──
type FormState = { slug: string; label: string; description: string; is_active: boolean; allowed_roles: string[] };
const EMPTY: FormState = { slug: "", label: "", description: "", is_active: true, allowed_roles: [] };

export const AdminCategoriesPage: React.FC = () => {
  const [types, setTypes] = useState<PropertyType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Create / Edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PropertyType | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);

  // Delete confirm
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
    setForm({ slug: t.slug, label: t.label, description: t.description, is_active: t.is_active, allowed_roles: [...t.allowed_roles] });
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
      if (editTarget) {
        const updated = await adminService.updatePropertyType(editTarget.id, form);
        setTypes(prev => prev.map(t => t.id === updated.id ? updated : t));
        toast.success(`"${updated.label}" updated.`);
      } else {
        const created = await adminService.createPropertyType(form);
        setTypes(prev => [...prev, created]);
        toast.success(`"${created.label}" created.`);
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
    <div className="space-y-6" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight" style={{ color: "#08060d" }}>
              Categories & Property Types
            </h1>
            <span className="text-[12px] font-bold px-2.5 py-0.5 rounded-full" style={{ background: "#f1f5f9", color: "#6b6375", border: "1px solid #e2e8f0" }}>
              {types.length} Types
            </span>
          </div>
          <p className="text-[13px] font-medium mt-1" style={{ color: "#6B7280" }}>
            Define the property categories available on the platform and which roles can list them.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-all cursor-pointer disabled:opacity-50"
            style={{ background: "#ffffff", border: "1px solid #e2e8f0", color: "#6b6375" }}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} style={{ color: refreshing ? "#23D283" : undefined }} />
            Refresh
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-bold transition-all cursor-pointer"
            style={{ background: "#23D283", color: "#ffffff" }}
          >
            <Plus className="h-4 w-4" />
            Add Type
          </button>
        </div>
      </div>

      {/* Table Card */}
      {loading ? (
        <div className="bg-white rounded-2xl p-14 text-center" style={{ border: "1px solid oklch(0.922 0 0)" }}>
          <div className="h-8 w-8 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-3" style={{ borderColor: "#23D283", borderTopColor: "transparent" }} />
          <p className="text-[12px] font-bold uppercase tracking-wider" style={{ color: "#6B7280" }}>Loading types…</p>
        </div>
      ) : types.length === 0 ? (
        <div className="bg-white rounded-2xl p-14 text-center space-y-3" style={{ border: "1px solid oklch(0.922 0 0)" }}>
          <div className="h-12 w-12 rounded-2xl flex items-center justify-center mx-auto" style={{ background: "#D9F7E9" }}>
            <Layers className="h-6 w-6" style={{ color: "#11995E" }} />
          </div>
          <p className="text-[15px] font-black" style={{ color: "#08060d" }}>No property types yet</p>
          <p className="text-[13px]" style={{ color: "#6B7280" }}>Create your first property category to get started.</p>
          <button onClick={openCreate} className="mx-auto mt-2 flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-bold cursor-pointer" style={{ background: "#23D283", color: "#fff" }}>
            <Plus className="h-4 w-4" /> Add Type
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid oklch(0.922 0 0)", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid oklch(0.922 0 0)" }}>
                  {["Label / Slug", "Description", "Allowed Roles", "Status", "Created", ""].map(h => (
                    <th key={h} className="py-3 px-5 text-[10px] font-black uppercase tracking-widest" style={{ color: "#6B7280" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {types.map((t, i) => (
                  <tr key={t.id} style={{ borderBottom: i < types.length - 1 ? "1px solid #f1f5f9" : "none" }}
                    className="transition-colors hover:bg-[#fafafa]">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#D9F7E9" }}>
                          <Tag className="h-4 w-4" style={{ color: "#0B6E4F" }} />
                        </div>
                        <div>
                          <p className="text-[13px] font-bold" style={{ color: "#08060d" }}>{t.label}</p>
                          <p className="text-[11px] font-mono" style={{ color: "#6B7280" }}>{t.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 max-w-[200px]">
                      <p className="text-[12px] truncate" style={{ color: "#6b6375" }}>{t.description || "—"}</p>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex flex-wrap gap-1">
                        {t.allowed_roles.length === 0
                          ? <span className="text-[11px]" style={{ color: "#6B7280" }}>All roles</span>
                          : t.allowed_roles.map(r => (
                            <span key={r} className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize"
                              style={{ background: "rgba(170,59,255,0.08)", color: "#7c3aed", border: "1px solid rgba(170,59,255,0.2)" }}>
                              {r}
                            </span>
                          ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <button onClick={() => handleToggleActive(t)} className="cursor-pointer">
                        {t.is_active
                          ? <span className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: "#D9F7E9", color: "#0B6E4F" }}>
                              <ToggleRight className="h-3.5 w-3.5" /> Active
                            </span>
                          : <span className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: "#f1f5f9", color: "#6B7280" }}>
                              <ToggleLeft className="h-3.5 w-3.5" /> Inactive
                            </span>
                        }
                      </button>
                    </td>
                    <td className="py-3.5 px-5 text-[12px]" style={{ color: "#6B7280" }}>{fmt(t.created_at)}</td>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-1.5 justify-end">
                        <button onClick={() => openEdit(t)} className="h-8 w-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors" style={{ border: "1px solid #e2e8f0", color: "#6b6375" }}
                          onMouseEnter={e => { e.currentTarget.style.background = "#f1f5f9"; }} onMouseLeave={e => { e.currentTarget.style.background = ""; }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setDeleteTarget(t)} className="h-8 w-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors" style={{ border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}
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
        </div>
      )}

      {/* ── Create / Edit Modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(8,6,13,0.5)", backdropFilter: "blur(4px)" }}>
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid oklch(0.922 0 0)" }}>
              <div>
                <h2 className="text-[17px] font-black" style={{ color: "#08060d" }}>
                  {editTarget ? "Edit Property Type" : "Create Property Type"}
                </h2>
                <p className="text-[12px] mt-0.5" style={{ color: "#6B7280" }}>
                  {editTarget ? `Editing "${editTarget.label}"` : "Define a new category for property listings."}
                </p>
              </div>
              <button onClick={() => setModalOpen(false)} className="h-8 w-8 rounded-full flex items-center justify-center cursor-pointer" style={{ background: "#f1f5f9", color: "#6b6375" }}>
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-widest" style={{ color: "#6B7280" }}>Label *</label>
                  <input
                    value={form.label}
                    onChange={e => handleLabelChange(e.target.value)}
                    placeholder="e.g. Apartment"
                    className="w-full rounded-xl px-3.5 py-2.5 text-[13px] font-medium focus:outline-none transition-all"
                    style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", color: "#08060d" }}
                    onFocus={e => { e.currentTarget.style.borderColor = "#23D283"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(35,210,131,0.12)"; e.currentTarget.style.background = "#fff"; }}
                    onBlur={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.background = "#f1f5f9"; }}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-widest" style={{ color: "#6B7280" }}>Slug *</label>
                  <input
                    value={form.slug}
                    onChange={e => setForm(f => ({ ...f, slug: slugify(e.target.value) }))}
                    placeholder="e.g. apartment"
                    className="w-full rounded-xl px-3.5 py-2.5 text-[13px] font-mono focus:outline-none transition-all"
                    style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", color: "#08060d" }}
                    onFocus={e => { e.currentTarget.style.borderColor = "#23D283"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(35,210,131,0.12)"; e.currentTarget.style.background = "#fff"; }}
                    onBlur={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.background = "#f1f5f9"; }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-widest" style={{ color: "#6B7280" }}>Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Brief description for this property type…"
                  rows={2}
                  className="w-full rounded-xl px-3.5 py-2.5 text-[13px] font-medium resize-none focus:outline-none transition-all"
                  style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", color: "#08060d" }}
                  onFocus={e => { e.currentTarget.style.borderColor = "#23D283"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(35,210,131,0.12)"; e.currentTarget.style.background = "#fff"; }}
                  onBlur={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.background = "#f1f5f9"; }}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest" style={{ color: "#6B7280" }}>Allowed Roles (empty = all)</label>
                <div className="flex flex-wrap gap-2">
                  {ROLE_OPTIONS.map(role => {
                    const selected = form.allowed_roles.includes(role);
                    return (
                      <button key={role} onClick={() => toggleRole(role)}
                        className="px-3 py-1.5 rounded-xl text-[12px] font-bold capitalize cursor-pointer transition-all flex items-center gap-1.5"
                        style={selected
                          ? { background: "#D9F7E9", color: "#0B6E4F", border: "1px solid rgba(35,210,131,0.3)" }
                          : { background: "#f1f5f9", color: "#6b6375", border: "1px solid #e2e8f0" }}>
                        {selected && <Check className="h-3 w-3" />}
                        {role}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <span className="text-[13px] font-semibold" style={{ color: "#08060d" }}>Active on platform</span>
                <button onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))} className="cursor-pointer">
                  {form.is_active
                    ? <ToggleRight className="h-6 w-6" style={{ color: "#23D283" }} />
                    : <ToggleLeft className="h-6 w-6" style={{ color: "#6B7280" }} />}
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: "1px solid oklch(0.922 0 0)" }}>
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-xl text-[13px] font-semibold cursor-pointer" style={{ background: "#f1f5f9", color: "#6b6375", border: "1px solid #e2e8f0" }}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="px-5 py-2 rounded-xl text-[13px] font-bold cursor-pointer disabled:opacity-60 flex items-center gap-2" style={{ background: "#23D283", color: "#fff" }}>
                {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                {saving ? "Saving…" : editTarget ? "Save Changes" : "Create Type"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(8,6,13,0.5)", backdropFilter: "blur(4px)" }}>
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="h-12 w-12 rounded-2xl flex items-center justify-center mx-auto" style={{ background: "rgba(239,68,68,0.08)" }}>
              <Trash2 className="h-6 w-6" style={{ color: "#ef4444" }} />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-[16px] font-black" style={{ color: "#08060d" }}>Delete "{deleteTarget.label}"?</h3>
              <p className="text-[13px]" style={{ color: "#6B7280" }}>This action cannot be undone. Property listings using this type may be affected.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold cursor-pointer" style={{ background: "#f1f5f9", color: "#6b6375", border: "1px solid #e2e8f0" }}>
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2.5 rounded-xl text-[13px] font-bold cursor-pointer disabled:opacity-60" style={{ background: "#ef4444", color: "#fff" }}>
                {deleting ? "Deleting…" : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
