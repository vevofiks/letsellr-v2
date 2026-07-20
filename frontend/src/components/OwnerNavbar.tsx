import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Building2, 
  PlusCircle, 
  Settings, 
  LogOut, 
  User, 
  Building, 
  ChevronDown
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export const OwnerNavbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

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

  const initials = user?.name
    ? user.name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
    : "O";

  const isAgency = user?.role === "agency";
  const roleLabel = isAgency ? "Agency" : "Owner";

  const navLinks = [
    {
      label: "Dashboard",
      path: "/owner/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "My Properties",
      path: "/owner/properties",
      icon: Building2,
    },
  ];

  return (
    <>
      {/* Top Header Navbar */}
      <header className="sticky top-0 z-40 bg-white text-slate-900 border-b border-slate-100 shadow-xs backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
          
          {/* Left: Brand Logo & Workspace Tag */}
          <div className="flex items-center gap-2 sm:gap-6 min-w-0">
            <Link to="/owner/dashboard" className="flex items-center gap-2 sm:gap-2.5 group min-w-0">
              <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-brand-green flex items-center justify-center text-white font-black text-base sm:text-lg shadow-xs group-hover:bg-brand-green-hover transition-colors shrink-0">
                L
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-extrabold text-slate-900 text-base sm:text-lg tracking-tight leading-none truncate">
                  Letsellr
                </span>
                <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-brand-green mt-0.5 truncate">
                  {roleLabel} Workspace
                </span>
              </div>
            </Link>
          </div>

          {/* Center: Plain Text Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 h-full">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 text-xs font-extrabold transition-all duration-200 py-1.5 border-b-2 ${
                    isActive
                      ? "text-brand-green border-brand-green"
                      : "text-slate-600 hover:text-slate-900 border-transparent"
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-brand-green" : "text-slate-400"}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right: CTA Button & Profile Menu */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Add Listing CTA Button */}
            <Link
              to="/owner/properties/new"
              className="flex items-center gap-1.5 sm:gap-2 bg-brand-green hover:bg-brand-green-hover text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-black shadow-xs transition-all cursor-pointer whitespace-nowrap"
            >
              <PlusCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Post Property</span>
              <span className="sm:hidden">Post</span>
            </Link>

            {/* User Profile Menu */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-1.5 sm:gap-2 p-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer focus:outline-none"
              >
                <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center shadow-xs border border-slate-200 shrink-0">
                  {initials}
                </div>
                <div className="hidden lg:flex flex-col text-left pr-1">
                  <span className="text-xs font-extrabold text-slate-900 line-clamp-1 max-w-30">
                    {user?.name || "Partner User"}
                  </span>
                  <span className="text-[9px] font-bold text-brand-green uppercase tracking-wider">
                    {roleLabel}
                  </span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden sm:block" />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in-50 duration-150 text-slate-900">
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <p className="text-xs font-black text-slate-900 truncate">{user?.name}</p>
                    <p className="text-[10px] text-slate-400 font-semibold truncate mt-0.5">{user?.email}</p>
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-brand-green border border-emerald-100 rounded-md text-[10px] font-bold uppercase tracking-wider">
                      {isAgency ? <Building className="h-3 w-3" /> : <User className="h-3 w-3" />}
                      {roleLabel} Account
                    </div>
                  </div>

                  <div className="py-1">
                    <Link
                      to="/owner/settings"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    >
                      <Settings className="h-4 w-4 text-slate-400" />
                      Settings
                    </Link>
                  </div>

                  <div className="border-t border-slate-100 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
                    >
                      <LogOut className="h-4 w-4 text-rose-500" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </header>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 px-4 py-2 flex items-center justify-around shadow-2xl">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl text-[10px] font-black transition-all ${
                isActive 
                  ? "text-brand-green bg-emerald-50" 
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-brand-green" : "text-slate-400"}`} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
};

