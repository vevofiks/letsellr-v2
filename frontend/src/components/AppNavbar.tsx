/**
 * AppNavbar — Single reusable navigation bar for all pages.
 *
 * Behaviour:
 *   • Logged OUT → profile icon shows auth dropdown (Register / Sign In / Owner-Agency)
 *   • Logged IN  → profile icon shows avatar with initials + dropdown (My Profile / Sign Out)
 *
 * Props:
 *   • title?        — optional page label shown next to logo (e.g. "Partner Dashboard")
 *   • logoHref?     — where the logo link goes (defaults to "/" which redirects by role)
 */

import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, UserPlus, User, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ProfileModal } from "@/components/ProfileModal";
import { AuthModal, type AuthModalMode } from "@/components/AuthModal";

interface AppNavbarProps {
  title?: string;
  logoHref?: string;
}

export const AppNavbar: React.FC<AppNavbarProps> = ({ logoHref = "/" }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [authModal, setAuthModal] = useState<{ open: boolean; mode: AuthModalMode }>({
    open: false,
    mode: "login",
  });

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Avatar initials from name
  const initials = user?.name
    ? user.name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
    : "?";

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

          {/* ── Logo + optional title ─────────────────────────────────── */}
          <div className="flex items-center gap-8">
            <Link to={logoHref} className="flex items-center gap-2 group">
              <div className="flex items-center justify-center transition-transform group-hover:scale-105">
                    <img
                      src="/logo.png"
                      alt="Letsellr Logo"
                      className="h-9 w-auto object-contain shrink-0 drop-shadow-sm"
                    />
              </div>
              <span className="text-xl font-black tracking-tight text-brand-green">Letsellr</span>
            </Link>
          </div>

          {/* ── Right: profile button + dropdown ─────────────────────── */}
          <div className="relative" ref={dropdownRef}>

            {/* ── LOGGED IN: avatar button ──────────────────────────── */}
            {user ? (
              <button
                id="profile-icon-btn"
                onClick={() => setDropdownOpen((o) => !o)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100/50 hover:bg-slate-200/60 backdrop-blur-md border border-slate-200 text-slate-600 hover:text-slate-900 text-xs font-black transition-all shadow-sm cursor-pointer select-none"
                title={user.name}
              >
                {initials}
              </button>
            ) : (
              /* ── LOGGED OUT: user icon button ──────────────────────── */
              <button
                id="profile-icon-btn"
                onClick={() => setDropdownOpen((o) => !o)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100/50 hover:bg-slate-200/60 backdrop-blur-md border border-slate-200 text-slate-500 hover:text-slate-800 transition-all shadow-sm cursor-pointer"
                title="Account"
              >
                <User className="h-4 w-4" />
              </button>
            )}

            {/* ── Dropdown ─────────────────────────────────────────── */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-white shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-3 duration-150">

                {user ? (
                  /* ── LOGGED IN dropdown ──────────────────────────── */
                  <>
                    {/* User card */}
                    <div className="px-4 pt-2 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-green text-white text-xs font-black shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                            {user.role} account
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* My Profile */}
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        setProfileModalOpen(true);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-700 shrink-0">
                        <User className="h-3.5 w-3.5" />
                      </span>
                      <div>
                        <p className="font-bold text-slate-800">My Profile</p>
                        <p className="text-[10px] text-slate-400 font-normal mt-0.5">View &amp; edit your details</p>
                      </div>
                    </button>

                    {/* Sign Out */}
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        handleLogout();
                      }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-xs font-semibold text-slate-700 hover:bg-red-50 hover:text-red-600 transition-colors text-left group hover:rounded-b-[14px]"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 group-hover:bg-red-100 text-slate-700 group-hover:text-red-600 shrink-0">
                        <LogOut className="h-3.5 w-3.5" />
                      </span>
                      <div>
                        <p className="font-bold text-slate-800 group-hover:text-red-700">Sign Out</p>
                        <p className="text-[10px] text-slate-400 font-normal mt-0.5 group-hover:text-red-500/80">End your current session</p>
                      </div>
                    </button>
                  </>
                ) : (
                  /* ── LOGGED OUT dropdown ─────────────────────────── */
                  <>
                    <p className="px-4 pt-1 pb-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      Account
                    </p>

                    {/* Register as Client */}
                    <button
                      id="dropdown-register-client"
                      onClick={() => {
                        setDropdownOpen(false);
                        setAuthModal({ open: true, mode: "register-client" });
                      }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-700 shrink-0">
                        <UserPlus className="h-3.5 w-3.5" />
                      </span>
                      <div>
                        <p className="font-bold text-slate-800">Register / login</p>
                        <p className="text-[10px] text-slate-400 font-normal mt-0.5">Browse &amp; find properties</p>
                      </div>
                    </button>

                    <div className="border-t border-slate-100 my-1 mx-4" />

                    {/* Owner / Agency */}
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        navigate('/register/type')
                      }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:rounded-b-md hover:text-[#1b3b2b] transition-all text-left bg-slate-50/30"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1b3b2b] text-white shrink-0 shadow-sm">
                        <LayoutDashboard className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="font-bold text-slate-900">Owner / Agency</p>
                        <p className="text-[10px] text-slate-500 font-medium mt-0.5">Dashboard login &amp; listing</p>
                      </div>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Profile modal (logged-in only) */}
      {profileModalOpen && (
        <ProfileModal onClose={() => setProfileModalOpen(false)} />
      )}

      {/* Auth modal (logged-out only) */}
      {authModal.open && (
        <AuthModal
          initialMode={authModal.mode}
          onClose={() => setAuthModal({ open: false, mode: "login" })}
        />
      )}
    </>
  );
};
