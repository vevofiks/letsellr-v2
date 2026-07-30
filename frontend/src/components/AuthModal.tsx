import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { clientRegisterSchema, loginSchema } from "@/lib/validation";
import type { ClientRegisterInput, LoginInput } from "@/lib/validation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  X,
  Lock,
  Timer,
  RotateCw,
  ArrowLeft,
  UserPlus,
  LogIn,
  ArrowRight,
} from "lucide-react";
import {
  InputOTP,
  InputOTPSlot,
} from "@/components/ui/input-otp";

export type AuthModalMode = "register-client" | "login";

interface AuthModalProps {
  initialMode: AuthModalMode;
  onClose: () => void;
}

// ── OTP Step (shared) ────────────────────────────────────────────────────────
const OTPStep: React.FC<{
  email: string;
  purpose: "registration" | "login";
  onSuccess: () => void;
  onBack: () => void;
}> = ({ email, purpose, onSuccess, onBack }) => {
  const { verifyLogin, verifyRegistration, user } = useAuth();
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // Redirect after user state is populated (registration flow sets user in context)
  useEffect(() => {
    if (user) {
      if (user.role === "user") navigate("/dashboard", { replace: true });
      else if (user.role === "owner" || user.role === "agency")
        navigate("/owner/dashboard", { replace: true });
      else if (user.role === "admin") navigate("/admin", { replace: true });
    }
  }, [user, navigate]);

  const verify = async (code: string) => {
    if (loading) return;
    setLoading(true);
    try {
      if (purpose === "registration") {
        await verifyRegistration(email, code);
      } else {
        await verifyLogin(email, code);
      }
      toast.success("Authentication successful!");
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Invalid code. Please try again.");
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await api.post("/api/auth/resend-otp", {
        email,
        purpose: purpose === "registration" ? "registration" : "login",
      });
      toast.success("New code sent!");
      setCountdown(60);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to resend code.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-5 text-center">
      {/* Lock icon */}
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#D9F7E9] text-[#0B6E4F]">
        <Lock className="h-5 w-5" />
      </div>

      <div className="space-y-1">
        <h3 className="text-xl font-extrabold text-slate-900 m-0">Verify Your Identity</h3>
        <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
          We sent a 6-digit passcode to{" "}
          <span className="font-bold text-slate-800">{email}</span>
        </p>
      </div>

      <div className="flex flex-col items-center gap-3 w-full">
        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Enter 6-digit Code
        </label>
        <InputOTP
          maxLength={6}
          value={otp}
          containerClassName="justify-center"
          onChange={(val) => {
            setOtp(val);
            if (val.length === 6) verify(val);
          }}
        >
          <div className="flex items-center justify-center gap-1.5 w-full">
            {[0, 1, 2].map((i) => (
              <InputOTPSlot
                key={i}
                index={i}
                className="h-11 w-9 rounded-md border border-slate-200 bg-white text-base font-black text-slate-800 transition-all data-[active=true]:border-[#23D283] data-[active=true]:ring-2 data-[active=true]:ring-[#23D283]/20"
              />
            ))}
            <span className="text-slate-300 font-bold text-base px-0.5">-</span>
            {[3, 4, 5].map((i) => (
              <InputOTPSlot
                key={i}
                index={i}
                className="h-11 w-9 rounded-md border border-slate-200 bg-white text-base font-black text-slate-800 transition-all data-[active=true]:border-[#23D283] data-[active=true]:ring-2 data-[active=true]:ring-[#23D283]/20"
              />
            ))}
          </div>
        </InputOTP>

        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
          <Timer className="h-3.5 w-3.5 text-slate-400" />
          {countdown > 0 ? (
            <span>
              Resend in <strong className="text-slate-800">{countdown}s</strong>
            </span>
          ) : (
            <span className="text-[#0B6E4F] font-bold">You can request a new code.</span>
          )}
        </div>
      </div>

      <button
        type="button"
        disabled={loading || otp.length < 6}
        onClick={() => verify(otp)}
        className="w-full h-10 rounded-md bg-[#23D283] hover:bg-[#11995E] text-white font-bold text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border-0"
      >
        {loading ? "Verifying..." : "Verify & Continue"}
      </button>

      <div className="flex w-full items-center justify-between text-xs pt-1 border-t border-slate-100">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>
        <button
          type="button"
          disabled={countdown > 0 || resending}
          onClick={handleResend}
          className="flex items-center gap-1 text-[#0B6E4F] hover:underline font-semibold disabled:opacity-40 cursor-pointer"
        >
          <RotateCw className={`h-3.5 w-3.5 ${resending ? "animate-spin" : ""}`} />
          Resend Code
        </button>
      </div>
    </div>
  );
};

// ── Register Client Step ─────────────────────────────────────────────────────
const RegisterClientStep: React.FC<{
  onSent: (email: string) => void;
  onSwitchToLogin: () => void;
}> = ({ onSent, onSwitchToLogin }) => {
  const { registerClient } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ClientRegisterInput>({
    resolver: zodResolver(clientRegisterSchema),
    mode: "onChange",
  });

  const onSubmit = async (data: ClientRegisterInput) => {
    try {
      await registerClient(data);
      toast.success("OTP sent to your email!");
      onSent(data.email);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Registration failed. Please try again.");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center justify-center text-center space-y-1">
        <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-[#D9F7E9] text-[#0B6E4F] mb-1">
          <UserPlus className="h-5 w-5" />
        </div>
        <h3 className="text-xl font-extrabold text-slate-900 m-0">Create Seeker Account</h3>
        <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
          Start searching for properties right away.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 text-left">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Name */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">Full Name</label>
            <input
              id="rc-name"
              placeholder="Jane Doe"
              {...register("name")}
              className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#23D283] focus:ring-2 focus:ring-[#23D283]/20 transition-all"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-rose-600 font-medium">{errors.name.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">Email Address</label>
            <input
              id="rc-email"
              type="email"
              placeholder="jane@example.com"
              {...register("email")}
              className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#23D283] focus:ring-2 focus:ring-[#23D283]/20 transition-all"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-rose-600 font-medium">{errors.email.message}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">Phone Number</label>
            <input
              id="rc-phone"
              type="tel"
              placeholder="+1234567890"
              {...register("phone")}
              className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#23D283] focus:ring-2 focus:ring-[#23D283]/20 transition-all"
            />
            {errors.phone && (
              <p className="mt-1 text-xs text-rose-600 font-medium">{errors.phone.message}</p>
            )}
          </div>

          {/* Preference Type */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Looking to Buy or Rent?
            </label>
            <select
              id="rc-preference"
              {...register("preference_type")}
              className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#23D283] focus:ring-2 focus:ring-[#23D283]/20 transition-all"
            >
              <option value="">Select preference...</option>
              <option value="buy">Buy Properties</option>
              <option value="rent">Rent Properties</option>
              <option value="both">Both</option>
            </select>
            {errors.preference_type && (
              <p className="mt-1 text-xs text-rose-600 font-medium">{errors.preference_type.message}</p>
            )}
          </div>

          {/* Location */}
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">Target Location / City</label>
            <input
              id="rc-location"
              placeholder="e.g. London, UK"
              {...register("location")}
              className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#23D283] focus:ring-2 focus:ring-[#23D283]/20 transition-all"
            />
            {errors.location && (
              <p className="mt-1 text-xs text-rose-600 font-medium">{errors.location.message}</p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-10 rounded-md bg-[#23D283] hover:bg-[#11995E] text-white font-bold text-xs transition-colors disabled:opacity-60 cursor-pointer mt-1 flex items-center justify-center gap-1.5"
        >
          {isSubmitting ? "Submitting..." : "Submit Registration"}
        </button>
      </form>

      <p className="text-center text-xs text-slate-500 pt-1 border-t border-slate-100">
        Already registered?{" "}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-[#0B6E4F] font-bold hover:underline cursor-pointer"
        >
          Sign In
        </button>
      </p>
    </div>
  );
};

// ── Login Step ───────────────────────────────────────────────────────────────
const LoginStep: React.FC<{
  onOTPRequired: (email: string) => void;
  onSwitchToRegister: () => void;
}> = ({ onOTPRequired, onSwitchToRegister }) => {
  const { login } = useAuth();

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
      await login(data.email);
      toast.success("OTP sent to your email!");
      onOTPRequired(data.email);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "No account found. Please register first.");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center justify-center text-center space-y-1">
        <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-[#D9F7E9] text-[#0B6E4F] mb-1">
          <LogIn className="h-5 w-5" />
        </div>
        <h3 className="text-xl font-extrabold text-slate-900 m-0 text-center">Welcome Back</h3>
        <p className="text-xs text-slate-500 max-w-xs mx-auto text-center leading-relaxed">
          Enter your email and we'll send you a one-time passcode.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 text-left">
        {/* Email */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">Email Address</label>
          <input
            id="login-email"
            type="email"
            placeholder="name@example.com"
            {...register("email")}
            className="w-full bg-white border border-slate-200 rounded-md px-3 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#23D283] focus:ring-2 focus:ring-[#23D283]/20 transition-all"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-rose-600 font-medium">{errors.email.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-10 rounded-md bg-[#23D283] hover:bg-[#11995E] text-white font-bold text-xs transition-colors disabled:opacity-60 cursor-pointer mt-1 flex items-center justify-center gap-1.5"
        >
          {isSubmitting ? "Sending OTP..." : "Send Passcode"}
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </form>

      <p className="text-center text-xs text-slate-500 pt-1 border-t border-slate-100">
        New to Letsellr?{" "}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-[#0B6E4F] font-bold hover:underline cursor-pointer"
        >
          Create an Account
        </button>
      </p>
    </div>
  );
};

// ── Main Modal ───────────────────────────────────────────────────────────────
export const AuthModal: React.FC<AuthModalProps> = ({ initialMode, onClose }) => {
  type Step =
    | { type: "register-client" }
    | { type: "login" }
    | { type: "otp"; email: string; purpose: "registration" | "login" };

  const [step, setStep] = useState<Step>(
    initialMode === "login" ? { type: "login" } : { type: "register-client" }
  );

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      {/* Backdrop click */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal */}
      <div
        className={cn(
          "relative w-full bg-white rounded-lg shadow-xl border border-slate-200 z-10 animate-in zoom-in-95 duration-150 overflow-hidden transition-all",
          step.type === "register-client" ? "max-w-lg" : "max-w-sm"
        )}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-all z-10 cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Content */}
        <div className="p-6">
          {step.type === "register-client" && (
            <RegisterClientStep
              onSent={(email) =>
                setStep({ type: "otp", email, purpose: "registration" })
              }
              onSwitchToLogin={() => setStep({ type: "login" })}
            />
          )}
          {step.type === "login" && (
            <LoginStep
              onOTPRequired={(email) =>
                setStep({ type: "otp", email, purpose: "login" })
              }
              onSwitchToRegister={() => setStep({ type: "register-client" })}
            />
          )}
          {step.type === "otp" && (
            <OTPStep
              email={step.email}
              purpose={step.purpose}
              onSuccess={onClose}
              onBack={() =>
                setStep(
                  step.purpose === "registration"
                    ? { type: "register-client" }
                    : { type: "login" }
                )
              }
            />
          )}
        </div>
      </div>
    </div>
  );
};

