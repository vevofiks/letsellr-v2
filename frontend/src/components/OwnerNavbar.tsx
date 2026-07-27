import React, { useState, useEffect } from "react";
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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export const OwnerNavbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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

  // Profile Image Resolution
  const [profileImage, setProfileImage] = useState<string | null>(null);

  useEffect(() => {
    const updateAvatar = () => {
      if (user?.id) {
        const savedAvatar = localStorage.getItem(`profile_avatar_${user.id}`);
        const savedLogo = localStorage.getItem(`agency_logo_${user.id}`);
        const apiLogo = user.agency_profile?.logo_key || (user as any).avatar_url || (user as any).profile_image || (user as any).logo_key;
        setProfileImage(savedAvatar || savedLogo || apiLogo || null);
      } else {
        setProfileImage(null);
      }
    };

    updateAvatar();

    window.addEventListener("profile-updated", updateAvatar);
    window.addEventListener("storage", updateAvatar);
    return () => {
      window.removeEventListener("profile-updated", updateAvatar);
      window.removeEventListener("storage", updateAvatar);
    };
  }, [user]);

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
      <header className="sticky top-0 z-40 bg-white/95 text-slate-900 border-b border-slate-100 shadow-2xs backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          
          {/* Left: Brand Logo & Workspace Tag */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Link to="/owner/dashboard" className="flex items-center gap-2 sm:gap-2.5 group min-w-0">
              <div className="flex items-center justify-center transition-transform group-hover:scale-105 shrink-0">
                <img
                  src="/logo.png"
                  alt="Letsellr Logo"
                  className="h-8 sm:h-9 w-auto object-contain shrink-0 drop-shadow-2xs"
                />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-black text-brand-green text-base sm:text-lg tracking-tight mt-1.5 leading-none truncate uppercase">
                  LETSELLR
                </span>
                <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider -mt-0.5 text-slate-800 truncate">
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
              className="flex items-center gap-1.5 sm:gap-2 bg-brand-green hover:bg-brand-green-hover text-white px-3 sm:px-4 py-2 rounded-xl text-xs font-extrabold shadow-xs transition-all cursor-pointer whitespace-nowrap active:scale-[0.98]"
            >
              <PlusCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Post Property</span>
              <span className="sm:hidden">Post</span>
            </Link>

            {/* User Profile Menu with shadcn DropdownMenu */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1.5 sm:gap-2 p-1.5 rounded-xl hover:bg-slate-100/80 transition-colors cursor-pointer focus:outline-none border border-slate-200/80 bg-slate-50/50">
                <div className="h-8 w-8 sm:h-8.5 sm:w-8.5 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center shadow-xs shrink-0 overflow-hidden">
                  {profileImage ? (
                    <img src={profileImage} alt={user?.name || "User"} className="h-full w-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                <div className="hidden lg:flex flex-col text-left pr-1 justify-center">
                  <span className="text-xs font-extrabold text-slate-900 line-clamp-1 max-w-30 leading-tight">
                    {user?.name || "Partner User"}
                  </span>
                  <span className="text-[9px] font-extrabold text-brand-green uppercase tracking-wider leading-tight">
                    {roleLabel}
                  </span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden sm:block" />
              </DropdownMenuTrigger>

              <DropdownMenuContent align="right" className="rounded-2xl p-2 border-slate-200/80 shadow-lg">
                <div className="px-3 py-2.5 border-b border-slate-100 mb-1 text-left">
                  <p className="text-xs font-black text-slate-900 truncate m-0">{user?.name}</p>
                  <p className="text-[10px] text-slate-400 font-semibold truncate mt-0.5 m-0">{user?.email}</p>
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-brand-green border border-emerald-100/80 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                    {isAgency ? <Building className="h-3 w-3" /> : <User className="h-3 w-3" />}
                    {roleLabel} Account
                  </div>
                </div>

                <DropdownMenuItem onClick={() => navigate("/owner/settings")} className="rounded-xl cursor-pointer font-bold text-xs">
                  <Settings className="h-3.5 w-3.5 text-slate-400 mr-2 shrink-0" />
                  Settings
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={handleLogout} className="rounded-xl cursor-pointer font-bold text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700">
                  <LogOut className="h-3.5 w-3.5 text-rose-500 mr-2 shrink-0" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

          </div>

        </div>
      </header>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2 flex items-center justify-around shadow-2xl">
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


