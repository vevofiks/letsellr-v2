import React, { useState } from "react";
import { 
  User, 
  Building, 
  ShieldCheck, 
  Lock, 
  Bell, 
  LogOut, 
  Save
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { OwnerNavbar } from "@/components/OwnerNavbar";
import { toast } from "sonner";
import { api } from "@/lib/api";

export const OwnerSettingsPage: React.FC = () => {
  const { user, logout } = useAuth();

  const isAgency = user?.role === "agency";

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [agencyName, setAgencyName] = useState((user as any)?.agency_display_name || "");
  
  // Password change state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Notification Toggles
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [whatsappAlerts, setWhatsappAlerts] = useState(true);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      await api.put("/api/users/me", {
        name,
        phone,
        agency_display_name: isAgency ? agencyName : undefined,
      });
      toast.success("Profile updated successfully!");
    } catch (err: any) {
      console.error("Profile update failed", err);
      toast.error(err.response?.data?.detail || "Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      toast.error("Please fill in current and new password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New password and confirm password do not match.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    try {
      setChangingPassword(true);
      await api.post("/api/auth/change-password", {
        old_password: oldPassword,
        new_password: newPassword,
      });
      toast.success("Password changed successfully!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      console.error("Password change failed", err);
      toast.error(err.response?.data?.detail || "Failed to change password.");
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col font-sans pb-12">
      <OwnerNavbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Header */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs space-y-2">
          <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-brand-green px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
            {isAgency ? <Building className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
            {isAgency ? "Agency Account" : "Self-Listing Owner Account"}
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight my-0">
            Account Settings & Business Profile
          </h1>
          <p className="text-xs text-slate-500 font-semibold">
            Manage your profile details, contact preferences, and security settings.
          </p>
        </div>

        {/* Verification Status Banner */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-emerald-50 text-brand-green flex items-center justify-center shrink-0">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 my-0">Business Verification Status</h3>
              <p className="text-xs text-slate-500 font-semibold">Verified Partner Account</p>
            </div>
          </div>
          <span className="bg-emerald-50 text-emerald-700 font-black text-xs px-3 py-1 rounded-full border border-emerald-200">
            Verified Active
          </span>
        </div>

        {/* Personal / Agency Information Form */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs space-y-5">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 my-0">
            <User className="h-5 w-5 text-brand-green" /> Profile & Contact Details
          </h2>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Email Address (Read-only)</label>
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-500 cursor-not-allowed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Contact Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900"
                  required
                />
              </div>

              {isAgency && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Agency Display Name</label>
                  <input
                    type="text"
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900"
                    placeholder="e.g. Skyline Real Estate Agency"
                  />
                </div>
              )}

            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingProfile}
                className="bg-brand-green hover:bg-brand-green-hover text-white font-extrabold text-xs px-6 py-2.5 rounded-full flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                <Save className="h-4 w-4" /> {savingProfile ? "Saving..." : "Save Profile Details"}
              </button>
            </div>
          </form>
        </div>

        {/* Password Security Form */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs space-y-5">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 my-0">
            <Lock className="h-5 w-5 text-brand-green" /> Security & Password
          </h2>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Current Password</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                />
              </div>

            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={changingPassword}
                className="bg-slate-900 hover:bg-black text-white font-extrabold text-xs px-6 py-2.5 rounded-full flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                <Lock className="h-4 w-4" /> {changingPassword ? "Updating..." : "Update Password"}
              </button>
            </div>
          </form>
        </div>

        {/* Notification Preferences */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 my-0">
            <Bell className="h-5 w-5 text-brand-green" /> Notification Preferences
          </h2>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer">
              <div>
                <span className="text-xs font-bold text-slate-900 block">WhatsApp Instant Lead Alerts</span>
                <span className="text-[10px] text-slate-500 font-semibold">Receive direct WhatsApp notifications when a buyer requests an enquiry link.</span>
              </div>
              <input
                type="checkbox"
                checked={whatsappAlerts}
                onChange={(e) => setWhatsappAlerts(e.target.checked)}
                className="h-4 w-4 accent-brand-green rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer">
              <div>
                <span className="text-xs font-bold text-slate-900 block">Listing Approval Email Summaries</span>
                <span className="text-[10px] text-slate-500 font-semibold">Receive email notifications when admin approves or provides review feedback.</span>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="h-4 w-4 accent-brand-green rounded cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Logout Action */}
        <div className="pt-4 flex justify-center">
          <button
            onClick={() => { logout(); }}
            className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold text-xs px-8 py-3 rounded-full flex items-center gap-2 border border-rose-200 transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" /> Sign Out of Partner Account
          </button>
        </div>

      </main>
    </div>
  );
};
