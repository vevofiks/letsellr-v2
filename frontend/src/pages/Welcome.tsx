import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { UserCheckIcon, UsersIcon, ChevronRightIcon } from "@animateicons/react/lucide";
import { useAuth } from "@/context/AuthContext";
import { AuthModal, type AuthModalMode } from "@/components/AuthModal";

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
  const [authModal, setAuthModal] = useState<{ open: boolean; mode: AuthModalMode }>({
    open: false,
    mode: "login",
  });

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
    <div className="min-h-[100dvh] flex flex-col justify-center bg-white font-sans overflow-x-hidden">

      {/* ── Page Content ──────────────────────────────────────────────── */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 sm:px-6 py-6 sm:py-12 bg-white w-full">
        <div className="w-full max-w-2xl flex flex-col items-center text-center mx-auto">

          {/* Hero header */}
          <div className="w-full max-w-xl mx-auto space-y-2 mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
              List on Letsellr
            </h1>
            <div className="flex items-center justify-center py-1">
              <img
                src="/logo.png"
                alt="Letsellr Logo"
                className="h-9 sm:h-11 w-auto object-contain shrink-0 drop-shadow-sm"
              />
            </div>

            <p className="text-xs sm:text-sm md:text-base text-slate-600 font-medium leading-relaxed max-w-md mx-auto">
              Are you a property owner or agency?
              <br />
              Select your type below to get started.
            </p>
          </div>

          {/* Role cards — Owner & Agency only */}
          <div className={cn(
            "w-full grid grid-cols-1 md:grid-cols-2 border border-slate-200 bg-white divide-y md:divide-y-0 md:divide-x shadow-sm rounded-2xl overflow-hidden",
            "divide-slate-200"
          )}>
            {roles.map((role) => {
              const isSelected = selectedRole === role.id;
              const Icon = role.Icon;

              return (
                <div
                  key={role.id}
                  onClick={() => handleRoleSelect(role)}
                  className={`relative flex flex-col items-center justify-center p-5 sm:p-8 md:p-10 cursor-pointer select-none transition-all duration-300 ease-out border-b-4 ${
                    isSelected
                      ? "bg-white z-10 shadow-[0_10px_30px_rgba(0,0,0,0.06)] border-b-brand-green"
                      : "bg-transparent border-b-transparent hover:bg-slate-50/50"
                  }`}
                >
                  <div
                    className={`pointer-events-none flex h-12 sm:h-16 w-12 sm:w-16 items-center justify-center rounded-full transition-colors duration-300 ${
                      isSelected ? "text-brand-deep-green" : "text-slate-500"
                    }`}
                  >
                    <Icon
                      ref={role.ref}
                      size={40}
                      isAnimated={isSelected}
                      duration={1.2}
                      color={isSelected ? "#23D283" : "#475569"}
                    />
                  </div>

                  <h3
                    className={`mt-3 sm:mt-4 text-base sm:text-lg font-bold tracking-tight transition-colors duration-300 ${
                      isSelected ? "text-brand-deep-green" : "text-slate-800"
                    }`}
                  >
                    {role.title}
                  </h3>

                  <p className="mt-1.5 text-xs text-slate-500 max-w-56 leading-relaxed">
                    {role.description}
                  </p>

                  <div className="h-6 mt-3 sm:mt-4 flex items-center justify-center">
                    {isSelected && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(role.route, { state: role.state });
                        }}
                        className="text-brand-deep-green text-xs font-bold uppercase tracking-wider flex items-center gap-1 hover:underline transition-all duration-200 cursor-pointer"
                      >
                        Select Role
                        <ChevronRightIcon size={14} isAnimated={true} color="#23D283" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Login Switcher */}
          <div className="mt-6 sm:mt-8 text-xs sm:text-sm text-slate-600 font-medium">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => setAuthModal({ open: true, mode: "login" })}
              className="font-bold text-brand-deep-green hover:text-brand-green-hover hover:underline focus:outline-none transition-colors cursor-pointer"
            >
              Sign In
            </button>
          </div>
        </div>
      </main>

      {authModal.open && (
        <AuthModal
          initialMode={authModal.mode}
          onClose={() => setAuthModal({ open: false, mode: "login" })}
        />
      )}
    </div>
  );
};
