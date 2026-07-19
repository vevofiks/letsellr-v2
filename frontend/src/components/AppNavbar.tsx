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
import { LogIn, LogOut, UserPlus, User } from "lucide-react";
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
    navigate("/register/type");
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
              <div className="p-1 rounded-lg bg-teal-50 group-hover:bg-teal-100 transition-colors">
                <svg
                  className="h-7 w-7 text-[#1b3b2b] shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 1 0 0-8c-2 0-4 1.33-6 4Z" />
                </svg>
              </div>
              <span className="text-xl font-black tracking-tight text-[#1b3b2b]">Letsellr</span>
            </Link>
          </div>

          {/* ── Right: profile button + dropdown ─────────────────────── */}
          <div className="relative" ref={dropdownRef}>

            {/* ── LOGGED IN: avatar button ──────────────────────────── */}
            {user ? (
              <button
                id="profile-icon-btn"
                onClick={() => setDropdownOpen((o) => !o)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1b3b2b] hover:bg-[#152e22] text-white text-xs font-black transition-all shadow-sm cursor-pointer select-none"
                title={user.name}
              >
                {initials}
              </button>
            ) : (
              /* ── LOGGED OUT: user icon button ──────────────────────── */
              <button
                id="profile-icon-btn"
                onClick={() => setDropdownOpen((o) => !o)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1b3b2b] hover:bg-[#152e22] text-white transition-all shadow-sm cursor-pointer"
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
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1b3b2b] text-white text-xs font-black shrink-0">
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
                      className="flex w-full items-center gap-3 px-4 py-3 text-xs font-semibold text-slate-700 hover:bg-teal-50 hover:text-[#1b3b2b] transition-colors text-left"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-100 text-[#1b3b2b] shrink-0">
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
                      className="flex w-full items-center gap-3 px-4 py-3 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-100 text-rose-600 shrink-0">
                        <LogOut className="h-3.5 w-3.5" />
                      </span>
                      <div>
                        <p className="font-bold">Sign Out</p>
                        <p className="text-[10px] text-rose-400 font-normal mt-0.5">End your current session</p>
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
                      className="flex w-full items-center gap-3 px-4 py-3 text-xs font-semibold text-slate-700 hover:bg-teal-50 hover:text-[#1b3b2b] transition-colors text-left"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-100 text-[#1b3b2b] shrink-0">
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
                      id="dropdown-login-owner"
                      onClick={() => {
                        setDropdownOpen(false);
                        navigate("/register/type");
                      }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-xs font-semibold text-slate-700 hover:bg-gray-50 hover:rounded-b-md hover:text-amber-700 transition-colors text-left"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-amber-600 shrink-0 text-[10px] font-black">
                        A
                      </span>
                      <div>
                        <p className="font-bold text-slate-800">Owner / Agency</p>
                        <p className="text-[10px] text-slate-400 font-normal mt-0.5">List &amp; manage properties</p>
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
