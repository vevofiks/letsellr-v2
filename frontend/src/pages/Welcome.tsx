import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useNavigate, Link } from "react-router-dom";
import { UserCheckIcon, UsersIcon, ChevronRightIcon } from "@animateicons/react/lucide";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { SITE_URL } from "@/lib/site";

interface RoleOption {
  id: "owner" | "agency";
  title: string;
  subtitle: string;
  description: string;
  Icon: React.ComponentType<any>;
  ref: React.RefObject<any>;
  route: string;
  state?: { defaultRole: string };
}

export const Welcome: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedRole, setSelectedRole] = useState<"owner" | "agency">("owner");

  const ownerIconRef = useRef<any>(null);
  const agencyIconRef = useRef<any>(null);

  const roles: RoleOption[] = [
    {
      id: "owner",
      title: "Property Owner",
      subtitle: "Direct Listings",
      description: "I own properties and want to list them for rent or sale directly.",
      Icon: UserCheckIcon,
      ref: ownerIconRef,
      route: "/register/owner-agency",
      state: { defaultRole: "owner" },
    },
    {
      id: "agency",
      title: "Agency / Broker",
      subtitle: "Partner Account",
      description: "I manage an agency or act as an agent serving multiple properties.",
      Icon: UsersIcon,
      ref: agencyIconRef,
      route: "/register/owner-agency",
      state: { defaultRole: "agency" },
    },
  ];

  const handleRoleSelect = (role: RoleOption) => {
    setSelectedRole(role.id);
    setTimeout(() => {
      role.ref.current?.startAnimation();
    }, 50);
  };

  const handleContinue = () => {
    const activeRole = roles.find((r) => r.id === selectedRole);
    if (activeRole) {
      navigate(activeRole.route, { state: activeRole.state });
    }
  };

  // Redirect logged-in users to their dashboard
  useEffect(() => {
    if (user) {
      if (user.role === "user") navigate("/dashboard", { replace: true });
      else if (user.role === "owner" || user.role === "agency")
        navigate("/owner/dashboard", { replace: true });
      else if (user.role === "admin") navigate("/admin", { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-slate-50 font-sans text-slate-900 px-4 py-6 sm:py-10 overflow-y-auto">
      {/* Centered Screen-Height Card Container */}
      <main className="w-full max-w-xl mx-auto">
        <div className="bg-white border border-slate-200/80 shadow-md rounded-lg p-6 sm:p-8 space-y-5">
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-3 -mt-2 border-b border-slate-100">
            <a
              href={SITE_URL}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#0B6E4F] transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Home</span>
            </a>

            <a href={SITE_URL} className="flex items-center gap-1.5 hover:opacity-90 transition-opacity">
              <img src="/logo.png" alt="Letsellr Logo" className="h-9 w-auto shrink-0" />
              <span className="text-sm font-black tracking-tight text-[#23D283] uppercase">
                LETSELLR
              </span>
            </a>
          </div>

          {/* Headline */}
          <div className="flex flex-col items-center justify-center text-center space-y-1.5 pt-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 -mt-1.5!">
              Welcome to Letsellr
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto text-center leading-relaxed -mt-4!">
              Select your partner account type to customize your onboarding setup.
            </p>
          </div>

          {/* Role Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {roles.map((role) => {
              const isSelected = selectedRole === role.id;
              const Icon = role.Icon;

              return (
                <div
                  key={role.id}
                  onClick={() => handleRoleSelect(role)}
                  className={cn(
                    "relative flex flex-col items-start p-4 sm:p-5 rounded-lg border text-left cursor-pointer transition-all duration-200 select-none",
                    isSelected
                      ? "border-[#23D283] bg-[#D9F7E9]/30 ring-1 ring-[#23D283]/30 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                  )}
                >
                  <div className="w-full flex items-center justify-between mb-3">
                    <div
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-md transition-colors",
                        isSelected
                          ? "bg-[#23D283] text-white"
                          : "bg-slate-100 text-slate-600"
                      )}
                    >
                      <Icon
                        ref={role.ref}
                        size={20}
                        isAnimated={isSelected}
                        duration={1.2}
                        color={isSelected ? "#FFFFFF" : "#475569"}
                      />
                    </div>
                    <div
                      className={cn(
                        "h-4 w-4 rounded-full border flex items-center justify-center transition-colors",
                        isSelected
                          ? "border-[#23D283] bg-[#23D283]"
                          : "border-slate-300"
                      )}
                    >
                      {isSelected && (
                        <div className="h-1.5 w-1.5 rounded-full bg-white" />
                      )}
                    </div>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                    {role.title}
                  </h3>
                  <span className="text-[10px] sm:text-[11px] font-semibold text-[#0B6E4F] mb-1">
                    {role.subtitle}
                  </span>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {role.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Action Button */}
          <div>
            <button
              type="button"
              onClick={handleContinue}
              className="w-full h-11 bg-[#23D283] hover:bg-[#11995E] text-white font-bold text-sm rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.99]"
            >
              <span>Continue Registration</span>
              <ChevronRightIcon size={16} isAnimated={true} color="#FFFFFF" />
            </button>
          </div>

          {/* Footer Note */}
          <div className="text-center pt-2 border-t border-slate-100">
            <span className="text-xs text-slate-500">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-bold text-[#0B6E4F] hover:underline"
              >
                Sign In
              </Link>
            </span>
          </div>
        </div>
      </main>
    </div>
  );
};


