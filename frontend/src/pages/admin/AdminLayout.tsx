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
  Bell,
  LogOut,
  Search,
  ChevronDown,
  Layers,
  MapPin,
  CircleDot,
  HelpCircle,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

export const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    adminService
      .getDashboardStats()
      .then((stats) => setPendingCount(stats.pending_property_reviews))
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

  const navItemClass = (path: string) =>
    `group flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 cursor-pointer ${
      isActive(path)
        ? "bg-[#23D283]/10 text-[#0B6E4F] font-bold"
        : "text-[#6b6375] hover:bg-[#f1f5f9] hover:text-[#08060d]"
    }`;

  return (
    <div
      className="min-h-screen flex"
      style={{ background: "#f1f5f9", fontFamily: "'DM Sans', system-ui, 'Segoe UI', Roboto, sans-serif" }}
    >
      {/* ── Mobile Sidebar Overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ══════════════════════════════════════
          UNIFIED APP SHELL — white card, full height
          Sidebar + TopNav are ONE continuous surface
      ══════════════════════════════════════ */}
      <div
        className="flex flex-1 m-3 rounded-2xl overflow-hidden shadow-lg"
        style={{ background: "#ffffff", height: "calc(100vh - 24px)" }}
      >
        {/* ── LEFT SIDEBAR ── */}
        <aside
          className={`
            fixed lg:static inset-y-0 left-0 z-50
            flex flex-col w-64 shrink-0
            border-r
            transition-transform duration-200
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          `}
          style={{
            background: "oklch(0.985 0 0)",
            borderColor: "oklch(0.922 0 0)",
          }}
        >
          {/* Brand Logo */}
          <div
            className="flex items-center gap-3 px-5 py-5 border-b"
            style={{ borderColor: "oklch(0.922 0 0)" }}
          >
            <div
              className="h-8 w-8 rounded-xl flex items-center justify-center shadow-sm shrink-0"
              style={{ background: "#23D283" }}
            >
              <img
                src="/logo.png"
                alt="Letsellr"
                className="h-5 w-5 brightness-0 invert"
              />
            </div>
            <div className="leading-none">
              <span
                className="text-[15px] font-black tracking-tight block"
                style={{ color: "#08060d" }}
              >
                Letsellr
              </span>
              <span
                className="text-[11px] font-semibold uppercase tracking-widest"
                style={{ color: "#23D283" }}
              >
                Admin
              </span>
            </div>
          </div>

          {/* Search */}
          <div className="px-4 pt-4 pb-2">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5"
                style={{ color: "#6b6375" }}
              />
              <input
                type="text"
                placeholder="Search… ⌘K"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl pl-9 pr-3 py-2 text-[13px] font-medium transition-all focus:outline-none"
                style={{
                  background: "#f1f5f9",
                  border: "1px solid #e2e8f0",
                  color: "#08060d",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.background = "#ffffff";
                  e.currentTarget.style.borderColor = "#23D283";
                  e.currentTarget.style.boxShadow =
                    "0 0 0 3px rgba(35,210,131,0.15)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.background = "#f1f5f9";
                  e.currentTarget.style.borderColor = "#e2e8f0";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>
          </div>

          {/* Nav Groups — scrollable */}
          <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-5">
            {/* MAIN MENU */}
            <div className="space-y-0.5">
              <p
                className="text-[10px] font-black uppercase tracking-widest px-3 mb-2"
                style={{ color: "#6B7280" }}
              >
                Main Menu
              </p>

              <Link to="/admin-platform/dashboard" className={navItemClass("/admin-platform/dashboard")}>
                <div className="flex items-center gap-2.5">
                  {isActive("/admin-platform/dashboard") && (
                    <span className="absolute left-3 w-0.5 h-5 rounded-full bg-[#23D283]" />
                  )}
                  <LayoutDashboard className="h-4 w-4 shrink-0" />
                  <span>Dashboard</span>
                </div>
              </Link>

              <Link to="/admin-platform/properties" className={navItemClass("/admin-platform/properties")}>
                <div className="flex items-center gap-2.5">
                  <Building2 className="h-4 w-4 shrink-0" />
                  <span>Properties & Queue</span>
                </div>
                {pendingCount > 0 && (
                  <span
                    className="text-[10px] font-black px-2 py-0.5 rounded-full"
                    style={{
                      background: "#FDE68A",
                      color: "#92400E",
                    }}
                  >
                    {pendingCount}
                  </span>
                )}
              </Link>

              <Link to="/admin-platform/users" className={navItemClass("/admin-platform/users")}>
                <div className="flex items-center gap-2.5">
                  <Users className="h-4 w-4 shrink-0" />
                  <span>Users & Agencies</span>
                </div>
              </Link>
            </div>

            {/* MODERATION */}
            <div className="space-y-0.5">
              <p
                className="text-[10px] font-black uppercase tracking-widest px-3 mb-2"
                style={{ color: "#6B7280" }}
              >
                Moderation
              </p>


              <Link to="/admin-platform/categories" className={navItemClass("/admin-platform/categories")}>
                <div className="flex items-center gap-2.5">
                  <Layers className="h-4 w-4 shrink-0" />
                  <span>Categories & Specs</span>
                </div>
              </Link>

              <Link to="/admin-platform/locations" className={navItemClass("/admin-platform/locations")}>
                <div className="flex items-center gap-2.5">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span>Location Management</span>
                </div>
              </Link>

              <Link to="/admin-platform/reports" className={navItemClass("/admin-platform/reports")}>
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>Reports & Flags</span>
                </div>
              </Link>

            </div>

            {/* GENERAL */}
            <div className="space-y-0.5">
              <p
                className="text-[10px] font-black uppercase tracking-widest px-3 mb-2"
                style={{ color: "#6B7280" }}
              >
                General
              </p>

              <Link to="/admin-platform/settings" className={navItemClass("/admin-platform/settings")}>
                <div className="flex items-center gap-2.5">
                  <Settings className="h-4 w-4 shrink-0" />
                  <span>Settings</span>
                </div>
              </Link>
            </div>
          </nav>

          {/* Sidebar Footer */}
          <div
            className="p-4 border-t space-y-3"
            style={{ borderColor: "oklch(0.922 0 0)" }}
          >


            {/* Admin profile row */}
            <div className="flex items-center gap-2.5 px-1">
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center font-black text-sm shrink-0"
                style={{ background: "#23D283", color: "#ffffff" }}
              >
                {user?.name ? user.name[0].toUpperCase() : "A"}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p
                  className="text-[13px] font-bold leading-tight truncate"
                  style={{ color: "#08060d" }}
                >
                  {user?.name || "Administrator"}
                </p>
                <p
                  className="text-[10px] font-semibold uppercase tracking-wider leading-tight"
                  style={{ color: "#6b6375" }}
                >
                  Super Admin
                </p>
              </div>
              <button
                onClick={handleLogout}
                title="Log out"
                className="h-8 w-8 rounded-lg flex items-center justify-center transition-colors hover:bg-rose-50 cursor-pointer shrink-0"
              >
                <LogOut className="h-4 w-4 text-rose-500" />
              </button>
            </div>
          </div>
        </aside>

        {/* ── RIGHT: TopNav + Content ── */}
        <div className="flex flex-col flex-1 min-w-0">

          {/* ── TOP NAV BAR ── */}
          <header
            className="flex items-center justify-between px-6 py-3.5 border-b shrink-0"
            style={{
              background: "#ffffff",
              borderColor: "oklch(0.922 0 0)",
            }}
          >
            {/* Left: Mobile hamburger + Breadcrumb */}
            <div className="flex items-center gap-3">
              {/* Mobile menu toggle */}
              <button
                className="lg:hidden h-8 w-8 rounded-lg flex items-center justify-center border transition-colors cursor-pointer"
                style={{ borderColor: "#e2e8f0", color: "#6b6375" }}
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Breadcrumb */}
              <div className="flex items-center gap-1.5 text-[13px]">
                <span style={{ color: "#6B7280" }} className="font-medium">
                  Admin Platform
                </span>
                <span style={{ color: "#e2e8f0" }}>/</span>
                <span
                  className="font-bold capitalize"
                  style={{ color: "#08060d" }}
                >
                  {currentSection}
                </span>
              </div>
            </div>

            {/* Right: Utilities */}
            <div className="flex items-center gap-2">
              {/* Help */}
              <button
                className="h-8 w-8 rounded-xl flex items-center justify-center border transition-colors cursor-pointer"
                style={{ borderColor: "#e2e8f0", color: "#6b6375", background: "#f1f5f9" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#e2e8f0";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#f1f5f9";
                }}
              >
                <HelpCircle className="h-4 w-4" />
              </button>

              {/* Notifications */}
              <button
                className="h-8 w-8 rounded-xl flex items-center justify-center border relative transition-colors cursor-pointer"
                style={{ borderColor: "#e2e8f0", color: "#6b6375", background: "#f1f5f9" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#e2e8f0";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#f1f5f9";
                }}
              >
                <Bell className="h-4 w-4" />
                <span
                  className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full ring-2 ring-white"
                  style={{ background: "#23D283" }}
                />
              </button>

              {/* Admin profile chip */}
              <div
                className="flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full border cursor-pointer select-none"
                style={{
                  background: "#f1f5f9",
                  borderColor: "#e2e8f0",
                }}
              >
                <div
                  className="h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-black shrink-0"
                  style={{ background: "#23D283", color: "#ffffff" }}
                >
                  {user?.name ? user.name[0].toUpperCase() : "A"}
                </div>
                <div className="hidden sm:block text-left leading-none">
                  <span
                    className="text-[12px] font-bold block"
                    style={{ color: "#08060d" }}
                  >
                    {user?.name?.split(" ")[0] || "Admin"}
                  </span>
                </div>
                <ChevronDown className="h-3 w-3 ml-0.5" style={{ color: "#6B7280" }} />
              </div>
            </div>
          </header>

          {/* ── PAGE CONTENT ── */}
          <main
            className="flex-1 overflow-y-auto p-6 sm:p-8 text-left"
            style={{ background: "#f1f5f9" }}
          >
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
