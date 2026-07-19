import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { clientRegisterSchema } from "@/lib/validation";
import type { ClientRegisterInput } from "@/lib/validation";
import { loginSchema } from "@/lib/validation";
import type { LoginInput } from "@/lib/validation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  X,
  Lock,
  Timer,
  RotateCw,
  ArrowLeft,
  UserPlus,
  LogIn,
} from "lucide-react";
import {
  InputOTP,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
    <div className="flex flex-col items-center gap-6 pt-2 pb-1">
      {/* Lock icon */}
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-50 text-[#308178]">
        <Lock className="h-6 w-6" />
      </div>

      <div className="text-center space-y-1">
        <h3 className="text-xl font-extrabold text-slate-900">Verify Your Identity</h3>
        <p className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
          We sent a 6-digit passcode to{" "}
          <span className="font-bold text-slate-800">{email}</span>
        </p>
      </div>

      <div className="flex flex-col items-center gap-4 w-full">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
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
                className="h-12 w-10 rounded-lg border border-slate-200 bg-white text-lg font-extrabold text-slate-800 transition-all data-[active=true]:border-[#308178] data-[active=true]:ring-2 data-[active=true]:ring-[#308178]/10"
              />
            ))}
            <span className="text-slate-300 font-bold text-lg px-0.5">-</span>
            {[3, 4, 5].map((i) => (
              <InputOTPSlot
                key={i}
                index={i}
                className="h-12 w-10 rounded-lg border border-slate-200 bg-white text-lg font-extrabold text-slate-800 transition-all data-[active=true]:border-[#308178] data-[active=true]:ring-2 data-[active=true]:ring-[#308178]/10"
              />
            ))}
          </div>
        </InputOTP>

        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
          <Timer className="h-3.5 w-3.5 text-slate-400" />
          {countdown > 0 ? (
            <span>
              Resend in <strong className="text-slate-800">{countdown}s</strong>
            </span>
          ) : (
            <span className="text-emerald-600">You can request a new code.</span>
          )}
        </div>
      </div>

      <button
        type="button"
        disabled={loading || otp.length < 6}
        onClick={() => verify(otp)}
        className="w-full h-11 rounded-xl bg-[#308178] hover:bg-[#25645d] text-white font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Verifying..." : "Verify & Continue"}
      </button>

      <div className="flex w-full items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <button
          type="button"
          disabled={countdown > 0 || resending}
          onClick={handleResend}
          className="flex items-center gap-1.5 text-sm text-[#308178] hover:text-[#25645d] px-3 py-2 rounded-xl hover:bg-teal-50/50 transition-colors disabled:opacity-40"
        >
          <RotateCw className={`h-4 w-4 ${resending ? "animate-spin" : ""}`} />
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
    setValue,
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
    <div className="flex flex-col gap-5">
      <div className="text-center space-y-1">
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-teal-50 text-[#308178] mx-auto mb-2">
          <UserPlus className="h-5 w-5" />
        </div>
        <h3 className="text-xl font-extrabold text-slate-900">Create Client Account</h3>
        <p className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
          Start searching for properties right away.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name</label>
          <input
            id="rc-name"
            placeholder="Jane Doe"
            {...register("name")}
            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#308178]/20 focus:border-[#308178] transition-all bg-white placeholder-slate-400"
          />
          {errors.name && (
            <p className="mt-1 text-xs text-rose-600 font-medium">{errors.name.message}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
          <input
            id="rc-email"
            type="email"
            placeholder="jane@example.com"
            {...register("email")}
            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#308178]/20 focus:border-[#308178] transition-all bg-white placeholder-slate-400"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-rose-600 font-medium">{errors.email.message}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Phone Number</label>
          <input
            id="rc-phone"
            type="tel"
            placeholder="+1234567890"
            {...register("phone")}
            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#308178]/20 focus:border-[#308178] transition-all bg-white placeholder-slate-400"
          />
          {errors.phone && (
            <p className="mt-1 text-xs text-rose-600 font-medium">{errors.phone.message}</p>
          )}
        </div>

        {/* Preference Type */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Looking to Buy or Rent?
          </label>
          <Select onValueChange={(val: string) => setValue("preference_type", val)}>
            <SelectTrigger className="w-full border border-slate-200 rounded-xl text-sm font-medium text-slate-800 px-3.5 py-2.5 h-auto focus:ring-2 focus:ring-[#308178]/20 focus:border-[#308178]">
              <SelectValue placeholder="Select preference..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="buy">Buy Properties</SelectItem>
              <SelectItem value="rent">Rent Properties</SelectItem>
              <SelectItem value="both">Both</SelectItem>
            </SelectContent>
          </Select>
          {errors.preference_type && (
            <p className="mt-1 text-xs text-rose-600 font-medium">{errors.preference_type.message}</p>
          )}
        </div>

        {/* Location */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Target Location / City</label>
          <input
            id="rc-location"
            placeholder="e.g. London, UK"
            {...register("location")}
            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#308178]/20 focus:border-[#308178] transition-all bg-white placeholder-slate-400"
          />
          {errors.location && (
            <p className="mt-1 text-xs text-rose-600 font-medium">{errors.location.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11 rounded-xl bg-[#308178] hover:bg-[#25645d] text-white font-semibold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-1"
        >
          {isSubmitting ? "Sending OTP..." : "Register & Get OTP"}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500">
        Already registered?{" "}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-[#308178] font-bold hover:underline focus:outline-none"
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
    <div className="flex flex-col gap-5">
      <div className="text-center space-y-1">
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-teal-50 text-[#308178] mx-auto mb-2">
          <LogIn className="h-5 w-5" />
        </div>
        <h3 className="text-xl font-extrabold text-slate-900">Welcome Back</h3>
        <p className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
          Enter your email and we'll send you a one-time passcode.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
          <input
            id="login-email"
            type="email"
            placeholder="name@example.com"
            {...register("email")}
            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#308178]/20 focus:border-[#308178] transition-all bg-white placeholder-slate-400"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-rose-600 font-medium">{errors.email.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11 rounded-xl bg-[#308178] hover:bg-[#25645d] text-white font-semibold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-1"
        >
          {isSubmitting ? "Sending OTP..." : "Send OTP"}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500">
        New to Letsellr?{" "}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-[#308178] font-bold hover:underline focus:outline-none"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      {/* Backdrop click */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 z-10 animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-all z-10"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Accent bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#308178] via-[#3a9b91] to-[#25645d]" />

        {/* Content */}
        <div className="px-7 py-7">
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
