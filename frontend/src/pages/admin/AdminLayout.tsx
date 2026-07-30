import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { adminService } from "@/services/adminService";
import {
  LayoutDashboard,
  Building2,
  Users,
  ShieldAlert,
  Settings,
  LogOut,
  Layers,
  MapPin,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  MessageSquareQuote,
  LayoutTemplate,
} from "lucide-react";
import { toast } from "sonner";

export const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [pendingPropertyCount, setPendingPropertyCount] = useState<number>(0);
  const [pendingKycCount, setPendingKycCount] = useState<number>(0);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile drawer toggle
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem("admin_sidebar_collapsed") === "true";
  });

  useEffect(() => {
    localStorage.setItem("admin_sidebar_collapsed", String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  useEffect(() => {
    adminService
      .getDashboardStats()
      .then((stats) => {
        setPendingPropertyCount(stats.pending_property_reviews || 0);
        setPendingKycCount(stats.pending_kyc_reviews || 0);
      })
      .catch((err) =>
        console.error("Failed to fetch sidebar pending stats:", err)
      );
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    toast.success("Admin signed out successfully.");
    navigate("/admin-platform/login", { replace: true });
  };

  const isActive = (path: string) => {
    if (
      path === "/admin-platform/dashboard" &&
      (location.pathname === "/admin-platform" ||
        location.pathname === "/admin-platform/dashboard")
    ) {
      return true;
    }
    return (
      location.pathname.startsWith(path) &&
      path !== "/admin-platform/dashboard"
    );
  };

  const currentSection =
    location.pathname.split("/")[2]?.replace(/-/g, " ") || "dashboard";

  const navItemClass = (path: string) => {
    const active = isActive(path);
    return `group flex items-center ${
      sidebarCollapsed ? "justify-center px-2" : "justify-between px-3.5"
    } py-2 rounded-md text-xs font-extrabold transition-all cursor-pointer ${
      active
        ? "bg-[#014645] text-white shadow-2xs"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    }`;
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 font-sans">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── LEFT SIDEBAR ── */}
      <aside
        className={`
          fixed lg:sticky top-0 inset-y-0 left-0 z-50
          flex flex-col shrink-0 h-screen
          bg-white border-r border-slate-200/80
          transition-all duration-200 ease-in-out
          ${sidebarCollapsed ? "lg:w-16" : "lg:w-56"}
          w-56
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Brand Logo */}
        <div className={`flex items-center ${sidebarCollapsed ? "lg:justify-center px-2" : "justify-between px-4"} py-4 border-b border-slate-100 shrink-0`}>
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-md bg-[#014645] flex items-center justify-center shadow-2xs shrink-0">
              <img
                src="/logo.png"
                alt="Letsellr"
                className="h-4.5 w-auto brightness-0 invert"
              />
            </div>
            {!sidebarCollapsed && (
              <div className="leading-tight text-left hidden lg:block">
                <span className="text-xs font-black tracking-tight text-slate-900 block">
                  Letsellr
                </span>
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-800 block">
                  Admin Platform
                </span>
              </div>
            )}
            <div className="leading-tight text-left lg:hidden">
              <span className="text-xs font-black tracking-tight text-slate-900 block">
                Letsellr
              </span>
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-800 block">
                Admin Platform
              </span>
            </div>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden h-8 w-8 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4 custom-scrollbar text-left">
          {/* OVERVIEW */}
          <div className="space-y-1">
            {!sidebarCollapsed && (
              <p className="text-[9.5px] font-black uppercase tracking-widest px-2.5 mb-1 text-slate-400">
                Overview
              </p>
            )}

            <Link
              to="/admin-platform/dashboard"
              className={navItemClass("/admin-platform/dashboard")}
              onClick={() => setSidebarOpen(false)}
              title="Dashboard"
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className="h-4 w-4 shrink-0" />
                {!sidebarCollapsed && <span>Dashboard</span>}
              </div>
            </Link>
          </div>

          {/* MANAGEMENT */}
          <div className="space-y-1">
            {!sidebarCollapsed && (
              <p className="text-[9.5px] font-black uppercase tracking-widest px-2.5 mb-1 text-slate-400">
                Management
              </p>
            )}

            <Link
              to="/admin-platform/properties"
              className={navItemClass("/admin-platform/properties")}
              onClick={() => setSidebarOpen(false)}
              title="Properties Queue"
            >
              <div className="flex items-center gap-2.5 relative">
                <Building2 className="h-4 w-4 shrink-0" />
                {!sidebarCollapsed && <span>Properties</span>}
                {sidebarCollapsed && pendingPropertyCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600" />
                  </span>
                )}
              </div>
              {!sidebarCollapsed && pendingPropertyCount > 0 && (
                <span className={`h-5 min-w-5 ${pendingPropertyCount < 10 ? "w-5" : "px-1.5"} rounded-full bg-rose-600 text-white font-black text-[10px] flex items-center justify-center shrink-0 leading-none shadow-2xs`}>
                  {pendingPropertyCount}
                </span>
              )}
            </Link>

            <Link
              to="/admin-platform/users"
              className={navItemClass("/admin-platform/users")}
              onClick={() => setSidebarOpen(false)}
              title="Users & Agencies"
            >
              <div className="flex items-center gap-2.5 relative">
                <Users className="h-4 w-4 shrink-0" />
                {!sidebarCollapsed && <span>Users & Agencies</span>}
                {sidebarCollapsed && pendingKycCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600" />
                  </span>
                )}
              </div>
              {!sidebarCollapsed && pendingKycCount > 0 && (
                <span className={`h-5 min-w-5 ${pendingKycCount < 10 ? "w-5" : "px-1.5"} rounded-full bg-rose-600 text-white font-black text-[10px] flex items-center justify-center shrink-0 leading-none shadow-2xs`}>
                  {pendingKycCount}
                </span>
              )}
            </Link>
          </div>

          {/* MODERATION */}
          <div className="space-y-1">
            {!sidebarCollapsed && (
              <p className="text-[9.5px] font-black uppercase tracking-widest px-3 mb-1 text-slate-400">
                Moderation
              </p>
            )}

            <Link
              to="/admin-platform/categories"
              className={navItemClass("/admin-platform/categories")}
              onClick={() => setSidebarOpen(false)}
              title="Categories & Specs"
            >
              <div className="flex items-center gap-2.5">
                <Layers className="h-4 w-4 shrink-0" />
                {!sidebarCollapsed && <span>Categories & Specs</span>}
              </div>
            </Link>

            <Link
              to="/admin-platform/locations"
              className={navItemClass("/admin-platform/locations")}
              onClick={() => setSidebarOpen(false)}
              title="Location Manager"
            >
              <div className="flex items-center gap-2.5">
                <MapPin className="h-4 w-4 shrink-0" />
                {!sidebarCollapsed && <span>Location Manager</span>}
              </div>
            </Link>

            <Link
              to="/admin-platform/reports"
              className={navItemClass("/admin-platform/reports")}
              onClick={() => setSidebarOpen(false)}
              title="Reports & Flags"
            >
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                {!sidebarCollapsed && <span>Reports & Flags</span>}
              </div>
            </Link>

            <Link
              to="/admin-platform/landing-page"
              className={navItemClass("/admin-platform/landing-page")}
              onClick={() => setSidebarOpen(false)}
              title="Landing Page"
            >
              <div className="flex items-center gap-2.5">
                <LayoutTemplate className="h-4 w-4 shrink-0" />
                {!sidebarCollapsed && <span>Landing Page</span>}
              </div>
            </Link>
          </div>

          {/* SYSTEM */}
          <div className="space-y-1">
            {!sidebarCollapsed && (
              <p className="text-[9.5px] font-black uppercase tracking-widest px-3 mb-1 text-slate-400">
                System
              </p>
            )}

            <Link
              to="/admin-platform/settings"
              className={navItemClass("/admin-platform/settings")}
              onClick={() => setSidebarOpen(false)}
              title="Settings"
            >
              <div className="flex items-center gap-2.5">
                <Settings className="h-4 w-4 shrink-0" />
                {!sidebarCollapsed && <span>Settings</span>}
              </div>
            </Link>
          </div>
        </nav>

        {/* Sidebar Footer Profile */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 shrink-0">
          <div className={`flex items-center ${sidebarCollapsed ? "justify-center" : "gap-2.5 p-2"} rounded-md bg-white border border-slate-200/60 shadow-2xs`}>
            <div className="h-8 w-8 rounded-md bg-[#014645] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
              {user?.name ? user.name[0].toUpperCase() : "A"}
            </div>
            {!sidebarCollapsed && (
              <>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-xs font-extrabold text-slate-900 truncate leading-tight my-0">
                    {user?.name || "Administrator"}
                  </p>
                  <p className="text-[9.5px] font-bold text-emerald-800 uppercase tracking-wider leading-tight my-0">
                    Super Admin
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  title="Log out"
                  className="h-7 w-7 rounded-md flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* ── RIGHT MAIN PANEL ── */}
      <div className="flex flex-col flex-1 min-w-0 min-h-screen">
        {/* Top Header Bar */}
        <header className="h-16 px-6 sm:px-8 bg-white border-b border-slate-200/80 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center gap-3">
            {/* Mobile Drawer Button */}
            <button
              className="lg:hidden h-9 w-9 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-4 w-4" />
            </button>

            {/* Desktop Collapse/Expand Sidebar Toggle Button */}
            <button
              className="hidden lg:flex h-9 w-9 rounded-md bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80 items-center justify-center cursor-pointer transition-colors"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </button>

            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 text-xs text-left">
              <span className="font-extrabold text-slate-400 uppercase tracking-wider text-[10px]">
                Admin Portal
              </span>
              <span className="text-slate-300">/</span>
              <span className="font-black text-slate-900 capitalize text-xs">
                {currentSection}
              </span>
            </div>
          </div>

          {/* Right Header User Avatar */}
          <div className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-md bg-slate-50 border border-slate-200/80 select-none">
            <div className="h-6 w-6 rounded-md bg-[#014645] text-white flex items-center justify-center text-[10px] font-black shrink-0">
              {user?.name ? user.name[0].toUpperCase() : "A"}
            </div>
            <span className="hidden sm:block text-xs font-extrabold text-slate-900">
              {user?.name || "System Admin"}
            </span>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-6 sm:p-8 text-left max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
