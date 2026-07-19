import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { HouseIcon, UserCheckIcon, UsersIcon, ChevronRightIcon } from "@animateicons/react/lucide";
import { useAuth } from "@/context/AuthContext";
import { AppNavbar } from "@/components/AppNavbar";

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
      subtitle: "List properties",
      description: "I own properties and want to list them for rent or sale.",
      Icon: UserCheckIcon,
      ref: ownerIconRef,
      route: "/register/owner-agency",
      state: { defaultRole: "owner" },
    },
    {
      id: "agency",
      title: "Agency / Broker",
      subtitle: "Agency partner",
      description: "I run an agency or act as an agent serving multiple properties.",
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
    if (selectedRole === role.id) {
      navigate(role.route, { state: role.state });
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
    <div className="min-h-screen flex flex-col bg-[#f4f6f5] font-sans">

      <AppNavbar logoHref="/register/type" />

      {/* ── Page Content ──────────────────────────────────────────────── */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-4xl flex flex-col items-center text-center">

          {/* Hero header */}
          <div className="max-w-xl mx-auto space-y-3 mb-10">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
              List on Letsellr
            </h1>
            <p className="text-sm md:text-base text-slate-600 font-medium leading-relaxed max-w-md mx-auto">
              Are you a property owner or agency?
              <br />
              Select your type below to get started.
            </p>
          </div>

          {/* Role cards — Owner & Agency only */}
          <div className="w-full grid grid-cols-1 md:grid-cols-2 border border-slate-200 bg-white divide-y md:divide-y-0 md:divide-x divide-slate-200 shadow-sm max-w-2xl mx-auto rounded-2xl overflow-hidden">
            {roles.map((role) => {
              const isSelected = selectedRole === role.id;
              const Icon = role.Icon;

              return (
                <div
                  key={role.id}
                  onClick={() => handleRoleSelect(role)}
                  className={`relative flex flex-col items-center justify-center p-8 md:p-12 cursor-pointer select-none transition-all duration-300 ease-out border-b-4 ${
                    isSelected
                      ? "bg-white z-10 shadow-[0_20px_50px_rgba(0,0,0,0.08)] border-b-[#308178]"
                      : "bg-transparent border-b-transparent hover:bg-slate-50/50"
                  }`}
                >
                  <div
                    className={`pointer-events-none flex h-16 w-16 items-center justify-center rounded-full transition-colors duration-300 ${
                      isSelected ? "text-[#308178]" : "text-slate-500"
                    }`}
                  >
                    <Icon
                      ref={role.ref}
                      size={48}
                      isAnimated={isSelected}
                      duration={1.2}
                      color={isSelected ? "#308178" : "#475569"}
                    />
                  </div>

                  <h3
                    className={`mt-4 text-lg font-bold tracking-tight transition-colors duration-300 ${
                      isSelected ? "text-[#308178]" : "text-slate-800"
                    }`}
                  >
                    {role.title}
                  </h3>

                  <p className="mt-2 text-xs text-slate-500 max-w-[200px] leading-relaxed">
                    {role.description}
                  </p>

                  <div className="h-6 mt-4 flex items-center justify-center">
                    {isSelected && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(role.route, { state: role.state });
                        }}
                        className="text-[#308178] text-xs font-bold uppercase tracking-wider flex items-center gap-1 hover:underline transition-all duration-200"
                      >
                        Select Role
                        <ChevronRightIcon size={14} isAnimated={true} color="#308178" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {/* Footer Login Switcher */}
          <div className="mt-8 md:mt-10 text-sm text-slate-600 font-medium">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/login")}
              className="font-bold text-[#308178] hover:text-[#25645d] hover:underline focus:outline-none transition-colors"
            >
              Sign In
            </button>

          </div>
        </div>
      </main>
    </div>
  );
};
