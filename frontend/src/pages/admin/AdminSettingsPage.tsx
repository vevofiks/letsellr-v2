import React, { useState, useEffect } from "react";
import {
  Settings, Bell, BellOff, Users, Building2, KeyRound, Mail,
  RefreshCw, Eye, EyeOff, ShieldCheck, MessageCircle, Phone, Plus, X,
} from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils";
import {
  adminService,
  type AdminNotificationSettings,
  type AdminAccount,
} from "@/services/adminService";
import { Badge } from "@/components/ui/badge";

type ToggleKey = "notify_pending_users" | "notify_pending_properties";

const Toggle: React.FC<{
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
  label: string;
}> = ({ checked, disabled, onChange, label }) => (
  <div className="flex items-center gap-2 shrink-0">
    <span
      className={`text-[10px] font-black uppercase tracking-wider w-6 text-right ${
        checked ? "text-[#014645]" : "text-slate-400"
      }`}
    >
      {checked ? "On" : "Off"}
    </span>
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className={`flex h-6 w-11 items-center rounded-full px-0.5 border transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
        checked
          ? "justify-end bg-[#014645] border-[#014645]"
          : "justify-start bg-slate-200 border-slate-300"
      }`}
    >
      {/* Laid out by flex rather than translated — the knob is always drawn. */}
      <span className="h-5 w-5 rounded-full bg-white border border-slate-300 shadow-2xs" />
    </button>
  </div>
);

export const AdminSettingsPage: React.FC = () => {
  const [notif, setNotif] = useState<AdminNotificationSettings | null>(null);
  const [account, setAccount] = useState<AdminAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingKey, setSavingKey] = useState<ToggleKey | null>(null);
  const [newNumber, setNewNumber] = useState("");
  const [savingRecipients, setSavingRecipients] = useState(false);

  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [savingAccount, setSavingAccount] = useState(false);

  const load = async (manual = false) => {
    try {
      if (manual) setRefreshing(true); else setLoading(true);
      const [n, a] = await Promise.all([
        adminService.getNotificationSettings(),
        adminService.getAdminAccount(),
      ]);
      setNotif(n);
      setAccount(a);
      setEmail(a.email || "");
    } catch (e: any) {
      toast.error(getErrorMessage(e, "Failed to load settings."));
    } finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  const handleToggle = async (key: ToggleKey) => {
    if (!notif) return;
    const next = !notif[key];
    // Optimistic — rolled back below if the request fails.
    setNotif({ ...notif, [key]: next });
    try {
      setSavingKey(key);
      const updated = await adminService.updateNotificationSettings({ [key]: next });
      setNotif(updated);
      const what = key === "notify_pending_users" ? "Owner/agency" : "Property";
      toast.success(`${what} alerts turned ${next ? "on" : "off"}.`);
    } catch (e: any) {
      setNotif({ ...notif, [key]: !next });
      toast.error(getErrorMessage(e, "Failed to update setting."));
    } finally { setSavingKey(null); }
  };

  const saveRecipients = async (numbers: string[], successMsg: string) => {
    try {
      setSavingRecipients(true);
      const updated = await adminService.updateNotificationSettings({
        whatsapp_recipients: numbers,
      });
      setNotif(updated);
      toast.success(successMsg);
      return true;
    } catch (e: any) {
      toast.error(getErrorMessage(e, "Failed to update recipients."));
      return false;
    } finally { setSavingRecipients(false); }
  };

  const handleAddRecipient = async () => {
    const entry = newNumber.trim();
    if (!entry) return;
    // The server normalises and rejects malformed numbers; this only catches typos early.
    if (entry.replace(/\D/g, "").length < 10) {
      toast.error("Enter at least 10 digits.");
      return;
    }
    // An empty list means "server default", so start from what's shown.
    const current = notif?.whatsapp_recipients || [];
    if (await saveRecipients([...current, entry], `${entry} added.`)) setNewNumber("");
  };

  const handleRemoveRecipient = async (number: string) => {
    const remaining = (notif?.whatsapp_recipients || []).filter((n) => n !== number);
    await saveRecipients(
      remaining,
      remaining.length
        ? `${number} removed.`
        : `${number} removed - falling back to the server default.`
    );
  };

  const emailChanged = !!account && email.trim().toLowerCase() !== (account.email || "").toLowerCase();
  const wantsPasswordChange = !!newPassword || !!confirmPassword;

  const handleSaveAccount = async () => {
    if (!emailChanged && !wantsPasswordChange) {
      toast.error("Change the email or set a new password first.");
      return;
    }
    if (!currentPassword) {
      toast.error("Enter your current password to confirm.");
      return;
    }
    if (wantsPasswordChange) {
      if (newPassword.length < 8) {
        toast.error("New password must be at least 8 characters.");
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error("New passwords do not match.");
        return;
      }
    }

    try {
      setSavingAccount(true);
      const updated = await adminService.updateAdminAccount({
        current_password: currentPassword,
        new_email: emailChanged ? email.trim() : undefined,
        new_password: wantsPasswordChange ? newPassword : undefined,
      });
      setAccount(updated);
      setEmail(updated.email || "");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success(
        wantsPasswordChange && emailChanged
          ? "Email and password updated. Use them at your next sign-in."
          : wantsPasswordChange
          ? "Password updated. Use it at your next sign-in."
          : "Login email updated."
      );
    } catch (e: any) {
      toast.error(getErrorMessage(e, "Failed to update credentials."));
    } finally { setSavingAccount(false); }
  };

  const inputClass =
    "w-full bg-slate-50 border border-slate-200/80 rounded-lg px-3.5 py-2 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#014645] transition-all";

  if (loading) {
    return (
      <div className="p-12 text-center space-y-3">
        <div className="h-7 w-7 border-2 border-[#014645] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loading Settings...</p>
      </div>
    );
  }

  const activeAlerts =
    (notif?.notify_pending_users ? 1 : 0) + (notif?.notify_pending_properties ? 1 : 0);

  return (
    <div className="space-y-6 text-left font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight my-0">
              Settings
            </h1>
            <Badge variant="secondary" className="text-xs font-black px-2.5 py-0.5 rounded-md">
              {activeAlerts}/2 Alerts On
            </Badge>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Control your WhatsApp approval alerts and your administrator sign-in details.
          </p>
        </div>
        <button onClick={() => load(true)} disabled={refreshing}
          className="bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs px-3.5 py-2 rounded-lg border border-slate-200/80 shadow-2xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 self-start">
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-[#014645]" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* ── WhatsApp Notifications ── */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200/80 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-50 text-[#014645] flex items-center justify-center shrink-0 border border-emerald-200/60">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-black text-slate-900 my-0">WhatsApp Alerts</h2>
            <p className="text-[11px] text-slate-500 font-medium my-0 mt-0.5">
              Sent the moment something lands in an approval queue.
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {/* Owner / Agency signups */}
          <div className="p-4 sm:p-5 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="h-9 w-9 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 border border-slate-200">
                <Users className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-slate-900 my-0">
                  Pending owners &amp; agencies
                </p>
                <p className="text-[11px] text-slate-500 font-medium my-0 mt-1 leading-relaxed">
                  Alerts you when a new owner or agency signs up and is waiting for approval,
                  with a link to the Users &amp; Agencies queue.
                </p>
              </div>
            </div>
            <Toggle
              checked={!!notif?.notify_pending_users}
              disabled={savingKey === "notify_pending_users"}
              onChange={() => handleToggle("notify_pending_users")}
              label="Toggle pending owner and agency alerts"
            />
          </div>

          {/* Property listings */}
          <div className="p-4 sm:p-5 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="h-9 w-9 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 border border-slate-200">
                <Building2 className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-slate-900 my-0">
                  Pending property listings
                </p>
                <p className="text-[11px] text-slate-500 font-medium my-0 mt-1 leading-relaxed">
                  Alerts you when a listing enters the review queue, with a link to the
                  Properties queue.
                </p>
              </div>
            </div>
            <Toggle
              checked={!!notif?.notify_pending_properties}
              disabled={savingKey === "notify_pending_properties"}
              onChange={() => handleToggle("notify_pending_properties")}
              label="Toggle pending property alerts"
            />
          </div>
        </div>

        {/* Recipients */}
        <div className="px-4 sm:px-5 py-4 bg-slate-50/70 border-t border-slate-200/80 space-y-3">
          <div className="flex items-center gap-2">
            {activeAlerts > 0 ? (
              <Bell className="h-3.5 w-3.5 text-[#014645] shrink-0" />
            ) : (
              <BellOff className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            )}
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Delivered to
            </span>
            {notif?.using_server_default && (
              <Badge variant="outline" className="text-[9.5px] font-black uppercase">
                Server default
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {notif?.whatsapp_recipients?.length ? (
              notif.whatsapp_recipients.map((n) => (
                <span
                  key={n}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-slate-200/80 pl-3 pr-1.5 py-1.5 shadow-2xs"
                >
                  <Phone className="h-3 w-3 text-slate-400" />
                  <span className="text-xs font-extrabold text-slate-900">{n}</span>
                  <button
                    onClick={() => handleRemoveRecipient(n)}
                    disabled={savingRecipients}
                    title={`Remove ${n}`}
                    className="h-5 w-5 rounded-md flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))
            ) : (
              <span className="text-[11px] font-semibold text-rose-600">
                No recipient configured - alerts cannot be delivered.
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <input
              value={newNumber}
              onChange={(e) => setNewNumber(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAddRecipient(); }}
              placeholder="Add a WhatsApp number, e.g. 98954 15718"
              className={`${inputClass} bg-white sm:max-w-xs`}
            />
            <button
              onClick={handleAddRecipient}
              disabled={savingRecipients || !newNumber.trim()}
              className="bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs px-3.5 py-2 rounded-lg border border-slate-200/80 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed self-start"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{savingRecipients ? "Saving…" : "Add Number"}</span>
            </button>
          </div>

          <p className="text-[10px] text-slate-400 font-semibold my-0">
            Indian numbers can be entered without the country code. Removing every number
            falls back to the server default - to stop alerts entirely, switch them off above.
          </p>
        </div>
      </div>

      {/* ── Admin Credentials ── */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200/80 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-50 text-[#014645] flex items-center justify-center shrink-0 border border-emerald-200/60">
            <KeyRound className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-black text-slate-900 my-0">Login Credentials</h2>
            <p className="text-[11px] text-slate-500 font-medium my-0 mt-0.5">
              The email and password you use at{" "}
              <span className="font-bold text-slate-600">/admin-platform/login</span>.
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-slate-400" /> Login email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@letsellr.in"
                className={inputClass}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-slate-400" /> Current password
              </label>
              <div className="relative">
                <input
                  type={showPasswords ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Required to save any change"
                  autoComplete="current-password"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title={showPasswords ? "Hide passwords" : "Show passwords"}
                >
                  {showPasswords ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700">
                New password <span className="text-slate-400 font-bold">(optional)</span>
              </label>
              <input
                type={showPasswords ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                autoComplete="new-password"
                className={inputClass}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700">Confirm new password</label>
              <input
                type={showPasswords ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter the new password"
                autoComplete="new-password"
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <p className="text-[11px] text-slate-500 font-medium my-0">
              Leave the password fields blank to change only the email.
            </p>
            <button
              onClick={handleSaveAccount}
              disabled={savingAccount || (!emailChanged && !wantsPasswordChange)}
              className="bg-[#014645] hover:bg-[#013534] text-white font-extrabold text-xs px-4 py-2 rounded-lg shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed self-start"
            >
              <Settings className={`h-4 w-4 ${savingAccount ? "animate-spin" : ""}`} />
              <span>{savingAccount ? "Saving…" : "Save Credentials"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
