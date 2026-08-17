import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { clientRegisterSchema } from "@/lib/validation";
import type { ClientRegisterInput } from "@/lib/validation";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { cn, getErrorMessage } from "@/lib/utils";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { useAvailabilityCheck } from "@/hooks/useAvailabilityCheck";

export const RegisterClient: React.FC = () => {
  const { registerClient } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ClientRegisterInput>({
    resolver: zodResolver(clientRegisterSchema),
    mode: "onChange",
    defaultValues: {
      preference_type: "",
    },
  });

  const phoneValue = watch("phone");
  const { phoneTaken, checkingPhone } = useAvailabilityCheck(phoneValue, undefined, {
    phoneValid: !errors.phone,
  });

  const onSubmit = async (data: ClientRegisterInput) => {
    if (phoneTaken) {
      toast.error("Please resolve the highlighted fields before continuing.");
      return;
    }
    try {
      await registerClient(data);
      toast.success("OTP sent to your WhatsApp!");
      navigate("/verify-otp", {
        state: { phone: data.phone, purpose: "registration" },
      });
    } catch (err: any) {
      console.error(err);
      toast.error(getErrorMessage(err, "Registration failed. Check your inputs."));
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-slate-50 font-sans text-slate-900 px-4 py-6 sm:py-10 overflow-y-auto">
      {/* Main Screen-Height Container */}
      <main className="w-full max-w-xl mx-auto">
        <div className="bg-white border border-slate-200/80 shadow-md rounded-lg p-6 sm:p-8 space-y-5">
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
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
          <div className="flex flex-col items-center justify-center text-center space-y-1.5 pt-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#0B6E4F] bg-[#D9F7E9] px-2.5 py-1 rounded-md inline-block">
              Property Seeker
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 m-0">
              Create Seeker Account 
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xs mx-auto text-center leading-relaxed">
              Create an account to start looking for your perfect property.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Full Name */}
              <div className="space-y-1.5 text-left">
                <label htmlFor="name" className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Jane Doe"
                  {...register("name")}
                  className="w-full bg-white border border-slate-200 rounded-md px-3 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#23D283] focus:ring-2 focus:ring-[#23D283]/20 transition-all"
                />
                {errors.name && (
                  <p className="text-xs text-rose-600 font-medium text-left">{errors.name.message}</p>
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
                  className={cn(
                    "w-full bg-white border rounded-md px-3 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all",
                    phoneTaken
                      ? "border-rose-300 focus:border-rose-400 focus:ring-rose-200"
                      : "border-slate-200 focus:border-[#23D283] focus:ring-[#23D283]/20"
                  )}
                />
                {errors.phone ? (
                  <p className="text-xs text-rose-600 font-medium text-left">{errors.phone.message}</p>
                ) : checkingPhone ? (
                  <p className="text-xs text-slate-400 font-medium text-left">Checking availability...</p>
                ) : phoneTaken ? (
                  <p className="text-xs text-rose-600 font-medium text-left">
                    An account with this phone number already exists. Please log in.
                  </p>
                ) : null}
              </div>

              {/* Preference Type */}
              <div className="space-y-1.5 text-left">
                <label htmlFor="preference_type" className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
                  Looking to Buy or Rent?
                </label>
                <select
                  id="preference_type"
                  {...register("preference_type")}
                  className="w-full bg-white border border-slate-200 rounded-md px-3 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#23D283] focus:ring-2 focus:ring-[#23D283]/20 transition-all"
                >
                  <option value="">Select preference...</option>
                  <option value="buy">Buy Properties</option>
                  <option value="rent">Rent Properties</option>
                  <option value="both">Both</option>
                </select>
                {errors.preference_type && (
                  <p className="text-xs text-rose-600 font-medium text-left">{errors.preference_type.message}</p>
                )}
              </div>

              {/* Target Location */}
              <div className="space-y-1.5 text-left">
                <label htmlFor="location" className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
                  Preferred Location / City
                </label>
                <input
                  id="location"
                  type="text"
                  placeholder="e.g. London, UK"
                  {...register("location")}
                  className="w-full bg-white border border-slate-200 rounded-md px-3 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#23D283] focus:ring-2 focus:ring-[#23D283]/20 transition-all"
                />
                {errors.location && (
                  <p className="text-xs text-rose-600 font-medium text-left">{errors.location.message}</p>
                )}
              </div>

              {/* 4-Digit Security PIN */}
              <div className="space-y-1.5 text-left sm:col-span-2">
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
                  className="w-full bg-white border border-slate-200 rounded-md px-3 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#23D283] focus:ring-2 focus:ring-[#23D283]/20 transition-all"
                />
                {errors.pin && (
                  <p className="text-xs text-rose-600 font-medium text-left">{errors.pin.message}</p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={isSubmitting || phoneTaken}
                className="w-full h-11 bg-[#23D283] hover:bg-[#11995E] text-white font-bold text-sm rounded-md transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.99] disabled:opacity-60"
              >
                {isSubmitting ? (
                  <span>Sending OTP...</span>
                ) : (
                  <>
                    <span>Register Account</span>
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


