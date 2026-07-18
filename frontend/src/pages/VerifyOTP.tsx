import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Lock, Timer, ArrowLeft, RotateCw } from "lucide-react";

export const VerifyOTP: React.FC = () => {
  const { verifyLogin, verifyRegistration, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state?.email;
  const purpose = location.state?.purpose; // "login" or "registration"

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [resending, setResending] = useState(false);

  // If state is missing, redirect back to login
  useEffect(() => {
    if (!email || !purpose) {
      toast.error("Invalid session. Please start again.");
      navigate("/login");
    }
  }, [email, purpose, navigate]);

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
        await verifyRegistration(email, code);
      } else {
        await verifyLogin(email, code);
      }
      toast.success("Authentication successful!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Invalid code. Please try again.");
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
        email,
        purpose: purpose === "registration" ? "registration" : "login",
      });
      toast.success("A new code was sent to your email!");
      setCountdown(60);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to resend code.");
    } finally {
      setResending(false);
    }
  };

  if (!email || !purpose) return null;

  return (
    <div className="relative flex min-h-screen sm:h-screen flex-col items-center justify-center p-4 sm:p-6 bg-white font-sans text-black">
      {/* Outer Card Wrapper (responsive padding, subtle border, shadow-sm, increased width) */}
      <Card className="w-full max-w-xl border border-slate-200 bg-white shadow-sm p-5 sm:p-8 rounded-xl flex flex-col justify-center text-center">
        {/* Lock Icon Header */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal-50 text-[#308178] mb-4">
          <Lock className="h-6 w-6" />
        </div>

        {/* Content Header */}
        <div className="space-y-2 mb-6 text-center w-full flex flex-col items-center justify-center">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 text-center w-full">
            Verify Your Identity
          </h1>
          <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed text-center w-full">
            We sent a verification passcode to <br />
            <span className="font-bold text-slate-800">{email}</span>
          </p>
        </div>

        {/* Form Container */}
        <form onSubmit={handleVerify} className="space-y-6">
          <div className="flex flex-col items-center justify-center space-y-6 w-full">
            <div className="flex flex-col items-center justify-center w-full">
              <label className="mb-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">
                Enter 6-digit Code
              </label>
              <InputOTP
                maxLength={6}
                value={otp}
                containerClassName="justify-center"
                onChange={(val) => {
                  setOtp(val);
                  if (val.length === 6) {
                    performVerification(val);
                  }
                }}
              >
                <div className="flex items-center justify-center gap-1.5 sm:gap-2.5 w-full">
                  <InputOTPSlot index={0} className="h-12 w-10 sm:h-14 sm:w-12 rounded-lg border border-slate-200 bg-white text-lg sm:text-xl font-extrabold text-slate-800 transition-all data-[active=true]:border-[#308178] data-[active=true]:ring-2 data-[active=true]:ring-[#308178]/10" />
                  <InputOTPSlot index={1} className="h-12 w-10 sm:h-14 sm:w-12 rounded-lg border border-slate-200 bg-white text-lg sm:text-xl font-extrabold text-slate-800 transition-all data-[active=true]:border-[#308178] data-[active=true]:ring-2 data-[active=true]:ring-[#308178]/10" />
                  <InputOTPSlot index={2} className="h-12 w-10 sm:h-14 sm:w-12 rounded-lg border border-slate-200 bg-white text-lg sm:text-xl font-extrabold text-slate-800 transition-all data-[active=true]:border-[#308178] data-[active=true]:ring-2 data-[active=true]:ring-[#308178]/10" />
                  <span className="text-slate-300 font-bold text-lg px-0.5">-</span>
                  <InputOTPSlot index={3} className="h-12 w-10 sm:h-14 sm:w-12 rounded-lg border border-slate-200 bg-white text-lg sm:text-xl font-extrabold text-slate-800 transition-all data-[active=true]:border-[#308178] data-[active=true]:ring-2 data-[active=true]:ring-[#308178]/10" />
                  <InputOTPSlot index={4} className="h-12 w-10 sm:h-14 sm:w-12 rounded-lg border border-slate-200 bg-white text-lg sm:text-xl font-extrabold text-slate-800 transition-all data-[active=true]:border-[#308178] data-[active=true]:ring-2 data-[active=true]:ring-[#308178]/10" />
                  <InputOTPSlot index={5} className="h-12 w-10 sm:h-14 sm:w-12 rounded-lg border border-slate-200 bg-white text-lg sm:text-xl font-extrabold text-slate-800 transition-all data-[active=true]:border-[#308178] data-[active=true]:ring-2 data-[active=true]:ring-[#308178]/10" />
                </div>
              </InputOTP>
            </div>
 
            <div className="flex items-center gap-2 text-sm text-slate-500 font-medium bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
              <Timer className="h-4 w-4 text-slate-400" />
              {countdown > 0 ? (
                <span>Resend code in <strong className="text-slate-800 font-bold">{countdown}s</strong></span>
              ) : (
                <span className="text-emerald-600">You can request a new code.</span>
              )}
            </div>
          </div>
 
          {/* Form Actions */}
          <div className="space-y-4 pt-2">
            <Button
              type="submit"
              disabled={loading || otp.length < 6}
              className="w-full h-11 rounded-xl bg-[#308178] hover:bg-[#25645d] text-white font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? "Verifying..." : "Verify & Continue"}
            </Button>
 
            <div className="flex w-full items-center justify-between text-sm">
              <Button
                variant="ghost"
                type="button"
                onClick={() => navigate(-1)}
                className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-50 h-10 px-4 rounded-xl transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
 
              <Button
                variant="ghost"
                type="button"
                disabled={countdown > 0 || resending}
                onClick={handleResend}
                className="flex items-center gap-1.5 text-[#308178] hover:text-[#25645d] hover:bg-teal-50/50 h-10 px-4 rounded-xl transition-colors disabled:opacity-40"
              >
                <RotateCw className={`h-4 w-4 ${resending ? "animate-spin" : ""}`} />
                Resend Code
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
};
