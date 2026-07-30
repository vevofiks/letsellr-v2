import React, { useState, useEffect, useRef } from "react";
import {
  User,
  Building2,
  Lock,
  LogOut,
  Save,
  Camera,
  BadgeCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { OwnerNavbar } from "@/components/OwnerNavbar";
import { toast } from "sonner";
import { api } from "@/lib/api";

export const OwnerSettingsPage: React.FC = () => {
  const { user, logout } = useAuth();

  const isAgency = user?.role === "agency";
  const isVerified = user?.verification_status === "verified";

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [agencyName, setAgencyName] = useState(
    (user as any)?.agency_display_name || ""
  );

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [agencyBanner, setAgencyBanner] = useState("");
  const [agencyLogo, setAgencyLogo] = useState("");
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user?.id) {
      const b = localStorage.getItem(`agency_banner_${user.id}`);
      const l = localStorage.getItem(`agency_logo_${user.id}`);
      if (b) setAgencyBanner(b);
      if (l) setAgencyLogo(l);
    }
  }, [user?.id]);

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      toast.error("Banner must be under 3 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl && user?.id) {
        localStorage.setItem(`agency_banner_${user.id}`, dataUrl);
        setAgencyBanner(dataUrl);
        toast.success("Banner updated!");
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1 * 1024 * 1024) {
      toast.error("Logo must be under 1 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl && user?.id) {
        localStorage.setItem(`agency_logo_${user.id}`, dataUrl);
        setAgencyLogo(dataUrl);
        window.dispatchEvent(new Event("profile-updated"));
        toast.success("Logo updated!");
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      await api.put("/api/users/me", {
        name,
        phone,
        agency_display_name: isAgency ? agencyName : undefined,
      });
      toast.success("Profile updated!");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      toast.error("Fill in current and new password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
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
      toast.success("Password changed!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to change password.");
    } finally {
      setChangingPassword(false);
    }
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
    : "?";

  const displayName = isAgency
    ? (user as any)?.agency_display_name || agencyName || user?.name || "Agency"
    : user?.name || "Your Name";

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col font-sans pb-20 md:pb-12 text-slate-900">
      <OwnerNavbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ── Profile Hero Card ─────────────────────────────────────────── */}
        <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden text-left">

          {/* Hidden file inputs */}
          <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
          <input ref={logoInputRef}   type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />

          {/* Banner */}
          <div className="relative h-44 sm:h-52 group/banner">
            {agencyBanner ? (
              <img src={agencyBanner} alt="Banner" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-linear-to-r from-[#014645] to-emerald-600 relative">
                <div className="absolute inset-0 opacity-[0.07] bg-[radial-gradient(#fff_1px,transparent_1px)] bg-size-[20px_20px]" />
              </div>
            )}
            <button
              type="button"
              onClick={() => bannerInputRef.current?.click()}
              className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/60 hover:bg-black/80 text-white text-[10px] font-extrabold px-3 py-1.5 rounded-lg transition-all cursor-pointer opacity-0 group-hover/banner:opacity-100 z-30 shadow-sm"
            >
              <Camera className="h-3.5 w-3.5" />
              {agencyBanner ? "Change Banner" : "Add Banner"}
            </button>
          </div>

          {/* Identity section — logo uses negative-mt to overlap banner */}
          <div className="px-6 pb-6 relative z-10">
            {/* Logo row */}
            <div className="flex items-end justify-between relative z-20 pointer-events-none" style={{ marginTop: -44 }}>
              {/* Logo avatar — relative z-20 ensures it stays on top of banner */}
              <div
                onClick={() => logoInputRef.current?.click()}
                className="relative z-20 cursor-pointer group/logo shrink-0 pointer-events-auto"
                style={{ width: 96, height: 96 }}
              >
                <div className="h-full w-full rounded-xl border-4 border-white shadow-md overflow-hidden bg-slate-900 flex items-center justify-center">
                  {agencyLogo ? (
                    <img src={agencyLogo} alt="Logo" className="h-full w-full object-cover" />
                  ) : isAgency ? (
                    <Building2 className="h-8 w-8 text-white/80" />
                  ) : (
                    <span className="text-white font-black text-xl">{initials}</span>
                  )}
                </div>
                <div className="absolute inset-0 rounded-xl bg-black/40 flex items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-opacity border-4 border-white z-30">
                  <Camera className="h-5 w-5 text-white" />
                </div>
              </div>

              {/* Verified / unverified pill */}
              {isVerified ? (
                <span className="mb-1 flex items-center gap-1.5 bg-emerald-50 text-brand-green border border-emerald-200/80 rounded-lg px-3 py-1 text-xs font-extrabold pointer-events-auto">
                  <BadgeCheck className="h-4 w-4" /> Verified
                </span>
              ) : (
                <span className="mb-1 flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200/80 rounded-lg px-3 py-1 text-xs font-extrabold pointer-events-auto">
                  Not Verified
                </span>
              )}
            </div>

            {/* Name + badge */}
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight my-0">
                {displayName}
              </h1>
              {isVerified && (
                <BadgeCheck className="h-5 w-5 text-brand-green shrink-0" strokeWidth={2.5} />
              )}
            </div>

            {/* Owner name subtitle for agencies */}
            {isAgency && (
              <p className="text-xs text-slate-500 font-semibold mt-0.5">{user?.name}</p>
            )}

            {/* Role + contact meta */}
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-lg">
                {isAgency ? <Building2 className="h-3 w-3" /> : <User className="h-3 w-3" />}
                {isAgency ? "Agency" : "Owner"}
              </span>
              <span className="text-xs text-slate-500 font-semibold">{user?.email}</span>
              {user?.phone && (
                <span className="text-xs text-slate-500 font-semibold">{user.phone}</span>
              )}
            </div>
          </div>
        </div>

        {/* ── Profile Details Form ──────────────────────────────────────── */}
        <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs p-5 space-y-4 text-left">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest my-0 pb-3 border-b border-slate-100">
            Profile Details
          </h2>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-brand-green focus:border-brand-green transition-all"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700">Email</label>
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="w-full bg-slate-100/80 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-400 font-medium cursor-not-allowed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-brand-green focus:border-brand-green transition-all"
                  required
                />
              </div>

              {isAgency && (
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700">Agency Display Name</label>
                  <input
                    type="text"
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    placeholder="e.g. Skyline Real Estate"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-brand-green focus:border-brand-green transition-all"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingProfile}
                className="bg-brand-green hover:bg-brand-green-hover text-white font-extrabold text-xs px-4 py-2 rounded-lg flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-2xs h-9"
              >
                <Save className="h-3.5 w-3.5" />
                {savingProfile ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </form>
        </div>

        {/* ── Security & Password ───────────────────────────────────────── */}
        <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs p-5 space-y-4 text-left">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest my-0 pb-3 border-b border-slate-100">
            Security & Password
          </h2>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700">Current Password</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-brand-green focus:border-brand-green transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-brand-green focus:border-brand-green transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-brand-green focus:border-brand-green transition-all"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={changingPassword}
                className="bg-slate-900 hover:bg-black text-white font-extrabold text-xs px-4 py-2 rounded-lg flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-2xs h-9"
              >
                <Lock className="h-3.5 w-3.5" />
                {changingPassword ? "Updating…" : "Update Password"}
              </button>
            </div>
          </form>
        </div>

        {/* ── Sign Out ─────────────────────────────────────────────────── */}
        <div className="flex justify-start">
          <button
            onClick={() => logout()}
            className="text-rose-500 hover:text-rose-600 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>

      </main>
    </div>
  );
};
