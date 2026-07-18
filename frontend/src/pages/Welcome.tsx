import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { HouseIcon, UserCheckIcon, UsersIcon, ChevronRightIcon } from "@animateicons/react/lucide";

interface RoleOption {
  id: "client" | "owner" | "agency";
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
  const [selectedRole, setSelectedRole] = useState<"client" | "owner" | "agency">("client");

  // Programmatic refs to trigger icon animation on card click
  const clientIconRef = useRef<any>(null);
  const ownerIconRef = useRef<any>(null);
  const agencyIconRef = useRef<any>(null);

  const roles: RoleOption[] = [
    {
      id: "client",
      title: "Seeker / Client",
      subtitle: "Find properties",
      description: "I want to search, buy, or rent properties directly.",
      Icon: HouseIcon,
      ref: clientIconRef,
      route: "/register/client",
    },
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

    // Explicitly animate the icon upon clicking the card
    setTimeout(() => {
      role.ref.current?.startAnimation();
    }, 50);

    if (selectedRole === role.id) {
      // If clicked again on the active card, proceed
      navigate(role.route, { state: role.state });
    }
  };

  return (
    <div className="relative flex min-h-screen md:h-screen md:overflow-hidden flex-col items-center justify-center p-4 md:p-6 bg-white font-sans text-black">
      <div className="w-full max-w-4xl flex flex-col items-center justify-center text-center">
        {/* Content Header */}
        <div className="max-w-xl mx-auto space-y-3">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-black">
            Select user type
          </h1>
          <p className="text-sm md:text-base text-slate-600 font-medium leading-relaxed max-w-md mx-auto">
            To continue, select your role in Letsellr, please.
            <br />
            If you don't know which role fits you, choose Seeker.
          </p>
        </div>

        {/* Role Selection Grid - Clean flat borders, no curved cells */}
        <div className="w-full mt-8 md:mt-10 grid grid-cols-1 md:grid-cols-3 border border-slate-200 bg-white divide-y md:divide-y-0 md:divide-x divide-slate-200 relative shadow-sm">
          {roles.map((role) => {
            const isSelected = selectedRole === role.id;
            const Icon = role.Icon;

            return (
              <div
                key={role.id}
                onClick={() => handleRoleSelect(role)}
                className={`relative flex flex-col items-center justify-center p-6 md:p-10 cursor-pointer select-none transition-all duration-300 ease-out border-b-4 ${
                  isSelected
                    ? "bg-white z-10 shadow-[0_20px_50px_rgba(0,0,0,0.08)] border-b-[#308178]"
                    : "bg-transparent border-b-transparent hover:bg-slate-50/50"
                }`}
              >
                {/* Icon Container - pointer-events-none prevents default hover trigger */}
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

                {/* Role Title */}
                <h3
                  className={`mt-4 text-lg font-bold tracking-tight transition-colors duration-300 ${
                    isSelected ? "text-[#308178]" : "text-slate-800"
                  }`}
                >
                  {role.title}
                </h3>

                {/* Role description */}
                <p className="mt-2 text-xs text-slate-500 max-w-[200px] leading-relaxed">
                  {role.description}
                </p>

                {/* SELECT ROLE Link */}
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
    </div>
  );
};
