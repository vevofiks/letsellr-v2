import React from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@/lib/validation";
import type { LoginInput } from "@/lib/validation";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Lock, Phone, ArrowRight, ArrowLeft } from "lucide-react";

export const Login: React.FC = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const fromPath = (location.state as any)?.from || null;

  // Redirect user based on role upon successful login/session resolution
  React.useEffect(() => {
    if (user) {
      if (fromPath) {
        navigate(fromPath, { replace: true });
      } else if (user.role === "user") {
        navigate("/dashboard", { replace: true });
      } else if (user.role === "owner" || user.role === "agency") {
        navigate("/owner/dashboard", { replace: true });
      } else if (user.role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    }
  }, [user, navigate, fromPath]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
  });

  const onSubmit = async (data: LoginInput) => {
    try {
      await login(data.phone, data.pin);
      toast.success("Successfully signed in!");
    } catch (err: any) {
      console.error(err);
      toast.error(
        err.response?.data?.detail || "Invalid phone number or 4-digit PIN. Please try again."
      );
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-slate-50 font-sans text-slate-900 px-4 py-6 sm:py-10 overflow-y-auto">
      {/* Main Screen-Height Card Container */}
      <main className="w-full max-w-md mx-auto">
        <div className="bg-white border border-slate-200/80 shadow-md rounded-lg p-6 sm:p-8 space-y-5">
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-3 -mt-1! border-b border-slate-100">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#0B6E4F] transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Home</span>
            </Link>

            <Link to="/" className="flex items-center gap-1.5 hover:opacity-90 transition-opacity">
              <img src="/logo.png" alt="Letsellr Logo" className="h-9 w-auto shrink-0" />
              <span className="text-sm font-black tracking-tight text-[#23D283] uppercase">
                LETSELLR
              </span>
            </Link>
          </div>

          {/* Headline */}
          <div className="flex flex-col items-center justify-center text-center space-y-1 pt-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 -mt-1.5!">
              Welcome Back
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xs mx-auto text-center leading-relaxed -mt-4!">
              Sign in with your phone number and 4-digit PIN.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Phone Number Field */}
            <div className="space-y-1.5 text-left">
              <label htmlFor="phone" className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="phone"
                  type="tel"
                  placeholder="+1234567890"
                  {...register("phone")}
                  className="w-full bg-white border border-slate-200 rounded-md pl-10 pr-3 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#23D283] focus:ring-2 focus:ring-[#23D283]/20 transition-all"
                />
              </div>
              {errors.phone && (
                <p className="text-xs text-rose-600 font-medium text-left">{errors.phone.message}</p>
              )}
            </div>

            {/* 4-Digit Security PIN Field */}
            <div className="space-y-1.5 text-left">
              <label htmlFor="pin" className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
                4-Digit Security PIN
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="pin"
                  type="password"
                  maxLength={4}
                  inputMode="numeric"
                  placeholder="e.g. 1234"
                  {...register("pin")}
                  className="w-full bg-white border border-slate-200 rounded-md pl-10 pr-3 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#23D283] focus:ring-2 focus:ring-[#23D283]/20 transition-all"
                />
              </div>
              {errors.pin && (
                <p className="text-xs text-rose-600 font-medium text-left">{errors.pin.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 bg-[#23D283] hover:bg-[#11995E] text-white font-bold text-sm rounded-md transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.99] disabled:opacity-60"
              >
                {isSubmitting ? (
                  <span>Signing In...</span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Switcher */}
          <div className="text-center pt-2 border-t border-slate-100 text-xs text-slate-500">
            Don't have an account yet?{" "}
            <Link
              to="/register/type"
              className="font-bold text-[#0B6E4F] hover:underline"
            >
              Create an Account
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};


