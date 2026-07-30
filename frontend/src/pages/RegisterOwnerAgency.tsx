import React, { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ownerAgencyRegisterSchema } from "@/lib/validation";
import type { OwnerAgencyRegisterInput } from "@/lib/validation";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Building2, User, Plus, X, ArrowRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export const RegisterOwnerAgency: React.FC = () => {
  const { registerOwnerAgency } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Get initial role from state if routed from welcome role cards
  const defaultRole = location.state?.defaultRole === "agency" ? "agency" : "owner";

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<OwnerAgencyRegisterInput>({
    resolver: zodResolver(ownerAgencyRegisterSchema),
    mode: "onChange",
    defaultValues: {
      role: defaultRole,
      agency_areas_served: [],
      preference_type: "",
    },
  });

  const selectedRole = watch("role");
  const areas = watch("agency_areas_served") || [];
  const [areaInput, setAreaInput] = useState("");

  const addArea = () => {
    if (!areaInput.trim()) return;
    if (areas.includes(areaInput.trim())) {
      toast.warning("Area is already added");
      return;
    }
    setValue("agency_areas_served", [...areas, areaInput.trim()]);
    setAreaInput("");
  };

  const removeArea = (indexToRemove: number) => {
    setValue(
      "agency_areas_served",
      areas.filter((_, idx) => idx !== indexToRemove)
    );
  };

  const onSubmit = async (data: OwnerAgencyRegisterInput) => {
    try {
      await registerOwnerAgency(data);
      toast.success("OTP sent to your WhatsApp!");
      navigate("/verify-otp", {
        state: { phone: data.phone, purpose: "registration" },
      });
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Registration failed. Check your inputs.");
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-slate-50 font-sans text-slate-900 px-4 py-8 sm:py-12 overflow-y-auto">
      {/* Main Container */}
      <main className="w-full max-w-2xl mx-auto my-auto">
        <div className="bg-white border border-slate-200/80 shadow-md rounded-lg p-5 sm:p-7 space-y-4">
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#0B6E4F] transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Home</span>
            </Link>

            <Link to="/" className="flex items-center gap-1.5 hover:opacity-90 transition-opacity">
              <img src="/logo.png" alt="Letsellr Logo" className="h-6 w-auto shrink-0" />
              <span className="text-sm font-black tracking-tight text-[#23D283] uppercase">
                LETSELLR
              </span>
            </Link>
          </div>

          {/* Headline */}
          <div className="flex flex-col items-center justify-center text-center space-y-1 pt-1">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 m-0">
              Create Property Account
            </h1>
            <p className="text-xs text-slate-500 max-w-md mx-auto text-center leading-relaxed">
              Start listing your property portfolio on Letsellr.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Role Switcher Pills */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
                Partner Account Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setValue("role", "owner")}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-md border p-2.5 transition-all text-xs font-bold cursor-pointer",
                    selectedRole === "owner"
                      ? "border-[#23D283] bg-[#D9F7E9]/40 text-[#0B6E4F] ring-1 ring-[#23D283]/30"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <User className="h-4 w-4" />
                  <span>Property Owner</span>
                </button>
                <button
                  type="button"
                  onClick={() => setValue("role", "agency")}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-md border p-2.5 transition-all text-xs font-bold cursor-pointer",
                    selectedRole === "agency"
                      ? "border-[#23D283] bg-[#D9F7E9]/40 text-[#0B6E4F] ring-1 ring-[#23D283]/30"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <Building2 className="h-4 w-4" />
                  <span>Agency / Broker</span>
                </button>
              </div>
            </div>

            {/* Inputs Grid */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Full Name */}
              <div className="space-y-1.5 text-left">
                <label htmlFor="name" className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  {...register("name")}
                  className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#23D283] focus:ring-2 focus:ring-[#23D283]/20 transition-all"
                />
                {errors.name && (
                  <p className="text-xs text-rose-600 font-medium text-left">{errors.name.message}</p>
                )}
              </div>

              {/* Email Address (Optional) */}
              <div className="space-y-1.5 text-left">
                <label htmlFor="email" className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
                  Email Address <span className="text-slate-400 font-normal lowercase">(optional)</span>
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  {...register("email")}
                  className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#23D283] focus:ring-2 focus:ring-[#23D283]/20 transition-all"
                />
                {errors.email && (
                  <p className="text-xs text-rose-600 font-medium text-left">{errors.email.message}</p>
                )}
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5 text-left">
                <label htmlFor="phone" className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  placeholder="+1234567890"
                  {...register("phone")}
                  className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#23D283] focus:ring-2 focus:ring-[#23D283]/20 transition-all"
                />
                {errors.phone && (
                  <p className="text-xs text-rose-600 font-medium text-left">{errors.phone.message}</p>
                )}
              </div>

              {/* Listing Purpose */}
              <div className="space-y-1.5 text-left">
                <label htmlFor="preference_type" className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
                  Listing Purpose
                </label>
                <select
                  id="preference_type"
                  {...register("preference_type")}
                  className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#23D283] focus:ring-2 focus:ring-[#23D283]/20 transition-all"
                >
                  <option value="">Select purpose...</option>
                  <option value="sell">Sell Properties</option>
                  <option value="rent">Rent Properties</option>
                  <option value="both">Both Sell & Rent</option>
                </select>
                {errors.preference_type && (
                  <p className="text-xs text-rose-600 font-medium text-left">{errors.preference_type.message}</p>
                )}
              </div>

              {/* City */}
              <div className="space-y-1.5 text-left">
                <label htmlFor="location_city" className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
                  Operating City
                </label>
                <input
                  id="location_city"
                  type="text"
                  placeholder="e.g. Dubai"
                  {...register("location_city")}
                  className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#23D283] focus:ring-2 focus:ring-[#23D283]/20 transition-all"
                />
                {errors.location_city && (
                  <p className="text-xs text-rose-600 font-medium text-left">{errors.location_city.message}</p>
                )}
              </div>

              {/* Area */}
              <div className="space-y-1.5 text-left">
                <label htmlFor="location_area" className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
                  Primary Area / Neighborhood
                </label>
                <input
                  id="location_area"
                  type="text"
                  placeholder="e.g. Downtown"
                  {...register("location_area")}
                  className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#23D283] focus:ring-2 focus:ring-[#23D283]/20 transition-all"
                />
                {errors.location_area && (
                  <p className="text-xs text-rose-600 font-medium text-left">{errors.location_area.message}</p>
                )}
              </div>

              {/* 4-Digit Security PIN */}
              <div className="space-y-1.5 text-left">
                <label htmlFor="pin" className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
                  Set 4-Digit Security PIN
                </label>
                <input
                  id="pin"
                  type="password"
                  maxLength={4}
                  inputMode="numeric"
                  placeholder="e.g. 1234"
                  {...register("pin")}
                  className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#23D283] focus:ring-2 focus:ring-[#23D283]/20 transition-all"
                />
                {errors.pin && (
                  <p className="text-xs text-rose-600 font-medium text-left">{errors.pin.message}</p>
                )}
              </div>

              {/* Confirm PIN */}
              <div className="space-y-1.5 text-left">
                <label htmlFor="confirm_pin" className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
                  Confirm 4-Digit PIN
                </label>
                <input
                  id="confirm_pin"
                  type="password"
                  maxLength={4}
                  inputMode="numeric"
                  placeholder="e.g. 1234"
                  {...register("confirm_pin")}
                  className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#23D283] focus:ring-2 focus:ring-[#23D283]/20 transition-all"
                />
                {errors.confirm_pin && (
                  <p className="text-xs text-rose-600 font-medium text-left">{errors.confirm_pin.message}</p>
                )}
              </div>
            </div>

            {/* Conditional Agency Profile Fields */}
            {selectedRole === "agency" && (
              <div className="pt-3 border-t border-slate-100 space-y-4 text-left">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-[#0B6E4F]" />
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                    Agency Details
                  </h3>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2 space-y-1.5">
                    <label htmlFor="agency_display_name" className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
                      Agency Name
                    </label>
                    <input
                      id="agency_display_name"
                      type="text"
                      placeholder="Premium Realty Group"
                      {...register("agency_display_name")}
                      className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#23D283] focus:ring-2 focus:ring-[#23D283]/20 transition-all"
                    />
                    {errors.agency_display_name && (
                      <p className="text-xs text-rose-600 font-medium">{errors.agency_display_name.message}</p>
                    )}
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <label htmlFor="agency_about" className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
                      About Agency
                    </label>
                    <input
                      id="agency_about"
                      type="text"
                      placeholder="Brief overview of your agency..."
                      {...register("agency_about")}
                      className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#23D283] focus:ring-2 focus:ring-[#23D283]/20 transition-all"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
                      Areas Served
                    </label>
                    <div className="flex gap-2">
                      <input
                        value={areaInput}
                        onChange={(e) => setAreaInput(e.target.value)}
                        placeholder="e.g. Marina Dubai"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addArea();
                          }
                        }}
                        className="flex-1 bg-white border border-slate-200 rounded-md px-3 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#23D283] focus:ring-2 focus:ring-[#23D283]/20 transition-all"
                      />
                      <button
                        type="button"
                        onClick={addArea}
                        className="bg-[#23D283] hover:bg-[#11995E] text-white px-3 py-2 rounded-md font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add</span>
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {areas.map((area, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 bg-[#D9F7E9] text-[#0B6E4F] px-2.5 py-0.5 rounded-md text-xs font-semibold"
                        >
                          {area}
                          <button
                            type="button"
                            onClick={() => removeArea(idx)}
                            className="hover:text-rose-600 cursor-pointer"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 bg-[#23D283] hover:bg-[#11995E] text-white font-bold text-sm rounded-md transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.99] disabled:opacity-60"
              >
                {isSubmitting ? (
                  <span>Registering...</span>
                ) : (
                  <>
                    <span>Create Partner Account</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer Switcher */}
          <div className="text-center pt-2 border-t border-slate-100 text-xs text-slate-500">
            Already registered?{" "}
            <Link to="/login" className="font-bold text-[#0B6E4F] hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};


