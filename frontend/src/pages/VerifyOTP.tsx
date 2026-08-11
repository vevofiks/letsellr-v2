import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  InputOTP,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils";
import { Lock, Timer, ArrowLeft, RotateCw } from "lucide-react";

export const VerifyOTP: React.FC = () => {
  const { verifyLogin, verifyRegistration, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const phone = location.state?.phone || location.state?.email;
  const purpose = location.state?.purpose; // "login" or "registration"

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [resending, setResending] = useState(false);

  // If state is missing, redirect back to login
  useEffect(() => {
    if (!phone || !purpose) {
      toast.error("Invalid session. Please start again.");
      navigate("/login");
    }
  }, [phone, purpose, navigate]);

  // Handle OTP countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const performVerification = async (code: string) => {
    if (loading) return;
    setLoading(true);
    try {
      if (purpose === "registration") {
        await verifyRegistration(phone, code);
      } else {
        await verifyLogin(phone, code);
      }
      toast.success("Authentication successful!");
    } catch (err: any) {
      console.error(err);
      toast.error(getErrorMessage(err, "Invalid code. Please try again."));
      setLoading(false);
    }
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) {
      toast.error("Please enter the complete 6-digit code.");
      return;
    }
    performVerification(otp);
  };

  // Redirect user based on role upon successful login/registration
  useEffect(() => {
    if (user) {
      if (user.role === "user") {
        navigate("/dashboard", { replace: true });
      } else if (user.role === "owner" || user.role === "agency") {
        navigate("/owner/dashboard", { replace: true });
      } else if (user.role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    }
  }, [user, navigate]);

  const handleResend = async () => {
    setResending(true);
    try {
      await api.post("/api/auth/resend-otp", {
        phone,
        purpose: purpose === "registration" ? "registration" : "login",
      });
      toast.success("A new code was sent to your WhatsApp!");
      setCountdown(60);
    } catch (err: any) {
      console.error(err);
      toast.error(getErrorMessage(err, "Failed to resend code."));
    } finally {
      setResending(false);
    }
  };

  if (!phone || !purpose) return null;

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-slate-50 font-sans text-slate-900 px-4 py-6 sm:py-10 overflow-y-auto">
      {/* Main Container */}
      <main className="w-full max-w-md mx-auto">
        <div className="bg-white border border-slate-200/80 shadow-md rounded-lg p-6 sm:p-8 space-y-5 text-center">
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-3 -mt-2! border-b border-slate-100">
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

          {/* Lock Icon */}
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#D9F7E9] text-[#0B6E4F]">
            <Lock className="h-5 w-5" />
          </div>

          {/* Header */}
          <div className="flex flex-col items-center justify-center space-y-1">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 -mt-4!">
              Verify Your Identity
            </h1>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed -mt-4!">
              We sent a WhatsApp verification passcode to <br />
              <span className="font-bold text-slate-800">{phone}</span>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="flex flex-col items-center gap-3">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Enter 6-digit Code
              </label>
              <InputOTP
                maxLength={6}
                value={otp}
                autoComplete="one-time-code"
                containerClassName="justify-center"
                onChange={(val) => {
                  setOtp(val);
                  if (val.length === 6) {
                    performVerification(val);
                  }
                }}
              >
                <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                  <InputOTPSlot index={0} className="h-11 w-9 sm:h-12 sm:w-10 rounded-md border border-slate-200 bg-white text-base sm:text-lg font-black text-slate-800 transition-all data-[active=true]:border-[#23D283] data-[active=true]:ring-2 data-[active=true]:ring-[#23D283]/20" />
                  <InputOTPSlot index={1} className="h-11 w-9 sm:h-12 sm:w-10 rounded-md border border-slate-200 bg-white text-base sm:text-lg font-black text-slate-800 transition-all data-[active=true]:border-[#23D283] data-[active=true]:ring-2 data-[active=true]:ring-[#23D283]/20" />
                  <InputOTPSlot index={2} className="h-11 w-9 sm:h-12 sm:w-10 rounded-md border border-slate-200 bg-white text-base sm:text-lg font-black text-slate-800 transition-all data-[active=true]:border-[#23D283] data-[active=true]:ring-2 data-[active=true]:ring-[#23D283]/20" />
                  <span className="text-slate-300 font-bold text-lg px-0.5">-</span>
                  <InputOTPSlot index={3} className="h-11 w-9 sm:h-12 sm:w-10 rounded-md border border-slate-200 bg-white text-base sm:text-lg font-black text-slate-800 transition-all data-[active=true]:border-[#23D283] data-[active=true]:ring-2 data-[active=true]:ring-[#23D283]/20" />
                  <InputOTPSlot index={4} className="h-11 w-9 sm:h-12 sm:w-10 rounded-md border border-slate-200 bg-white text-base sm:text-lg font-black text-slate-800 transition-all data-[active=true]:border-[#23D283] data-[active=true]:ring-2 data-[active=true]:ring-[#23D283]/20" />
                  <InputOTPSlot index={5} className="h-11 w-9 sm:h-12 sm:w-10 rounded-md border border-slate-200 bg-white text-base sm:text-lg font-black text-slate-800 transition-all data-[active=true]:border-[#23D283] data-[active=true]:ring-2 data-[active=true]:ring-[#23D283]/20" />
                </div>
              </InputOTP>

              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium bg-slate-50 px-3.5 py-1.5 rounded-full border border-slate-100">
                <Timer className="h-3.5 w-3.5 text-slate-400" />
                {countdown > 0 ? (
                  <span>Resend code in <strong className="text-slate-800 font-bold">{countdown}s</strong></span>
                ) : (
                  <span className="text-[#0B6E4F] font-bold">You can request a new code.</span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-1">
              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full h-11 bg-[#23D283] hover:bg-[#11995E] text-white font-bold text-sm rounded-md transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? "Verifying..." : "Verify & Continue"}
              </button>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-semibold px-2 py-1 rounded transition-colors cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back
                </button>

                <button
                  type="button"
                  disabled={countdown > 0 || resending}
                  onClick={handleResend}
                  className="flex items-center gap-1.5 text-[#0B6E4F] hover:underline font-semibold disabled:opacity-40 disabled:no-underline cursor-pointer"
                >
                  <RotateCw className={`h-3.5 w-3.5 ${resending ? "animate-spin" : ""}`} />
                  Resend Code
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};


