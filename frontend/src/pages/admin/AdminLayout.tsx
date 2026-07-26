import React, { useState } from "react";
import { Link, useNavigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  Building2,
  Users,
  ShieldAlert,
  Settings,
  HelpCircle,
  Bell,
  LogOut,
  Search,
  ChevronDown,
  Sparkles,
  Layers,
  MapPin
} from "lucide-react";
import { toast } from "sonner";

export const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const handleLogout = () => {
    logout();
    toast.success("Admin signed out successfully.");
    navigate("/admin-platform/login", { replace: true });
  };

  const isActive = (path: string) => {
    if (path === "/admin-platform/dashboard" && (location.pathname === "/admin-platform" || location.pathname === "/admin-platform/dashboard")) {
      return true;
    }
    return location.pathname.startsWith(path) && path !== "/admin-platform/dashboard";
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] p-3 sm:p-5 font-sans text-slate-800 flex flex-col">
      
      {/* Outer App Window Frame */}
      <div className="bg-slate-100/70 border border-slate-200/80 rounded-3xl p-3 sm:p-4 flex-1 flex flex-col lg:flex-row gap-4 shadow-xs">
        
        {/* Left Navigation Sidebar */}
        <aside className="bg-white border border-slate-200/70 rounded-2xl p-4 flex flex-col justify-between w-full lg:w-64 shrink-0 shadow-xs">
          
          <div className="space-y-5">
            {/* App Brand Header */}
            <div className="flex items-center justify-between pb-1 px-1">
              <Link to="/admin-platform/dashboard" className="flex items-center gap-2.5">
                <div className="bg-[#086942] text-white p-2 rounded-xl flex items-center justify-center shadow-xs">
                  <img src="/logo.png" alt="Letsellr Logo" className="h-5 w-5 brightness-200" />
                </div>
                <span className="text-lg font-black text-slate-900 tracking-tight">
                  Letsellr <span className="text-[#086942]">Admin</span>
                </span>
              </Link>
            </div>

            {/* Quick Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search... ⌘K"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100/70 border border-slate-200/60 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 font-medium placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#086942]/20 focus:border-[#086942] transition-all"
              />
            </div>

            {/* Navigation Groups */}
            <nav className="space-y-4 text-left">
              
              {/* Group 1: MAIN MENU */}
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 block mb-1.5">
                  Main Menu
                </span>

                <Link
                  to="/admin-platform/dashboard"
                  className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
                    isActive("/admin-platform/dashboard")
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <LayoutDashboard className="h-4 w-4 shrink-0" />
                    <span>Dashboard</span>
                  </div>
                </Link>

                <Link
                  to="/admin-platform/properties"
                  className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive("/admin-platform/properties")
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Building2 className="h-4 w-4 shrink-0" />
                    <span>Properties & Queue</span>
                  </div>
                  <span className="bg-emerald-100 text-[#086942] font-black text-[10px] px-2 py-0.5 rounded-full">
                    8
                  </span>
                </Link>

                <Link
                  to="/admin-platform/users"
                  className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive("/admin-platform/users")
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Users className="h-4 w-4 shrink-0" />
                    <span>Users & Agencies</span>
                  </div>
                </Link>
              </div>

              {/* Group 2: MODERATION */}
              <div className="space-y-1 pt-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 block mb-1.5">
                  Moderation
                </span>

                <Link
                  to="/admin-platform/reports"
                  className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive("/admin-platform/reports")
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldAlert className="h-4 w-4 shrink-0" />
                    <span>Reports & Flags</span>
                  </div>
                </Link>

                <Link
                  to="/admin-platform/categories"
                  className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive("/admin-platform/categories")
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Layers className="h-4 w-4 shrink-0" />
                    <span>Categories & Specs</span>
                  </div>
                </Link>

                <Link
                  to="/admin-platform/locations"
                  className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive("/admin-platform/locations")
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span>Location Management</span>
                  </div>
                </Link>
              </div>

              {/* Group 3: GENERAL */}
              <div className="space-y-1 pt-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 block mb-1.5">
                  General
                </span>

                <Link
                  to="/admin-platform/settings"
                  className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive("/admin-platform/settings")
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Settings className="h-4 w-4 shrink-0" />
                    <span>Settings</span>
                  </div>
                </Link>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  <span>Log out</span>
                </button>
              </div>

            </nav>
          </div>

          {/* Sidebar Bottom Banner Card */}
          <div className="mt-6 bg-slate-50 border border-slate-200/60 rounded-2xl p-3.5 space-y-2.5 text-left">
            <div className="flex items-center gap-2 text-xs font-extrabold text-slate-900">
              <Sparkles className="h-4 w-4 text-[#086942]" />
              <span>Admin System Active</span>
            </div>
            <p className="text-[11px] font-medium text-slate-500 leading-tight">
              Higher productivity with full platform moderation controls.
            </p>
            <div className="pt-1 flex items-center gap-2">
              <span className="bg-[#086942] text-white font-extrabold text-[10px] px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-2xs">
                🟢 Live v2.4
              </span>
              <span className="text-[10px] font-bold text-slate-400">All services ok</span>
            </div>
          </div>

        </aside>

        {/* Main Content Area */}
        <main className="flex-1 bg-white border border-slate-200/70 rounded-2xl p-5 sm:p-7 flex flex-col shadow-xs overflow-x-hidden">
          
          {/* Top Bar Header Header */}
          <header className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            
            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 text-left">
              <span>Admin Platform</span>
              <span>/</span>
              <span className="font-extrabold text-slate-900 capitalize">
                {location.pathname.split("/")[2] || "Dashboard"}
              </span>
            </div>

            {/* Right Header Utilities */}
            <div className="flex items-center justify-end gap-3">
              <button className="h-9 w-9 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-full flex items-center justify-center text-slate-600 transition-colors cursor-pointer">
                <HelpCircle className="h-4 w-4" />
              </button>

              <button className="h-9 w-9 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-full flex items-center justify-center text-slate-600 transition-colors relative cursor-pointer">
                <Bell className="h-4 w-4" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-[#086942] rounded-full ring-2 ring-white" />
              </button>

              {/* Admin Profile Pill */}
              <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200/60 rounded-full pl-1.5 pr-3 py-1">
                <div className="h-7 w-7 rounded-full bg-[#086942] text-white flex items-center justify-center font-black text-xs">
                  {user?.name ? user.name[0].toUpperCase() : "A"}
                </div>
                <div className="text-left hidden sm:block">
                  <span className="text-xs font-extrabold text-slate-900 block leading-tight">
                    {user?.name || "Administrator"}
                  </span>
                  <span className="text-[10px] font-bold text-[#086942] uppercase block leading-tight">
                    Super Admin
                  </span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 ml-1" />
              </div>

              {/* Status Green CTA Button */}
              <button className="bg-[#086942] hover:bg-[#065334] text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer">
                <span>System Status</span>
                <span className="bg-emerald-300/30 text-emerald-100 text-[10px] px-1.5 py-0.5 rounded-full font-black">
                  ONLINE
                </span>
              </button>
            </div>

          </header>

          {/* Dynamic Nested Page Content */}
          <div className="pt-6 flex-1 text-left">
            <Outlet />
          </div>

        </main>

      </div>
    </div>
  );
};
